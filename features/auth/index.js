/**
 * Auth Feature Module
 *
 * Public API for Authentication, Registration, OAuth, and Account management.
 * All external code must import from this index — not from internal files directly.
 *
 * This is a shared/platform-level module. Other feature modules depend on:
 *   - User model (user identity)
 *   - auth / authorize middleware (route protection)
 *
 * External dependencies (from src/):
 * - src/services/emailService
 * - src/services/twilioService
 * - src/services/notificationService
 * - src/config/logger
 */

// ── Routes ───────────────────────────────────────────────────────────────────
const routes             = require('./routes/auth');
const registrationRoutes = require('./routes/registration');
const oauthRoutes        = require('./routes/oauth');
const accountRoutes      = require('./routes/account');

// ── Middleware ────────────────────────────────────────────────────────────────
const { auth, authorize } = require('../../src/middleware/auth');

// ── Models ───────────────────────────────────────────────────────────────────
const User        = require('../../src/models/User');
const AccessToken = require('../../src/models/AccessToken');

module.exports = {
  // Routes (mount in server.js)
  routes,
  registrationRoutes,
  oauthRoutes,
  accountRoutes,

  // Shared middleware (re-exported for convenience)
  auth,
  authorize,

  // Models
  User,
  AccessToken,
};
