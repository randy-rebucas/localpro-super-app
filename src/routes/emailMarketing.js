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
 * @swagger
 * /api/email-marketing/campaigns:
 *   post:
 *     summary: Create a new email campaign
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subject
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               targetAudience:
 *                 type: object
 *     responses:
 *       201:
 *         description: Campaign created
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   get:
 *     summary: Get all campaigns with pagination and filters
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, sending, sent, paused, cancelled]
 *     responses:
 *       200:
 *         description: List of campaigns
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/campaigns', auth, authorize('admin'), emailMarketingController.createCampaign);
router.get('/campaigns', auth, authorize('admin'), emailMarketingController.getCampaigns);

/**
 * @swagger
 * /api/email-marketing/campaigns/estimate-audience:
 *   post:
 *     summary: Estimate audience size for given targeting criteria (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetAudience:
 *                 type: object
 *     responses:
 *       200:
 *         description: Audience estimate
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/campaigns/estimate-audience', auth, authorize('admin'), emailMarketingController.estimateAudience);

/**
 * @swagger
 * /api/email-marketing/campaigns/{id}:
 *   get:
 *     summary: Get single campaign by ID (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Campaign details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   put:
 *     summary: Update campaign (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Campaign updated
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Delete (soft) campaign (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Campaign deleted
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/campaigns/:id', auth, authorize('admin'), emailMarketingController.getCampaign);
router.put('/campaigns/:id', auth, authorize('admin'), emailMarketingController.updateCampaign);
router.delete('/campaigns/:id', auth, authorize('admin'), emailMarketingController.deleteCampaign);

/**
 * @swagger
 * /api/email-marketing/campaigns/{id}/duplicate:
 *   post:
 *     summary: Duplicate a campaign (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       201:
 *         description: Campaign duplicated
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/campaigns/:id/duplicate', auth, authorize('admin'), emailMarketingController.duplicateCampaign);

/**
 * @swagger
 * /api/email-marketing/campaigns/{id}/send:
 *   post:
 *     summary: Send campaign to subscribers (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Campaign sent
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/campaigns/:id/send', auth, authorize('admin'), emailMarketingController.sendCampaign);

/**
 * @swagger
 * /api/email-marketing/campaigns/{id}/pause:
 *   post:
 *     summary: Pause a sending campaign (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Campaign paused
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/campaigns/:id/pause', auth, authorize('admin'), emailMarketingController.pauseCampaign);

/**
 * @swagger
 * /api/email-marketing/campaigns/{id}/resume:
 *   post:
 *     summary: Resume a paused campaign (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Campaign resumed
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/campaigns/:id/resume', auth, authorize('admin'), emailMarketingController.resumeCampaign);

/**
 * @swagger
 * /api/email-marketing/campaigns/{id}/cancel:
 *   post:
 *     summary: Cancel a campaign (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Campaign cancelled
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/campaigns/:id/cancel', auth, authorize('admin'), emailMarketingController.cancelCampaign);

/**
 * @swagger
 * /api/email-marketing/campaigns/{id}/test:
 *   post:
 *     summary: Send test email for a campaign (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testEmail
 *             properties:
 *               testEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Test email sent
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/campaigns/:id/test', auth, authorize('admin'), emailMarketingController.sendTestEmail);

/**
 * @swagger
 * /api/email-marketing/campaigns/{id}/analytics:
 *   get:
 *     summary: Get analytics for a specific campaign (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Campaign analytics
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
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
 * @swagger
 * /api/email-marketing/track/open/{campaignId}/{subscriberId}:
 *   get:
 *     summary: Track email open (returns 1x1 pixel)
 *     tags: [Email Marketing]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *       - in: path
 *         name: subscriberId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Tracking pixel
 *         content:
 *           image/gif:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/track/open/:campaignId/:subscriberId', emailMarketingController.trackOpen);

/**
 * @swagger
 * /api/email-marketing/track/click/{campaignId}/{subscriberId}:
 *   get:
 *     summary: Track link click and redirect
 *     tags: [Email Marketing]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *       - in: path
 *         name: subscriberId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *     responses:
 *       302:
 *         description: Redirect to tracked URL
 */
router.get('/track/click/:campaignId/:subscriberId', emailMarketingController.trackClick);

// ==================== ANALYTICS ROUTES ====================

/**
 * @swagger
 * /api/email-marketing/analytics:
 *   get:
 *     summary: Get overall email marketing analytics (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *     responses:
 *       200:
 *         description: Overall analytics
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/analytics', auth, authorize('admin'), emailMarketingController.getOverallAnalytics);

/**
 * @swagger
 * /api/email-marketing/analytics/top-campaigns:
 *   get:
 *     summary: Get top performing campaigns (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top campaigns
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/analytics/top-campaigns', auth, authorize('admin'), emailMarketingController.getTopCampaigns);

/**
 * @swagger
 * /api/email-marketing/analytics/daily:
 *   get:
 *     summary: Get daily statistics (Admin only)
 *     tags: [Email Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Daily statistics
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/analytics/daily', auth, authorize('admin'), emailMarketingController.getDailyStats);

module.exports = router;

