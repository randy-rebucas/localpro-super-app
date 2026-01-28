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
 * @swagger
 * /api/api-keys:
 *   post:
 *     summary: Create a new API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
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
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [read, write, admin]
 *     responses:
 *       201:
 *         description: API key created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get all API keys for the authenticated user
 *     tags: [API Keys]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of API keys
 */
router.post('/', authorize('admin'), validateCreateApiKey, createApiKey);
router.get('/', authorize('admin'), validateQueryParams, getApiKeys);

/**
 * @swagger
 * /api/api-keys/stats:
 *   get:
 *     summary: Get API key statistics
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API key statistics
 */
router.get('/stats', authorize('admin'), getApiKeyStats);

/**
 * @swagger
 * /api/api-keys/{id}:
 *   get:
 *     summary: Get a single API key by ID
 *     tags: [API Keys]
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
 *         description: API key details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update an API key
 *     tags: [API Keys]
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
 *         description: API key updated
 *   delete:
 *     summary: Delete/Revoke an API key
 *     tags: [API Keys]
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
 *         description: API key deleted
 */
router.get('/:id', authorize('admin'), validateApiKeyId, getApiKeyById);
router.put('/:id', authorize('admin'), validateUpdateApiKey, updateApiKey);
router.delete('/:id', authorize('admin'), validateApiKeyId, deleteApiKey);

/**
 * @swagger
 * /api/api-keys/{id}/regenerate-secret:
 *   post:
 *     summary: Regenerate secret key for an API key
 *     tags: [API Keys]
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
 *         description: Secret key regenerated
 */
router.post('/:id/regenerate-secret', authorize('admin'), validateApiKeyId, regenerateSecret);

module.exports = router;

