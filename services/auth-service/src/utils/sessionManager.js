const { Pool } = require('pg');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class SessionManager {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    this.redis = new Redis(process.env.REDIS_URL);

    // Session configuration
    this.config = {
      maxActiveSessions: 5,
      sessionDuration: 24 * 60 * 60, // 24 hours in seconds
      refreshTokenDuration: 7 * 24 * 60 * 60, // 7 days in seconds
      inactivityTimeout: 30 * 60 // 30 minutes in seconds
    };
  }

  async createSession(userId, deviceInfo) {
    const sessionId = uuidv4();
    const refreshToken = uuidv4();
    
    try {
      // Check active sessions count
      const activeSessions = await this.getActiveSessions(userId);
      if (activeSessions.length >= this.config.maxActiveSessions) {
        // Remove oldest session if limit reached
        const oldestSession = activeSessions[activeSessions.length - 1];
        await this.terminateSession(oldestSession.session_id);
      }

      // Create session record
      await this.pool.query(
        `INSERT INTO user_sessions (
          session_id, user_id, refresh_token,
          device_type, device_name, ip_address,
          last_active, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + interval '24 hours')`,
        [
          sessionId,
          userId,
          refreshToken,
          deviceInfo.type,
          deviceInfo.name,
          deviceInfo.ip
        ]
      );

      // Store session data in Redis for quick access
      await this.redis.setex(
        `session:${sessionId}`,
        this.config.sessionDuration,
        JSON.stringify({
          userId,
          deviceInfo,
          lastActive: new Date()
        })
      );

      // Store refresh token with longer duration
      await this.redis.setex(
        `refresh:${refreshToken}`,
        this.config.refreshTokenDuration,
        userId
      );

      return {
        sessionId,
        refreshToken,
        expiresIn: this.config.sessionDuration
      };
    } catch (error) {
      console.error('Session creation error:', error);
      throw new Error('Failed to create session');
    }
  }

  async validateSession(sessionId) {
    try {
      // Check Redis first for performance
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (!sessionData) {
        return null;
      }

      // Update last active timestamp
      await this.updateLastActive(sessionId);

      return JSON.parse(sessionData);
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  async refreshSession(refreshToken) {
    try {
      // Verify refresh token
      const userId = await this.redis.get(`refresh:${refreshToken}`);
      if (!userId) {
        throw new Error('Invalid refresh token');
      }

      // Get session details
      const result = await this.pool.query(
        'SELECT * FROM user_sessions WHERE refresh_token = $1',
        [refreshToken]
      );

      if (result.rows.length === 0) {
        throw new Error('Session not found');
      }

      const session = result.rows[0];

      // Generate new tokens
      const newSessionId = uuidv4();
      const newRefreshToken = uuidv4();

      // Update session in database
      await this.pool.query(
        `UPDATE user_sessions 
         SET session_id = $1,
             refresh_token = $2,
             last_active = NOW(),
             expires_at = NOW() + interval '24 hours'
         WHERE session_id = $3`,
        [newSessionId, newRefreshToken, session.session_id]
      );

      // Update Redis
      await this.redis.del(`session:${session.session_id}`);
      await this.redis.del(`refresh:${refreshToken}`);

      await this.redis.setex(
        `session:${newSessionId}`,
        this.config.sessionDuration,
        JSON.stringify({
          userId: session.user_id,
          deviceInfo: {
            type: session.device_type,
            name: session.device_name,
            ip: session.ip_address
          },
          lastActive: new Date()
        })
      );

      await this.redis.setex(
        `refresh:${newRefreshToken}`,
        this.config.refreshTokenDuration,
        session.user_id
      );

      return {
        sessionId: newSessionId,
        refreshToken: newRefreshToken,
        expiresIn: this.config.sessionDuration
      };
    } catch (error) {
      console.error('Session refresh error:', error);
      throw new Error('Failed to refresh session');
    }
  }

  async terminateSession(sessionId) {
    try {
      // Get session details
      const result = await this.pool.query(
        'SELECT refresh_token FROM user_sessions WHERE session_id = $1',
        [sessionId]
      );

      if (result.rows.length > 0) {
        const { refresh_token } = result.rows[0];

        // Remove from Redis
        await this.redis.del(`session:${sessionId}`);
        await this.redis.del(`refresh:${refresh_token}`);

        // Remove from database
        await this.pool.query(
          'DELETE FROM user_sessions WHERE session_id = $1',
          [sessionId]
        );
      }
    } catch (error) {
      console.error('Session termination error:', error);
      throw new Error('Failed to terminate session');
    }
  }

  async terminateAllUserSessions(userId) {
    try {
      // Get all user sessions
      const result = await this.pool.query(
        'SELECT session_id, refresh_token FROM user_sessions WHERE user_id = $1',
        [userId]
      );

      // Remove all sessions from Redis and database
      await Promise.all(result.rows.map(async (session) => {
        await this.redis.del(`session:${session.session_id}`);
        await this.redis.del(`refresh:${session.refresh_token}`);
      }));

      await this.pool.query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [userId]
      );
    } catch (error) {
      console.error('All sessions termination error:', error);
      throw new Error('Failed to terminate all sessions');
    }
  }

  async getActiveSessions(userId) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM user_sessions 
         WHERE user_id = $1 
         AND expires_at > NOW()
         ORDER BY last_active DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Get active sessions error:', error);
      throw new Error('Failed to get active sessions');
    }
  }

  async updateLastActive(sessionId) {
    try {
      // Update Redis
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (sessionData) {
        const data = JSON.parse(sessionData);
        data.lastActive = new Date();
        await this.redis.setex(
          `session:${sessionId}`,
          this.config.sessionDuration,
          JSON.stringify(data)
        );
      }

      // Update database
      await this.pool.query(
        `UPDATE user_sessions 
         SET last_active = NOW()
         WHERE session_id = $1`,
        [sessionId]
      );
    } catch (error) {
      console.error('Update last active error:', error);
    }
  }
}

module.exports = new SessionManager();
