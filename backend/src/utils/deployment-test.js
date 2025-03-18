require('dotenv').config();
const fetch = require('node-fetch');

const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://filmila-api.onrender.com'
    : `http://localhost:${process.env.PORT || 8080}`;

async function testDeployment() {
    console.log('🚀 Starting deployment tests...\n');
    const tests = [];

    // Test 1: Health Check
    try {
        const healthResponse = await fetch(`${API_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health Check:', healthData);
        tests.push({ name: 'Health Check', status: 'passed' });
    } catch (error) {
        console.error('❌ Health Check Failed:', error.message);
        tests.push({ name: 'Health Check', status: 'failed', error: error.message });
    }

    // Test 2: Authentication
    let authToken;
    try {
        const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: process.env.TEST_USER_EMAIL || 'test@example.com',
                password: process.env.TEST_USER_PASSWORD || 'testpassword'
            })
        });
        const loginData = await loginResponse.json();
        
        if (loginResponse.ok && loginData.token) {
            authToken = loginData.token;
            console.log('✅ Authentication: Successfully logged in');
            tests.push({ name: 'Authentication', status: 'passed' });
        } else {
            throw new Error(loginData.error || 'Login failed');
        }
    } catch (error) {
        console.error('❌ Authentication Failed:', error.message);
        tests.push({ name: 'Authentication', status: 'failed', error: error.message });
    }

    // Test 3: Video List API
    if (authToken) {
        try {
            const videosResponse = await fetch(`${API_URL}/api/videos/list`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const videosData = await videosResponse.json();
            console.log('✅ Video List API:', videosData);
            tests.push({ name: 'Video List API', status: 'passed' });
        } catch (error) {
            console.error('❌ Video List API Failed:', error.message);
            tests.push({ name: 'Video List API', status: 'failed', error: error.message });
        }
    }

    // Test 4: CloudFront Access
    try {
        const testUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/test-access`;
        const cloudfrontResponse = await fetch(testUrl);
        
        // Even if we get a 403 (forbidden), it means CloudFront is responding
        if (cloudfrontResponse.status === 403 || cloudfrontResponse.ok) {
            console.log('✅ CloudFront Access: Distribution is responding');
            tests.push({ name: 'CloudFront Access', status: 'passed' });
        } else {
            throw new Error(`Unexpected status: ${cloudfrontResponse.status}`);
        }
    } catch (error) {
        console.error('❌ CloudFront Access Failed:', error.message);
        tests.push({ name: 'CloudFront Access', status: 'failed', error: error.message });
    }

    // Summary
    console.log('\n📊 Test Summary:');
    const passed = tests.filter(t => t.status === 'passed').length;
    const total = tests.length;
    console.log(`Passed: ${passed}/${total} tests`);
    tests.forEach(test => {
        const icon = test.status === 'passed' ? '✅' : '❌';
        console.log(`${icon} ${test.name}: ${test.status}`);
        if (test.error) {
            console.log(`   Error: ${test.error}`);
        }
    });
}

testDeployment().catch(console.error);
