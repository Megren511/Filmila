const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const { db } = require('../db');

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const cloudfront = new AWS.CloudFront();

// Get signed URL for video upload
router.post('/upload-url', async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    const key = `uploads/${req.user.id}/${Date.now()}-${filename}`;
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
      Expires: 3600 // URL expires in 1 hour
    };

    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    
    res.json({
      uploadUrl,
      key,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ message: 'Error generating upload URL' });
  }
});

// Save video metadata after successful upload
router.post('/metadata', async (req, res) => {
  try {
    const { title, description, s3Key } = req.body;
    
    const { rows } = await db.query(
      'INSERT INTO videos (user_id, title, description, s3_key) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, description, s3Key]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Error saving video metadata:', error);
    res.status(500).json({ message: 'Error saving video metadata' });
  }
});

// Get user's videos
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM videos WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    // Generate CloudFront URLs for each video
    const videos = rows.map(video => ({
      ...video,
      url: `https://${process.env.CLOUDFRONT_DOMAIN}/${video.s3_key}`
    }));

    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
});

// Get video by ID
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM videos WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const video = {
      ...rows[0],
      url: `https://${process.env.CLOUDFRONT_DOMAIN}/${rows[0].s3_key}`
    };

    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ message: 'Error fetching video' });
  }
});

module.exports = router;
