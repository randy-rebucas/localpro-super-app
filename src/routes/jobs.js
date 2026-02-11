const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  validateObjectIdParam,
  validatePaginationParams,
  validateSearchParams,
  validateFileUpload
} = require('../middleware/routeValidation');
const { body } = require('express-validator');
const {
  // Basic CRUD
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  // Application management
  applyForJob,
  getJobApplications,
  updateApplicationStatus,
  getMyApplications,
  withdrawApplication,
  rejectApplication,
  updateApplicationScore,
  // Job management
  getMyJobs,
  uploadCompanyLogo,
  getJobStats,
  searchJobs,
  getJobCategories,
  // Workflow
  publishJob,
  pauseJob,
  closeJob,
  markJobFilled,
  reopenJob,
  archiveJob,
  // Interviews
  scheduleInterview,
  updateInterviewStatus,
  rescheduleInterview,
  submitInterviewFeedback,
  // Offers
  sendOffer,
  respondToOffer,
  withdrawOffer,
  // Referrals
  addReferral,
  getJobReferrals,
  getMyReferrals,
  // Analytics
  getJobAnalytics,
  getHiringFunnel,
  getEmployerStats,
  // Featuring & Promotion
  featureJob,
  unfeatureJob,
  promoteJob,
  // Special queries
  getFeaturedJobs,
  getUrgentJobs,
  getRemoteJobs,
  getNearbyJobs,
  getJobBySlug,
  getJobByNumber,
  getExpiringJobs
} = require('../controllers/jobController');
const { uploaders } = require('../config/cloudinary');

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================

/**
 * @swagger
 * /api/jobs/categories:
 *   get:
 *     summary: Get job categories
 *     tags: [Jobs]
 *     security: []
 */
router.get('/categories', getJobCategories);

/**
 * @swagger
 * /api/jobs/featured:
 *   get:
 *     summary: Get featured jobs
 *     tags: [Jobs]
 *     security: []
 */
router.get('/featured', getFeaturedJobs);

/**
 * @swagger
 * /api/jobs/urgent:
 *   get:
 *     summary: Get urgent/high-priority jobs
 *     tags: [Jobs]
 *     security: []
 */
router.get('/urgent', getUrgentJobs);

/**
 * @swagger
 * /api/jobs/remote:
 *   get:
 *     summary: Get remote jobs
 *     tags: [Jobs]
 *     security: []
 */
router.get('/remote', validatePaginationParams, getRemoteJobs);

/**
 * @swagger
 * /api/jobs/nearby:
 *   get:
 *     summary: Get nearby jobs based on coordinates
 *     tags: [Jobs]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *           default: 50
 *         description: Maximum distance in kilometers
 */
router.get('/nearby', validatePaginationParams, getNearbyJobs);

/**
 * @swagger
 * /api/jobs/search:
 *   get:
 *     summary: Search jobs with advanced filters
 *     tags: [Jobs]
 *     security: []
 */
router.get('/search', validateSearchParams, searchJobs);

/**
 * @swagger
 * /api/jobs/slug/{slug}:
 *   get:
 *     summary: Get job by URL slug
 *     tags: [Jobs]
 *     security: []
 */
router.get('/slug/:slug', getJobBySlug);

/**
 * @swagger
 * /api/jobs/number/{jobNumber}:
 *   get:
 *     summary: Get job by job number
 *     tags: [Jobs]
 *     security: []
 */
router.get('/number/:jobNumber', getJobByNumber);

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get list of jobs with filtering
 *     tags: [Jobs]
 *     security: []
 */
router.get('/', validatePaginationParams, validateSearchParams, getJobs);

// ============================================
// PROTECTED ROUTES (Auth Required)
// ============================================
router.use(auth);

// ----- User Routes -----

