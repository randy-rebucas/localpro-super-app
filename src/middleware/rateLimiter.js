/**
 * Rate Limiting Middleware
 * Provides protection against DDoS attacks and API abuse
 */

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');
const errorResponse = require('../utils/errorResponse');

// Get rate limit configuration from environment variables
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes default
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100; // 100 requests per window

// Check if rate limiting should be disabled (development mode)
const isDevelopment = process.env.NODE_ENV === 'development';

// IP whitelist for admin/testing access
const IP_WHITELIST = (process.env.IP_WHITELIST || '').split(',').filter(ip => ip.trim());

// User-based rate limiting configuration
const USER_RATE_LIMITS = {
  admin: { windowMs: 60 * 1000, max: 1000 }, // 1000 requests per minute for admins
  partner: { windowMs: 60 * 1000, max: 500 }, // 500 requests per minute for partners
  provider: { windowMs: 60 * 1000, max: 300 }, // 300 requests per minute for providers
  client: { windowMs: 60 * 1000, max: 100 } // 100 requests per minute for clients
};

/**
 * General API rate limiter
 * Applied to all API routes for basic protection
 */
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: (req) => {
    // Dynamic limits based on user role
    if (req.user?.roles?.includes('admin')) {
      return USER_RATE_LIMITS.admin.max;
    }
    if (req.user?.roles?.includes('partner')) {
      return USER_RATE_LIMITS.partner.max;
    }
    if (req.user?.roles?.includes('provider')) {
      return USER_RATE_LIMITS.provider.max;
    }
    return RATE_LIMIT_MAX_REQUESTS; // Default for clients and unauthenticated users
  },
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Enhanced skip logic
  skip: (req) => {
    const clientIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;

    // Skip for whitelisted IPs
    if (IP_WHITELIST.includes(clientIP)) {
      return true;
    }

    // Skip for development mode and health checks
    return isDevelopment || req.path === '/health' || req.path === '/';
  },
  // Custom key generator that includes user ID for authenticated users
  keyGenerator: (req) => {
    const clientIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const userId = req.user?.id;

    // Use user ID for authenticated requests to allow per-user limits
    return userId ? `user:${userId}` : `ip:${clientIP}`;
  },
  // Enhanced handler with retry-after
  handler: (req, res) => {
    const retryAfter = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path,
      method: req.method
    });

    return errorResponse.handleRateLimitError(res, retryAfter);
  },
  // Store configuration
  skipSuccessfulRequests: false,
  skipFailedRequests: false
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

module.exports = {
  generalLimiter,
  authLimiter,
  smsLimiter,
  searchLimiter,
  uploadLimiter,
  paymentLimiter
};

