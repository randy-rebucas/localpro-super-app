/**
 * Activities Feature Module
 *
 * Public API for the Activities domain.
 * All external code must import from this index — not from internal files directly.
 *
 * External dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/utils/logger
 */

// ── Routes ───────────────────────────────────────────────────────────────────
const routes = require('./routes/activities');

// ── Models ───────────────────────────────────────────────────────────────────
const Activity = require('./models/Activity');

// ── Services ─────────────────────────────────────────────────────────────────
const activityService = require('./services/activityService');

module.exports = {
  // Routes (mount in server.js)
  routes,

  // Models
  Activity,

  // Services
  activityService,
};
