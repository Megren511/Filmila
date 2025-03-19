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
const fs = require('fs');

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

// Log environment information
console.log('\n=== Environment Information ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Configure frontend path
const frontendPath = process.env.FRONTEND_BUILD_PATH || path.join(__dirname, '../../frontend/build');
console.log('Frontend path:', frontendPath);
console.log('Frontend path exists:', fs.existsSync(frontendPath));

if (fs.existsSync(frontendPath)) {
  console.log('\nFrontend build contents:', fs.readdirSync(frontendPath));
}

// Serve static files from the React app
app.use(express.static(frontendPath));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  console.log('Serving index.html for path:', req.path);
  const indexPath = path.join(frontendPath, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    return res.status(500).json({ 
      message: `index.html not found at: ${indexPath}`,
      error: { 
        frontendPath,
        indexPath,
        cwd: process.cwd(),
        dirname: __dirname,
        env: process.env.NODE_ENV
      }
    });
  }
  
  res.sendFile(indexPath);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`\n=== Server Started ===`);
  console.log(`Server is running on port ${port}`);
  console.log(`Frontend will be served from: ${frontendPath}\n`);
});

module.exports = app;
