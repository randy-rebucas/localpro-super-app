/**
 * RATE LIMITING DISABLED
 * This file contains rate limiting middleware that has been disabled.
 * To re-enable rate limiting, uncomment the imports and rate limiter configurations below.
 */

// Rate limiting disabled - uncomment to re-enable
// const {
//   generalLimiter,
//   authLimiter,
//   verificationLimiter,
//   uploadLimiter,
//   searchLimiter
// } = require('./rateLimiter');

/**
 * Apply rate limiting based on route type
 * @param {string} routeType - Type of route (auth, search, upload, verification, general)
 * @returns {Function} - Rate limiter middleware
 */
const applyRateLimiting = (_routeType) => {
  // Rate limiting is disabled - return no-op middleware
  return (req, res, next) => {
    next();
  };
};

/**
 * Rate limiting configuration for different endpoints
 */
const rateLimitConfig = {
  // Authentication endpoints
  '/api/auth/send-code': 'verification',
  '/api/auth/verify-code': 'auth',
  '/api/auth/login': 'auth',
  '/api/auth/register': 'auth',
  '/api/auth/forgot-password': 'verification',
  '/api/auth/reset-password': 'auth',

  // Search endpoints
  '/api/jobs': 'search',
  '/api/marketplace/services': 'search',
  '/api/rentals': 'search',
  '/api/academy/courses': 'search',
  '/api/search': 'search',

  // Upload endpoints
  '/api/upload': 'upload',
  '/api/upload/avatar': 'upload',
  '/api/upload/service-images': 'upload',
  '/api/upload/job-images': 'upload',

  // General API endpoints
  '/api/users': 'general',
  '/api/communication': 'general',
  '/api/analytics': 'general',
  '/api/finance': 'general',
  '/api/referrals': 'general',
  '/api/announcements': 'general',
  '/api/activities': 'general',
  '/api/ads': 'general',
  '/api/agency': 'general',
  '/api/facility-care': 'general',
  '/api/localpro-plus': 'general',
  '/api/maps': 'general',
  '/api/payments': 'general',
  '/api/provider': 'general',
  '/api/settings': 'general',
  '/api/supplies': 'general',
  '/api/trust-verification': 'general'
};

/**
 * Get rate limiter for a specific route
 * @param {string} route - Route path
 * @returns {Function} - Rate limiter middleware
 */
const getRateLimiterForRoute = (route) => {
  // Check for exact match first
  if (rateLimitConfig[route]) {
    return applyRateLimiting(rateLimitConfig[route]);
  }

  // Check for pattern matches
  for (const pattern in rateLimitConfig) {
    if (route.startsWith(pattern)) {
      return applyRateLimiting(rateLimitConfig[pattern]);
    }
  }

  // Default to general rate limiting
  return applyRateLimiting('general');
};

/**
 * Middleware to apply rate limiting based on route
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const dynamicRateLimiter = (req, res, next) => {
  const route = req.path;
  const rateLimiter = getRateLimiterForRoute(route);

  return rateLimiter(req, res, next);
};

/**
 * Apply rate limiting to specific route patterns
 * @param {string} pattern - Route pattern
 * @param {string} type - Rate limiter type
 * @returns {Function} - Express middleware
 */
const applyToPattern = (pattern, type) => {
  return (req, res, next) => {
    if (req.path.match(pattern)) {
      const rateLimiter = applyRateLimiting(type);
      return rateLimiter(req, res, next);
    }
    next();
  };
};

module.exports = {
  applyRateLimiting,
  getRateLimiterForRoute,
  dynamicRateLimiter,
  applyToPattern,
  rateLimitConfig
};
