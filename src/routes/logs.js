const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const logManagementService = require('../services/logManagementService');
const loggerService = require('../services/loggerService');
const logger = require('../config/logger');

// Helper to check admin access
const isAdmin = (req) => {
  const userRoles = req.user.roles || [];
  return req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// ==================== Runtime Log Level Management ====================

/**
 * @route GET /api/logs/config
 * @desc Get current logger configuration
 * @access Admin
 */
router.get('/config', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const config = {
      defaultLevel: loggerService.defaultLevel,
      levels: loggerService.levels,
      overrides: loggerService.getLogLevelOverrides(),
      metrics: loggerService.getMetrics()
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Failed to get logger config', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve logger configuration'
    });
  }
});

/**
 * @route PUT /api/logs/config/level
 * @desc Set global log level
 * @access Admin
 */
router.put('/config/level',
  auth,
  body('level').isIn(['error', 'warn', 'info', 'http', 'debug']).withMessage('Invalid log level'),
  handleValidationErrors,
  async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const { level } = req.body;
      const previousLevel = loggerService.defaultLevel;
      loggerService.setDefaultLogLevel(level);

      logger.info('Global log level changed', {
        userId: req.user.id,
        previousLevel,
        newLevel: level
      });

      res.json({
        success: true,
        message: `Log level changed from ${previousLevel} to ${level}`,
        data: {
          previousLevel,
          currentLevel: level
        }
      });
    } catch (error) {
      logger.error('Failed to set log level', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set log level'
      });
    }
  }
);

/**
 * @route PUT /api/logs/config/override
 * @desc Set log level override for specific module/context
 * @access Admin
 */
router.put('/config/override',
  auth,
  body('context').notEmpty().withMessage('Context is required'),
  body('level').isIn(['error', 'warn', 'info', 'http', 'debug']).withMessage('Invalid log level'),
  handleValidationErrors,
  async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const { context, level } = req.body;
      loggerService.setLogLevelOverride(context, level);

      logger.info('Log level override set', {
        userId: req.user.id,
        context,
        level
      });

      res.json({
        success: true,
        message: `Log level override set for ${context}`,
        data: {
          context,
          level,
          overrides: loggerService.getLogLevelOverrides()
        }
      });
    } catch (error) {
      logger.error('Failed to set log level override', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set log level override'
      });
    }
  }
);

/**
 * @route DELETE /api/logs/config/override/:context
 * @desc Remove log level override for specific module/context
 * @access Admin
 */
router.delete('/config/override/:context',
  auth,
  param('context').notEmpty().withMessage('Context is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const { context } = req.params;
      loggerService.removeLogLevelOverride(context);

      logger.info('Log level override removed', {
        userId: req.user.id,
        context
      });

      res.json({
        success: true,
        message: `Log level override removed for ${context}`,
        data: {
          overrides: loggerService.getLogLevelOverrides()
        }
      });
    } catch (error) {
      logger.error('Failed to remove log level override', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove log level override'
      });
    }
  }
);

/**
 * @route GET /api/logs/metrics
 * @desc Get real-time log metrics
 * @access Admin
 */
router.get('/metrics', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const metrics = loggerService.getMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get log metrics', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve log metrics'
    });
  }
});

/**
 * @route POST /api/logs/metrics/reset
 * @desc Reset log metrics
 * @access Admin
 */
router.post('/metrics/reset', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    loggerService.resetMetrics();

    logger.info('Log metrics reset', { userId: req.user.id });

    res.json({
      success: true,
      message: 'Log metrics have been reset',
      data: loggerService.getMetrics()
    });
  } catch (error) {
    logger.error('Failed to reset log metrics', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset log metrics'
    });
  }
});

/**
 * @route GET /api/logs/correlation/:correlationId
 * @desc Get all logs by correlation ID (for distributed tracing)
 * @access Admin
 */
router.get('/correlation/:correlationId',
  auth,
  param('correlationId').notEmpty().withMessage('Correlation ID is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const { correlationId } = req.params;
      const logs = await loggerService.getLogsByCorrelation(correlationId);

      res.json({
        success: true,
        data: {
          correlationId,
          logs,
          count: logs.length
        }
      });
    } catch (error) {
      logger.error('Failed to get logs by correlation ID', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve logs by correlation ID'
      });
    }
  }
);

/**
 * @route GET /api/logs/errors/summary
 * @desc Get error summary with grouping
 * @access Admin
 */
router.get('/errors/summary',
  auth,
  query('timeframe').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid timeframe'),
  handleValidationErrors,
  async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const { timeframe = '24h' } = req.query;
      const summary = await loggerService.getErrorSummary(timeframe);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Failed to get error summary', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve error summary'
      });
    }
  }
);

/**
 * @route GET /api/logs/statistics
 * @desc Get comprehensive log statistics
 * @access Admin
 */
router.get('/statistics',
  auth,
  query('timeframe').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid timeframe'),
  handleValidationErrors,
  async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const { timeframe = '24h' } = req.query;
      const statistics = await loggerService.getLogStatistics(timeframe);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Failed to get log statistics', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve log statistics'
      });
    }
  }
);

