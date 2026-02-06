const express = require('express');
const { body, param, query } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  validateObjectIdParam,
  validatePaginationParams,
  validateSearchParams
} = require('../middleware/routeValidation');
const {
  // Service - Basic
  getServices,
  getService,
  getServiceBySlug,
  getNearbyServices,
  createService,
  updateService,
  deleteService,
  deactivateService,
  activateService,
  uploadServiceImages,

  // Service - Categories
  getServiceCategories,
  getCategoryDetails,
  listServiceCategoriesAdmin,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,

  // Service - Approval Workflow
  submitServiceForReview,
  approveService,
  rejectService,
  getPendingReviewServices,

  // Service - Featuring
  featureService,
  unfeatureService,
  getFeaturedServices,

  // Service - Packages & Add-ons
  addServicePackage,
  updateServicePackage,
  deleteServicePackage,
  addServiceAddOn,
  updateServiceAddOn,
  deleteServiceAddOn,

  // Service - SEO, Promotions, Availability
  updateServiceSEO,
  createServicePromotion,
  endServicePromotion,
  updateServiceAvailability,
  archiveService,

  // Service - Analytics & External
  getServiceAnalytics,
  linkServiceExternalId,
  getServiceReviews,

  // Service - Provider
  getMyServices,
  getProvidersForService,
  getProviderDetails,
  getProviderServices,

  // Booking - Basic
  createBooking,
  getBooking,
  getBookings,
  getBookingByNumber,
  getMyBookings,
  updateBookingStatus,
  uploadBookingPhotos,

  // Booking - Workflow
  confirmBooking,
  startBooking,
  completeBooking,
  cancelBooking,
  rescheduleBooking,
  signOffBooking,

  // Booking - GPS Tracking
  updateProviderLocation,
  markProviderArrived,
  getLocationHistory,

  // Booking - Disputes
  openDispute,
  addDisputeEvidence,
  addDisputeMessage,
  resolveDispute,
  getDisputedBookings,

  // Booking - Reviews
  addReview,
  addClientReview,
  addProviderReview,
  respondToReview,

  // Booking - Payments & Tips
  approvePayPalBooking,
  getPayPalOrderDetails,
  addBookingTip,

  // Booking - Analytics & External
  getBookingStats,
  linkBookingExternalId
} = require('../controllers/marketplaceController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

// ============================================
// PUBLIC SERVICE ROUTES
// ============================================

/**
 * @swagger
 * /api/marketplace/services:
 *   get:
 *     summary: Get list of services
 *     tags: [Marketplace - Services]
 *     security: []
 */
router.get('/services',
  validatePaginationParams,
  validateSearchParams,
  getServices
);

/**
 * @swagger
 * /api/marketplace/services/categories:
 *   get:
 *     summary: Get service categories
 *     tags: [Marketplace - Categories]
 *     security: []
 */
router.get('/services/categories', getServiceCategories);

/**
 * @swagger
 * /api/marketplace/services/categories/:category:
 *   get:
 *     summary: Get category details
 *     tags: [Marketplace - Categories]
 *     security: []
 */
router.get('/services/categories/:category', getCategoryDetails);

/**
 * @swagger
 * /api/marketplace/services/featured:
 *   get:
 *     summary: Get featured services
 *     tags: [Marketplace - Services]
 *     security: []
 */
router.get('/services/featured', validatePaginationParams, getFeaturedServices);

/**
 * @swagger
 * /api/marketplace/services/nearby:
 *   get:
 *     summary: Get nearby services
 *     tags: [Marketplace - Services]
 *     security: []
 */
router.get('/services/nearby',
  validateSearchParams,
  getNearbyServices
);

/**
 * @swagger
 * /api/marketplace/services/slug/:slug:
 *   get:
 *     summary: Get service by slug
 *     tags: [Marketplace - Services]
 *     security: []
 */
router.get('/services/slug/:slug', getServiceBySlug);

/**
 * @swagger
 * /api/marketplace/services/:id/reviews:
 *   get:
 *     summary: Get service reviews
 *     tags: [Marketplace - Reviews]
 *     security: []
 */
router.get('/services/:id/reviews',
  validateObjectIdParam('id'),
  validatePaginationParams,
  getServiceReviews
);

/**
 * @swagger
 * /api/marketplace/services/:id:
 *   get:
 *     summary: Get service by ID
 *     tags: [Marketplace - Services]
 *     security: []
 */
router.get('/services/:id',
  validateObjectIdParam('id'),
  getService
);

/**
 * @swagger
 * /api/marketplace/services/:id/providers:
 *   get:
 *     summary: Get providers for a service
 *     tags: [Marketplace - Services]
 *     security: []
 */
router.get('/services/:id/providers',
  validateObjectIdParam('id'),
  validatePaginationParams,
  getProvidersForService
);

/**
 * @swagger
 * /api/marketplace/providers/:providerId/services:
 *   get:
 *     summary: Get services by provider
 *     tags: [Marketplace - Providers]
 *     security: []
 */
router.get('/providers/:providerId/services',
  validateObjectIdParam('providerId'),
  validatePaginationParams,
  getProviderServices
);

/**
 * @swagger
 * /api/marketplace/providers/:id:
 *   get:
 *     summary: Get provider details
 *     tags: [Marketplace - Providers]
 *     security: []
 */
router.get('/providers/:id',
  validateObjectIdParam('id'),
  getProviderDetails
);

// ============================================
// PROTECTED ROUTES - Require Authentication
// ============================================
router.use(auth);

// ============================================
// ADMIN - Category Management
// ============================================

/**
 * @swagger
 * /api/marketplace/services/categories/manage:
 *   get:
 *     summary: List service categories for admin management
 *     tags: [Marketplace - Admin]
 */
router.get('/services/categories/manage', authorize('admin'), listServiceCategoriesAdmin);

router.post('/services/categories',
  authorize('admin'),
  body('key').notEmpty().withMessage('Key is required'),
  body('name').notEmpty().withMessage('Name is required'),
  createServiceCategory
);

router.put('/services/categories/:id',
  authorize('admin'),
  validateObjectIdParam('id'),
  updateServiceCategory
);

router.delete('/services/categories/:id',
  authorize('admin'),
  validateObjectIdParam('id'),
  deleteServiceCategory
);

// ============================================
// ADMIN - Service Approval Workflow
// ============================================

/**
 * @swagger
 * /api/marketplace/services/pending-review:
 *   get:
 *     summary: Get services pending review (Admin)
 *     tags: [Marketplace - Admin]
 */
router.get('/services/pending-review',
  authorize('admin'),
  validatePaginationParams,
  getPendingReviewServices
);

router.post('/services/:id/approve',
  authorize('admin'),
  validateObjectIdParam('id'),
  approveService
);

router.post('/services/:id/reject',
  authorize('admin'),
  validateObjectIdParam('id'),
  body('reason').notEmpty().withMessage('Rejection reason is required'),
  rejectService
);

// ============================================
// ADMIN - Service Featuring
// ============================================

router.post('/services/:id/feature',
  authorize('admin'),
  validateObjectIdParam('id'),
  featureService
);

router.delete('/services/:id/feature',
  authorize('admin'),
  validateObjectIdParam('id'),
  unfeatureService
);

// ============================================
// ADMIN - Dispute Management
// ============================================

/**
 * @swagger
 * /api/marketplace/bookings/disputes:
 *   get:
 *     summary: Get all disputed bookings (Admin)
 *     tags: [Marketplace - Admin]
 */
router.get('/bookings/disputes',
  authorize('admin'),
  validatePaginationParams,
  getDisputedBookings
);

router.post('/bookings/:id/dispute/resolve',
  authorize('admin'),
  validateObjectIdParam('id'),
  body('outcome').notEmpty().withMessage('Resolution outcome is required'),
  resolveDispute
);

// ============================================
// MY SERVICES & BOOKINGS
// ============================================

/**
 * @swagger
 * /api/marketplace/my-services:
 *   get:
 *     summary: Get my services (Provider)
 *     tags: [Marketplace - Provider]
 */
router.get('/my-services', getMyServices);

/**
 * @swagger
 * /api/marketplace/my-bookings:
 *   get:
 *     summary: Get my bookings
 *     tags: [Marketplace - Bookings]
 */
router.get('/my-bookings', getMyBookings);

// ============================================
// SERVICE CRUD - Provider/Admin
// ============================================

// Conditional middleware for multipart/form-data
const optionalImageUpload = (req, res, next) => {
  const contentType = req.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    return uploaders.marketplace.array('images', 5)(req, res, next);
  }
  next();
};

