/**
 * Provider Feature Module
 *
 * Public API for the Provider (service professional) domain.
 * All external code must import from this index — not from internal files directly.
 *
 * External dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/models/User
 * - src/services/emailService
 * - src/services/notificationService
 * - src/services/cloudinaryService
 * - src/services/googleMapsService
 * - src/utils/responseHelper
 * - src/config/logger
 */

// ── Routes ───────────────────────────────────────────────────────────────────
const routes = require('./routes/providers');

// ── Models ───────────────────────────────────────────────────────────────────
const Provider                 = require('./models/Provider');
const ProviderBusinessInfo     = require('./models/ProviderBusinessInfo');
const ProviderFinancialInfo    = require('./models/ProviderFinancialInfo');
const ProviderPerformance      = require('./models/ProviderPerformance');
const ProviderPreferences      = require('./models/ProviderPreferences');
const ProviderProfessionalInfo = require('./models/ProviderProfessionalInfo');
const ProviderSkill            = require('./models/ProviderSkill');
const ProviderVerification     = require('./models/ProviderVerification');

// ── Services ─────────────────────────────────────────────────────────────────
const providerDashboardService    = require('./services/providerDashboardService');
const providerVerificationService = require('./services/providerVerificationService');

module.exports = {
  // Routes (mount in server.js)
  routes,

  // Models
  Provider,
  ProviderBusinessInfo,
  ProviderFinancialInfo,
  ProviderPerformance,
  ProviderPreferences,
  ProviderProfessionalInfo,
  ProviderSkill,
  ProviderVerification,

  // Services
  providerDashboardService,
  providerVerificationService,
};
