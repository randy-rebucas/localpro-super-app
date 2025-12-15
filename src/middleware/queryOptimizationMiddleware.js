const logger = require('../config/logger');

/**
 * Query Optimization Middleware
 * Analyzes MongoDB queries and provides optimization suggestions
 */

class QueryOptimizationMiddleware {
  constructor() {
    this.queryAnalysis = new Map();
    this.optimizationEnabled = process.env.QUERY_OPTIMIZATION_ENABLED !== 'false';
    this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 100; // ms
  }

  /**
   * Main middleware function
   */
  middleware() {
    return (req, res, next) => {
      if (!this.optimizationEnabled) {
        return next();
      }

      const startTime = process.hrtime.bigint();
      const originalJson = res.json;

      // Override res.json to analyze response time
      res.json = function(data) {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        // Analyze the query if it took too long
        if (durationMs > this.slowQueryThreshold) {
          this.analyzeQueryPerformance(req, durationMs, data);
        }

        // Call original json method
        return originalJson.call(this, data);
      }.bind(this);

      next();
    };
  }

  /**
   * Analyze query performance and provide optimization suggestions
   */
  analyzeQueryPerformance(req, durationMs, responseData) {
    try {
      const queryAnalysis = this.extractQueryInfo(req);

      if (!queryAnalysis) return;

      const optimization = this.generateOptimization(queryAnalysis, durationMs, responseData);

      if (optimization.priority !== 'LOW') {
        logger.warn('Query optimization opportunity detected:', {
          endpoint: `${req.method} ${req.path}`,
          duration: `${durationMs.toFixed(2)}ms`,
          optimization,
          query: queryAnalysis
        });
      }

      // Store analysis for reporting
      this.storeQueryAnalysis(queryAnalysis, optimization, durationMs);

    } catch (error) {
      logger.error('Query optimization analysis failed:', error);
    }
  }

  /**
   * Extract query information from request
   */
  extractQueryInfo(req) {
    try {
      const { method, path, query, params, body } = req;

      // Identify the operation type
      let operationType = 'unknown';
      let collection = 'unknown';

      // Map endpoints to collections (this would need to be maintained as routes change)
      const endpointMappings = {
        '/api/providers': 'providers',
        '/api/marketplace': 'marketplaces',
        '/api/escrows': 'escrows',
        '/api/partners': 'partners',
        '/api/users': 'users',
        '/api/finance': 'userwallets',
        '/api/jobs': 'jobs',
        '/api/agencies': 'agencies',
        '/api/referrals': 'referrals',
        '/api/academy': 'academies',
        '/api/rentals': 'rentals',
        '/api/supplies': 'supplies',
        '/api/ads': 'ads',
        '/api/communication': 'communications',
        '/api/announcements': 'announcements',
        '/api/trust-verification': 'trustverifications',
        '/api/analytics': 'analytics',
        '/api/logs': 'logs'
      };

      // Find matching endpoint
      for (const [endpoint, coll] of Object.entries(endpointMappings)) {
        if (path.startsWith(endpoint)) {
          collection = coll;
          break;
        }
      }

      // Determine operation type from method and path
      if (method === 'GET') {
        if (params.id || path.endsWith('/me')) {
          operationType = 'findOne';
        } else {
          operationType = 'find';
        }
      } else if (method === 'POST') {
        operationType = 'insert';
      } else if (method === 'PUT' || method === 'PATCH') {
        operationType = 'update';
      } else if (method === 'DELETE') {
        operationType = 'delete';
      }

      return {
        method,
        path,
        collection,
        operationType,
        queryParams: Object.keys(query),
        hasFilters: Object.keys(query).length > 0,
        hasSorting: query.sortBy || query.sortOrder,
        hasPagination: query.page || query.limit,
        bodySize: JSON.stringify(body || {}).length,
        queryComplexity: this.calculateQueryComplexity(query)
      };

    } catch (error) {
      logger.error('Failed to extract query info:', error);
      return null;
    }
  }

  /**
   * Calculate query complexity score
   */
  calculateQueryComplexity(query) {
    let complexity = 0;

    // Basic filters
    if (query.search) complexity += 2; // Text search is expensive
    if (query.category) complexity += 1;
    if (query.status) complexity += 1;
    if (query.city || query.location) complexity += 2; // Location queries
    if (query.minPrice || query.maxPrice) complexity += 1;
    if (query.rating) complexity += 1;

    // Advanced filters
    if (query.tags) complexity += 2;
    if (query.dateFrom || query.dateTo) complexity += 1;
    if (query.sortBy && query.sortBy !== 'createdAt') complexity += 1;

    // Pagination
    if (query.page && query.limit) {
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;
      if (page > 10 || limit > 100) complexity += 2; // Deep pagination
    }

    return complexity;
  }

