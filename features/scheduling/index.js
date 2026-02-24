/**
 * Scheduling Feature Module
 *
 * Public API for the Scheduling & Availability domain.
 * All external code must import from this index — not from internal files directly.
 *
 * Internal structure:
 *   models/      — CalendarAvailability, RescheduleRequest, SchedulingSuggestion
 *   controllers/ — schedulingController, availabilityController
 *   routes/      — scheduling, availability
 *   services/    — schedulingService, availabilityService,
 *                  automatedSchedulingService, automatedAvailabilityService,
 *                  automatedBookingService, automatedMarketplaceBookingFollowUpService
 *
 * Shared platform dependencies (from src/):
 * - src/middleware/auth
 * - src/models/User, Marketplace, Communication
 * - src/services/notificationService, emailService, googleMapsService, cloudinaryService
 * - src/config/logger, src/utils/responseHelper, src/utils/controllerValidation
 *
 * Cross-feature dependencies:
 * - features/jobs     → Job, JobRankingScore, JobSchedule
 * - features/provider → Provider, ProviderPerformance, ProviderProfessionalInfo, ProviderPreferences
 */

// ── Routes (internal) ────────────────────────────────────────────────────────
const routes             = require('./routes/scheduling');
const availabilityRoutes = require('./routes/availability');

// ── Models (internal) ────────────────────────────────────────────────────────
const CalendarAvailability = require('./models/CalendarAvailability');
const RescheduleRequest    = require('./models/RescheduleRequest');
const SchedulingSuggestion = require('./models/SchedulingSuggestion');

// ── Services (internal) ──────────────────────────────────────────────────────
const schedulingService                            = require('./services/schedulingService');
const availabilityService                          = require('./services/availabilityService');
const automatedSchedulingService                   = require('./services/automatedSchedulingService');
const automatedAvailabilityService                 = require('./services/automatedAvailabilityService');
const automatedBookingService                      = require('./services/automatedBookingService');
const automatedMarketplaceBookingFollowUpService   = require('./services/automatedMarketplaceBookingFollowUpService');

module.exports = {
  // Routes (mount in server.js)
  routes,
  availabilityRoutes,

  // Models
  CalendarAvailability,
  RescheduleRequest,
  SchedulingSuggestion,

  // Services
  schedulingService,
  availabilityService,
  automatedSchedulingService,
  automatedAvailabilityService,
  automatedBookingService,
  automatedMarketplaceBookingFollowUpService,
};
