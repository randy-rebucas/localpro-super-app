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
  getPartnerBySlug
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

// Public routes (no authentication required)
router.post('/onboarding/start', validateOnboardingStart, startPartnerOnboarding);

// Get partner by slug (for third-party app login)
router.get('/slug/:slug', validateSlug, getPartnerBySlug);

// Onboarding routes (public, identified by partner ID)
router.put('/:id/business-info', validatePartnerId, validateBusinessInfo, updateBusinessInfo);
router.put('/:id/verification', validatePartnerId, completeVerification);
router.put('/:id/api-setup', validatePartnerId, validateApiSetup, completeApiSetup);
router.put('/:id/activate', validatePartnerId, activatePartner);

// Protected routes (authentication required)
router.use(auth);

// Admin-only routes
router.use(authorize('admin'));

// Partner management
router.post('/', validatePartnerCreation, createPartner);
router.get('/', getPartners);
router.get('/:id', validatePartnerId, getPartnerById);
router.put('/:id', validatePartnerId, validatePartnerUpdate, updatePartner);
router.delete('/:id', validatePartnerId, deletePartner);

// Partner notes
router.post('/:id/notes', validatePartnerId, validateNote, addPartnerNote);

module.exports = router;
