const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getAnalyticsOverview,
  getUserAnalytics,
  getMarketplaceAnalytics,
  getJobAnalytics,
  getReferralAnalytics,
  getAgencyAnalytics,
  trackEvent,
  getCustomAnalytics
} = require('../controllers/analyticsController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Analytics overview
router.get('/overview', getAnalyticsOverview);

// User analytics
router.get('/user', getUserAnalytics);

// Module-specific analytics
router.get('/marketplace', getMarketplaceAnalytics);
router.get('/jobs', getJobAnalytics);
router.get('/referrals', getReferralAnalytics);
router.get('/agencies', getAgencyAnalytics);

// Custom analytics (Admin only)
router.get('/custom', authorize('admin'), getCustomAnalytics);

// Event tracking
router.post('/track', trackEvent);

module.exports = router;