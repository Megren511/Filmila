const { elasticTranscoder, PRESETS, pipelineId } = require('../config/transcoder');
const { s3, bucketName } = require('../config/aws');

class VideoProcessor {
  constructor(userId, videoId) {
    this.userId = userId;
    this.videoId = videoId;
    this.inputKey = `videos/${userId}/${videoId}`;
    this.outputKeyPrefix = `processed/${userId}/${videoId}/`;
  }

  async createTranscodingJob() {
    const params = {
      PipelineId: pipelineId,
      Input: {
        Key: this.inputKey,
        Container: 'auto'
      },
      OutputKeyPrefix: this.outputKeyPrefix,
      Outputs: [
        {
          Key: '1080p/video',
          PresetId: PRESETS.HLS['1080p'],
          SegmentDuration: '10'
        },
        {
          Key: '720p/video',
          PresetId: PRESETS.HLS['720p'],
          SegmentDuration: '10'
        },
        {
          Key: '480p/video',
          PresetId: PRESETS.HLS['480p'],
          SegmentDuration: '10'
        }
      ],
      Playlists: [
        {
          Name: 'playlist',
          Format: 'HLSv3',
          OutputKeys: [
            '1080p/video',
            '720p/video',
            '480p/video'
          ]
        }
      ],
      // Generate thumbnails
      ThumbnailPattern: 'thumbnails/thumb-{count}'
    };

    try {
      const job = await elasticTranscoder.createJob(params).promise();
      return {
        jobId: job.Job.Id,
        status: job.Job.Status
      };
    } catch (error) {
      console.error('Transcoding job creation error:', error);
      throw new Error('Failed to create transcoding job');
    }
  }

  async checkJobStatus(jobId) {
    try {
      const { Job } = await elasticTranscoder.readJob({ Id: jobId }).promise();
      return {
        status: Job.Status,
        progress: Job.Status === 'Complete' ? 100 : 0, // Basic progress tracking
        outputs: Job.Outputs
      };
    } catch (error) {
      console.error('Job status check error:', error);
      throw new Error('Failed to check job status');
    }
  }

  async generateThumbnails() {
    const params = {
      PipelineId: pipelineId,
      Input: {
        Key: this.inputKey,
        FrameRate: 'auto',
        Resolution: 'auto',
        AspectRatio: 'auto',
        Container: 'auto'
      },
      OutputKeyPrefix: `${this.outputKeyPrefix}thumbnails/`,
      Output: {
        Key: 'thumbnail-{count}',
        PresetId: PRESETS.THUMBNAIL,
        ThumbnailPattern: 'thumb-{count}'
      }
    };

    try {
      const job = await elasticTranscoder.createJob(params).promise();
      return {
        jobId: job.Job.Id,
        status: job.Job.Status
      };
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      throw new Error('Failed to generate thumbnails');
    }
  }

  async getVideoMetadata() {
    try {
      const headObject = await s3.headObject({
        Bucket: bucketName,
        Key: this.inputKey
      }).promise();

      return {
        contentType: headObject.ContentType,
        contentLength: headObject.ContentLength,
        metadata: headObject.Metadata
      };
    } catch (error) {
      console.error('Metadata retrieval error:', error);
      throw new Error('Failed to get video metadata');
    }
  }

  getStreamingUrls() {
    return {
      playlist: `${this.outputKeyPrefix}playlist.m3u8`,
      qualities: {
        '1080p': `${this.outputKeyPrefix}1080p/video.m3u8`,
        '720p': `${this.outputKeyPrefix}720p/video.m3u8`,
        '480p': `${this.outputKeyPrefix}480p/video.m3u8`
      }
    };
  }
}

module.exports = VideoProcessor;
