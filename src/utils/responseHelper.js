/**
 * Response Helper Utilities
 * Standardized response formats for all API endpoints
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @param {Object} meta - Additional metadata (pagination, etc.)
 * @returns {Object} - Response object
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta = {}) => {
  const response = {
    success: true,
    message,
    ...meta
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination metadata
 * @param {string} message - Success message
 * @returns {Object} - Response object
 */
const sendPaginated = (res, data, pagination, message = 'Success') => {
  return sendSuccess(res, data, message, 200, {
    pagination: {
      current: pagination.page,
      pages: pagination.pages,
      total: pagination.total,
      limit: pagination.limit,
      count: data.length
    }
  });
};

/**
 * Send created response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 * @returns {Object} - Response object
 */
const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send updated response
 * @param {Object} res - Express response object
 * @param {*} data - Updated resource data
 * @param {string} message - Success message
 * @returns {Object} - Response object
 */
const sendUpdated = (res, data, message = 'Resource updated successfully') => {
  return sendSuccess(res, data, message, 200);
};

/**
 * Send deleted response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @returns {Object} - Response object
 */
const sendDeleted = (res, message = 'Resource deleted successfully') => {
  return sendSuccess(res, null, message, 200);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors
 * @param {string} message - Error message
 * @returns {Object} - Response object
 */
const sendValidationError = (res, errors, message = 'Validation failed') => {
  return res.status(400).json({
    success: false,
    message,
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
 * Send conflict error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} - Response object
 */
const sendConflictError = (res, message = 'Resource conflict', code = 'CONFLICT') => {
  return res.status(409).json({
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
  console.error('Server error:', error);
  
  return res.status(500).json({
    success: false,
    message,
    code,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

/**
 * Send rate limit error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @returns {Object} - Response object
 */
const sendRateLimitError = (res, message = 'Too many requests', code = 'RATE_LIMIT_EXCEEDED') => {
  return res.status(429).json({
    success: false,
    message,
    code
  });
};

/**
 * Create pagination metadata (legacy - use paginationMiddleware for new implementations)
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} - Pagination metadata
 */
const createPagination = (page, limit, total) => {
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total: parseInt(total),
    pages: Math.ceil(total / limit)
  };
};

/**
 * Create comprehensive pagination metadata
 * @param {Object} paginationParams - Parsed pagination parameters
 * @param {number} total - Total number of items
 * @param {number} count - Number of items in current page
 * @param {Object} performance - Performance metrics
 * @returns {Object} - Comprehensive pagination metadata
 */
const createComprehensivePagination = (paginationParams, total, count, performance = {}) => {
  const { page, limit } = paginationParams;
  const totalPages = Math.ceil(total / limit);
  
  return {
    // Basic pagination info
    page: parseInt(page),
    limit: parseInt(limit),
    total: parseInt(total),
    totalPages: parseInt(totalPages),
    count: parseInt(count),
    
    // Navigation flags
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
    
    // Performance metrics
    queryTime: performance.queryTime || 0,
    indexUsed: performance.indexUsed || null,
    executionStats: performance.executionStats || null,
    
    // Additional metadata
    itemsPerPage: parseInt(limit),
    startItem: total > 0 ? (page - 1) * limit + 1 : 0,
    endItem: Math.min(page * limit, total),
    isEmpty: count === 0,
    isFirstPage: page === 1,
    isLastPage: page === totalPages
  };
};

/**
 * Create cursor-based pagination metadata
 * @param {Object} paginationParams - Parsed pagination parameters
 * @param {Array} results - Query results
 * @param {string} cursorField - Field used for cursor
 * @param {Object} performance - Performance metrics
 * @returns {Object} - Cursor pagination metadata
 */
const createCursorPagination = (paginationParams, results, cursorField, performance = {}) => {
  const { limit, cursor } = paginationParams;
  const hasMore = results.length > limit;
  
  // Remove extra item if we got one more than requested
  const actualResults = hasMore ? results.slice(0, limit) : results;
  
  // Get cursors
  const firstItem = actualResults[0];
  const lastItem = actualResults[actualResults.length - 1];
  
  return {
    // Basic info
    limit: parseInt(limit),
    count: actualResults.length,
    hasMore,
    
    // Cursor navigation
    cursor: cursor,
    nextCursor: hasMore && lastItem ? (lastItem[cursorField] instanceof Date ? lastItem[cursorField].toISOString() : lastItem[cursorField]) : null,
    prevCursor: firstItem ? (firstItem[cursorField] instanceof Date ? firstItem[cursorField].toISOString() : firstItem[cursorField]) : null,
    
    // Performance metrics
    queryTime: performance.queryTime || 0,
    indexUsed: performance.indexUsed || null,
    executionStats: performance.executionStats || null,
    
    // Additional metadata
    isEmpty: actualResults.length === 0,
    isFirstPage: !cursor,
    hasNext: hasMore,
    hasPrev: !!cursor
  };
};

/**
 * Format response data with consistent structure
 * @param {*} data - Raw data
 * @param {Object} options - Formatting options
 * @returns {*} - Formatted data
 */
const formatResponseData = (data, options = {}) => {
  if (!data) return null;
  
  // If data is an array, format each item
  if (Array.isArray(data)) {
    return data.map(item => formatResponseData(item, options));
  }
  
  // If data is an object, apply formatting
  if (typeof data === 'object' && data !== null) {
    const formatted = { ...data };
    
    // Remove sensitive fields if specified
    if (options.excludeFields) {
      options.excludeFields.forEach(field => {
        delete formatted[field];
      });
    }
    
    // Add computed fields if specified
    if (options.addFields) {
      Object.assign(formatted, options.addFields);
    }
    
    return formatted;
  }
  
  return data;
};

module.exports = {
  sendSuccess,
  sendPaginated,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendValidationError,
  sendAuthorizationError,
  sendNotFoundError,
  sendConflictError,
  sendServerError,
  sendRateLimitError,
  createPagination,
  createComprehensivePagination,
  createCursorPagination,
  formatResponseData
};
