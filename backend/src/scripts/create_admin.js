require('dotenv').config();
const { db } = require('../db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // Add status column if it doesn't exist
    console.log('Adding status column if needed...');
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
    `);

    // Check if admin exists
    console.log('Checking for admin user...');
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@filmila.com']
    );

    if (result.rows.length > 0) {
      console.log('Admin user already exists:', {
        id: result.rows[0].id,
        email: result.rows[0].email,
        full_name: result.rows[0].full_name,
        role: result.rows[0].role,
        status: result.rows[0].status
      });
      return;
    }

    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    const newAdmin = await db.query(
      `INSERT INTO users (full_name, email, password_hash, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      ['Admin User', 'admin@filmila.com', hashedPassword, 'admin', 'active']
    );

    console.log('Admin user created successfully:', {
      id: newAdmin.rows[0].id,
      email: newAdmin.rows[0].email,
      full_name: newAdmin.rows[0].full_name,
      role: newAdmin.rows[0].role,
      status: newAdmin.rows[0].status
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

createAdmin();
