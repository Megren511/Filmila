require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { db } = require('./db');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const videoRoutes = require('./routes/video.routes');
const { errorHandler } = require('./middleware/error');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
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
app.use('/api/videos', authMiddleware, videoRoutes);

// Get the absolute path to the frontend build directory
const frontendBuildPath = process.env.NODE_ENV === 'production'
  ? '/opt/render/project/src/frontend/build'
  : path.join(__dirname, '../..', 'frontend/build');

console.log('Frontend build path:', frontendBuildPath);

// Serve static files from the React frontend app
app.use(express.static(frontendBuildPath));

// Handle React routing, return all requests to React app
app.get('*', function(req, res) {
  const indexPath = path.join(frontendBuildPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  if (!require('fs').existsSync(indexPath)) {
    console.error('index.html not found at:', indexPath);
    return res.status(500).json({ 
      message: `index.html not found at: ${indexPath}`,
      error: { frontendBuildPath, indexPath }
    });
  }
  res.sendFile(indexPath);
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
