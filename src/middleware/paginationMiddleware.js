const { logger } = require('../config/logger');

/**
 * Pagination Middleware
 * Provides standardized pagination across all list endpoints
 * Supports both offset-based and cursor-based pagination
 */

/**
 * Standard pagination metadata structure
 */
const PAGINATION_METADATA = {
  // Offset-based pagination
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
  count: 0,
  
  // Cursor-based pagination
  cursor: null,
  nextCursor: null,
  prevCursor: null,
  hasMore: false,
  
  // Performance metadata
  queryTime: 0,
  indexUsed: null,
  executionStats: null
};

/**
 * Parse pagination parameters from request query
 * @param {Object} req - Express request object
 * @param {Object} options - Configuration options
 * @returns {Object} Parsed pagination parameters
 */
const parsePaginationParams = (req, options = {}) => {
  const {
    defaultLimit = 20,
    maxLimit = 100,
    minLimit = 1,
    defaultPage = 1,
    minPage = 1,
    cursorField = 'createdAt',
    sortField = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const query = req.query;
  
  // Parse offset-based pagination
  const page = Math.max(minPage, parseInt(query.page) || defaultPage);
  const limit = Math.min(maxLimit, Math.max(minLimit, parseInt(query.limit) || defaultLimit));
  
  // Parse cursor-based pagination
  const cursor = query.cursor || null;
  const before = query.before || null;
  const after = query.after || null;
  
  // Parse sorting
  const sortBy = query.sortBy || sortField;
  const sortDirection = ['asc', 'desc'].includes(query.sortOrder) ? query.sortOrder : sortOrder;
  
  // Calculate skip for offset-based pagination
  const skip = (page - 1) * limit;
  
  return {
    // Offset-based
    page,
    limit,
    skip,
    
    // Cursor-based
    cursor,
    before,
    after,
    cursorField,
    
    // Sorting
    sortBy,
    sortOrder: sortDirection,
    
    // Validation
    isValid: page > 0 && limit > 0
  };
};

/**
 * Create MongoDB query for offset-based pagination
 * @param {Object} baseQuery - Base MongoDB query
 * @param {Object} paginationParams - Parsed pagination parameters
 * @returns {Object} MongoDB query with pagination
 */
const createOffsetQuery = (baseQuery, paginationParams) => {
  const { skip, limit, sortBy, sortOrder } = paginationParams;
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return {
    query: baseQuery,
    options: {
      skip,
      limit,
      sort
    }
  };
};

/**
 * Create MongoDB query for cursor-based pagination
 * @param {Object} baseQuery - Base MongoDB query
 * @param {Object} paginationParams - Parsed pagination parameters
 * @returns {Object} MongoDB query with cursor pagination
 */
const createCursorQuery = (baseQuery, paginationParams) => {
  const { cursor, before, after, cursorField, limit, sortBy, sortOrder } = paginationParams;
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  let query = { ...baseQuery };
  
  // Apply cursor conditions
  if (cursor) {
    if (sortOrder === 'desc') {
      query[cursorField] = { $lt: new Date(cursor) };
    } else {
      query[cursorField] = { $gt: new Date(cursor) };
    }
  } else if (before) {
    query[cursorField] = { $lt: new Date(before) };
  } else if (after) {
    query[cursorField] = { $gt: new Date(after) };
  }
  
  return {
    query,
    options: {
      limit: limit + 1, // Get one extra to determine if there are more results
      sort
    }
  };
};

/**
 * Create pagination metadata for offset-based pagination
 * @param {Object} paginationParams - Parsed pagination parameters
 * @param {number} total - Total number of items
 * @param {number} count - Number of items in current page
 * @param {Object} performance - Performance metrics
 * @returns {Object} Pagination metadata
 */
const createOffsetPaginationMetadata = (paginationParams, total, count, performance = {}) => {
  const { page, limit } = paginationParams;
  const totalPages = Math.ceil(total / limit);
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total: parseInt(total),
    totalPages: parseInt(totalPages),
    count: parseInt(count),
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
    ...performance
  };
};

