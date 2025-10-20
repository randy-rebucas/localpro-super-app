const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const logManagementService = require('../services/logManagementService');
const { logger } = require('../config/logger');

// Get log statistics
router.get('/stats', auth, async (req, res) => {
  try {
    // Only allow admin users to view log statistics
    if (req.user.role !== 'admin') {
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

// Get logs with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    // Only allow admin users to view logs
    if (req.user.role !== 'admin') {
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

// Get log details
router.get('/:logId', auth, async (req, res) => {
  try {
    // Only allow admin users to view log details
    if (req.user.role !== 'admin') {
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

// Get error trends
router.get('/analytics/error-trends', auth, async (req, res) => {
  try {
    // Only allow admin users to view error trends
    if (req.user.role !== 'admin') {
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

// Get performance metrics
router.get('/analytics/performance', auth, async (req, res) => {
  try {
    // Only allow admin users to view performance metrics
    if (req.user.role !== 'admin') {
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

// Get user activity logs
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

// Export logs
router.get('/export/data', auth, async (req, res) => {
  try {
    // Only allow admin users to export logs
    if (req.user.role !== 'admin') {
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

// Get log dashboard summary
router.get('/dashboard/summary', auth, async (req, res) => {
  try {
    // Only allow admin users to view log dashboard
    if (req.user.role !== 'admin') {
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

// Search logs across all collections
router.get('/search/global', auth, async (req, res) => {
  try {
    // Only allow admin users to search logs
    if (req.user.role !== 'admin') {
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

// Clean up expired logs
router.post('/cleanup', auth, async (req, res) => {
  try {
    // Only allow admin users to perform cleanup
    if (req.user.role !== 'admin') {
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

// Flush all logs (admin only)
router.post('/flush', auth, async (req, res) => {
  try {
    // Only allow admin users to flush logs
    if (req.user.role !== 'admin') {
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

// Flush all logs (alternative endpoint for convenience)
router.delete('/flush', auth, async (req, res) => {
  try {
    // Only allow admin users to flush logs
    if (req.user.role !== 'admin') {
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
