const express = require('express');
const { body, param, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Controllers
const accountSecurityController = require('../controllers/accountSecurityController');
const oauthController = require('../controllers/oauthController');
const privacyController = require('../controllers/privacyController');

const router = express.Router();

// ============================================
// TWO-FACTOR AUTHENTICATION (2FA)
// ============================================

/**
 * @swagger
 * /api/account/2fa/setup:
 *   post:
 *     summary: Setup 2FA
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.post('/2fa/setup', auth, accountSecurityController.setup2FA);

/**
 * @swagger
 * /api/account/2fa/verify:
 *   post:
 *     summary: Verify and activate 2FA
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.post('/2fa/verify', auth,
  body('code').isLength({ min: 6, max: 8 }).withMessage('Code must be 6-8 characters'),
  accountSecurityController.verify2FA
);

/**
 * @swagger
 * /api/account/2fa:
 *   delete:
 *     summary: Disable 2FA
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/2fa', auth, accountSecurityController.disable2FA);

/**
 * @swagger
 * /api/account/2fa/status:
 *   get:
 *     summary: Get 2FA status
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.get('/2fa/status', auth, accountSecurityController.get2FAStatus);

/**
 * @swagger
 * /api/account/2fa/backup-codes:
 *   post:
 *     summary: Regenerate backup codes
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.post('/2fa/backup-codes', auth, accountSecurityController.regenerateBackupCodes);

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * @swagger
 * /api/account/sessions:
 *   get:
 *     summary: Get active sessions
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.get('/sessions', auth, accountSecurityController.getActiveSessions);

/**
 * @swagger
 * /api/account/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke a specific session
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/sessions/:sessionId', auth, accountSecurityController.revokeSession);

/**
 * @swagger
 * /api/account/sessions/revoke-all:
 *   post:
 *     summary: Revoke all sessions
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.post('/sessions/revoke-all', auth, accountSecurityController.revokeAllSessions);

// ============================================
// PASSWORD MANAGEMENT
// ============================================

/**
 * @swagger
 * /api/account/password/reset-request:
 *   post:
 *     summary: Request password reset
 *     tags: [Account Security]
 */
router.post('/password/reset-request', authLimiter,
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phoneNumber').optional().matches(/^\+[1-9]\d{1,14}$/).withMessage('Valid phone number required'),
  accountSecurityController.requestPasswordReset
);

/**
 * @swagger
 * /api/account/password/validate-token/{token}:
 *   get:
 *     summary: Validate password reset token
 *     tags: [Account Security]
 */
router.get('/password/validate-token/:token', accountSecurityController.validateResetToken);

/**
 * @swagger
 * /api/account/password/reset:
 *   post:
 *     summary: Reset password with token
 *     tags: [Account Security]
 */
router.post('/password/reset', authLimiter,
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  accountSecurityController.resetPassword
);

/**
 * @swagger
 * /api/account/password/change:
 *   post:
 *     summary: Change password (authenticated)
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.post('/password/change', auth,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  accountSecurityController.changePassword
);

// ============================================
// TRUSTED DEVICES
// ============================================

/**
 * @swagger
 * /api/account/trusted-devices:
 *   get:
 *     summary: Get trusted devices
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.get('/trusted-devices', auth, accountSecurityController.getTrustedDevices);

/**
 * @swagger
 * /api/account/trusted-devices:
 *   post:
 *     summary: Add trusted device
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.post('/trusted-devices', auth, accountSecurityController.addTrustedDevice);

/**
 * @swagger
 * /api/account/trusted-devices/{deviceId}:
 *   delete:
 *     summary: Remove trusted device
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/trusted-devices/:deviceId', auth, accountSecurityController.removeTrustedDevice);

// ============================================
// LOGIN HISTORY & SECURITY OVERVIEW
// ============================================

/**
 * @swagger
 * /api/account/login-history:
 *   get:
 *     summary: Get login history
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.get('/login-history', auth, accountSecurityController.getLoginHistory);

/**
 * @swagger
 * /api/account/security:
 *   get:
 *     summary: Get security overview
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 */
router.get('/security', auth, accountSecurityController.getSecurityOverview);

// ============================================
// OAUTH PROVIDERS
// ============================================

/**
 * @swagger
 * /api/account/oauth/providers:
 *   get:
 *     summary: Get connected OAuth providers
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/oauth/providers', auth, oauthController.getConnectedProviders);

/**
 * @swagger
 * /api/account/oauth/{provider}/connect:
 *   post:
 *     summary: Connect OAuth provider
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 */
router.post('/oauth/:provider/connect', auth,
  param('provider').isIn(['google', 'apple', 'facebook', 'github', 'microsoft', 'twitter', 'linkedin']),
  oauthController.connectProvider
);

/**
 * @swagger
 * /api/account/oauth/{provider}/disconnect:
 *   post:
 *     summary: Disconnect OAuth provider
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 */
router.post('/oauth/:provider/disconnect', auth,
  param('provider').isIn(['google', 'apple', 'facebook', 'github', 'microsoft', 'twitter', 'linkedin']),
  oauthController.disconnectProvider
);

/**
 * @swagger
 * /api/account/oauth/login:
 *   post:
 *     summary: Login with OAuth
 *     tags: [OAuth]
 */
router.post('/oauth/login', authLimiter, oauthController.loginWithOAuth);

// ============================================
// EXTERNAL IDS
// ============================================

/**
 * @swagger
 * /api/account/external-ids:
 *   get:
 *     summary: Get external IDs
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/external-ids', auth, oauthController.getExternalIds);

/**
 * @swagger
 * /api/account/external-ids:
 *   post:
 *     summary: Link external ID
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 */
router.post('/external-ids', auth,
  body('system').notEmpty().withMessage('System is required'),
  body('externalId').notEmpty().withMessage('External ID is required'),
  oauthController.linkExternalId
);

/**
 * @swagger
 * /api/account/external-ids/{system}:
 *   delete:
 *     summary: Unlink external ID
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/external-ids/:system', auth, oauthController.unlinkExternalId);

// ============================================
// PRIVACY & CONSENT
// ============================================

/**
 * @swagger
 * /api/account/privacy:
 *   get:
 *     summary: Get privacy settings overview
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.get('/privacy', auth, privacyController.getPrivacySettings);

/**
 * @swagger
 * /api/account/privacy/consent:
 *   get:
 *     summary: Get consent status
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.get('/privacy/consent', auth, privacyController.getConsentStatus);

/**
 * @swagger
 * /api/account/privacy/consent/gdpr:
 *   post:
 *     summary: Give GDPR consent
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.post('/privacy/consent/gdpr', auth,
  body('version').notEmpty().withMessage('Consent version is required'),
  privacyController.giveGdprConsent
);

/**
 * @swagger
 * /api/account/privacy/consent/gdpr:
 *   delete:
 *     summary: Withdraw GDPR consent
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/privacy/consent/gdpr', auth, privacyController.withdrawGdprConsent);

/**
 * @swagger
 * /api/account/privacy/consent/marketing:
 *   put:
 *     summary: Update marketing consent
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.put('/privacy/consent/marketing', auth, privacyController.updateMarketingConsent);

/**
 * @swagger
 * /api/account/privacy/do-not-sell:
 *   put:
 *     summary: Set Do Not Sell preference (CCPA)
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.put('/privacy/do-not-sell', auth,
  body('doNotSell').isBoolean().withMessage('doNotSell must be a boolean'),
  privacyController.setDoNotSell
);

/**
 * @swagger
 * /api/account/privacy/do-not-track:
 *   put:
 *     summary: Set Do Not Track preference
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.put('/privacy/do-not-track', auth,
  body('doNotTrack').isBoolean().withMessage('doNotTrack must be a boolean'),
  privacyController.setDoNotTrack
);

// ============================================
// ACCOUNT DELETION
// ============================================

/**
 * @swagger
 * /api/account/deletion:
 *   get:
 *     summary: Get account deletion status
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.get('/deletion', auth, privacyController.getDeletionStatus);

/**
 * @swagger
 * /api/account/deletion:
 *   post:
 *     summary: Request account deletion
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.post('/deletion', auth, privacyController.requestAccountDeletion);

/**
 * @swagger
 * /api/account/deletion:
 *   delete:
 *     summary: Cancel account deletion
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/deletion', auth, privacyController.cancelAccountDeletion);

// ============================================
// DATA EXPORT
// ============================================

/**
 * @swagger
 * /api/account/data/export:
 *   get:
 *     summary: Export user data
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.get('/data/export', auth, privacyController.exportUserData);

/**
 * @swagger
 * /api/account/data/download:
 *   get:
 *     summary: Download user data as JSON
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.get('/data/download', auth, privacyController.downloadUserData);

// ============================================
// AGREEMENTS
// ============================================

/**
 * @swagger
 * /api/account/agreements:
 *   get:
 *     summary: Get accepted agreements
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.get('/agreements', auth, privacyController.getAcceptedAgreements);

/**
 * @swagger
 * /api/account/agreements:
 *   post:
 *     summary: Accept an agreement
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.post('/agreements', auth,
  body('type').notEmpty().withMessage('Agreement type is required'),
  body('version').notEmpty().withMessage('Agreement version is required'),
  privacyController.acceptAgreement
);

/**
 * @swagger
 * /api/account/agreements/check:
 *   get:
 *     summary: Check if agreement is accepted
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 */
router.get('/agreements/check', auth,
  query('type').notEmpty().withMessage('Agreement type is required'),
  privacyController.checkAgreement
);

module.exports = router;
