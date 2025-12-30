const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const errorMonitoringService = require('../services/errorMonitoringService');
const { logger } = require('../utils/logger');

/**
 * @swagger
 * /api/error-monitoring:
 *   get:
 *     summary: Get error monitoring service info
 *     tags: [Monitoring]
 *     security: []
 *     responses:
 *       200:
 *         description: Error monitoring service info
 */
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

/**
 * @swagger
 * /api/error-monitoring/stats:
 *   get:
 *     summary: Get error statistics (Admin only)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *     responses:
 *       200:
 *         description: Error statistics
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Get error statistics - [ADMIN ONLY]
router.get('/stats', auth, async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    // Only allow admin users to view error stats
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
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

// Get unresolved errors - [ADMIN ONLY]
router.get('/unresolved', auth, async (req, res) => {
  try {
    // Only allow admin users to view unresolved errors
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
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

/**
 * @swagger
 * /api/error-monitoring/{errorId}:
 *   get:
 *     summary: Get error details (Admin only)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: errorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Error details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   patch:
 *     summary: Resolve error (Admin only)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: errorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Error resolved
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Delete error (Admin only)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: errorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Error deleted
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Get error details - [ADMIN ONLY]
router.get('/:errorId', auth, async (req, res) => {
  try {
    // Only allow admin users to view error details
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
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

// Resolve error - [ADMIN ONLY]
router.patch('/:errorId/resolve', auth, async (req, res) => {
  try {
    // Only allow admin users to resolve errors
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
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

// Get error monitoring dashboard data - [ADMIN ONLY]
router.get('/dashboard/summary', auth, async (req, res) => {
  try {
    // Only allow admin users to view dashboard
    const userRoles = req.user.roles || [];
    const isAdmin = req.user.hasRole ? req.user.hasRole('admin') : userRoles.includes('admin');
    if (!isAdmin) {
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
