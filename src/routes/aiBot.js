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
const { auth, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

/**
 * @route   POST /api/ai-bot/events
 * @desc    Process an event through AI Bot
 * @access  Private
 */
router.post(
  '/events',
  auth,
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
router.get('/interactions', auth, getInteractions);

/**
 * @route   GET /api/ai-bot/interactions/:eventId
 * @desc    Get interaction by ID
 * @access  Private
 */
router.get('/interactions/:eventId', auth, getInteractionById);

/**
 * @route   GET /api/ai-bot/analytics
 * @desc    Get AI Bot analytics
 * @access  Private (Admin)
 */
router.get('/analytics', auth, authorize('admin'), getAnalytics);

/**
 * @route   POST /api/ai-bot/events/app
 * @desc    Emit app event
 * @access  Private
 */
router.post('/events/app', auth, emitAppEvent);

/**
 * @route   POST /api/ai-bot/events/pos
 * @desc    Emit POS event
 * @access  Private
 */
router.post('/events/pos', auth, emitPOSEvent);

/**
 * @route   POST /api/ai-bot/events/payment
 * @desc    Emit payment event
 * @access  Private
 */
router.post('/events/payment', auth, emitPaymentEvent);

/**
 * @route   POST /api/ai-bot/events/gps
 * @desc    Emit GPS event
 * @access  Private
 */
router.post('/events/gps', auth, emitGPSEvent);

/**
 * @route   POST /api/ai-bot/events/crm
 * @desc    Emit CRM event
 * @access  Private
 */
router.post('/events/crm', auth, emitCRMEvent);

/**
 * @route   GET /api/ai-bot/escalations
 * @desc    Get escalated interactions
 * @access  Private (Admin)
 */
router.get('/escalations', auth, authorize('admin'), getEscalatedInteractions);

/**
 * @route   POST /api/ai-bot/interactions/:eventId/assign
 * @desc    Assign escalated interaction to admin
 * @access  Private (Admin)
 */
router.post('/interactions/:eventId/assign', auth, authorize('admin'), assignEscalation);

/**
 * @route   POST /api/ai-bot/interactions/:eventId/resolve
 * @desc    Resolve escalated interaction
 * @access  Private (Admin)
 */
router.post('/interactions/:eventId/resolve', auth, authorize('admin'), resolveEscalation);

module.exports = router;
