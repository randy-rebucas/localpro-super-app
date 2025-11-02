/**
 * Logger Configuration Tests
 */

// Set environment to disable database logging
process.env.LOG_DATABASE_ENABLED = 'false';

describe('Logger Configuration', () => {
  let logger;

  beforeAll(() => {
    // Clear module cache to ensure fresh import
    delete require.cache[require.resolve('../../config/logger')];
    logger = require('../../config/logger');
  });

  it('should have logger module', () => {
    expect(logger).toBeDefined();
  });

  it('should have log methods', () => {
    // Logger should have standard methods
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should log messages without throwing', () => {
    // Should not throw errors
    expect(() => {
      logger.info('Test log message');
      logger.error('Test error message');
      logger.warn('Test warning message');
    }).not.toThrow();
  });

  afterAll(() => {
    // Clean up any timers
    jest.clearAllTimers();
  });
});

