const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { apiKeyAuth } = require('./apiKeyAuth');

/**
 * Universal authentication middleware that supports both JWT and API key authentication
 * Tries API key authentication first, then falls back to JWT
 */
const auth = async (req, res, next) => {
  try {
    // Check if API key authentication is being used
    const accessKey = req.headers['x-api-key'] || req.headers['api-key'] || req.query.apiKey;
    const secretKey = req.headers['x-api-secret'] || req.headers['api-secret'] || req.query.apiSecret;

    if (accessKey && secretKey) {
      // Use API key authentication
      return apiKeyAuth(req, res, next);
    }

    // Fall back to JWT authentication
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token or API key, authorization denied',
        code: 'MISSING_AUTH'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is an access token (not a refresh token)
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

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }

    req.user = user;
    req.authType = 'jwt';
    next();
  } catch (error) {
    // Provide specific error messages for different JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please refresh your token.',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid',
        code: 'INVALID_TOKEN'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token verification failed',
        code: 'TOKEN_VERIFICATION_FAILED'
      });
    }
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // If no roles specified, allow access
    if (roles.length === 0) {
      return next();
    }

    // Check if user has any of the required roles (multi-role support)
    const userRoles = req.user.roles || [];
    const userHasRole = roles.some(role => userRoles.includes(role));
    
    if (!userHasRole) {
      return res.status(403).json({
        success: false,
        message: `User roles [${userRoles.join(', ')}] are not authorized to access this route. Required: [${roles.join(', ')}]`
      });
    }

    next();
  };
};

module.exports = { auth, authorize };
