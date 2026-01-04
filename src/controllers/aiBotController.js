/**
 * AI Bot Controller
 * 
 * Handles HTTP requests for AI Bot operations
 */

const aiBotService = require('../services/aiBotService');
const aiBotEventListener = require('../services/aiBotEventListener');
const logger = require('../config/logger');
const { validationResult } = require('express-validator');

/**
 * @desc    Process an event through AI Bot
 * @route   POST /api/ai-bot/events
 * @access  Private (or Public with API key)
 */
const processEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { type, source, data, context } = req.body;

    if (!type || !source) {
      return res.status(400).json({
        success: false,
        error: 'Event type and source are required'
      });
    }

    const event = {
      type,
      source,
      data: data || {},
      context: context || {}
    };

    const result = await aiBotService.processEvent(event);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('AI Bot event processing failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process event',
      message: error.message
    });
  }
};

/**
 * @desc    Get interaction history
 * @route   GET /api/ai-bot/interactions
 * @access  Private
 */
const getInteractions = async (req, res) => {
  try {
    const {
      userId,
      bookingId,
      status,
      intent,
      subAgent,
      escalated,
      eventType,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50
    } = req.query;

    const filters = {
      userId,
      bookingId,
      status,
      intent,
      subAgent,
      escalated: escalated === 'true' ? true : escalated === 'false' ? false : undefined,
      eventType,
      dateFrom,
      dateTo,
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit)
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await aiBotService.getInteractionHistory(filters);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to get interactions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get interactions',
      message: error.message
    });
  }
};

/**
 * @desc    Get interaction by ID
 * @route   GET /api/ai-bot/interactions/:eventId
 * @access  Private
 */
const getInteractionById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const interaction = await aiBotService.getInteractionById(eventId);

    if (!interaction) {
      return res.status(404).json({
        success: false,
        error: 'Interaction not found'
      });
    }

    res.status(200).json({
      success: true,
      interaction
    });
  } catch (error) {
    logger.error('Failed to get interaction', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get interaction',
      message: error.message
    });
  }
};

/**
 * @desc    Get AI Bot analytics
 * @route   GET /api/ai-bot/analytics
 * @access  Private
 */
const getAnalytics = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;

    const analytics = await aiBotService.getAnalytics(timeRange);

    res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Failed to get analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      message: error.message
    });
  }
};

/**
 * @desc    Emit app event
 * @route   POST /api/ai-bot/events/app
 * @access  Private
 */
const emitAppEvent = async (req, res) => {
  try {
    const eventData = req.body;

    await aiBotEventListener.listenToAppEvent(eventData);

    res.status(200).json({
      success: true,
      message: 'App event emitted for processing'
    });
  } catch (error) {
    logger.error('Failed to emit app event', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to emit app event',
      message: error.message
    });
  }
};

/**
 * @desc    Emit POS event
 * @route   POST /api/ai-bot/events/pos
 * @access  Private
 */
const emitPOSEvent = async (req, res) => {
  try {
    const eventData = req.body;

    await aiBotEventListener.listenToPOSEvent(eventData);

    res.status(200).json({
      success: true,
      message: 'POS event emitted for processing'
    });
  } catch (error) {
    logger.error('Failed to emit POS event', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to emit POS event',
      message: error.message
    });
  }
};

/**
 * @desc    Emit payment event
 * @route   POST /api/ai-bot/events/payment
 * @access  Private
 */
const emitPaymentEvent = async (req, res) => {
  try {
    const eventData = req.body;

    await aiBotEventListener.listenToPaymentEvent(eventData);

    res.status(200).json({
      success: true,
      message: 'Payment event emitted for processing'
    });
  } catch (error) {
    logger.error('Failed to emit payment event', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to emit payment event',
      message: error.message
    });
  }
};

/**
 * @desc    Emit GPS event
 * @route   POST /api/ai-bot/events/gps
 * @access  Private
 */
const emitGPSEvent = async (req, res) => {
  try {
    const eventData = req.body;

    await aiBotEventListener.listenToGPSEvent(eventData);

    res.status(200).json({
      success: true,
      message: 'GPS event emitted for processing'
    });
  } catch (error) {
    logger.error('Failed to emit GPS event', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to emit GPS event',
      message: error.message
    });
  }
};

/**
 * @desc    Emit CRM event
 * @route   POST /api/ai-bot/events/crm
 * @access  Private
 */
const emitCRMEvent = async (req, res) => {
  try {
    const eventData = req.body;

    await aiBotEventListener.listenToCRMEvent(eventData);

    res.status(200).json({
      success: true,
      message: 'CRM event emitted for processing'
    });
  } catch (error) {
    logger.error('Failed to emit CRM event', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to emit CRM event',
      message: error.message
    });
  }
};

module.exports = {
  processEvent,
  getInteractions,
  getInteractionById,
  getAnalytics,
  emitAppEvent,
  emitPOSEvent,
  emitPaymentEvent,
  emitGPSEvent,
  emitCRMEvent
};
