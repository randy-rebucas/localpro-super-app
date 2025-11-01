const { logger } = require('../config/logger');
const { createComprehensivePagination, createCursorPagination } = require('../utils/responseHelper');

/**
 * Advanced Pagination Service
 * Provides cursor-based pagination and performance optimization for large datasets
 */

class PaginationService {
  constructor() {
    this.performanceCache = new Map();
    this.indexHints = new Map();
  }

  /**
   * Execute offset-based pagination with performance tracking
   * @param {Object} Model - Mongoose model
   * @param {Object} query - MongoDB query
   * @param {Object} paginationParams - Pagination parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Paginated results with metadata
   */
  async executeOffsetPagination(Model, query, paginationParams, options = {}) {
    const startTime = Date.now();
    const { limit, skip, sortBy, sortOrder } = paginationParams;
    
    try {
      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Execute query with performance tracking
      const queryOptions = {
        skip,
        limit,
        sort,
        lean: true,
        ...options.queryOptions
      };
      
      // Add index hints if available
      if (this.indexHints.has(Model.collection.name)) {
        queryOptions.hint = this.indexHints.get(Model.collection.name);
      }
      
      const [results, total] = await Promise.all([
        Model.find(query, null, queryOptions),
        Model.countDocuments(query)
      ]);
      
      const queryTime = Date.now() - startTime;
      
      // Create comprehensive pagination metadata
      const paginationMetadata = createComprehensivePagination(
        paginationParams,
        total,
        results.length,
        {
          queryTime,
          indexUsed: queryOptions.hint || null,
          executionStats: await this.getExecutionStats(Model, query, queryOptions)
        }
      );
      
      // Cache performance data
      this.cachePerformanceData(Model.collection.name, query, queryTime);
      
      return {
        results,
        pagination: paginationMetadata,
        performance: {
          queryTime,
          totalQueries: 2,
          cacheHit: false
        }
      };
      
    } catch (error) {
      logger.error('Offset pagination error:', error);
      throw error;
    }
  }

  /**
   * Execute cursor-based pagination for large datasets
   * @param {Object} Model - Mongoose model
   * @param {Object} query - MongoDB query
   * @param {Object} paginationParams - Pagination parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Cursor paginated results with metadata
   */
  async executeCursorPagination(Model, query, paginationParams, options = {}) {
    const startTime = Date.now();
    const { cursor, before, after, cursorField, limit, sortBy, sortOrder } = paginationParams;
    
    try {
      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Apply cursor conditions
      let cursorQuery = { ...query };
      
      if (cursor) {
        if (sortOrder === 'desc') {
          cursorQuery[cursorField] = { $lt: new Date(cursor) };
        } else {
          cursorQuery[cursorField] = { $gt: new Date(cursor) };
        }
      } else if (before) {
        cursorQuery[cursorField] = { $lt: new Date(before) };
      } else if (after) {
        cursorQuery[cursorField] = { $gt: new Date(after) };
      }
      
      // Execute query with one extra item to determine if there are more results
      const queryOptions = {
        limit: limit + 1,
        sort,
        lean: true,
        ...options.queryOptions
      };
      
      // Add index hints if available
      if (this.indexHints.has(Model.collection.name)) {
        queryOptions.hint = this.indexHints.get(Model.collection.name);
      }
      
      const results = await Model.find(cursorQuery, null, queryOptions);
      const queryTime = Date.now() - startTime;
      
      // Determine if there are more results
      const hasMore = results.length > limit;
      const actualResults = hasMore ? results.slice(0, limit) : results;
      
      // Create cursor pagination metadata
      const paginationMetadata = createCursorPagination(
        paginationParams,
        results,
        cursorField,
        {
          queryTime,
          indexUsed: queryOptions.hint || null,
          executionStats: await this.getExecutionStats(Model, cursorQuery, queryOptions)
        }
      );
      
      // Cache performance data
      this.cachePerformanceData(Model.collection.name, cursorQuery, queryTime);
      
      return {
        results: actualResults,
        pagination: paginationMetadata,
        performance: {
          queryTime,
          totalQueries: 1,
          cacheHit: false
        }
      };
      
    } catch (error) {
      logger.error('Cursor pagination error:', error);
      throw error;
    }
  }

