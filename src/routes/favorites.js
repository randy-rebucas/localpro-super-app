const express = require('express');
const { auth } = require('../middleware/auth');
const {
  addFavorite,
  removeFavorite,
  removeFavoriteByItem,
  getFavorites,
  getFavoriteById,
  checkFavorite,
  updateFavorite,
  getFavoritesByType,
  getFavoritesStats
} = require('../controllers/favoritesController');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/favorites/stats:
 *   get:
 *     summary: Get favorites statistics
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites statistics
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Statistics route (must be before /type/:itemType to avoid conflict)
router.get('/stats', getFavoritesStats);

/**
 * @swagger
 * /api/favorites/check/{itemType}/{itemId}:
 *   get:
 *     summary: Check if item is favorited
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [service, job, course, supply, rental, provider, agency]
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Favorite status
 */
// Check if item is favorited (must be before /:id routes)
router.get('/check/:itemType/:itemId', checkFavorite);

/**
 * @swagger
 * /api/favorites/type/{itemType}:
 *   get:
 *     summary: Get favorites by type
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [service, job, course, supply, rental, provider, agency]
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
 *         description: Favorites by type
 */
// Get favorites by type (must be before /:id routes)
router.get('/type/:itemType', getFavoritesByType);

/**
 * @swagger
 * /api/favorites/{itemType}/{itemId}:
 *   delete:
 *     summary: Remove favorite by item type and ID
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Favorite removed
 */
// Remove favorite by item type and ID (must be before /:id routes)
router.delete('/:itemType/:itemId', removeFavoriteByItem);

/**
 * @swagger
 * /api/favorites/{id}:
 *   get:
 *     summary: Get favorite by ID
 *     tags: [Favorites]
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
 *         description: Favorite details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update favorite
 *     tags: [Favorites]
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
 *         description: Favorite updated
 *   delete:
 *     summary: Remove favorite by ID
 *     tags: [Favorites]
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
 *         description: Favorite removed
 */
// Get favorite by ID
router.get('/:id', getFavoriteById);

// Update favorite
router.put('/:id', updateFavorite);

// Remove favorite by ID
router.delete('/:id', removeFavorite);

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get all favorites
 *     tags: [Favorites]
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
 *         description: List of favorites
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Add favorite
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemType
 *               - itemId
 *             properties:
 *               itemType:
 *                 type: string
 *                 enum: [service, job, course, supply, rental, provider, agency]
 *               itemId:
 *                 type: string
 *                 format: ObjectId
 *     responses:
 *       201:
 *         description: Favorite added
 */
// Get all favorites (must be last to avoid conflicts)
router.get('/', getFavorites);

// Add favorite
router.post('/', addFavorite);

module.exports = router;

