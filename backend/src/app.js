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

// Get the absolute path to the frontend build directory
const publicPath = path.join(__dirname, '../public');

console.log('\n=== Environment Information ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Public path:', publicPath);
console.log('Absolute public path:', path.resolve(publicPath));

// List directory contents
try {
  console.log('\n=== Directory Structure ===');
  console.log('Current directory contents:', fs.readdirSync(process.cwd()));
  
  if (fs.existsSync(publicPath)) {
    console.log('\nPublic directory contents:', fs.readdirSync(publicPath));
    
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const stats = fs.statSync(indexPath);
      console.log('\nindex.html found!');
      console.log('Size:', stats.size, 'bytes');
      console.log('Created:', stats.birthtime);
      console.log('Modified:', stats.mtime);
      
      // Read first few lines to verify content
      const content = fs.readFileSync(indexPath, 'utf8').split('\n').slice(0, 5).join('\n');
      console.log('\nFirst few lines of index.html:');
      console.log(content);
    }
  } else {
    console.error('\nPublic directory not found at:', publicPath);
    
    // Try to find the public directory
    const possiblePaths = [
      path.join(process.cwd(), 'public'),
      path.join(__dirname, '../public'),
      path.join(__dirname, '../../public')
    ];
    
    console.log('\n=== Searching for public directory ===');
    possiblePaths.forEach(p => {
      console.log(`\nChecking path: ${p}`);
      console.log('Exists:', fs.existsSync(p));
      if (fs.existsSync(p)) {
        console.log('Contents:', fs.readdirSync(p));
        
        const indexPath = path.join(p, 'index.html');
        if (fs.existsSync(indexPath)) {
          const stats = fs.statSync(indexPath);
          console.log('Found index.html!');
          console.log('Size:', stats.size, 'bytes');
          console.log('Created:', stats.birthtime);
          console.log('Modified:', stats.mtime);
        }
      }
    });
  }
} catch (err) {
  console.error('\nError listing directories:', err);
}

// Serve static files from the React frontend app
app.use(express.static(publicPath));

// Handle React routing, return all requests to React app
app.get('*', function(req, res) {
  console.log('\n=== Handling Request ===');
  console.log('Request URL:', req.url);
  console.log('Current directory:', process.cwd());
  console.log('__dirname:', __dirname);
  console.log('Public path:', publicPath);
  console.log('Exists:', fs.existsSync(publicPath));
  
  const indexPath = path.join(publicPath, 'index.html');
  console.log('Looking for index.html at:', indexPath);
  console.log('Exists:', fs.existsSync(indexPath));
  
  if (!fs.existsSync(indexPath)) {
    console.error('index.html not found!');
    
    // Try to find index.html
    const possiblePaths = [
      path.join(process.cwd(), 'public/index.html'),
      path.join(__dirname, '../public/index.html'),
      path.join(__dirname, '../../public/index.html')
    ];
    
    console.log('\n=== Searching for index.html ===');
    possiblePaths.forEach(p => {
      console.log(`\nChecking path: ${p}`);
      console.log('Exists:', fs.existsSync(p));
      if (fs.existsSync(p)) {
        const stats = fs.statSync(p);
        console.log('Size:', stats.size, 'bytes');
        console.log('Created:', stats.birthtime);
        console.log('Modified:', stats.mtime);
      }
    });
    
    return res.status(500).json({ 
      message: `index.html not found at: ${indexPath}`,
      error: { 
        publicPath, 
        indexPath, 
        cwd: process.cwd(),
        dirname: __dirname,
        env: process.env.NODE_ENV,
        searchedPaths: possiblePaths.map(p => ({
          path: p,
          exists: fs.existsSync(p),
          size: fs.existsSync(p) ? fs.statSync(p).size : null,
          stats: fs.existsSync(p) ? fs.statSync(p) : null
        }))
      }
    });
  }
  
  const stats = fs.statSync(indexPath);
  console.log('\nindex.html found!');
  console.log('Size:', stats.size, 'bytes');
  console.log('Created:', stats.birthtime);
  console.log('Modified:', stats.mtime);
  
  res.sendFile(indexPath);
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`\n=== Server Started ===`);
  console.log(`Server is running on port ${port}`);
  console.log('Frontend will be served from:', publicPath);
  
  if (fs.existsSync(publicPath)) {
    console.log('\nPublic directory contents:', fs.readdirSync(publicPath));
    
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const stats = fs.statSync(indexPath);
      console.log('\nindex.html found!');
      console.log('Size:', stats.size, 'bytes');
      console.log('Created:', stats.birthtime);
      console.log('Modified:', stats.mtime);
    }
  }
});

module.exports = app;
