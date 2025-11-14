/**
 * Route Validation Middleware
 * Centralized validation for route parameters and inputs
 */

const { validateObjectId } = require('../utils/controllerValidation');
const { sendValidationError } = require('../utils/responseHelper');

/**
 * Validate ObjectId parameter
 * @param {string} paramName - Name of the parameter to validate
 * @returns {Function} - Express middleware
 */
const validateObjectIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return sendValidationError(res, [{
        field: paramName,
        message: `${paramName} is required`,
        code: `MISSING_${paramName.toUpperCase()}`
      }]);
    }
    
    if (!validateObjectId(id)) {
      return sendValidationError(res, [{
        field: paramName,
        message: `Invalid ${paramName} format. Must be a valid MongoDB ObjectId (24 hexadecimal characters)`,
        code: `INVALID_${paramName.toUpperCase()}_FORMAT`,
        received: id,
        expectedFormat: '24 hexadecimal characters (e.g., 507f1f77bcf86cd799439011)'
      }]);
    }
    
    next();
  };
};

/**
 * Validate multiple ObjectId parameters
 * @param {Array} paramNames - Array of parameter names to validate
 * @returns {Function} - Express middleware
 */
const validateMultipleObjectIds = (paramNames) => {
  return (req, res, next) => {
    const errors = [];
    
    paramNames.forEach(paramName => {
      const id = req.params[paramName];
      if (id && !validateObjectId(id)) {
        errors.push({
          field: paramName,
          message: `Invalid ${paramName} format`,
          code: `INVALID_${paramName.toUpperCase()}_FORMAT`
        });
      }
    });
    
    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }
    
    next();
  };
};

/**
 * Validate pagination parameters
 * @returns {Function} - Express middleware
 */
const validatePaginationParams = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
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
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  next();
};

/**
 * Validate search parameters
 * @returns {Function} - Express middleware
 */
const validateSearchParams = (req, res, next) => {
  const { search, category } = req.query;
  
  // Validate search term length
  if (search && search.length < 2) {
    return sendValidationError(res, [{
      field: 'search',
      message: 'Search term must be at least 2 characters',
      code: 'SEARCH_TERM_TOO_SHORT'
    }]);
  }
  
  // Validate category if provided
  if (category && typeof category !== 'string') {
    return sendValidationError(res, [{
      field: 'category',
      message: 'Category must be a string',
      code: 'INVALID_CATEGORY'
    }]);
  }
  
  next();
};

/**
 * Validate file upload parameters
 * @param {Object} options - Upload validation options
 * @param {number} options.maxSize - Maximum file size in bytes (default: 5MB)
 * @param {string[]} options.allowedTypes - Allowed MIME types (default: image types)
 * @param {boolean} options.required - Whether file is required (default: true)
 * @returns {Function} - Express middleware
 */
const validateFileUpload = (options = {}) => {
  return (req, res, next) => {
    const { 
      maxSize = 5 * 1024 * 1024, 
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
      required = true
    } = options;
    
    // If file is not required and no file is provided, skip validation
    if (!required && !req.file && !req.files) {
      return next();
    }
    
    // If file is required but not provided, return error
    if (required && !req.file && !req.files) {
      return sendValidationError(res, [{
        field: 'file',
        message: 'No file uploaded',
        code: 'NO_FILE_UPLOADED'
      }]);
    }
    
    const files = req.files || [req.file];
    
    for (const file of files) {
      if (file.size > maxSize) {
        return sendValidationError(res, [{
          field: 'file',
          message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
          code: 'FILE_TOO_LARGE'
        }]);
      }
      
      if (!allowedTypes.includes(file.mimetype)) {
        return sendValidationError(res, [{
          field: 'file',
          message: `File type must be one of: ${allowedTypes.join(', ')}`,
          code: 'INVALID_FILE_TYPE'
        }]);
      }
    }
    
    next();
  };
};

/**
 * Validate date range parameters
 * @returns {Function} - Express middleware
 */
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && isNaN(Date.parse(startDate))) {
    return sendValidationError(res, [{
      field: 'startDate',
      message: 'Invalid start date format',
      code: 'INVALID_START_DATE'
    }]);
  }
  
  if (endDate && isNaN(Date.parse(endDate))) {
    return sendValidationError(res, [{
      field: 'endDate',
      message: 'Invalid end date format',
      code: 'INVALID_END_DATE'
    }]);
  }
  
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return sendValidationError(res, [{
      field: 'dateRange',
      message: 'Start date cannot be after end date',
      code: 'INVALID_DATE_RANGE'
    }]);
  }
  
  next();
};

module.exports = {
  validateObjectIdParam,
  validateMultipleObjectIds,
  validatePaginationParams,
  validateSearchParams,
  validateFileUpload,
  validateDateRange
};
