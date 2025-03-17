const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Session, RefreshToken } = require('../models');
const config = require('../config');
const auth = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      password_hash,
      first_name,
      last_name,
      role: 'user',
      email_verified: false
    });

    // Create session
    const session = await Session.create({
      user_id: user.id,
      device_info: req.headers['user-agent'],
      ip_address: req.ip
    });

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, session_id: session.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry }
    );

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    // Store refresh token
    await RefreshToken.create({
      token: refreshToken,
      user_id: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    res.status(201).json({
      token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create session
    const session = await Session.create({
      user_id: user.id,
      device_info: req.headers['user-agent'],
      ip_address: req.ip
    });

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, session_id: session.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry }
    );

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    // Store refresh token
    await RefreshToken.create({
      token: refreshToken,
      user_id: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    res.json({
      token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refresh_token, config.jwt.secret);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Check if refresh token exists and is valid
    const refreshTokenDoc = await RefreshToken.findByToken(refresh_token);
    if (!refreshTokenDoc) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Create new session
    const session = await Session.create({
      user_id: decoded.id,
      device_info: req.headers['user-agent'],
      ip_address: req.ip
    });

    // Generate new tokens
    const token = jwt.sign(
      { id: decoded.id, session_id: session.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry }
    );

    const newRefreshToken = jwt.sign(
      { id: decoded.id, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    // Store new refresh token
    await RefreshToken.create({
      token: newRefreshToken,
      user_id: decoded.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Invalidate old refresh token
    await RefreshToken.delete(refreshTokenDoc.id);

    res.json({
      token,
      refresh_token: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    res.status(500).json({ message: 'Error refreshing token', error: error.message });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    // Deactivate current session
    await Session.deactivate(req.session.id);
    
    // Invalidate refresh tokens for this user
    await RefreshToken.invalidateAllForUser(req.user.id);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error: error.message });
  }
});

module.exports = router;
