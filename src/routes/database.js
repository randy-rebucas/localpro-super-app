const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getDatabaseMetrics,
  getQueryStats,
  clearQueryStats,
  getCollectionStats,
  analyzeQuery,
  getCacheStats,
  clearCache,
  createIndexes,
  cleanupOldData,
  getDatabaseHealth
} = require('../controllers/databaseController');

const router = express.Router();

// Public routes
router.get('/health', getDatabaseHealth);

// Admin only routes
router.get('/metrics', auth, authorize('admin'), getDatabaseMetrics);
router.get('/query-stats', auth, authorize('admin'), getQueryStats);
router.delete('/query-stats', auth, authorize('admin'), clearQueryStats);
router.get('/collections/:collection/stats', auth, authorize('admin'), getCollectionStats);
router.post('/analyze-query', auth, authorize('admin'), analyzeQuery);
router.get('/cache-stats', auth, authorize('admin'), getCacheStats);
router.delete('/cache', auth, authorize('admin'), clearCache);
router.post('/indexes', auth, authorize('admin'), createIndexes);
router.post('/cleanup', auth, authorize('admin'), cleanupOldData);

module.exports = router;
