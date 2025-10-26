/**
 * Database Optimization Service
 * 
 * This service provides comprehensive database optimization features including:
 * - Query optimization utilities
 * - Index management
 * - Query performance monitoring
 * - Caching strategies
 * - Connection pooling optimization
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseOptimizationService {
  constructor() {
    this.queryStats = new Map();
    this.slowQueryThreshold = 100; // milliseconds
    this.cache = new Map();
    this.cacheExpiry = new Map();
  }

  /**
   * Optimize a MongoDB query with projection, pagination, and performance hints
   * @param {Object} query - Mongoose query object
   * @param {Object} options - Optimization options
   * @returns {Object} Optimized query
   */
  optimizeQuery(query, options = {}) {
    const {
      projection = {},
      limit = 20,
      skip = 0,
      sort = {},
      populate = [],
      lean = true,
      explain = false
    } = options;

    // Apply projection to reduce data transfer
    if (Object.keys(projection).length > 0) {
      query = query.select(projection);
    }

    // Apply pagination
    if (skip > 0) {
      query = query.skip(skip);
    }
    if (limit > 0) {
      query = query.limit(limit);
    }

    // Apply sorting
    if (Object.keys(sort).length > 0) {
      query = query.sort(sort);
    }

    // Apply population
    if (populate.length > 0) {
      populate.forEach(pop => {
        if (typeof pop === 'string') {
          query = query.populate(pop);
        } else {
          query = query.populate(pop.path, pop.select);
        }
      });
    }

    // Use lean for better performance when possible
    if (lean) {
      query = query.lean();
    }

    // Add query explanation if requested
    if (explain) {
      query = query.explain('executionStats');
    }

    return query;
  }

  /**
   * Create optimized aggregation pipeline
   * @param {Array} pipeline - Aggregation pipeline
   * @param {Object} options - Optimization options
   * @returns {Array} Optimized pipeline
   */
  optimizeAggregation(pipeline, options = {}) {
    const {
      allowDiskUse = true,
      maxTimeMS = 30000,
      hint = null
    } = options;

    const optimizedPipeline = [...pipeline];

    // Add $match stage early if not present
    if (!optimizedPipeline[0] || optimizedPipeline[0].$match === undefined) {
      optimizedPipeline.unshift({ $match: {} });
    }

    // Add $limit early if possible
    const limitStage = optimizedPipeline.find(stage => stage.$limit);
    if (limitStage && optimizedPipeline.indexOf(limitStage) > 2) {
      // Move $limit closer to the beginning
      const index = optimizedPipeline.indexOf(limitStage);
      optimizedPipeline.splice(index, 1);
      optimizedPipeline.splice(2, 0, limitStage);
    }

    // Add performance optimizations
    const optionsObj = {
      allowDiskUse,
      maxTimeMS
    };

    if (hint) {
      optionsObj.hint = hint;
    }

    return { pipeline: optimizedPipeline, options: optionsObj };
  }

  /**
   * Monitor query performance
   * @param {String} operation - Operation name
   * @param {Function} queryFunction - Query function to execute
   * @returns {Promise} Query result
   */
  async monitorQuery(operation, queryFunction) {
    const startTime = Date.now();
    
    try {
      const result = await queryFunction();
      const executionTime = Date.now() - startTime;
      
      // Log slow queries
      if (executionTime > this.slowQueryThreshold) {
        logger.warn(`Slow query detected: ${operation} took ${executionTime}ms`);
      }
      
      // Store query statistics
      this.updateQueryStats(operation, executionTime, true);
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateQueryStats(operation, executionTime, false);
      throw error;
    }
  }

  /**
   * Update query statistics
   * @param {String} operation - Operation name
   * @param {Number} executionTime - Execution time in ms
   * @param {Boolean} success - Whether query was successful
   */
  updateQueryStats(operation, executionTime, success) {
    if (!this.queryStats.has(operation)) {
      this.queryStats.set(operation, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity,
        errors: 0
      });
    }

    const stats = this.queryStats.get(operation);
    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.minTime = Math.min(stats.minTime, executionTime);
    
    if (!success) {
      stats.errors++;
    }
  }

  /**
   * Get query performance statistics
   * @returns {Object} Query statistics
   */
  getQueryStats() {
    const stats = {};
    for (const [operation, data] of this.queryStats.entries()) {
      stats[operation] = { ...data };
    }
    return stats;
  }

  /**
   * Clear query statistics
   */
  clearQueryStats() {
    this.queryStats.clear();
  }

  /**
   * Create database indexes for optimal performance
   * @param {String} collection - Collection name
   * @param {Array} indexes - Array of index specifications
   * @returns {Promise} Index creation result
   */
  async createIndexes(collection, indexes) {
    try {
      const db = mongoose.connection.db;
      const collectionObj = db.collection(collection);
      
      const results = [];
      for (const index of indexes) {
        try {
          const result = await collectionObj.createIndex(index.keys, index.options || {});
          results.push({ index: index.keys, result });
          logger.info(`Created index on ${collection}:`, index.keys);
        } catch (error) {
          if (error.code !== 85) { // Index already exists
            logger.error(`Failed to create index on ${collection}:`, error);
            results.push({ index: index.keys, error: error.message });
          }
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Error creating indexes:', error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   * @param {String} collection - Collection name
   * @returns {Promise} Collection statistics
   */
  async getCollectionStats(collection) {
    try {
      const db = mongoose.connection.db;
      const stats = await db.collection(collection).stats();
      return stats;
    } catch (error) {
      logger.error(`Error getting stats for ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Analyze query performance using explain
   * @param {Object} query - Mongoose query
   * @returns {Promise} Query explanation
   */
  async analyzeQuery(query) {
    try {
      const explanation = await query.explain('executionStats');
      return {
        executionTime: explanation.executionTimeMillis,
        totalDocsExamined: explanation.totalDocsExamined,
        totalDocsReturned: explanation.totalDocsReturned,
        indexUsed: explanation.executionStages?.indexName || 'No index used',
        stage: explanation.executionStages?.stage || 'Unknown'
      };
    } catch (error) {
      logger.error('Error analyzing query:', error);
      throw error;
    }
  }

  /**
   * Implement query result caching
   * @param {String} key - Cache key
   * @param {Function} queryFunction - Query function
   * @param {Number} ttl - Time to live in seconds
   * @returns {Promise} Cached or fresh result
   */
  async cachedQuery(key, queryFunction, ttl = 300) {
    // Use in-memory cache as fallback
    const now = Date.now();
    const expiry = this.cacheExpiry.get(key);
    
    // Check if cached result exists and is not expired
    if (this.cache.has(key) && expiry && now < expiry) {
      logger.debug(`Cache hit for key: ${key}`);
      return this.cache.get(key);
    }
    
    // Execute query and cache result
    const result = await queryFunction();
    this.cache.set(key, result);
    this.cacheExpiry.set(key, now + (ttl * 1000));
    
    logger.debug(`Cached result for key: ${key}, TTL: ${ttl}s`);
    return result;
  }

  /**
   * Clear cache
   * @param {String} pattern - Cache key pattern (optional)
   */
  clearCache(pattern = null) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          this.cacheExpiry.delete(key);
        }
      }
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Optimize database connection settings
   * @param {Object} options - Connection options
   * @returns {Object} Optimized connection options
   */
  optimizeConnection(options = {}) {
    return {
      maxPoolSize: options.maxPoolSize || 10,
      minPoolSize: options.minPoolSize || 2,
      maxIdleTimeMS: options.maxIdleTimeMS || 30000,
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS || 5000,
      socketTimeoutMS: options.socketTimeoutMS || 45000,
      bufferMaxEntries: options.bufferMaxEntries || 0,
      bufferCommands: options.bufferCommands || false,
      ...options
    };
  }

  /**
   * Get database performance metrics
   * @returns {Promise} Performance metrics
   */
  async getPerformanceMetrics() {
    try {
      const db = mongoose.connection.db;
      const serverStatus = await db.admin().serverStatus();
      
      return {
        connections: serverStatus.connections,
        memory: serverStatus.mem,
        operations: serverStatus.opcounters,
        network: serverStatus.network,
        queryStats: this.getQueryStats()
      };
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Clean up old data based on retention policy
   * @param {String} collection - Collection name
   * @param {Object} criteria - Cleanup criteria
   * @returns {Promise} Cleanup result
   */
  async cleanupOldData(collection, criteria) {
    try {
      const db = mongoose.connection.db;
      const collectionObj = db.collection(collection);
      
      const result = await collectionObj.deleteMany(criteria);
      logger.info(`Cleaned up ${result.deletedCount} documents from ${collection}`);
      
      return result;
    } catch (error) {
      logger.error(`Error cleaning up ${collection}:`, error);
      throw error;
    }
  }
}

module.exports = new DatabaseOptimizationService();
