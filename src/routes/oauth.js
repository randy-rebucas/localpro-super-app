const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const { accessTokenAuth } = require('../middleware/accessTokenAuth');
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const {
  exchangeToken,
  refreshToken,
  revokeToken,
  getTokenInfo,
  listTokens
} = require('../controllers/accessTokenController');

// Validation middleware
const validateTokenExchange = [
  body('grant_type').equals('client_credentials').withMessage('grant_type must be client_credentials'),
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
 * @route   POST /api/oauth/token
 * @desc    Exchange API key/secret for access token (OAuth2 client_credentials flow)
 * @access  Public (requires API key/secret)
 */
router.post('/token', validateTokenExchange, exchangeToken);

/**
 * @route   POST /api/oauth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', validateTokenRefresh, refreshToken);

/**
 * @route   POST /api/oauth/revoke
 * @desc    Revoke access or refresh token
 * @access  Public
 */
router.post('/revoke', validateTokenRevoke, revokeToken);

/**
 * @route   GET /api/oauth/token-info
 * @desc    Get information about current access token
 * @access  Private (requires valid access token)
 */
router.get('/token-info', accessTokenAuth, getTokenInfo);

/**
 * @route   GET /api/oauth/tokens
 * @desc    List user's access tokens
 * @access  Private (requires authentication)
 */
router.get('/tokens', apiKeyAuth, validateQueryParams, listTokens);

module.exports = router;

