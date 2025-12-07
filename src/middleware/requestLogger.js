/**
 * Request Logger Middleware
 * 
 * Comprehensive HTTP request/response logging middleware
 * with performance tracking and error capture.
 */

const loggerService = require('../services/loggerService');

/**
 * Sanitize request body to remove sensitive data
 * @param {Object} body - Request body
 * @returns {Object} - Sanitized body
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'creditCard', 'cardNumber', 'cvv', 'ssn', 'pin',
    'accessToken', 'refreshToken', 'apiKey', 'privateKey'
  ];

  const sanitizeRecursive = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeRecursive(obj[key]);
      } else if (sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      }
    }
  };

  sanitizeRecursive(sanitized);
  return sanitized;
};

/**
 * Sanitize headers to remove sensitive information
 * @param {Object} headers - Request headers
 * @returns {Object} - Sanitized headers
 */
const sanitizeHeaders = (headers) => {
  if (!headers) return headers;

  const sanitized = { ...headers };
  const sensitiveHeaders = [
    'authorization', 'cookie', 'x-api-key', 'x-auth-token',
    'x-access-token', 'x-refresh-token', 'proxy-authorization'
  ];

  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * Extract relevant request data for logging
 * @param {Object} req - Express request
 * @returns {Object} - Request data
 */
const extractRequestData = (req) => {
  return {
    id: req.id,
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    params: req.params,
    body: sanitizeBody(req.body),
    headers: sanitizeHeaders(req.headers),
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer'),
    origin: req.get('Origin'),
    userId: req.user?.id
  };
};

/**
 * Request logger middleware
 * @param {Object} options - Configuration options
 * @returns {Function} - Express middleware
 */
const requestLogger = (options = {}) => {
  const {
    logBody = false,
    logHeaders = false,
    logQuery = true,
    excludePaths = ['/health', '/ready', '/metrics'],
    slowThreshold = 1000
  } = options;

  return (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Track request start
    const startTime = process.hrtime();
    const startMemory = process.memoryUsage().heapUsed;

    // Capture original response methods
    const originalSend = res.send;
    const originalJson = res.json;

    // Override send to capture response
    res.send = function(body) {
      return originalSend.call(this, body);
    };

    res.json = function(body) {
      return originalJson.call(this, body);
    };

    // Log on response finish
    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = Math.round(seconds * 1000 + nanoseconds / 1000000);
      const memoryDelta = process.memoryUsage().heapUsed - startMemory;

      const logData = {
        request: {
          id: req.id,
          correlationId: req.correlationId,
          method: req.method,
          url: req.originalUrl,
          path: req.path,
          ...(logQuery && { query: req.query }),
          ...(logBody && { body: sanitizeBody(req.body) }),
          ...(logHeaders && { headers: sanitizeHeaders(req.headers) }),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id
        },
        response: {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          contentLength: res.get('Content-Length'),
          contentType: res.get('Content-Type')
        },
        performance: {
          duration,
          memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
          slow: duration > slowThreshold
        },
        timestamp: new Date().toISOString()
      };

      // Determine log level based on status code
      let level = 'http';
      if (res.statusCode >= 500) {
        level = 'error';
      } else if (res.statusCode >= 400) {
        level = 'warn';
      } else if (duration > slowThreshold) {
        level = 'warn';
      }

      loggerService.log(level, `${req.method} ${req.originalUrl}`, {
        category: 'http',
        ...logData
      });
    });

    next();
  };
};

/**
 * Error logger middleware
 * Must be used after routes to catch errors
 */
const errorLogger = (err, req, res, next) => {
  const errorData = {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode || 500
    },
    request: extractRequestData(req),
    timestamp: new Date().toISOString()
  };

  loggerService.error(`Error: ${err.message}`, err, {
    category: 'error',
    requestId: req.id,
    correlationId: req.correlationId,
    ...errorData
  });

  next(err);
};

/**
 * Morgan token setup for correlation IDs
 * @param {Object} morgan - Morgan instance
 */
const setupMorganTokens = (morgan) => {
  morgan.token('correlation-id', (req) => req.correlationId);
  morgan.token('request-id', (req) => req.id);
  morgan.token('user-id', (req) => req.user?.id || 'anonymous');
};

/**
 * Morgan format string with correlation ID
 */
const morganFormat = ':correlation-id :method :url :status :response-time ms - :res[content-length]';

module.exports = {
  requestLogger,
  errorLogger,
  extractRequestData,
  sanitizeBody,
  sanitizeHeaders,
  setupMorganTokens,
  morganFormat
};
