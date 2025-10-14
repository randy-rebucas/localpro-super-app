const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getProducts,
  getProduct,
  createProduct,
  getSubscriptionKits,
  getSubscriptionKit,
  createOrder,
  getOrders,
  updateOrderStatus,
  subscribeToKit
} = require('../controllers/suppliesController');

const router = express.Router();

// Public routes
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.get('/subscription-kits', getSubscriptionKits);
router.get('/subscription-kits/:id', getSubscriptionKit);

// Protected routes
router.use(auth);

// Product routes
router.post('/products', authorize('supplier', 'admin'), createProduct);

// Order routes
router.post('/orders', createOrder);
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Subscription routes
router.post('/subscribe', subscribeToKit);

module.exports = router;
