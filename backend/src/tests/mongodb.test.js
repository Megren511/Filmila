require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const Session = require('../models/session.model');
const EmailLog = require('../models/emailLog.model');

async function testMongoDBConnection() {
  try {
    console.log('Testing MongoDB Connection...');
    console.log('Connection URI:', process.env.MONGODB_LOCAL_URI);
    
    await mongoose.connect(process.env.MONGODB_LOCAL_URI);
    console.log('✓ Successfully connected to MongoDB Atlas');

    // Test User Model
    console.log('\nTesting User Model...');
    const testUser = new User({
      email: 'test@filmila.com',
      passwordHash: 'testHash123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      emailVerified: true
    });
    await testUser.validate();
    console.log('✓ User model validation successful');

    // Test Session Model
    console.log('\nTesting Session Model...');
    const testSession = new Session({
      userId: testUser._id,
      deviceInfo: 'Test Device',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Browser'
    });
    await testSession.validate();
    console.log('✓ Session model validation successful');

    // Test RefreshToken Model
    console.log('\nTesting RefreshToken Model...');
    const testToken = new RefreshToken({
      token: 'test-refresh-token',
      userId: testUser._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await testToken.validate();
    console.log('✓ RefreshToken model validation successful');

    // Test EmailLog Model
    console.log('\nTesting EmailLog Model...');
    const testEmailLog = new EmailLog({
      recipient: 'test@filmila.com',
      subject: 'Test Email',
      messageId: 'test-123',
      status: 'sent'
    });
    await testEmailLog.validate();
    console.log('✓ EmailLog model validation successful');

    // List all collections
    console.log('\nListing collections in database...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Clean up any test data
    await Promise.all([
      User.deleteMany({ email: 'test@filmila.com' }),
      Session.deleteMany({ deviceInfo: 'Test Device' }),
      RefreshToken.deleteMany({ token: 'test-refresh-token' }),
      EmailLog.deleteMany({ messageId: 'test-123' })
    ]);
    console.log('\n✓ Test cleanup successful');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}:`, error.errors[key].message);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testMongoDBConnection();
