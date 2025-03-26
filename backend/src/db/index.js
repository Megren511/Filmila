const { Pool } = require('pg');

console.log('Initializing database connection with environment:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_SSL: process.env.DATABASE_SSL,
  HAS_DATABASE_URL: !!process.env.DATABASE_URL
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

module.exports = {
  db: {
    query: async (text, params) => {
      try {
        console.log('Executing query:', { text, params });
        const result = await pool.query(text, params);
        console.log('Query result:', { rowCount: result.rowCount });
        return result;
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    }
  }
};
