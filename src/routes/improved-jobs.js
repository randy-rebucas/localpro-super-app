const express = require('express');
const { auth, authorize } = require('../middleware/auth');
// const { searchLimiter, generalLimiter } = require('../middleware/rateLimiter'); // Rate limiting disabled
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
  getMyJobs,
  uploadCompanyLogo,
  getJobStats,
  searchJobs
} = require('../controllers/jobController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

// Public routes - rate limiting disabled
router.get('/', 
  validatePaginationParams,
  validateSearchParams,
  getJobs
);

router.get('/search', 
  validateSearchParams,
  searchJobs
);

router.get('/:id', 
  validateObjectIdParam('id'),
  getJob
);

// Protected routes
router.use(auth); // Apply authentication to all routes below

// Job management routes (Employer/Admin only)
router.post('/', 
  authorize('provider', 'admin'),
  createJob
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
  validateFileUpload({ maxSize: 10 * 1024 * 1024, allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] }),
  applyForJob
);

router.get('/my-applications', 
  validatePaginationParams,
  getMyApplications
);

router.get('/my-jobs', 
  authorize('provider', 'admin'),
  validatePaginationParams,
  getMyJobs
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
