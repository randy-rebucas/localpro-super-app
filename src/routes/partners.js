
const { uploaders } = require('../config/cloudinary');
const { uploadDocumentsForVerification } = require('../controllers/partnerController');

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { body, param } = require('express-validator');
const {
  createPartner,
  getPartners,
  getPartnerById,
  updatePartner,
  deletePartner,
  addPartnerNote,
  startPartnerOnboarding,
  updateBusinessInfo,
  completeVerification,
  completeApiSetup,
  activatePartner,
  getPartnerBySlug,
  getPartnerByManageId,
  attachedDocumentForVerification,
  deleteAttachedDocumentForVerification,
  getPartnerAnalytics
} = require('../controllers/partnerController');


// Validation middleware
const validatePartnerCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Partner name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phoneNumber')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid phone number is required'),
  body('slug')
    .optional()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens')
];

const validatePartnerUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Partner name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phoneNumber')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid phone number is required'),
  body('status')
    .optional()
    .isIn(['pending', 'active', 'suspended', 'inactive', 'rejected'])
    .withMessage('Invalid status value')
];

const validatePartnerId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid partner ID')
];

const validateSlug = [
  param('slug')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Invalid slug format')
];

const validateOnboardingStart = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Partner name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phoneNumber')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid phone number is required')
];

const validateBusinessInfo = [
  body('businessInfo.companyName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('businessInfo.website')
    .optional()
    .isURL()
    .withMessage('Valid website URL is required'),
  body('businessInfo.industry')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Industry must be between 2 and 50 characters'),
  body('businessInfo.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const validateApiSetup = [
  body('webhookUrl')
    .optional()
    .isURL()
    .withMessage('Valid webhook URL is required'),
  body('callbackUrl')
    .optional()
    .isURL()
    .withMessage('Valid callback URL is required')
];

const validateNote = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note content must be between 1 and 1000 characters')
];

/**
 * @swagger
 * /api/partners/onboarding/start:
 *   post:
 *     summary: Start partner onboarding
 *     tags: [Partners]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phoneNumber
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Onboarding started
 */
// Public routes (no authentication required)
router.post('/onboarding/start', validateOnboardingStart, startPartnerOnboarding);

/**
 * @swagger
 * /api/partners/slug/{slug}:
 *   get:
 *     summary: Get partner by slug
 *     tags: [Partners]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Partner details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/slug/:slug', validateSlug, authorize(['admin', 'partner']), getPartnerBySlug);

/**
 * @swagger
 * /api/partners/{id}/business-info:
 *   put:
 *     summary: Update business info during onboarding
 *     tags: [Partners]
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
 *         description: Business info updated
 */
// Onboarding routes (public, identified by partner ID)
router.put('/:id/business-info', validatePartnerId, validateBusinessInfo, updateBusinessInfo);

// @route POST /api/partners/:id/upload-documents
// @desc Upload documents for verification
// @access Admin/Partner
// Multer/cloudinary error handler wrapper for document upload
// Document verification document upload: expects files under 'documents' field (array), up to 3 files
router.post(
  '/:id/upload-documents',
  validatePartnerId,
  uploaders.documentVerification.single('document'),
  uploadDocumentsForVerification
);

/**
 * @swagger
 * /api/partners/{id}/verification:
 *   put:
 *     summary: Complete verification during onboarding
 *     tags: [Partners]
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
 *         description: Verification completed
 */
router.put('/:id/verification', validatePartnerId, completeVerification);

/**
 * @swagger
 * /api/partners/{id}/api-setup:
 *   put:
 *     summary: Complete API setup during onboarding
 *     tags: [Partners]
 *     security: []
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
 *               webhookUrl:
 *                 type: string
 *                 format: uri
 *               callbackUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: API setup completed
 */
router.put('/:id/api-setup', validatePartnerId, validateApiSetup, completeApiSetup);

/**
 * @swagger
 * /api/partners/{id}/activate:
 *   put:
 *     summary: Activate partner
 *     tags: [Partners]
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
 *         description: Partner activated
 */
router.put('/:id/activate', validatePartnerId, activatePartner);

// Protected routes (authentication required)
router.use(auth);

router.post('/', validatePartnerCreation, authorize(['admin']), createPartner);
router.get('/', authorize(['admin']), getPartners);
router.get('/:id', validatePartnerId, getPartnerById);
router.put('/:id', validatePartnerId, validatePartnerUpdate, authorize(['admin', 'partner']), updatePartner);
router.delete('/:id', validatePartnerId, authorize(['admin']), deletePartner);

/**
 * @swagger
 * /api/partners/{id}/notes:
 *   post:
 *     summary: Add partner note (Admin only)
 *     tags: [Partners]
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Note added
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Partner notes
router.post('/:id/notes', validatePartnerId, validateNote, authorize(['admin']), addPartnerNote);

/**
 * @swagger
 * /api/partners/manage/{manageId}:
 *   get:
 *     summary: Get partner by manage ID
 *     tags: [Partners]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: manageId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Partner details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/manage/:manageId', getPartnerByManageId);

router.put('/:id/attach-document/:documentType',
  validatePartnerId,
  uploaders.documentVerification.single('document'),
  attachedDocumentForVerification);

router.delete('/:id/delete-attach-document/:documentId',
  deleteAttachedDocumentForVerification);

// Get analytics dashboard/data for a partner
router.get('/:id/analytics', validatePartnerId,  authorize(['admin', 'partner']), getPartnerAnalytics);

module.exports = router;