/**
 * @route GET /api/logs/slow-operations
 * @desc Get slow operations
 * @access Admin
 */
router.get('/slow-operations',
  auth,
  query('threshold').optional().isInt({ min: 100 }).withMessage('Threshold must be at least 100ms'),
  query('timeframe').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid timeframe'),
  handleValidationErrors,
  async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const { threshold = 1000, timeframe = '24h' } = req.query;
      const slowOps = await loggerService.getSlowOperations(parseInt(threshold), timeframe);

      res.json({
        success: true,
        data: {
          threshold: parseInt(threshold),
          timeframe,
          operations: slowOps,
          count: slowOps.length
        }
      });
    } catch (error) {
      logger.error('Failed to get slow operations', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve slow operations'
      });
    }
  }
);

/**
 * @route GET /api/logs/query
 * @desc Query logs with advanced filters
 * @access Admin
 */
router.get('/query',
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
  async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      const {
        level,
        category,
        startDate,
        endDate,
        correlationId,
        userId,
        search,
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query;

      const result = await loggerService.queryLogs(
        { level, category, startDate, endDate, correlationId, userId, search },
        { page: parseInt(page), limit: parseInt(limit), sortBy, sortOrder }
      );

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to query logs', error);
      res.status(500).json({
        success: false,
        message: 'Failed to query logs'
      });
    }
  }
);

// ==================== Original Log Management Routes ====================

// Get log statistics - [ADMIN ONLY]
router.get('/stats', auth, async (req, res) => {
  try {
    // Only allow admin users to view log statistics
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { timeframe = '24h' } = req.query;
    const stats = await logManagementService.getLogStatistics(timeframe);

    logger.info('Log statistics retrieved', {
      userId: req.user.id,
      timeframe,
      totalLogs: stats.summary.totalLogs
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get log statistics', error, {
      userId: req.user.id,
      timeframe: req.query.timeframe
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve log statistics'
    });
  }
});

// Get logs with filtering and pagination - [ADMIN ONLY]
router.get('/', auth, async (req, res) => {
  try {
    // Only allow admin users to view logs
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const {
      level,
      category,
      source,
      startDate,
      endDate,
      userId,
      url,
      method,
      statusCode,
      search,
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      level,
      category,
      source,
      startDate,
      endDate,
      userId,
      url,
      method,
      statusCode,
      search
    };

    const pagination = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Max 100 per page
      sortBy,
      sortOrder
    };

    const result = await logManagementService.getLogs(filters, pagination);

    logger.info('Logs retrieved', {
      userId: req.user.id,
      filters,
      resultCount: result.logs.length,
      totalCount: result.pagination.total
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Failed to get logs', error, {
      userId: req.user.id,
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs'
    });
  }
});

// Get log details - [ADMIN ONLY]
router.get('/:logId', auth, async (req, res) => {
  try {
    // Only allow admin users to view log details
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { logId } = req.params;
    const log = await logManagementService.getLogDetails(logId);

    logger.info('Log details retrieved', {
      userId: req.user.id,
      logId
    });

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    logger.error('Failed to get log details', error, {
      userId: req.user.id,
      logId: req.params.logId
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve log details'
    });
  }
});

// Get error trends - [ADMIN ONLY]
router.get('/analytics/error-trends', auth, async (req, res) => {
  try {
    // Only allow admin users to view error trends
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { timeframe = '7d' } = req.query;
    const trends = await logManagementService.getErrorTrends(timeframe);

    logger.info('Error trends retrieved', {
      userId: req.user.id,
      timeframe,
      trendCount: trends.length
    });

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Failed to get error trends', error, {
      userId: req.user.id,
      timeframe: req.query.timeframe
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve error trends'
    });
  }
});

// Get performance metrics - [ADMIN ONLY]
router.get('/analytics/performance', auth, async (req, res) => {
  try {
    // Only allow admin users to view performance metrics
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { timeframe = '24h' } = req.query;
    const metrics = await logManagementService.getPerformanceMetrics(timeframe);

    logger.info('Performance metrics retrieved', {
      userId: req.user.id,
      timeframe,
      metricCount: metrics.length
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get performance metrics', error, {
      userId: req.user.id,
      timeframe: req.query.timeframe
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance metrics'
    });
  }
});

// Get user activity logs - [ADMIN ONLY]
router.get('/user/:userId/activity', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = '7d' } = req.query;

    // Users can only view their own activity, admins can view any user's activity
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own activity.'
      });
    }

    const activity = await logManagementService.getUserActivityLogs(userId, timeframe);

    logger.info('User activity logs retrieved', {
      requestedBy: req.user.id,
      targetUserId: userId,
      timeframe,
      activityCount: activity.length
    });

    res.json({
      success: true,
      data: {
        userId,
        timeframe,
        activity
      }
    });
  } catch (error) {
    logger.error('Failed to get user activity logs', error, {
      userId: req.user.id,
      targetUserId: req.params.userId,
      timeframe: req.query.timeframe
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activity logs'
    });
  }
});

