const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://filmila-api.onrender.com/api'
    : 'http://localhost:8080/api',
  cdnUrl: process.env.NODE_ENV === 'production'
    ? 'https://d1k0enfou8eft6.cloudfront.net'
    : 'http://localhost:8080/uploads'
};

export default config;
