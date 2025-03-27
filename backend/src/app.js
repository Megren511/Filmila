const express = require('express');
const cors = require('cors');
const { db, runAllMigrations } = require('./db');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const filmRoutes = require('./routes/film.routes');
const { errorHandler } = require('./middleware/error');
const { authMiddleware } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/admin', adminRoutes);
app.use('/api/films', filmRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Run migrations on startup
runAllMigrations()
  .then(() => {
    console.log('Database migrations completed');
  })
  .catch((error) => {
    console.error('Database migration failed:', error);
    process.exit(1);
  });

// Error handling middleware
app.use(errorHandler);

module.exports = app;
