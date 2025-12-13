const express = require('express');
const router = express.Router();
const {
  getOptimizationReport,
  getIndexRecommendations,
  createRecommendedIndexes,
  getQueryStats,
  getDatabaseHealth,
  clearQueryCache,
  getCollectionStats,
  analyzeSlowQueries,
  resetPerformanceStats
} = require('../controllers/databaseOptimizationController');
const { auth: protect, authorize } = require('../middleware/auth');

// Apply authentication and authorization to all routes
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/database/optimization/report
 * @desc    Get comprehensive database optimization report
 * @access  Private (Admin only)
 */
router.get('/report', getOptimizationReport);

/**
 * @route   GET /api/database/optimization/recommendations
 * @desc    Get index recommendations for better performance
 * @access  Private (Admin only)
 */
router.get('/recommendations', getIndexRecommendations);

/**
 * @route   POST /api/database/optimization/create-indexes
 * @desc    Create recommended database indexes
 * @access  Private (Admin only)
 */
router.post('/create-indexes', createRecommendedIndexes);

/**
 * @route   GET /api/database/optimization/query-stats
 * @desc    Get query performance statistics
 * @access  Private (Admin only)
 */
router.get('/query-stats', getQueryStats);

/**
 * @route   GET /api/database/optimization/health
 * @desc    Get database health status
 * @access  Private (Admin only)
 */
router.get('/health', getDatabaseHealth);

/**
 * @route   GET /api/database/optimization/collections
 * @desc    Get collection statistics
 * @access  Private (Admin only)
 */
router.get('/collections', getCollectionStats);

/**
 * @route   GET /api/database/optimization/slow-queries
 * @desc    Analyze slow queries and get recommendations
 * @access  Private (Admin only)
 */
router.get('/slow-queries', analyzeSlowQueries);

/**
 * @route   POST /api/database/optimization/clear-cache
 * @desc    Clear query cache
 * @access  Private (Admin only)
 */
router.post('/clear-cache', clearQueryCache);

/**
 * @route   POST /api/database/optimization/reset-stats
 * @desc    Reset performance statistics
 * @access  Private (Admin only)
 */
router.post('/reset-stats', resetPerformanceStats);

/**
 * @route   GET /api/database/optimization/backups
 * @desc    List available database backups
 * @access  Private (Admin only)
 */
router.get('/backups', require('../controllers/databaseOptimizationController').listBackups);

/**
 * @route   POST /api/database/optimization/backup
 * @desc    Trigger database backup
 * @access  Private (Admin only)
 */
router.post('/backup', require('../controllers/databaseOptimizationController').backupDatabase);

/**
 * @route   POST /api/database/optimization/restore
 * @desc    Restore database from backup file
 * @access  Private (Admin only)
 */
router.post('/restore', require('../controllers/databaseOptimizationController').restoreDatabase);

module.exports = router;
