const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const { uploaders } = require('../config/cloudinary');

const {
  createAgency,
  getAgencies,
  getAgency,
  updateAgency,
  patchAgency,
  deleteAgency,
  uploadAgencyLogo,
  addProvider,
  removeProvider,
  updateProviderStatus,
  addAdmin,
  removeAdmin,
  getAgencyAnalytics,
  getMyAgencies,
  joinAgency,
  leaveAgency,
  updateAgencyVerification
} = require('../controllers/agencyController');

// Validation middleware
const createAgencyValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Agency name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('contactInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('contactInfo.phone')
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Valid phone number is required'),
  body('businessInfo.industry')
    .isIn(['cleaning', 'maintenance', 'construction', 'logistics', 'healthcare', 'education', 'technology', 'other'])
    .withMessage('Valid industry is required'),
  body('businessInfo.businessType')
    .optional()
    .isIn(['sole_proprietorship', 'partnership', 'corporation', 'llc', 'non_profit'])
    .withMessage('Valid business type is required')
];

const updateAgencyValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Agency name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('contactInfo.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('contactInfo.phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Valid phone number is required')
];

/**
 * @swagger
 * /api/agencies:
 *   get:
 *     summary: Get list of agencies
 *     tags: [Agencies]
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
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of agencies
 */
// Public routes
router.get('/', getAgencies); // Get all agencies (public)

/**
 * @swagger
 * /api/agencies/{id}:
 *   get:
 *     summary: Get agency by ID
 *     tags: [Agencies]
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
 *         description: Agency details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', getAgency); // Get single agency (public)

// Protected routes
router.use(auth); // All routes below require authentication

// Agency verification management
router.patch('/:id/verification', authorize('admin'), updateAgencyVerification); // Update agency verification

/**
 * @swagger
 * /api/agencies:
 *   post:
 *     summary: Create a new agency
 *     tags: [Agencies]
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
 *               - contactInfo
 *               - businessInfo
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               contactInfo:
 *                 type: object
 *               businessInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: Agency created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Agency management routes
router.post('/', authorize('admin'), createAgencyValidation, createAgency); // Create agency

/**
 * @swagger
 * /api/agencies/{id}:
 *   put:
 *     summary: Update agency
 *     tags: [Agencies]
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
 *         description: Agency updated
 *   delete:
 *     summary: Delete agency
 *     tags: [Agencies]
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
 *         description: Agency deleted
 */
router.put('/:id', authorize('admin'), updateAgencyValidation, updateAgency); // Update agency
/**
 * @swagger
 * /api/agencies/{id}:
 *   patch:
 *     summary: Partially update agency
 *     tags: [Agencies]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               contact:
 *                 type: object
 *               business:
 *                 type: object
 *               serviceAreas:
 *                 type: array
 *               services:
 *                 type: array
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Agency partially updated
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch('/:id', authorize('admin'), updateAgencyValidation, patchAgency); // Patch agency (partial update)
router.delete('/:id', authorize('admin'), deleteAgency); // Delete agency

/**
 * @swagger
 * /api/agencies/{id}/logo:
 *   post:
 *     summary: Upload agency logo
 *     tags: [Agencies]
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
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded
 */
router.post('/:id/logo', authorize('admin', 'provider'), uploaders.userProfiles.single('logo'), uploadAgencyLogo); // Upload logo

/**
 * @swagger
 * /api/agencies/{id}/providers:
 *   post:
 *     summary: Add provider to agency
 *     tags: [Agencies]
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerId
 *             properties:
 *               providerId:
 *                 type: string
 *                 format: ObjectId
 *     responses:
 *       201:
 *         description: Provider added
 */
// Provider management routes
router.post('/:id/providers', authorize('admin', 'provider'), addProvider); // Add provider

/**
 * @swagger
 * /api/agencies/{id}/providers/{providerId}:
 *   delete:
 *     summary: Remove provider from agency
 *     tags: [Agencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Provider removed
 */
router.delete('/:id/providers/:providerId', authorize('admin', 'provider'), removeProvider); // Remove provider

/**
 * @swagger
 * /api/agencies/{id}/providers/{providerId}/status:
 *   put:
 *     summary: Update provider status in agency
 *     tags: [Agencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: Provider status updated
 */
router.put('/:id/providers/:providerId/status', authorize('admin', 'provider'), updateProviderStatus); // Update provider status

// Admin management routes
router.post('/:id/admins', authorize('admin'), addAdmin); // Add admin
router.delete('/:id/admins/:adminId', authorize('admin'), removeAdmin); // Remove admin

// Analytics routes
router.get('/:id/analytics', authorize('admin'), getAgencyAnalytics); // Get agency analytics

// User agency routes
router.get('/my/agencies', authorize('client'), getMyAgencies); // Get my agencies
router.post('/join', authorize('client'), joinAgency); // Join agency
router.post('/leave', authorize('client'), leaveAgency); // Leave agency

module.exports = router;
