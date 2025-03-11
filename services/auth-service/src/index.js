require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 8082;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',                          // Development frontend
    'https://filmila-webapp.onrender.com'            // Production frontend
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'auth' });
});

// Auth routes with /api prefix
app.use('/api/auth', authRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- POST /api/auth/register');
  console.log('- POST /api/auth/login');
  console.log('- GET  /api/auth/verify-email/:token');
  console.log('- POST /api/auth/forgot-password');
  console.log('- POST /api/auth/reset-password/:token');
});
