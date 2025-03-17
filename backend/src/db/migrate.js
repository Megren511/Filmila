require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files.filter(f => f.endsWith('.js')).sort();

    // Run migrations in order
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      await migration.up();
      console.log(`Completed migration: ${file}`);
    }

    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
