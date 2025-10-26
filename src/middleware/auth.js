const User = require('../models/User');
const { verifyAccessToken } = require('../config/jwt');
const logger = require('../config/logger');

const auth = async(req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied',
        code: 'NO_TOKEN'
      });
    }

    // Verify the access token using the centralized JWT config
    const decoded = verifyAccessToken(token);
    
    // Check if token is an access token
    if (decoded.type && decoded.type !== 'access') {
      logger.warn('Authentication failed: Invalid token type', {
        tokenType: decoded.type,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logger.warn('Authentication failed: User not found', {
        userId: decoded.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({
        success: false,
        message: 'Token is not valid',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      logger.warn('Authentication failed: User account not active', {
        userId: user._id,
        status: user.status,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({
        success: false,
        message: 'Account is not active',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Provide more specific error messages based on JWT error type
    let message = 'Token is not valid';
    let code = 'INVALID_TOKEN';
    
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired';
      code = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token';
      code = 'INVALID_TOKEN';
    } else if (error.name === 'NotBeforeError') {
      message = 'Token not active';
      code = 'TOKEN_NOT_ACTIVE';
    }
    
    res.status(401).json({
      success: false,
      message,
      code
    });
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

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = { auth, authorize };
