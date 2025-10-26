/**
 * Global Test Setup
 * 
 * This file runs once before all tests start.
 * It sets up the global test environment.
 */

const mongoose = require('mongoose');

module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
  
  // Ensure no existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  console.log('🧪 Global test setup completed');
};
