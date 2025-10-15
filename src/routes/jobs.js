const express = require('express');
const { auth, authorize } = require('../middleware/auth');
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

// Public routes
router.get('/', getJobs);
router.get('/search', searchJobs);
router.get('/:id', getJob);

// Protected routes
router.use(auth);

// Job management routes (Employer/Admin only)
router.post('/', authorize('provider', 'admin'), createJob);
router.put('/:id', authorize('provider', 'admin'), updateJob);
router.delete('/:id', authorize('provider', 'admin'), deleteJob);
router.post('/:id/logo', authorize('provider', 'admin'), uploaders.jobs.single('logo'), uploadCompanyLogo);
router.get('/:id/stats', authorize('provider', 'admin'), getJobStats);

// Application routes
router.post('/:id/apply', uploaders.jobs.single('resume'), applyForJob);
router.get('/my-applications', getMyApplications);
router.get('/my-jobs', authorize('provider', 'admin'), getMyJobs);

// Application management routes (Employer/Admin only)
router.get('/:id/applications', authorize('provider', 'admin'), getJobApplications);
router.put('/:id/applications/:applicationId/status', authorize('provider', 'admin'), updateApplicationStatus);

module.exports = router;
