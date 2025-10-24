/**
 * RATE LIMITING DISABLED
 * This file contains rate limiting middleware that has been disabled.
 * To re-enable rate limiting, uncomment the imports and rate limiter configurations below.
 */

// Rate limiting disabled - uncomment to re-enable
// const rateLimit = require('express-rate-limit');
// const redis = require('redis');

// Rate limiting disabled - Redis client commented out
// let redisClient;

// try {
//   redisClient = redis.createClient({
//     url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
//     password: process.env.REDIS_PASSWORD
//   });
//   
//   // Connect to Redis
//   redisClient.connect().catch(err => {
//     console.warn('Redis connection failed, using memory store for rate limiting:', err.message);
//     redisClient = null;
//   });
// } catch (error) {
//   console.warn('Redis not available, using memory store for rate limiting:', error.message);
//   redisClient = null;
// }

/**
 * Create a Redis store for rate limiting
 * @param {string} prefix - Unique prefix for this rate limiter
 * @returns {Object|undefined} - Redis store or undefined if Redis not available
 */
const createRedisStore = (prefix) => {
  if (!redisClient) return undefined;
  
  try {
    const { RedisStore } = require('rate-limit-redis');
    return new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: prefix
    });
  } catch (error) {
    console.warn('Failed to create Redis store:', error.message);
    return undefined;
  }
};

/**
 * General rate limiter for API endpoints
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('general')
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('auth')
});

/**
 * SMS/Email rate limiter for verification codes
 */
const verificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // Limit each IP to 1 request per minute
  message: {
    success: false,
    message: 'Please wait before requesting another verification code',
    code: 'VERIFICATION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('verification')
});

/**
 * Upload rate limiter for file uploads
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 uploads per minute
  message: {
    success: false,
    message: 'Too many uploads, please try again later',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('upload')
});

/**
 * Search rate limiter for search endpoints
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 searches per minute
  message: {
    success: false,
    message: 'Too many search requests, please try again later',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('search')
});

/**
 * Create custom rate limiter
 * @param {Object} options - Rate limiting options
 * @returns {Function} - Rate limiter middleware
 */
const createCustomLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later',
      code: options.code || 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore(options.prefix || 'custom'),
    ...options
  });
};

module.exports = {
  generalLimiter,
  authLimiter,
  verificationLimiter,
  uploadLimiter,
  searchLimiter,
  createCustomLimiter
};
