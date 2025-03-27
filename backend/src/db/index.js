const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

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

// Function to run migrations
async function runMigration(filePath) {
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    await pool.query(sql);
    console.log(`Successfully ran migration: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Error running migration ${path.basename(filePath)}:`, error);
    throw error;
  }
}

// Function to run all migrations
async function runAllMigrations() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      await runMigration(path.join(migrationsDir, file));
    }
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function query(text, params) {
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

const db = { query };

module.exports = { db, runAllMigrations, pool };
