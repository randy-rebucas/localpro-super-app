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

/**
 * Academy endpoints – 60 req / min per IP.
 * Covers course browsing, enrollment, progress tracking, and reviews.
 */
const academyLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many academy requests – please slow down.', code: 'ACADEMY_RATE_LIMIT' }
});

/**
 * Ads & Broadcaster endpoints – 60 req / min per IP.
 * Covers ad browsing, analytics, click tracking, and broadcaster views.
 */
const adsLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many ad requests – please slow down.', code: 'ADS_RATE_LIMIT' }
});

/**
 * Agencies endpoints – 60 req / min per IP.
 * Covers agency browse, member management, and analytics.
 */
const agenciesLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many agency requests – please slow down.', code: 'AGENCIES_RATE_LIMIT' }
});

/**
 * Feeds endpoints – 120 req / min per IP.
 * Personalized feed polling is high-frequency; generous window avoids throttling
 * normal app usage while still blocking bots.
 */
const feedsLimiter = make({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many feed requests – please slow down.', code: 'FEEDS_RATE_LIMIT' }
});

/**
 * Finance endpoints – 30 req / min per IP.
 * Covers transactions, withdrawals, top-ups, escrows, wallet, paymongo, paymaya,
 * quotes/invoices.  Tight window protects financial operations from abuse.
 */
const financeLimiter = make({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many finance requests – please slow down.', code: 'FINANCE_RATE_LIMIT' }
});

/**
 * Jobs endpoints – 60 req / min per IP.
 * Covers job browse, apply, workflow management, and categories.
 */
const jobsLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many job requests – please slow down.', code: 'JOBS_RATE_LIMIT' }
});

/**
 * Activities endpoints – 120 req / min per IP.
 * Activity feed, timeline, and leaderboard are polled frequently.
 */
const activitiesLimiter = make({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many activity requests – please slow down.', code: 'ACTIVITIES_RATE_LIMIT' }
});

/**
 * Communication & Notifications endpoints – 120 req / min per IP.
 * Messaging and notification polling are high-frequency in-app actions.
 */
const communicationLimiter = make({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many communication requests – please slow down.', code: 'COMMUNICATION_RATE_LIMIT' }
});

/**
 * Analytics endpoints – 30 req / min per IP.
 * Analytics queries are expensive aggregations; tight window protects DB load.
 */
const analyticsLimiter = make({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many analytics requests – please slow down.', code: 'ANALYTICS_RATE_LIMIT' }
});

/**
 * Maps endpoints – 30 req / min per IP.
 * Each Maps API call invokes a paid external Google Maps API; strict throttling
 * protects cost and prevents abuse.
 */
const mapsLimiter = make({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many maps requests – please slow down.', code: 'MAPS_RATE_LIMIT' }
});

/**
 * Support endpoints – 60 req / min per IP.
 * Covers support tickets and live chat sessions.
 */
const supportLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many support requests – please slow down.', code: 'SUPPORT_RATE_LIMIT' }
});

/**
 * LocalPro Plus / Subscription endpoints – 30 req / min per IP.
 * Subscription management, plan changes, and payment confirmations are
 * sensitive write operations; tighter window prevents automated abuse.
 */
const localproPlusLimiter = make({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many subscription requests – please slow down.', code: 'LOCALPRO_PLUS_RATE_LIMIT' }
});

/**
 * Favorites endpoints – 120 req / min per IP.
 * Adding/removing favorites is a frequent lightweight action.
 */
const favoritesLimiter = make({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many favorites requests – please slow down.', code: 'FAVORITES_RATE_LIMIT' }
});

/**
 * Staff management endpoints – 60 req / min per IP.
 */
const staffLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many staff requests – please slow down.', code: 'STAFF_RATE_LIMIT' }
});

/**
 * Permissions endpoints – 60 req / min per IP.
 */
const permissionsLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many permission requests – please slow down.', code: 'PERMISSIONS_RATE_LIMIT' }
});

/**
 * Webhooks endpoints – 60 req / min per IP.
 */
const webhooksLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many webhook requests – please slow down.', code: 'WEBHOOKS_RATE_LIMIT' }
});

/**
 * Announcements endpoints – 60 req / min per IP.
 */
const announcementsLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many announcement requests – please slow down.', code: 'ANNOUNCEMENTS_RATE_LIMIT' }
});

/**
 * API Keys management – 30 req / min per IP.
 * Key generation, rotation, and revocation are sensitive privileged operations.
 */
const apiKeysLimiter = make({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many API key requests – please slow down.', code: 'API_KEYS_RATE_LIMIT' }
});

/**
 * Masked Calls endpoints – 20 req / min per IP.
 * Each call invokes the Twilio API which has a per-call cost; very tight
 * window prevents cost abuse.
 */
const maskedCallsLimiter = make({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many call requests – please slow down.', code: 'MASKED_CALLS_RATE_LIMIT' }
});

/**
 * Geofence events – 120 req / min per IP.
 * GPS-triggered geofence events can be high-frequency from mobile clients.
 */
const geofenceLimiter = make({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many geofence requests – please slow down.', code: 'GEOFENCE_RATE_LIMIT' }
});

/**
 * GPS Logs – 120 req / min per IP.
 * Location tracking from mobile clients is high-frequency.
 */
const gpsLogsLimiter = make({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many GPS log requests – please slow down.', code: 'GPS_LOGS_RATE_LIMIT' }
});

/**
 * Time Entries – 120 req / min per IP.
 * Clock-in/out and batch GPS+time submissions can be frequent.
 */
const timeEntriesLimiter = make({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many time entry requests – please slow down.', code: 'TIME_ENTRIES_RATE_LIMIT' }
});

/**
 * Admin / internal endpoints – 60 req / min per IP.
 * Covers audit logs, CORS origins, system logs, monitoring, metrics, database
 * monitoring/optimization, email marketing, error monitoring, and alerts.
 * All routes behind this limiter require admin role.
 */
const adminLimiter = make({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many admin requests – please slow down.', code: 'ADMIN_RATE_LIMIT' }
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
  partnersLimiter,
  academyLimiter,
  adsLimiter,
  agenciesLimiter,
  feedsLimiter,
  financeLimiter,
  jobsLimiter,
  activitiesLimiter,
  communicationLimiter,
  analyticsLimiter,
  mapsLimiter,
  supportLimiter,
  localproPlusLimiter,
  favoritesLimiter,
  staffLimiter,
  permissionsLimiter,
  webhooksLimiter,
  announcementsLimiter,
  apiKeysLimiter,
  maskedCallsLimiter,
  geofenceLimiter,
  gpsLogsLimiter,
  timeEntriesLimiter,
  adminLimiter
};

