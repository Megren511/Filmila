const jwt = require('jsonwebtoken');
const sessionManager = require('../utils/sessionManager');

const validateSession = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate session
    const sessionData = await sessionManager.validateSession(decoded.sessionId);
    if (!sessionData) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Check if session belongs to the correct user
    if (sessionData.userId !== decoded.id) {
      return res.status(401).json({ error: 'Session mismatch' });
    }

    // Attach user and session data to request
    req.user = {
      ...decoded,
      sessionData
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Session validation error:', error);
    res.status(500).json({ error: 'Session validation failed' });
  }
};

module.exports = {
  validateSession
};
