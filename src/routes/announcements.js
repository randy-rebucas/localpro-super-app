const express = require('express');
const { body, param, query } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getAnnouncements,
  getMyAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  acknowledgeAnnouncement,
  addComment,
  getAnnouncementStats
} = require('../controllers/announcementController');

const router = express.Router();

// Validation middleware
const createAnnouncementValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Content must be between 10 and 5000 characters'),
  body('summary')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Summary must be between 10 and 500 characters'),
  body('type')
    .optional()
    .isIn(['system', 'maintenance', 'feature', 'security', 'promotion', 'policy', 'event', 'emergency', 'update', 'general'])
    .withMessage('Invalid announcement type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('targetAudience')
    .optional()
    .isIn(['all', 'providers', 'clients', 'agencies', 'premium', 'verified', 'specific_roles'])
    .withMessage('Invalid target audience'),
  body('targetRoles')
    .optional()
    .isArray()
    .withMessage('Target roles must be an array'),
  body('targetRoles.*')
    .optional()
    .isIn(['admin', 'provider', 'client', 'agency_admin', 'agency_owner', 'instructor', 'supplier', 'advertiser'])
    .withMessage('Invalid target role'),
  body('targetLocations')
    .optional()
    .isArray()
    .withMessage('Target locations must be an array'),
  body('targetCategories')
    .optional()
    .isArray()
    .withMessage('Target categories must be an array'),
  body('targetCategories.*')
    .optional()
    .isIn(['cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 'appliance_repair', 'locksmith', 'handyman', 'home_security', 'pool_maintenance', 'pest_control', 'carpet_cleaning', 'window_cleaning', 'gutter_cleaning', 'power_washing', 'snow_removal', 'other'])
    .withMessage('Invalid target category'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO 8601 date'),
  body('isSticky')
    .optional()
    .isBoolean()
    .withMessage('isSticky must be a boolean'),
  body('allowComments')
    .optional()
    .isBoolean()
    .withMessage('allowComments must be a boolean'),
  body('requireAcknowledgment')
    .optional()
    .isBoolean()
    .withMessage('requireAcknowledgment must be a boolean'),
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

const updateAnnouncementValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Content must be between 10 and 5000 characters'),
  body('summary')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Summary must be between 10 and 500 characters'),
  body('type')
    .optional()
    .isIn(['system', 'maintenance', 'feature', 'security', 'promotion', 'policy', 'event', 'emergency', 'update', 'general'])
    .withMessage('Invalid announcement type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('status')
    .optional()
    .isIn(['draft', 'scheduled', 'published', 'archived'])
    .withMessage('Invalid status'),
  body('targetAudience')
    .optional()
    .isIn(['all', 'providers', 'clients', 'agencies', 'premium', 'verified', 'specific_roles'])
    .withMessage('Invalid target audience'),
  body('targetRoles')
    .optional()
    .isArray()
    .withMessage('Target roles must be an array'),
  body('targetRoles.*')
    .optional()
    .isIn(['admin', 'provider', 'client', 'agency_admin', 'agency_owner', 'instructor', 'supplier', 'advertiser'])
    .withMessage('Invalid target role'),
  body('targetLocations')
    .optional()
    .isArray()
    .withMessage('Target locations must be an array'),
  body('targetCategories')
    .optional()
    .isArray()
    .withMessage('Target categories must be an array'),
  body('targetCategories.*')
    .optional()
    .isIn(['cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 'appliance_repair', 'locksmith', 'handyman', 'home_security', 'pool_maintenance', 'pest_control', 'carpet_cleaning', 'window_cleaning', 'gutter_cleaning', 'power_washing', 'snow_removal', 'other'])
    .withMessage('Invalid target category'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO 8601 date'),
  body('isSticky')
    .optional()
    .isBoolean()
    .withMessage('isSticky must be a boolean'),
  body('allowComments')
    .optional()
    .isBoolean()
    .withMessage('allowComments must be a boolean'),
  body('requireAcknowledgment')
    .optional()
    .isBoolean()
    .withMessage('requireAcknowledgment must be a boolean'),
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

const addCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters')
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
  query('sortBy')
    .optional()
    .isIn(['title', 'createdAt', 'publishedAt', 'priority', 'type', 'views'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('type')
    .optional()
    .isIn(['system', 'maintenance', 'feature', 'security', 'promotion', 'policy', 'event', 'emergency', 'update', 'general'])
    .withMessage('Invalid announcement type'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  query('status')
    .optional()
    .isIn(['draft', 'scheduled', 'published', 'archived'])
    .withMessage('Invalid status'),
  query('targetAudience')
    .optional()
    .isIn(['all', 'providers', 'clients', 'agencies', 'premium', 'verified', 'specific_roles'])
    .withMessage('Invalid target audience'),
  query('isSticky')
    .optional()
    .isBoolean()
    .withMessage('isSticky must be a boolean')
];

const paramValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid announcement ID')
];

// Public routes (no authentication required)
/**
 * @route   GET /api/announcements
 * @desc    Get all announcements with filtering and pagination
 * @access  Public
 * @query   type, priority, status, targetAudience, page, limit, sortBy, sortOrder, search, tags, isSticky, author
 * 
 * Query Parameters:
 * - type (optional): Filter by announcement type
 * - priority (optional): Filter by priority level
 * - status (optional): Filter by status (default: published)
 * - targetAudience (optional): Filter by target audience
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 20, max: 100)
 * - sortBy (optional): Sort field (default: publishedAt)
 * - sortOrder (optional): Sort order (default: desc)
 * - search (optional): Search in title, content, summary, and tags
 * - tags (optional): Filter by tags (comma-separated)
 * - isSticky (optional): Filter by sticky announcements
 * - author (optional): Filter by author ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "announcements": [...],
 *     "pagination": {
 *       "currentPage": 1,
 *       "totalPages": 5,
 *       "totalItems": 100,
 *       "itemsPerPage": 20,
 *       "hasNext": true,
 *       "hasPrev": false
 *     }
 *   }
 * }
 */
router.get('/', queryValidation, getAnnouncements);

/**
 * @route   GET /api/announcements/:id
 * @desc    Get single announcement by ID
 * @access  Public
 * @param   id: Announcement ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "announcement": {...},
 *     "isAcknowledged": false,
 *     "canComment": true,
 *     "canAcknowledge": true
 *   }
 * }
 */
router.get('/:id', paramValidation, getAnnouncement);

// Protected routes (authentication required)
router.use(auth);

/**
 * @route   GET /api/announcements/my/list
 * @desc    Get personalized announcements for current user
 * @access  Private
 * @query   page, limit, includeAcknowledged
 * 
 * Query Parameters:
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 20, max: 100)
 * - includeAcknowledged (optional): Include acknowledged announcements (default: false)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "announcements": [...],
 *     "pagination": {...}
 *   }
 * }
 */
router.get('/my/list', queryValidation, getMyAnnouncements);

/**
 * @route   POST /api/announcements
 * @desc    Create new announcement
 * @access  Private (Admin/Manager roles)
 * @body    title, content, summary, type, priority, targetAudience, targetRoles, targetLocations, targetCategories, scheduledAt, expiresAt, isSticky, allowComments, requireAcknowledgment, tags
 * 
 * Required Fields:
 * - title: Announcement title (5-200 characters)
 * - content: Announcement content (10-5000 characters)
 * - summary: Announcement summary (10-500 characters)
 * 
 * Optional Fields:
 * - type: Announcement type (default: general)
 * - priority: Priority level (default: medium)
 * - targetAudience: Target audience (default: all)
 * - targetRoles: Array of target roles
 * - targetLocations: Array of target locations
 * - targetCategories: Array of target categories
 * - scheduledAt: Scheduled publication date
 * - expiresAt: Expiration date
 * - isSticky: Make announcement sticky (default: false)
 * - allowComments: Allow comments (default: true)
 * - requireAcknowledgment: Require acknowledgment (default: false)
 * - tags: Array of tags
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Announcement created successfully",
 *   "data": {...}
 * }
 */
router.post('/', authorize(['admin', 'agency_admin', 'agency_owner']), createAnnouncementValidation, createAnnouncement);

/**
 * @route   PUT /api/announcements/:id
 * @desc    Update announcement
 * @access  Private (Author/Admin)
 * @param   id: Announcement ID
 * @body    Any announcement fields to update
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Announcement updated successfully",
 *   "data": {...}
 * }
 */
router.put('/:id', paramValidation, updateAnnouncementValidation, updateAnnouncement);

/**
 * @route   DELETE /api/announcements/:id
 * @desc    Delete announcement (soft delete)
 * @access  Private (Author/Admin)
 * @param   id: Announcement ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Announcement deleted successfully"
 * }
 */
router.delete('/:id', paramValidation, deleteAnnouncement);

/**
 * @route   POST /api/announcements/:id/acknowledge
 * @desc    Acknowledge announcement
 * @access  Private
 * @param   id: Announcement ID
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Announcement acknowledged successfully",
 *   "data": {
 *     "acknowledgmentCount": 15
 *   }
 * }
 */
router.post('/:id/acknowledge', paramValidation, acknowledgeAnnouncement);

/**
 * @route   POST /api/announcements/:id/comments
 * @desc    Add comment to announcement
 * @access  Private
 * @param   id: Announcement ID
 * @body    content: Comment content (1-1000 characters)
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Comment added successfully",
 *   "data": {
 *     "comment": {...},
 *     "totalComments": 5
 *   }
 * }
 */
router.post('/:id/comments', paramValidation, addCommentValidation, addComment);

/**
 * @route   GET /api/announcements/admin/statistics
 * @desc    Get announcement statistics
 * @access  Private (Admin only)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "overview": {
 *       "totalAnnouncements": 50,
 *       "publishedAnnouncements": 35,
 *       "draftAnnouncements": 10,
 *       "scheduledAnnouncements": 5,
 *       "totalViews": 1500,
 *       "totalAcknowledged": 800,
 *       "totalComments": 120
 *     },
 *     "typeBreakdown": [...],
 *     "priorityBreakdown": [...]
 *   }
 * }
 */
router.get('/admin/statistics', authorize(['admin']), getAnnouncementStats);

module.exports = router;
