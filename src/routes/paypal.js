const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const {
  handlePayPalWebhook,
  getWebhookEvents
} = require('../controllers/paypalController');

const router = express.Router();

/**
 * @swagger
 * /api/paypal/webhook:
 *   post:
 *     summary: PayPal webhook endpoint
 *     tags: [PayPal]
 *     security: []
 *     description: PayPal calls this endpoint to notify about payment events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
// Webhook route (no auth required - PayPal calls this directly)
// Note: Webhooks typically shouldn't be rate limited, but we apply it for extra security
router.post('/webhook', paymentLimiter, handlePayPalWebhook);

// Admin routes (require authentication)
router.use(auth);

/**
 * @swagger
 * /api/paypal/webhook/events:
 *   get:
 *     summary: Get PayPal webhook events
 *     tags: [PayPal]
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
 *     responses:
 *       200:
 *         description: List of webhook events
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Webhook events (for debugging/admin purposes) - [ADMIN ONLY]
router.get('/webhook/events', authorize('admin'), getWebhookEvents);

module.exports = router;
