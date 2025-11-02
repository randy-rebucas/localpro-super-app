/**
 * Input Validation Utilities
 * Reusable validation functions for common input types
 */

const mongoose = require('mongoose');

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @param {string} fieldName - Field name for error message (optional)
 * @returns {Object} - { valid: boolean, error?: string }
 */
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    return {
      valid: false,
      error: `${fieldName} is required`
    };
  }

  const trimmedId = String(id).trim();

  if (trimmedId.length !== 24) {
    return {
      valid: false,
      error: `${fieldName} must be exactly 24 characters (MongoDB ObjectId format)`,
      receivedLength: trimmedId.length,
      expectedLength: 24
    };
  }

  if (!mongoose.isValidObjectId(trimmedId)) {
    return {
      valid: false,
      error: `${fieldName} must be a valid MongoDB ObjectId`,
      receivedId: trimmedId
    };
  }

  return {
    valid: true,
    value: trimmedId
  };
};

/**
 * Validate phone number format (E.164)
 * @param {string} phoneNumber - Phone number to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    return {
      valid: false,
      error: 'Phone number is required'
    };
  }

  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  
  if (!phoneRegex.test(phoneNumber)) {
    return {
      valid: false,
      error: 'Invalid phone number format. Please use international format (e.g., +1234567890)'
    };
  }

  return {
    valid: true,
    value: phoneNumber
  };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
const validateEmail = (email) => {
  if (!email) {
    return {
      valid: false,
      error: 'Email is required'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format'
    };
  }

  return {
    valid: true,
    value: email.toLowerCase().trim()
  };
};

/**
 * Validate pagination parameters
 * @param {number|string} page - Page number
 * @param {number|string} limit - Items per page
 * @param {number} maxLimit - Maximum items per page (default: 100)
 * @returns {Object} - { valid: boolean, page?: number, limit?: number, error?: string }
 */
const validatePagination = (page, limit, maxLimit = 100) => {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    return {
      valid: false,
      error: 'Page must be a positive integer greater than 0'
    };
  }

  if (isNaN(limitNum) || limitNum < 1) {
    return {
      valid: false,
      error: 'Limit must be a positive integer greater than 0'
    };
  }

  if (limitNum > maxLimit) {
    return {
      valid: false,
      error: `Limit cannot exceed ${maxLimit}`
    };
  }

  return {
    valid: true,
    page: pageNum,
    limit: limitNum
  };
};

/**
 * Validate verification code format (6 digits)
 * @param {string} code - Verification code
 * @returns {Object} - { valid: boolean, error?: string }
 */
const validateVerificationCode = (code) => {
  if (!code) {
    return {
      valid: false,
      error: 'Verification code is required'
    };
  }

  if (code.length !== 6) {
    return {
      valid: false,
      error: 'Verification code must be exactly 6 digits'
    };
  }

  if (!/^\d{6}$/.test(code)) {
    return {
      valid: false,
      error: 'Verification code must contain only digits'
    };
  }

  return {
    valid: true,
    value: code
  };
};

/**
 * Validate date range
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {Object} - { valid: boolean, error?: string }
 */
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return {
      valid: false,
      error: 'Invalid start date format'
    };
  }

  if (isNaN(end.getTime())) {
    return {
      valid: false,
      error: 'Invalid end date format'
    };
  }

  if (start > end) {
    return {
      valid: false,
      error: 'Start date must be before or equal to end date'
    };
  }

  return {
    valid: true,
    startDate: start,
    endDate: end
  };
};

/**
 * Validate price range
 * @param {number|string} minPrice - Minimum price
 * @param {number|string} maxPrice - Maximum price
 * @returns {Object} - { valid: boolean, error?: string }
 */
const validatePriceRange = (minPrice, maxPrice) => {
  if (minPrice !== undefined && minPrice !== null) {
    const min = parseFloat(minPrice);
    if (isNaN(min) || min < 0) {
      return {
        valid: false,
        error: 'Minimum price must be a non-negative number'
      };
    }
  }

  if (maxPrice !== undefined && maxPrice !== null) {
    const max = parseFloat(maxPrice);
    if (isNaN(max) || max < 0) {
      return {
        valid: false,
        error: 'Maximum price must be a non-negative number'
      };
    }
  }

  if (minPrice !== undefined && maxPrice !== undefined) {
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    
    if (min > max) {
      return {
        valid: false,
        error: 'Minimum price must be less than or equal to maximum price'
      };
    }
  }

  return {
    valid: true,
    minPrice: minPrice !== undefined ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : undefined
  };
};

/**
 * Sanitize string input (trim, remove excessive whitespace)
 * @param {string} input - Input string
 * @param {number} maxLength - Maximum length (optional)
 * @returns {Object} - { valid: boolean, value?: string, error?: string }
 */
const sanitizeString = (input, maxLength = null) => {
  if (input === null || input === undefined) {
    return {
      valid: false,
      error: 'Input is required'
    };
  }

  const trimmed = String(input).trim().replace(/\s+/g, ' ');

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Input cannot be empty'
    };
  }

  if (maxLength && trimmed.length > maxLength) {
    return {
      valid: false,
      error: `Input cannot exceed ${maxLength} characters`,
      receivedLength: trimmed.length,
      maxLength
    };
  }

  return {
    valid: true,
    value: trimmed
  };
};

/**
 * Validate enum value
 * @param {string} value - Value to validate
 * @param {string[]} allowedValues - Array of allowed values
 * @param {string} fieldName - Field name for error message
 * @returns {Object} - { valid: boolean, error?: string }
 */
const validateEnum = (value, allowedValues, fieldName = 'Value') => {
  if (!value) {
    return {
      valid: false,
      error: `${fieldName} is required`
    };
  }

  if (!Array.isArray(allowedValues)) {
    return {
      valid: false,
      error: 'Invalid validation configuration'
    };
  }

  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      receivedValue: value,
      allowedValues
    };
  }

  return {
    valid: true,
    value
  };
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
const validateURL = (url) => {
  if (!url) {
    return {
      valid: false,
      error: 'URL is required'
    };
  }

  try {
    new URL(url);
    return {
      valid: true,
      value: url
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format'
    };
  }
};

/**
 * Validate coordinates (latitude, longitude)
 * @param {number|string} lat - Latitude
 * @param {number|string} lng - Longitude
 * @returns {Object} - { valid: boolean, error?: string }
 */
const validateCoordinates = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return {
      valid: false,
      error: 'Both latitude and longitude are required and must be numbers'
    };
  }

  if (latitude < -90 || latitude > 90) {
    return {
      valid: false,
      error: 'Latitude must be between -90 and 90'
    };
  }

  if (longitude < -180 || longitude > 180) {
    return {
      valid: false,
      error: 'Longitude must be between -180 and 180'
    };
  }

  return {
    valid: true,
    latitude,
    longitude
  };
};

module.exports = {
  validateObjectId,
  validatePhoneNumber,
  validateEmail,
  validatePagination,
  validateVerificationCode,
  validateDateRange,
  validatePriceRange,
  sanitizeString,
  validateEnum,
  validateURL,
  validateCoordinates
};

