const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getMyReferrals,
  getReferralStats,
  getReferralLinks,
  validateReferralCode,
  trackReferralClick,
  getReferralLeaderboard,
  sendReferralInvitation,
  updateReferralPreferences,
  getReferralRewards,
  processReferralCompletion,
  getReferralAnalytics
} = require('../controllers/referralController');

const router = express.Router();

// Public routes
router.post('/validate', validateReferralCode);
router.post('/track', trackReferralClick);
router.get('/leaderboard', getReferralLeaderboard);

// Protected routes
router.use(auth);

// User referral management
router.get('/me', getMyReferrals);
router.get('/stats', getReferralStats);
router.get('/links', getReferralLinks);
router.get('/rewards', getReferralRewards);
router.post('/invite', sendReferralInvitation);
router.put('/preferences', updateReferralPreferences);

// Admin/System routes - [ADMIN ONLY]
router.post('/process', authorize('admin'), processReferralCompletion);
router.get('/analytics', authorize('admin'), getReferralAnalytics);

module.exports = router;
