const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { 
  validateObjectIdParam, 
  validatePaginationParams, 
  validateSearchParams,
  validateFileUpload 
} = require('../middleware/routeValidation');
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getJobApplications,
  updateApplicationStatus,
  getMyApplications,
  withdrawApplication,
  getMyJobs,
  uploadCompanyLogo,
  getJobStats,
  searchJobs,
  getJobCategories
} = require('../controllers/jobController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

// Public routes - Specific routes must come before parameterized routes
router.get('/categories', getJobCategories);
router.get('/search', 
  validateSearchParams,
  searchJobs
);
router.get('/', 
  validatePaginationParams,
  validateSearchParams,
  getJobs
);

// Protected routes
router.use(auth);

// Specific routes (must come before /:id routes)
router.get('/my-applications', 
  validatePaginationParams,
  getMyApplications
);
router.get('/my-jobs', 
  authorize('provider', 'admin'), 
  validatePaginationParams,
  getMyJobs
);

// Job management routes (Employer/Admin only)
router.post('/', authorize('provider', 'admin'), createJob);

// Parameterized routes (must come after specific routes)
router.get('/:id', 
  validateObjectIdParam('id'),
  getJob
);
router.put('/:id', 
  authorize('provider', 'admin'), 
  validateObjectIdParam('id'),
  updateJob
);
router.delete('/:id', 
  authorize('provider', 'admin'), 
  validateObjectIdParam('id'),
  deleteJob
);
router.post('/:id/logo', 
  authorize('provider', 'admin'), 
  validateObjectIdParam('id'),
  uploaders.jobs.single('logo'),
  validateFileUpload({ maxSize: 2 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png'] }),
  uploadCompanyLogo
);
router.get('/:id/stats', 
  authorize('provider', 'admin'), 
  validateObjectIdParam('id'),
  getJobStats
);

// Application routes
router.post('/:id/apply', 
  validateObjectIdParam('id'),
  uploaders.jobs.single('resume'),
  validateFileUpload({ 
    maxSize: 10 * 1024 * 1024, 
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    required: false // Resume is optional
  }),
  applyForJob
);
router.delete('/:id/applications/:applicationId',
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  withdrawApplication
);

// Application management routes (Employer/Admin only)
router.get('/:id/applications', 
  authorize('provider', 'admin'), 
  validateObjectIdParam('id'),
  validatePaginationParams,
  getJobApplications
);
router.put('/:id/applications/:applicationId/status', 
  authorize('provider', 'admin'), 
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  updateApplicationStatus
);

module.exports = router;
