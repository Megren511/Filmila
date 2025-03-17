const Session = require('../models/session.model');

class SessionManager {
  async createSession(userId, req) {
    try {
      const session = await Session.create({
        userId,
        deviceInfo: req.headers['user-agent'] || 'Unknown Device',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        lastActivity: new Date(),
        isActive: true
      });

      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async invalidateSession(userId) {
    try {
      await Session.updateMany(
        { userId, isActive: true },
        { isActive: false }
      );
    } catch (error) {
      console.error('Error invalidating session:', error);
      throw error;
    }
  }

  async updateSessionActivity(sessionId) {
    try {
      await Session.findByIdAndUpdate(sessionId, {
        lastActivity: new Date()
      });
    } catch (error) {
      console.error('Error updating session activity:', error);
      throw error;
    }
  }

  async cleanupInactiveSessions() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await Session.deleteMany({
        $or: [
          { isActive: false },
          { lastActivity: { $lt: thirtyDaysAgo } }
        ]
      });
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      throw error;
    }
  }
}

module.exports = new SessionManager();
