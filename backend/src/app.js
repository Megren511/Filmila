const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { db } = require('./db');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const filmRoutes = require('./routes/film.routes');
const { errorHandler } = require('./middleware/error');
const { authMiddleware } = require('./middleware/auth');

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://filmila.com', 'http://localhost:3000']
    : 'http://localhost:3000',
  credentials: true
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/films', authMiddleware, filmRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
