/**
 * Jest Test Setup
 * Global setup for all tests
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Use real mongoose with mongodb-memory-server in tests

// Global test timeout
jest.setTimeout(30000);

// Global variables
global.testTimeout = 30000;

// MongoDB Memory Server instance
let mongoServer;

// Setup before all tests
beforeAll(async () => {
  try {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'localpro-test'
      }
    });
    
    const mongoUri = mongoServer.getUri();
    
    // Connect to test database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Close database connection
    await mongoose.connection.close();
    
    // Stop MongoDB Memory Server
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('✅ Test database cleaned up');
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
});

// Cleanup after each test
afterEach(async () => {
  try {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('❌ Test cleanup error:', error);
  }
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (overrides = {}) => {
    const User = require('../src/models/User');
    const testUser = {
      phoneNumber: '+1234567890',
      role: 'client',
      isVerified: true,
      ...overrides
    };
    return await User.create(testUser);
  },
  
  // Create test JWT token
  createTestToken: (user) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },
  
  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate test data
  generateTestData: {
    phoneNumber: () => `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    email: () => `test${Math.random().toString(36).substr(2, 9)}@example.com`,
    objectId: () => new mongoose.Types.ObjectId()
  }
};

// Mock external services
jest.mock('../src/services/twilioService', () => ({
  sendVerificationCode: jest.fn().mockResolvedValue({ success: true, sid: 'test-sid' }),
  verifyCode: jest.fn().mockResolvedValue({ success: true, valid: true })
}));

jest.mock('../src/services/cloudinaryService', () => ({
  uploadImage: jest.fn().mockResolvedValue({
    success: true,
    url: 'https://test-cloudinary.com/test-image.jpg',
    publicId: 'test-public-id'
  }),
  deleteImage: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'test-message-id' })
}));

// Console suppression for tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Restore console after tests
afterAll(() => {
  global.console = originalConsole;
});