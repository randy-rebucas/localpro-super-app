const requestLogger = require('../../../middleware/requestLogger');
const logger = require('../../../config/logger');

jest.mock('../../../config/logger');

describe('Request Logger Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      user: null
    };
    res = {
      statusCode: 200,
      end: jest.fn(function(chunk, encoding) {
        this.end = jest.fn();
      })
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should log request start for important requests', () => {
    requestLogger(req, res, next);

    expect(logger.debug).toHaveBeenCalledWith('Request Started', expect.objectContaining({
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1'
    }));
    expect(next).toHaveBeenCalled();
  });

  test('should not log health check requests', () => {
    req.originalUrl = '/health';

    requestLogger(req, res, next);

    expect(logger.debug).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('should not log static file requests', () => {
    req.originalUrl = '/static/image.jpg';

    requestLogger(req, res, next);

    expect(logger.debug).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('should not log OPTIONS requests', () => {
    req.method = 'OPTIONS';

    requestLogger(req, res, next);

    expect(logger.debug).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('should log request completion when response ends', () => {
    const originalEnd = res.end;
    res.end = jest.fn(function(chunk, encoding) {
      originalEnd.call(this, chunk, encoding);
    });

    requestLogger(req, res, next);
    res.end();

    expect(logger.logRequest).toHaveBeenCalled();
  });

  test('should log slow requests', () => {
    const originalEnd = res.end;
    res.end = jest.fn(function(chunk, encoding) {
      originalEnd.call(this, chunk, encoding);
    });

    requestLogger(req, res, next);
    
    // Simulate slow request
    jest.useFakeTimers();
    requestLogger(req, res, next);
    jest.advanceTimersByTime(2500);
    res.end();
    jest.useRealTimers();

    expect(logger.warn).toHaveBeenCalledWith('Slow Request Detected', expect.objectContaining({
      method: 'GET',
      url: '/api/test'
    }));
  });

  test('should include user ID in logs if user is authenticated', () => {
    req.user = { id: 'user-id-123' };

    requestLogger(req, res, next);

    expect(logger.debug).toHaveBeenCalledWith('Request Started', expect.objectContaining({
      userId: 'user-id-123'
    }));
  });

  test('should use connection remoteAddress if ip is not available', () => {
    delete req.ip;
    req.connection.remoteAddress = '192.168.1.1';

    requestLogger(req, res, next);

    expect(logger.debug).toHaveBeenCalledWith('Request Started', expect.objectContaining({
      ip: '192.168.1.1'
    }));
  });
});

