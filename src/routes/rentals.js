const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getRentalItem,
  getRental,
  createRental,
  updateRental,
  deleteRental,
  uploadRentalImages,
  deleteRentalImage,
  bookRental,
  updateBookingStatus,
  addRentalReview,
  getMyRentalItem,
  getMyRentalBookings,
  getNearbyRentalItem,
  getRentalCategories,
  getFeaturedRentalItem,
  getRentalStatistics,
  generateRentalDescription
} = require('../controllers/rentalsController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

/**
 * @swagger
 * /api/rentals:
 *   get:
 *     summary: Get list of rental items
 *     tags: [Rentals]
 *     security: []
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
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of rental items
 */
// Public routes
router.get('/', getRentalItem);
router.get('/items', getRentalItem); // Alias for /api/rentals/items

/**
 * @swagger
 * /api/rentals/items/{id}:
 *   get:
 *     summary: Get rental item by ID
 *     tags: [Rentals]
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
 *         description: Rental item details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/items/:id', getRental); // Alias for /api/rentals/items/:id

/**
 * @swagger
 * /api/rentals/categories:
 *   get:
 *     summary: Get rental categories
 *     tags: [Rentals]
 *     security: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', getRentalCategories);

/**
 * @swagger
 * /api/rentals/featured:
 *   get:
 *     summary: Get featured rental items
 *     tags: [Rentals]
 *     security: []
 *     responses:
 *       200:
 *         description: Featured rentals
 */
router.get('/featured', getFeaturedRentalItem);

/**
 * @swagger
 * /api/rentals/nearby:
 *   get:
 *     summary: Get nearby rental items
 *     tags: [Rentals]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Nearby rentals
 */
router.get('/nearby', getNearbyRentalItem);

/**
 * @swagger
 * /api/rentals/{id}:
 *   get:
 *     summary: Get rental item by ID
 *     tags: [Rentals]
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
 *         description: Rental item details
 */
router.get('/:id', getRental);

// Protected routes
router.use(auth);

// AI-powered routes
router.post('/generate-description', authorize('provider', 'admin'), generateRentalDescription);

/**
 * @swagger
 * /api/rentals:
 *   post:
 *     summary: Create a new rental item
 *     tags: [Rentals]
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
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rental item created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Rental management routes
router.post('/', authorize('provider', 'admin'), createRental);
router.post('/items', authorize('provider', 'admin'), createRental); // Alias for /api/rentals/items

/**
 * @swagger
 * /api/rentals/{id}:
 *   put:
 *     summary: Update rental item
 *     tags: [Rentals]
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
 *         description: Rental item updated
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Delete rental item
 *     tags: [Rentals]
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
 *         description: Rental item deleted
 */
router.put('/:id', authorize('provider', 'admin'), updateRental);
router.delete('/:id', authorize('provider', 'admin'), deleteRental);

// Image management routes
router.post('/:id/images', authorize('provider', 'admin'), uploaders.rentals.array('images', 5), uploadRentalImages);
router.delete('/:id/images/:imageId', authorize('provider', 'admin'), deleteRentalImage);

/**
 * @swagger
 * /api/rentals/{id}/book:
 *   post:
 *     summary: Book a rental item
 *     tags: [Rentals]
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
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Booking created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Booking routes
router.post('/:id/book', bookRental);

/**
 * @swagger
 * /api/rentals/{id}/bookings/{bookingId}/status:
 *   put:
 *     summary: Update rental booking status
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *       - in: path
 *         name: bookingId
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
 */
router.put('/:id/bookings/:bookingId/status', updateBookingStatus);

// Review routes
router.post('/:id/reviews', addRentalReview);

// User-specific routes
router.get('/my-rentals', getMyRentalItem);
router.get('/my-bookings', getMyRentalBookings);

// Statistics route (Admin only) - [ADMIN ONLY]
router.get('/statistics', authorize('admin'), getRentalStatistics);

module.exports = router;