const app = require('./app');
const config = require('./config');

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API prefix: ${config.apiPrefix}`);
  console.log(`Environment: ${config.env}`);
});
