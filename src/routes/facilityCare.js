const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getServices,
  getService,
  createService,
  createContract,
  getContracts,
  createSubscription,
  getSubscriptions,
  updateSubscriptionStatus
} = require('../controllers/facilityCareController');

const router = express.Router();

// Public routes
router.get('/services', getServices);
router.get('/services/:id', getService);

// Protected routes
router.use(auth);

// Service routes
router.post('/services', authorize('provider', 'admin'), createService);

// Contract routes
router.post('/contracts', createContract);
router.get('/contracts', getContracts);

// Subscription routes
router.post('/subscribe', createSubscription);
router.get('/subscriptions', getSubscriptions);
router.put('/subscriptions/:id/status', updateSubscriptionStatus);

module.exports = router;
