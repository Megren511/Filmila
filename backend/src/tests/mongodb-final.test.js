require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Session = require('../models/session.model');
const RefreshToken = require('../models/refreshToken.model');
const EmailLog = require('../models/emailLog.model');

async function testFinalMongoDBSetup() {
  try {
    console.log('Testing Final MongoDB Setup...');
    await mongoose.connect(process.env.MONGODB_LOCAL_URI);
    console.log('✓ Connected to MongoDB Atlas\n');

    // Test 1: Verify Indexes
    console.log('Verifying Collection Indexes...');
    const collections = {
      users: User,
      sessions: Session,
      refreshTokens: RefreshToken,
      emailLogs: EmailLog
    };

    for (const [name, model] of Object.entries(collections)) {
      const indexes = await model.collection.getIndexes();
      console.log(`${name} indexes:`, Object.keys(indexes));
    }

    // Test 2: Performance Test with Indexes
    console.log('\nTesting Query Performance with New Indexes...');
    
    // Create test user
    const testUser = new User({
      email: 'performance.test@filmila.com',
      passwordHash: await bcrypt.hash('TestPass123!', 10),
      firstName: 'Performance',
      lastName: 'Test',
      role: 'user',
      emailVerified: true
    });
    await testUser.save();

    // Create multiple sessions
    const sessions = await Promise.all([...Array(5)].map((_, i) => {
      return new Session({
        userId: testUser._id,
        deviceInfo: `Device ${i}`,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
        lastActivity: new Date(Date.now() - i * 60000)
      }).save();
    }));

    // Create multiple email logs
    const emailLogs = await Promise.all([...Array(5)].map((_, i) => {
      return new EmailLog({
        recipient: testUser.email,
        subject: `Test Email ${i}`,
        messageId: `test-${Date.now()}-${i}`,
        status: i % 2 === 0 ? 'sent' : 'failed',
        metadata: new Map([
          ['template', 'test'],
          ['attempt', i]
        ])
      }).save();
    }));

    // Test 3: Query Performance Tests
    console.log('\nRunning Performance Tests...');

    // Test user sessions query
    console.time('Find User Sessions');
    const userSessions = await Session.find({ 
      userId: testUser._id 
    }).sort({ 
      lastActivity: -1 
    });
    console.timeEnd('Find User Sessions');
    console.log('✓ Found', userSessions.length, 'sessions');

    // Test email logs query
    console.time('Find User Emails');
    const userEmails = await EmailLog.find({ 
      recipient: testUser.email 
    }).sort({ 
      createdAt: -1 
    });
    console.timeEnd('Find User Emails');
    console.log('✓ Found', userEmails.length, 'email logs');

    // Test 4: Verify Metadata Storage
    console.log('\nVerifying Metadata Storage...');
    const emailLog = emailLogs[0];
    console.log('Email Log Metadata:', Object.fromEntries(emailLog.metadata));

    // Test 5: Cleanup
    console.log('\nCleaning up test data...');
    await Promise.all([
      User.deleteOne({ _id: testUser._id }),
      Session.deleteMany({ userId: testUser._id }),
      EmailLog.deleteMany({ recipient: testUser.email })
    ]);
    console.log('✓ Cleanup successful');

    // Test 6: Verify Database State
    console.log('\nFinal Database Statistics:');
    const stats = await mongoose.connection.db.stats();
    console.log('- Collections:', stats.collections);
    console.log('- Total Documents:', stats.objects);
    console.log('- Indexes:', stats.indexes);
    console.log('- Average Object Size:', Math.round(stats.avgObjSize || 0), 'bytes');

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

testFinalMongoDBSetup();
