const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://filmila-webapp.onrender.com/api'
    : 'http://localhost:8080/api',
  cdnUrl: process.env.NODE_ENV === 'production'
    ? 'https://d1k0enfou8eft6.cloudfront.net'
    : 'http://localhost:8080/uploads',
  frontendUrl: process.env.NODE_ENV === 'production'
    ? 'https://filmila.com'
    : 'http://localhost:3000'
};

export default config;
