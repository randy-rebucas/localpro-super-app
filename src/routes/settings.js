const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const { auth } = require('../middleware/auth');
const {
  // User Settings
  getUserSettings,
  updateUserSettings,
  updateUserSettingsCategory,
  resetUserSettings,
  deleteUserSettings,
  
  // App Settings
  getAppSettings,
  updateAppSettings,
  updateAppSettingsCategory,
  getPublicAppSettings,
  toggleFeatureFlag,
  getAppHealth
} = require('../controllers/settingsController');

// Validation middleware
const validateUserSettings = [
  body('privacy.profileVisibility').optional().isIn(['public', 'contacts_only', 'private']),
  body('privacy.showPhoneNumber').optional().isBoolean(),
  body('privacy.showEmail').optional().isBoolean(),
  body('privacy.showLocation').optional().isBoolean(),
  body('privacy.showRating').optional().isBoolean(),
  body('privacy.showPortfolio').optional().isBoolean(),
  body('privacy.allowDirectMessages').optional().isBoolean(),
  body('privacy.allowJobInvitations').optional().isBoolean(),
  body('privacy.allowReferralRequests').optional().isBoolean(),
  
  body('notifications.push.enabled').optional().isBoolean(),
  body('notifications.push.newMessages').optional().isBoolean(),
  body('notifications.push.jobMatches').optional().isBoolean(),
  body('notifications.push.bookingUpdates').optional().isBoolean(),
  body('notifications.push.paymentUpdates').optional().isBoolean(),
  body('notifications.push.referralUpdates').optional().isBoolean(),
  body('notifications.push.systemUpdates').optional().isBoolean(),
  body('notifications.push.marketing').optional().isBoolean(),
  
  body('notifications.email.enabled').optional().isBoolean(),
  body('notifications.email.newMessages').optional().isBoolean(),
  body('notifications.email.jobMatches').optional().isBoolean(),
  body('notifications.email.bookingUpdates').optional().isBoolean(),
  body('notifications.email.paymentUpdates').optional().isBoolean(),
  body('notifications.email.referralUpdates').optional().isBoolean(),
  body('notifications.email.systemUpdates').optional().isBoolean(),
  body('notifications.email.marketing').optional().isBoolean(),
  body('notifications.email.weeklyDigest').optional().isBoolean(),
  body('notifications.email.monthlyReport').optional().isBoolean(),
  
  body('notifications.sms.enabled').optional().isBoolean(),
  body('notifications.sms.urgentMessages').optional().isBoolean(),
  body('notifications.sms.bookingReminders').optional().isBoolean(),
  body('notifications.sms.paymentAlerts').optional().isBoolean(),
  body('notifications.sms.securityAlerts').optional().isBoolean(),
  
  body('communication.preferredLanguage').optional().isIn(['en', 'fil', 'es', 'zh', 'ja', 'ko']),
  body('communication.timezone').optional().isString(),
  body('communication.dateFormat').optional().isIn(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  body('communication.timeFormat').optional().isIn(['12h', '24h']),
  body('communication.currency').optional().isIn(['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY']),
  body('communication.autoReply.enabled').optional().isBoolean(),
  body('communication.autoReply.message').optional().isString().isLength({ max: 500 }),
  
  body('service.defaultServiceRadius').optional().isInt({ min: 1, max: 100 }),
  body('service.autoAcceptJobs').optional().isBoolean(),
  body('service.minimumJobValue').optional().isFloat({ min: 0 }),
  body('service.maximumJobValue').optional().isFloat({ min: 0 }),
  body('service.preferredJobTypes').optional().isArray(),
  body('service.preferredJobTypes.*').optional().isIn(['cleaning', 'maintenance', 'repair', 'installation', 'consultation', 'other']),
  body('service.workingHours.start').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('service.workingHours.end').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('service.workingHours.days').optional().isArray(),
  body('service.workingHours.days.*').optional().isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  body('service.emergencyService.enabled').optional().isBoolean(),
  body('service.emergencyService.surcharge').optional().isFloat({ min: 0 }),
  
  body('payment.preferredPaymentMethod').optional().isIn(['paypal', 'paymaya', 'gcash', 'bank_transfer', 'cash']),
  body('payment.autoWithdraw.enabled').optional().isBoolean(),
  body('payment.autoWithdraw.threshold').optional().isFloat({ min: 0 }),
  body('payment.autoWithdraw.frequency').optional().isIn(['daily', 'weekly', 'monthly']),
  body('payment.invoiceSettings.includeTax').optional().isBoolean(),
  body('payment.invoiceSettings.taxRate').optional().isFloat({ min: 0, max: 100 }),
  body('payment.invoiceSettings.invoiceTemplate').optional().isIn(['standard', 'detailed', 'minimal']),
  
  body('security.twoFactorAuth.enabled').optional().isBoolean(),
  body('security.twoFactorAuth.method').optional().isIn(['sms', 'email', 'authenticator']),
  body('security.loginAlerts.enabled').optional().isBoolean(),
  body('security.loginAlerts.newDevice').optional().isBoolean(),
  body('security.loginAlerts.suspiciousActivity').optional().isBoolean(),
  body('security.sessionTimeout').optional().isInt({ min: 1, max: 168 }),
  body('security.passwordChangeReminder.enabled').optional().isBoolean(),
  body('security.passwordChangeReminder.frequency').optional().isInt({ min: 30, max: 365 }),
  
  body('app.theme').optional().isIn(['light', 'dark', 'auto']),
  body('app.fontSize').optional().isIn(['small', 'medium', 'large']),
  body('app.soundEffects.enabled').optional().isBoolean(),
  body('app.soundEffects.volume').optional().isInt({ min: 0, max: 100 }),
  body('app.hapticFeedback.enabled').optional().isBoolean(),
  body('app.autoSave.enabled').optional().isBoolean(),
  body('app.autoSave.interval').optional().isInt({ min: 10, max: 300 }),
  body('app.dataUsage.imageQuality').optional().isIn(['low', 'medium', 'high']),
  body('app.dataUsage.videoQuality').optional().isIn(['low', 'medium', 'high']),
  body('app.dataUsage.autoDownload').optional().isBoolean(),
  
  body('analytics.shareUsageData').optional().isBoolean(),
  body('analytics.shareLocationData').optional().isBoolean(),
  body('analytics.sharePerformanceData').optional().isBoolean(),
  body('analytics.personalizedRecommendations').optional().isBoolean()
];

const validateAppSettings = [
  body('general.appName').optional().isString().isLength({ max: 100 }),
  body('general.appVersion').optional().isString(),
  body('general.environment').optional().isIn(['development', 'staging', 'production']),
  body('general.maintenanceMode.enabled').optional().isBoolean(),
  body('general.maintenanceMode.message').optional().isString().isLength({ max: 500 }),
  body('general.maintenanceMode.estimatedEndTime').optional().isISO8601(),
  body('general.forceUpdate.enabled').optional().isBoolean(),
  body('general.forceUpdate.minVersion').optional().isString(),
  body('general.forceUpdate.message').optional().isString().isLength({ max: 500 }),
  
  body('business.companyName').optional().isString().isLength({ max: 100 }),
  body('business.companyEmail').optional().isEmail(),
  body('business.companyPhone').optional().isString(),
  body('business.companyAddress.street').optional().isString(),
  body('business.companyAddress.city').optional().isString(),
  body('business.companyAddress.state').optional().isString(),
  body('business.companyAddress.zipCode').optional().isString(),
  body('business.companyAddress.country').optional().isString(),
  body('business.businessHours.timezone').optional().isString(),
  body('business.businessHours.schedule').optional().isArray(),
  body('business.businessHours.schedule.*.day').optional().isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  body('business.businessHours.schedule.*.startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('business.businessHours.schedule.*.endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('business.businessHours.schedule.*.isOpen').optional().isBoolean(),
  
  body('features.marketplace.enabled').optional().isBoolean(),
  body('features.marketplace.allowNewProviders').optional().isBoolean(),
  body('features.marketplace.requireVerification').optional().isBoolean(),
  body('features.academy.enabled').optional().isBoolean(),
  body('features.academy.allowNewCourses').optional().isBoolean(),
  body('features.academy.requireInstructorVerification').optional().isBoolean(),
  body('features.jobBoard.enabled').optional().isBoolean(),
  body('features.jobBoard.allowNewJobs').optional().isBoolean(),
  body('features.jobBoard.requireCompanyVerification').optional().isBoolean(),
  body('features.referrals.enabled').optional().isBoolean(),
  body('features.referrals.rewardAmount').optional().isFloat({ min: 0 }),
  body('features.referrals.maxReferralsPerUser').optional().isInt({ min: 0 }),
  
  body('security.passwordPolicy.minLength').optional().isInt({ min: 6, max: 20 }),
  body('security.passwordPolicy.requireUppercase').optional().isBoolean(),
  body('security.passwordPolicy.requireLowercase').optional().isBoolean(),
  body('security.passwordPolicy.requireNumbers').optional().isBoolean(),
  body('security.passwordPolicy.requireSpecialChars').optional().isBoolean(),
  body('security.passwordPolicy.maxLoginAttempts').optional().isInt({ min: 3, max: 10 }),
  body('security.passwordPolicy.lockoutDuration').optional().isInt({ min: 5, max: 60 }),
  
  body('uploads.maxFileSize').optional().isInt({ min: 1048576, max: 104857600 }),
  body('uploads.allowedImageTypes').optional().isArray(),
  body('uploads.allowedImageTypes.*').optional().isIn(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  body('uploads.allowedDocumentTypes').optional().isArray(),
  body('uploads.allowedDocumentTypes.*').optional().isIn(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  body('uploads.maxImagesPerUpload').optional().isInt({ min: 1, max: 50 }),
  body('uploads.imageCompression.enabled').optional().isBoolean(),
  body('uploads.imageCompression.quality').optional().isInt({ min: 10, max: 100 }),
  
  body('payments.defaultCurrency').optional().isIn(['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY']),
  body('payments.supportedCurrencies').optional().isArray(),
  body('payments.supportedCurrencies.*').optional().isIn(['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY']),
  body('payments.transactionFees.percentage').optional().isFloat({ min: 0, max: 10 }),
  body('payments.transactionFees.fixed').optional().isFloat({ min: 0, max: 10 }),
  body('payments.minimumPayout').optional().isFloat({ min: 0 }),
  body('payments.payoutSchedule.frequency').optional().isIn(['daily', 'weekly', 'monthly']),
  body('payments.payoutSchedule.dayOfWeek').optional().isInt({ min: 0, max: 6 }),
  body('payments.payoutSchedule.dayOfMonth').optional().isInt({ min: 1, max: 31 })
];

const validateCategory = [
  param('category').isIn([
    'privacy', 'notifications', 'communication', 'service', 'payment', 
    'security', 'app', 'analytics', 'general', 'business', 'features', 
    'uploads', 'payments', 'rateLimiting', 'notifications', 'integrations'
  ])
];

// User Settings Routes
router.get('/user', auth, getUserSettings);
router.put('/user', auth, validateUserSettings, updateUserSettings);
router.put('/user/:category', auth, validateCategory, validateUserSettings, updateUserSettingsCategory);
router.post('/user/reset', auth, resetUserSettings);
router.delete('/user', auth, deleteUserSettings);

// App Settings Routes (Admin only)
router.get('/app', auth, getAppSettings);
router.put('/app', auth, validateAppSettings, updateAppSettings);
router.put('/app/:category', auth, validateCategory, validateAppSettings, updateAppSettingsCategory);
router.post('/app/features/toggle', auth, [
  body('feature').isString(),
  body('enabled').isBoolean()
], toggleFeatureFlag);

// Public App Settings Routes (No auth required)
router.get('/', getPublicAppSettings); // Basic settings info
router.get('/app/public', getPublicAppSettings);
router.get('/app/health', getAppHealth);

module.exports = router;
