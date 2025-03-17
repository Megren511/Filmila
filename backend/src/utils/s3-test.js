require('dotenv').config();
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

async function testS3Connection() {
    try {
        // List all objects in the bucket
        const data = await s3.listObjects({
            Bucket: process.env.AWS_S3_BUCKET,
            MaxKeys: 1
        }).promise();
        
        console.log('Successfully connected to S3!');
        console.log('Bucket:', process.env.AWS_S3_BUCKET);
        console.log('Region:', process.env.AWS_REGION);
        console.log('Sample response:', data);
    } catch (error) {
        console.error('Error connecting to S3:', error.message);
    }
}

testS3Connection();
