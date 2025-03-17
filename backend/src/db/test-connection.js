const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://filmila_db_user:0KPw6xRyDXmM0nG7Zy90R7T7hOm8dxbh@dpg-cv91v09c1ekc73e2v57g-a.singapore-postgres.render.com/filmila_db',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database!');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);
    
    // Test creating a table
    await client.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        test_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Successfully created test table!');
    
    // Insert a test row
    await client.query('INSERT INTO connection_test DEFAULT VALUES');
    console.log('Successfully inserted test data!');
    
    // Query the test data
    const testResult = await client.query('SELECT * FROM connection_test ORDER BY test_timestamp DESC LIMIT 1');
    console.log('Test data:', testResult.rows[0]);
    
    client.release();
    await pool.end();
    
    console.log('Database connection test completed successfully!');
  } catch (err) {
    console.error('Error testing database connection:', err);
    process.exit(1);
  }
}

testConnection();
