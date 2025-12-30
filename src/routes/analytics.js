const express = require('express');
const { query, param } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const {
  getAnalyticsOverview,
  getUserAnalytics,
  getCurrentUserAnalytics,
  getMarketplaceAnalytics,
  getJobAnalytics,
  getReferralAnalytics,
  getAgencyAnalytics,
  trackEvent,
  getCustomAnalytics,
  getDashboardAnalytics,
  getProviderAnalytics,
  getFinancialAnalytics,
  getTimeSeriesData,
  getRealTimeMetrics,
  exportAnalytics,
  getComparisonAnalytics,
  getAnalyticsMetadata
} = require('../controllers/analyticsController');

const router = express.Router();

// Validation middleware
const timeframeValidation = [
  query('timeframe')
    .optional()
    .isIn(['1h', '24h', '7d', '30d', '90d', '1y'])
    .withMessage('Invalid timeframe. Must be one of: 1h, 24h, 7d, 30d, 90d, 1y')
];

const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
];

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/analytics/metadata:
 *   get:
 *     summary: Get analytics metadata (available metrics, timeframes, etc.)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics metadata
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/metadata', getAnalyticsMetadata);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard analytics summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 1y]
 *     responses:
 *       200:
 *         description: Dashboard analytics
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/dashboard', authorize(['admin']), timeframeValidation, getDashboardAnalytics);

/**
 * @swagger
 * /api/analytics/realtime:
 *   get:
 *     summary: Get real-time metrics (last hour activity)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time metrics
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/realtime', authorize(['admin']), getRealTimeMetrics);

/**
 * @route   GET /api/analytics/time-series
 * @desc    Get time series data for charts
 * @access  Private (Admin)
 * @query   metric (users, bookings, revenue, services, jobs)
 * @query   timeframe (1h, 24h, 7d, 30d, 90d, 1y)
 * @query   granularity (hourly, daily, weekly, monthly)
 */
router.get('/time-series', authorize(['admin']), [
  query('metric')
    .optional()
    .isIn(['users', 'bookings', 'revenue', 'services', 'jobs'])
    .withMessage('Invalid metric'),
  query('granularity')
    .optional()
    .isIn(['hourly', 'daily', 'weekly', 'monthly'])
    .withMessage('Invalid granularity'),
  ...timeframeValidation
], getTimeSeriesData);

/**
 * @route   GET /api/analytics/comparison
 * @desc    Get comparison analytics (current vs previous period)
 * @access  Private (Admin)
 * @query   timeframe
 */
router.get('/comparison', authorize(['admin']), timeframeValidation, getComparisonAnalytics);

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data (JSON or CSV)
 * @access  Private (Admin)
 * @query   type (overview, users, revenue, bookings)
 * @query   timeframe
 * @query   format (json, csv)
 */
router.get('/export', authorize(['admin']), [
  query('type')
    .optional()
    .isIn(['overview', 'users', 'revenue', 'bookings'])
    .withMessage('Invalid export type'),
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Invalid format'),
  ...timeframeValidation
], exportAnalytics);

/**
 * @route   GET /api/analytics/overview
 * @desc    Get analytics overview
 * @access  Private (Admin)
 * @query   startDate, endDate
 */
router.get('/overview', authorize(['admin']), dateRangeValidation, getAnalyticsOverview);

/**
 * @swagger
 * /api/analytics/user:
 *   get:
 *     summary: Get current user's analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 1y]
 *     responses:
 *       200:
 *         description: User analytics
 */
router.get('/user', timeframeValidation, getCurrentUserAnalytics);

/**
 * @route   GET /api/analytics/users
 * @desc    Get user analytics (all users)
 * @access  Private (Admin)
 * @query   startDate, endDate
 */
router.get('/users', authorize(['admin']), dateRangeValidation, getUserAnalytics);

/**
 * @route   GET /api/analytics/financial
 * @desc    Get financial analytics (revenue, payments, etc.)
 * @access  Private (Admin)
 * @query   timeframe
 */
router.get('/financial', authorize(['admin']), timeframeValidation, getFinancialAnalytics);

/**
 * @route   GET /api/analytics/marketplace
 * @desc    Get marketplace analytics
 * @access  Private (Admin)
 * @query   startDate, endDate
 */
router.get('/marketplace', authorize(['admin']), dateRangeValidation, getMarketplaceAnalytics);

/**
 * @route   GET /api/analytics/jobs
 * @desc    Get job board analytics
 * @access  Private (Admin)
 * @query   startDate, endDate
 */
router.get('/jobs', authorize(['admin']), dateRangeValidation, getJobAnalytics);

/**
 * @route   GET /api/analytics/referrals
 * @desc    Get referral analytics
 * @access  Private (Admin)
 * @query   startDate, endDate
 */
router.get('/referrals', authorize(['admin']), dateRangeValidation, getReferralAnalytics);

/**
 * @route   GET /api/analytics/agencies
 * @desc    Get agency analytics
 * @access  Private (Admin)
 * @query   startDate, endDate
 */
router.get('/agencies', authorize(['admin']), dateRangeValidation, getAgencyAnalytics);

/**
 * @route   GET /api/analytics/provider
 * @desc    Get current user's provider analytics
 * @access  Private (Provider)
 * @query   timeframe
 */
router.get('/provider', authorize(['provider', 'admin']), timeframeValidation, getProviderAnalytics);

/**
 * @route   GET /api/analytics/provider/:providerId
 * @desc    Get specific provider's analytics
 * @access  Private (Admin or the provider themselves)
 * @param   providerId - Provider user ID
 * @query   timeframe
 */
router.get('/provider/:providerId', [
  param('providerId')
    .isMongoId()
    .withMessage('Invalid provider ID'),
  ...timeframeValidation
], getProviderAnalytics);

/**
 * @route   GET /api/analytics/custom
 * @desc    Get custom analytics (event-based)
 * @access  Private (Admin)
 * @query   eventType, module, startDate, endDate
 */
router.get('/custom', authorize(['admin']), [
  query('eventType')
    .optional()
    .isString()
    .withMessage('Event type must be a string'),
  query('module')
    .optional()
    .isString()
    .withMessage('Module must be a string'),
  ...dateRangeValidation
], getCustomAnalytics);

/**
 * @route   POST /api/analytics/track
 * @desc    Track a custom analytics event
 * @access  Private
 * @body    eventType, module, data
 */
router.post('/track', trackEvent);

module.exports = router;
