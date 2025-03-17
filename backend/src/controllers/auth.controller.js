const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateEmail, validatePassword } = require('../utils/validators');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { createSession, invalidateSession } = require('../utils/sessionManager');
const { User, RefreshToken } = require('../models');

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
      const userExists = await User.findOne({ email: email.toLowerCase() });

      if (userExists) {
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
      const user = await User.create({
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        verificationToken
      });

      // Send verification email
      await sendVerificationEmail(email, verificationToken);

      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
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
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(403).json({ error: 'Please verify your email before logging in' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create tokens
      const accessToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );

      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Save refresh token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await RefreshToken.create({
        userId: user._id,
        token: refreshToken,
        expiresAt
      });

      // Create session
      const session = await createSession(user._id, req);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
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
      const user = await User.findOneAndUpdate(
        { email: decoded.email, verificationToken: token },
        { emailVerified: true, verificationToken: null },
        { new: true }
      );

      if (!user) {
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
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Don't reveal if email exists
        return res.json({ message: 'If your email is registered, you will receive a password reset link' });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Save reset token
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1);
      
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save();

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
