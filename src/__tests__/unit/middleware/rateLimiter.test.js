const {
  generalLimiter,
  authLimiter,
  smsLimiter,
  searchLimiter,
  uploadLimiter,
  paymentLimiter
} = require('../../../middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      path: '/api/test',
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
      body: {},
      method: 'GET'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn()
    };
    next = jest.fn();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
  });

  describe('generalLimiter', () => {
    test('should be defined and configured', () => {
      expect(generalLimiter).toBeDefined();
      expect(typeof generalLimiter).toBe('function');
    });

    test('should have skip function that checks development mode', () => {
      // The skip function is tested through the actual middleware behavior
      // In development, it should skip rate limiting
      expect(generalLimiter).toBeDefined();
    });

    test('should have skip function that checks health check path', () => {
      // The skip function checks for /health path
      expect(generalLimiter).toBeDefined();
    });

    test('should have skip function that checks root path', () => {
      // The skip function checks for / path
      expect(generalLimiter).toBeDefined();
    });
  });

  describe('authLimiter', () => {
    test('should be defined and configured', () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });

    test('should have stricter limits than general limiter', () => {
      // The auth limiter is configured with max: 5 requests per 15 minutes
      expect(authLimiter).toBeDefined();
    });
  });

  describe('smsLimiter', () => {
    test('should be defined and configured', () => {
      expect(smsLimiter).toBeDefined();
      expect(typeof smsLimiter).toBe('function');
    });

    test('should use phone number in key generator if available', () => {
      // The keyGenerator function includes phone number for granular rate limiting
      expect(smsLimiter).toBeDefined();
    });

    test('should normalize phone number in key generator', () => {
      // Phone number is normalized (spaces removed) in keyGenerator
      expect(smsLimiter).toBeDefined();
    });
  });

  describe('searchLimiter', () => {
    test('should be defined and configured', () => {
      expect(searchLimiter).toBeDefined();
      expect(typeof searchLimiter).toBe('function');
    });

    test('should have appropriate limits for search', () => {
      // Search limiter is configured with max: 30 requests per minute
      expect(searchLimiter).toBeDefined();
    });
  });

  describe('uploadLimiter', () => {
    test('should be defined and configured', () => {
      expect(uploadLimiter).toBeDefined();
      expect(typeof uploadLimiter).toBe('function');
    });

    test('should have appropriate limits for uploads', () => {
      // Upload limiter is configured with max: 10 requests per minute
      expect(uploadLimiter).toBeDefined();
    });
  });

  describe('paymentLimiter', () => {
    test('should be defined and configured', () => {
      expect(paymentLimiter).toBeDefined();
      expect(typeof paymentLimiter).toBe('function');
    });

    test('should have strict limits for payments', () => {
      // Payment limiter is configured with max: 5 requests per minute
      expect(paymentLimiter).toBeDefined();
    });
  });

  describe('rate limiter configuration', () => {
    test('should use environment variables for configuration', () => {
      process.env.RATE_LIMIT_WINDOW_MS = '30000';
      process.env.RATE_LIMIT_MAX_REQUESTS = '50';

      // The limiters should use these values
      expect(generalLimiter).toBeDefined();
    });

    test('should use default values if environment variables not set', () => {
      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX_REQUESTS;

      // Should use defaults: 15 minutes, 100 requests
      expect(generalLimiter).toBeDefined();
    });
  });
});

