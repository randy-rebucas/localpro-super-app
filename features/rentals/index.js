/**
 * Rentals Feature Module
 *
 * Public API for the Rentals domain.
 * All external code must import from this index — not from internal files directly.
 *
 * External dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/models/User
 * - src/services/emailService
 * - src/services/notificationService
 * - src/services/cloudinaryService
 * - src/utils/responseHelper
 * - src/config/logger
 */

// ── Routes ───────────────────────────────────────────────────────────────────
const routes = require('./routes/rentals');

// ── Models ───────────────────────────────────────────────────────────────────
const Rentals = require('./models/Rentals');

// ── Services ─────────────────────────────────────────────────────────────────
const automatedRentalReminderService = require('./services/automatedRentalReminderService');

module.exports = {
  // Routes (mount in server.js)
  routes,

  // Models
  Rentals,

  // Services
  automatedRentalReminderService,
};
