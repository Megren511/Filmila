const AWS = require('aws-sdk');
const path = require('path');
const crypto = require('crypto');

class VideoService {
    constructor() {
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        });

        this.s3 = new AWS.S3();
        this.bucket = process.env.AWS_S3_BUCKET;
        this.cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
    }

    // Generate a unique filename
    generateUniqueFileName(originalName) {
        const timestamp = Date.now();
        const hash = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(originalName);
        const sanitizedName = path.basename(originalName, ext)
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();
        return `${sanitizedName}-${timestamp}-${hash}${ext}`;
    }

    // Get signed URL for upload
    async getSignedUploadUrl(fileName, fileType) {
        const uniqueFileName = this.generateUniqueFileName(fileName);
        const params = {
            Bucket: this.bucket,
            Key: uniqueFileName,
            ContentType: fileType,
            Expires: 600, // URL expires in 10 minutes
        };

        try {
            const signedUrl = await this.s3.getSignedUrlPromise('putObject', params);
            return {
                signedUrl,
                fileName: uniqueFileName,
                cloudfrontUrl: `https://${this.cloudfrontDomain}/${encodeURIComponent(uniqueFileName)}`
            };
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw error;
        }
    }

    // Get CloudFront URL for video
    getVideoUrl(fileName) {
        return `https://${this.cloudfrontDomain}/${encodeURIComponent(fileName)}`;
    }

    // List all videos
    async listVideos() {
        try {
            const params = {
                Bucket: this.bucket,
                MaxKeys: 100
            };

            const data = await this.s3.listObjects(params).promise();
            return data.Contents.map(file => ({
                key: file.Key,
                size: file.Size,
                lastModified: file.LastModified,
                url: this.getVideoUrl(file.Key)
            }));
        } catch (error) {
            console.error('Error listing videos:', error);
            throw error;
        }
    }

    // Delete video
    async deleteVideo(fileName) {
        try {
            await this.s3.deleteObject({
                Bucket: this.bucket,
                Key: fileName
            }).promise();
            return true;
        } catch (error) {
            console.error('Error deleting video:', error);
            throw error;
        }
    }
}

module.exports = new VideoService();
