const databaseOptimizationService = require('../services/databaseOptimizationService');
const queryOptimizationService = require('../services/queryOptimizationService');
const dbMonitor = require('../services/databasePerformanceMonitor');
const logger = require('../config/logger');

/**
 * Database Optimization Controller
 * Provides endpoints for database optimization and performance monitoring
 */

/**
 * @desc    Get database optimization report
 * @route   GET /api/database/optimization/report
 * @access  Private (Admin only)
 */
const getOptimizationReport = async (req, res) => {
  try {
    const report = await databaseOptimizationService.getOptimizationReport();
    
    res.json({
      success: true,
      data: report,
      message: 'Database optimization report generated successfully'
    });
  } catch (error) {
    logger.error('Error generating optimization report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate optimization report',
      error: error.message
    });
  }
};

/**
 * @desc    Get index recommendations
 * @route   GET /api/database/optimization/recommendations
 * @access  Private (Admin only)
 */
const getIndexRecommendations = async (req, res) => {
  try {
    const analysis = await databaseOptimizationService.analyzeQueryPerformance();
    
    const recommendations = analysis.recommendations.map(rec => ({
      type: rec.type,
      severity: rec.severity,
      message: rec.message,
      collection: rec.collection || 'unknown',
      index: rec.index,
      reason: rec.reason,
      action: rec.action
    }));
    
    res.json({
      success: true,
      data: {
        recommendations,
        summary: {
          total: recommendations.length,
          high: recommendations.filter(r => r.severity === 'high').length,
          medium: recommendations.filter(r => r.severity === 'medium').length,
          low: recommendations.filter(r => r.severity === 'low').length
        }
      },
      message: 'Index recommendations retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting index recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get index recommendations',
      error: error.message
    });
  }
};

/**
 * @desc    Create recommended indexes
 * @route   POST /api/database/optimization/create-indexes
 * @access  Private (Admin only)
 */
const createRecommendedIndexes = async (req, res) => {
  try {
    const { collection, indexes } = req.body;
    
    if (!collection || !indexes || !Array.isArray(indexes)) {
      return res.status(400).json({
        success: false,
        message: 'Collection and indexes array are required'
      });
    }
    
    const results = await databaseOptimizationService.createRecommendedIndexes(
      indexes.map(index => ({
        type: 'missing_compound_index',
        collection,
        index
      }))
    );
    
    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      },
      message: 'Index creation completed'
    });
  } catch (error) {
    logger.error('Error creating indexes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create indexes',
      error: error.message
    });
  }
};

/**
 * @desc    Get query performance statistics
 * @route   GET /api/database/optimization/query-stats
 * @access  Private (Admin only)
 */
