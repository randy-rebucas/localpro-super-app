const { AppLogger, logger } = require('../../../utils/logger');
const loggerConfig = require('../../../config/logger');

// Mock the logger config
jest.mock('../../../config/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn()
}));

describe('Logger Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AppLogger class', () => {
    test('should create instance with default context', () => {
      const appLogger = new AppLogger();
      expect(appLogger.context).toBe('App');
    });

    test('should create instance with custom context', () => {
      const appLogger = new AppLogger('Custom');
      expect(appLogger.context).toBe('Custom');
    });

    test('should create child logger', () => {
      const parent = new AppLogger('Parent');
      const child = parent.child('Child');
      
      expect(child.context).toBe('Parent:Child');
    });
  });

  describe('info', () => {
    test('should log info message', () => {
      logger.info('Test message', { key: 'value' });

      expect(loggerConfig.info).toHaveBeenCalledWith('Test message', {
        context: 'App',
        timestamp: expect.any(String),
        key: 'value'
      });
    });
  });

  describe('debug', () => {
    test('should log debug message', () => {
      logger.debug('Debug message', { key: 'value' });

      expect(loggerConfig.debug).toHaveBeenCalledWith('Debug message', {
        context: 'App',
        timestamp: expect.any(String),
        key: 'value'
      });
    });
  });

  describe('warn', () => {
    test('should log warning message', () => {
      logger.warn('Warning message', { key: 'value' });

      expect(loggerConfig.warn).toHaveBeenCalledWith('Warning message', {
        context: 'App',
        timestamp: expect.any(String),
        key: 'value'
      });
    });
  });

  describe('error', () => {
    test('should log error message', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error, { key: 'value' });

      expect(loggerConfig.error).toHaveBeenCalledWith('Error occurred', {
        context: 'App',
        timestamp: expect.any(String),
        key: 'value',
        error: {
          message: 'Test error',
          stack: expect.any(String),
          name: 'Error'
        }
      });
    });

    test('should log error without error object', () => {
      logger.error('Error occurred', null, { key: 'value' });

      expect(loggerConfig.error).toHaveBeenCalled();
    });
  });

  describe('http', () => {
    test('should log HTTP message', () => {
      logger.http('HTTP request', { method: 'GET' });

      expect(loggerConfig.http).toHaveBeenCalledWith('HTTP request', {
        context: 'App',
        timestamp: expect.any(String),
        method: 'GET'
      });
    });
  });

  describe('businessEvent', () => {
    test('should log business event', () => {
      logger.businessEvent('User Registered', { userId: '123' });

      expect(loggerConfig.info).toHaveBeenCalled();
    });
  });

  describe('performance', () => {
    test('should log performance metric', () => {
      logger.performance('Database Query', 150, { collection: 'users' });

      expect(loggerConfig.info).toHaveBeenCalled();
    });
  });

  describe('database', () => {
    test('should log database operation', () => {
      logger.database('find', 'users', 50, { query: 'test' });

      expect(loggerConfig.info).toHaveBeenCalled();
    });
  });

  describe('apiCall', () => {
    test('should log API call', () => {
      logger.apiCall('/api/users', 'GET', 200, 100, {});

      expect(loggerConfig.info).toHaveBeenCalled();
    });
  });

  describe('userAction', () => {
    test('should log user action', () => {
      logger.userAction('profile_update', 'user-id', {});

      expect(loggerConfig.info).toHaveBeenCalled();
    });
  });

  describe('authEvent', () => {
    test('should log auth event', () => {
      logger.authEvent('login', 'user-id', {});

      expect(loggerConfig.warn).toHaveBeenCalled();
    });
  });

  describe('paymentEvent', () => {
    test('should log payment event', () => {
      logger.paymentEvent('payment_processed', 100, 'USD', {});

      expect(loggerConfig.info).toHaveBeenCalled();
    });
  });

  describe('Convenience methods', () => {
    test('should export convenience methods', () => {
      const { info, debug, warn, error } = require('../../../utils/logger');
      
      expect(typeof info).toBe('function');
      expect(typeof debug).toBe('function');
      expect(typeof warn).toBe('function');
      expect(typeof error).toBe('function');
    });
  });
});

