const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://filmila-webapp.onrender.com/api'
    : 'http://localhost:8080/api'
};

export default config;
