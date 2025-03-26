const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const crypto = require('crypto');
const Mailjet = require('node-mailjet');

const router = express.Router();

// Configure Mailjet
const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY,
  apiSecret: process.env.MAILJET_SECRET_KEY
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Find user
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('User found:', { id: user.id, email: user.email, role: user.role });

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      console.log('Inactive user attempted login:', email);
      return res.status(403).json({ message: 'Account is not active' });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    // Return user data without sensitive fields
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status
    };

    console.log('Login successful, returning:', { user: userData });
    return res.json({ 
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    // Validate role
    const allowedRoles = ['viewer', 'filmmaker'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await db.query(
      `INSERT INTO users (full_name, email, password_hash, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, email, full_name, role, status`,
      [full_name, email, hashedPassword, role, 'active']
    );

    const user = result.rows[0];

    // Create token
    const token = jwt.sign(
      { 
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Password reset requested for:', email);
    
    // Check if user exists
    const result = await db.query('SELECT id, email, status FROM users WHERE email = $1', [email]);
    
    // For security, don't reveal if user exists
    if (result.rows.length === 0) {
      console.log('User not found:', email);
      return res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
    }

    const user = result.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      console.log('Inactive user requested password reset:', email);
      return res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    console.log('Generated reset token for user:', email);

    // Save reset token to database
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, resetTokenExpiry, user.id]
    );

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log('Reset URL:', resetUrl);

    // Send email using Mailjet
    const request = await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL,
            Name: process.env.MAILJET_FROM_NAME
          },
          To: [
            {
              Email: email,
              Name: email.split('@')[0]
            }
          ],
          Subject: 'Filmila - Password Reset Request',
          HTMLPart: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>You requested to reset your password for your Filmila account.</p>
              <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4a90e2; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
              <p>If you didn't request this, you can safely ignore this email.</p>
              <p>Best regards,<br>The Filmila Team</p>
            </div>
          `
        }
      ]
    });

    console.log('Reset email sent successfully to:', email);
    res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'An error occurred while processing your request. Please try again later.' });
  }
});

// Reset Password with Token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with valid reset token
    const result = await db.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() WHERE id = $2',
      [passwordHash, result.rows[0].id]
    );

    res.json({ message: 'Password successfully reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
