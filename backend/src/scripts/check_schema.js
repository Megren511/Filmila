require('dotenv').config();
const { db } = require('../db');

async function checkSchema() {
  try {
    console.log('Checking users table schema...');
    const result = await db.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nUsers table columns:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkSchema();