router.post('/services',
  authorize('provider', 'admin'),
  optionalImageUpload,
  createService
);

router.put('/services/:id',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  updateService
);

router.delete('/services/:id',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  deleteService
);

router.patch('/services/:id/deactivate',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  deactivateService
);

router.patch('/services/:id/activate',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  activateService
);

router.post('/services/:id/images',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  uploaders.marketplace.array('images', 5),
  uploadServiceImages
);

// ============================================
// SERVICE - Approval Workflow (Provider)
// ============================================

router.post('/services/:id/submit',
  authorize('provider'),
  validateObjectIdParam('id'),
  submitServiceForReview
);

router.post('/services/:id/archive',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  archiveService
);

// ============================================
// SERVICE - Packages & Add-ons
// ============================================

router.post('/services/:id/packages',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  body('name').notEmpty().withMessage('Package name is required'),
  body('price').isNumeric().withMessage('Package price is required'),
  addServicePackage
);

router.put('/services/:id/packages/:packageId',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  updateServicePackage
);

router.delete('/services/:id/packages/:packageId',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  deleteServicePackage
);

router.post('/services/:id/addons',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  body('name').notEmpty().withMessage('Add-on name is required'),
  body('price').isNumeric().withMessage('Add-on price is required'),
  addServiceAddOn
);

router.put('/services/:id/addons/:addonId',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  updateServiceAddOn
);

