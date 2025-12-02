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

// Statistics route (must be before /type/:itemType to avoid conflict)
router.get('/stats', getFavoritesStats);

// Check if item is favorited (must be before /:id routes)
router.get('/check/:itemType/:itemId', checkFavorite);

// Get favorites by type (must be before /:id routes)
router.get('/type/:itemType', getFavoritesByType);

// Remove favorite by item type and ID (must be before /:id routes)
router.delete('/:itemType/:itemId', removeFavoriteByItem);

// Get favorite by ID
router.get('/:id', getFavoriteById);

// Update favorite
router.put('/:id', updateFavorite);

// Remove favorite by ID
router.delete('/:id', removeFavorite);

// Get all favorites (must be last to avoid conflicts)
router.get('/', getFavorites);

// Add favorite
router.post('/', addFavorite);

module.exports = router;

