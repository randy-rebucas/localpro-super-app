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
  patchProviderProfile,
  updateOnboardingStep,
  uploadDocuments,
  getProviderDashboard,
  getProviderAnalytics,
  getProviderMetrics,
  getProviderActivity,
  updateProviderStatus,
  getProvidersForAdmin,
  getProviderSkills,
  adminUpdateProvider,
  getProviderReviews,
  respondToReview
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

const validateProviderPatch = [
  body('status')
    .optional()
    .isIn(['pending', 'active', 'suspended', 'inactive', 'rejected'])
    .withMessage('Invalid status'),
  body('providerType')
    .optional()
    .isIn(['individual', 'business', 'agency'])
    .withMessage('Invalid provider type'),
  body('settings.profileVisibility')
    .optional()
    .isIn(['public', 'private', 'verified_only'])
    .withMessage('Invalid profile visibility'),
  body('settings.showContactInfo')
    .optional()
    .isBoolean()
    .withMessage('showContactInfo must be a boolean'),
  body('settings.showPricing')
    .optional()
    .isBoolean()
    .withMessage('showPricing must be a boolean'),
  body('settings.showReviews')
    .optional()
    .isBoolean()
    .withMessage('showReviews must be a boolean'),
  body('settings.allowDirectBooking')
    .optional()
    .isBoolean()
    .withMessage('allowDirectBooking must be a boolean'),
  body('settings.requireApproval')
    .optional()
    .isBoolean()
    .withMessage('requireApproval must be a boolean'),
  body('professionalInfo.specialties.*.category')
    .optional()
    .isIn(['cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 'pest_control', 'handyman', 'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 'appliance_repair', 'locksmith', 'home_security', 'pool_maintenance', 'carpet_cleaning', 'window_cleaning', 'gutter_cleaning', 'power_washing', 'snow_removal', 'other'])
    .withMessage('Invalid specialty category. Must be a valid ServiceCategory key.'),
  body('professionalInfo.travelDistance')
    .optional()
    .isNumeric()
    .withMessage('travelDistance must be a number'),
  body('professionalInfo.minimumJobValue')
    .optional()
    .isNumeric()
    .withMessage('minimumJobValue must be a number'),
  body('professionalInfo.maximumJobValue')
    .optional()
    .isNumeric()
    .withMessage('maximumJobValue must be a number'),
  body('professionalInfo.emergencyServices')
    .optional()
    .isBoolean()
    .withMessage('emergencyServices must be a boolean')
];

const validateOnboardingStep = [
  body('step')
    .isIn(['profile_setup', 'business_info', 'professional_info', 'verification', 'documents', 'portfolio', 'preferences', 'review'])
    .withMessage('Invalid onboarding step'),
  body('data')
    .isObject()
    .withMessage('Step data must be an object')
];

/**
 * @swagger
 * /api/providers:
 *   get:
 *     summary: Get list of providers
 *     tags: [Providers]
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
 *         description: List of providers
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// Public routes (no authentication required)
router.get('/skills', getProviderSkills);
router.get('/', getProviders);

/**
 * @swagger
 * /api/providers/{id}:
 *   get:
 *     summary: Get provider by ID
 *     tags: [Providers]
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
 *         description: Provider details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid provider ID')
], getProvider);

// Protected routes (authentication required)
router.use(auth);

/**
 * @swagger
 * /api/providers/profile/me:
 *   get:
 *     summary: Get current user's provider profile
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider profile
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Provider profile management
router.get('/profile/me', getMyProviderProfile);

/**
 * @swagger
 * /api/providers/profile:
 *   post:
 *     summary: Create provider profile
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerType
 *             properties:
 *               providerType:
 *                 type: string
 *                 enum: [individual, business, agency]
 *               businessInfo:
 *                 type: object
 *               professionalInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: Profile created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/profile', validateProviderCreation, createProviderProfile);

/**
 * @swagger
 * /api/providers/profile:
 *   put:
 *     summary: Update provider profile
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/profile', validateProviderUpdate, updateProviderProfile);

/**
 * @swagger
 * /api/providers/profile:
 *   patch:
 *     summary: Partially update provider profile
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, active, suspended, inactive, rejected]
 *               providerType:
 *                 type: string
 *                 enum: [individual, business, agency]
 *               settings:
 *                 type: object
 *                 properties:
 *                   profileVisibility:
 *                     type: string
 *                     enum: [public, private, verified_only]
 *                   showContactInfo:
 *                     type: boolean
 *                   showPricing:
 *                     type: boolean
 *                   showReviews:
 *                     type: boolean
 *                   allowDirectBooking:
 *                     type: boolean
 *                   requireApproval:
 *                     type: boolean
 *               businessInfo:
 *                 type: object
 *               professionalInfo:
 *                 type: object
 *               preferences:
 *                 type: object
 *               financialInfo:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile partially updated
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch('/profile', validateProviderPatch, patchProviderProfile);

// Onboarding
router.put('/onboarding/step', validateOnboardingStep, updateOnboardingStep);

// Document uploads
router.post('/documents/upload', upload.array('documents', 5), uploadDocuments);

// Provider dashboard and analytics
router.get('/dashboard/overview', getProviderDashboard);

/**
 * @swagger
 * /api/providers/dashboard/metrics:
 *   get:
 *     summary: Get real-time provider metrics
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time metrics including today's and this week's performance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     today:
 *                       type: object
 *                       properties:
 *                         earnings:
 *                           type: number
 *                         bookings:
 *                           type: number
 *                         hours:
 *                           type: number
 *                         newMessages:
 *                           type: number
 *                     thisWeek:
 *                       type: object
 *                     performance:
 *                       type: object
 *                     goals:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboard/metrics', getProviderMetrics);

/**
 * @swagger
 * /api/providers/dashboard/activity:
 *   get:
 *     summary: Get provider activity feed
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [booking, review, payment, message]
 *         description: Filter by activity type
 *     responses:
 *       200:
 *         description: Activity feed with recent events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboard/activity', getProviderActivity);

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

// Admin: Update provider status - support both /admin/:id/status and /:id/status
router.put('/admin/:id/status', authorize('admin'), [
  param('id').isMongoId().withMessage('Invalid provider ID'),
  body('status').isIn(['pending', 'active', 'suspended', 'inactive', 'rejected']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], updateProviderStatus);

// Alternative route for frontend compatibility: PUT /api/providers/:id/status
router.put('/:id/status', authorize('admin'), [
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

/**
 * @swagger
 * /api/providers/reviews:
 *   get:
 *     summary: Get provider reviews
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4, 5]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating]
 *           default: createdAt
 *     responses:
 *       200:
 *         description: Provider reviews retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/reviews', auth, getProviderReviews);

/**
 * @swagger
 * /api/providers/reviews/{reviewId}/respond:
 *   post:
 *     summary: Respond to a review
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
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
 *               - responseText
 *             properties:
 *               responseText:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Response added successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Response already exists
 */
router.post('/reviews/:reviewId/respond', auth, [
  param('reviewId').isMongoId().withMessage('Invalid review ID'),
  body('responseText').trim().notEmpty().withMessage('Response text is required').isLength({ max: 1000 }).withMessage('Response must not exceed 1000 characters')
], respondToReview);

module.exports = router;