router.delete('/services/:id/addons/:addonId',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  deleteServiceAddOn
);

// ============================================
// SERVICE - SEO, Promotions, Availability
// ============================================

router.put('/services/:id/seo',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  updateServiceSEO
);

router.post('/services/:id/promotions',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discountValue').isNumeric().withMessage('Discount value is required'),
  createServicePromotion
);

router.delete('/services/:id/promotions',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  endServicePromotion
);

router.put('/services/:id/availability',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  updateServiceAvailability
);

// ============================================
// SERVICE - Analytics & External IDs
// ============================================

router.get('/services/:id/analytics',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  getServiceAnalytics
);

router.post('/services/:id/external-ids',
  authorize('provider', 'admin'),
  validateObjectIdParam('id'),
  body('system').notEmpty().withMessage('System is required'),
  body('externalId').notEmpty().withMessage('External ID is required'),
  linkServiceExternalId
);

// ============================================
// BOOKING - Basic Operations
// ============================================

router.post('/bookings', createBooking);

router.get('/bookings', getBookings);

router.get('/bookings/stats', getBookingStats);

router.get('/bookings/number/:bookingNumber', getBookingByNumber);

router.get('/bookings/:id',
  validateObjectIdParam('id'),
  getBooking
);

router.put('/bookings/:id/status',
  validateObjectIdParam('id'),
  updateBookingStatus
);

router.post('/bookings/:id/photos',
  validateObjectIdParam('id'),
  uploaders.marketplace.array('photos', 5),
  uploadBookingPhotos
);

// ============================================
// BOOKING - Workflow (Confirm, Start, Complete, Cancel, Reschedule)
// ============================================

router.post('/bookings/:id/confirm',
  validateObjectIdParam('id'),
  confirmBooking
);

router.post('/bookings/:id/start',
  validateObjectIdParam('id'),
  startBooking
);

router.post('/bookings/:id/complete',
  validateObjectIdParam('id'),
  completeBooking
);

router.post('/bookings/:id/cancel',
  validateObjectIdParam('id'),
  body('reason').notEmpty().withMessage('Cancellation reason is required'),
  cancelBooking
);

router.post('/bookings/:id/reschedule',
  validateObjectIdParam('id'),
  body('newDate').notEmpty().withMessage('New date is required'),
  rescheduleBooking
);

router.post('/bookings/:id/signoff',
  validateObjectIdParam('id'),
  signOffBooking
);

// ============================================
// BOOKING - GPS Tracking
// ============================================

router.post('/bookings/:id/location',
  validateObjectIdParam('id'),
  body('lat').isNumeric().withMessage('Latitude is required'),
  body('lng').isNumeric().withMessage('Longitude is required'),
  updateProviderLocation
);

router.post('/bookings/:id/arrived',
  validateObjectIdParam('id'),
  markProviderArrived
);

router.get('/bookings/:id/location-history',
  validateObjectIdParam('id'),
  getLocationHistory
);

// ============================================
// BOOKING - Disputes
// ============================================

router.post('/bookings/:id/dispute',
  validateObjectIdParam('id'),
  body('reason').notEmpty().withMessage('Dispute reason is required'),
  body('description').notEmpty().withMessage('Dispute description is required'),
  openDispute
);

router.post('/bookings/:id/dispute/evidence',
  validateObjectIdParam('id'),
  body('type').notEmpty().withMessage('Evidence type is required'),
  body('url').notEmpty().withMessage('Evidence URL is required'),
  addDisputeEvidence
);

router.post('/bookings/:id/dispute/messages',
  validateObjectIdParam('id'),
  body('message').notEmpty().withMessage('Message is required'),
  addDisputeMessage
);

// ============================================
// BOOKING - Reviews
// ============================================

router.post('/bookings/:id/review',
  validateObjectIdParam('id'),
  uploaders.marketplace.array('photos', 3),
  addReview
);

router.post('/bookings/:id/reviews/client',
  validateObjectIdParam('id'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('comment').notEmpty().withMessage('Comment is required'),
  addClientReview
);

router.post('/bookings/:id/reviews/provider',
  validateObjectIdParam('id'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  addProviderReview
);

router.post('/bookings/:id/reviews/respond',
  validateObjectIdParam('id'),
  body('message').notEmpty().withMessage('Response message is required'),
  respondToReview
);

// ============================================
// BOOKING - Payments & Tips
// ============================================

router.post('/bookings/paypal/approve', approvePayPalBooking);

router.get('/bookings/paypal/order/:orderId', getPayPalOrderDetails);

router.post('/bookings/:id/tip',
  validateObjectIdParam('id'),
  body('amount').isNumeric().withMessage('Tip amount is required'),
  addBookingTip
);

// ============================================
// BOOKING - External IDs
// ============================================

router.post('/bookings/:id/external-ids',
  validateObjectIdParam('id'),
  body('system').notEmpty().withMessage('System is required'),
  body('externalId').notEmpty().withMessage('External ID is required'),
  linkBookingExternalId
);

module.exports = router;
