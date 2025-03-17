const { body, validationResult } = require('express-validator');

// Schema-based validation middleware factory
const validateRequest = (schema) => {
  const validators = [];

  // Body validation
  if (schema.body) {
    Object.entries(schema.body).forEach(([field, rules]) => {
      const validator = body(field);

      if (rules.required) {
        validator.notEmpty().withMessage(`${field} is required`);
      }

      if (rules.type === 'string') {
        validator.isString().withMessage(`${field} must be a string`);
      }

      if (field === 'email') {
        validator.isEmail().withMessage('Please enter a valid email').normalizeEmail();
      }

      if (field === 'password' && rules.required) {
        validator
          .isLength({ min: 8 })
          .withMessage('Password must be at least 8 characters long')
          .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/)
          .withMessage('Password must contain at least one letter, one number, and one special character');
      }

      validators.push(validator);
    });
  }

  return [
    ...validators,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: errors.array().map(err => err.msg).join(', ')
        });
      }
      next();
    }
  ];
};

// Legacy validation middleware for backward compatibility
const validateRegistration = validateRequest({
  body: {
    email: { type: 'string', required: true },
    password: { type: 'string', required: true },
    firstName: { type: 'string', required: true },
    lastName: { type: 'string', required: true }
  }
});

const validateLogin = validateRequest({
  body: {
    email: { type: 'string', required: true },
    password: { type: 'string', required: true }
  }
});

const validatePasswordReset = validateRequest({
  body: {
    password: { type: 'string', required: true }
  }
});

const validateEmail = validateRequest({
  body: {
    email: { type: 'string', required: true }
  }
});

module.exports = {
  validateRequest,
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateEmail
};
