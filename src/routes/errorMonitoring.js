const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const errorMonitoringService = require('../services/errorMonitoringService');
const { logger } = require('../utils/logger');

// Public endpoint for basic error monitoring info
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Error monitoring service is available',
    data: {
      service: 'Error Monitoring',
      status: 'active',
      features: [
        'Error Tracking',
        'Performance Monitoring',
        'Alert Management'
      ]
    }
  });
});

// Get error statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    // Only allow admin users to view error stats
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const stats = await errorMonitoringService.getErrorStats(timeframe);
    
    logger.info('Error stats retrieved', {
      userId: req.user.id,
      timeframe,
      statsCount: stats.length
    });

    res.json({
      success: true,
      data: {
        timeframe,
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get error stats', error, {
      userId: req.user.id,
      timeframe: req.query.timeframe
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve error statistics'
    });
  }
});

// Get unresolved errors
router.get('/unresolved', auth, async (req, res) => {
  try {
    // Only allow admin users to view unresolved errors
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { limit = 50 } = req.query;
    const errors = await errorMonitoringService.getUnresolvedErrors(parseInt(limit));
    
    logger.info('Unresolved errors retrieved', {
      userId: req.user.id,
      limit,
      errorCount: errors.length
    });

    res.json({
      success: true,
      data: {
        errors,
        count: errors.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get unresolved errors', error, {
      userId: req.user.id,
      limit: req.query.limit
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve unresolved errors'
    });
  }
});

// Get error details
router.get('/:errorId', auth, async (req, res) => {
  try {
    // Only allow admin users to view error details
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { errorId } = req.params;
    const errorDetails = await errorMonitoringService.getErrorDetails(errorId);
    
    if (!errorDetails) {
      return res.status(404).json({
        success: false,
        message: 'Error not found'
      });
    }

    logger.info('Error details retrieved', {
      userId: req.user.id,
      errorId
    });

    res.json({
      success: true,
      data: errorDetails
    });
  } catch (error) {
    logger.error('Failed to get error details', error, {
      userId: req.user.id,
      errorId: req.params.errorId
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve error details'
    });
  }
});

// Resolve error
router.patch('/:errorId/resolve', auth, async (req, res) => {
  try {
    // Only allow admin users to resolve errors
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { errorId } = req.params;
    const { resolution } = req.body;
    
    if (!resolution) {
      return res.status(400).json({
        success: false,
        message: 'Resolution description is required'
      });
    }

    const resolvedError = await errorMonitoringService.resolveError(
      errorId,
      req.user.id,
      resolution
    );
    
    if (!resolvedError) {
      return res.status(404).json({
        success: false,
        message: 'Error not found'
      });
    }

    logger.info('Error resolved', {
      userId: req.user.id,
      errorId,
      resolution
    });

    res.json({
      success: true,
      message: 'Error resolved successfully',
      data: resolvedError
    });
  } catch (error) {
    logger.error('Failed to resolve error', error, {
      userId: req.user.id,
      errorId: req.params.errorId
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to resolve error'
    });
  }
});

// Get error monitoring dashboard data
router.get('/dashboard/summary', auth, async (req, res) => {
  try {
    // Only allow admin users to view dashboard
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const [stats24h, stats7d, unresolvedErrors] = await Promise.all([
      errorMonitoringService.getErrorStats('24h'),
      errorMonitoringService.getErrorStats('7d'),
      errorMonitoringService.getUnresolvedErrors(10)
    ]);

    const dashboardData = {
      last24Hours: {
        stats: stats24h,
        totalErrors: stats24h.reduce((sum, stat) => sum + stat.totalCount, 0),
        totalOccurrences: stats24h.reduce((sum, stat) => sum + stat.totalOccurrences, 0)
      },
      last7Days: {
        stats: stats7d,
        totalErrors: stats7d.reduce((sum, stat) => sum + stat.totalCount, 0),
        totalOccurrences: stats7d.reduce((sum, stat) => sum + stat.totalOccurrences, 0)
      },
      unresolved: {
        errors: unresolvedErrors,
        count: unresolvedErrors.length
      },
      timestamp: new Date().toISOString()
    };

    logger.info('Error monitoring dashboard data retrieved', {
      userId: req.user.id,
      unresolvedCount: unresolvedErrors.length
    });

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Failed to get dashboard data', error, {
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data'
    });
  }
});

module.exports = router;
