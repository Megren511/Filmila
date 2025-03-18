const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
});

module.exports = {
  db: {
    query: (text, params) => pool.query(text, params)
  }
};
