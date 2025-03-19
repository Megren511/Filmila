const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://filmila.onrender.com/api'
    : 'http://localhost:8080/api',
  cdnUrl: process.env.NODE_ENV === 'production'
    ? 'https://d1k0enfou8eft6.cloudfront.net'
    : 'http://localhost:8080/uploads',
  frontendUrl: process.env.NODE_ENV === 'production'
    ? 'https://filmila-g8dn.onrender.com'
    : 'http://localhost:3000'
};

export default config;
