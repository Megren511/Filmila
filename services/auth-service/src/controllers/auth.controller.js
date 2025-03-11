const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../utils/emailService');
const sessionManager = require('../utils/sessionManager');
const rateLimit = require('express-rate-limit');

class AuthController {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Rate limiting settings
    this.loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: 'Too many login attempts, please try again later'
    });

    this.emailLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 emails per hour
      message: 'Too many email requests, please try again later'
    });
  }

  async register(req, res) {
    const { email, password, name } = req.body;

    try {
      // Validate input
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if email already exists
      const existingUser = await this.pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate verification token
      const verificationToken = uuidv4();
      const verificationExpiry = new Date();
      verificationExpiry.setHours(verificationExpiry.getHours() + 24);

      // Create user
      const result = await this.pool.query(
        `INSERT INTO users (
          email, password, name, verification_token, 
          verification_expires, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id`,
        [email, hashedPassword, name, verificationToken, verificationExpiry]
      );

      // Send verification email
      await emailService.sendVerificationEmail(email, verificationToken);

      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.'
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;
    const deviceInfo = {
      type: req.headers['user-agent'] || 'unknown',
      name: req.body.deviceName || 'unknown',
      ip: req.ip
    };

    try {
      // Get user
      const result = await this.pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      const user = result.rows[0];

      // Check if user exists
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if email is verified
      if (!user.verified) {
        return res.status(401).json({ error: 'Please verify your email first' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create session
      const session = await sessionManager.createSession(user.id, deviceInfo);

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id,
          email: user.email,
          role: user.role,
          sessionId: session.sessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Update last login
      await this.pool.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', session.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        session: {
          id: session.sessionId,
          expiresIn: session.expiresIn
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async refreshToken(req, res) {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    try {
      const session = await sessionManager.refreshSession(refreshToken);

      // Get user info
      const result = await this.pool.query(
        'SELECT id, email, name, role FROM users WHERE id = $1',
        [session.userId]
      );

      const user = result.rows[0];

      // Generate new JWT token
      const token = jwt.sign(
        { 
          id: user.id,
          email: user.email,
          role: user.role,
          sessionId: session.sessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set new refresh token in cookie
      res.cookie('refreshToken', session.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        token,
        session: {
          id: session.sessionId,
          expiresIn: session.expiresIn
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  async logout(req, res) {
    try {
      const { sessionId } = req.user;
      await sessionManager.terminateSession(sessionId);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  async logoutAll(req, res) {
    try {
      await sessionManager.terminateAllUserSessions(req.user.id);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({ message: 'Logged out from all devices' });
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({ error: 'Logout from all devices failed' });
    }
  }

  async getSessions(req, res) {
    try {
      const sessions = await sessionManager.getActiveSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: 'Failed to get active sessions' });
    }
  }

  async terminateSession(req, res) {
    const { sessionId } = req.params;

    try {
      // Ensure user can only terminate their own sessions
      const sessions = await sessionManager.getActiveSessions(req.user.id);
      const session = sessions.find(s => s.session_id === sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      await sessionManager.terminateSession(sessionId);
      res.json({ message: 'Session terminated successfully' });
    } catch (error) {
      console.error('Session termination error:', error);
      res.status(500).json({ error: 'Failed to terminate session' });
    }
  }

  async verifyEmail(req, res) {
    const { token } = req.params;

    try {
      // Find user with token
      const result = await this.pool.query(
        `SELECT id FROM users 
         WHERE verification_token = $1 
         AND verification_expires > NOW()
         AND verified = false`,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      // Update user
      await this.pool.query(
        `UPDATE users 
         SET verified = true, 
             verification_token = null, 
             verification_expires = null 
         WHERE id = $1`,
        [result.rows[0].id]
      );

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Email verification failed' });
    }
  }

  async forgotPassword(req, res) {
    const { email } = req.body;

    try {
      // Find user
      const result = await this.pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        // Return success even if email doesn't exist (security)
        return res.json({ message: 'If your email is registered, you will receive a password reset link' });
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetExpiry = new Date();
      resetExpiry.setMinutes(resetExpiry.getMinutes() + 15);

      // Save reset token
      await this.pool.query(
        `UPDATE users 
         SET reset_token = $1, 
             reset_expires = $2 
         WHERE id = $3`,
        [resetToken, resetExpiry, result.rows[0].id]
      );

      // Send reset email
      await emailService.sendPasswordResetEmail(email, resetToken);

      res.json({ message: 'If your email is registered, you will receive a password reset link' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  }

  async resetPassword(req, res) {
    const { token } = req.params;
    const { password } = req.body;

    try {
      // Find user with token
      const result = await this.pool.query(
        `SELECT id FROM users 
         WHERE reset_token = $1 
         AND reset_expires > NOW()`,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update password
      await this.pool.query(
        `UPDATE users 
         SET password = $1, 
             reset_token = null, 
             reset_expires = null 
         WHERE id = $2`,
        [hashedPassword, result.rows[0].id]
      );

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }

  // Middleware getters
  getLoginLimiter() {
    return this.loginLimiter;
  }

  getEmailLimiter() {
    return this.emailLimiter;
  }
}

module.exports = new AuthController();
