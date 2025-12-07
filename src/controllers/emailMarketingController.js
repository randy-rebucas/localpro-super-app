/**
 * Email Marketing Controller
 * Handles API endpoints for email campaigns, subscribers, and analytics
 */

const EmailMarketingService = require('../services/emailMarketingService');
const EmailCampaign = require('../models/EmailCampaign');
const EmailSubscriber = require('../models/EmailSubscriber');
const { EmailDailyStats } = require('../models/EmailAnalytics');
const logger = require('../config/logger');

// ==================== CAMPAIGN ENDPOINTS ====================

/**
 * @desc    Create a new email campaign
 * @route   POST /api/email-marketing/campaigns
 * @access  Private (Admin)
 */
const createCampaign = async (req, res) => {
  try {
    const result = await EmailMarketingService.createCampaign(req.body, req.user.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create campaign error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get all campaigns
 * @route   GET /api/email-marketing/campaigns
 * @access  Private (Admin)
 */
const getCampaigns = async (req, res) => {
  try {
    const { page, limit, status, type, search, sortBy, sortOrder } = req.query;
    
    const result = await EmailMarketingService.listCampaigns({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      type,
      search,
      sortBy,
      sortOrder
    });
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get campaigns error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get single campaign
 * @route   GET /api/email-marketing/campaigns/:id
 * @access  Private (Admin)
 */
const getCampaign = async (req, res) => {
  try {
    const result = await EmailMarketingService.getCampaign(req.params.id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get campaign error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update campaign
 * @route   PUT /api/email-marketing/campaigns/:id
 * @access  Private (Admin)
 */
const updateCampaign = async (req, res) => {
  try {
    const result = await EmailMarketingService.updateCampaign(req.params.id, req.body, req.user.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Update campaign error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Delete campaign
 * @route   DELETE /api/email-marketing/campaigns/:id
 * @access  Private (Admin)
 */
const deleteCampaign = async (req, res) => {
  try {
    const result = await EmailMarketingService.deleteCampaign(req.params.id, req.user.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Delete campaign error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Duplicate campaign
 * @route   POST /api/email-marketing/campaigns/:id/duplicate
 * @access  Private (Admin)
 */
const duplicateCampaign = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await EmailMarketingService.duplicateCampaign(req.params.id, name);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('Duplicate campaign error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Send campaign
 * @route   POST /api/email-marketing/campaigns/:id/send
 * @access  Private (Admin)
 */
const sendCampaign = async (req, res) => {
  try {
    const result = await EmailMarketingService.sendCampaign(req.params.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Send campaign error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Pause campaign
 * @route   POST /api/email-marketing/campaigns/:id/pause
 * @access  Private (Admin)
 */
const pauseCampaign = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    
    await campaign.pause();
    
    res.status(200).json({ success: true, message: 'Campaign paused', data: campaign });
  } catch (error) {
    logger.error('Pause campaign error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Resume campaign
 * @route   POST /api/email-marketing/campaigns/:id/resume
 * @access  Private (Admin)
 */
const resumeCampaign = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    
    await campaign.resume();
    
    res.status(200).json({ success: true, message: 'Campaign resumed', data: campaign });
  } catch (error) {
    logger.error('Resume campaign error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Cancel campaign
 * @route   POST /api/email-marketing/campaigns/:id/cancel
 * @access  Private (Admin)
 */
const cancelCampaign = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    
    await campaign.cancel();
    
    res.status(200).json({ success: true, message: 'Campaign cancelled', data: campaign });
  } catch (error) {
    logger.error('Cancel campaign error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Estimate campaign audience
 * @route   POST /api/email-marketing/campaigns/estimate-audience
 * @access  Private (Admin)
 */
const estimateAudience = async (req, res) => {
  try {
    const result = await EmailMarketingService.estimateAudience(req.body);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Estimate audience error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Send test email
 * @route   POST /api/email-marketing/campaigns/:id/test
 * @access  Private (Admin)
 */
const sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Test email address required' });
    }
    
    const campaign = await EmailCampaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    
    const EmailService = require('../services/emailService');
    const result = await EmailService.sendEmail(
      email,
      `[TEST] ${campaign.subject}`,
      campaign.content.html
    );
    
    res.status(200).json({
      success: result.success,
      message: result.success ? 'Test email sent' : 'Failed to send test email',
      error: result.error
    });
  } catch (error) {
    logger.error('Send test email error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==================== SUBSCRIBER ENDPOINTS ====================

/**
 * @desc    Subscribe email (public)
 * @route   POST /api/email-marketing/subscribe
 * @access  Public
 */
const subscribe = async (req, res) => {
  try {
    const { email, firstName, lastName, source, preferences, consent } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    
    const result = await EmailMarketingService.subscribe(email, {
      firstName,
      lastName,
      source: source || 'website',
      preferences,
      consent: {
        ...consent,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        consentedAt: new Date()
      }
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('Subscribe error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Confirm subscription (double opt-in)
 * @route   GET /api/email-marketing/confirm/:token
 * @access  Public
 */
const confirmSubscription = async (req, res) => {
  try {
    const result = await EmailMarketingService.confirmSubscription(req.params.token);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Redirect to success page or return JSON
    if (req.query.redirect) {
      return res.redirect(`${process.env.FRONTEND_URL}/subscription-confirmed`);
    }
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Confirm subscription error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Unsubscribe (public via token)
 * @route   GET /api/email-marketing/unsubscribe/:token
 * @access  Public
 */
const unsubscribe = async (req, res) => {
  try {
    const { reason, feedback } = req.query;
    const result = await EmailMarketingService.unsubscribe(req.params.token, reason, feedback);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Redirect to unsubscribe page or return JSON
    if (req.query.redirect !== 'false') {
      return res.redirect(`${process.env.FRONTEND_URL}/unsubscribed`);
    }
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Unsubscribe error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get all subscribers
 * @route   GET /api/email-marketing/subscribers
 * @access  Private (Admin)
 */
const getSubscribers = async (req, res) => {
  try {
    const { page, limit, status, tags, lists, search, sortBy, sortOrder } = req.query;
    
    const result = await EmailMarketingService.listSubscribers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      status,
      tags: tags ? tags.split(',') : undefined,
      lists: lists ? lists.split(',') : undefined,
      search,
      sortBy,
      sortOrder
    });
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get subscribers error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get single subscriber
 * @route   GET /api/email-marketing/subscribers/:id
 * @access  Private (Admin)
 */
const getSubscriber = async (req, res) => {
  try {
    const result = await EmailMarketingService.getSubscriber(req.params.id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get subscriber error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update subscriber
 * @route   PUT /api/email-marketing/subscribers/:id
 * @access  Private (Admin)
 */
const updateSubscriber = async (req, res) => {
  try {
    const subscriber = await EmailSubscriber.findById(req.params.id);
    
    if (!subscriber || subscriber.isDeleted) {
      return res.status(404).json({ success: false, error: 'Subscriber not found' });
    }
    
    const { firstName, lastName, tags, lists, preferences, customFields, notes } = req.body;
    
    if (firstName) subscriber.firstName = firstName;
    if (lastName) subscriber.lastName = lastName;
    if (tags) subscriber.tags = tags;
    if (lists) subscriber.lists = lists;
    if (preferences) Object.assign(subscriber.preferences, preferences);
    if (customFields) subscriber.customFields = new Map(Object.entries(customFields));
    if (notes !== undefined) subscriber.notes = notes;
    
    await subscriber.save();
    
    res.status(200).json({ success: true, data: subscriber });
  } catch (error) {
    logger.error('Update subscriber error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Delete subscriber
 * @route   DELETE /api/email-marketing/subscribers/:id
 * @access  Private (Admin)
 */
const deleteSubscriber = async (req, res) => {
  try {
    const subscriber = await EmailSubscriber.findById(req.params.id);
    
    if (!subscriber) {
      return res.status(404).json({ success: false, error: 'Subscriber not found' });
    }
    
    subscriber.isDeleted = true;
    subscriber.deletedAt = new Date();
    await subscriber.save();
    
    res.status(200).json({ success: true, message: 'Subscriber deleted' });
  } catch (error) {
    logger.error('Delete subscriber error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Import subscribers
 * @route   POST /api/email-marketing/subscribers/import
 * @access  Private (Admin)
 */
const importSubscribers = async (req, res) => {
  try {
    const { subscribers, updateExisting, confirmStatus } = req.body;
    
    if (!subscribers || !Array.isArray(subscribers)) {
      return res.status(400).json({ success: false, error: 'Subscribers array required' });
    }
    
    const result = await EmailMarketingService.importSubscribers(subscribers, {
      updateExisting,
      confirmStatus
    });
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Import subscribers error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Export subscribers
 * @route   GET /api/email-marketing/subscribers/export
 * @access  Private (Admin)
 */
const exportSubscribers = async (req, res) => {
  try {
    const { status, tags, lists, format = 'json' } = req.query;
    
    const query = { isDeleted: false };
    if (status) query.status = status;
    if (tags) query.tags = { $in: tags.split(',') };
    if (lists) query.lists = { $in: lists.split(',') };
    
    const subscribers = await EmailSubscriber.find(query)
      .select('email firstName lastName status subscribedAt tags lists location engagement.engagementScore')
      .lean();
    
    if (format === 'csv') {
      const fields = ['email', 'firstName', 'lastName', 'status', 'subscribedAt', 'tags', 'lists'];
      const csv = [
        fields.join(','),
        ...subscribers.map(s => fields.map(f => {
          let val = s[f];
          if (Array.isArray(val)) val = val.join(';');
          if (val instanceof Date) val = val.toISOString();
          return `"${val || ''}"`;
        }).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
      return res.send(csv);
    }
    
    res.status(200).json({ success: true, data: subscribers });
  } catch (error) {
    logger.error('Export subscribers error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get subscriber stats
 * @route   GET /api/email-marketing/subscribers/stats
 * @access  Private (Admin)
 */
const getSubscriberStats = async (req, res) => {
  try {
    const [stats, engagement, growth] = await Promise.all([
      EmailSubscriber.getSubscriberStats(),
      EmailSubscriber.getEngagementDistribution(),
      // Get growth over last 30 days
      EmailSubscriber.aggregate([
        {
          $match: {
            subscribedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            isDeleted: false
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$subscribedAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        overview: stats,
        engagement,
        growth
      }
    });
  } catch (error) {
    logger.error('Get subscriber stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update subscriber preferences (public via token)
 * @route   PUT /api/email-marketing/preferences/:token
 * @access  Public
 */
const updatePreferences = async (req, res) => {
  try {
    const subscriber = await EmailSubscriber.findByUnsubscribeToken(req.params.token);
    
    if (!subscriber) {
      return res.status(404).json({ success: false, error: 'Invalid token' });
    }
    
    const { preferences, frequency } = req.body;
    
    if (preferences) {
      Object.assign(subscriber.preferences, preferences);
    }
    
    if (frequency) {
      subscriber.frequency = frequency;
    }
    
    await subscriber.save();
    
    res.status(200).json({ success: true, message: 'Preferences updated', data: subscriber.preferences });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==================== TRACKING ENDPOINTS ====================

/**
 * @desc    Track email open (pixel)
 * @route   GET /api/email-marketing/track/open/:campaignId/:subscriberId
 * @access  Public
 */
const trackOpen = async (req, res) => {
  try {
    const { campaignId, subscriberId } = req.params;
    
    // Record open asynchronously
    EmailMarketingService.recordOpen(campaignId, subscriberId, {
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        deviceType: getDeviceType(req.headers['user-agent'])
      },
      location: {
        ip: req.ip
      }
    }).catch(err => logger.error('Track open error:', err));
    
    // Return 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.send(pixel);
  } catch (error) {
    // Always return pixel even on error
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.setHeader('Content-Type', 'image/gif');
    res.send(pixel);
  }
};

/**
 * @desc    Track link click
 * @route   GET /api/email-marketing/track/click/:campaignId/:subscriberId
 * @access  Public
 */
const trackClick = async (req, res) => {
  try {
    const { campaignId, subscriberId } = req.params;
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).send('Missing URL');
    }
    
    const decodedUrl = decodeURIComponent(url);
    
    // Record click asynchronously
    EmailMarketingService.recordClick(campaignId, subscriberId, decodedUrl, {
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        deviceType: getDeviceType(req.headers['user-agent'])
      },
      location: {
        ip: req.ip
      }
    }).catch(err => logger.error('Track click error:', err));
    
    // Redirect to actual URL
    res.redirect(decodedUrl);
  } catch (error) {
    logger.error('Track click error:', error);
    res.status(500).send('Error processing click');
  }
};

// ==================== ANALYTICS ENDPOINTS ====================

/**
 * @desc    Get campaign analytics
 * @route   GET /api/email-marketing/campaigns/:id/analytics
 * @access  Private (Admin)
 */
const getCampaignAnalytics = async (req, res) => {
  try {
    const result = await EmailMarketingService.getCampaignAnalytics(req.params.id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get campaign analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get overall analytics
 * @route   GET /api/email-marketing/analytics
 * @access  Private (Admin)
 */
const getOverallAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const result = await EmailMarketingService.getOverallStats(start, end);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get overall analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get top performing campaigns
 * @route   GET /api/email-marketing/analytics/top-campaigns
 * @access  Private (Admin)
 */
const getTopCampaigns = async (req, res) => {
  try {
    const { limit, metric } = req.query;
    
    const result = await EmailMarketingService.getTopCampaigns(
      parseInt(limit) || 10,
      metric || 'openRate'
    );
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get top campaigns error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get daily stats
 * @route   GET /api/email-marketing/analytics/daily
 * @access  Private (Admin)
 */
const getDailyStats = async (req, res) => {
  try {
    const { startDate, endDate, campaignId } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await EmailDailyStats.getStats(start, end, campaignId);
    
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get daily stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ==================== HELPER FUNCTIONS ====================

function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/desktop|windows|mac|linux/i.test(userAgent)) return 'desktop';
  
  return 'unknown';
}

module.exports = {
  // Campaigns
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  duplicateCampaign,
  sendCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  estimateAudience,
  sendTestEmail,
  
  // Subscribers
  subscribe,
  confirmSubscription,
  unsubscribe,
  getSubscribers,
  getSubscriber,
  updateSubscriber,
  deleteSubscriber,
  importSubscribers,
  exportSubscribers,
  getSubscriberStats,
  updatePreferences,
  
  // Tracking
  trackOpen,
  trackClick,
  
  // Analytics
  getCampaignAnalytics,
  getOverallAnalytics,
  getTopCampaigns,
  getDailyStats
};

