const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRequest } = require('../middleware/validator');
const { rateLimiter } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/auth');

// Rate limiting configurations
const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

const registrationLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: 'Too many registration attempts, please try again later'
});

// Registration
router.post('/register',
  registrationLimiter,
  validateRequest({
    body: {
      email: { type: 'string', required: true },
      password: { type: 'string', required: true },
      firstName: { type: 'string', required: true },
      lastName: { type: 'string', required: true }
    }
  }),
  authController.register
);

// Login
router.post('/login',
  loginLimiter,
  validateRequest({
    body: {
      email: { type: 'string', required: true },
      password: { type: 'string', required: true }
    }
  }),
  authController.login
);

// Email verification
router.get('/verify-email/:token', authController.verifyEmail);

// Password reset request
router.post('/forgot-password',
  validateRequest({
    body: {
      email: { type: 'string', required: true }
    }
  }),
  authController.forgotPassword
);

// Password reset
router.post('/reset-password/:token',
  validateRequest({
    body: {
      password: { type: 'string', required: true }
    }
  }),
  authController.resetPassword
);

// Token refresh
router.post('/refresh-token',
  validateRequest({
    body: {
      refreshToken: { type: 'string', required: true }
    }
  }),
  authController.refreshToken
);

// Logout
router.post('/logout',
  authenticateToken,
  validateRequest({
    body: {
      refreshToken: { type: 'string', required: true }
    }
  }),
  authController.logout
);

module.exports = router;
