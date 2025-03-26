require('dotenv').config();
const { db } = require('./index');

async function migrate() {
  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'filmer')),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table created successfully');

    // Create films table
    await db.query(`
      CREATE TABLE IF NOT EXISTS films (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        filmer_id INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration INTEGER,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        category VARCHAR(50),
        tags TEXT[],
        price DECIMAL(10,2) DEFAULT 0.00,
        CONSTRAINT valid_price CHECK (price >= 0)
      );
    `);
    console.log('Films table created successfully');

    // Create update_timestamp function
    await db.query(`
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    console.log('Update timestamp function created successfully');

    // Create triggers for users table
    await db.query(`
      DROP TRIGGER IF EXISTS update_users_timestamp ON users;
      CREATE TRIGGER update_users_timestamp
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp();
    `);
    console.log('Users table trigger created successfully');

    // Create triggers for films table
    await db.query(`
      DROP TRIGGER IF EXISTS update_films_timestamp ON films;
      CREATE TRIGGER update_films_timestamp
        BEFORE UPDATE ON films
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp();
    `);
    console.log('Films table trigger created successfully');

    // Create admin user if not exists
    await db.query(`
      INSERT INTO users (email, password_hash, full_name, role, status)
      VALUES ('admin@filmila.com', '$2a$10$YourHashedPasswordHere', 'Admin User', 'admin', 'active')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('Admin user created successfully');

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

migrate();
