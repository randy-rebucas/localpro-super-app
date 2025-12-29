const ApiKey = require('../models/ApiKey');
const User = require('../models/User');

/**
 * Middleware to authenticate requests using API key and secret
 * Supports both header-based and query parameter-based authentication
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    // Get API key and secret from headers or query parameters
    const accessKey = req.headers['x-api-key'] || req.headers['api-key'] || req.query.apiKey;
    const secretKey = req.headers['x-api-secret'] || req.headers['api-secret'] || req.query.apiSecret;

    if (!accessKey || !secretKey) {
      return res.status(401).json({
        success: false,
        message: 'API key and secret are required',
        code: 'MISSING_API_CREDENTIALS',
        hint: 'Provide X-API-Key and X-API-Secret headers, or apiKey and apiSecret query parameters'
      });
    }

    // Find API key (including secret hash)
    const apiKey = await ApiKey.findOne({ accessKey }).select('+secretKeyHash');

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Check if API key is active
    if (!apiKey.isActive) {
      return res.status(403).json({
        success: false,
        message: 'API key is inactive',
        code: 'API_KEY_INACTIVE'
      });
    }

    // Check if API key is expired
    if (apiKey.isExpired()) {
      return res.status(403).json({
        success: false,
        message: 'API key has expired',
        code: 'API_KEY_EXPIRED',
        expiresAt: apiKey.expiresAt
      });
    }

    // Verify secret key
    if (!apiKey.verifySecret(secretKey)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API secret',
        code: 'INVALID_API_SECRET'
      });
    }

    // Check IP restrictions
    const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim();
    if (!apiKey.isIpAllowed(clientIp)) {
      return res.status(403).json({
        success: false,
        message: 'IP address not allowed',
        code: 'IP_NOT_ALLOWED',
        clientIp
      });
    }

    // Get associated user
    const user = await User.findById(apiKey.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with API key not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Update last used information (async, don't wait)
    apiKey.updateLastUsed(clientIp).catch(err => {
      console.error('Failed to update API key last used:', err);
    });

    // Attach API key and user to request
    req.apiKey = apiKey;
    req.user = user;
    req.authType = 'api_key';

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to check API key scopes/permissions
 */
const checkApiKeyScope = (...requiredScopes) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key authentication required',
        code: 'API_KEY_REQUIRED'
      });
    }

    const apiKeyScopes = req.apiKey.scopes || [];
    const hasRequiredScope = requiredScopes.some(scope => apiKeyScopes.includes(scope));

    if (!hasRequiredScope) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient API key permissions',
        code: 'INSUFFICIENT_SCOPE',
        required: requiredScopes,
        granted: apiKeyScopes
      });
    }

    next();
  };
};

module.exports = { apiKeyAuth, checkApiKeyScope };

