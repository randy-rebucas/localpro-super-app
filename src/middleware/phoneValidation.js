const User = require('../models/User');
const { checkPhoneNumberExists } = require('../utils/validation');

/**
 * Middleware to validate that a phone number is unique
 * Used when creating/updating records that reference phone numbers
 * @param {string} phoneField - Field name in request body containing phone number (default: 'phoneNumber')
 * @param {boolean} allowExistingUser - If true, allows phone number if it belongs to the authenticated user (for updates)
 */
const validatePhoneUniqueness = (phoneField = 'phoneNumber', allowExistingUser = false) => {
  return async (req, res, next) => {
    try {
      const phoneNumber = req.body[phoneField] || req.body?.personalInfo?.[phoneField] || req.body?.contact?.[phoneField];
      
      if (!phoneNumber) {
        // Phone number is optional in some contexts, skip validation if not provided
        return next();
      }

      // Check if phone number already exists in User collection
      const exists = await checkPhoneNumberExists(phoneNumber, User, allowExistingUser ? req.user?.id : null);
      
      if (exists) {
        // If allowExistingUser is true and it's the current user's phone, allow it
        if (allowExistingUser && req.user) {
          const user = await User.findById(req.user.id);
          if (user && user.phoneNumber === phoneNumber) {
            return next();
          }
        }
        
        return res.status(400).json({
          success: false,
          message: 'This phone number is already registered. Phone numbers must be unique across the system.',
          code: 'PHONE_NUMBER_ALREADY_EXISTS'
        });
      }

      next();
    } catch (error) {
      console.error('Phone uniqueness validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Middleware to validate that phone number in verification request matches the authenticated user's phone
 * Ensures users can only verify their own phone number
 */
const validatePhoneOwnership = () => {
  return async (req, res, next) => {
    try {
      const phoneNumber = req.body?.phoneNumber || req.body?.personalInfo?.phoneNumber;
      
      if (!phoneNumber) {
        return next();
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Normalize phone numbers for comparison (remove spaces, ensure same format)
      const normalizedRequestPhone = phoneNumber.trim().replace(/\s+/g, '');
      const normalizedUserPhone = user.phoneNumber.trim().replace(/\s+/g, '');

      if (normalizedRequestPhone !== normalizedUserPhone) {
        return res.status(403).json({
          success: false,
          message: 'Phone number in verification request must match your registered phone number',
          code: 'PHONE_NUMBER_MISMATCH'
        });
      }

      next();
    } catch (error) {
      console.error('Phone ownership validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

module.exports = {
  validatePhoneUniqueness,
  validatePhoneOwnership
};

