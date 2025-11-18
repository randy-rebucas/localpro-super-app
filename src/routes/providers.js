const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const multer = require('multer');
const {
  getProviders,
  getProvider,
  getMyProviderProfile,
  createProviderProfile,
  updateProviderProfile,
  updateOnboardingStep,
  uploadDocuments,
  getProviderDashboard,
  getProviderAnalytics,
  updateProviderStatus,
  getProvidersForAdmin,
  getProviderSkills,
  adminUpdateProvider
} = require('../controllers/providerController');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

// Validation middleware
const validateProviderCreation = [
  body('providerType')
    .isIn(['individual', 'business', 'agency'])
    .withMessage('Provider type must be individual, business, or agency'),
  body('businessInfo.businessName')
    .if(body('providerType').isIn(['business', 'agency']))
    .notEmpty()
    .withMessage('Business name is required for business/agency providers'),
  body('professionalInfo.specialties')
    .isArray({ min: 1 })
    .withMessage('At least one specialty is required'),
  body('professionalInfo.specialties.*.category')
    .isIn(['cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 'pest_control', 'handyman', 'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 'appliance_repair', 'locksmith', 'home_security', 'pool_maintenance', 'carpet_cleaning', 'window_cleaning', 'gutter_cleaning', 'power_washing', 'snow_removal', 'other'])
    .withMessage('Invalid specialty category. Must be a valid ServiceCategory key.'),
  body('professionalInfo.specialties.*.serviceAreas')
    .isArray({ min: 1 })
    .withMessage('At least one service area is required')
];

const validateProviderUpdate = [
  body('providerType')
    .optional()
    .isIn(['individual', 'business', 'agency'])
    .withMessage('Invalid provider type'),
  body('professionalInfo.specialties.*.category')
    .optional()
    .isIn(['cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 'pest_control', 'handyman', 'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 'appliance_repair', 'locksmith', 'home_security', 'pool_maintenance', 'carpet_cleaning', 'window_cleaning', 'gutter_cleaning', 'power_washing', 'snow_removal', 'other'])
    .withMessage('Invalid specialty category. Must be a valid ServiceCategory key.')
];

const validateOnboardingStep = [
  body('step')
    .isIn(['profile_setup', 'business_info', 'professional_info', 'verification', 'documents', 'portfolio', 'preferences', 'review'])
    .withMessage('Invalid onboarding step'),
  body('data')
    .isObject()
    .withMessage('Step data must be an object')
];

// Public routes (no authentication required)
router.get('/skills', getProviderSkills);
router.get('/', getProviders);

router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid provider ID')
], getProvider);

// Protected routes (authentication required)
router.use(auth);

// Provider profile management
router.get('/profile/me', getMyProviderProfile);

router.post('/profile', validateProviderCreation, createProviderProfile);

router.put('/profile', validateProviderUpdate, updateProviderProfile);

// Onboarding
router.put('/onboarding/step', validateOnboardingStep, updateOnboardingStep);

// Document uploads
router.post('/documents/upload', upload.array('documents', 5), uploadDocuments);

// Provider dashboard and analytics
router.get('/dashboard/overview', getProviderDashboard);

router.get('/analytics/performance', [
  query('timeframe').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid timeframe')
], getProviderAnalytics);

// Admin routes
router.get('/admin/all', authorize('admin'), [
  query('status').optional().isIn(['pending', 'active', 'suspended', 'inactive', 'rejected']),
  query('providerType').optional().isIn(['individual', 'business', 'agency']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], getProvidersForAdmin);

router.put('/admin/:id/status', authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid provider ID'),
  body('status').isIn(['pending', 'active', 'suspended', 'inactive', 'rejected']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], updateProviderStatus);

// Admin: Update provider with all data (including all referenced collections)
const validateAdminProviderUpdate = [
  param('id').isMongoId().withMessage('Invalid provider ID'),
  body('status').optional().isIn(['pending', 'active', 'suspended', 'inactive', 'rejected']).withMessage('Invalid status'),
  body('providerType').optional().isIn(['individual', 'business', 'agency']).withMessage('Invalid provider type'),
  body('settings.profileVisibility').optional().isIn(['public', 'private', 'verified_only']).withMessage('Invalid profile visibility'),
  body('professionalInfo.specialties.*.category').optional().isIn(['cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 'pest_control', 'handyman', 'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 'appliance_repair', 'locksmith', 'home_security', 'pool_maintenance', 'carpet_cleaning', 'window_cleaning', 'gutter_cleaning', 'power_washing', 'snow_removal', 'other']).withMessage('Invalid specialty category'),
  body('verification.backgroundCheck.status').optional().isIn(['pending', 'passed', 'failed', 'not_required']).withMessage('Invalid background check status'),
  body('financialInfo.bankAccount.accountType').optional().isIn(['checking', 'savings']).withMessage('Invalid account type'),
  body('financialInfo.paymentMethods.*.type').optional().isIn(['bank_transfer', 'paypal', 'paymaya', 'check']).withMessage('Invalid payment method type'),
  body('preferences.communicationPreferences.preferredContactMethod').optional().isIn(['phone', 'email', 'sms', 'app']).withMessage('Invalid preferred contact method')
];

router.put('/admin/:id', authorize('admin'), validateAdminProviderUpdate, adminUpdateProvider);

module.exports = router;
