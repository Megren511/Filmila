require('dotenv').config();
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

async function testCloudFrontSetup() {
    try {
        // List objects in the bucket
        const data = await s3.listObjects({
            Bucket: process.env.AWS_S3_BUCKET,
            MaxKeys: 5
        }).promise();
        
        console.log('S3 Bucket Contents:');
        if (data.Contents.length === 0) {
            console.log('No files found in bucket');
        } else {
            data.Contents.forEach(file => {
                // Generate CloudFront URL for each file
                const s3Path = file.Key;
                const cloudfrontUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${s3Path}`;
                
                console.log('\nFile:', file.Key);
                console.log('Size:', Math.round(file.Size / 1024), 'KB');
                console.log('CloudFront URL:', cloudfrontUrl);
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCloudFrontSetup();
