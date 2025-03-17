const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      environment: process.env.NODE_ENV
    });
  }
});

module.exports = router;
