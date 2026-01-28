const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getAds,
  getAd,
  createAd,
  updateAd,
  deleteAd,
  uploadAdImages,
  deleteAdImage,
  getMyAds,
  getAdAnalytics,
  trackAdClick,
  getAdCategories,
  getFeaturedAds,
  promoteAd,
  getAdStatistics,
  getAdEnumValues,
  approveAd,
  rejectAd,
  getPendingAds
} = require('../controllers/adsController');

const router = express.Router();

/**
 * @swagger
 * /api/ads:
 *   get:
 *     summary: Get list of ads
 *     tags: [Ads]
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
 *         description: List of ads
 *   post:
 *     summary: Create a new ad
 *     tags: [Ads]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ad created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Public routes
router.get('/', getAds);

/**
 * @swagger
 * /api/ads/categories:
 *   get:
 *     summary: Get ad categories
 *     tags: [Ads]
 *     security: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', getAdCategories);

/**
 * @swagger
 * /api/ads/enum-values:
 *   get:
 *     summary: Get ad enum values
 *     tags: [Ads]
 *     security: []
 *     responses:
 *       200:
 *         description: Enum values
 */
router.get('/enum-values', getAdEnumValues);

/**
 * @swagger
 * /api/ads/featured:
 *   get:
 *     summary: Get featured ads
 *     tags: [Ads]
 *     security: []
 *     responses:
 *       200:
 *         description: Featured ads
 */
router.get('/featured', getFeaturedAds);

/**
 * @swagger
 * /api/ads/{id}:
 *   get:
 *     summary: Get ad by ID
 *     tags: [Ads]
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
 *         description: Ad details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update ad
 *     tags: [Ads]
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
 *         description: Ad updated
 *   delete:
 *     summary: Delete ad
 *     tags: [Ads]
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
 *         description: Ad deleted
 */
router.get('/:id', getAd);

/**
 * @swagger
 * /api/ads/{id}/click:
 *   post:
 *     summary: Track ad click
 *     tags: [Ads]
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
 *         description: Click tracked
 */
router.post('/:id/click', trackAdClick);

// Protected routes
router.use(auth);

/**
 * @swagger
 * /api/ads/statistics:
 *   get:
 *     summary: Get ad statistics (Admin only)
 *     tags: [Ads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ad statistics
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Statistics route (Admin only) - Must be before /:id routes to avoid route conflict
router.get('/statistics', authorize('admin'), getAdStatistics);

router.post('/', authorize('provider', 'admin'), createAd);
router.put('/:id', authorize('provider', 'admin'), updateAd);
router.delete('/:id', authorize('provider', 'admin'), deleteAd);

// Image management routes - All authenticated users can manage images for their own ads
router.post('/:id/images', authorize('provider', 'admin'), uploadAdImages);
router.delete('/:id/images/:imageId', authorize('provider', 'admin'), deleteAdImage);

// Ad promotion routes - All authenticated users can promote their own ads
router.post('/:id/promote', authorize('provider', 'admin'), promoteAd);

// Admin moderation routes
router.get('/pending', authorize('admin'), getPendingAds);
router.put('/:id/approve', authorize('admin'), approveAd);
router.put('/:id/reject', authorize('admin'), rejectAd);

// Analytics routes
router.get('/:id/analytics', authorize('admin'), getAdAnalytics);

/**
 * @swagger
 * /api/ads/my-ads:
 *   get:
 *     summary: Get my ads
 *     tags: [Ads]
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
 *         description: List of my ads
 */
// User-specific routes
router.get('/my-ads', authorize('provider'), getMyAds);

module.exports = router;