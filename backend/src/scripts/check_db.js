require('dotenv').config();
const { db } = require('../db');

async function checkDatabase() {
  try {
    // Test connection
    console.log('Testing database connection...');
    await db.query('SELECT NOW()');
    console.log('Database connection successful!');

    // Check if admin user exists
    console.log('\nChecking for admin user...');
    const result = await db.query('SELECT * FROM users WHERE email = $1', ['admin@filmila.com']);
    
    if (result.rows.length > 0) {
      console.log('Admin user found:', {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        role: result.rows[0].role,
        status: result.rows[0].status
      });
    } else {
      console.log('Admin user not found!');
      
      // Create admin user
      console.log('\nCreating admin user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      await db.query(`
        INSERT INTO users (username, email, password_hash, role, status, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, ['admin', 'admin@filmila.com', hashedPassword, 'admin', 'active']);
      
      console.log('Admin user created successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkDatabase();
