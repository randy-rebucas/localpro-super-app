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

/**
 * Trust verification endpoints – 30 req / min per IP.
 * Verification submissions and admin reviews are sensitive write operations;
 * a tighter window reduces automated abuse and document-upload floods.
 */
const trustVerificationLimiter = make({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many trust verification requests – please slow down.', code: 'TRUST_VERIFICATION_RATE_LIMIT' }
});

/**
 * Supplies / marketplace-products endpoints – 60 req / min per IP.
 * Covers product browse, ordering, and review submission.
 */
const suppliesLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many supply requests – please slow down.', code: 'SUPPLIES_RATE_LIMIT' }
});

/**
 * Settings endpoints – 60 req / min per IP.
 * Covers user settings reads/writes and admin app-settings mutations.
 * Public routes (app/public, app/health) are exempt and do not use this limiter.
 */
const settingsLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many settings requests – please slow down.', code: 'SETTINGS_RATE_LIMIT' }
});

/**
 * Scheduling & availability endpoints – 60 req / min per IP.
 * Covers provider calendar management, reschedule requests, AI-driven
 * schedule suggestions, and job ranking operations.
 */
const schedulingLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many scheduling requests – please slow down.', code: 'SCHEDULING_RATE_LIMIT' }
});

/**
 * Rentals endpoints – 60 req / min per IP.
 * Covers rental browse, booking creation, reviews, and image uploads.
 * Public browse routes and auth-gated write routes share this budget.
 */
const rentalsLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many rental requests – please slow down.', code: 'RENTALS_RATE_LIMIT' }
});

/**
 * Referrals endpoints – 60 req / min per IP.
 * Public /validate and /track endpoints are especially exposed to bot abuse;
 * a per-minute window keeps automated farming in check.
 */
const referralsLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many referral requests – please slow down.', code: 'REFERRALS_RATE_LIMIT' }
});

/**
 * Providers endpoints – 60 req / min per IP.
 * Covers public browse + authenticated profile management, dashboard, and
 * analytics endpoints.  Admin operations share this budget.
 */
const providersLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many provider requests – please slow down.', code: 'PROVIDERS_RATE_LIMIT' }
});

/**
 * Partners endpoints – 30 req / min per IP.
 * Covers public onboarding flow (start, business-info, verification, api-setup, activate)
 * and admin partner management.  Tighter window reflects privileged API-key operations.
 */
const partnersLimiter = make({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many partner requests – please slow down.', code: 'PARTNERS_RATE_LIMIT' }
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
  userManagementLimiter,
  trustVerificationLimiter,
  suppliesLimiter,
  settingsLimiter,
  schedulingLimiter,
  rentalsLimiter,
  referralsLimiter,
  providersLimiter,
  partnersLimiter
};

