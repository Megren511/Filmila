const express = require('express');
const router = express.Router();
const {
  trackEvent,
  getVideoAnalytics,
  getRetentionData,
  getQualityAnalytics,
  getDailyReport
} = require('../controllers/analytics.controller');

// Track viewing events
router.post('/:videoId/events', trackEvent);

// Get video analytics with date range
router.get('/:videoId/analytics', getVideoAnalytics);

// Get viewer retention data
router.get('/:videoId/retention', getRetentionData);

// Get quality selection data
router.get('/:videoId/quality', getQualityAnalytics);

// Get daily analytics report
router.get('/:videoId/daily-report', getDailyReport);

module.exports = router;
