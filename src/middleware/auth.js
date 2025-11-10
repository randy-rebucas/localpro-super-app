const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
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
