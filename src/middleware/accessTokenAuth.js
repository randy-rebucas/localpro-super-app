const AccessToken = require('../models/AccessToken');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate requests using access tokens
 * Supports Bearer token authentication
 */
const accessTokenAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'MISSING_ACCESS_TOKEN',
        hint: 'Provide Authorization: Bearer <token> header'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Try to find token in database first (for revocable tokens)
    let accessToken = await AccessToken.findByToken(token);

    if (accessToken) {
      // Database-stored token (from API key exchange)
      if (!accessToken.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Access token has been revoked',
          code: 'TOKEN_REVOKED'
        });
      }

      if (accessToken.isExpired()) {
        return res.status(401).json({
          success: false,
          message: 'Access token has expired',
          code: 'TOKEN_EXPIRED',
          expiresAt: accessToken.expiresAt
        });
      }

      // Get associated user
      const user = await User.findById(accessToken.userId).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User associated with token not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'User account is inactive',
          code: 'USER_INACTIVE'
        });
      }

      // Update last used information (async)
      const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim();
      accessToken.updateLastUsed(clientIp).catch(err => {
        console.error('Failed to update access token last used:', err);
      });

      // Attach token and user to request
      req.accessToken = accessToken;
      req.user = user;
      req.authType = 'access_token';
      req.tokenScopes = accessToken.scopes || [];

      return next();
    }

    // Fallback: Try JWT verification (for direct JWT tokens)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is an access token
      if (decoded.type && decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type. Access token required.',
          code: 'INVALID_TOKEN_TYPE'
        });
      }

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'User account is inactive',
          code: 'USER_INACTIVE'
        });
      }

      // Extract scopes from JWT if present
      req.user = user;
      req.authType = 'jwt';
      req.tokenScopes = decoded.scopes || user.roles || [];

      return next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token has expired',
          code: 'TOKEN_EXPIRED',
          expiredAt: jwtError.expiredAt
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid access token',
          code: 'INVALID_TOKEN'
        });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('Access token authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to check if token has required scope(s)
 */
const requireScope = (...requiredScopes) => {
  return (req, res, next) => {
    if (!req.tokenScopes || req.tokenScopes.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Token does not have required scopes',
        code: 'MISSING_SCOPE',
        required: requiredScopes
      });
    }

    // Check for wildcard or admin scope
    if (req.tokenScopes.includes('*') || req.tokenScopes.includes('admin')) {
      return next();
    }

    // Check if token has any of the required scopes
    const hasRequiredScope = requiredScopes.some(scope => {
      // Support wildcard matching (e.g., 'marketplace.*' matches 'marketplace.read')
      if (scope.includes('*')) {
        const prefix = scope.replace('*', '');
        return req.tokenScopes.some(tokenScope => tokenScope.startsWith(prefix));
      }
      return req.tokenScopes.includes(scope);
    });

    if (!hasRequiredScope) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient token permissions',
        code: 'INSUFFICIENT_SCOPE',
        required: requiredScopes,
        granted: req.tokenScopes
      });
    }

    next();
  };
};

/**
 * Middleware to check if token has all required scopes
 */
const requireAllScopes = (...requiredScopes) => {
  return (req, res, next) => {
    if (!req.tokenScopes || req.tokenScopes.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Token does not have required scopes',
        code: 'MISSING_SCOPE',
        required: requiredScopes
      });
    }

    // Check for wildcard or admin scope
    if (req.tokenScopes.includes('*') || req.tokenScopes.includes('admin')) {
      return next();
    }

    // Check if token has all required scopes
    const hasAllScopes = requiredScopes.every(scope => {
      if (scope.includes('*')) {
        const prefix = scope.replace('*', '');
        return req.tokenScopes.some(tokenScope => tokenScope.startsWith(prefix));
      }
      return req.tokenScopes.includes(scope);
    });

    if (!hasAllScopes) {
      return res.status(403).json({
        success: false,
        message: 'Token missing required scopes',
        code: 'INSUFFICIENT_SCOPE',
        required: requiredScopes,
        granted: req.tokenScopes
      });
    }

    next();
  };
};

module.exports = {
  accessTokenAuth,
  requireScope,
  requireAllScopes
};

