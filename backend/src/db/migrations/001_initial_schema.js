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

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Videos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        s3_key VARCHAR(255) NOT NULL,
        cloudfront_url VARCHAR(255),
        user_id INTEGER REFERENCES public.users(id),
        status VARCHAR(50) DEFAULT 'processing',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES public.users(id),
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        status VARCHAR(50),
        current_period_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Email logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.email_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES public.users(id),
        email_type VARCHAR(50),
        status VARCHAR(50),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully');
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
    
    await client.query('DROP TABLE IF EXISTS public.email_logs');
    await client.query('DROP TABLE IF EXISTS public.subscriptions');
    await client.query('DROP TABLE IF EXISTS public.videos');
    await client.query('DROP TABLE IF EXISTS public.users');
    
    await client.query('COMMIT');
    console.log('Rollback completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { up, down };
