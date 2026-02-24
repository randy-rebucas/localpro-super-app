/**
 * Academy Feature Module
 *
 * Public API for the Academy (e-learning) domain.
 * All files live inside this module — nothing is imported from src/ directly
 * except shared platform infrastructure (auth middleware, User model, etc.).
 *
 * Internal structure:
 *   models/      — Academy, Course, Enrollment, Certification, AcademyCategory
 *   controllers/ — academyController
 *   routes/      — academy router
 *   services/    — automatedAcademyCertificateService, automatedAcademyEngagementService
 *
 * Shared platform dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/models/User, Favorite, Communication, UserSettings
 * - src/services/cloudinaryService, emailService, notificationService
 * - src/utils/responseHelper
 * - src/config/logger, cloudinary
 */

// ── Routes (internal) ────────────────────────────────────────────────────────
const routes = require('./routes/academy');

// ── Models (internal) ────────────────────────────────────────────────────────
const {
  AcademyCategory,
  Course,
  Enrollment,
  Certification,
  VALID_COURSE_LEVELS,
  VALID_LESSON_TYPES,
  VALID_CONTENT_TYPES,
  VALID_SESSION_TYPES,
  VALID_ENROLLMENT_STATUSES,
  VALID_PAYMENT_STATUSES,
  VALID_COURSE_STATUSES,
  VALID_REQUIREMENT_TYPES,
  VALID_LANGUAGES,
  VALID_CURRENCIES,
} = require('./models/Academy');

// ── Services (internal) ───────────────────────────────────────────────────────
const automatedAcademyCertificateService = require('./services/automatedAcademyCertificateService');
const automatedAcademyEngagementService  = require('./services/automatedAcademyEngagementService');

module.exports = {
  // Routes (mount in server.js)
  routes,

  // Models
  AcademyCategory,
  Course,
  Enrollment,
  Certification,
  // Alias kept for any existing code that imports Academy directly
  Academy: Course,

  // Constants
  CONSTANTS: {
    VALID_COURSE_LEVELS,
    VALID_LESSON_TYPES,
    VALID_CONTENT_TYPES,
    VALID_SESSION_TYPES,
    VALID_ENROLLMENT_STATUSES,
    VALID_PAYMENT_STATUSES,
    VALID_COURSE_STATUSES,
    VALID_REQUIREMENT_TYPES,
    VALID_LANGUAGES,
    VALID_CURRENCIES,
  },

  // Services
  automatedAcademyCertificateService,
  automatedAcademyEngagementService,
};
