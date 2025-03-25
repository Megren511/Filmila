require('dotenv').config();
const { db } = require('../db');
const bcrypt = require('bcryptjs');

async function checkAndCreateAdmin() {
    try {
        // Check if admin exists
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            ['admin@filmila.com']
        );

        if (result.rows.length === 0) {
            // Create admin user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Admin@123', salt);

            await db.query(
                `INSERT INTO users (
                    full_name,
                    email,
                    password_hash,
                    role,
                    status,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, NOW())`,
                [
                    'Admin User',
                    'admin@filmila.com',
                    hashedPassword,
                    'admin',
                    'active'
                ]
            );
            console.log('Admin user created successfully');
        } else {
            // Update existing admin to ensure correct role
            await db.query(
                'UPDATE users SET role = $1 WHERE email = $2',
                ['admin', 'admin@filmila.com']
            );
            console.log('Admin user role updated successfully');
        }

        // Verify admin user
        const adminUser = await db.query(
            'SELECT id, email, role FROM users WHERE email = $1',
            ['admin@filmila.com']
        );
        console.log('Admin user details:', adminUser.rows[0]);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkAndCreateAdmin();
