const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  cdnUrl: process.env.REACT_APP_CLOUDFRONT_DOMAIN
    ? `https://${process.env.REACT_APP_CLOUDFRONT_DOMAIN}`
    : 'http://localhost:8080/uploads',
  frontendUrl: process.env.PUBLIC_URL || 'http://localhost:3000'
};

export default config;
