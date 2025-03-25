require('dotenv').config();
const app = require('./app');
const { db } = require('./db');

const PORT = process.env.PORT || 8080;

// Test database connection
async function testDbConnection() {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Start server
app.listen(PORT, async () => {
  const dbConnected = await testDbConnection();
  if (dbConnected) {
    console.log(`Server is running on port ${PORT}`);
  } else {
    console.error('Server started but database connection failed');
  }
});
