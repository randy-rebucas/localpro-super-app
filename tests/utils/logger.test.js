// Mock the config logger first
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
  logBusinessEvent: jest.fn(),
  logSecurityEvent: jest.fn(),
  logPerformance: jest.fn()
}));

const { AppLogger, logger } = require('../../src/utils/logger');
const configLogger = require('../../src/config/logger');

describe('AppLogger', () => {
  let appLogger;

  beforeEach(() => {
    appLogger = new AppLogger('TestContext');
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default context', () => {
      const defaultLogger = new AppLogger();
      expect(defaultLogger.context).toBe('App');
    });

    it('should initialize with custom context', () => {
      expect(appLogger.context).toBe('TestContext');
    });
  });

  describe('child', () => {
    it('should create child logger with combined context', () => {
      const childLogger = appLogger.child('ChildContext');
      
      expect(childLogger).toBeInstanceOf(AppLogger);
      expect(childLogger.context).toBe('TestContext:ChildContext');
    });
  });

  describe('info', () => {
    it('should log info message with context and timestamp', () => {
      const message = 'Test info message';
      const data = { userId: 123 };

      appLogger.info(message, data);

      expect(configLogger.info).toHaveBeenCalledWith(message, {
        context: 'TestContext',
        timestamp: expect.any(String),
        userId: 123
      });
    });

    it('should log info message without additional data', () => {
      const message = 'Simple info message';

      appLogger.info(message);

      expect(configLogger.info).toHaveBeenCalledWith(message, {
        context: 'TestContext',
        timestamp: expect.any(String)
      });
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      const message = 'Debug message';
      const data = { debugInfo: 'test' };

      appLogger.debug(message, data);

      expect(configLogger.debug).toHaveBeenCalledWith(message, {
        context: 'TestContext',
        timestamp: expect.any(String),
        debugInfo: 'test'
      });
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      const message = 'Warning message';
      const data = { warningType: 'deprecated' };

      appLogger.warn(message, data);

      expect(configLogger.warn).toHaveBeenCalledWith(message, {
        context: 'TestContext',
        timestamp: expect.any(String),
        warningType: 'deprecated'
      });
    });
  });

  describe('error', () => {
    it('should log error message with error object', () => {
      const message = 'Error occurred';
      const error = new Error('Test error');
      const data = { userId: 123 };

      appLogger.error(message, error, data);

      expect(configLogger.error).toHaveBeenCalledWith(message, {
        context: 'TestContext',
        timestamp: expect.any(String),
        userId: 123,
        error: {
          message: 'Test error',
          stack: expect.any(String),
          name: 'Error'
        }
      });
    });

    it('should log error message without error object', () => {
      const message = 'Error occurred';
      const data = { errorCode: 'E001' };

      appLogger.error(message, null, data);

      expect(configLogger.error).toHaveBeenCalledWith(message, {
        context: 'TestContext',
        timestamp: expect.any(String),
        errorCode: 'E001'
      });
    });
  });

  describe('http', () => {
    it('should log HTTP message', () => {
      const message = 'HTTP request';
      const data = { method: 'GET', url: '/api/test' };

      appLogger.http(message, data);

      expect(configLogger.http).toHaveBeenCalledWith(message, {
        context: 'TestContext',
        timestamp: expect.any(String),
        method: 'GET',
        url: '/api/test'
      });
    });
  });

  describe('businessEvent', () => {
    it('should log business event', () => {
      const event = 'User Registration';
      const data = { userId: 123, email: 'test@example.com' };

      appLogger.businessEvent(event, data);

      expect(configLogger.logBusinessEvent).toHaveBeenCalledWith(event, {
        context: 'TestContext',
        userId: 123,
        email: 'test@example.com'
      });
    });
  });

  describe('securityEvent', () => {
    it('should log security event', () => {
      const event = 'Failed Login';
      const data = { ip: '192.168.1.1', attempts: 3 };

      appLogger.securityEvent(event, data);

      expect(configLogger.logSecurityEvent).toHaveBeenCalledWith(event, {
        context: 'TestContext',
        ip: '192.168.1.1',
        attempts: 3
      });
    });
  });

  describe('performance', () => {
    it('should log performance metrics', () => {
      const operation = 'Database Query';
      const duration = 150;
      const metadata = { table: 'users', query: 'SELECT * FROM users' };

      appLogger.performance(operation, duration, metadata);

      expect(configLogger.logPerformance).toHaveBeenCalledWith(operation, duration, {
        context: 'TestContext',
        table: 'users',
        query: 'SELECT * FROM users'
      });
    });
  });

  describe('database', () => {
    it('should log database operation', () => {
      const operation = 'find';
      const collection = 'users';
      const duration = 50;
      const metadata = { query: { status: 'active' } };

      appLogger.database(operation, collection, duration, metadata);

      expect(configLogger.logPerformance).toHaveBeenCalledWith('DB:find', duration, {
        context: 'TestContext',
        collection: 'users',
        operation: 'find',
        query: { status: 'active' }
      });
    });
  });

  describe('apiCall', () => {
    it('should log API call', () => {
      const url = '/api/users';
      const method = 'POST';
      const statusCode = 201;
      const duration = 200;
      const metadata = { userId: 123 };

      appLogger.apiCall(url, method, statusCode, duration, metadata);

      expect(configLogger.logPerformance).toHaveBeenCalledWith('API:POST', duration, {
        context: 'TestContext',
        url: '/api/users',
        method: 'POST',
        statusCode: 201,
        userId: 123
      });
    });
  });

  describe('userAction', () => {
    it('should log user action', () => {
      const action = 'Profile Update';
      const userId = 123;
      const metadata = { field: 'email' };

      appLogger.userAction(action, userId, metadata);

      expect(configLogger.logBusinessEvent).toHaveBeenCalledWith('User Action', {
        context: 'TestContext',
        action: 'Profile Update',
        userId: 123,
        field: 'email'
      });
    });
  });

  describe('authEvent', () => {
    it('should log authentication event', () => {
      const event = 'Login';
      const userId = 123;
      const metadata = { method: 'password' };

      appLogger.authEvent(event, userId, metadata);

      expect(configLogger.logSecurityEvent).toHaveBeenCalledWith('Auth:Login', {
        context: 'TestContext',
        userId: 123,
        method: 'password'
      });
    });
  });

  describe('paymentEvent', () => {
    it('should log payment event', () => {
      const event = 'Payment Completed';
      const amount = 100.50;
      const currency = 'USD';
      const metadata = { paymentMethod: 'credit_card' };

      appLogger.paymentEvent(event, amount, currency, metadata);

      expect(configLogger.logBusinessEvent).toHaveBeenCalledWith('Payment', {
        context: 'TestContext',
        event: 'Payment Completed',
        amount: 100.50,
        currency: 'USD',
        paymentMethod: 'credit_card'
      });
    });
  });

  describe('bookingEvent', () => {
    it('should log booking event', () => {
      const event = 'Booking Created';
      const bookingId = 'booking-123';
      const metadata = { serviceId: 'service-456' };

      appLogger.bookingEvent(event, bookingId, metadata);

      expect(configLogger.logBusinessEvent).toHaveBeenCalledWith('Booking', {
        context: 'TestContext',
        event: 'Booking Created',
        bookingId: 'booking-123',
        serviceId: 'service-456'
      });
    });
  });

  describe('marketplaceEvent', () => {
    it('should log marketplace event', () => {
      const event = 'Product Viewed';
      const productId = 'product-789';
      const metadata = { category: 'electronics' };

      appLogger.marketplaceEvent(event, productId, metadata);

      expect(configLogger.logBusinessEvent).toHaveBeenCalledWith('Marketplace', {
        context: 'TestContext',
        event: 'Product Viewed',
        productId: 'product-789',
        category: 'electronics'
      });
    });
  });

  describe('academyEvent', () => {
    it('should log academy event', () => {
      const event = 'Course Enrolled';
      const courseId = 'course-101';
      const userId = 123;
      const metadata = { progress: 0 };

      appLogger.academyEvent(event, courseId, userId, metadata);

      expect(configLogger.logBusinessEvent).toHaveBeenCalledWith('Academy', {
        context: 'TestContext',
        event: 'Course Enrolled',
        courseId: 'course-101',
        userId: 123,
        progress: 0
      });
    });
  });

  describe('referralEvent', () => {
    it('should log referral event', () => {
      const event = 'Referral Created';
      const referrerId = 123;
      const refereeId = 456;
      const metadata = { reward: 10 };

      appLogger.referralEvent(event, referrerId, refereeId, metadata);

      expect(configLogger.logBusinessEvent).toHaveBeenCalledWith('Referral', {
        context: 'TestContext',
        event: 'Referral Created',
        referrerId: 123,
        refereeId: 456,
        reward: 10
      });
    });
  });

  describe('communicationEvent', () => {
    it('should log communication event', () => {
      const event = 'Email Sent';
      const channel = 'email';
      const metadata = { template: 'welcome' };

      appLogger.communicationEvent(event, channel, metadata);

      expect(configLogger.logBusinessEvent).toHaveBeenCalledWith('Communication', {
        context: 'TestContext',
        event: 'Email Sent',
        channel: 'email',
        template: 'welcome'
      });
    });
  });

  describe('analyticsEvent', () => {
    it('should log analytics event', () => {
      const event = 'Page View';
      const data = { page: '/dashboard', sessionId: 'session-123' };

      appLogger.analyticsEvent(event, data);

      expect(configLogger.logBusinessEvent).toHaveBeenCalledWith('Analytics', {
        context: 'TestContext',
        event: 'Page View',
        page: '/dashboard',
        sessionId: 'session-123'
      });
    });
  });
});

