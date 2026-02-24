/**
 * Communication Feature Module
 *
 * Public API for the Communication domain.
 * All external code must import from this index — not from internal files directly.
 *
 * External dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/models/User
 * - src/services/emailService
 * - src/services/twilioService
 * - src/config/cloudinary
 * - src/config/logger
 * - src/utils/objectIdUtils
 * - features/users/models/UserSettings (cross-feature)
 */

// ── Routes ───────────────────────────────────────────────────────────────────
const communicationRoutes = require('./routes/communication');
const notificationsRoutes = require('./routes/notifications');

// ── Models ───────────────────────────────────────────────────────────────────
const Communication = require('./models/Communication');

// ── Services ─────────────────────────────────────────────────────────────────
const notificationService = require('./services/notificationService');

module.exports = {
  // Routes (mount in server.js)
  communicationRoutes,
  notificationsRoutes,

  // Models
  Communication,

  // Services
  notificationService,
};