const getQueryStats = async (req, res) => {
  try {
    const queryStats = dbMonitor.getQueryStats();
    const slowQueries = dbMonitor.getSlowQueries(parseInt(req.query.limit) || 20);
    
    res.json({
      success: true,
      data: {
        queryStats,
        slowQueries,
        summary: {
          totalQueries: queryStats.reduce((sum, q) => sum + q.count, 0),
          avgResponseTime: queryStats.reduce((sum, q) => sum + q.avgDuration, 0) / queryStats.length || 0,
          slowQueriesCount: slowQueries.length,
          topSlowQueries: slowQueries.slice(0, 5)
        }
      },
      message: 'Query statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting query stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get query statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get database health status
 * @route   GET /api/database/optimization/health
 * @access  Private (Admin only)
 */
const getDatabaseHealth = async (req, res) => {
  try {
    const health = await dbMonitor.getDatabaseStats();
    const connectionStats = dbMonitor.getConnectionStats();
    
    const healthStatus = {
      status: health.error ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      database: health.database || 'unknown',
      collections: health.collections || 0,
      dataSize: health.dataSize || 0,
      storageSize: health.storageSize || 0,
      indexSize: health.indexSize || 0,
      connections: connectionStats,
      uptime: process.uptime()
    };
    
    res.json({
      success: true,
      data: healthStatus,
      message: 'Database health status retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting database health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database health',
      error: error.message
    });
  }
};

/**
 * @desc    Clear query cache
 * @route   POST /api/database/optimization/clear-cache
 * @access  Private (Admin only)
 */
const clearQueryCache = async (req, res) => {
  try {
    queryOptimizationService.clearCache();
    
    res.json({
      success: true,
      message: 'Query cache cleared successfully'
    });
  } catch (error) {
    logger.error('Error clearing query cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear query cache',
      error: error.message
    });
  }
};

/**
 * @desc    Get collection statistics
 * @route   GET /api/database/optimization/collections
 * @access  Private (Admin only)
 */
const getCollectionStats = async (req, res) => {
  try {
    const collectionStats = await dbMonitor.getCollectionStats();
    
    res.json({
      success: true,
      data: {
        collections: collectionStats,
        summary: {
          totalCollections: collectionStats.length,
          totalDocuments: collectionStats.reduce((sum, c) => sum + (c.count || 0), 0),
          totalSize: collectionStats.reduce((sum, c) => sum + (c.size || 0), 0),
          avgDocumentSize: collectionStats.reduce((sum, c) => sum + (c.avgObjSize || 0), 0) / collectionStats.length || 0
        }
      },
      message: 'Collection statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting collection stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get collection statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Analyze slow queries
 * @route   GET /api/database/optimization/slow-queries
 * @access  Private (Admin only)
 */
const analyzeSlowQueries = async (req, res) => {
  try {
    const slowQueries = dbMonitor.getSlowQueries(parseInt(req.query.limit) || 50);
    
    // Analyze patterns in slow queries
    const analysis = {
      totalSlowQueries: slowQueries.length,
      avgDuration: slowQueries.reduce((sum, q) => sum + q.duration, 0) / slowQueries.length || 0,
      maxDuration: Math.max(...slowQueries.map(q => q.duration), 0),
      collections: [...new Set(slowQueries.map(q => q.collection))],
      operations: [...new Set(slowQueries.map(q => q.operation))],
      commonPatterns: analyzeQueryPatterns(slowQueries),
      recommendations: generateSlowQueryRecommendations(slowQueries)
    };
    
    res.json({
      success: true,
      data: {
        slowQueries,
        analysis
      },
      message: 'Slow query analysis completed successfully'
    });
  } catch (error) {
    logger.error('Error analyzing slow queries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze slow queries',
      error: error.message
    });
  }
};

/**
 * Analyze query patterns from slow queries
 */
const analyzeQueryPatterns = (slowQueries) => {
  const patterns = {};
  
  slowQueries.forEach(query => {
    const key = `${query.operation}_${query.collection}`;
    if (!patterns[key]) {
      patterns[key] = {
        operation: query.operation,
        collection: query.collection,
        count: 0,
        totalDuration: 0,
        avgDuration: 0
      };
    }
    
    patterns[key].count++;
    patterns[key].totalDuration += query.duration;
    patterns[key].avgDuration = patterns[key].totalDuration / patterns[key].count;
  });
  
  return Object.values(patterns).sort((a, b) => b.avgDuration - a.avgDuration);
};

/**
 * Generate recommendations for slow queries
 */
const generateSlowQueryRecommendations = (slowQueries) => {
  const recommendations = [];
  
  // Group by collection
  const byCollection = slowQueries.reduce((acc, query) => {
    if (!acc[query.collection]) acc[query.collection] = [];
    acc[query.collection].push(query);
    return acc;
  }, {});
  
  Object.entries(byCollection).forEach(([collection, queries]) => {
    const avgDuration = queries.reduce((sum, q) => sum + q.duration, 0) / queries.length;
    
    if (avgDuration > 2000) {
      recommendations.push({
        type: 'index_optimization',
        severity: 'high',
        collection,
        message: `Collection ${collection} has queries averaging ${avgDuration}ms`,
        suggestion: 'Consider adding compound indexes for frequently queried fields'
      });
    }
    
    if (queries.length > 10) {
      recommendations.push({
        type: 'query_optimization',
        severity: 'medium',
        collection,
        message: `${queries.length} slow queries detected in ${collection}`,
        suggestion: 'Review and optimize query patterns'
      });
    }
  });
  
  return recommendations;
};

/**
 * @desc    Reset performance statistics
 * @route   POST /api/database/optimization/reset-stats
 * @access  Private (Admin only)
 */
const resetPerformanceStats = async (req, res) => {
  try {
    dbMonitor.resetStats();
    
    res.json({
      success: true,
      message: 'Performance statistics reset successfully'
    });
  } catch (error) {
    logger.error('Error resetting performance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset performance statistics',
      error: error.message
    });
  }
};

module.exports = {
  getOptimizationReport,
  getIndexRecommendations,
  createRecommendedIndexes,
  getQueryStats,
  getDatabaseHealth,
  clearQueryCache,
  getCollectionStats,
  analyzeSlowQueries,
  resetPerformanceStats
};
