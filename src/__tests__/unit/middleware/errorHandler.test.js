const {
  handleAsyncErrors,
  errorHandler,
  notFoundHandler,
  requestLogger,
  securityHeaders,
  performanceMonitor
} = require('../../../middleware/errorHandler');
const { sendValidationError, sendServerError } = require('../../../utils/responseHelper');
const logger = require('../../../config/logger');

jest.mock('../../../utils/responseHelper');
jest.mock('../../../config/logger');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      path: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn(),
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      on: jest.fn(),
      statusCode: 200
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleAsyncErrors', () => {
    test('should call next with error if async function throws', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const middleware = handleAsyncErrors(asyncFn);

      await middleware(req, res, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('should call next if async function succeeds', async () => {
      const asyncFn = jest.fn().mockImplementation((req, res, next) => {
        next();
        return Promise.resolve();
      });
      const middleware = handleAsyncErrors(asyncFn);

      await middleware(req, res, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    test('should handle ValidationError', () => {
      const error = {
        name: 'ValidationError',
        errors: {
          email: { path: 'email', message: 'Email is required' },
          password: { path: 'password', message: 'Password is required' }
        }
      };

      errorHandler(error, req, res, next);

      expect(sendValidationError).toHaveBeenCalledWith(res, [
        { field: 'email', message: 'Email is required', code: 'VALIDATION_ERROR' },
        { field: 'password', message: 'Password is required', code: 'VALIDATION_ERROR' }
      ]);
      expect(logger.error).toHaveBeenCalled();
    });

    test('should handle CastError', () => {
      const error = { name: 'CastError' };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid ID format',
        code: 'INVALID_ID_FORMAT'
      });
    });

    test('should handle MongoError duplicate key', () => {
      const error = { name: 'MongoError', code: 11000 };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Duplicate entry',
        code: 'DUPLICATE_ENTRY'
      });
    });

    test('should handle JsonWebTokenError', () => {
      const error = { name: 'JsonWebTokenError' };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    });

    test('should handle TokenExpiredError', () => {
      const error = { name: 'TokenExpiredError' };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    });

    test('should handle MulterError', () => {
      const error = { name: 'MulterError', message: 'File too large' };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'File too large',
        code: 'FILE_UPLOAD_ERROR'
      });
    });

    test('should handle custom application error', () => {
      const error = {
        statusCode: 404,
        message: 'Resource not found',
        code: 'NOT_FOUND'
      };

      errorHandler(error, req, res, next);

      expect(sendServerError).toHaveBeenCalledWith(res, error, 'Resource not found', 'NOT_FOUND');
    });

    test('should handle generic error', () => {
      const error = new Error('Generic error');

      errorHandler(error, req, res, next);

      expect(sendServerError).toHaveBeenCalledWith(res, error, 'Internal server error', 'SERVER_ERROR');
    });

    test('should log error details', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith('Route error:', expect.objectContaining({
        error: 'Test error',
        stack: 'Error stack trace',
        path: '/test',
        method: 'GET',
        ip: '127.0.0.1'
      }));
    });
  });

  describe('notFoundHandler', () => {
    test('should create 404 error and call next', () => {
      req.originalUrl = '/unknown-route';

      notFoundHandler(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Route /unknown-route not found',
        statusCode: 404
      }));
    });
  });

  describe('securityHeaders', () => {
    test('should set security headers', () => {
      securityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      expect(next).toHaveBeenCalled();
    });

    test('should handle OPTIONS request', () => {
      req.method = 'OPTIONS';
      res.end = jest.fn();

      securityHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('performanceMonitor', () => {
    test('should log slow requests', (done) => {
      res.on.mockImplementation((event, callback) => {
        if (event === 'finish') {
          setTimeout(() => {
            callback();
            expect(logger.warn).toHaveBeenCalled();
            done();
          }, 1100);
        }
      });

      performanceMonitor(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should log performance metrics', (done) => {
      res.statusCode = 200;
      res.on.mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
          expect(logger.info).toHaveBeenCalledWith('Performance metrics:', expect.objectContaining({
            method: 'GET',
            path: '/test',
            status: 200
          }));
          done();
        }
      });

      performanceMonitor(req, res, next);
    });
  });
});

