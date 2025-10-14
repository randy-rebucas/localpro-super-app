const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  registerAdvertiser,
  createCampaign,
  getCampaigns,
  getActiveAds,
  recordImpression,
  getCampaignAnalytics,
  approveCampaign
} = require('../controllers/adsController');

const router = express.Router();

// Public routes
router.get('/active', getActiveAds);
router.post('/impression', recordImpression);

// Protected routes
router.use(auth);

// Advertiser routes
router.post('/advertisers/register', registerAdvertiser);

// Campaign routes
router.post('/campaigns', createCampaign);
router.get('/campaigns', getCampaigns);
router.get('/campaigns/:id/analytics', getCampaignAnalytics);

// Admin routes
router.put('/campaigns/:id/approve', authorize('admin'), approveCampaign);

module.exports = router;
