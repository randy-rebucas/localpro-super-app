/**
 * Error Handler Middleware Tests
 */

// Mock logger before requiring errorHandler to prevent database transport initialization
jest.mock('../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  stream: {
    write: jest.fn()
  }
}));

const { errorHandler } = require('../../middleware/errorHandler');

describe('Error Handler Middleware', () => {
  // Suppress console.error for error handler tests (expected behavior)
  let originalConsoleError;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = jest.fn(); // Mock console.error to suppress output
  });

  afterAll(() => {
    // Restore console.error
    console.error = originalConsoleError;
    // Clear any timers
    jest.clearAllTimers();
  });

  it('should be a function', () => {
    expect(typeof errorHandler).toBe('function');
  });

  it('should handle ValidationError', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.errors = {
      email: { path: 'email', message: 'Invalid email' }
    };

    const req = {
      path: '/test',
      method: 'POST',
      ip: '127.0.0.1',
      get: () => 'test-agent'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    errorHandler(error, req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it('should handle CastError', () => {
    const error = new Error('Invalid ID');
    error.name = 'CastError';

    const req = {
      path: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: () => 'test-agent'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    errorHandler(error, req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it('should handle generic errors', () => {
    const error = new Error('Generic error');

    const req = {
      path: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: () => 'test-agent'
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    errorHandler(error, req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });
});

