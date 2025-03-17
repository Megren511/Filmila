const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, Session } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    if (!decoded.id || !decoded.session_id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get user and session
    const [user, session] = await Promise.all([
      User.findById(decoded.id),
      Session.findById(decoded.session_id)
    ]);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!session || !session.is_active) {
      return res.status(401).json({ message: 'Session expired' });
    }

    // Update session activity
    await Session.updateActivity(session.id);

    // Attach user and session to request
    req.user = user;
    req.session = session;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Authentication error', error: error.message });
  }
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};
