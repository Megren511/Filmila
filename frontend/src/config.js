const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://filmila.onrender.com/api'
    : 'http://localhost:8080/api',
  cdnUrl: process.env.NODE_ENV === 'production'
    ? 'https://d1wp6m56sqw74a.cloudfront.net'
    : 'http://localhost:8080/uploads'
};

export default config;
