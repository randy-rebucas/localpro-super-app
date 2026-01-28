const express = require('express');
const { body, param, query } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getActivityFeed,
  getUserActivities,
  getSpecificUserActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  addInteraction,
  removeInteraction,
  getActivityStats,
  getGlobalActivityStats,
  getActivityMetadata,
  getActivityTimeline,
  getLeaderboard,
  getTotalPoints
} = require('../controllers/activityController');

const router = express.Router();

// Validation middleware
const createActivityValidation = [
  body('type')
    .isIn([
      'user_login', 'user_logout', 'user_register', 'profile_update', 'avatar_upload',
      'password_change', 'email_verification', 'phone_verification',
      'service_created', 'service_updated', 'service_deleted', 'service_published',
      'service_viewed', 'service_favorited', 'service_shared',
      'booking_created', 'booking_accepted', 'booking_rejected', 'booking_completed',
      'booking_cancelled', 'booking_rescheduled',
      'review_created', 'review_updated', 'review_deleted',
      'job_created', 'job_updated', 'job_deleted', 'job_published', 'job_closed',
      'job_applied', 'job_application_withdrawn', 'job_application_approved',
      'job_application_rejected', 'job_application_shortlisted',
      'course_created', 'course_updated', 'course_deleted', 'course_published',
      'course_enrolled', 'course_completed', 'course_progress_updated',
      'course_review_created', 'certificate_earned',
      'payment_made', 'payment_received', 'payment_failed', 'payment_refunded',
      'withdrawal_requested', 'withdrawal_approved', 'withdrawal_rejected',
      'invoice_created', 'invoice_paid', 'invoice_overdue',
      'message_sent', 'message_received', 'conversation_started',
      'notification_sent', 'notification_read', 'email_sent',
      'agency_joined', 'agency_left', 'agency_created', 'agency_updated',
      'provider_added', 'provider_removed', 'provider_status_updated',
      'referral_sent', 'referral_accepted', 'referral_completed',
      'referral_reward_earned', 'referral_invitation_sent',
      'verification_requested', 'verification_approved', 'verification_rejected',
      'document_uploaded', 'document_verified', 'badge_earned',
      'supply_created', 'supply_ordered', 'supply_delivered', 'supply_reviewed',
      'rental_created', 'rental_booked', 'rental_returned', 'rental_reviewed',
      'ad_created', 'ad_updated', 'ad_published', 'ad_clicked', 'ad_promoted',
      'settings_updated', 'preferences_changed', 'subscription_created',
      'subscription_cancelled', 'subscription_renewed',
      'connection_made', 'connection_removed', 'follow_started', 'follow_stopped',
      'content_liked', 'content_shared', 'content_commented',
      'search_performed', 'filter_applied', 'export_requested', 'report_generated'
    ])
    .withMessage('Invalid activity type'),
  body('action')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Action must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('category')
    .optional()
    .isIn(['authentication', 'profile', 'marketplace', 'job_board', 'academy', 'financial', 'communication', 'agency', 'referral', 'verification', 'supplies', 'rentals', 'advertising', 'system', 'social', 'other'])
    .withMessage('Invalid activity category'),
  body('impact')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid impact level'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'connections', 'followers'])
    .withMessage('Invalid visibility level'),
  body('targetEntity.type')
    .optional()
    .isIn(['user', 'service', 'job', 'course', 'booking', 'application', 'review', 'payment', 'agency', 'referral', 'verification', 'supply', 'rental', 'ad', 'message', 'notification', 'document'])
    .withMessage('Invalid target entity type'),
  body('targetEntity.id')
    .optional()
    .isMongoId()
    .withMessage('Invalid target entity ID'),
  body('targetEntity.name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Target entity name must be 200 characters or less'),
  body('targetEntity.url')
    .optional()
    .isURL()
    .withMessage('Target entity URL must be valid'),
  body('relatedEntities')
    .optional()
    .isArray()
    .withMessage('Related entities must be an array'),
  body('relatedEntities.*.type')
    .optional()
    .isIn(['user', 'service', 'job', 'course', 'booking', 'application', 'review', 'payment', 'agency', 'referral', 'verification', 'supply', 'rental', 'ad', 'message', 'notification', 'document'])
    .withMessage('Invalid related entity type'),
  body('relatedEntities.*.id')
    .optional()
    .isMongoId()
    .withMessage('Invalid related entity ID'),
  body('relatedEntities.*.name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Related entity name must be 200 characters or less'),
  body('relatedEntities.*.role')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Related entity role must be 50 characters or less'),
  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Location coordinates must be an array of 2 numbers [longitude, latitude]'),
  body('location.coordinates.*')
    .optional()
    .isFloat()
    .withMessage('Coordinate must be a number'),
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location address must be 500 characters or less'),
  body('location.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location city must be 100 characters or less'),
  body('location.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location country must be 100 characters or less'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be 50 characters or less')
];

const updateActivityValidation = [
  body('action')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Action must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('category')
    .optional()
    .isIn(['authentication', 'profile', 'marketplace', 'job_board', 'academy', 'financial', 'communication', 'agency', 'referral', 'verification', 'supplies', 'rentals', 'advertising', 'system', 'social', 'other'])
    .withMessage('Invalid activity category'),
  body('impact')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid impact level'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'connections', 'followers'])
    .withMessage('Invalid visibility level'),
  body('isVisible')
    .optional()
    .isBoolean()
    .withMessage('isVisible must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be 50 characters or less')
];

const interactionValidation = [
  body('type')
    .isIn(['view', 'like', 'share', 'comment', 'bookmark'])
    .withMessage('Invalid interaction type'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
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
  query('types')
    .optional()
    .isString()
    .withMessage('Types must be a comma-separated string'),
  query('categories')
    .optional()
    .isString()
    .withMessage('Categories must be a comma-separated string'),
  query('timeframe')
    .optional()
    .isIn(['1h', '1d', '7d', '30d', '90d'])
    .withMessage('Invalid timeframe'),
  query('visibility')
    .optional()
    .isIn(['public', 'private', 'connections', 'followers'])
    .withMessage('Invalid visibility level'),
  query('includeOwn')
    .optional()
    .isBoolean()
    .withMessage('includeOwn must be a boolean')
];

const paramValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid activity ID'),
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
];

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/activities/feed:
 *   get:
 *     summary: Get activity feed for current user
 *     tags: [Activities]
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
 *         name: types
 *         schema:
 *           type: string
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [public, private, connections, followers]
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 1d, 7d, 30d, 90d]
 *     responses:
 *       200:
 *         description: Activity feed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/feed', authorize('client'), queryValidation, getActivityFeed);

