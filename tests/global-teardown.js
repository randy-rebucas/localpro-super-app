/**
 * Global Test Teardown
 * 
 * This file runs once after all tests complete.
 * It cleans up the global test environment.
 */

const mongoose = require('mongoose');

module.exports = async () => {
  // Close any remaining connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  console.log('🧹 Global test teardown completed');
};
