const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getMyReferrals,
  getReferralStats,
  getReferralLinks,
  validateReferralCode,
  trackReferralClick,
  getReferralLeaderboard,
  sendReferralInvitation,
  updateReferralPreferences,
  getReferralRewards,
  processReferralCompletion,
  getReferralAnalytics
} = require('../controllers/referralController');

const router = express.Router();

/**
 * @swagger
 * /api/referrals/validate:
 *   post:
 *     summary: Validate referral code
 *     tags: [Referrals]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Code validation result
 */
// Public routes
router.post('/validate', validateReferralCode);

/**
 * @swagger
 * /api/referrals/track:
 *   post:
 *     summary: Track referral click
 *     tags: [Referrals]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Click tracked
 */
router.post('/track', trackReferralClick);

/**
 * @swagger
 * /api/referrals/leaderboard:
 *   get:
 *     summary: Get referral leaderboard
 *     tags: [Referrals]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Leaderboard
 */
router.get('/leaderboard', getReferralLeaderboard);

// Protected routes
router.use(auth);

/**
 * @swagger
 * /api/referrals/me:
 *   get:
 *     summary: Get my referrals
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
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
 *         description: My referrals
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// User referral management
router.get('/me', getMyReferrals);

/**
 * @swagger
 * /api/referrals/stats:
 *   get:
 *     summary: Get referral statistics
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral statistics
 */
router.get('/stats', getReferralStats);

/**
 * @swagger
 * /api/referrals/links:
 *   get:
 *     summary: Get referral links
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral links
 */
router.get('/links', getReferralLinks);

/**
 * @swagger
 * /api/referrals/rewards:
 *   get:
 *     summary: Get referral rewards
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Referral rewards
 */
router.get('/rewards', getReferralRewards);

/**
 * @swagger
 * /api/referrals/invite:
 *   post:
 *     summary: Send referral invitation
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation sent
 */
router.post('/invite', sendReferralInvitation);

/**
 * @swagger
 * /api/referrals/preferences:
 *   put:
 *     summary: Update referral preferences
 *     tags: [Referrals]
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
 *         description: Preferences updated
 */
router.put('/preferences', updateReferralPreferences);

// Admin/System routes - [ADMIN ONLY]
router.post('/process', authorize('admin'), processReferralCompletion);
router.get('/analytics', authorize('admin'), getReferralAnalytics);

module.exports = router;
