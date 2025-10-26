/**
 * Database Performance Controller
 * 
 * This controller provides endpoints for monitoring and managing
 * database performance, query statistics, and optimization.
 */

const databaseOptimization = require('../services/databaseOptimizationService');
const redisCache = require('../services/redisCacheService');
const logger = require('../utils/logger');

// @desc    Get database performance metrics
// @route   GET /api/database/metrics
// @access  Admin
const getDatabaseMetrics = async (req, res) => {
  try {
    const metrics = await databaseOptimization.getPerformanceMetrics();
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Get database metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database metrics'
    });
  }
};

// @desc    Get query performance statistics
// @route   GET /api/database/query-stats
// @access  Admin
const getQueryStats = async (req, res) => {
  try {
    const stats = databaseOptimization.getQueryStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get query stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve query statistics'
    });
  }
};

// @desc    Clear query statistics
// @route   DELETE /api/database/query-stats
// @access  Admin
const clearQueryStats = async (req, res) => {
  try {
    databaseOptimization.clearQueryStats();
    
    res.status(200).json({
      success: true,
      message: 'Query statistics cleared successfully'
    });
  } catch (error) {
    logger.error('Clear query stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear query statistics'
    });
  }
};

// @desc    Get collection statistics
// @route   GET /api/database/collections/:collection/stats
// @access  Admin
const getCollectionStats = async (req, res) => {
  try {
    const { collection } = req.params;
    const stats = await databaseOptimization.getCollectionStats(collection);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`Get collection stats error for ${req.params.collection}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve collection statistics'
    });
  }
};

// @desc    Analyze query performance
// @route   POST /api/database/analyze-query
// @access  Admin
const analyzeQuery = async (req, res) => {
  try {
    const { model, filter, options } = req.body;
    
    if (!model || !filter) {
      return res.status(400).json({
        success: false,
        message: 'Model and filter are required'
      });
    }

    // This would need to be implemented based on the specific model
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      message: 'Query analysis feature coming soon',
      data: {
        model,
        filter,
        options
      }
    });
  } catch (error) {
    logger.error('Analyze query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze query'
    });
  }
};

// @desc    Get cache statistics
// @route   GET /api/database/cache-stats
// @access  Admin
const getCacheStats = async (req, res) => {
  try {
    const stats = await redisCache.getStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache statistics'
    });
  }
};

// @desc    Clear cache
// @route   DELETE /api/database/cache
// @access  Admin
const clearCache = async (req, res) => {
  try {
    const { pattern } = req.query;
    
    if (pattern) {
      const deletedCount = await redisCache.delPattern(pattern);
      res.status(200).json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`,
        deletedCount
      });
    } else {
      const success = await redisCache.flushAll();
      res.status(200).json({
        success,
        message: success ? 'All cache cleared successfully' : 'Failed to clear cache'
      });
    }
  } catch (error) {
    logger.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
};

// @desc    Create database indexes
// @route   POST /api/database/indexes
// @access  Admin
const createIndexes = async (req, res) => {
  try {
    const { collection, indexes } = req.body;
    
    if (!collection || !indexes || !Array.isArray(indexes)) {
      return res.status(400).json({
        success: false,
        message: 'Collection and indexes array are required'
      });
    }

    const results = await databaseOptimization.createIndexes(collection, indexes);
    
    res.status(200).json({
      success: true,
      message: 'Indexes created successfully',
      data: results
    });
  } catch (error) {
    logger.error('Create indexes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create indexes'
    });
  }
};

// @desc    Clean up old data
// @route   POST /api/database/cleanup
// @access  Admin
const cleanupOldData = async (req, res) => {
  try {
    const { collection, criteria } = req.body;
    
    if (!collection || !criteria) {
      return res.status(400).json({
        success: false,
        message: 'Collection and criteria are required'
      });
    }

    const result = await databaseOptimization.cleanupOldData(collection, criteria);
    
    res.status(200).json({
      success: true,
      message: 'Data cleanup completed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Cleanup old data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old data'
    });
  }
};

// @desc    Get database health status
// @route   GET /api/database/health
// @access  Public
const getDatabaseHealth = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const health = {
      status: connectionState === 1 ? 'healthy' : 'unhealthy',
      connectionState: states[connectionState],
      timestamp: new Date().toISOString()
    };

    // Add cache health if Redis is available
    if (redisCache.isConnected) {
      health.cache = {
        status: 'healthy',
        connected: true
      };
    } else {
      health.cache = {
        status: 'unhealthy',
        connected: false
      };
    }

    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Get database health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database health status'
    });
  }
};

module.exports = {
  getDatabaseMetrics,
  getQueryStats,
  clearQueryStats,
  getCollectionStats,
  analyzeQuery,
  getCacheStats,
  clearCache,
  createIndexes,
  cleanupOldData,
  getDatabaseHealth
};
