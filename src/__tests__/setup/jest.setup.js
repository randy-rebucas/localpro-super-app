/**
 * Jest Setup File
 * Runs before all tests to configure the test environment
 */

// Increase timeout for async operations
jest.setTimeout(30000);

// Suppress console errors for expected test scenarios
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress Winston logger output for expected test scenarios
  // This prevents noisy log output during test execution
  try {
    // Get logger after module is loaded
    const loggerModule = require('../../config/logger');
    
    if (loggerModule && typeof loggerModule.error === 'function') {
      const originalLoggerError = loggerModule.error;
      const originalLoggerWarn = loggerModule.warn;
      
      // Wrap logger methods to filter test noise
      loggerModule.error = function(...args) {
        const firstArg = args[0];
        const message = typeof firstArg === 'string' ? firstArg : 
                       (typeof firstArg === 'object' && firstArg !== null && firstArg.message) ? firstArg.message : '';
        
        // Suppress expected test errors
        const suppressPatterns = [
          'Send verification code error',
          'Database query error',
          'Twilio verification check error',
          'command find requires authentication',
          'Redis Client Error',
          'Redis connection',
          'Operation `logs.insertMany()` buffering timed out'
        ];
        
        if (suppressPatterns.some(pattern => message.includes(pattern))) {
          return; // Suppress expected test errors
        }
        
        return originalLoggerError.apply(this, args);
      };
      
      loggerModule.warn = function(...args) {
        const firstArg = args[0];
        const message = typeof firstArg === 'string' ? firstArg : 
                       (typeof firstArg === 'object' && firstArg !== null && firstArg.message) ? firstArg.message : '';
        
        // Suppress expected test warnings
        const suppressPatterns = [
          'Send verification code failed',
          'Verify code failed',
          'Verification code verification failed',
          'Redis',
          'MongoDB',
          'Test database not available',
          'Database disconnected',
          'HTTP Request' // Suppress request logging in tests
        ];
        
        if (suppressPatterns.some(pattern => message.includes(pattern))) {
          return; // Suppress expected test warnings
        }
        
        return originalLoggerWarn.apply(this, args);
      };
    }
  } catch (error) {
    // Logger might not be available yet, skip silently
  }

  // Suppress console errors for expected test scenarios
  console.error = (...args) => {
    const message = args[0];
    // Suppress expected test errors
    if (
      typeof message === 'string' &&
      (message.includes('Redis Client Error') ||
       message.includes('Redis connection') ||
       message.includes('Operation `logs.insertMany()` buffering timed out') ||
       message.includes('Server error:') ||
       message.includes('Test error') ||
       message.includes('Generic error') ||
       message.includes('Send verification code error') ||
       message.includes('Database query error'))
    ) {
      // Suppress these expected errors during testing
      return;
    }
    // Suppress error objects from error handler tests
    if (args.length > 0 && args[0] instanceof Error) {
      const errorMessage = args[0].message || '';
      if (errorMessage.includes('Generic error') || 
          errorMessage.includes('Test error') ||
          args.some(arg => typeof arg === 'string' && arg.includes('Server error:'))) {
        return;
      }
    }
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Redis') ||
       message.includes('MongoDB') ||
       message.includes('Test database not available') ||
       message.includes('Send verification code failed') ||
       message.includes('Verify code failed') ||
       message.includes('Verification code verification failed') ||
       message.includes('Database disconnected'))
    ) {
      // Suppress these expected warnings
      return;
    }
    originalWarn.apply(console, args);
  };
});

afterAll(() => {
  // Restore original console methods
  console.error = originalError;
  console.warn = originalWarn;
  
  // Clean up any active database transport timers
  try {
    const winston = require('winston');
    const logger = winston.loggers.get('default') || winston.createLogger();
    
    // Find and stop database transports
    if (logger.transports) {
      logger.transports.forEach(transport => {
        if (transport && transport.name === 'database' && transport.stopFlushTimer) {
          transport.stopFlushTimer();
          transport.cleanup && transport.cleanup();
        }
      });
    }
  } catch (error) {
    // Ignore cleanup errors
  }
});

// Global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock environment variables for tests
process.env.NODE_ENV = 'test'; // Force test environment
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-purposes-only';
process.env.LOG_DATABASE_ENABLED = 'false'; // Disable database logging in tests
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-test';
process.env.FORCE_EXIT = 'true'; // Force exit after tests to prevent hanging

