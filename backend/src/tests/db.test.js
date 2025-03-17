const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.mongodb' });

const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const Session = require('../models/session.model');
const EmailLog = require('../models/emailLog.model');

async function testConnection() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_LOCAL_URI);
    console.log('Successfully connected to MongoDB Atlas');

    // Test model creation
    console.log('\nTesting models...');
    
    // Create a test user
    const testUser = await User.create({
      email: 'test@example.com',
      passwordHash: 'testHash123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      emailVerified: true
    });
    console.log('✓ User model working');

    // Create a test session
    await Session.create({
      userId: testUser._id,
      deviceInfo: 'Test Device',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent'
    });
    console.log('✓ Session model working');

    // Create a test refresh token
    await RefreshToken.create({
      token: 'testToken123',
      userId: testUser._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    console.log('✓ RefreshToken model working');

    // Create a test email log
    await EmailLog.create({
      recipient: 'test@example.com',
      subject: 'Test Email',
      messageId: 'test123',
      status: 'sent'
    });
    console.log('✓ EmailLog model working');

    // Clean up test data
    await User.deleteMany({});
    await Session.deleteMany({});
    await RefreshToken.deleteMany({});
    await EmailLog.deleteMany({});
    console.log('\nTest data cleaned up successfully');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB Atlas');
  }
}

testConnection();
