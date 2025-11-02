/**
 * Request ID Middleware
 * Adds unique request ID to each request for better tracking and debugging
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to add request ID to requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestIdMiddleware = (req, res, next) => {
  // Use existing request ID from headers or generate new one
  req.id = req.headers['x-request-id'] || uuidv4();
  
  // Set response header so clients can track requests
  res.setHeader('X-Request-ID', req.id);
  
  // Add to response locals for use in logging
  res.locals.requestId = req.id;
  
  next();
};

module.exports = requestIdMiddleware;

