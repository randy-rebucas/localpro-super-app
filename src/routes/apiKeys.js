const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const { auth } = require('../middleware/auth');
const {
  createApiKey,
  getApiKeys,
  getApiKeyById,
  updateApiKey,
  deleteApiKey,
  regenerateSecret,
  getApiKeyStats
} = require('../controllers/apiKeyController');

// Validation middleware
const validateCreateApiKey = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('expiresAt').optional().isISO8601().withMessage('ExpiresAt must be a valid ISO 8601 date'),
  body('rateLimit').optional().isInt({ min: 1 }).withMessage('Rate limit must be a positive integer'),
  body('allowedIPs').optional().isArray().withMessage('AllowedIPs must be an array'),
  body('allowedIPs.*').optional().isIP().withMessage('Each IP address must be valid'),
  body('scopes').optional().isArray().withMessage('Scopes must be an array'),
  body('scopes.*').optional().isIn(['read', 'write', 'admin']).withMessage('Invalid scope value'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
];

const validateUpdateApiKey = [
  param('id').isMongoId().withMessage('Invalid API key ID'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('expiresAt').optional().isISO8601().withMessage('ExpiresAt must be a valid ISO 8601 date'),
  body('rateLimit').optional().isInt({ min: 1 }).withMessage('Rate limit must be a positive integer'),
  body('allowedIPs').optional().isArray().withMessage('AllowedIPs must be an array'),
  body('allowedIPs.*').optional().isIP().withMessage('Each IP address must be valid'),
  body('scopes').optional().isArray().withMessage('Scopes must be an array'),
  body('scopes.*').optional().isIn(['read', 'write', 'admin']).withMessage('Invalid scope value'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
];

const validateApiKeyId = [
  param('id').isMongoId().withMessage('Invalid API key ID')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

// All routes require authentication
router.use(auth);

/**
 * @route   POST /api/api-keys
 * @desc    Create a new API key
 * @access  Private
 */
router.post('/', validateCreateApiKey, createApiKey);

/**
 * @route   GET /api/api-keys
 * @desc    Get all API keys for the authenticated user
 * @access  Private
 */
router.get('/', validateQueryParams, getApiKeys);

/**
 * @route   GET /api/api-keys/stats
 * @desc    Get API key statistics
 * @access  Private
 */
router.get('/stats', getApiKeyStats);

/**
 * @route   GET /api/api-keys/:id
 * @desc    Get a single API key by ID
 * @access  Private
 */
router.get('/:id', validateApiKeyId, getApiKeyById);

/**
 * @route   PUT /api/api-keys/:id
 * @desc    Update an API key
 * @access  Private
 */
router.put('/:id', validateUpdateApiKey, updateApiKey);

/**
 * @route   DELETE /api/api-keys/:id
 * @desc    Delete/Revoke an API key
 * @access  Private
 */
router.delete('/:id', validateApiKeyId, deleteApiKey);

/**
 * @route   POST /api/api-keys/:id/regenerate-secret
 * @desc    Regenerate secret key for an API key
 * @access  Private
 */
router.post('/:id/regenerate-secret', validateApiKeyId, regenerateSecret);

module.exports = router;

