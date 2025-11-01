const queryOptimizationService = require('../services/queryOptimizationService');
const logger = require('../config/logger');

/**
 * Query Optimization Middleware
 * Automatically optimizes database queries and provides performance monitoring
 */

/**
 * Middleware to optimize find queries
 */
const optimizeFindQueries = (Model, _options = {}) => {
  return async (req, res, next) => {
    try {
      // Store original query methods
      const originalFind = Model.find;
      const originalFindOne = Model.findOne;
      const originalFindById = Model.findById;
      const originalCount = Model.countDocuments;
      const originalAggregate = Model.aggregate;

      // Override find method
      Model.find = function(query, projection, options) {
        const { query: optimizedQuery, options: optimizedOptions } = queryOptimizationService.optimizeFindQuery(
          query, 
          { ...options, collection: Model.collection.name }
        );
        
        return originalFind.call(this, optimizedQuery, projection, optimizedOptions);
      };

      // Override findOne method
      Model.findOne = function(query, projection, options) {
        const { query: optimizedQuery, options: optimizedOptions } = queryOptimizationService.optimizeFindQuery(
          query, 
          { ...options, collection: Model.collection.name, isListQuery: false }
        );
        
        return originalFindOne.call(this, optimizedQuery, projection, optimizedOptions);
      };

      // Override findById method
      Model.findById = function(id, projection, options) {
        const { options: optimizedOptions } = queryOptimizationService.optimizeFindQuery(
          { _id: id }, 
          { ...options, collection: Model.collection.name, isListQuery: false }
        );
        
        return originalFindById.call(this, id, projection, optimizedOptions);
      };

      // Override countDocuments method
      Model.countDocuments = function(query, options) {
        const { query: optimizedQuery } = queryOptimizationService.optimizeFindQuery(
          query, 
          { ...options, collection: Model.collection.name }
        );
        
        return originalCount.call(this, optimizedQuery, options);
      };

      // Override aggregate method
      Model.aggregate = function(pipeline, options) {
        const optimizedPipeline = queryOptimizationService.createOptimizedAggregation(
          pipeline, 
          { ...options, collection: Model.collection.name }
        );
        
        return originalAggregate.call(this, optimizedPipeline, options);
      };

      // Add query execution tracking
      const originalExec = Model.find().constructor.prototype.exec;
      Model.find().constructor.prototype.exec = function() {
        const start = Date.now();
        const collection = Model.collection.name;
        
        return originalExec.apply(this, arguments).then((result) => {
          const duration = Date.now() - start;
          
          // Log slow queries
          if (duration > 1000) {
            logger.warn('Slow query detected:', {
              collection,
              query: this.getQuery(),
              duration,
              resultCount: Array.isArray(result) ? result.length : 1
            });
          }
          
          return result;
        }).catch((error) => {
          const duration = Date.now() - start;
          logger.error('Query error:', {
            collection,
            query: this.getQuery(),
            duration,
            error: error.message
          });
          throw error;
        });
      };

      next();
    } catch (error) {
      logger.error('Query optimization middleware error:', error);
      next();
    }
  };
};

/**
 * Middleware to add query caching
 */
const addQueryCaching = (cacheTimeout = 300000) => { // 5 minutes default
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to add caching headers
    res.json = function(data) {
      // Add cache headers for successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        res.set({
          'Cache-Control': `private, max-age=${Math.floor(cacheTimeout / 1000)}`,
          'ETag': `"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16)}"`
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware to add query performance headers
 */
const addPerformanceHeaders = () => {
  return (req, res, next) => {
    const start = Date.now();
    
    // Override json method to add performance headers
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - start;
      
      // Add performance headers
      res.set({
        'X-Response-Time': `${duration}ms`,
        'X-Query-Count': res.locals.queryCount || 0,
        'X-Cache-Status': res.locals.cacheStatus || 'MISS'
      });
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware to track query count
 */
const trackQueryCount = () => {
  return (req, res, next) => {
    res.locals.queryCount = 0;
    
    // Track database queries
    const originalExec = require('mongoose').Query.prototype.exec;
    require('mongoose').Query.prototype.exec = function() {
      res.locals.queryCount = (res.locals.queryCount || 0) + 1;
      return originalExec.apply(this, arguments);
    };
    
    next();
  };
};

/**
 * Middleware to optimize search queries
 */
const optimizeSearchQueries = () => {
  return (req, res, next) => {
    // Optimize search parameters
    if (req.query.search) {
      req.query.search = req.query.search.trim();
    }
    
    // Optimize pagination
    if (req.query.page) {
      req.query.page = Math.max(1, parseInt(req.query.page) || 1);
    }
    
    if (req.query.limit) {
      req.query.limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    }
    
    // Optimize sort parameters
    if (req.query.sortBy) {
      const allowedSortFields = ['createdAt', 'updatedAt', 'rating', 'price', 'name', 'title'];
      if (!allowedSortFields.includes(req.query.sortBy)) {
        req.query.sortBy = 'createdAt';
      }
    }
    
    if (req.query.sortOrder) {
      req.query.sortOrder = ['asc', 'desc'].includes(req.query.sortOrder) ? req.query.sortOrder : 'desc';
    }
    
    next();
  };
};

/**
 * Middleware to add query hints for better performance
 */
const addQueryHints = (hints = {}) => {
  return (req, res, next) => {
    res.locals.queryHints = hints;
    next();
  };
};

/**
 * Middleware to validate query parameters
 */
const validateQueryParams = (allowedParams = []) => {
  return (req, res, next) => {
    const queryParams = Object.keys(req.query);
    const invalidParams = queryParams.filter(param => !allowedParams.includes(param));
    
    if (invalidParams.length > 0) {
      logger.warn('Invalid query parameters detected:', {
        invalidParams,
        allowedParams,
        url: req.url
      });
      
      // Remove invalid parameters
      invalidParams.forEach(param => {
        delete req.query[param];
      });
    }
    
    next();
  };
};

/**
 * Middleware to add query logging
 */
const addQueryLogging = (logLevel = 'debug') => {
  return (req, res, next) => {
    const start = Date.now();
    
    // Log request
    logger[logLevel]('Query request:', {
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      timestamp: new Date().toISOString()
    });
    
    // Override json method to log response
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - start;
      
      logger[logLevel]('Query response:', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        resultCount: Array.isArray(data) ? data.length : (data ? 1 : 0),
        timestamp: new Date().toISOString()
      });
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  optimizeFindQueries,
  addQueryCaching,
  addPerformanceHeaders,
  trackQueryCount,
  optimizeSearchQueries,
  addQueryHints,
  validateQueryParams,
  addQueryLogging
};
