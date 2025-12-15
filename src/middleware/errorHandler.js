/**
 * Centralized Error Handling Middleware
 * Handles all errors in a consistent manner using standardized error responses
 */

const errorResponse = require('../utils/errorResponse');
const logger = require('../config/logger');

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware
 */
const handleAsyncErrors = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Centralized error handler
 * Handles all errors thrown in the application using standardized responses
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (error, req, res, _next) => {
  // Log error details
  logger.error('Route error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query
  });

  // Handle specific error types with standardized responses

  // Mongoose validation errors
  if (error.name === 'ValidationError') {
    return errorResponse.handleMongooseError(res, error);
  }

  // Mongoose cast errors (invalid ObjectId, etc.)
  if (error.name === 'CastError') {
    return errorResponse.sendError(res, 'INVALID_ID', `Invalid ${error.path}: ${error.value}`);
  }

  // MongoDB duplicate key errors
  if (error.name === 'MongoError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return errorResponse.sendError(res, 'CONFLICT', `Duplicate value for ${field}`);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return errorResponse.handleJWTError(res, error);
  }

  // Multer file upload errors
  if (error.code && error.code.startsWith('LIMIT_')) {
    return errorResponse.handleFileUploadError(res, error);
  }

  // Payment gateway errors
  if (error.code && ['PAYMONGO_ERROR', 'STRIPE_ERROR', 'XENDIT_ERROR'].includes(error.code)) {
    return errorResponse.handlePaymentError(res, error, error.gateway || 'unknown');
  }

  // Express-validator errors
  if (error.errors && Array.isArray(error.errors)) {
    return errorResponse.handleValidationError(res, error);
  }

  // Custom application errors with error codes
  if (error.code && errorResponse.getErrorInfo(error.code)) {
    return errorResponse.sendError(res, error.code, error.details, error.message);
  }

  // Rate limiting errors
  if (error.name === 'RateLimitError') {
    return errorResponse.handleRateLimitError(res, error.resetTime);
  }

  // Default server error for unhandled errors
  return errorResponse.sendError(res, 'INTERNAL_SERVER_ERROR', error.message);
};

/**
 * Request logging middleware
 * Logs all incoming requests with performance metrics
 */
const requestLogger = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  // Log request
  logger.info('Request received:', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    contentLength: req.get('Content-Length')
  });

  // Hook into response finish
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1000000;

    // Log response
    logger.info('Request completed:', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${durationMs.toFixed(2)}ms`,
      userId: req.user?.id,
      responseSize: res.get('Content-Length')
    });

    // Warn about slow requests
    if (durationMs > 2000) { // 2 seconds
      logger.warn('Slow request detected:', {
        method: req.method,
        path: req.path,
        duration: `${durationMs.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }
  });

  next();
};

/**
 * 404 handler for undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};


/**
 * Security headers middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const securityHeaders = (req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Set CORS headers if needed
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  next();
};

/**
 * Performance monitoring middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected:', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        status: res.statusCode,
        userId: req.user?.id // eslint-disable-line no-undef
      });
    }
    
    // Log performance metrics
    logger.info('Performance metrics:', {
      method: req.method,
      path: req.path,
      duration: `${duration}ms`,
      status: res.statusCode,
      memoryUsage: process.memoryUsage(),
      userId: req.user?.id // eslint-disable-line no-undef
    });
  });
  
  next();
};

module.exports = {
  handleAsyncErrors,
  errorHandler,
  notFoundHandler,
  requestLogger,
  securityHeaders,
  performanceMonitor
};