const express = require('express');
const { body, param, query } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getFeed,
  getTrending,
  getFeatured,
  getFeedItem,
  createFeedItem,
  updateFeedItem,
  deleteFeedItem,
  addInteraction,
  removeInteraction,
  getFeedAnalytics,
  getFeedByType,
  getMyFeedItems,
  promoteFeedItem
} = require('../controllers/feedController');

const router = express.Router();

// Validation middleware
const createFeedValidation = [
  body('contentType')
    .isIn([
      'activity', 'job', 'service', 'course', 'ad', 'promo',
      'agency', 'supply', 'rental', 'reward', 'referral',
      'announcement', 'achievement', 'milestone'
    ])
    .withMessage('Valid content type is required'),
  body('contentId')
    .isMongoId()
    .withMessage('Valid content ID is required'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('summary')
    .optional()
    .isLength({ max: 280 })
    .withMessage('Summary must not exceed 280 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'connections', 'followers', 'targeted'])
    .withMessage('Invalid visibility level'),
  body('priority')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Priority must be between 0 and 100'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean')
];

const updateFeedValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'connections', 'followers', 'targeted'])
    .withMessage('Invalid visibility level'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'scheduled', 'expired', 'archived'])
    .withMessage('Invalid status')
];

const interactionValidation = [
  body('type')
    .isIn(['like', 'share', 'comment', 'bookmark', 'click'])
    .withMessage('Valid interaction type is required')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('contentTypes')
    .optional()
    .custom((value) => {
      const types = value.split(',');
      const validTypes = [
        'activity', 'job', 'service', 'course', 'ad', 'promo',
        'agency', 'supply', 'rental', 'reward', 'referral',
        'announcement', 'achievement', 'milestone'
      ];
      return types.every(type => validTypes.includes(type.trim()));
    })
    .withMessage('Invalid content type(s)'),
  query('timeframe')
    .optional()
    .isIn(['1h', '1d', '7d', '30d', '90d', 'all'])
    .withMessage('Invalid timeframe'),
  query('sortBy')
    .optional()
    .isIn(['relevance', 'recent', 'trending', 'popular'])
    .withMessage('Invalid sort option')
];

const paramValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid feed item ID'),
  param('contentType')
    .optional()
    .isIn([
      'activity', 'job', 'service', 'course', 'ad', 'promo',
      'agency', 'supply', 'rental', 'reward', 'referral',
      'announcement', 'achievement', 'milestone'
    ])
    .withMessage('Invalid content type')
];

// Public routes
/**
 * @swagger
 * /api/feeds/trending:
 *   get:
 *     summary: Get trending feed items
 *     tags: [Feeds]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Trending feed items
 */
router.get('/trending', getTrending);

/**
 * @swagger
 * /api/feeds/featured:
 *   get:
 *     summary: Get featured feed items
 *     tags: [Feeds]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Featured feed items
 */
router.get('/featured', getFeatured);

// All other routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/feeds:
 *   get:
 *     summary: Get personalized feed for current user
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: contentTypes
 *         schema:
 *           type: string
 *         description: Comma-separated list of content types
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Comma-separated list of categories
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 1d, 7d, 30d, 90d, all]
 *           default: 7d
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, recent, trending, popular]
 *           default: relevance
 *       - in: query
 *         name: includeRealtime
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Personalized feed with pagination
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', queryValidation, getFeed);

/**
 * @swagger
 * /api/feeds/my:
 *   get:
 *     summary: Get current user's created feed items
 *     tags: [Feeds]
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
 *           enum: [draft, active, scheduled, expired, archived]
 *     responses:
 *       200:
 *         description: User's feed items
 */
router.get('/my', queryValidation, getMyFeedItems);

/**
 * @swagger
 * /api/feeds/analytics:
 *   get:
 *     summary: Get feed analytics for current user
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Feed analytics data
 */
router.get('/analytics', getFeedAnalytics);

/**
 * @swagger
 * /api/feeds/by-type/{contentType}:
 *   get:
 *     summary: Get feed items by content type
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feed items of specified type
 */
router.get('/by-type/:contentType', paramValidation, queryValidation, getFeedByType);

/**
 * @swagger
 * /api/feeds/{id}:
 *   get:
 *     summary: Get single feed item by ID
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feed item details
 *       404:
 *         description: Feed item not found
 */
router.get('/:id', paramValidation, getFeedItem);

/**
 * @swagger
 * /api/feeds:
 *   post:
 *     summary: Create a new feed item
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *               - contentId
 *               - title
 *             properties:
 *               contentType:
 *                 type: string
 *               contentId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               summary:
 *                 type: string
 *               category:
 *                 type: string
 *               visibility:
 *                 type: string
 *               priority:
 *                 type: integer
 *               isFeatured:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Feed item created successfully
 */
router.post('/', createFeedValidation, createFeedItem);

/**
 * @swagger
 * /api/feeds/{id}:
 *   put:
 *     summary: Update feed item
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Feed item updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Feed item not found
 */
router.put('/:id', paramValidation, updateFeedValidation, updateFeedItem);

/**
 * @swagger
 * /api/feeds/{id}:
 *   delete:
 *     summary: Delete feed item (soft delete)
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feed item deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Feed item not found
 */
router.delete('/:id', paramValidation, deleteFeedItem);

/**
 * @swagger
 * /api/feeds/{id}/interactions:
 *   post:
 *     summary: Add interaction to feed item
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [like, share, comment, bookmark, click]
 *     responses:
 *       200:
 *         description: Interaction added successfully
 */
router.post('/:id/interactions', paramValidation, interactionValidation, addInteraction);

/**
 * @swagger
 * /api/feeds/{id}/interactions:
 *   delete:
 *     summary: Remove interaction from feed item
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [like, share, comment, bookmark]
 *     responses:
 *       200:
 *         description: Interaction removed successfully
 */
router.delete('/:id/interactions', paramValidation, interactionValidation, removeInteraction);

/**
 * @swagger
 * /api/feeds/{id}/promote:
 *   post:
 *     summary: Promote feed item (Admin only)
 *     tags: [Feeds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               budget:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               targetAudience:
 *                 type: object
 *     responses:
 *       200:
 *         description: Feed item promoted successfully
 */
router.post('/:id/promote', authorize('admin'), paramValidation, promoteFeedItem);

module.exports = router;
