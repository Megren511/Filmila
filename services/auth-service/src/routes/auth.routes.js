const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRecaptcha } = require('../middleware/recaptcha');
const { validateSession } = require('../middleware/session');

// Registration with recaptcha and rate limiting
router.post('/register',
  validateRecaptcha,
  authController.getEmailLimiter(),
  authController.register.bind(authController)
);

// Login with rate limiting
router.post('/login',
  validateRecaptcha,
  authController.getLoginLimiter(),
  authController.login.bind(authController)
);

// Token refresh
router.post('/refresh-token',
  authController.refreshToken.bind(authController)
);

// Session management (requires valid session)
router.get('/sessions',
  validateSession,
  authController.getSessions.bind(authController)
);

router.delete('/sessions/:sessionId',
  validateSession,
  authController.terminateSession.bind(authController)
);

router.post('/logout',
  validateSession,
  authController.logout.bind(authController)
);

router.post('/logout-all',
  validateSession,
  authController.logoutAll.bind(authController)
);

// Email verification
router.get('/verify-email/:token',
  authController.verifyEmail.bind(authController)
);

// Password reset request
router.post('/forgot-password',
  validateRecaptcha,
  authController.getEmailLimiter(),
  authController.forgotPassword.bind(authController)
);

// Password reset with token
router.post('/reset-password/:token',
  validateRecaptcha,
  authController.resetPassword.bind(authController)
);

module.exports = router;
