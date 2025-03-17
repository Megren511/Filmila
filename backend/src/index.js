require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const db = require('./config/database');

const app = require('./app');

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.env === 'production' 
    ? config.frontend.url 
    : 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use(config.apiPrefix, require('./routes'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: config.env === 'development' ? err.message : undefined
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API prefix: ${process.env.API_PREFIX || '/api'}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
