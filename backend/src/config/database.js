const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl ? {
    rejectUnauthorized: false
  } : false
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
