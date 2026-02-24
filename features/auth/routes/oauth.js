const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const { accessTokenAuth } = require('../../../src/middleware/accessTokenAuth');
const { apiKeyAuth } = require('../../../src/middleware/apiKeyAuth');
const { auth } = require('../../../src/middleware/auth');
const { authLimiter } = require('../../../src/middleware/rateLimiter');
const {
  exchangeToken,
  refreshToken,
  revokeToken,
  getTokenInfo,
  listTokens,
  authorize
} = require('../controllers/accessTokenController');

// Validation middleware
const validateTokenExchange = [
  body('grant_type').isIn(['client_credentials', 'authorization_code']).withMessage('grant_type must be client_credentials or authorization_code'),
  body('scope').optional().isString().withMessage('scope must be a string'),
  body('expires_in').optional().isInt({ min: 300, max: 86400 }).withMessage('expires_in must be between 300 and 86400 seconds')
];

const validateTokenRefresh = [
  body('refresh_token').notEmpty().withMessage('refresh_token is required'),
  body('scope').optional().isString().withMessage('scope must be a string'),
  body('expires_in').optional().isInt({ min: 300, max: 86400 }).withMessage('expires_in must be between 300 and 86400 seconds')
];

const validateTokenRevoke = [
  body('token').notEmpty().withMessage('token is required'),
  body('token_type_hint').optional().isIn(['access_token', 'refresh_token']).withMessage('token_type_hint must be access_token or refresh_token')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

/**
 * @swagger
 * /api/oauth/token:
 *   post:
 *     summary: Exchange API key/secret for access token (OAuth2 client_credentials flow)
 *     tags: [OAuth]
 *     security:
 *       - apiKeyAuth: []
 *       - apiSecretAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grant_type
 *             properties:
 *               grant_type:
 *                 type: string
 *                 enum: [client_credentials]
 *               scope:
 *                 type: string
 *               expires_in:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Access token issued
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/token', validateTokenExchange, exchangeToken);

/**
 * @swagger
 * /api/oauth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [OAuth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *               scope:
 *                 type: string
 *               expires_in:
 *                 type: integer
 *     responses:
 *       200:
 *         description: New access token issued
 */
router.post('/refresh', validateTokenRefresh, refreshToken);

/**
 * @swagger
 * /api/oauth/revoke:
 *   post:
 *     summary: Revoke access or refresh token
 *     tags: [OAuth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *               token_type_hint:
 *                 type: string
 *                 enum: [access_token, refresh_token]
 *     responses:
 *       200:
 *         description: Token revoked
 */
router.post('/revoke', validateTokenRevoke, revokeToken);

/**
 * @swagger
 * /api/oauth/token-info:
 *   get:
 *     summary: Get information about current access token
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token information
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/token-info', accessTokenAuth, getTokenInfo);

/**
 * @swagger
 * /api/oauth/tokens:
 *   get:
 *     summary: List user's access tokens
 *     tags: [OAuth]
 *     security:
 *       - apiKeyAuth: []
 *       - apiSecretAuth: []
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
 *         description: List of tokens
 */
router.get('/tokens', apiKeyAuth, validateQueryParams, listTokens);

/**
 * @swagger
 * /api/oauth/authorize:
 *   post:
 *     summary: Create an authorization code (PKCE flow, S256 only)
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_id
 *               - redirect_uri
 *               - code_challenge
 *               - code_challenge_method
 *             properties:
 *               client_id:
 *                 type: string
 *               redirect_uri:
 *                 type: string
 *               scope:
 *                 type: string
 *               state:
 *                 type: string
 *               code_challenge:
 *                 type: string
 *               code_challenge_method:
 *                 type: string
 *                 enum: [S256]
 *     responses:
 *       200:
 *         description: Authorization code issued
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/authorize',
  auth,
  authLimiter,
  [
    body('client_id').notEmpty().withMessage('client_id is required'),
    body('redirect_uri').isURL().withMessage('redirect_uri must be a valid URL'),
    body('code_challenge').notEmpty().withMessage('code_challenge is required'),
    body('code_challenge_method').equals('S256').withMessage('Only S256 code_challenge_method is supported')
  ],
  authorize
);

module.exports = router;