  /**
   * Generate optimization suggestions
   */
  generateOptimization(queryAnalysis, durationMs, responseData) {
    const suggestions = [];
    let priority = 'LOW';

    // Analyze based on query characteristics
    if (queryAnalysis.operationType === 'find' && durationMs > 200) {
      // Check for missing indexes on common query patterns
      if (queryAnalysis.queryParams.includes('status')) {
        suggestions.push('Consider adding index on status field');
        priority = 'MEDIUM';
      }

      if (queryAnalysis.queryParams.includes('category')) {
        suggestions.push('Consider adding index on category field');
        priority = 'MEDIUM';
      }

      if (queryAnalysis.queryParams.includes('search')) {
        suggestions.push('Text search detected - ensure text index exists');
        priority = 'HIGH';
      }

      if (queryAnalysis.queryParams.includes('city') || queryAnalysis.queryParams.includes('location')) {
        suggestions.push('Location queries detected - consider geospatial indexes');
        priority = 'MEDIUM';
      }

      // Check pagination efficiency
      if (queryAnalysis.hasPagination && durationMs > 500) {
        suggestions.push('Deep pagination detected - consider cursor-based pagination');
        priority = 'MEDIUM';
      }

      // Check result size
      if (responseData?.data?.length > 100) {
        suggestions.push('Large result set - consider implementing pagination limits');
        priority = 'LOW';
      }
    }

    // Update operation optimizations
    if (queryAnalysis.operationType === 'update' && durationMs > 100) {
      suggestions.push('Update operations are slow - consider bulk operations for multiple records');
      priority = 'MEDIUM';
    }

    // High complexity queries
    if (queryAnalysis.queryComplexity > 5) {
      suggestions.push('High complexity query detected - consider query optimization or caching');
      priority = 'HIGH';
    }

    return {
      suggestions,
      priority,
      queryComplexity: queryAnalysis.queryComplexity,
      estimatedImprovement: this.estimateImprovement(durationMs, queryAnalysis)
    };
  }

  /**
   * Estimate potential performance improvement
   */
  estimateImprovement(durationMs, queryAnalysis) {
    let improvement = 0;

    // Estimate improvement from indexes
    if (queryAnalysis.hasFilters) {
      improvement += 70; // 70% improvement with proper indexes
    }

    // Estimate improvement from pagination optimization
    if (queryAnalysis.hasPagination && durationMs > 500) {
      improvement += 50; // 50% improvement with better pagination
    }

    // Estimate improvement from query optimization
    if (queryAnalysis.queryComplexity > 3) {
      improvement += 60; // 60% improvement with query restructuring
    }

    return Math.min(improvement, 90); // Cap at 90% improvement
  }

  /**
   * Store query analysis for reporting
   */
  storeQueryAnalysis(queryAnalysis, optimization, durationMs) {
    const key = `${queryAnalysis.method}:${queryAnalysis.path}`;

    if (!this.queryAnalysis.has(key)) {
      this.queryAnalysis.set(key, {
        endpoint: key,
        collection: queryAnalysis.collection,
        operationType: queryAnalysis.operationType,
        callCount: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        optimizations: [],
        lastAnalyzed: new Date()
      });
    }

    const analysis = this.queryAnalysis.get(key);
    analysis.callCount++;
    analysis.totalDuration += durationMs;
    analysis.avgDuration = analysis.totalDuration / analysis.callCount;
    analysis.maxDuration = Math.max(analysis.maxDuration, durationMs);
    analysis.lastAnalyzed = new Date();

    // Add optimization if not already present
    if (optimization.suggestions.length > 0) {
      const existingOpt = analysis.optimizations.find(opt =>
        opt.suggestions.join(',') === optimization.suggestions.join(',')
      );

      if (!existingOpt) {
        analysis.optimizations.push({
          ...optimization,
          detectedAt: new Date(),
          frequency: 1
        });
      } else {
        existingOpt.frequency++;
      }
    }
  }

  /**
   * Get optimization report
   */
  getOptimizationReport() {
    const reports = Array.from(this.queryAnalysis.values())
      .filter(analysis => analysis.callCount > 5) // Only include frequently called endpoints
      .sort((a, b) => b.avgDuration - a.avgDuration) // Sort by slowest first
      .slice(0, 20); // Top 20 slowest endpoints

    return {
      generatedAt: new Date(),
      totalEndpoints: this.queryAnalysis.size,
      analyzedEndpoints: reports.length,
      topSlowEndpoints: reports,
      summary: {
        avgDuration: reports.reduce((sum, r) => sum + r.avgDuration, 0) / reports.length || 0,
        totalOptimizations: reports.reduce((sum, r) => sum + r.optimizations.length, 0)
      }
    };
  }

  /**
   * Clear stored analysis data
   */
  clearAnalysis() {
    this.queryAnalysis.clear();
    logger.info('Query optimization analysis cleared');
  }

  /**
   * Enable/disable optimization monitoring
   */
  setEnabled(enabled) {
    this.optimizationEnabled = enabled;
    logger.info(`Query optimization ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update slow query threshold
   */
  setSlowQueryThreshold(threshold) {
    this.slowQueryThreshold = threshold;
    logger.info(`Slow query threshold set to ${threshold}ms`);
  }
}

const queryOptimizer = new QueryOptimizationMiddleware();

module.exports = queryOptimizer.middleware();