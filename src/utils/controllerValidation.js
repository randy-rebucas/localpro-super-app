/**
 * Controller Validation Utilities
 * Standardized validation functions for controllers
 */

const logger = require('./logger');

/**
 * Validate pagination parameters
 * @param {Object} query - Query parameters
 * @returns {Object} - Validation result
 */
const validatePagination = (query) => {
  const { page = 1, limit = 10 } = query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const errors = [];

  if (isNaN(pageNum) || pageNum < 1) {
    errors.push({
      field: 'page',
      message: 'Page number must be a positive integer',
      code: 'INVALID_PAGE_NUMBER'
    });
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    errors.push({
      field: 'limit',
      message: 'Limit must be between 1 and 100',
      code: 'INVALID_LIMIT'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: { page: pageNum, limit: limitNum }
  };
};

/**
 * Validate ObjectId format
 * @param {string} id - ObjectId to validate
 * @returns {boolean} - Whether the ID is valid
 */
const validateObjectId = (id) => {
  return id && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate required fields
 * @param {Object} data - Data to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - Validation result
 */
const validateRequiredFields = (data, requiredFields) => {
  const errors = [];

  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push({
        field,
        message: `${field} is required`,
        code: 'MISSING_REQUIRED_FIELD'
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate numeric range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Name of the field for error messages
 * @returns {Object} - Validation result
 */
const validateNumericRange = (value, min, max, fieldName) => {
  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be a valid number`,
        code: 'INVALID_NUMERIC_VALUE'
      }
    };
  }

  if (numValue < min || numValue > max) {
    return {
      isValid: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be between ${min} and ${max}`,
        code: 'INVALID_RANGE'
      }
    };
  }

  return { isValid: true };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 * @returns {Object} - Response object
 */
const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    errors
  });
};

/**
 * Send authorization error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} - Response object
 */
const sendAuthorizationError = (res, message = 'Not authorized', code = 'UNAUTHORIZED') => {
  return res.status(403).json({
    success: false,
    message,
    code
  });
};

/**
 * Send not found error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} - Response object
 */
const sendNotFoundError = (res, message = 'Resource not found', code = 'NOT_FOUND') => {
  return res.status(404).json({
    success: false,
    message,
    code
  });
};

/**
 * Send server error response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} - Response object
 */
const sendServerError = (res, error, message = 'Internal server error', code = 'SERVER_ERROR') => {
  logger.error('Server error:', error);

  return res.status(500).json({
    success: false,
    message,
    code,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

module.exports = {
  validatePagination,
  validateObjectId,
  validateRequiredFields,
  validateNumericRange,
  validateEmail,
  validatePhoneNumber,
  sendValidationError,
  sendAuthorizationError,
  sendNotFoundError,
  sendServerError
};