/**
 * @swagger
 * /api/jobs/my-applications:
 *   get:
 *     summary: Get current user's job applications
 *     tags: [Jobs - Applications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my-applications', validatePaginationParams, getMyApplications);

/**
 * @swagger
 * /api/jobs/my-referrals:
 *   get:
 *     summary: Get referrals made by current user
 *     tags: [Jobs - Referrals]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my-referrals', getMyReferrals);

// ----- Employer/Admin Routes -----

/**
 * @swagger
 * /api/jobs/my-jobs:
 *   get:
 *     summary: Get jobs posted by current employer
 *     tags: [Jobs - Employer]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my-jobs', authorize('provider', 'admin', 'partner'), validatePaginationParams, getMyJobs);

/**
 * @swagger
 * /api/jobs/employer-stats:
 *   get:
 *     summary: Get aggregated statistics for employer's jobs
 *     tags: [Jobs - Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/employer-stats', authorize('provider', 'admin', 'partner'), getEmployerStats);

/**
 * @swagger
 * /api/jobs/expiring:
 *   get:
 *     summary: Get jobs expiring soon
 *     tags: [Jobs - Employer]
 *     security:
 *       - bearerAuth: []
 */
router.get('/expiring', authorize('provider', 'admin', 'partner'), getExpiringJobs);

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job posting
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authorize('provider', 'admin', 'partner'), createJob);

// ============================================
// PARAMETERIZED JOB ROUTES
// ============================================

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 */
router.get('/:id', validateObjectIdParam('id'), getJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authorize('provider', 'admin', 'partner'), validateObjectIdParam('id'), updateJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authorize('provider', 'admin', 'partner'), validateObjectIdParam('id'), deleteJob);

// ----- Job Workflow -----

/**
 * @swagger
 * /api/jobs/{id}/publish:
 *   post:
 *     summary: Publish a draft job
 *     tags: [Jobs - Workflow]
 */
router.post('/:id/publish', authorize('provider', 'admin', 'partner'), validateObjectIdParam('id'), publishJob);

/**
 * @swagger
 * /api/jobs/{id}/pause:
 *   post:
 *     summary: Pause an active job
 *     tags: [Jobs - Workflow]
 */
router.post('/:id/pause', authorize('provider', 'admin', 'partner'), validateObjectIdParam('id'), pauseJob);

/**
 * @swagger
 * /api/jobs/{id}/close:
 *   post:
 *     summary: Close a job posting
 *     tags: [Jobs - Workflow]
 */
router.post('/:id/close', authorize('provider', 'admin', 'partner'), validateObjectIdParam('id'), closeJob);

/**
 * @swagger
 * /api/jobs/{id}/fill:
 *   post:
 *     summary: Mark job as filled
 *     tags: [Jobs - Workflow]
 */
router.post('/:id/fill', authorize('provider', 'admin', 'partner'), validateObjectIdParam('id'), markJobFilled);

/**
 * @swagger
 * /api/jobs/{id}/reopen:
 *   post:
 *     summary: Reopen a closed/paused job
 *     tags: [Jobs - Workflow]
 */
router.post('/:id/reopen', authorize('provider', 'admin', 'partner'), validateObjectIdParam('id'), reopenJob);

/**
 * @swagger
 * /api/jobs/{id}/archive:
 *   post:
 *     summary: Archive a job
 *     tags: [Jobs - Workflow]
 */
router.post('/:id/archive', authorize('provider', 'admin', 'partner'), validateObjectIdParam('id'), archiveJob);

// ----- Job Assets -----

/**
 * @swagger
 * /api/jobs/{id}/logo:
 *   post:
 *     summary: Upload company logo for job
 *     tags: [Jobs]
 */
