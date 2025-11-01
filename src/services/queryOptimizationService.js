const logger = require('../config/logger');

/**
 * Query Optimization Service
 * Provides query optimization utilities and best practices
 */
class QueryOptimizationService {
  constructor() {
    this.queryCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Optimize find queries with best practices
   */
  optimizeFindQuery(query, options = {}) {
    const optimizedQuery = { ...query };
    const optimizedOptions = { ...options };

    // Add lean() for read-only operations if not specified
    if (options.lean === undefined && options.readOnly !== false) {
      optimizedOptions.lean = true;
    }

    // Add projection to limit fields if not specified
    if (!options.select && !options.projection) {
      // This would be collection-specific, but we'll add a general approach
      optimizedOptions.select = this.getDefaultProjection(options.collection);
    }

    // Add limit if not specified and it's a list query
    if (!options.limit && options.isListQuery !== false) {
      optimizedOptions.limit = 20; // Default limit
    }

    // Add sort for consistent results
    if (!options.sort && options.needsSorting !== false) {
      optimizedOptions.sort = { createdAt: -1 }; // Default sort
    }

    return { query: optimizedQuery, options: optimizedOptions };
  }

  /**
   * Get default projection for collections
   */
  getDefaultProjection(collectionName) {
    const projections = {
      'users': 'firstName lastName email phone role isActive profile.avatar profile.rating',
      'jobs': 'title description company.name company.location category jobType experienceLevel salary status createdAt',
      'services': 'title description category subcategory pricing provider rating isActive',
      'bookings': 'service client provider bookingDate status pricing totalAmount',
      'products': 'name description category subcategory pricing inventory isActive',
      'courses': 'title description category level instructor pricing enrollment',
      'rentalitems': 'name description category subcategory pricing availability location'
    };

    return projections[collectionName] || '';
  }

  /**
   * Create optimized aggregation pipeline
   */
  createOptimizedAggregation(stages, options = {}) {
    const optimizedStages = [...stages];

    // Add $match stage early if not present
    if (!stages.some(stage => stage.$match)) {
      optimizedStages.unshift({ $match: {} });
    }

    // Add $project stage to limit fields
    if (!stages.some(stage => stage.$project)) {
      optimizedStages.push({
        $project: this.getDefaultAggregationProjection(options.collection)
      });
    }

    // Add $limit if not present and needed
    if (!stages.some(stage => stage.$limit) && options.limit) {
      optimizedStages.push({ $limit: options.limit });
    }

    return optimizedStages;
  }

  /**
   * Get default projection for aggregation
   */
  getDefaultAggregationProjection(collectionName) {
    const projections = {
      'users': {
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        role: 1,
        isActive: 1,
        'profile.avatar': 1,
        'profile.rating': 1,
        createdAt: 1
      },
      'jobs': {
        title: 1,
        description: 1,
        'company.name': 1,
        'company.location': 1,
        category: 1,
        jobType: 1,
        experienceLevel: 1,
        salary: 1,
        status: 1,
        createdAt: 1
      }
    };

    return projections[collectionName] || {};
  }

  /**
   * Optimize text search queries
   */
  optimizeTextSearch(query, textFields, options = {}) {
    const optimizedQuery = { ...query };

    // Use $text search if available
    if (textFields.length > 0 && query.search) {
      optimizedQuery.$text = { $search: query.search };
      delete optimizedQuery.search;
    }

    // Add compound index hints for better performance
    if (options.hint) {
      optimizedQuery.hint = options.hint;
    }

    return optimizedQuery;
  }

  /**
   * Create pagination query
   */
  createPaginationQuery(page = 1, limit = 20, sort = {}) {
    const skip = (page - 1) * limit;
    
    return {
      skip: Math.max(0, skip),
      limit: Math.min(100, Math.max(1, limit)), // Cap at 100
      sort: sort
    };
  }

  /**
   * Create geospatial query for location-based searches
   */
  createGeospatialQuery(coordinates, maxDistance, _options = {}) {
    const { lat, lng } = coordinates;
    const radius = maxDistance || 50000; // Default 50km in meters

    return {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius
        }
      }
    };
  }

  /**
   * Create date range query
   */
  createDateRangeQuery(startDate, endDate, dateField = 'createdAt') {
    const query = {};
    
    if (startDate || endDate) {
      query[dateField] = {};
      if (startDate) query[dateField].$gte = new Date(startDate);
      if (endDate) query[dateField].$lte = new Date(endDate);
    }
    
    return query;
  }

  /**
   * Create price range query
   */
  createPriceRangeQuery(minPrice, maxPrice, priceField = 'pricing.basePrice') {
    const query = {};
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      query[priceField] = {};
      if (minPrice !== undefined) query[priceField].$gte = Number(minPrice);
      if (maxPrice !== undefined) query[priceField].$lte = Number(maxPrice);
    }
    
    return query;
  }

  /**
   * Create status filter query
   */
  createStatusFilterQuery(status, statusField = 'status') {
    if (!status) return {};
    
    return {
      [statusField]: Array.isArray(status) ? { $in: status } : status
    };
  }

  /**
   * Create category filter query
   */
  createCategoryFilterQuery(category, subcategory, categoryField = 'category', subcategoryField = 'subcategory') {
    const query = {};
    
    if (category) {
      query[categoryField] = category;
    }
    
    if (subcategory) {
      query[subcategoryField] = subcategory;
    }
    
    return query;
  }

  /**
   * Create rating filter query
   */
  createRatingFilterQuery(minRating, ratingField = 'rating.average') {
    if (!minRating) return {};
    
    return {
      [ratingField]: { $gte: Number(minRating) }
    };
  }

  /**
   * Create compound query from multiple filters
   */
  createCompoundQuery(filters) {
    const query = {};
    
    // Combine all non-empty filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'search' && filters.textFields) {
          // Handle text search
          query.$text = { $search: value };
        } else if (key === 'location' && filters.coordinates) {
          // Handle geospatial search
          Object.assign(query, this.createGeospatialQuery(
            filters.coordinates, 
            filters.maxDistance
          ));
        } else if (key === 'dateRange' && value.startDate) {
          // Handle date range
          Object.assign(query, this.createDateRangeQuery(
            value.startDate, 
            value.endDate, 
            value.field
          ));
        } else if (key === 'priceRange' && (value.minPrice || value.maxPrice)) {
          // Handle price range
          Object.assign(query, this.createPriceRangeQuery(
            value.minPrice, 
            value.maxPrice, 
            value.field
          ));
        } else if (key === 'status') {
          // Handle status filter
          Object.assign(query, this.createStatusFilterQuery(value, filters.statusField));
        } else if (key === 'category') {
          // Handle category filter
          Object.assign(query, this.createCategoryFilterQuery(
            value, 
            filters.subcategory, 
            filters.categoryField, 
            filters.subcategoryField
          ));
        } else if (key === 'minRating') {
          // Handle rating filter
          Object.assign(query, this.createRatingFilterQuery(value, filters.ratingField));
        } else {
          // Handle simple field filters
          if (Array.isArray(value)) {
            query[key] = { $in: value };
          } else if (typeof value === 'string' && value.includes('*')) {
            query[key] = { $regex: value.replace(/\*/g, '.*'), $options: 'i' };
          } else {
            query[key] = value;
          }
        }
      }
    });
    
    return query;
  }

  /**
   * Add query caching
   */
  getCachedQuery(cacheKey) {
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set query cache
   */
  setCachedQuery(cacheKey, data) {
    this.queryCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear query cache
   */
  clearCache() {
    this.queryCache.clear();
  }

  /**
   * Generate cache key from query and options
   */
  generateCacheKey(query, options, collectionName) {
    const keyData = {
      collection: collectionName,
      query: JSON.stringify(query),
      options: JSON.stringify(options)
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Execute optimized query with caching
   */
  async executeOptimizedQuery(Model, query, options = {}, useCache = false) {
    const cacheKey = useCache ? this.generateCacheKey(query, options, Model.collection.name) : null;
    
    // Check cache first
    if (useCache && cacheKey) {
      const cached = this.getCachedQuery(cacheKey);
      if (cached) {
        logger.debug('Query cache hit:', cacheKey);
        return cached;
      }
    }

    // Optimize query
    const { query: optimizedQuery, options: optimizedOptions } = this.optimizeFindQuery(query, options);
    
    // Execute query
    const start = Date.now();
    const result = await Model.find(optimizedQuery, null, optimizedOptions);
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      logger.warn('Slow query detected:', {
        collection: Model.collection.name,
        query: optimizedQuery,
        duration,
        resultCount: result.length
      });
    }
    
    // Cache result if enabled
    if (useCache && cacheKey) {
      this.setCachedQuery(cacheKey, result);
    }
    
    return result;
  }

  /**
   * Execute optimized aggregation with caching
   */
  async executeOptimizedAggregation(Model, pipeline, options = {}, useCache = false) {
    const cacheKey = useCache ? this.generateCacheKey(pipeline, options, Model.collection.name) : null;
    
    // Check cache first
    if (useCache && cacheKey) {
      const cached = this.getCachedQuery(cacheKey);
      if (cached) {
        logger.debug('Aggregation cache hit:', cacheKey);
        return cached;
      }
    }

    // Optimize pipeline
    const optimizedPipeline = this.createOptimizedAggregation(pipeline, options);
    
    // Execute aggregation
    const start = Date.now();
    const result = await Model.aggregate(optimizedPipeline);
    const duration = Date.now() - start;
    
    // Log slow aggregations
    if (duration > 1000) {
      logger.warn('Slow aggregation detected:', {
        collection: Model.collection.name,
        pipeline: optimizedPipeline,
        duration,
        resultCount: result.length
      });
    }
    
    // Cache result if enabled
    if (useCache && cacheKey) {
      this.setCachedQuery(cacheKey, result);
    }
    
    return result;
  }
}

module.exports = new QueryOptimizationService();
