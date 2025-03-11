const express = require('express');
const router = express.Router();
const {
  getOverviewStats,
  getTrendingVideos,
  getRealTimeViewers,
  getEngagementTimeline,
  getViewerDemographics,
  invalidateCache,
  getCacheMetrics
} = require('../controllers/dashboard.controller');

// Overview statistics for filmmaker dashboard
router.get('/overview', getOverviewStats);

// Get trending videos
router.get('/trending', getTrendingVideos);

// Real-time viewer count for a specific video
router.get('/videos/:videoId/realtime', getRealTimeViewers);

// Engagement timeline for a specific video
router.get('/videos/:videoId/timeline', getEngagementTimeline);

// Viewer demographics for a specific video
router.get('/videos/:videoId/demographics', getViewerDemographics);

// Cache management (admin only)
router.post('/cache/invalidate', invalidateCache);
router.get('/cache/metrics', getCacheMetrics);

module.exports = router;
