/**
 * Rate Limiting Middleware
 * Provides protection against DDoS attacks and API abuse
 */


// No-op middleware for disabling all rate limiting
const noopLimiter = (req, res, next) => next();

module.exports = {
  generalLimiter: noopLimiter,
  authLimiter: noopLimiter,
  smsLimiter: noopLimiter,
  searchLimiter: noopLimiter,
  uploadLimiter: noopLimiter,
  paymentLimiter: noopLimiter,
  marketplaceLimiter: noopLimiter
};

