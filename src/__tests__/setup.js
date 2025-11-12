// Jest setup file
// This file runs before all tests

// Set test environment variables FIRST (before any imports)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-at-least-32-chars';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-test';
process.env.LOG_LEVEL = 'error'; // Only show errors during tests
process.env.LOG_DATABASE_ENABLED = 'false'; // Disable database logging during tests

// Increase timeout for async operations
jest.setTimeout(10000);

