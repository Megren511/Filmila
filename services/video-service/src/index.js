require('dotenv').config();
const express = require('express');
const cors = require('cors');
const videoRoutes = require('./routes/video.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.VIDEO_SERVICE_PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Routes with /api prefix as per established pattern
app.use('/api/videos', authMiddleware, videoRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

app.listen(PORT, () => {
  console.log(`Video service running on port ${PORT}`);
  console.log('API endpoints available at:');
  console.log('- /api/videos');
  console.log('- /api/analytics');
  console.log('- /api/dashboard');
});
