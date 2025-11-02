const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const {
  handlePayPalWebhook,
  getWebhookEvents
} = require('../controllers/paypalController');

const router = express.Router();

// Webhook route (no auth required - PayPal calls this directly)
// Note: Webhooks typically shouldn't be rate limited, but we apply it for extra security
router.post('/webhook', paymentLimiter, handlePayPalWebhook);

// Admin routes (require authentication)
router.use(auth);

// Webhook events (for debugging/admin purposes) - [ADMIN ONLY]
router.get('/webhook/events', authorize('admin'), getWebhookEvents);

module.exports = router;
