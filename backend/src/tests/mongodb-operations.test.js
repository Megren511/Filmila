require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Session = require('../models/session.model');
const RefreshToken = require('../models/refreshToken.model');
const EmailLog = require('../models/emailLog.model');

async function testMongoDBOperations() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_LOCAL_URI);
    console.log('✓ Connected to MongoDB Atlas\n');

    // Test 1: Check Indexes
    console.log('Testing Database Indexes...');
    const userIndexes = await User.collection.getIndexes();
    console.log('User Collection Indexes:', Object.keys(userIndexes));
    
    const sessionIndexes = await Session.collection.getIndexes();
    console.log('Session Collection Indexes:', Object.keys(sessionIndexes));
    
    const tokenIndexes = await RefreshToken.collection.getIndexes();
    console.log('RefreshToken Collection Indexes:', Object.keys(tokenIndexes));
    
    const emailLogIndexes = await EmailLog.collection.getIndexes();
    console.log('EmailLog Collection Indexes:', Object.keys(emailLogIndexes));

    // Test 2: User Registration and Authentication
    console.log('\nTesting User Operations...');
    const password = 'TestPass123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const testUser = new User({
      email: 'test.user@filmila.com',
      passwordHash: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      emailVerified: true
    });
    
    await testUser.save();
    console.log('✓ User created successfully');

    // Test 3: Session Management
    console.log('\nTesting Session Management...');
    const testSession = new Session({
      userId: testUser._id,
      deviceInfo: 'Test Device',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Browser',
      lastActivity: new Date()
    });
    
    await testSession.save();
    console.log('✓ Session created successfully');

    // Test 4: Refresh Token Management
    console.log('\nTesting Refresh Token Management...');
    const testToken = new RefreshToken({
      token: 'test-refresh-token-' + Date.now(),
      userId: testUser._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    await testToken.save();
    console.log('✓ Refresh token created successfully');

    // Test 5: Email Logging
    console.log('\nTesting Email Logging...');
    const testEmailLog = new EmailLog({
      recipient: testUser.email,
      subject: 'Test Email',
      messageId: 'test-' + Date.now(),
      status: 'sent',
      metadata: {
        template: 'welcome',
        variables: { name: testUser.firstName }
      }
    });
    
    await testEmailLog.save();
    console.log('✓ Email log created successfully');

    // Test 6: Query Performance
    console.log('\nTesting Query Performance...');
    console.time('User Query');
    const foundUser = await User.findOne({ email: testUser.email })
      .select('email firstName lastName role');
    console.timeEnd('User Query');
    console.log('✓ User query successful:', foundUser.email);

    console.time('Session Query');
    const userSessions = await Session.find({ userId: testUser._id })
      .sort({ lastActivity: -1 })
      .limit(5);
    console.timeEnd('Session Query');
    console.log('✓ Session query successful:', userSessions.length, 'sessions found');

    console.time('Token Query');
    const validTokens = await RefreshToken.find({
      userId: testUser._id,
      expiresAt: { $gt: new Date() }
    });
    console.timeEnd('Token Query');
    console.log('✓ Token query successful:', validTokens.length, 'valid tokens found');

    // Test 7: Cleanup
    console.log('\nCleaning up test data...');
    await Promise.all([
      User.deleteOne({ _id: testUser._id }),
      Session.deleteMany({ userId: testUser._id }),
      RefreshToken.deleteMany({ userId: testUser._id }),
      EmailLog.deleteMany({ recipient: testUser.email })
    ]);
    console.log('✓ Test data cleanup successful');

    // Test 8: Database Stats
    console.log('\nDatabase Statistics:');
    const stats = await mongoose.connection.db.stats();
    console.log('- Collections:', stats.collections);
    console.log('- Total Documents:', stats.objects);
    console.log('- Storage Size:', Math.round(stats.storageSize / 1024 / 1024), 'MB');
    console.log('- Indexes:', stats.indexes);
    console.log('- Index Size:', Math.round(stats.indexSize / 1024 / 1024), 'MB');

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

testMongoDBOperations();
