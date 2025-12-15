const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const scheduledJobsService = require('../services/scheduledJobsService');
const logger = require('../config/logger');

/**
 * @route   GET /api/scheduled-jobs/status
 * @desc    Get status of all scheduled jobs
 * @access  Private (Admin only)
 */
router.get('/status',
  auth,
  authorize('admin'),
  async (req, res) => {
    try {
      const status = scheduledJobsService.getStatus();
      
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting scheduled jobs status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scheduled jobs status'
      });
    }
  }
);

/**
 * @route   POST /api/scheduled-jobs/historical-metrics/trigger
 * @desc    Manually trigger historical metrics collection
 * @access  Private (Admin only)
 */
router.post('/historical-metrics/trigger',
  auth,
  authorize('admin'),
  async (req, res) => {
    try {
      const { date, providerId } = req.body;
      
      let result;
      if (providerId) {
        // Collect for specific provider
        const historicalMetricsService = require('../services/historicalMetricsService');
        const targetDate = date ? new Date(date) : null;
        result = await historicalMetricsService.collectDailyMetrics(providerId, targetDate);
      } else {
        // Collect for all providers
        result = await scheduledJobsService.triggerHistoricalMetricsCollection(
          date ? new Date(date) : null
        );
      }
      
      res.status(200).json({
        success: true,
        message: 'Historical metrics collection triggered',
        data: result
      });
    } catch (error) {
      logger.error('Error triggering historical metrics collection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger historical metrics collection',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/scheduled-jobs/webhook-cleanup/trigger
 * @desc    Manually trigger webhook event cleanup
 * @access  Private (Admin only)
 */
router.post('/webhook-cleanup/trigger',
  auth,
  authorize('admin'),
  async (req, res) => {
    try {
      const result = await scheduledJobsService.triggerWebhookEventCleanup();
      
      res.status(200).json({
        success: true,
        message: 'Webhook event cleanup triggered',
        data: {
          deletedCount: result.deletedCount
        }
      });
    } catch (error) {
      logger.error('Error triggering webhook cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger webhook cleanup',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/scheduled-jobs/start
 * @desc    Start scheduled jobs service
 * @access  Private (Admin only)
 */
router.post('/start',
  auth,
  authorize('admin'),
  async (req, res) => {
    try {
      scheduledJobsService.start();
      
      res.status(200).json({
        success: true,
        message: 'Scheduled jobs service started',
        data: scheduledJobsService.getStatus()
      });
    } catch (error) {
      logger.error('Error starting scheduled jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start scheduled jobs',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/scheduled-jobs/stop
 * @desc    Stop scheduled jobs service
 * @access  Private (Admin only)
 */
router.post('/stop',
  auth,
  authorize('admin'),
  async (req, res) => {
    try {
      scheduledJobsService.stop();
      
      res.status(200).json({
        success: true,
        message: 'Scheduled jobs service stopped'
      });
    } catch (error) {
      logger.error('Error stopping scheduled jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop scheduled jobs',
        error: error.message
      });
    }
  }
);

module.exports = router;

