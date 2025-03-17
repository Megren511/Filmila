const config = {
  development: {
    API_BASE_URL: 'http://localhost:8080/api',
    CLOUDFRONT_URL: process.env.REACT_APP_CLOUDFRONT_URL || 'http://localhost:8080',
  },
  production: {
    API_BASE_URL: 'https://filmila-webapp.onrender.com/api',
    CLOUDFRONT_URL: process.env.REACT_APP_CLOUDFRONT_URL,
  },
};

const environment = process.env.NODE_ENV || 'development';
export const { API_BASE_URL, CLOUDFRONT_URL } = config[environment];
