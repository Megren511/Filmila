require('dotenv').config();
const { db } = require('../index');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '20250325_add_reset_token_fields.sql'),
      'utf8'
    );
    
    await db.query(sql);
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