describe('Default Logger Instance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export default logger instance', () => {
    expect(logger).toBeInstanceOf(AppLogger);
    expect(logger.context).toBe('App');
  });

  it('should export convenience methods', () => {
    const { info, debug, warn, error, http } = require('../../src/utils/logger');

    info('Test message', { data: 'test' });
    expect(configLogger.info).toHaveBeenCalledWith('Test message', {
      context: 'App',
      timestamp: expect.any(String),
      data: 'test'
    });

    debug('Debug message');
    expect(configLogger.debug).toHaveBeenCalledWith('Debug message', {
      context: 'App',
      timestamp: expect.any(String)
    });

    warn('Warning message');
    expect(configLogger.warn).toHaveBeenCalledWith('Warning message', {
      context: 'App',
      timestamp: expect.any(String)
    });

    const testError = new Error('Test error');
    error('Error message', testError);
    expect(configLogger.error).toHaveBeenCalledWith('Error message', {
      context: 'App',
      timestamp: expect.any(String),
      error: {
        message: 'Test error',
        stack: expect.any(String),
        name: 'Error'
      }
    });

    http('HTTP message', { method: 'GET' });
    expect(configLogger.http).toHaveBeenCalledWith('HTTP message', {
      context: 'App',
      timestamp: expect.any(String),
      method: 'GET'
    });
  });
});
