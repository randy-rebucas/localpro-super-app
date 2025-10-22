const mongoose = require('mongoose');
require('dotenv').config();

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app');
    console.log('✅ Database connected successfully:', conn.connection.host);
    
    // Test a simple query
    const User = require('./src/models/User');
    const userCount = await User.countDocuments();
    console.log('✅ User count:', userCount);
    
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testDatabaseConnection();
