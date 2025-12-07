/**
 * Request Correlation Middleware
 * 
 * Attaches correlation IDs to requests for distributed tracing
 * and improved log analysis.
 */

const crypto = require('crypto');
const loggerService = require('../services/loggerService');

/**
 * Generate a unique request ID
 * @returns {string} - Unique request ID
 */
const generateRequestId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(8).toString('hex');
  return `req-${timestamp}-${randomPart}`;
};

/**
 * Request correlation middleware
 * Adds correlation ID and request ID to each request
 */
const requestCorrelation = (req, res, next) => {
  // Check for existing correlation ID from headers (for distributed tracing)
  const incomingCorrelationId = req.get('X-Correlation-ID') || req.get('X-Request-ID');
  
  // Generate or use existing request ID
  req.id = req.get('X-Request-ID') || generateRequestId();
  
  // Get or create correlation ID
  req.correlationId = incomingCorrelationId || loggerService.getCorrelationId(req.id);
  
  // Add to response headers for tracing
  res.setHeader('X-Request-ID', req.id);
  res.setHeader('X-Correlation-ID', req.correlationId);

  // Track request start time
  req.startTime = Date.now();

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    loggerService.logRequest(req, res, duration);
  });

  next();
};

/**
 * Create child correlation for async operations
 * @param {Object} req - Express request object
 * @returns {Object} - Correlation context
 */
const createChildCorrelation = (req) => {
  const parentCorrelationId = req.correlationId;
  const spanId = crypto.randomBytes(4).toString('hex');
  
  return {
    correlationId: parentCorrelationId,
    parentSpanId: req.spanId,
    spanId,
    requestId: req.id
  };
};

/**
 * Middleware to extract correlation context from request
 * @param {Object} req - Express request
 * @returns {Object} - Correlation context
 */
const getCorrelationContext = (req) => {
  return {
    requestId: req.id,
    correlationId: req.correlationId,
    userId: req.user?.id,
    sessionId: req.session?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };
};

module.exports = {
  requestCorrelation,
  createChildCorrelation,
  getCorrelationContext,
  generateRequestId
};

