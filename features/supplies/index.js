/**
 * Supplies Feature Module
 *
 * Public API for the Supplies feature.
 * External code should import from this index rather than reaching
 * into internal files directly.
 *
 * External dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/config/cloudinary (uploaders)
 * - src/config/logger
 * - src/services/cloudinaryService
 * - src/services/googleMapsService
 * - src/services/emailService
 * - src/services/aiService
 * - src/services/notificationService
 * - src/utils/responseHelper
 * - src/models/User
 * - src/models/Communication (Notification)
 */

const models = require('./models/Supplies');
const ProductReview = require('./models/ProductReview');
const StockHistory = require('./models/StockHistory');
const routes = require('./routes/supplies');
const validators = require('./validators/suppliesValidator');

// Services
const suppliesService = require('./services/suppliesService');
const orderService = require('./services/orderService');
const reviewService = require('./services/reviewService');
const descriptionService = require('./services/descriptionService');
const statisticsService = require('./services/statisticsService');

module.exports = {
  // Models
  Product: models.Product,
  ProductCategory: models.ProductCategory,
  SubscriptionKit: models.SubscriptionKit,
  Order: models.Order,
  ProductReview,
  StockHistory,

  // Constants
  CONSTANTS: models.CONSTANTS,

  // Routes (Express router)
  routes,

  // Validators
  validators,

  // Services
  suppliesService,
  orderService,
  reviewService,
  descriptionService,
  statisticsService
};
