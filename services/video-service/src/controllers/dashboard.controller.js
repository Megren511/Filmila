const AnalyticsTracker = require('../utils/analyticsTracker');
const cacheManager = require('../utils/cacheManager');
const { Pool } = require('pg');

const tracker = new AnalyticsTracker();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get overview statistics for filmmaker dashboard
const getOverviewStats = async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const userId = req.user.id;

    // Ensure user is a filmmaker or admin
    if (req.user.role !== 'filmmaker' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to access dashboard' });
    }

    // Check cache first
    const cachedData = await cacheManager.get('overview', { userId, timeframe });
    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      WITH video_stats AS (
        SELECT 
          v.video_id,
          COUNT(DISTINCT ve.user_id) as unique_viewers,
          COUNT(*) as total_views,
          MAX(ve.timestamp) as last_view
        FROM video_events ve
        WHERE 
          ve.timestamp > NOW() - $1::interval
          AND ve.event_type = 'play'
          ${req.user.role === 'filmmaker' ? 'AND ve.filmmaker_id = $2' : ''}
        GROUP BY v.video_id
      )
      SELECT 
        COUNT(DISTINCT video_id) as total_videos,
        SUM(unique_viewers) as total_unique_viewers,
        SUM(total_views) as total_views,
        AVG(unique_viewers) as avg_viewers_per_video
      FROM video_stats
    `;

    const timeframeMap = {
      '24h': 'interval \'24 hours\'',
      '7d': 'interval \'7 days\'',
      '30d': 'interval \'30 days\''
    };

    const values = [timeframeMap[timeframe]];
    if (req.user.role === 'filmmaker') {
      values.push(userId);
    }

    const result = await pool.query(query, values);
    const data = result.rows[0];

    // Cache the results
    await cacheManager.set('overview', { userId, timeframe }, data);

    res.json(data);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
};

// Get trending videos
const getTrendingVideos = async (req, res) => {
  try {
    const { limit = 5, timeframe = '24h' } = req.query;
    const userId = req.user.id;

    // Check cache first
    const cachedData = await cacheManager.get('trending', { userId, timeframe });
    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT 
        v.video_id,
        v.title,
        COUNT(DISTINCT ve.user_id) as unique_viewers,
        COUNT(*) as total_views,
        AVG(CASE WHEN ve.event_type = 'end' THEN 1 ELSE 0 END) as completion_rate,
        jsonb_agg(DISTINCT ve.quality) as qualities_used
      FROM video_events ve
      WHERE 
        ve.timestamp > NOW() - $1::interval
        ${req.user.role === 'filmmaker' ? 'AND ve.filmmaker_id = $2' : ''}
      GROUP BY v.video_id, v.title
      ORDER BY unique_viewers DESC
      LIMIT $3
    `;

    const timeframeMap = {
      '24h': 'interval \'24 hours\'',
      '7d': 'interval \'7 days\'',
      '30d': 'interval \'30 days\''
    };

    const values = [timeframeMap[timeframe]];
    if (req.user.role === 'filmmaker') {
      values.push(userId);
    }
    values.push(limit);

    const result = await pool.query(query, values);
    const data = result.rows;

    // Cache the results
    await cacheManager.set('trending', { userId, timeframe }, data);

    res.json(data);
  } catch (error) {
    console.error('Trending videos error:', error);
    res.status(500).json({ error: 'Failed to fetch trending videos' });
  }
};

// Get real-time viewer count
const getRealTimeViewers = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Check cache first (short TTL for real-time data)
    const cachedData = await cacheManager.get('realtime', { videoId });
    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT COUNT(DISTINCT user_id) as current_viewers
      FROM video_events
      WHERE 
        video_id = $1
        AND event_type = 'progress'
        AND timestamp > NOW() - interval '5 minutes'
    `;

    const result = await pool.query(query, [videoId]);
    const data = { currentViewers: result.rows[0].current_viewers };

    // Cache the results with short TTL
    await cacheManager.set('realtime', { videoId }, data);

    res.json(data);
  } catch (error) {
    console.error('Real-time viewers error:', error);
    res.status(500).json({ error: 'Failed to fetch real-time viewers' });
  }
};

// Get engagement metrics over time
const getEngagementTimeline = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { interval = 'hour', timeframe = '24h' } = req.query;

    // Check cache first
    const cachedData = await cacheManager.get('timeline', { videoId, timeframe });
    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT 
        date_trunc($1, timestamp) as time_bucket,
        COUNT(DISTINCT user_id) as unique_viewers,
        COUNT(*) as total_events,
        AVG(CASE WHEN event_type = 'end' THEN 1 ELSE 0 END) as completion_rate,
        jsonb_agg(DISTINCT quality) as qualities_used
      FROM video_events
      WHERE 
        video_id = $2
        AND timestamp > NOW() - $3::interval
      GROUP BY date_trunc($1, timestamp)
      ORDER BY time_bucket ASC
    `;

    const timeframeMap = {
      '24h': 'interval \'24 hours\'',
      '7d': 'interval \'7 days\'',
      '30d': 'interval \'30 days\''
    };

    const result = await pool.query(query, [interval, videoId, timeframeMap[timeframe]]);
    const data = result.rows;

    // Cache the results
    await cacheManager.set('timeline', { videoId, timeframe }, data);

    res.json(data);
  } catch (error) {
    console.error('Engagement timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement timeline' });
  }
};

// Get viewer demographics
const getViewerDemographics = async (req, res) => {
  try {
    const { videoId } = req.params;

    // Check cache first
    const cachedData = await cacheManager.get('demographics', { videoId });
    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      SELECT 
        u.country,
        u.device_type,
        COUNT(DISTINCT ve.user_id) as viewer_count,
        AVG(CASE WHEN ve.event_type = 'end' THEN 1 ELSE 0 END) as completion_rate
      FROM video_events ve
      JOIN users u ON ve.user_id = u.id
      WHERE ve.video_id = $1
      GROUP BY u.country, u.device_type
      ORDER BY viewer_count DESC
    `;

    const result = await pool.query(query, [videoId]);
    const data = result.rows;

    // Cache the results
    await cacheManager.set('demographics', { videoId }, data);

    res.json(data);
  } catch (error) {
    console.error('Demographics error:', error);
    res.status(500).json({ error: 'Failed to fetch viewer demographics' });
  }
};

// Cache invalidation endpoint for admin use
const invalidateCache = async (req, res) => {
  try {
    const { type, videoId, userId } = req.body;

    // Only admins can invalidate cache
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to invalidate cache' });
    }

    if (videoId) {
      await cacheManager.invalidateVideoCache(videoId);
    } else if (userId) {
      await cacheManager.invalidateUserCache(userId);
    } else if (type) {
      await cacheManager.invalidatePattern(`dashboard:${type}:*`);
    } else {
      await cacheManager.invalidatePattern('dashboard:*');
    }

    res.json({ message: 'Cache invalidated successfully' });
  } catch (error) {
    console.error('Cache invalidation error:', error);
    res.status(500).json({ error: 'Failed to invalidate cache' });
  }
};

// Get cache performance metrics
const getCacheMetrics = async (req, res) => {
  try {
    // Only admins can view cache metrics
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view cache metrics' });
    }

    const metrics = await cacheManager.getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Cache metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch cache metrics' });
  }
};

module.exports = {
  getOverviewStats,
  getTrendingVideos,
  getRealTimeViewers,
  getEngagementTimeline,
  getViewerDemographics,
  invalidateCache,
  getCacheMetrics
};
