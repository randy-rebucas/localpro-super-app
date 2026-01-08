const express = require('express');
const router = express.Router();
const {
  getWebhookEvents,
  getUnreadCount,
  markEventsAsRead,
  getWebhookSubscriptions,
  createWebhookSubscription,
  updateWebhookSubscription,
  deleteWebhookSubscription,
  regenerateWebhookSecret,
  testWebhookSubscription
} = require('../controllers/webhookController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Webhook Events Routes
router.get('/events', getWebhookEvents);
router.get('/events/unread-count', getUnreadCount);
router.post('/events/mark-read', markEventsAsRead);

// Webhook Subscriptions Routes
router.get('/subscriptions', getWebhookSubscriptions);
router.post('/subscriptions', createWebhookSubscription);
router.put('/subscriptions/:id', updateWebhookSubscription);
router.delete('/subscriptions/:id', deleteWebhookSubscription);
router.post('/subscriptions/:id/regenerate-secret', regenerateWebhookSecret);
router.post('/subscriptions/:id/test', testWebhookSubscription);

module.exports = router;
