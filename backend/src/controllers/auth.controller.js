const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/config');
const { validateEmail, validatePassword } = require('../utils/validators');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { createSession, invalidateSession } = require('../utils/sessionManager');

class AuthController {
  async register(req, res) {
    const { email, password, firstName, lastName } = req.body;

    try {
      // Validate input
      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      if (!validatePassword(password)) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters long and contain at least one number, one uppercase letter, and one special character' 
        });
      }

      // Check if user exists
      const userExists = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (userExists.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Generate verification token
      const verificationToken = jwt.sign(
        { email: email.toLowerCase() },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Create user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, verification_token)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, first_name, last_name, role`,
        [email.toLowerCase(), passwordHash, firstName, lastName, verificationToken]
      );

      // Send verification email
      await sendVerificationEmail(email, verificationToken);

      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: result.rows[0].id,
          email: result.rows[0].email,
          firstName: result.rows[0].first_name,
          lastName: result.rows[0].last_name,
          role: result.rows[0].role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;

    try {
      // Get user
      const result = await pool.query(
        `SELECT id, email, password_hash, first_name, last_name, role, email_verified
         FROM users WHERE email = $1`,
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Check if email is verified
      if (!user.email_verified) {
        return res.status(403).json({ error: 'Please verify your email before logging in' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create tokens
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Save refresh token
      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [user.id, refreshToken]
      );

      // Create session
      const session = await createSession(user.id, req);

      // Update last login
      await pool.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async verifyEmail(req, res) {
    const { token } = req.params;

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Update user
      const result = await pool.query(
        `UPDATE users 
         SET email_verified = true, verification_token = null
         WHERE email = $1 AND verification_token = $2
         RETURNING id`,
        [decoded.email, token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(400).json({ error: 'Email verification failed' });
    }
  }

  async forgotPassword(req, res) {
    const { email } = req.body;

    try {
      // Get user
      const result = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        // Don't reveal if email exists
        return res.json({ message: 'If your email is registered, you will receive a password reset link' });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: result.rows[0].id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Save reset token
      await pool.query(
        `UPDATE users 
         SET reset_password_token = $1, reset_password_expires = NOW() + INTERVAL '1 hour'
         WHERE id = $2`,
        [resetToken, result.rows[0].id]
      );

      // Send reset email
      await sendPasswordResetEmail(email, resetToken);

      res.json({ message: 'If your email is registered, you will receive a password reset link' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Password reset request failed' });
    }
  }

  async resetPassword(req, res) {
    const { token } = req.params;
    const { password } = req.body;

    try {
      // Verify password
      if (!validatePassword(password)) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters long and contain at least one number, one uppercase letter, and one special character' 
        });
      }

      // Get user with valid reset token
      const result = await pool.query(
        `SELECT id FROM users 
         WHERE reset_password_token = $1 
         AND reset_password_expires > NOW()`,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Update password and clear reset token
      await pool.query(
        `UPDATE users 
         SET password_hash = $1, reset_password_token = null, reset_password_expires = null
         WHERE id = $2`,
        [passwordHash, result.rows[0].id]
      );

      // Invalidate all sessions
      await invalidateSession(result.rows[0].id);

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  }

  async refreshToken(req, res) {
    const { refreshToken } = req.body;

    try {
      // Verify refresh token exists and is valid
      const tokenResult = await pool.query(
        `SELECT user_id FROM refresh_tokens 
         WHERE token = $1 AND expires_at > NOW()`,
        [refreshToken]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Get user
      const userResult = await pool.query(
        'SELECT id, role FROM users WHERE id = $1',
        [tokenResult.rows[0].user_id]
      );

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: userResult.rows[0].id, role: userResult.rows[0].role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );

      res.json({ accessToken });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }

  async logout(req, res) {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    try {
      // Remove refresh token
      await pool.query(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );

      // Invalidate session
      await invalidateSession(userId);

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }
}

module.exports = new AuthController();
