const AWS = require('aws-sdk');

// AWS Configuration
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
};

// Initialize AWS
AWS.config.update(awsConfig);

// Create S3 instance
const s3 = new AWS.S3();

// Create CloudFront instance
const cloudfront = new AWS.CloudFront();

module.exports = {
  s3,
  cloudfront,
  bucketName: process.env.S3_BUCKET_NAME,
  cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN,
  cloudfrontDistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID
};
