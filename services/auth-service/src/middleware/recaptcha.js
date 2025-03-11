const axios = require('axios');

const validateRecaptcha = async (req, res, next) => {
  const recaptchaToken = req.body.recaptchaToken;

  // Skip validation in development if configured
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_RECAPTCHA === 'true') {
    return next();
  }

  if (!recaptchaToken) {
    return res.status(400).json({ error: 'reCAPTCHA token is required' });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken
        }
      }
    );

    if (!response.data.success) {
      return res.status(400).json({ error: 'reCAPTCHA validation failed' });
    }

    next();
  } catch (error) {
    console.error('reCAPTCHA validation error:', error);
    res.status(500).json({ error: 'Failed to validate reCAPTCHA' });
  }
};

module.exports = {
  validateRecaptcha
};
