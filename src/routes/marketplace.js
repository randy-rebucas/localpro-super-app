const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { 
  validateObjectIdParam, 
  validatePaginationParams, 
  validateSearchParams
} = require('../middleware/routeValidation');
const {
  getServices,
  getService,
  getNearbyServices,
  getServiceCategories,
  getCategoryDetails,
  listServiceCategoriesAdmin,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  createService,
  updateService,
  deleteService,
  uploadServiceImages,
  createBooking,
  getBooking,
  getBookings,
  updateBookingStatus,
  uploadBookingPhotos,
  addReview,
  approvePayPalBooking,
  getPayPalOrderDetails,
  getMyServices,
  getMyBookings,
  getProvidersForService,
  getProviderDetails,
  getProviderServices,
  deactivateService,
  activateService
} = require('../controllers/marketplaceController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

/**
 * @swagger
 * /api/marketplace/services:
 *   get:
 *     summary: Get list of services
 *     tags: [Marketplace]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *     responses:
 *       200:
 *         description: List of services
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// Public routes
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
 *     tags: [Marketplace]
 *     security: []
 *     responses:
 *       200:
 *         description: List of service categories
 */
// Category routes - specific routes must come before parameterized routes
router.get('/services/categories', getServiceCategories);

/**
 * @swagger
 * /api/marketplace/services/categories/{category}:
 *   get:
 *     summary: Get category details
 *     tags: [Marketplace]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/services/categories/:category', getCategoryDetails);

/**
 * @swagger
 * /api/marketplace/services/nearby:
 *   get:
 *     summary: Get nearby services
 *     tags: [Marketplace]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of nearby services
 */
router.get('/services/nearby', 
  validateSearchParams,
  getNearbyServices
);

/**
 * @swagger
 * /api/marketplace/services/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Marketplace]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Service details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/services/:id', 
  validateObjectIdParam('id'),
  getService
);

/**
 * @swagger
 * /api/marketplace/services/{id}/providers:
 *   get:
 *     summary: Get providers for a service
 *     tags: [Marketplace]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of providers for the service
 */
router.get('/services/:id/providers',
  validateObjectIdParam('id'),
  validatePaginationParams,
  getProvidersForService
);

/**
 * @swagger
 * /api/marketplace/providers/{providerId}/services:
 *   get:
 *     summary: Get services by provider
 *     tags: [Marketplace]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of provider services
 */
// Provider routes - specific routes must come before parameterized routes
router.get('/providers/:providerId/services',
  validateObjectIdParam('providerId'),
  validatePaginationParams,
  getProviderServices
);

/**
 * @swagger
 * /api/marketplace/providers/{id}:
 *   get:
 *     summary: Get provider details
 *     tags: [Marketplace]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Provider details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Provider details route
router.get('/providers/:id',
  validateObjectIdParam('id'),
  getProviderDetails
);

// Protected routes
router.use(auth);

/**
 * @swagger
 * /api/marketplace/services/categories/manage:
 *   get:
 *     summary: List service categories for admin management (Admin only)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of categories for management
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Service category management (Admin)
router.get('/services/categories/manage', authorize('admin'), listServiceCategoriesAdmin);

/**
 * @swagger
 * /api/marketplace/services/categories:
 *   post:
 *     summary: Create service category (Admin only)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/services/categories', authorize('admin'), createServiceCategory);

/**
 * @swagger
 * /api/marketplace/services/categories/{id}:
 *   put:
 *     summary: Update service category (Admin only)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Delete service category (Admin only)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Category deleted
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/services/categories/:id', authorize('admin'), updateServiceCategory);
router.delete('/services/categories/:id', authorize('admin'), deleteServiceCategory);

/**
 * @swagger
 * /api/marketplace/my-services:
 *   get:
 *     summary: Get my services (Provider only)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending]
 *     responses:
 *       200:
 *         description: List of my services
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// My services route
router.get('/my-services', getMyServices);

/**
 * @swagger
 * /api/marketplace/my-bookings:
 *   get:
 *     summary: Get my bookings
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [client, provider]
 *           description: Filter by booking role
 *     responses:
 *       200:
 *         description: List of my bookings
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// My bookings route
router.get('/my-bookings', getMyBookings);

// Service routes
// Allow both JSON and multipart/form-data for service creation (with optional images)
// Create conditional middleware that only applies multer for multipart requests
const optionalImageUpload = (req, res, next) => {
  const contentType = req.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    // Apply multer middleware for multipart requests
    return uploaders.marketplace.array('images', 5)(req, res, next);
  }
  // Skip multer for JSON requests
  next();
};

/**
 * @swagger
 * /api/marketplace/services:
 *   post:
 *     summary: Create a new service (Provider/Admin only)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Service created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/services', authorize('provider', 'admin'), optionalImageUpload, createService);

/**
 * @swagger
 * /api/marketplace/services/{id}:
 *   put:
 *     summary: Update service (Provider/Admin only)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Service updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Delete service (Provider/Admin only)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Service deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/services/:id', authorize('provider', 'admin'), updateService);

/**
 * @swagger
 * /api/marketplace/services/{id}/deactivate:
 *   patch:
 *     summary: Deactivate service (Provider/Admin only)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Service deactivated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.patch('/services/:id/deactivate', authorize('provider', 'admin'), deactivateService);

/**
 * @swagger
 * /api/marketplace/services/{id}/activate:
 *   patch:
 *     summary: Activate service (Provider/Admin only)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Service activated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.patch('/services/:id/activate', authorize('provider', 'admin'), activateService);

router.delete('/services/:id', authorize('provider', 'admin'), deleteService);

/**
 * @swagger
 * /api/marketplace/services/{id}/images:
 *   post:
 *     summary: Upload service images (Provider/Admin only)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/services/:id/images', authorize('provider', 'admin'), uploaders.marketplace.array('images', 5), uploadServiceImages);

/**
 * @swagger
 * /api/marketplace/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - providerId
 *               - scheduledDate
 *             properties:
 *               serviceId:
 *                 type: string
 *                 format: ObjectId
 *               providerId:
 *                 type: string
 *                 format: ObjectId
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               address:
 *                 type: object
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get user's bookings
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *     responses:
 *       200:
 *         description: List of bookings
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Booking routes
router.post('/bookings', createBooking);
router.get('/bookings', getBookings);
/**
 * @swagger
 * /api/marketplace/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Booking details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/bookings/:id', validateObjectIdParam('id'), getBooking);
/**
 * @swagger
 * /api/marketplace/bookings/{id}/status:
 *   put:
 *     summary: Update booking status
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, completed, cancelled]
 *     responses:
 *       200:
 *         description: Booking status updated
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/bookings/:id/status', updateBookingStatus);

/**
 * @swagger
 * /api/marketplace/bookings/{id}/photos:
 *   post:
 *     summary: Upload booking photos
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/bookings/:id/photos', uploaders.marketplace.array('photos', 5), uploadBookingPhotos);

/**
 * @swagger
 * /api/marketplace/bookings/{id}/review:
 *   post:
 *     summary: Add review to booking
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 3
 *     responses:
 *       201:
 *         description: Review added successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/bookings/:id/review', uploaders.marketplace.array('photos', 3), addReview);

/**
 * @swagger
 * /api/marketplace/bookings/paypal/approve:
 *   post:
 *     summary: Approve PayPal booking
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderID
 *               - bookingId
 *             properties:
 *               orderID:
 *                 type: string
 *               bookingId:
 *                 type: string
 *                 format: ObjectId
 *     responses:
 *       200:
 *         description: Booking approved
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// PayPal routes
router.post('/bookings/paypal/approve', approvePayPalBooking);

/**
 * @swagger
 * /api/marketplace/bookings/paypal/order/{orderId}:
 *   get:
 *     summary: Get PayPal order details
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PayPal order details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/bookings/paypal/order/:orderId', getPayPalOrderDetails);

module.exports = router;
