const { Pool } = require('pg');
const config = require('../../config');

const pool = new Pool({
  connectionString: config.database.url,
  ssl: { rejectUnauthorized: false }
});

async function up() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        device_info TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on user_id and last_activity
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_activity 
      ON sessions(user_id, last_activity)
    `);

    // Refresh tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on token
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token 
      ON refresh_tokens(token)
    `);

    await client.query('COMMIT');
    console.log('Auth tables migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query('DROP TABLE IF EXISTS refresh_tokens');
    await client.query('DROP TABLE IF EXISTS sessions');
    
    await client.query('COMMIT');
    console.log('Auth tables rollback completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { up, down };
