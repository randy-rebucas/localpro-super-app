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

/**
 * @swagger
 * /api/job-categories:
 *   get:
 *     summary: Get job categories
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
 *     responses:
 *       200:
 *         description: List of job categories
 *   post:
 *     summary: Create job category (Admin only)
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/job-categories/active:
 *   get:
 *     summary: Get active job categories
 *     tags: [Jobs]
 *     security: []
 *     responses:
 *       200:
 *         description: List of active categories
 */
// Public routes - Specific routes must come before parameterized routes
router.get('/active', getActiveJobCategories);
router.get('/', 
  validatePaginationParams,
  getAllJobCategories
);

/**
 * @swagger
 * /api/job-categories/{id}:
 *   get:
 *     summary: Get job category by ID
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
 *         description: Category details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Parameterized routes
router.get('/:id', 
  validateObjectIdParam('id'),
  getJobCategoryById
);

/**
 * @swagger
 * /api/job-categories/{id}/stats:
 *   get:
 *     summary: Get job category statistics
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
 *         description: Category statistics
 */
router.get('/:id/stats', 
  validateObjectIdParam('id'),
  getJobCategoryStats
);

// Protected routes (Admin only)
router.use(auth);

router.post('/', 
  authorize('admin'), 
  createJobCategory
);

/**
 * @swagger
 * /api/job-categories/{id}:
 *   put:
 *     summary: Update job category (Admin only)
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
 *     responses:
 *       200:
 *         description: Category updated
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   delete:
 *     summary: Delete job category (Admin only)
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
 *     responses:
 *       200:
 *         description: Category deleted
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
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