// Export logs - [ADMIN ONLY]
router.get('/export/data', auth, async (req, res) => {
  try {
    // Only allow admin users to export logs
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const {
      level,
      category,
      source,
      startDate,
      endDate,
      userId,
      url,
      method,
      statusCode,
      search,
      format = 'json'
    } = req.query;

    const filters = {
      level,
      category,
      source,
      startDate,
      endDate,
      userId,
      url,
      method,
      statusCode,
      search
    };

    const exportData = await logManagementService.exportLogs(filters, format);

    logger.info('Logs exported', {
      userId: req.user.id,
      filters,
      format,
      recordCount: Array.isArray(exportData) ? exportData.length : 'CSV format'
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: exportData,
        filters,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Failed to export logs', error, {
      userId: req.user.id,
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to export logs'
    });
  }
});

// Get log dashboard summary - [ADMIN ONLY]
router.get('/dashboard/summary', auth, async (req, res) => {
  try {
    // Only allow admin users to view log dashboard
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const summary = await logManagementService.getLogDashboardSummary();

    logger.info('Log dashboard summary retrieved', {
      userId: req.user.id,
      totalLogs: summary.recentLogs.length,
      errors24h: summary.statistics.errors24h
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Failed to get log dashboard summary', error, {
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve log dashboard summary'
    });
  }
});

// Search logs across all collections - [ADMIN ONLY]
router.get('/search/global', auth, async (req, res) => {
  try {
    // Only allow admin users to search logs
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { q: query, timeframe = '7d' } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await logManagementService.searchLogs(query, timeframe);

    logger.info('Global log search performed', {
      userId: req.user.id,
      query,
      timeframe,
      totalResults: results.totalResults
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Failed to search logs', error, {
      userId: req.user.id,
      query: req.query.q,
      timeframe: req.query.timeframe
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to search logs'
    });
  }
});

// Clean up expired logs - [ADMIN ONLY]
router.post('/cleanup', auth, async (req, res) => {
  try {
    // Only allow admin users to perform cleanup
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const cleanupResult = await logManagementService.cleanupExpiredLogs();

    logger.info('Log cleanup performed', {
      userId: req.user.id,
      totalDeleted: cleanupResult.totalDeleted
    });

    res.json({
      success: true,
      message: 'Log cleanup completed',
      data: cleanupResult
    });
  } catch (error) {
    logger.error('Failed to perform log cleanup', error, {
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to perform log cleanup'
    });
  }
});

// Flush all logs (admin only) - [ADMIN ONLY]
router.post('/flush', auth, async (req, res) => {
  try {
    // Only allow admin users to flush logs
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { type = 'all' } = req.body; // 'all', 'database', or 'files'

    // Validate type parameter
    if (!['all', 'database', 'files'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "all", "database", or "files".'
      });
    }

    let flushResult;
    if (type === 'all') {
      flushResult = await logManagementService.flushAllLogs();
    } else {
      flushResult = await logManagementService.flushLogsByType(type);
    }

    logger.info('Log flush performed', {
      userId: req.user.id,
      type,
      deletedFromDB: flushResult.deletedFromDB,
      deletedFiles: flushResult.deletedFiles,
      logsDirFiles: flushResult.logsDirFiles || 0,
      routesLogsDirFiles: flushResult.routesLogsDirFiles || 0
    });

    res.json({
      success: true,
      message: `Log flush completed successfully`,
      data: {
        type,
        deletedFromDB: flushResult.deletedFromDB,
        deletedFiles: flushResult.deletedFiles,
        logsDirFiles: flushResult.logsDirFiles || 0,
        routesLogsDirFiles: flushResult.routesLogsDirFiles || 0,
        timestamp: flushResult.timestamp
      }
    });
  } catch (error) {
    logger.error('Failed to flush logs', error, {
      userId: req.user.id,
      type: req.body.type
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to flush logs'
    });
  }
});

// Flush all logs (alternative endpoint for convenience) - [ADMIN ONLY]
router.delete('/flush', auth, async (req, res) => {
  try {
    // Only allow admin users to flush logs
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const flushResult = await logManagementService.flushAllLogs();

    logger.info('Log flush performed via DELETE', {
      userId: req.user.id,
      deletedFromDB: flushResult.deletedFromDB,
      deletedFiles: flushResult.deletedFiles,
      logsDirFiles: flushResult.logsDirFiles || 0,
      routesLogsDirFiles: flushResult.routesLogsDirFiles || 0
    });

    res.json({
      success: true,
      message: 'All logs flushed successfully',
      data: {
        deletedFromDB: flushResult.deletedFromDB,
        deletedFiles: flushResult.deletedFiles,
        logsDirFiles: flushResult.logsDirFiles || 0,
        routesLogsDirFiles: flushResult.routesLogsDirFiles || 0,
        timestamp: flushResult.timestamp
      }
    });
  } catch (error) {
    logger.error('Failed to flush logs via DELETE', error, {
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to flush logs'
    });
  }
});

module.exports = router;
