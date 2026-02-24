/**
 * Users Feature Module
 *
 * Public API for the Users domain.
 * All external code must import from this index — not from internal files directly.
 *
 * Note: The core User model stays in src/models/User.js (platform model used across all domains).
 *
 * External dependencies (from src/):
 * - src/models/User (platform model — stays in src/)
 * - src/middleware/auth (auth, authorize)
 * - src/services/emailService
 * - src/utils/auditLogger
 * - src/utils/objectIdUtils
 * - src/config/logger
 *
 * Cross-feature dependencies:
 * - features/provider/models/Provider
 */

// ── Routes ───────────────────────────────────────────────────────────────────
const routes = require('./routes/userManagement');

// ── Models ───────────────────────────────────────────────────────────────────
const UserActivity    = require('./models/UserActivity');
const UserManagement  = require('./models/UserManagement');
const UserSettings    = require('./models/UserSettings');
const UserTrust       = require('./models/UserTrust');

module.exports = {
  // Routes (mount in server.js)
  routes,

  // Models
  UserActivity,
  UserManagement,
  UserSettings,
  UserTrust,
};
