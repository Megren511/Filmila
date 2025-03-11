const { s3, bucketName } = require('../config/aws');
const { Pool } = require('pg');

class AnalyticsTracker {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async trackViewEvent(data) {
    const {
      videoId,
      userId,
      quality,
      timestamp = new Date(),
      eventType,
      position,
      duration
    } = data;

    const query = `
      INSERT INTO video_events (
        video_id,
        user_id,
        quality,
        timestamp,
        event_type,
        position,
        duration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const values = [
      videoId,
      userId,
      quality,
      timestamp,
      eventType,
      position,
      duration
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error tracking view event:', error);
      throw new Error('Failed to track view event');
    }
  }

  async getVideoAnalytics(videoId, startDate, endDate) {
    const query = `
      SELECT 
        date_trunc('hour', timestamp) as time_bucket,
        event_type,
        quality,
        COUNT(*) as event_count,
        AVG(position) as avg_position,
        COUNT(DISTINCT user_id) as unique_viewers
      FROM video_events
      WHERE 
        video_id = $1
        AND timestamp BETWEEN $2 AND $3
      GROUP BY 
        time_bucket,
        event_type,
        quality
      ORDER BY 
        time_bucket ASC
    `;

    try {
      const result = await this.pool.query(query, [videoId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching video analytics:', error);
      throw new Error('Failed to fetch video analytics');
    }
  }

  async getViewerRetention(videoId) {
    const query = `
      WITH segments AS (
        SELECT 
          video_id,
          user_id,
          FLOOR(position / 10) * 10 as segment_start,
          COUNT(*) as segment_views
        FROM video_events
        WHERE 
          video_id = $1 
          AND event_type = 'progress'
        GROUP BY 
          video_id, user_id, segment_start
      )
      SELECT 
        segment_start,
        COUNT(DISTINCT user_id) as viewer_count,
        AVG(segment_views) as avg_views_per_user
      FROM segments
      GROUP BY segment_start
      ORDER BY segment_start ASC
    `;

    try {
      const result = await this.pool.query(query, [videoId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching viewer retention:', error);
      throw new Error('Failed to fetch viewer retention data');
    }
  }

  async getPopularQualityChoices(videoId) {
    const query = `
      SELECT 
        quality,
        COUNT(*) as selection_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM video_events
      WHERE 
        video_id = $1 
        AND event_type = 'quality_change'
      GROUP BY quality
      ORDER BY selection_count DESC
    `;

    try {
      const result = await this.pool.query(query, [videoId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching quality choices:', error);
      throw new Error('Failed to fetch quality selection data');
    }
  }

  async generateDailyReport(videoId) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const [views, retention, qualities] = await Promise.all([
        this.getVideoAnalytics(videoId, yesterday, today),
        this.getViewerRetention(videoId),
        this.getPopularQualityChoices(videoId)
      ]);

      return {
        date: yesterday.toISOString().split('T')[0],
        videoId,
        analytics: {
          views,
          retention,
          qualityPreferences: qualities
        }
      };
    } catch (error) {
      console.error('Error generating daily report:', error);
      throw new Error('Failed to generate daily report');
    }
  }
}

module.exports = AnalyticsTracker;
