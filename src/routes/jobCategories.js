const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { 
  validateObjectIdParam, 
  validatePaginationParams
} = require('../middleware/routeValidation');
const {
  getAllJobCategories,
  getActiveJobCategories,
  getJobCategoryById,
  createJobCategory,
  updateJobCategory,
  deleteJobCategory,
  getJobCategoryStats
} = require('../controllers/jobCategoryController');

const router = express.Router();

// Public routes - Specific routes must come before parameterized routes
router.get('/active', getActiveJobCategories);
router.get('/', 
  validatePaginationParams,
  getAllJobCategories
);

// Parameterized routes
router.get('/:id', 
  validateObjectIdParam('id'),
  getJobCategoryById
);
router.get('/:id/stats', 
  validateObjectIdParam('id'),
  getJobCategoryStats
);

// Protected routes (Admin only)
router.use(auth);

// Admin routes
router.post('/', 
  authorize('admin'), 
  createJobCategory
);
router.put('/:id', 
  authorize('admin'),
  validateObjectIdParam('id'),
  updateJobCategory
);
router.delete('/:id', 
  authorize('admin'),
  validateObjectIdParam('id'),
  deleteJobCategory
);

module.exports = router;

