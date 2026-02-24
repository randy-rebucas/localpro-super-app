/**
 * Marketplace Feature Module
 *
 * Public API for the Marketplace domain.
 * All external code must import from this index — not from internal files directly.
 *
 * External dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/middleware/routeValidation
 * - src/models/User
 * - src/services/cloudinaryService
 * - src/services/googleMapsService
 * - src/services/paypalService
 * - src/services/webhookService
 * - src/config/cloudinary
 * - src/config/logger
 * - src/utils/responseHelper
 * - src/utils/controllerValidation
 * - src/utils/validation
 * - features/communication/services/notificationService (cross-feature)
 * - features/communication/models/Communication (cross-feature)
 */

// ── Routes ───────────────────────────────────────────────────────────────────
const routes = require('./routes/marketplace');

// ── Models ───────────────────────────────────────────────────────────────────
const Marketplace = require('./models/Marketplace');
const ServiceCategory = require('./models/ServiceCategory');
const TaskChecklist = require('./models/TaskChecklist');

// ── Services ─────────────────────────────────────────────────────────────────
const automatedMarketplaceNoShowService = require('./services/automatedMarketplaceNoShowService');

module.exports = {
  // Routes (mount in server.js)
  routes,

  // Models
  Marketplace,
  ServiceCategory,
  TaskChecklist,

  // Services
  automatedMarketplaceNoShowService,
};