/**
 * @swagger
 * /api/activities/my:
 *   get:
 *     summary: Get current user's activities
 *     tags: [Activities]
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
 *         description: User activities
 */
router.get('/my', authorize('client'), queryValidation, getUserActivities);

/**
 * @route   GET /api/activities/user/:userId
 * @desc    Get specific user's activities
 * @access  Private (Admin or connections)
 * @param   userId: User ID
 * @query   page, limit, types, categories, timeframe
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "activities": [...],
 *     "pagination": {...}
 *   }
 * }
 */
router.get('/user/:userId', authorize('admin'), paramValidation, queryValidation, getSpecificUserActivities);

/**
 * @route   GET /api/activities/:id
 * @desc    Get single activity by ID
 * @access  Private
 * @param   id: Activity ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "activity": {...}
 *   }
 * }
 */
router.get('/:id', authorize('client'), paramValidation, getActivity);

/**
 * @route   POST /api/activities
 * @desc    Create new activity
 * @access  Private
 * @body    type, action, description, category, impact, visibility, targetEntity, relatedEntities, location, tags, details
 * 
 * Required Fields:
 * - type: Activity type
 * - action: Action description (1-100 characters)
 * - description: Activity description (1-500 characters)
 * 
 * Optional Fields:
 * - category: Activity category
 * - impact: Impact level (low, medium, high, critical)
 * - visibility: Visibility level (public, private, connections, followers)
 * - targetEntity: Target entity information
 * - relatedEntities: Array of related entities
 * - location: Location information
 * - tags: Array of tags
 * - details: Additional details object
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Activity created successfully",
 *   "data": {...}
 * }
 */
router.post('/', authorize('client'), createActivityValidation, createActivity);

/**
 * @route   PUT /api/activities/:id
 * @desc    Update activity
 * @access  Private (Author/Admin)
 * @param   id: Activity ID
 * @body    Any activity fields to update
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Activity updated successfully",
 *   "data": {...}
 * }
 */
