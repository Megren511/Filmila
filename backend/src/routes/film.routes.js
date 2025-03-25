const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const { db } = require('../db');

const router = express.Router();

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  }
});

// Upload film with poster
router.post('/upload', authMiddleware, upload.fields([
  { name: 'film', maxCount: 1 },
  { name: 'poster', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, genre, price, tags } = req.body;
    const filmerId = req.user.id;

    // Upload poster to S3
    const posterKey = `posters/${uuidv4()}-${req.files.poster[0].originalname}`;
    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: posterKey,
      Body: req.files.poster[0].buffer,
      ContentType: req.files.poster[0].mimetype,
      ACL: 'public-read'
    }).promise();

    // Upload film to S3
    const filmKey = `films/${uuidv4()}-${req.files.film[0].originalname}`;
    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filmKey,
      Body: req.files.film[0].buffer,
      ContentType: req.files.film[0].mimetype,
      ACL: 'private'
    }).promise();

    // Save film details to database
    const result = await db.query(
      `INSERT INTO films (
        title, description, genre, price, tags,
        poster_url, film_url, filmer_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        title,
        description,
        genre,
        price,
        tags ? JSON.stringify(tags) : '[]',
        `${process.env.AWS_CLOUDFRONT_URL}/${posterKey}`,
        filmKey,
        filmerId,
        'pending' // All uploads need admin approval
      ]
    );

    res.json({
      message: 'Film uploaded successfully and pending approval',
      filmId: result.rows[0].id
    });
  } catch (error) {
    console.error('Film upload error:', error);
    res.status(500).json({ message: 'Failed to upload film' });
  }
});

// Get filmmaker's films
router.get('/my-films', authMiddleware, async (req, res) => {
  try {
    const films = await db.query(
      `SELECT 
        f.id, f.title, f.description, f.genre,
        f.price, f.poster_url, f.status,
        f.created_at, f.updated_at,
        COUNT(v.id) as views,
        COALESCE(SUM(v.price), 0) as earnings
      FROM films f
      LEFT JOIN views v ON f.id = v.film_id
      WHERE f.filmer_id = $1
      GROUP BY f.id
      ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    res.json(films.rows);
  } catch (error) {
    console.error('Error fetching films:', error);
    res.status(500).json({ message: 'Failed to fetch films' });
  }
});

// Get filmmaker stats
router.get('/filmmaker/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT 
        COUNT(DISTINCT v.id) as total_views,
        COALESCE(SUM(v.price), 0) as total_earnings,
        COUNT(DISTINCT v.viewer_id) as active_subscribers
      FROM films f
      LEFT JOIN views v ON f.id = v.film_id
      WHERE f.filmer_id = $1`,
      [req.user.id]
    );

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Update film details
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, genre, price, tags } = req.body;
    const filmId = req.params.id;

    const result = await db.query(
      `UPDATE films 
      SET title = $1, description = $2, genre = $3, 
          price = $4, tags = $5, updated_at = NOW()
      WHERE id = $6 AND filmer_id = $7
      RETURNING *`,
      [title, description, genre, price, JSON.stringify(tags), filmId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Film not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating film:', error);
    res.status(500).json({ message: 'Failed to update film' });
  }
});

// Delete film
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const filmId = req.params.id;

    // Get film details
    const film = await db.query(
      'SELECT * FROM films WHERE id = $1 AND filmer_id = $2',
      [filmId, req.user.id]
    );

    if (film.rows.length === 0) {
      return res.status(404).json({ message: 'Film not found or unauthorized' });
    }

    // Delete from S3
    await s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: film.rows[0].film_url
    }).promise();

    // Delete poster if it's in S3
    const posterKey = film.rows[0].poster_url.replace(process.env.AWS_CLOUDFRONT_URL + '/', '');
    await s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: posterKey
    }).promise();

    // Delete from database
    await db.query('DELETE FROM films WHERE id = $1', [filmId]);

    res.json({ message: 'Film deleted successfully' });
  } catch (error) {
    console.error('Error deleting film:', error);
    res.status(500).json({ message: 'Failed to delete film' });
  }
});

module.exports = router;
