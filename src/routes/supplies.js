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
  getSupplyStatistics,
  generateSupplyDescription
} = require('../controllers/suppliesController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

// Public routes
router.get('/', getSupplies);
router.get('/products', getSupplies); // Alias for /api/supplies/products
router.get('/products/:id', getSupply); // Alias for /api/supplies/products/:id
router.get('/categories', getSupplyCategories);
router.get('/featured', getFeaturedSupplies);
router.get('/nearby', getNearbySupplies);
router.get('/:id', getSupply);

// Protected routes
router.use(auth);

// AI-powered routes
router.post('/generate-description', authorize('supplier', 'admin'), generateSupplyDescription);

// Supply management routes
router.post('/', authorize('supplier', 'admin'), createSupply);
router.post('/products', authorize('supplier', 'admin'), createSupply); // Alias for /api/supplies/products
router.put('/:id', authorize('supplier', 'admin'), updateSupply);
router.delete('/:id', authorize('supplier', 'admin'), deleteSupply);

// Image management routes
router.post('/:id/images', authorize('supplier', 'admin'), uploaders.supplies.array('images', 5), uploadSupplyImages);
router.delete('/:id/images/:imageId', authorize('supplier', 'admin'), deleteSupplyImage);

// Order routes
router.post('/:id/order', orderSupply);
router.put('/:id/orders/:orderId/status', updateOrderStatus);

// Review routes
router.post('/:id/reviews', addSupplyReview);

// User-specific routes
router.get('/my-supplies', getMySupplies);
router.get('/my-orders', getMySupplyOrders);

// Statistics route (Admin only) - [ADMIN ONLY]
router.get('/statistics', authorize('admin'), getSupplyStatistics);

module.exports = router;