router.post('/:id/logo',
  authorize('provider', 'admin', 'partner'),
  validateObjectIdParam('id'),
  uploaders.jobs.single('logo'),
  validateFileUpload({ maxSize: 2 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png'] }),
  uploadCompanyLogo
);

// ----- Job Analytics -----

/**
 * @swagger
 * /api/jobs/{id}/stats:
 *   get:
 *     summary: Get job statistics (legacy)
 *     tags: [Jobs - Analytics]
 */
router.get('/:id/stats', authorize('provider', 'admin', 'partner'), validateObjectIdParam('id'), getJobStats);

/**
 * @swagger
 * /api/jobs/{id}/analytics:
 *   get:
 *     summary: Get comprehensive job analytics
 *     tags: [Jobs - Analytics]
 */
router.get('/:id/analytics', authorize('provider', 'admin', 'partner'), validateObjectIdParam('id'), getJobAnalytics);

/**
 * @swagger
 * /api/jobs/{id}/funnel:
 *   get:
 *     summary: Get hiring funnel metrics
 *     tags: [Jobs - Analytics]
 */
router.get('/:id/funnel', authorize('provider', 'admin', 'partner'), validateObjectIdParam('id'), getHiringFunnel);

// ----- Featuring & Promotion -----

/**
 * @swagger
 * /api/jobs/{id}/feature:
 *   post:
 *     summary: Feature a job (Admin only)
 *     tags: [Jobs - Admin]
 */
router.post('/:id/feature', authorize('admin'), validateObjectIdParam('id'), featureJob);

/**
 * @swagger
 * /api/jobs/{id}/feature:
 *   delete:
 *     summary: Remove job from featured (Admin only)
 *     tags: [Jobs - Admin]
 */
router.delete('/:id/feature', authorize('admin'), validateObjectIdParam('id'), unfeatureJob);

/**
 * @swagger
 * /api/jobs/{id}/promote:
 *   post:
 *     summary: Promote a job
 *     tags: [Jobs - Employer]
 */
router.post('/:id/promote',
  authorize('provider', 'admin', 'partner'),
  validateObjectIdParam('id'),
  body('promotionType').isIn(['standard', 'premium', 'urgent', 'spotlight', 'homepage']),
  body('until').isISO8601(),
  promoteJob
);

// ----- Referrals -----

/**
 * @swagger
 * /api/jobs/{id}/referrals:
 *   get:
 *     summary: Get referrals for a job
 *     tags: [Jobs - Referrals]
 */
router.get('/:id/referrals', authorize('provider', 'admin', 'partner'), validateObjectIdParam('id'), getJobReferrals);

/**
 * @swagger
 * /api/jobs/{id}/referrals:
 *   post:
 *     summary: Add a referral for a job
 *     tags: [Jobs - Referrals]
 */
router.post('/:id/referrals',
  validateObjectIdParam('id'),
  body('referredEmail').isEmail().withMessage('Valid email is required'),
  addReferral
);

// ============================================
// APPLICATION ROUTES
// ============================================

/**
 * @swagger
 * /api/jobs/{id}/apply:
 *   post:
 *     summary: Apply for a job
 *     tags: [Jobs - Applications]
 */
router.post('/:id/apply',
  validateObjectIdParam('id'),
  uploaders.jobs.single('resume'),
  validateFileUpload({
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    required: false
  }),
  applyForJob
);

/**
 * @swagger
 * /api/jobs/{id}/applications:
 *   get:
 *     summary: Get all applications for a job
 *     tags: [Jobs - Applications]
 */
router.get('/:id/applications',
  authorize('provider', 'admin', 'partner'),
  validateObjectIdParam('id'),
  validatePaginationParams,
  getJobApplications
);

/**
 * @swagger
 * /api/jobs/{id}/applications/{applicationId}:
 *   delete:
 *     summary: Withdraw application
 *     tags: [Jobs - Applications]
 */
router.delete('/:id/applications/:applicationId',
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  withdrawApplication
);

/**
 * @swagger
 * /api/jobs/{id}/applications/{applicationId}/status:
 *   put:
 *     summary: Update application status
 *     tags: [Jobs - Applications]
 */
router.put('/:id/applications/:applicationId/status',
  authorize('provider', 'admin', 'partner'),
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  body('status').isIn(['pending', 'reviewing', 'screening', 'shortlisted', 'phone_screen', 'interview', 'assessment', 'reference_check', 'offer', 'hired', 'rejected', 'withdrawn']),
  updateApplicationStatus
);

/**
 * @swagger
 * /api/jobs/{id}/applications/{applicationId}/score:
 *   put:
 *     summary: Update application score
 *     tags: [Jobs - Applications]
 */
router.put('/:id/applications/:applicationId/score',
  authorize('provider', 'admin', 'partner'),
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  updateApplicationScore
);

/**
 * @swagger
 * /api/jobs/{id}/applications/{applicationId}/reject:
 *   post:
 *     summary: Reject application with reason
 *     tags: [Jobs - Applications]
 */
router.post('/:id/applications/:applicationId/reject',
  authorize('provider', 'admin', 'partner'),
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  body('reason').isIn(['not_qualified', 'overqualified', 'salary_mismatch', 'culture_fit', 'position_filled', 'withdrew', 'no_response', 'failed_assessment', 'background_check', 'other']),
  rejectApplication
);

// ============================================
// INTERVIEW ROUTES
// ============================================

/**
 * @swagger
 * /api/jobs/{id}/applications/{applicationId}/interviews:
 *   post:
 *     summary: Schedule an interview
 *     tags: [Jobs - Interviews]
 */
router.post('/:id/applications/:applicationId/interviews',
  authorize('provider', 'admin', 'partner'),
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  body('type').isIn(['phone', 'video', 'in_person', 'panel', 'technical', 'behavioral', 'case_study', 'presentation']),
  body('scheduledAt').isISO8601(),
  scheduleInterview
);

/**
 * @swagger
 * /api/jobs/{id}/applications/{applicationId}/interviews/{interviewId}:
 *   put:
 *     summary: Update interview status
 *     tags: [Jobs - Interviews]
 */
router.put('/:id/applications/:applicationId/interviews/:interviewId',
  authorize('provider', 'admin', 'partner'),
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  body('status').isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show']),
  updateInterviewStatus
);

/**
 * @swagger
 * /api/jobs/{id}/applications/{applicationId}/interviews/{interviewId}/reschedule:
 *   post:
 *     summary: Reschedule an interview
 *     tags: [Jobs - Interviews]
 */
router.post('/:id/applications/:applicationId/interviews/:interviewId/reschedule',
  authorize('provider', 'admin', 'partner'),
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  body('newDate').isISO8601(),
  body('reason').notEmpty(),
  rescheduleInterview
);

/**
 * @swagger
 * /api/jobs/{id}/applications/{applicationId}/interviews/{interviewId}/feedback:
 *   post:
 *     summary: Submit interview feedback
 *     tags: [Jobs - Interviews]
 */
router.post('/:id/applications/:applicationId/interviews/:interviewId/feedback',
  authorize('provider', 'admin', 'partner'),
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  body('rating').isInt({ min: 1, max: 5 }),
  body('recommendation').isIn(['strong_hire', 'hire', 'no_hire', 'strong_no_hire']),
  submitInterviewFeedback
);

// ============================================
// OFFER ROUTES
// ============================================

/**
 * @swagger
 * /api/jobs/{id}/applications/{applicationId}/offer:
 *   post:
 *     summary: Send a job offer
 *     tags: [Jobs - Offers]
 */
router.post('/:id/applications/:applicationId/offer',
  authorize('provider', 'admin', 'partner'),
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  body('salary').isObject(),
  body('salary.amount').isNumeric(),
  sendOffer
);

/**
 * @swagger
 * /api/jobs/{id}/applications/{applicationId}/offer/respond:
 *   post:
 *     summary: Respond to a job offer (accept/decline)
 *     tags: [Jobs - Offers]
 */
router.post('/:id/applications/:applicationId/offer/respond',
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  body('accepted').isBoolean(),
  respondToOffer
);

/**
 * @swagger
 * /api/jobs/{id}/applications/{applicationId}/offer:
 *   delete:
 *     summary: Withdraw a job offer
 *     tags: [Jobs - Offers]
 */
router.delete('/:id/applications/:applicationId/offer',
  authorize('provider', 'admin', 'partner'),
  validateObjectIdParam('id'),
  validateObjectIdParam('applicationId'),
  withdrawOffer
);

module.exports = router;
