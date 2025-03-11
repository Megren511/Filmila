const AnalyticsTracker = require('../utils/analyticsTracker');
const tracker = new AnalyticsTracker();

// Track video viewing events
const trackEvent = async (req, res) => {
  try {
    const { videoId } = req.params;
    const eventData = {
      ...req.body,
      videoId,
      userId: req.user.id,
      timestamp: new Date()
    };

    const result = await tracker.trackViewEvent(eventData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
};

// Get video analytics for a specific period
const getVideoAnalytics = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate user has access to video analytics
    if (req.user.role !== 'filmmaker' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view analytics' });
    }

    const analytics = await tracker.getVideoAnalytics(
      videoId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json(analytics);
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
};

// Get viewer retention data
const getRetentionData = async (req, res) => {
  try {
    const { videoId } = req.params;

    // Validate user has access
    if (req.user.role !== 'filmmaker' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view retention data' });
    }

    const retention = await tracker.getViewerRetention(videoId);
    res.json(retention);
  } catch (error) {
    console.error('Retention data error:', error);
    res.status(500).json({ error: 'Failed to retrieve retention data' });
  }
};

// Get quality selection analytics
const getQualityAnalytics = async (req, res) => {
  try {
    const { videoId } = req.params;

    // Validate user has access
    if (req.user.role !== 'filmmaker' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view quality analytics' });
    }

    const qualityData = await tracker.getPopularQualityChoices(videoId);
    res.json(qualityData);
  } catch (error) {
    console.error('Quality analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve quality analytics' });
  }
};

// Get daily analytics report
const getDailyReport = async (req, res) => {
  try {
    const { videoId } = req.params;

    // Validate user has access
    if (req.user.role !== 'filmmaker' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view daily report' });
    }

    const report = await tracker.generateDailyReport(videoId);
    res.json(report);
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
};

module.exports = {
  trackEvent,
  getVideoAnalytics,
  getRetentionData,
  getQualityAnalytics,
  getDailyReport
};
