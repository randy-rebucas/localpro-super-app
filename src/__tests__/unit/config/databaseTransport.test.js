const DatabaseTransport = require('../../../config/databaseTransport');
const winston = require('winston');

// Mock the Log model
jest.mock('../../../models/Log', () => ({
  insertMany: jest.fn(),
  create: jest.fn()
}));

const Log = require('../../../models/Log');

describe('DatabaseTransport', () => {
  let transport;
  const mockOptions = {
    level: 'info',
    batchSize: 10,
    flushInterval: 1000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LOG_DATABASE_ENABLED = 'true';
    process.env.NODE_ENV = 'test';
    
    // Clear any existing timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (transport) {
      transport.cleanup();
    }
    jest.useRealTimers();
  });

  describe('Constructor', () => {
    test('should create DatabaseTransport instance', () => {
      transport = new DatabaseTransport(mockOptions);
      
      expect(transport).toBeInstanceOf(winston.Transport);
      expect(transport.name).toBe('database');
      expect(transport.level).toBe('info');
      expect(transport.batchSize).toBe(10);
      expect(transport.flushInterval).toBe(1000);
    });

    test('should use default options if not provided', () => {
      transport = new DatabaseTransport();
      
      expect(transport.level).toBe('info');
      expect(transport.batchSize).toBe(100);
      expect(transport.flushInterval).toBe(5000);
    });

    test('should not start flush timer in test environment', () => {
      process.env.NODE_ENV = 'test';
      transport = new DatabaseTransport(mockOptions);
      
      expect(transport.flushTimer).toBeNull();
    });

    test('should not start flush timer if database logging is disabled', () => {
      process.env.LOG_DATABASE_ENABLED = 'false';
      process.env.NODE_ENV = 'development';
      transport = new DatabaseTransport(mockOptions);
      
      expect(transport.flushTimer).toBeNull();
    });
  });

  describe('log method', () => {
    test('should add log entry to buffer', () => {
      transport = new DatabaseTransport(mockOptions);
      const mockInfo = {
        level: 'info',
        message: 'Test message',
        timestamp: new Date()
      };

      transport.log(mockInfo, jest.fn());

      expect(transport.logBuffer.length).toBe(1);
    });

    test('should flush when buffer reaches batch size', async () => {
      transport = new DatabaseTransport({ ...mockOptions, batchSize: 2 });
      transport.flush = jest.fn();

      const mockInfo = {
        level: 'info',
        message: 'Test message',
        timestamp: new Date()
      };

      transport.log(mockInfo, jest.fn());
      transport.log(mockInfo, jest.fn());

      expect(transport.flush).toHaveBeenCalled();
    });

    test('should call callback after logging', () => {
      transport = new DatabaseTransport(mockOptions);
      const callback = jest.fn();
      const mockInfo = {
        level: 'info',
        message: 'Test message',
        timestamp: new Date()
      };

      transport.log(mockInfo, callback);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('formatLogEntry method', () => {
    test('should format log entry correctly', () => {
      transport = new DatabaseTransport(mockOptions);
      const mockInfo = {
        level: 'info',
        message: 'Test message',
        timestamp: new Date()
      };

      const formatted = transport.formatLogEntry(mockInfo);

      expect(formatted).toHaveProperty('logId');
      expect(formatted).toHaveProperty('level', 'info');
      expect(formatted).toHaveProperty('message', 'Test message');
      expect(formatted).toHaveProperty('category');
      expect(formatted).toHaveProperty('source', 'winston');
      expect(formatted).toHaveProperty('timestamp');
      expect(formatted).toHaveProperty('metadata');
    });

    test('should include request information if available', () => {
      transport = new DatabaseTransport(mockOptions);
      const mockInfo = {
        level: 'info',
        message: 'Test message',
        timestamp: new Date(),
        request: {
          method: 'GET',
          url: '/api/test',
          headers: { 'authorization': 'Bearer token' },
          body: { password: 'secret' },
          params: { id: '123' },
          query: { page: '1' },
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          userId: 'user123'
        }
      };

      const formatted = transport.formatLogEntry(mockInfo);

      expect(formatted).toHaveProperty('request');
      expect(formatted.request).toHaveProperty('method', 'GET');
      expect(formatted.request).toHaveProperty('url', '/api/test');
      expect(formatted.request.headers.authorization).toBe('[REDACTED]');
      expect(formatted.request.body.password).toBe('[REDACTED]');
    });

    test('should include error information if available', () => {
      transport = new DatabaseTransport(mockOptions);
      const mockInfo = {
        level: 'error',
        message: 'Error message',
        timestamp: new Date(),
        error: {
          name: 'Error',
          message: 'Error message',
          stack: 'Error stack',
          code: 'ERR_CODE'
        }
      };

      const formatted = transport.formatLogEntry(mockInfo);

      expect(formatted).toHaveProperty('error');
      expect(formatted.error).toHaveProperty('name', 'Error');
      expect(formatted.error).toHaveProperty('message', 'Error message');
      expect(formatted.error).toHaveProperty('stack', 'Error stack');
    });
  });

  describe('determineCategory method', () => {
    test('should return category from info if available', () => {
      transport = new DatabaseTransport(mockOptions);
      const category = transport.determineCategory({ category: 'custom' });
      expect(category).toBe('custom');
    });

    test('should return error category for error level', () => {
      transport = new DatabaseTransport(mockOptions);
      const category = transport.determineCategory({ level: 'error' });
      expect(category).toBe('error');
    });

    test('should return security category for warn level', () => {
      transport = new DatabaseTransport(mockOptions);
      const category = transport.determineCategory({ level: 'warn' });
      expect(category).toBe('security');
    });

    test('should return performance category for operation', () => {
      transport = new DatabaseTransport(mockOptions);
      const category = transport.determineCategory({ operation: 'test' });
      expect(category).toBe('performance');
    });

    test('should return business category for event', () => {
      transport = new DatabaseTransport(mockOptions);
      const category = transport.determineCategory({ event: 'test' });
      expect(category).toBe('business');
    });

    test('should return application category as default', () => {
      transport = new DatabaseTransport(mockOptions);
      const category = transport.determineCategory({ level: 'info' });
      expect(category).toBe('application');
    });
  });

  describe('sanitizeHeaders method', () => {
    test('should sanitize sensitive headers', () => {
      transport = new DatabaseTransport(mockOptions);
      const headers = {
        'authorization': 'Bearer token',
        'cookie': 'session=abc123',
        'x-api-key': 'secret-key',
        'content-type': 'application/json'
      };

      const sanitized = transport.sanitizeHeaders(headers);

      expect(sanitized.authorization).toBe('[REDACTED]');
      expect(sanitized.cookie).toBe('[REDACTED]');
      expect(sanitized['x-api-key']).toBe('[REDACTED]');
      expect(sanitized['content-type']).toBe('application/json');
    });
  });

  describe('sanitizeBody method', () => {
    test('should sanitize sensitive fields in body', () => {
      transport = new DatabaseTransport(mockOptions);
      const body = {
        username: 'testuser',
        password: 'secret123',
        token: 'abc123',
        email: 'test@example.com'
      };

      const sanitized = transport.sanitizeBody(body);

      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.username).toBe('testuser');
      expect(sanitized.email).toBe('test@example.com');
    });

    test('should handle nested objects', () => {
      transport = new DatabaseTransport(mockOptions);
      const body = {
        user: {
          name: 'John',
          password: 'secret',
          token: 'abc123',
          secretKey: 'my-secret'
        }
      };

      const sanitized = transport.sanitizeBody(body);

      expect(sanitized.user.password).toBe('[REDACTED]');
      expect(sanitized.user.token).toBe('[REDACTED]');
      expect(sanitized.user.secretKey).toBe('[REDACTED]'); // 'secretKey' includes 'secret'
      expect(sanitized.user.name).toBe('John');
    });
  });

  describe('flush method', () => {
    test('should insert logs into database', async () => {
      transport = new DatabaseTransport(mockOptions);
      Log.insertMany.mockResolvedValue([]);

      transport.logBuffer = [
        { logId: '1', message: 'Test 1' },
        { logId: '2', message: 'Test 2' }
      ];

      await transport.flush();

      expect(Log.insertMany).toHaveBeenCalled();
      expect(transport.logBuffer.length).toBe(0);
    });

    test('should handle flush errors gracefully', async () => {
      transport = new DatabaseTransport(mockOptions);
      Log.insertMany.mockRejectedValue(new Error('Database error'));
      Log.create.mockResolvedValue({});

      // Suppress console.error output during this test
      const originalError = console.error;
      console.error = jest.fn();

      transport.logBuffer = [
        { logId: '1', message: 'Test 1' }
      ];

      await transport.flush();

      expect(Log.insertMany).toHaveBeenCalled();
      expect(Log.create).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();

      // Restore console.error
      console.error = originalError;
    });

    test('should not flush if already flushing', async () => {
      transport = new DatabaseTransport(mockOptions);
      transport.isFlushing = true;
      transport.logBuffer = [{ logId: '1', message: 'Test' }];

      await transport.flush();

      expect(Log.insertMany).not.toHaveBeenCalled();
    });

    test('should not flush if buffer is empty', async () => {
      transport = new DatabaseTransport(mockOptions);
      transport.logBuffer = [];

      await transport.flush();

      expect(Log.insertMany).not.toHaveBeenCalled();
    });
  });

  describe('Timer management', () => {
    test('should start flush timer', () => {
      process.env.NODE_ENV = 'development';
      transport = new DatabaseTransport({ ...mockOptions, flushInterval: 1000 });
      
      transport.startFlushTimer();
      
      expect(transport.flushTimer).toBeDefined();
    });

    test('should stop flush timer', () => {
      transport = new DatabaseTransport(mockOptions);
      transport.startFlushTimer();
      
      transport.stopFlushTimer();
      
      expect(transport.flushTimer).toBeNull();
    });

    test('should cleanup on close', async () => {
      transport = new DatabaseTransport(mockOptions);
      Log.insertMany.mockResolvedValue([]);
      transport.logBuffer = [{ logId: '1', message: 'Test' }];
      transport.startFlushTimer();
      
      await transport.close();
      
      expect(transport.flushTimer).toBeNull();
      expect(Log.insertMany).toHaveBeenCalled();
    });
  });
});

