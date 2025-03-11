const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  uploadVideo,
  getVideoStream,
  getVideoInfo,
  getProcessingStatus,
  deleteVideo
} = require('../controllers/video.controller');

// Configure multer for video upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common video formats
    const allowedMimes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed formats: MP4, WebM, MOV, AVI'));
    }
  }
});

// Upload video route
router.post('/upload', upload.single('video'), uploadVideo);

// Get video stream with adaptive bitrate
router.get('/stream/:videoId', getVideoStream);

// Get video information and available qualities
router.get('/:videoId', getVideoInfo);

// Check processing status
router.get('/:videoId/status/:jobId', getProcessingStatus);

// Delete video and all processed versions
router.delete('/:videoId', deleteVideo);

module.exports = router;
