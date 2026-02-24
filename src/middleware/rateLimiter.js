/**
 * Rate Limiting Middleware
 * Provides protection against DDoS attacks, credential-stuffing, and SMS spam.
 *
 * Uses express-rate-limit (already in dependencies).
 * All limiters key on IP by default.  Set DISABLE_RATE_LIMIT=true in .env to
 * use the noop pass-through (useful in development / CI).
 */
const rateLimit = require('express-rate-limit');

// Allow tests / dev to bypass rate limits without changing individual limiters.
const bypass = process.env.DISABLE_RATE_LIMIT === 'true';
const noopLimiter = (_req, _res, next) => next();

const make = (opts) => {
  if (bypass) return noopLimiter;
  return rateLimit({
    standardHeaders: true,   // Return RateLimit-* headers
    legacyHeaders: false,
    ...opts
  });
};

/**
 * General API – 200 req / 15 min per IP
 */
const generalLimiter = make({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests – please try again later.', code: 'RATE_LIMIT_EXCEEDED' }
});

/**
 * Authentication endpoints (login, register) – 20 req / 15 min per IP.
 * Mitigates credential-stuffing attacks.
 */
const authLimiter = make({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts – please try again later.', code: 'AUTH_RATE_LIMIT' }
});

/**
 * SMS OTP / magic-link send – 5 req / 10 min per IP.
 * Prevents SMS spamming (cost & abuse protection).
 */
const smsLimiter = make({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many code requests – please wait before requesting another.', code: 'SMS_RATE_LIMIT' }
});

/**
 * Search endpoints – 60 req / min per IP.
 */
const searchLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many search requests.', code: 'SEARCH_RATE_LIMIT' }
});

/**
 * File uploads – 10 req / 10 min per IP.
 */
const uploadLimiter = make({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many upload requests – please try again later.', code: 'UPLOAD_RATE_LIMIT' }
});

/**
 * Payment endpoints – 15 req / 15 min per IP.
 */
const paymentLimiter = make({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many payment requests – please try again later.', code: 'PAYMENT_RATE_LIMIT' }
});

/**
 * Marketplace browsing – 120 req / min per IP.
 */
const marketplaceLimiter = make({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many requests.', code: 'MARKETPLACE_RATE_LIMIT' }
});

/**
 * AI endpoints – 20 req / 10 min per IP.
 * AI calls invoke paid external APIs (OpenAI); strict throttling protects cost and prevents abuse.
 */
const aiLimiter = make({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many AI requests – please wait before retrying.', code: 'AI_RATE_LIMIT' }
});

/**
 * User management endpoints – 60 req / min per IP.
 * Admin-panel write operations (ban, delete, bulk update, password reset) are
 * protected to prevent automated abuse of privileged actions.
 */
const userManagementLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many user management requests – please slow down.', code: 'USER_MGMT_RATE_LIMIT' }
});

module.exports = {
  generalLimiter,
  authLimiter,
  smsLimiter,
  searchLimiter,
  uploadLimiter,
  paymentLimiter,
  marketplaceLimiter,
  aiLimiter,
  userManagementLimiter
};

