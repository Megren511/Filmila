const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

console.log('Running database migrations...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
});

async function runMigration(filePath) {
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    await pool.query(sql);
    console.log(`Successfully ran migration: ${path.basename(filePath)}`);
  } catch (error) {
    // Skip errors about existing tables/columns
    if (error.code === '42P07' || error.code === '42701') {
      console.log(`Skipping migration ${path.basename(filePath)} - table/column already exists`);
      return;
    }
    console.error(`Error running migration ${path.basename(filePath)}:`, error);
    throw error;
  }
}

async function runAllMigrations() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      await runMigration(path.join(migrationsDir, file));
    }
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runAllMigrations();
