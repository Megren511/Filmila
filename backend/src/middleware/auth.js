const jwt = require('jsonwebtoken');
const { db } = require('../db');

const authMiddleware = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Auth middleware - Verifying token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded);

    // Get user from database
    const result = await db.query(
      'SELECT id, username, email, role, status FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      console.log('Auth middleware - User not found');
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    console.log('Auth middleware - User found:', user);

    if (user.status !== 'active') {
      console.log('Auth middleware - User account not active:', user.status);
      return res.status(403).json({ message: 'Account is not active' });
    }

    req.user = user;
    console.log('Auth middleware - Authentication successful');
    next();
  } catch (error) {
    console.error('Auth middleware - Error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authMiddleware };
