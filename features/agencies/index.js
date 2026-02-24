/**
 * Agencies Feature Module
 *
 * Public API for the Agencies domain.
 * All external code must import from this index — not from internal files directly.
 *
 * External dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/models/User
 * - src/services/emailService
 * - src/services/notificationService
 * - src/utils/responseHelper
 * - src/config/logger
 */

// ── Routes ───────────────────────────────────────────────────────────────────
const routes = require('./routes/agencies');

// ── Models ───────────────────────────────────────────────────────────────────
const Agency     = require('./models/Agency');
const UserAgency = require('./models/UserAgency');

module.exports = {
  // Routes (mount in server.js)
  routes,

  // Models
  Agency,
  UserAgency,
};
