const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Database Performance Monitoring Service
 * Monitors slow queries, connection pool, and provides optimization insights
 */

class DatabasePerformanceMonitor {
  constructor() {
    this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 100; // ms
    this.monitoringEnabled = process.env.DATABASE_PERFORMANCE_MONITORING !== 'false';
    this.queryStats = new Map();
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      availableConnections: 0,
      pendingOperations: 0
    };

    if (this.monitoringEnabled) {
      this.initializeMonitoring();
    }
  }

  /**
   * Initialize database monitoring
   */
  initializeMonitoring() {
    if (!mongoose.connection) {
      logger.warn('Database connection not available for monitoring');
      return;
    }

    // Enable mongoose query debugging in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collection, method, query, doc) => {
        this.logQueryPerformance(collection, method, query, doc);
      });
    }

    // Monitor connection pool
    this.monitorConnectionPool();

    // Set up periodic stats collection
    setInterval(() => {
      this.collectPerformanceStats();
    }, 30000); // Every 30 seconds

    logger.info('Database performance monitoring initialized');
  }

  /**
   * Monitor connection pool statistics
   */
  monitorConnectionPool() {
    try {
      const conn = mongoose.connection;

      // Update connection stats
      setInterval(() => {
        try {
          if (conn.readyState === 1) { // Connected
            // Try to get pool information - structure may vary by MongoDB driver version
            let poolInfo = {
              totalConnections: 0,
              activeConnections: 0,
              availableConnections: 0,
              pendingOperations: 0
            };

            // Try different paths to access pool information
            if (conn.db?.serverConfig?.s?.pool) {
              const pool = conn.db.serverConfig.s.pool;
              poolInfo = {
                totalConnections: pool.totalCount || pool.totalConnections || 0,
                activeConnections: pool.size || pool.activeConnections || 0,
                availableConnections: pool.available || pool.availableConnections || 0,
                pendingOperations: pool.pending || pool.pendingOperations || 0
              };
            } else if (conn.db?.topology?.s?.pool) {
              const pool = conn.db.topology.s.pool;
              poolInfo = {
                totalConnections: pool.totalCount || pool.totalConnections || 0,
                activeConnections: pool.size || pool.activeConnections || 0,
                availableConnections: pool.available || pool.availableConnections || 0,
                pendingOperations: pool.pending || pool.pendingOperations || 0
              };
            } else {
              // Fallback: use connection state information
              poolInfo = {
                totalConnections: conn.readyState === 1 ? 1 : 0,
                activeConnections: conn.readyState === 1 ? 1 : 0,
                availableConnections: conn.readyState === 1 ? 1 : 0,
                pendingOperations: 0
              };
            }

            this.connectionStats = poolInfo;
          }
        } catch (poolError) {
          // Silently handle pool access errors - pool structure may not be available
          // This is not critical for application functionality
          if (process.env.NODE_ENV === 'development') {
            logger.debug('Could not access connection pool info:', poolError.message);
          }
        }
      }, 5000); // Every 5 seconds

    } catch (error) {
      logger.error('Failed to initialize connection pool monitoring:', error);
    }
  }

  /**
   * Log query performance for analysis
   */
  logQueryPerformance(collection, method, query, doc, startTime) {
    const queryId = `${collection}.${method}.${Date.now()}`;
    const executionTime = startTime ? Date.now() - startTime : 0;

    // Store query stats
    if (!this.queryStats.has(queryId)) {
      this.queryStats.set(queryId, {
        collection,
        method,
        query: JSON.stringify(query),
        executionTime,
        timestamp: new Date(),
        count: 1
      });
    } else {
      const existing = this.queryStats.get(queryId);
      existing.executionTime = Math.max(existing.executionTime, executionTime);
      existing.count++;
    }

    // Log slow queries
    if (executionTime > this.slowQueryThreshold) {
      logger.warn('Slow query detected:', {
        collection,
        method,
        executionTime: `${executionTime}ms`,
        query: JSON.stringify(query).substring(0, 500),
        threshold: `${this.slowQueryThreshold}ms`
      });
    }
  }

  /**
   * Collect comprehensive performance statistics
   */
  async collectPerformanceStats() {
    try {
      const db = mongoose.connection.db;
      if (!db) return;

      const stats = await db.stats();

      // Analyze collection statistics
      const collections = await db.listCollections().toArray();
      const collectionStats = [];

      for (const collection of collections.slice(0, 10)) { // Limit to first 10 for performance
        try {
          const collStats = await db.collection(collection.name).stats();
          collectionStats.push({
            name: collection.name,
            size: collStats.size,
            count: collStats.count,
            avgObjSize: collStats.avgObjSize,
            indexes: collStats.nindexes,
            indexSize: collStats.totalIndexSize
          });
        } catch (error) {
          // Skip collections that can't be analyzed
        }
      }

      // Log performance summary every 5 minutes
      if (Math.floor(Date.now() / 300000) % 10 === 0) { // Every ~5 minutes
        logger.info('Database Performance Summary:', {
          collections: stats.collections,
          objects: stats.objects,
          dataSize: this.formatBytes(stats.dataSize),
          indexSize: this.formatBytes(stats.indexSize),
          storageSize: this.formatBytes(stats.storageSize),
          connectionPool: this.connectionStats,
          topCollections: collectionStats
            .sort((a, b) => b.size - a.size)
            .slice(0, 5)
        });
      }

    } catch (error) {
      logger.error('Failed to collect performance stats:', error);
    }
  }

  /**
   * Analyze slow queries and provide optimization recommendations
   */
  async analyzeSlowQueries() {
    try {
      const slowQueries = Array.from(this.queryStats.values())
        .filter(stat => stat.executionTime > this.slowQueryThreshold)
        .sort((a, b) => b.executionTime - a.executionTime)
        .slice(0, 20); // Top 20 slowest

      if (slowQueries.length === 0) {
        return { message: 'No slow queries detected', recommendations: [] };
      }

      const recommendations = this.generateOptimizationRecommendations(slowQueries);

      return {
        slowQueriesCount: slowQueries.length,
        topSlowQueries: slowQueries,
        recommendations,
        analysis: {
          averageExecutionTime: slowQueries.reduce((sum, q) => sum + q.executionTime, 0) / slowQueries.length,
          mostAffectedCollection: this.getMostAffectedCollection(slowQueries)
        }
      };

    } catch (error) {
      logger.error('Failed to analyze slow queries:', error);
      return { error: error.message };
    }
  }

  /**
   * Generate optimization recommendations based on slow queries
   */
  generateOptimizationRecommendations(slowQueries) {
    const recommendations = [];

    // Group queries by collection and operation
    const queryGroups = {};
    slowQueries.forEach(query => {
      const key = `${query.collection}.${query.method}`;
      if (!queryGroups[key]) {
        queryGroups[key] = [];
      }
      queryGroups[key].push(query);
    });

    // Analyze each group
    Object.entries(queryGroups).forEach(([key, queries]) => {
      const [collection, method] = key.split('.');
      const avgTime = queries.reduce((sum, q) => sum + q.executionTime, 0) / queries.length;

      // Method-specific recommendations
      if (method === 'find' || method === 'findOne') {
        recommendations.push({
          type: 'INDEXING',
          priority: avgTime > 500 ? 'HIGH' : 'MEDIUM',
          collection,
          operation: method,
          recommendation: `Consider adding indexes for frequently queried fields in ${collection}`,
          queries: queries.length,
          avgExecutionTime: avgTime
        });
      }

      if (method === 'aggregate') {
        recommendations.push({
          type: 'AGGREGATION_OPTIMIZATION',
          priority: 'MEDIUM',
          collection,
          operation: method,
          recommendation: `Review aggregation pipeline in ${collection} for optimization opportunities`,
          queries: queries.length,
          avgExecutionTime: avgTime
        });
      }

      if (method === 'update' || method === 'updateOne') {
        recommendations.push({
          type: 'UPDATE_OPTIMIZATION',
          priority: 'LOW',
          collection,
          operation: method,
          recommendation: `Consider bulk operations for multiple ${collection} updates`,
          queries: queries.length,
          avgExecutionTime: avgTime
        });
      }
    });

    return recommendations;
  }

  /**
   * Get the most affected collection
   */
  getMostAffectedCollection(slowQueries) {
    const collectionStats = {};
    slowQueries.forEach(query => {
      if (!collectionStats[query.collection]) {
        collectionStats[query.collection] = { count: 0, totalTime: 0 };
      }
      collectionStats[query.collection].count++;
      collectionStats[query.collection].totalTime += query.executionTime;
    });

    return Object.entries(collectionStats)
      .sort(([,a], [,b]) => b.totalTime - a.totalTime)[0]?.[0] || 'unknown';
  }

  /**
   * Get current connection pool status
   */
  getConnectionPoolStatus() {
    return {
      ...this.connectionStats,
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      lastUpdated: new Date()
    };
  }

  /**
   * Get database performance metrics
   */
  async getPerformanceMetrics() {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        return { error: 'Database not connected' };
      }

      const dbStats = await db.stats();

      return {
        database: {
          name: dbStats.db,
          collections: dbStats.collections,
          objects: dbStats.objects,
          dataSize: dbStats.dataSize,
          indexSize: dbStats.indexSize,
          storageSize: dbStats.storageSize
        },
        connections: this.getConnectionPoolStatus(),
        queries: {
          slowQueriesCount: Array.from(this.queryStats.values())
            .filter(stat => stat.executionTime > this.slowQueryThreshold).length,
          totalQueriesTracked: this.queryStats.size
        },
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Failed to get performance metrics:', error);
      return { error: error.message };
    }
  }

  /**
   * Clear query statistics (useful for testing)
   */
  clearQueryStats() {
    this.queryStats.clear();
    logger.info('Query statistics cleared');
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Middleware for monitoring query performance
   */
  createMonitoringMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Hook into response finish
      res.on('finish', () => {
        const duration = Date.now() - startTime;

        if (duration > this.slowQueryThreshold) {
          logger.warn('Slow API response detected:', {
            method: req.method,
            url: req.url,
            duration: `${duration}ms`,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent')?.substring(0, 100)
          });
        }
      });

      next();
    };
  }

  /**
   * Export performance report
   */
  async generatePerformanceReport() {
    try {
      const metrics = await this.getPerformanceMetrics();
      const slowQueryAnalysis = await this.analyzeSlowQueries();

      return {
        generatedAt: new Date(),
        period: 'Last monitoring session',
        metrics,
        slowQueryAnalysis,
        recommendations: [
          {
            category: 'INDEXING',
            items: slowQueryAnalysis.recommendations?.filter(r => r.type === 'INDEXING') || []
          },
          {
            category: 'QUERY_OPTIMIZATION',
            items: slowQueryAnalysis.recommendations?.filter(r => r.type !== 'INDEXING') || []
          }
        ]
      };

    } catch (error) {
      logger.error('Failed to generate performance report:', error);
      return { error: error.message };
    }
  }
}

module.exports = new DatabasePerformanceMonitor();