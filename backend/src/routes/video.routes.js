const express = require('express');
const router = express.Router();
const videoService = require('../services/video.service');
const { authenticateToken } = require('../middleware/auth');

// Get signed URL for upload
router.post('/upload-url', authenticateToken, async (req, res) => {
    try {
        const { fileName, fileType } = req.body;
        
        if (!fileName || !fileType) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }

        if (!fileType.startsWith('video/')) {
            return res.status(400).json({ 
                error: 'Invalid file type. Only videos are allowed.' 
            });
        }

        const uploadData = await videoService.getSignedUploadUrl(fileName, fileType);
        res.json(uploadData);
    } catch (error) {
        console.error('Error getting upload URL:', error);
        res.status(500).json({ 
            error: 'Failed to generate upload URL' 
        });
    }
});

// List all videos
router.get('/list', authenticateToken, async (req, res) => {
    try {
        const videos = await videoService.listVideos();
        res.json(videos);
    } catch (error) {
        console.error('Error listing videos:', error);
        res.status(500).json({ 
            error: 'Failed to list videos' 
        });
    }
});

// Delete video
router.delete('/:fileName', authenticateToken, async (req, res) => {
    try {
        const { fileName } = req.params;
        await videoService.deleteVideo(fileName);
        res.json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ 
            error: 'Failed to delete video' 
        });
    }
});

module.exports = router;
