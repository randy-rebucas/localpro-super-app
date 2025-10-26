/**
 * Query Optimizer Utilities
 * 
 * This module provides optimized query helpers for common database operations
 * with built-in performance optimizations, caching, and monitoring.
 */

const databaseOptimization = require('../services/databaseOptimizationService');
const logger = require('./logger');

class QueryOptimizer {
  /**
   * Optimized find query with common optimizations
   * @param {Object} Model - Mongoose model
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @returns {Promise} Query result
   */
  static async find(Model, filter = {}, options = {}) {
    const {
      projection = {},
      limit = 20,
      skip = 0,
      sort = { createdAt: -1 },
      populate = [],
      lean = true,
      cache = false,
      cacheKey = null,
      cacheTTL = 300
    } = options;

    const queryFunction = async () => {
      let query = Model.find(filter);
      
      // Apply optimizations
      query = databaseOptimization.optimizeQuery(query, {
        projection,
        limit,
        skip,
        sort,
        populate,
        lean
      });

      return await query;
    };

    // Use caching if enabled
    if (cache && cacheKey) {
      return await databaseOptimization.cachedQuery(cacheKey, queryFunction, cacheTTL);
    }

    // Monitor query performance
    return await databaseOptimization.monitorQuery(
      `${Model.modelName}.find`,
      queryFunction
    );
  }

  /**
   * Optimized findOne query
   * @param {Object} Model - Mongoose model
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @returns {Promise} Query result
   */
  static async findOne(Model, filter = {}, options = {}) {
    const {
      projection = {},
      populate = [],
      lean = true,
      cache = false,
      cacheKey = null,
      cacheTTL = 300
    } = options;

    const queryFunction = async () => {
      let query = Model.findOne(filter);
      
      // Apply optimizations
      query = databaseOptimization.optimizeQuery(query, {
        projection,
        populate,
        lean
      });

      return await query;
    };

    // Use caching if enabled
    if (cache && cacheKey) {
      return await databaseOptimization.cachedQuery(cacheKey, queryFunction, cacheTTL);
    }

    // Monitor query performance
    return await databaseOptimization.monitorQuery(
      `${Model.modelName}.findOne`,
      queryFunction
    );
  }

  /**
   * Optimized count query
   * @param {Object} Model - Mongoose model
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @returns {Promise} Count result
   */
  static async count(Model, filter = {}, options = {}) {
    const {
      cache = false,
      cacheKey = null,
      cacheTTL = 300
    } = options;

    const queryFunction = async () => {
      return await Model.countDocuments(filter);
    };

    // Use caching if enabled
    if (cache && cacheKey) {
      return await databaseOptimization.cachedQuery(cacheKey, queryFunction, cacheTTL);
    }

    // Monitor query performance
    return await databaseOptimization.monitorQuery(
      `${Model.modelName}.count`,
      queryFunction
    );
  }

  /**
   * Optimized aggregation query
   * @param {Object} Model - Mongoose model
   * @param {Array} pipeline - Aggregation pipeline
   * @param {Object} options - Query options
   * @returns {Promise} Aggregation result
   */
  static async aggregate(Model, pipeline = [], options = {}) {
    const {
      allowDiskUse = true,
      maxTimeMS = 30000,
      hint = null,
      cache = false,
      cacheKey = null,
      cacheTTL = 300
    } = options;

    const queryFunction = async () => {
      const { pipeline: optimizedPipeline, options: aggOptions } = 
        databaseOptimization.optimizeAggregation(pipeline, {
          allowDiskUse,
          maxTimeMS,
          hint
        });

      return await Model.aggregate(optimizedPipeline, aggOptions);
    };

    // Use caching if enabled
    if (cache && cacheKey) {
      return await databaseOptimization.cachedQuery(cacheKey, queryFunction, cacheTTL);
    }

    // Monitor query performance
    return await databaseOptimization.monitorQuery(
      `${Model.modelName}.aggregate`,
      queryFunction
    );
  }

