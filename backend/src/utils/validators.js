const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateRequest = (schema) => {
  return (req, res, next) => {
    const errors = [];

    // Validate body
    if (schema.body) {
      Object.keys(schema.body).forEach(key => {
        const field = schema.body[key];
        const value = req.body[key];

        if (field.required && !value) {
          errors.push(`${key} is required`);
        }

        if (value && field.type && typeof value !== field.type) {
          errors.push(`${key} must be of type ${field.type}`);
        }

        if (field.validate && !field.validate(value)) {
          errors.push(`${key} is invalid`);
        }
      });
    }

    // Validate query parameters
    if (schema.query) {
      Object.keys(schema.query).forEach(key => {
        const field = schema.query[key];
        const value = req.query[key];

        if (field.required && !value) {
          errors.push(`Query parameter ${key} is required`);
        }

        if (value && field.type && typeof value !== field.type) {
          errors.push(`Query parameter ${key} must be of type ${field.type}`);
        }

        if (field.validate && !field.validate(value)) {
          errors.push(`Query parameter ${key} is invalid`);
        }
      });
    }

    // Validate URL parameters
    if (schema.params) {
      Object.keys(schema.params).forEach(key => {
        const field = schema.params[key];
        const value = req.params[key];

        if (field.required && !value) {
          errors.push(`URL parameter ${key} is required`);
        }

        if (value && field.type && typeof value !== field.type) {
          errors.push(`URL parameter ${key} must be of type ${field.type}`);
        }

        if (field.validate && !field.validate(value)) {
          errors.push(`URL parameter ${key} is invalid`);
        }
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateRequest
};
