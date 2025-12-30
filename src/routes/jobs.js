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

/**
 * @swagger
 * /api/jobs/categories:
 *   get:
 *     summary: Get job categories
 *     tags: [Jobs]
 *     security: []
 *     responses:
 *       200:
 *         description: List of job categories
 */
// Public routes - Specific routes must come before parameterized routes
router.get('/categories', getJobCategories);

/**
 * @swagger
 * /api/jobs/search:
 *   get:
 *     summary: Search jobs
 *     tags: [Jobs]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', 
  validateSearchParams,
  searchJobs
);

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get list of jobs
 *     tags: [Jobs]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of jobs
 */
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

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job posting
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               location:
 *                 type: object
 *     responses:
 *       201:
 *         description: Job created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Job management routes (Employer/Admin only)
router.post('/', authorize('provider', 'admin'), createJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Job details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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

/**
 * @swagger
 * /api/jobs/{id}/apply:
 *   post:
 *     summary: Apply for a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Application submitted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
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