  /**
   * Optimized paginated query
   * @param {Object} Model - Mongoose model
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @returns {Promise} Paginated result
   */
  static async findPaginated(Model, filter = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = { createdAt: -1 },
      projection = {},
      populate = [],
      lean = true
    } = options;

    const skip = (page - 1) * limit;

    const queryFunction = async () => {
      // Execute query and count in parallel
      const [data, total] = await Promise.all([
        QueryOptimizer.find(Model, filter, {
          projection,
          limit,
          skip,
          sort,
          populate,
          lean
        }),
        QueryOptimizer.count(Model, filter)
      ]);

      return {
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    };

    // Monitor query performance
    return await databaseOptimization.monitorQuery(
      `${Model.modelName}.findPaginated`,
      queryFunction
    );
  }

  /**
   * Optimized search query with text search
   * @param {Object} Model - Mongoose model
   * @param {String} searchTerm - Search term
   * @param {Object} additionalFilter - Additional filters
   * @param {Object} options - Query options
   * @returns {Promise} Search result
   */
  static async search(Model, searchTerm, additionalFilter = {}, options = {}) {
    const {
      textFields = ['title', 'description'],
      page = 1,
      limit = 20,
      sort = { score: { $meta: 'textScore' }, createdAt: -1 },
      projection = {},
      populate = [],
      lean = true
    } = options;

    const searchFilter = {
      $text: { $search: searchTerm },
      ...additionalFilter
    };

    // Add text score to projection for sorting
    const searchProjection = {
      ...projection,
      score: { $meta: 'textScore' }
    };

    return await QueryOptimizer.findPaginated(Model, searchFilter, {
      page,
      limit,
      sort,
      projection: searchProjection,
      populate,
      lean
    });
  }

  /**
   * Optimized bulk operations
   * @param {Object} Model - Mongoose model
   * @param {Array} operations - Bulk operations
   * @param {Object} options - Operation options
   * @returns {Promise} Bulk operation result
   */
  static async bulkWrite(Model, operations = [], options = {}) {
    const {
      ordered = false,
      bypassDocumentValidation = false
    } = options;

    const queryFunction = async () => {
      return await Model.bulkWrite(operations, {
        ordered,
        bypassDocumentValidation
      });
    };

    // Monitor query performance
    return await databaseOptimization.monitorQuery(
      `${Model.modelName}.bulkWrite`,
      queryFunction
    );
  }

  /**
   * Optimized distinct query
   * @param {Object} Model - Mongoose model
   * @param {String} field - Field to get distinct values for
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @returns {Promise} Distinct values
   */
  static async distinct(Model, field, filter = {}, options = {}) {
    const {
      cache = false,
      cacheKey = null,
      cacheTTL = 300
    } = options;

    const queryFunction = async () => {
      return await Model.distinct(field, filter);
    };

    // Use caching if enabled
    if (cache && cacheKey) {
      return await databaseOptimization.cachedQuery(cacheKey, queryFunction, cacheTTL);
    }

    // Monitor query performance
    return await databaseOptimization.monitorQuery(
      `${Model.modelName}.distinct`,
      queryFunction
    );
  }

  /**
   * Generate cache key for queries
   * @param {String} operation - Operation name
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @returns {String} Cache key
   */
  static generateCacheKey(operation, filter = {}, options = {}) {
    const key = `${operation}:${JSON.stringify(filter)}:${JSON.stringify(options)}`;
    return Buffer.from(key).toString('base64');
  }

  /**
   * Clear cache for specific model
   * @param {String} modelName - Model name
   */
  static clearModelCache(modelName) {
    databaseOptimization.clearCache(`^${modelName}:`);
  }

  /**
   * Get query performance statistics
   * @returns {Object} Query statistics
   */
  static getQueryStats() {
    return databaseOptimization.getQueryStats();
  }

  /**
   * Clear all query statistics
   */
  static clearQueryStats() {
    databaseOptimization.clearQueryStats();
  }
}

module.exports = QueryOptimizer;
