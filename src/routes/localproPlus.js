const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  subscribeToPlan,
  confirmSubscriptionPayment,
  cancelSubscription,
  getMySubscription,
  updateSubscriptionSettings,
  getSubscriptionUsage,
  renewSubscription,
  getSubscriptionAnalytics
} = require('../controllers/localproPlusController');

const router = express.Router();

// Public routes
router.get('/plans', getPlans);
router.get('/plans/:id', getPlan);

// Protected routes
router.use(auth);

// Plan management routes (Admin only) - [ADMIN ONLY]
router.post('/plans', authorize('admin'), createPlan);
router.put('/plans/:id', authorize('admin'), updatePlan);
router.delete('/plans/:id', authorize('admin'), deletePlan);

// Subscription routes
router.post('/subscribe/:planId', subscribeToPlan);
router.post('/confirm-payment', confirmSubscriptionPayment);
router.post('/cancel', cancelSubscription);
router.post('/renew', renewSubscription);

// User subscription management
router.get('/my-subscription', getMySubscription);
router.put('/settings', updateSubscriptionSettings);
router.get('/usage', getSubscriptionUsage);

// Analytics routes (Admin only) - [ADMIN ONLY]
router.get('/analytics', authorize('admin'), getSubscriptionAnalytics);

module.exports = router;