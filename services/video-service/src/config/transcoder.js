const AWS = require('aws-sdk');

// Initialize Elastic Transcoder
const elasticTranscoder = new AWS.ElasticTranscoder({
  region: process.env.AWS_REGION
});

// Predefined presets for different video qualities
const PRESETS = {
  // HLS Adaptive Bitrate Streaming
  HLS: {
    '1080p': '1351620000001-200015', // 1080p
    '720p': '1351620000001-200010',  // 720p
    '480p': '1351620000001-200005',  // 480p
  },
  // Thumbnails
  THUMBNAIL: '1351620000001-000001'
};

// Pipeline ID from environment variables
const pipelineId = process.env.ELASTIC_TRANSCODER_PIPELINE_ID;

module.exports = {
  elasticTranscoder,
  PRESETS,
  pipelineId
};
