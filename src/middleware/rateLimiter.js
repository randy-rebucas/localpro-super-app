/**
 * Rate Limiting Middleware
 * Provides protection against DDoS attacks and API abuse
 */

const rateLimit = require('express-rate-limit');

// Get rate limit configuration from environment variables
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes default
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100; // 100 requests per window

// Check if rate limiting should be disabled (development mode)
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * General API rate limiter
 * Applied to all API routes for basic protection
 * Excludes marketplace routes which have their own more lenient limiter
 */
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting in development mode, for health checks, and marketplace routes
  skip: (req) => {
    return isDevelopment || 
           req.path === '/health' || 
           req.path === '/' ||
           req.path.startsWith('/marketplace');
  }
});

/**
 * Authentication rate limiter (stricter)
 * Applied to authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
  // Skip rate limiting in development mode
  skip: () => isDevelopment
});

/**
 * SMS/Verification code rate limiter (strict but reasonable)
 * Applied to SMS/verification endpoints to prevent abuse
 * Allows 3 requests per 5 minutes to handle legitimate retries
 */
const smsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 requests per 5 minutes
  message: {
    success: false,
    message: 'Too many verification code requests. Please wait a few minutes before trying again.',
    code: 'SMS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development mode
  skip: () => isDevelopment,
  // Use a custom key generator that includes phone number if available
  keyGenerator: (req) => {
    // If phone number is in the request body, use it for more granular rate limiting
    // This allows different phone numbers from the same IP to have separate limits
    const phoneNumber = req.body?.phoneNumber;
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    // Normalize phone number (remove spaces, dashes, etc.) for consistent key generation
    const normalizedPhone = phoneNumber ? String(phoneNumber).replace(/\s+/g, '').trim() : null;
    return normalizedPhone ? `${ip}:${normalizedPhone}` : ip;
  },
  // Add handler to include retry-after in response
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many verification code requests. Please wait a few minutes before trying again.',
      code: 'SMS_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((5 * 60 * 1000) / 1000) // 5 minutes in seconds
    });
  }
});

/**
 * Search/API query rate limiter
 * Applied to search and query endpoints
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: {
    success: false,
    message: 'Too many search requests, please try again later.',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development mode
  skip: () => isDevelopment
});

/**
 * File upload rate limiter
 * Applied to file upload endpoints
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 uploads per minute
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development mode
  skip: () => isDevelopment
});

/**
 * Payment rate limiter
 * Applied to payment endpoints for security
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 payment requests per minute
  message: {
    success: false,
    message: 'Too many payment requests, please try again later.',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development mode
  skip: () => isDevelopment
});

/**
 * Public Marketplace rate limiter (more lenient for mobile apps)
 * Applied to public marketplace endpoints like services, categories, providers
 * Allows higher rate limits for better mobile app experience
 */
const marketplaceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes (20 req/min average)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting in development mode and for health checks
  skip: (req) => {
    return isDevelopment || req.path === '/health' || req.path === '/';
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  smsLimiter,
  searchLimiter,
  uploadLimiter,
  paymentLimiter,
  marketplaceLimiter
};

