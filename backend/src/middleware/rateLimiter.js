const rateLimit = require('express-rate-limit');

const rateLimiter = (options) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
  };

  return rateLimit({
    ...defaultOptions,
    ...options,
    store: new rateLimit.MemoryStore() // Using in-memory store for local development
  });
};

module.exports = {
  rateLimiter
};
