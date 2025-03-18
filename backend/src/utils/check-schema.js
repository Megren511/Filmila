require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? {
        rejectUnauthorized: false
    } : false
});

async function checkSchema() {
    const client = await pool.connect();
    try {
        // Get table columns
        const result = await client.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `);
        
        console.log('Users table schema:');
        console.table(result.rows);
    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        client.release();
        pool.end();
    }
}

checkSchema();
