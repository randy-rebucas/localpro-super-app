const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  trackEvent,
  getUserAnalytics,
  getServiceAnalytics,
  getPlatformAnalytics,
  getDashboardData
} = require('../controllers/analyticsController');

// @route   POST /api/analytics/track
// @desc    Track analytics event
// @access  Private
router.post('/track', auth, trackEvent);

// @route   GET /api/analytics/user
// @desc    Get user analytics
// @access  Private
router.get('/user', auth, getUserAnalytics);

// @route   GET /api/analytics/services/:serviceId
// @desc    Get service analytics
// @access  Private
router.get('/services/:serviceId', auth, getServiceAnalytics);

// @route   GET /api/analytics/platform
// @desc    Get platform analytics (Admin only)
// @access  Private (Admin)
router.get('/platform', auth, authorize('admin'), getPlatformAnalytics);

// @route   GET /api/analytics/dashboard
// @desc    Get analytics dashboard data
// @access  Private
router.get('/dashboard', auth, getDashboardData);

module.exports = router;