router.put('/:id', authorize('client', 'admin'), paramValidation, updateActivityValidation, updateActivity);

/**
 * @route   DELETE /api/activities/:id
 * @desc    Delete activity (soft delete)
 * @access  Private (Author/Admin)
 * @param   id: Activity ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Activity deleted successfully"
 * }
 */
router.delete('/:id', authorize('client', 'admin'), paramValidation, deleteActivity);

/**
 * @route   POST /api/activities/:id/interactions
 * @desc    Add interaction to activity
 * @access  Private
 * @param   id: Activity ID
 * @body    type, metadata
 * 
 * Required Fields:
 * - type: Interaction type (view, like, share, comment, bookmark)
 * 
 * Optional Fields:
 * - metadata: Additional interaction metadata
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Interaction added successfully",
 *   "data": {
 *     "interactionType": "like",
 *     "analytics": {...}
 *   }
 * }
 */
router.post('/:id/interactions', authorize('client'), paramValidation, interactionValidation, addInteraction);

/**
 * @route   DELETE /api/activities/:id/interactions
 * @desc    Remove interaction from activity
 * @access  Private
 * @param   id: Activity ID
 * @body    type
 * 
 * Required Fields:
 * - type: Interaction type to remove
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Interaction removed successfully",
 *   "data": {
 *     "interactionType": "like",
 *     "analytics": {...}
 *   }
 * }
 */
router.delete('/:id/interactions', authorize('client'), paramValidation, interactionValidation, removeInteraction);

/**
 * @route   GET /api/activities/stats/my
 * @desc    Get current user's activity statistics
 * @access  Private
 * @query   timeframe
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "timeframe": "30d",
 *     "stats": {
 *       "totalActivities": 150,
 *       "totalPoints": 750,
 *       "categoryBreakdown": {...},
 *       "typeBreakdown": {...}
 *     }
 *   }
 * }
 */
router.get('/stats/my', authorize('client'), queryValidation, getActivityStats);

/**
 * @route   GET /api/activities/stats/global
 * @desc    Get global activity statistics
 * @access  Private (Admin only)
 * @query   timeframe
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "timeframe": "30d",
 *     "stats": {
 *       "totalActivities": 15000,
 *       "totalPoints": 75000,
 *       "uniqueUserCount": 500,
 *       "categoryBreakdown": {...},
 *       "typeBreakdown": {...}
 *     }
 *   }
 * }
 */
router.get('/stats/global', authorize(['admin']), queryValidation, getGlobalActivityStats); // [ADMIN ONLY]

/**
 * @route   GET /api/activities/metadata
 * @desc    Get activity types, categories, and other metadata
 * @access  Private
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "types": [...],
 *     "categories": [...],
 *     "impactLevels": [...],
 *     "visibilityLevels": [...],
 *     "timeframes": [...]
 *   }
 * }
 */
router.get('/metadata', authorize('client'), getActivityMetadata);

/**
 * @route   GET /api/activities/timeline
 * @desc    Get user's activity timeline grouped by date
 * @access  Private
 * @query   timeframe, limit
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "timeline": [
 *       {
 *         "_id": "2024-01-15",
 *         "activities": [...],
 *         "totalPoints": 50,
 *         "count": 5
 *       }
 *     ]
 *   }
 * }
 */
router.get('/timeline', authorize('client'), queryValidation, getActivityTimeline);

/**
 * @route   GET /api/activities/points
 * @desc    Get user's total accumulated points
 * @access  Private
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "totalPoints": 1250,
 *     "rank": 42
 *   }
 * }
 */
router.get('/points', authorize('client'), getTotalPoints);

/**
 * @route   GET /api/activities/leaderboard
 * @desc    Get activity leaderboard based on points
 * @access  Private
 * @query   timeframe, limit
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "timeframe": "30d",
 *     "leaderboard": [
 *       {
 *         "rank": 1,
 *         "userId": "...",
 *         "user": { "firstName": "...", "lastName": "...", "avatar": "..." },
 *         "totalPoints": 5000,
 *         "activityCount": 150
 *       }
 *     ]
 *   }
 * }
 */
router.get('/leaderboard', authorize('client'), queryValidation, getLeaderboard);

module.exports = router;
