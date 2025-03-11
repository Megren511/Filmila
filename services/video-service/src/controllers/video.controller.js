const { s3, cloudfront, bucketName, cloudfrontDomain } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const VideoProcessor = require('../utils/videoProcessor');

// Upload video to S3 and create CloudFront distribution
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoId = uuidv4();
    const key = `videos/${req.user.id}/${videoId}`;
    
    // Upload to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        'filmmaker-id': req.user.id,
        'original-name': req.file.originalname
      }
    };

    await s3.upload(uploadParams).promise();

    // Initialize video processing
    const processor = new VideoProcessor(req.user.id, videoId);
    
    // Start transcoding job
    const transcodingJob = await processor.createTranscodingJob();
    
    // Generate thumbnails
    const thumbnailJob = await processor.generateThumbnails();

    // Generate CloudFront URL for the master playlist
    const streamingUrls = processor.getStreamingUrls();
    const masterPlaylistUrl = `https://${cloudfrontDomain}/${streamingUrls.playlist}`;

    res.status(201).json({
      videoId,
      status: {
        transcoding: transcodingJob.status,
        thumbnails: thumbnailJob.status
      },
      streamingUrl: masterPlaylistUrl,
      message: 'Video uploaded and processing started'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading video' });
  }
};

// Stream video through CloudFront with adaptive bitrate
const getVideoStream = async (req, res) => {
  try {
    const { videoId } = req.params;
    const processor = new VideoProcessor(req.user.id, videoId);

    // Get streaming URLs for all qualities
    const streamingUrls = processor.getStreamingUrls();

    // Generate signed URLs for secure access
    const signedUrls = {
      playlist: cloudfront.getSignedUrl('getObject', {
        url: `https://${cloudfrontDomain}/${streamingUrls.playlist}`,
        expires: Math.floor(Date.now() / 1000) + (60 * 60) // URL expires in 1 hour
      }),
      qualities: {}
    };

    // Generate signed URLs for each quality
    Object.entries(streamingUrls.qualities).forEach(([quality, path]) => {
      signedUrls.qualities[quality] = cloudfront.getSignedUrl('getObject', {
        url: `https://${cloudfrontDomain}/${path}`,
        expires: Math.floor(Date.now() / 1000) + (60 * 60)
      });
    });

    res.json({ 
      streamUrls: signedUrls,
      message: 'Use the playlist URL for adaptive streaming'
    });
  } catch (error) {
    console.error('Streaming error:', error);
    res.status(500).json({ error: 'Error getting video stream' });
  }
};

// Get video information including processing status
const getVideoInfo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const processor = new VideoProcessor(req.user.id, videoId);

    // Get video metadata
    const metadata = await processor.getVideoMetadata();

    // Get streaming URLs
    const streamingUrls = processor.getStreamingUrls();

    res.json({
      videoId,
      contentType: metadata.contentType,
      size: metadata.contentLength,
      metadata: metadata.metadata,
      availableQualities: Object.keys(streamingUrls.qualities),
      streamingUrl: `https://${cloudfrontDomain}/${streamingUrls.playlist}`
    });
  } catch (error) {
    if (error.code === 'NotFound') {
      return res.status(404).json({ error: 'Video not found' });
    }
    console.error('Error getting video info:', error);
    res.status(500).json({ error: 'Error retrieving video information' });
  }
};

// Check video processing status
const getProcessingStatus = async (req, res) => {
  try {
    const { videoId, jobId } = req.params;
    const processor = new VideoProcessor(req.user.id, videoId);

    const status = await processor.checkJobStatus(jobId);
    res.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Error checking processing status' });
  }
};

// Delete video (filmmaker or admin only)
const deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const processor = new VideoProcessor(req.user.id, videoId);

    // Check if user is filmmaker or admin
    if (req.user.role !== 'filmmaker' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete videos' });
    }

    // Delete original video
    await s3.deleteObject({
      Bucket: bucketName,
      Key: `videos/${req.user.id}/${videoId}`
    }).promise();

    // Delete processed videos and thumbnails
    const processedPrefix = `processed/${req.user.id}/${videoId}`;
    const listParams = {
      Bucket: bucketName,
      Prefix: processedPrefix
    };

    const objects = await s3.listObjectsV2(listParams).promise();
    if (objects.Contents.length > 0) {
      await s3.deleteObjects({
        Bucket: bucketName,
        Delete: {
          Objects: objects.Contents.map(({ Key }) => ({ Key }))
        }
      }).promise();
    }

    res.json({ message: 'Video and all associated files deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Error deleting video' });
  }
};

module.exports = {
  uploadVideo,
  getVideoStream,
  getVideoInfo,
  getProcessingStatus,
  deleteVideo
};
