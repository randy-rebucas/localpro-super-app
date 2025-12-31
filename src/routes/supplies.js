const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getSupplies,
  getSupply,
  createSupply,
  updateSupply,
  patchSupply,
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

/**
 * @swagger
 * /api/supplies:
 *   get:
 *     summary: Get list of supplies/products
 *     tags: [Supplies]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of supplies
 */
// Public routes
router.get('/', getSupplies);
router.get('/products', getSupplies); // Alias for /api/supplies/products
router.get('/products/:id', getSupply); // Alias for /api/supplies/products/:id

/**
 * @swagger
 * /api/supplies/categories:
 *   get:
 *     summary: Get supply categories
 *     tags: [Supplies]
 *     security: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', getSupplyCategories);

/**
 * @swagger
 * /api/supplies/featured:
 *   get:
 *     summary: Get featured supplies
 *     tags: [Supplies]
 *     security: []
 *     responses:
 *       200:
 *         description: Featured supplies
 */
router.get('/featured', getFeaturedSupplies);

/**
 * @swagger
 * /api/supplies/nearby:
 *   get:
 *     summary: Get nearby supplies
 *     tags: [Supplies]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Nearby supplies
 */
router.get('/nearby', getNearbySupplies);

/**
 * @swagger
 * /api/supplies/{id}:
 *   get:
 *     summary: Get supply by ID
 *     tags: [Supplies]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Supply details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id([a-fA-F0-9]{24})', getSupply); // ensure only ObjectId-like values hit this route

// Protected routes
router.use(auth);

// AI-powered routes
router.post('/generate-description', authorize('supplier', 'admin'), generateSupplyDescription);

/**
 * @swagger
 * /api/supplies:
 *   post:
 *     summary: Create a new supply/product
 *     tags: [Supplies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Supply created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Supply management routes
router.post('/', authorize('supplier', 'admin'), createSupply);
router.post('/products', authorize('supplier', 'admin'), createSupply); // Alias for /api/supplies/products

/**
 * @swagger
 * /api/supplies/{id}:
 *   put:
 *     summary: Update supply
 *     tags: [Supplies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Supply updated
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Delete supply
 *     tags: [Supplies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Supply deleted
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/:id', authorize('supplier', 'admin'), updateSupply);
/**
 * @swagger
 * /api/supplies/{id}:
 *   patch:
 *     summary: Partially update supply/product
 *     tags: [Supplies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               pricing:
 *                 type: object
 *               inventory:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Supply partially updated
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch('/:id', authorize('supplier', 'admin'), patchSupply);
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
