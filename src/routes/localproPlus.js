const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getSubscriptionPlans,
  getSubscriptionPlan,
  subscribeToPlan,
  getUserSubscription,
  cancelSubscription,
  getUserPayments,
  recordFeatureUsage,
  getUsageAnalytics,
  approvePayPalSubscription,
  cancelPayPalSubscription
} = require('../controllers/localproPlusController');

const router = express.Router();

// Public routes
router.get('/plans', getSubscriptionPlans);
router.get('/plans/:id', getSubscriptionPlan);

// Protected routes
router.use(auth);

// Subscription routes
router.post('/subscribe', subscribeToPlan);
router.get('/subscription', getUserSubscription);
router.put('/subscription/cancel', cancelSubscription);

// Payment routes
router.get('/payments', getUserPayments);

// Usage tracking routes
router.post('/usage', recordFeatureUsage);
router.get('/usage/analytics', getUsageAnalytics);

// PayPal routes
router.post('/paypal/approve', approvePayPalSubscription);
router.post('/paypal/cancel', cancelPayPalSubscription);

module.exports = router;
