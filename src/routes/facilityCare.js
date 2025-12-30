const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getFacilityCareServices,
  getFacilityCareService,
  createFacilityCareService,
  updateFacilityCareService,
  deleteFacilityCareService,
  uploadFacilityCareImages,
  deleteFacilityCareImage,
  bookFacilityCareService,
  updateBookingStatus,
  addFacilityCareReview,
  getMyFacilityCareServices,
  getMyFacilityCareBookings,
  getNearbyFacilityCareServices
} = require('../controllers/facilityCareController');

const router = express.Router();

/**
 * @swagger
 * /api/facility-care:
 *   get:
 *     summary: Get list of facility care services
 *     tags: [Facility Care]
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
 *     responses:
 *       200:
 *         description: List of services
 *   post:
 *     summary: Create facility care service
 *     tags: [Facility Care]
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
 *     responses:
 *       201:
 *         description: Service created
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Public routes
router.get('/', getFacilityCareServices);

/**
 * @swagger
 * /api/facility-care/nearby:
 *   get:
 *     summary: Get nearby facility care services
 *     tags: [Facility Care]
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
 *         description: Nearby services
 */
router.get('/nearby', getNearbyFacilityCareServices);

/**
 * @swagger
 * /api/facility-care/{id}:
 *   get:
 *     summary: Get facility care service by ID
 *     tags: [Facility Care]
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
 *   put:
 *     summary: Update facility care service
 *     tags: [Facility Care]
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
 *         description: Service updated
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Delete facility care service
 *     tags: [Facility Care]
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
 */
router.get('/:id', getFacilityCareService);

// Protected routes
router.use(auth);

// Service management routes
router.post('/', authorize('provider', 'admin'), createFacilityCareService);
router.put('/:id', authorize('provider', 'admin'), updateFacilityCareService);
router.delete('/:id', authorize('provider', 'admin'), deleteFacilityCareService);

// Image management routes
router.post('/:id/images', authorize('provider', 'admin'), uploadFacilityCareImages);
router.delete('/:id/images/:imageId', authorize('provider', 'admin'), deleteFacilityCareImage);

/**
 * @swagger
 * /api/facility-care/{id}/book:
 *   post:
 *     summary: Book facility care service
 *     tags: [Facility Care]
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
 *               - scheduledDate
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Booking created
 */
// Booking routes
router.post('/:id/book', bookFacilityCareService);

/**
 * @swagger
 * /api/facility-care/{id}/bookings/{bookingId}/status:
 *   put:
 *     summary: Update booking status
 *     tags: [Facility Care]
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
router.post('/:id/reviews', addFacilityCareReview);

// User-specific routes
router.get('/my-services', getMyFacilityCareServices);
router.get('/my-bookings', getMyFacilityCareBookings);

module.exports = router;