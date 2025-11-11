// Mock winston and DatabaseTransport before requiring logger
jest.mock('winston', () => {
  const mockTransport = {
    log: jest.fn(),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      colorize: jest.fn(),
      printf: jest.fn(),
      errors: jest.fn(),
      json: jest.fn()
    }
  };

  return {
    createLogger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      http: jest.fn(),
      logRequest: jest.fn(),
      logError: jest.fn(),
      logPerformance: jest.fn(),
      logBusinessEvent: jest.fn(),
      logSecurityEvent: jest.fn(),
      stream: {
        write: jest.fn()
      }
    })),
    transports: {
      Console: jest.fn(() => mockTransport)
    },
    Transport: class MockTransport {
      constructor() {}
    },
    format: mockTransport.format,
    addColors: jest.fn()
  };
});

jest.mock('../../../config/databaseTransport', () => {
  return class MockDatabaseTransport {
    constructor() {}
  };
});

const logger = require('../../../config/logger');

describe('Logger Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logger Instance', () => {
    test('should export logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger).toBe('object');
    });

    test('should have standard logging methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.http).toBe('function');
    });

    test('should have custom logging methods', () => {
      expect(typeof logger.logRequest).toBe('function');
      expect(typeof logger.logError).toBe('function');
      expect(typeof logger.logPerformance).toBe('function');
      expect(typeof logger.logBusinessEvent).toBe('function');
      expect(typeof logger.logSecurityEvent).toBe('function');
    });

    test('should have stream object for morgan', () => {
      expect(logger.stream).toBeDefined();
      expect(typeof logger.stream.write).toBe('function');
    });
  });

  describe('logRequest method', () => {
    test('should log HTTP request information', () => {
      const mockReq = {
        method: 'GET',
        originalUrl: '/api/test',
        get: jest.fn(() => 'test-agent'),
        ip: '127.0.0.1',
        user: { id: 'user123' }
      };

      const mockRes = {
        statusCode: 200
      };

      logger.logRequest(mockReq, mockRes, 150);

      expect(logger.http).toHaveBeenCalled();
      const callArgs = logger.http.mock.calls[0];
      expect(callArgs[0]).toBe('HTTP Request');
      expect(callArgs[1]).toHaveProperty('method', 'GET');
      expect(callArgs[1]).toHaveProperty('url', '/api/test');
      expect(callArgs[1]).toHaveProperty('statusCode', 200);
    });

    test('should log as warn for status codes >= 400', () => {
      const mockReq = {
        method: 'GET',
        originalUrl: '/api/test',
        get: jest.fn(() => 'test-agent'),
        ip: '127.0.0.1'
      };

      const mockRes = {
        statusCode: 404
      };

      logger.logRequest(mockReq, mockRes, 150);

      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('logError method', () => {
    test('should log error information', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      logger.logError(error);

      expect(logger.error).toHaveBeenCalled();
      const callArgs = logger.error.mock.calls[0];
      expect(callArgs[0]).toBe('Application Error');
      expect(callArgs[1]).toHaveProperty('message', 'Test error');
      expect(callArgs[1]).toHaveProperty('stack', 'Error stack trace');
    });

    test('should include request information if provided', () => {
      const error = new Error('Test error');
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/test',
        headers: { 'content-type': 'application/json' },
        body: { test: 'data' },
        params: { id: '123' },
        query: { page: '1' },
        ip: '127.0.0.1',
        user: { id: 'user123' }
      };

      logger.logError(error, mockReq);

      expect(logger.error).toHaveBeenCalled();
      const callArgs = logger.error.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('request');
      expect(callArgs[1].request).toHaveProperty('method', 'POST');
    });

    test('should include additional info if provided', () => {
      const error = new Error('Test error');
      const additionalInfo = { userId: 'user123', operation: 'test' };

      logger.logError(error, null, additionalInfo);

      expect(logger.error).toHaveBeenCalled();
      const callArgs = logger.error.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('userId', 'user123');
      expect(callArgs[1]).toHaveProperty('operation', 'test');
    });
  });

  describe('logPerformance method', () => {
    test('should log performance information', () => {
      logger.logPerformance('test-operation', 500);

      expect(logger.info).toHaveBeenCalled();
      const callArgs = logger.info.mock.calls[0];
      expect(callArgs[0]).toBe('Performance');
      expect(callArgs[1]).toHaveProperty('operation', 'test-operation');
      expect(callArgs[1]).toHaveProperty('duration', '500ms');
    });

    test('should log as warn for slow operations (>1000ms)', () => {
      logger.logPerformance('slow-operation', 1500);

      expect(logger.warn).toHaveBeenCalled();
      const callArgs = logger.warn.mock.calls[0];
      expect(callArgs[0]).toBe('Slow Operation');
    });

    test('should include metadata if provided', () => {
      const metadata = { userId: 'user123', endpoint: '/api/test' };
      logger.logPerformance('test-operation', 500, metadata);

      expect(logger.info).toHaveBeenCalled();
      const callArgs = logger.info.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('userId', 'user123');
      expect(callArgs[1]).toHaveProperty('endpoint', '/api/test');
    });
  });

  describe('logBusinessEvent method', () => {
    test('should log business event', () => {
      logger.logBusinessEvent('user_registered', { userId: 'user123' });

      expect(logger.info).toHaveBeenCalled();
      const callArgs = logger.info.mock.calls[0];
      expect(callArgs[0]).toBe('Business Event');
      expect(callArgs[1]).toHaveProperty('event', 'user_registered');
      expect(callArgs[1]).toHaveProperty('userId', 'user123');
    });
  });

  describe('logSecurityEvent method', () => {
    test('should log security event', () => {
      logger.logSecurityEvent('failed_login', { ip: '127.0.0.1' });

      expect(logger.warn).toHaveBeenCalled();
      const callArgs = logger.warn.mock.calls[0];
      expect(callArgs[0]).toBe('Security Event');
      expect(callArgs[1]).toHaveProperty('event', 'failed_login');
      expect(callArgs[1]).toHaveProperty('ip', '127.0.0.1');
    });
  });

  describe('stream.write method', () => {
    test('should log HTTP messages via stream', () => {
      logger.stream.write('GET /api/test 200 150ms');

      expect(logger.http).toHaveBeenCalledWith('GET /api/test 200 150ms');
    });
  });
});

