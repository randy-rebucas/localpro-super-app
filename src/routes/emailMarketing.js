/**
 * Email Marketing Routes
 * API endpoints for email campaigns, subscribers, and analytics
 */

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const emailMarketingController = require('../controllers/emailMarketingController');

// ==================== CAMPAIGN ROUTES ====================

/**
 * @route   POST /api/email-marketing/campaigns
 * @desc    Create a new email campaign
 * @access  Private (Admin)
 */
router.post('/campaigns', auth, authorize('admin'), emailMarketingController.createCampaign);

/**
 * @route   GET /api/email-marketing/campaigns
 * @desc    Get all campaigns with pagination and filters
 * @access  Private (Admin)
 */
router.get('/campaigns', auth, authorize('admin'), emailMarketingController.getCampaigns);

/**
 * @route   POST /api/email-marketing/campaigns/estimate-audience
 * @desc    Estimate audience size for given targeting criteria
 * @access  Private (Admin)
 */
router.post('/campaigns/estimate-audience', auth, authorize('admin'), emailMarketingController.estimateAudience);

/**
 * @route   GET /api/email-marketing/campaigns/:id
 * @desc    Get single campaign by ID
 * @access  Private (Admin)
 */
router.get('/campaigns/:id', auth, authorize('admin'), emailMarketingController.getCampaign);

/**
 * @route   PUT /api/email-marketing/campaigns/:id
 * @desc    Update campaign
 * @access  Private (Admin)
 */
router.put('/campaigns/:id', auth, authorize('admin'), emailMarketingController.updateCampaign);

/**
 * @route   DELETE /api/email-marketing/campaigns/:id
 * @desc    Delete (soft) campaign
 * @access  Private (Admin)
 */
router.delete('/campaigns/:id', auth, authorize('admin'), emailMarketingController.deleteCampaign);

/**
 * @route   POST /api/email-marketing/campaigns/:id/duplicate
 * @desc    Duplicate a campaign
 * @access  Private (Admin)
 */
router.post('/campaigns/:id/duplicate', auth, authorize('admin'), emailMarketingController.duplicateCampaign);

/**
 * @route   POST /api/email-marketing/campaigns/:id/send
 * @desc    Send campaign to subscribers
 * @access  Private (Admin)
 */
router.post('/campaigns/:id/send', auth, authorize('admin'), emailMarketingController.sendCampaign);

/**
 * @route   POST /api/email-marketing/campaigns/:id/pause
 * @desc    Pause a sending campaign
 * @access  Private (Admin)
 */
router.post('/campaigns/:id/pause', auth, authorize('admin'), emailMarketingController.pauseCampaign);

/**
 * @route   POST /api/email-marketing/campaigns/:id/resume
 * @desc    Resume a paused campaign
 * @access  Private (Admin)
 */
router.post('/campaigns/:id/resume', auth, authorize('admin'), emailMarketingController.resumeCampaign);

/**
 * @route   POST /api/email-marketing/campaigns/:id/cancel
 * @desc    Cancel a campaign
 * @access  Private (Admin)
 */
router.post('/campaigns/:id/cancel', auth, authorize('admin'), emailMarketingController.cancelCampaign);

/**
 * @route   POST /api/email-marketing/campaigns/:id/test
 * @desc    Send test email for a campaign
 * @access  Private (Admin)
 */
router.post('/campaigns/:id/test', auth, authorize('admin'), emailMarketingController.sendTestEmail);

/**
 * @route   GET /api/email-marketing/campaigns/:id/analytics
 * @desc    Get analytics for a specific campaign
 * @access  Private (Admin)
 */
router.get('/campaigns/:id/analytics', auth, authorize('admin'), emailMarketingController.getCampaignAnalytics);

// ==================== SUBSCRIBER ROUTES ====================

/**
 * @route   POST /api/email-marketing/subscribe
 * @desc    Subscribe a new email (public endpoint)
 * @access  Public
 */