/**
 * Create pagination metadata for cursor-based pagination
 * @param {Object} paginationParams - Parsed pagination parameters
 * @param {Array} results - Query results
 * @param {string} cursorField - Field used for cursor
 * @param {Object} performance - Performance metrics
 * @returns {Object} Pagination metadata
 */
const createCursorPaginationMetadata = (paginationParams, results, cursorField, performance = {}) => {
  const { limit } = paginationParams;
  const hasMore = results.length > limit;
  
  // Remove extra item if we got one more than requested
  const actualResults = hasMore ? results.slice(0, limit) : results;
  
  // Get cursors
  const firstItem = actualResults[0];
  const lastItem = actualResults[actualResults.length - 1];
  
  return {
    limit: parseInt(limit),
    count: actualResults.length,
    hasMore,
    cursor: paginationParams.cursor,
    nextCursor: hasMore && lastItem ? lastItem[cursorField] : null,
    prevCursor: firstItem ? firstItem[cursorField] : null,
    ...performance
  };
};

/**
 * Middleware to parse and validate pagination parameters
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
const paginationMiddleware = (options = {}) => {
  return (req, res, next) => {
    try {
      const paginationParams = parsePaginationParams(req, options);
      
      if (!paginationParams.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          code: 'INVALID_PAGINATION'
        });
      }
      
      // Attach pagination parameters to request
      req.pagination = paginationParams;
      
      // Add helper methods to request
      req.pagination.createOffsetQuery = (baseQuery) => createOffsetQuery(baseQuery, paginationParams);
      req.pagination.createCursorQuery = (baseQuery) => createCursorQuery(baseQuery, paginationParams);
      req.pagination.createOffsetMetadata = (total, count, performance) => 
        createOffsetPaginationMetadata(paginationParams, total, count, performance);
      req.pagination.createCursorMetadata = (results, cursorField, performance) => 
        createCursorPaginationMetadata(paginationParams, results, cursorField, performance);
      
      next();
    } catch (error) {
      logger.error('Pagination middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Pagination processing error',
        code: 'PAGINATION_ERROR'
      });
    }
  };
};

/**
 * Middleware for offset-based pagination only
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
const offsetPaginationMiddleware = (options = {}) => {
  return paginationMiddleware({ ...options, enableCursor: false });
};

/**
 * Middleware for cursor-based pagination only
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
const cursorPaginationMiddleware = (options = {}) => {
  return paginationMiddleware({ ...options, enableCursor: true });
};

/**
 * Helper function to execute paginated query
 * @param {Object} Model - Mongoose model
 * @param {Object} query - MongoDB query
 * @param {Object} options - Query options
 * @param {Object} paginationParams - Pagination parameters
 * @returns {Promise<Object>} Query results and metadata
 */
const executePaginatedQuery = async (Model, query, options, paginationParams) => {
  const startTime = Date.now();
  
  try {
    // Execute query
    const results = await Model.find(query, null, options).lean();
    const queryTime = Date.now() - startTime;
    
    // Get total count for offset-based pagination
    let total = 0;
    if (paginationParams.page) {
      const countQuery = { ...query };
      delete countQuery.sort;
      total = await Model.countDocuments(countQuery);
    }
    
    return {
      results,
      total,
      queryTime,
      count: results.length
    };
  } catch (error) {
    logger.error('Paginated query execution error:', error);
    throw error;
  }
};

/**
 * Helper function to send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data
 * @param {Object} paginationMetadata - Pagination metadata
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata
 * @returns {Object} Response object
 */
const sendPaginatedResponse = (res, data, paginationMetadata, message = 'Success', meta = {}) => {
  return res.json({
    success: true,
    message,
    data,
    pagination: paginationMetadata,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
};

module.exports = {
  paginationMiddleware,
  offsetPaginationMiddleware,
  cursorPaginationMiddleware,
  parsePaginationParams,
  createOffsetQuery,
  createCursorQuery,
  createOffsetPaginationMetadata,
  createCursorPaginationMetadata,
  executePaginatedQuery,
  sendPaginatedResponse,
  PAGINATION_METADATA
};