  /**
   * Execute hybrid pagination (offset + cursor for different use cases)
   * @param {Object} Model - Mongoose model
   * @param {Object} query - MongoDB query
   * @param {Object} paginationParams - Pagination parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Hybrid paginated results
   */
  async executeHybridPagination(Model, query, paginationParams, options = {}) {
    const { useCursor = false, cursorThreshold = 10000 } = options;
    
    // Use cursor pagination for large datasets
    if (useCursor || paginationParams.cursor) {
      return this.executeCursorPagination(Model, query, paginationParams, options);
    }
    
    // Check if dataset is large enough to benefit from cursor pagination
    const estimatedCount = await this.estimateDocumentCount(Model, query);
    
    if (estimatedCount > cursorThreshold) {
      logger.info('Large dataset detected, recommending cursor pagination', {
        collection: Model.collection.name,
        estimatedCount,
        threshold: cursorThreshold
      });
      
      // Still use offset pagination but with performance optimizations
      return this.executeOffsetPagination(Model, query, paginationParams, {
        ...options,
        useCursor: false,
        performanceOptimized: true
      });
    }
    
    return this.executeOffsetPagination(Model, query, paginationParams, options);
  }

  /**
   * Optimize pagination for specific collection
   * @param {string} collectionName - Collection name
   * @param {Object} query - Common query patterns
   * @param {Object} sort - Common sort patterns
   * @returns {Object} Optimization recommendations
   */
  optimizeForCollection(collectionName, query, sort) {
    const recommendations = {
      recommendedIndexes: [],
      paginationStrategy: 'offset',
      performanceTips: []
    };
    
    // Analyze query patterns
    const queryFields = Object.keys(query);
    const sortFields = Object.keys(sort);
    
    // Recommend compound indexes
    if (queryFields.length > 0 && sortFields.length > 0) {
      const compoundIndex = { ...query, ...sort };
      recommendations.recommendedIndexes.push(compoundIndex);
    }
    
    // Recommend single field indexes for frequently queried fields
    queryFields.forEach(field => {
      if (!field.startsWith('$')) {
        recommendations.recommendedIndexes.push({ [field]: 1 });
      }
    });
    
    // Set pagination strategy based on collection size
    const estimatedSize = this.getCollectionSizeEstimate(collectionName);
    if (estimatedSize > 100000) {
      recommendations.paginationStrategy = 'cursor';
      recommendations.performanceTips.push('Consider using cursor-based pagination for better performance');
    }
    
    return recommendations;
  }

  /**
   * Get execution statistics for query
   * @param {Object} Model - Mongoose model
   * @param {Object} query - MongoDB query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Execution statistics
   */
  async getExecutionStats(Model, query, options) {
    try {
      // This would require MongoDB profiling to be enabled
      // For now, return basic stats
      return {
        executionTime: options.queryTime || 0,
        documentsExamined: 0, // Would need explain() for this
        documentsReturned: 0,
        indexUsed: options.hint || null
      };
    } catch (error) {
      logger.warn('Could not get execution stats:', error.message);
      return null;
    }
  }

  /**
   * Estimate document count for query
   * @param {Object} Model - Mongoose model
   * @param {Object} query - MongoDB query
   * @returns {Promise<number>} Estimated count
   */
  async estimateDocumentCount(Model, query) {
    try {
      // Use estimatedDocumentCount for better performance on large collections
      if (Object.keys(query).length === 0) {
        return await Model.estimatedDocumentCount();
      }
      
      // For filtered queries, use countDocuments
      return await Model.countDocuments(query);
    } catch (error) {
      logger.warn('Could not estimate document count:', error.message);
      return 0;
    }
  }

  /**
   * Cache performance data for optimization
   * @param {string} collectionName - Collection name
   * @param {Object} query - Query pattern
   * @param {number} queryTime - Query execution time
   */
  cachePerformanceData(collectionName, query, queryTime) {
    const key = `${collectionName}:${JSON.stringify(query)}`;
    this.performanceCache.set(key, {
      queryTime,
      timestamp: Date.now(),
      count: (this.performanceCache.get(key)?.count || 0) + 1
    });
  }

  /**
   * Get collection size estimate
   * @param {string} collectionName - Collection name
   * @returns {number} Estimated size
   */
  getCollectionSizeEstimate(_collectionName) {
    // This would typically come from a monitoring service
    // For now, return a default estimate
    return 1000;
  }

  /**
   * Set index hints for collection
   * @param {string} collectionName - Collection name
   * @param {Object} hint - Index hint
   */
  setIndexHint(collectionName, hint) {
    this.indexHints.set(collectionName, hint);
  }

  /**
   * Clear performance cache
   */
  clearCache() {
    this.performanceCache.clear();
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    const stats = {
      totalQueries: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      cacheHits: 0
    };
    
    let totalTime = 0;
    this.performanceCache.forEach((data) => {
      stats.totalQueries += data.count;
      totalTime += data.queryTime * data.count;
      
      if (data.queryTime > 1000) {
        stats.slowQueries += data.count;
      }
    });
    
    if (stats.totalQueries > 0) {
      stats.averageQueryTime = totalTime / stats.totalQueries;
    }
    
    return stats;
  }
}

// Create singleton instance
const paginationService = new PaginationService();

module.exports = {
  PaginationService,
  paginationService
};
