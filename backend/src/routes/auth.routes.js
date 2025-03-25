const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

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
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful:', { id: user.id, email: user.email, role: user.role });

    // Update last login
    await db.query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Send response
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
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

// Forgot Password - Request Reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to database
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [resetToken, resetTokenExpiry, email]
    );

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await transporter.sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `Please click this link to reset your password: <a href="${resetUrl}">Reset Password</a><br>
             This link will expire in 1 hour.`
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
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
