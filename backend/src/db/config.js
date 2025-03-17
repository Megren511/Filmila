const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use MongoDB for local development
    const mongoURI = process.env.MONGODB_LOCAL_URI;
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB database');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
