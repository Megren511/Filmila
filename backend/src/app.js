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
const publicPath = path.join(process.cwd(), 'public');

console.log('Environment:', process.env.NODE_ENV);
console.log('Current working directory:', process.cwd());
console.log('Public path:', publicPath);
console.log('__dirname:', __dirname);
console.log('Absolute path:', path.resolve(publicPath));

// List directory contents
const fs = require('fs');
try {
  console.log('\nListing current directory contents:');
  console.log(fs.readdirSync(process.cwd()));
  
  if (fs.existsSync('public')) {
    console.log('\nListing public directory contents:');
    console.log(fs.readdirSync('public'));
  } else {
    console.error('\npublic directory does not exist');
  }
} catch (err) {
  console.error('Error listing directory:', err);
}

// Serve static files from the React frontend app
app.use(express.static(publicPath));

// Handle React routing, return all requests to React app
app.get('*', function(req, res) {
  const indexPath = path.join(publicPath, 'index.html');
  console.log('\nRequest URL:', req.url);
  console.log('Serving index.html from:', indexPath);
  console.log('File exists:', fs.existsSync(indexPath));
  
  if (!fs.existsSync(indexPath)) {
    console.error('index.html not found at:', indexPath);
    return res.status(500).json({ 
      message: `index.html not found at: ${indexPath}`,
      error: { 
        publicPath, 
        indexPath, 
        cwd: process.cwd(),
        dirContents: fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : 'directory not found'
      }
    });
  }
  
  try {
    const fileContents = fs.readFileSync(indexPath, 'utf8');
    console.log('index.html contents:', fileContents.substring(0, 200) + '...');
    res.send(fileContents);
  } catch (err) {
    console.error('Error reading index.html:', err);
    res.status(500).json({ message: 'Error reading index.html', error: err });
  }
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
