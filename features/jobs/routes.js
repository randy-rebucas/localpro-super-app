// Jobs feature routes (migrated)
const express = require('express');
const { auth, authorize } = require('../../middleware/auth');
const {
  validateObjectIdParam,
  validatePaginationParams,
  validateSearchParams,
  validateFileUpload
} = require('../../middleware/routeValidation');
const jobController = require('./controller');
const { uploaders } = require('../../config/cloudinary');

const router = express.Router();

// Public routes
router.get('/categories', jobController.getJobCategories);
router.get('/search', jobController.searchJobs);

module.exports = router;
