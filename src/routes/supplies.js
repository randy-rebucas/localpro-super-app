const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getSupplies,
  getSupply,
  createSupply,
  updateSupply,
  deleteSupply,
  uploadSupplyImages,
  deleteSupplyImage,
  orderSupply,
  updateOrderStatus,
  addSupplyReview,
  getMySupplies,
  getMySupplyOrders,
  getNearbySupplies,
  getSupplyCategories,
  getFeaturedSupplies,
  getSupplyStatistics
} = require('../controllers/suppliesController');

const router = express.Router();

// Public routes
router.get('/', getSupplies);
router.get('/categories', getSupplyCategories);
router.get('/featured', getFeaturedSupplies);
router.get('/nearby', getNearbySupplies);
router.get('/:id', getSupply);

// Protected routes
router.use(auth);

// Supply management routes
router.post('/', authorize('supplier', 'admin'), createSupply);
router.put('/:id', authorize('supplier', 'admin'), updateSupply);
router.delete('/:id', authorize('supplier', 'admin'), deleteSupply);

// Image management routes
router.post('/:id/images', authorize('supplier', 'admin'), uploadSupplyImages);
router.delete('/:id/images/:imageId', authorize('supplier', 'admin'), deleteSupplyImage);

// Order routes
router.post('/:id/order', orderSupply);
router.put('/:id/orders/:orderId/status', updateOrderStatus);

// Review routes
router.post('/:id/reviews', addSupplyReview);

// User-specific routes
router.get('/my-supplies', getMySupplies);
router.get('/my-orders', getMySupplyOrders);

// Statistics route (Admin only)
router.get('/statistics', authorize('admin'), getSupplyStatistics);

module.exports = router;
