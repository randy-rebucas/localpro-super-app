const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../config/logger');

// @desc    Get application metrics
// @route   GET /api/monitoring/metrics
// @access  Private (Admin only)
router.get('/metrics', auth, authorize(['admin']), async(req, res) => {
  try {
    const metrics = monitoringService.getMetrics();

    res.json({
      success: true,
      data: metrics,
      message: 'Metrics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics',
      error: error.message
    });
  }
});

// @desc    Get health status
// @route   GET /api/monitoring/health
// @access  Public
router.get('/health', async(req, res) => {
  try {
    const healthStatus = monitoringService.getHealthStatus();

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: healthStatus.status === 'healthy',
      data: healthStatus,
      message: healthStatus.status === 'healthy'
        ? 'Application is healthy'
        : 'Application has issues'
    });
  } catch (error) {
    logger.error('Error retrieving health status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve health status',
      error: error.message
    });
  }
});

// @desc    Get endpoint performance report
// @route   GET /api/monitoring/performance
// @access  Private (Admin only)
router.get('/performance', auth, authorize(['admin']), async(req, res) => {
  try {
    const performanceReport = monitoringService.getEndpointPerformanceReport();

    res.json({
      success: true,
      data: performanceReport,
      message: 'Performance report retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance report',
      error: error.message
    });
  }
});

// @desc    Reset metrics
// @route   POST /api/monitoring/reset
// @access  Private (Admin only)
router.post('/reset', auth, authorize(['admin']), async(req, res) => {
  try {
    monitoringService.resetMetrics();

    logger.info('Metrics reset by admin', {
      adminId: req.user.id,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    logger.error('Error resetting metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset metrics',
      error: error.message
    });
  }
});

// @desc    Export metrics
// @route   POST /api/monitoring/export
// @access  Private (Admin only)
router.post('/export', auth, authorize(['admin']), async(req, res) => {
  try {
    const success = await monitoringService.exportMetrics();

    if (success) {
      res.json({
        success: true,
        message: 'Metrics exported successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to export metrics'
      });
    }
  } catch (error) {
    logger.error('Error exporting metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export metrics',
      error: error.message
    });
  }
});

// @desc    Get error summary
// @route   GET /api/monitoring/errors
// @access  Private (Admin only)
router.get('/errors', auth, authorize(['admin']), async(req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    const errorSummary = {
      total: metrics.errors.total,
      byType: metrics.errors.byType,
      byEndpoint: metrics.errors.byEndpoint,
      recent: metrics.errors.recent.slice(0, 20) // Last 20 errors
    };

    res.json({
      success: true,
      data: errorSummary,
      message: 'Error summary retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving error summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve error summary',
      error: error.message
    });
  }
});


module.exports = router;
