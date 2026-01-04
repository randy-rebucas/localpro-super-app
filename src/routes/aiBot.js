/**
 * AI Bot Routes
 */

const express = require('express');
const router = express.Router();
const {
  processEvent,
  getInteractions,
  getInteractionById,
  getAnalytics,
  emitAppEvent,
  emitPOSEvent,
  emitPaymentEvent,
  emitGPSEvent,
  emitCRMEvent,
  assignEscalation,
  resolveEscalation,
  getEscalatedInteractions
} = require('../controllers/aiBotController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

/**
 * @route   POST /api/ai-bot/events
 * @desc    Process an event through AI Bot
 * @access  Private
 */
router.post(
  '/events',
  protect,
  [
    body('type').notEmpty().withMessage('Event type is required'),
    body('source').notEmpty().withMessage('Event source is required')
  ],
  processEvent
);

/**
 * @route   GET /api/ai-bot/interactions
 * @desc    Get interaction history
 * @access  Private
 */
router.get('/interactions', protect, getInteractions);

/**
 * @route   GET /api/ai-bot/interactions/:eventId
 * @desc    Get interaction by ID
 * @access  Private
 */
router.get('/interactions/:eventId', protect, getInteractionById);

/**
 * @route   GET /api/ai-bot/analytics
 * @desc    Get AI Bot analytics
 * @access  Private (Admin)
 */
router.get('/analytics', protect, authorize('admin'), getAnalytics);

/**
 * @route   POST /api/ai-bot/events/app
 * @desc    Emit app event
 * @access  Private
 */
router.post('/events/app', protect, emitAppEvent);

/**
 * @route   POST /api/ai-bot/events/pos
 * @desc    Emit POS event
 * @access  Private
 */
router.post('/events/pos', protect, emitPOSEvent);

/**
 * @route   POST /api/ai-bot/events/payment
 * @desc    Emit payment event
 * @access  Private
 */
router.post('/events/payment', protect, emitPaymentEvent);

/**
 * @route   POST /api/ai-bot/events/gps
 * @desc    Emit GPS event
 * @access  Private
 */
router.post('/events/gps', protect, emitGPSEvent);

/**
 * @route   POST /api/ai-bot/events/crm
 * @desc    Emit CRM event
 * @access  Private
 */
router.post('/events/crm', protect, emitCRMEvent);

/**
 * @route   GET /api/ai-bot/escalations
 * @desc    Get escalated interactions
 * @access  Private (Admin)
 */
router.get('/escalations', protect, authorize('admin'), getEscalatedInteractions);

/**
 * @route   POST /api/ai-bot/interactions/:eventId/assign
 * @desc    Assign escalated interaction to admin
 * @access  Private (Admin)
 */
router.post('/interactions/:eventId/assign', protect, authorize('admin'), assignEscalation);

/**
 * @route   POST /api/ai-bot/interactions/:eventId/resolve
 * @desc    Resolve escalated interaction
 * @access  Private (Admin)
 */
router.post('/interactions/:eventId/resolve', protect, authorize('admin'), resolveEscalation);

module.exports = router;
