const webhookService = require('../services/webhookService');
const WebhookSubscription = require('../models/WebhookSubscription');
const logger = require('../config/logger');

/**
 * @desc    Get webhook events for authenticated user
 * @route   GET /api/webhooks/events
 * @access  Private
 */
const getWebhookEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 50,
      eventType = null,
      status = null
    } = req.query;

    const result = await webhookService.getUserEvents(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      eventType,
      status
    });

    res.status(200).json({
      success: true,
      data: result.events,
      pagination: result.pagination,
      unreadCount: await webhookService.getUnreadCount(userId)
    });
  } catch (error) {
    logger.error('Get webhook events error', {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve webhook events',
      error: error.message
    });
  }
};

/**
 * @desc    Get unread webhook event count
 * @route   GET /api/webhooks/events/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await webhookService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: {
        unreadCount: count
      }
    });
  } catch (error) {
    logger.error('Get unread count error', {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

/**
 * @desc    Mark webhook events as read
 * @route   POST /api/webhooks/events/mark-read
 * @access  Private
 */
const markEventsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { eventIds } = req.body;

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'eventIds array is required'
      });
    }

    await webhookService.markEventsAsRead(eventIds, userId);

    res.status(200).json({
      success: true,
      message: 'Events marked as read successfully'
    });
  } catch (error) {
    logger.error('Mark events as read error', {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to mark events as read',
      error: error.message
    });
  }
};

/**
 * @desc    Get webhook subscriptions for authenticated user
 * @route   GET /api/webhooks/subscriptions
 * @access  Private
 */
const getWebhookSubscriptions = async (req, res) => {
  try {
    const userId = req.user._id;

    const subscriptions = await WebhookSubscription.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    logger.error('Get webhook subscriptions error', {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve webhook subscriptions',
      error: error.message
    });
  }
};

/**
 * @desc    Create webhook subscription
 * @route   POST /api/webhooks/subscriptions
 * @access  Private
 */
const createWebhookSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      url,
      eventTypes,
      description,
      contact
    } = req.body;

    // Validation
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL is required'
      });
    }

    if (!eventTypes || !Array.isArray(eventTypes) || eventTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Event types array is required'
      });
    }

    // Validate URL format
    if (!/^https?:\/\/.+/.test(url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format. Must be HTTP or HTTPS URL'
      });
    }

    // Check for duplicate subscriptions
    const existingSubscription = await WebhookSubscription.findOne({
      userId,
      url
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'A subscription already exists for this URL'
      });
    }

    // Create subscription
    const subscription = await WebhookSubscription.create({
      userId,
      url,
      eventTypes,
      description,
      contact
    });

    logger.info('Webhook subscription created', {
      subscriptionId: subscription._id,
      userId,
      url
    });

    res.status(201).json({
      success: true,
      message: 'Webhook subscription created successfully',
      data: subscription
    });
  } catch (error) {
    logger.error('Create webhook subscription error', {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create webhook subscription',
      error: error.message
    });
  }
};

/**
 * @desc    Update webhook subscription
 * @route   PUT /api/webhooks/subscriptions/:id
 * @access  Private
 */
const updateWebhookSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const {
      url,
      eventTypes,
      description,
      contact,
      isActive
    } = req.body;

    const subscription = await WebhookSubscription.findOne({
      _id: id,
      userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Webhook subscription not found'
      });
    }

    // Update fields
    if (url) subscription.url = url;
    if (eventTypes) subscription.eventTypes = eventTypes;
    if (description !== undefined) subscription.description = description;
    if (contact) subscription.contact = contact;
    if (isActive !== undefined) subscription.isActive = isActive;

    await subscription.save();

    logger.info('Webhook subscription updated', {
      subscriptionId: subscription._id,
      userId
    });

    res.status(200).json({
      success: true,
      message: 'Webhook subscription updated successfully',
      data: subscription
    });
  } catch (error) {
    logger.error('Update webhook subscription error', {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update webhook subscription',
      error: error.message
    });
  }
};

/**
 * @desc    Delete webhook subscription
 * @route   DELETE /api/webhooks/subscriptions/:id
 * @access  Private
 */
const deleteWebhookSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const subscription = await WebhookSubscription.findOneAndDelete({
      _id: id,
      userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Webhook subscription not found'
      });
    }

    logger.info('Webhook subscription deleted', {
      subscriptionId: subscription._id,
      userId
    });

    res.status(200).json({
      success: true,
      message: 'Webhook subscription deleted successfully'
    });
  } catch (error) {
    logger.error('Delete webhook subscription error', {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete webhook subscription',
      error: error.message
    });
  }
};

/**
 * @desc    Regenerate webhook subscription secret
 * @route   POST /api/webhooks/subscriptions/:id/regenerate-secret
 * @access  Private
 */
const regenerateWebhookSecret = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const subscription = await WebhookSubscription.findOne({
      _id: id,
      userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Webhook subscription not found'
      });
    }

    await subscription.regenerateSecret();

    logger.info('Webhook secret regenerated', {
      subscriptionId: subscription._id,
      userId
    });

    res.status(200).json({
      success: true,
      message: 'Webhook secret regenerated successfully',
      data: {
        secret: subscription.secret
      }
    });
  } catch (error) {
    logger.error('Regenerate webhook secret error', {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate webhook secret',
      error: error.message
    });
  }
};

/**
 * @desc    Test webhook subscription
 * @route   POST /api/webhooks/subscriptions/:id/test
 * @access  Private
 */
const testWebhookSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const subscription = await WebhookSubscription.findOne({
      _id: id,
      userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Webhook subscription not found'
      });
    }

    // Create a test event
    await webhookService.createEvent(
      'payment.successful',
      userId,
      {
        test: true,
        message: 'This is a test webhook event',
        timestamp: new Date()
      },
      {},
      { source: 'test' }
    );

    logger.info('Test webhook sent', {
      subscriptionId: subscription._id,
      userId
    });

    res.status(200).json({
      success: true,
      message: 'Test webhook sent successfully. Check your endpoint for delivery.'
    });
  } catch (error) {
    logger.error('Test webhook error', {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to send test webhook',
      error: error.message
    });
  }
};

module.exports = {
  getWebhookEvents,
  getUnreadCount,
  markEventsAsRead,
  getWebhookSubscriptions,
  createWebhookSubscription,
  updateWebhookSubscription,
  deleteWebhookSubscription,
  regenerateWebhookSecret,
  testWebhookSubscription
};
