require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? {
        rejectUnauthorized: false
    } : false
});

async function createTestUser() {
    const client = await pool.connect();
    try {
        // Check if test user exists
        const checkResult = await client.query(
            'SELECT * FROM users WHERE email = $1',
            ['test@example.com']
        );

        if (checkResult.rows.length > 0) {
            console.log('Test user already exists');
            return;
        }

        // Create test user
        const hashedPassword = await bcrypt.hash('testpassword', 10);
        await client.query(
            'INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
            ['test@example.com', hashedPassword, 'Test User', 'admin']
        );

        console.log('Test user created successfully');
    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        client.release();
    }
}

createTestUser().finally(() => pool.end());
