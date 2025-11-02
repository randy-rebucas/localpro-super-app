/**
 * Jest Global Teardown File
 * Runs after all tests to clean up resources
 * Note: This is a global teardown, not a test file, so afterAll is not available
 */

module.exports = async () => {
  // Clean up any database connections
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      try {
        await mongoose.connection.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    // Ignore if mongoose is not available
  }

  // Clean up any Redis connections
  try {
    const cacheService = require('../../services/cacheService');
    if (cacheService && typeof cacheService.close === 'function') {
      await cacheService.close();
    }
  } catch (error) {
    // Ignore cleanup errors
  }

  // Give time for any pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
};

