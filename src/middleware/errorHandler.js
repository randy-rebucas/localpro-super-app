/**
 * Centralized Error Handling Middleware
 * Handles all errors in a consistent manner
 */

const { 
  sendValidationError, 
  sendNotFoundError, 
  sendServerError,
  sendAuthorizationError 
} = require('../utils/responseHelper');
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
 * Handles all errors thrown in the application
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (error, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'SERVER_ERROR';

  // Log error details
  logger.error('Route error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    
    // Format Mongoose validation errors
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      code: 'VALIDATION_ERROR'
    }));
    
    return sendValidationError(res, errors);
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID_FORMAT';
    
    return res.status(statusCode).json({
      success: false,
      message,
      code
    });
  }

  if (error.name === 'MongoError' && error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    code = 'DUPLICATE_ENTRY';
    
    return res.status(statusCode).json({
      success: false,
      message,
      code
    });
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
    
    return res.status(statusCode).json({
      success: false,
      message,
      code
    });
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
    
    return res.status(statusCode).json({
      success: false,
      message,
      code
    });
  }

  if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
    code = 'FILE_UPLOAD_ERROR';
    
    return res.status(statusCode).json({
      success: false,
      message: error.message,
      code
    });
  }

  // Handle custom application errors
  if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APPLICATION_ERROR';
  }

  // Send error response
  return sendServerError(res, error, message, code);
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
 * Request logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Request received:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed:', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id
    });
  });
  
  next();
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
        userId: req.user?.id
      });
    }
    
    // Log performance metrics
    logger.info('Performance metrics:', {
      method: req.method,
      path: req.path,
      duration: `${duration}ms`,
      status: res.statusCode,
      memoryUsage: process.memoryUsage(),
      userId: req.user?.id
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