router.post('/subscribe', emailMarketingController.subscribe);

/**
 * @route   GET /api/email-marketing/confirm/:token
 * @desc    Confirm subscription (double opt-in)
 * @access  Public
 */
router.get('/confirm/:token', emailMarketingController.confirmSubscription);

/**
 * @route   GET /api/email-marketing/unsubscribe/:token
 * @desc    Unsubscribe via token
 * @access  Public
 */
router.get('/unsubscribe/:token', emailMarketingController.unsubscribe);

/**
 * @route   PUT /api/email-marketing/preferences/:token
 * @desc    Update email preferences via token
 * @access  Public
 */
router.put('/preferences/:token', emailMarketingController.updatePreferences);

/**
 * @route   GET /api/email-marketing/subscribers
 * @desc    Get all subscribers with filters
 * @access  Private (Admin)
 */
router.get('/subscribers', auth, authorize('admin'), emailMarketingController.getSubscribers);

/**
 * @route   GET /api/email-marketing/subscribers/stats
 * @desc    Get subscriber statistics
 * @access  Private (Admin)
 */
router.get('/subscribers/stats', auth, authorize('admin'), emailMarketingController.getSubscriberStats);

/**
 * @route   GET /api/email-marketing/subscribers/export
 * @desc    Export subscribers to CSV or JSON
 * @access  Private (Admin)
 */
router.get('/subscribers/export', auth, authorize('admin'), emailMarketingController.exportSubscribers);

/**
 * @route   POST /api/email-marketing/subscribers/import
 * @desc    Import subscribers from array
 * @access  Private (Admin)
 */
router.post('/subscribers/import', auth, authorize('admin'), emailMarketingController.importSubscribers);

/**
 * @route   GET /api/email-marketing/subscribers/:id
 * @desc    Get single subscriber
 * @access  Private (Admin)
 */
router.get('/subscribers/:id', auth, authorize('admin'), emailMarketingController.getSubscriber);

/**
 * @route   PUT /api/email-marketing/subscribers/:id
 * @desc    Update subscriber
 * @access  Private (Admin)
 */
router.put('/subscribers/:id', auth, authorize('admin'), emailMarketingController.updateSubscriber);

/**
 * @route   DELETE /api/email-marketing/subscribers/:id
 * @desc    Delete subscriber
 * @access  Private (Admin)
 */
router.delete('/subscribers/:id', auth, authorize('admin'), emailMarketingController.deleteSubscriber);

// ==================== TRACKING ROUTES ====================

/**
 * @route   GET /api/email-marketing/track/open/:campaignId/:subscriberId
 * @desc    Track email open (returns 1x1 pixel)
 * @access  Public
 */
router.get('/track/open/:campaignId/:subscriberId', emailMarketingController.trackOpen);

/**
 * @route   GET /api/email-marketing/track/click/:campaignId/:subscriberId
 * @desc    Track link click and redirect
 * @access  Public
 */
router.get('/track/click/:campaignId/:subscriberId', emailMarketingController.trackClick);

// ==================== ANALYTICS ROUTES ====================

/**
 * @route   GET /api/email-marketing/analytics
 * @desc    Get overall email marketing analytics
 * @access  Private (Admin)
 */
router.get('/analytics', auth, authorize('admin'), emailMarketingController.getOverallAnalytics);

/**
 * @route   GET /api/email-marketing/analytics/top-campaigns
 * @desc    Get top performing campaigns
 * @access  Private (Admin)
 */
router.get('/analytics/top-campaigns', auth, authorize('admin'), emailMarketingController.getTopCampaigns);

/**
 * @route   GET /api/email-marketing/analytics/daily
 * @desc    Get daily statistics
 * @access  Private (Admin)
 */
router.get('/analytics/daily', auth, authorize('admin'), emailMarketingController.getDailyStats);

module.exports = router;

