const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  subscribeToPlan,
  confirmSubscriptionPayment,
  cancelSubscription,
  getMySubscription,
  updateSubscriptionSettings,
  getSubscriptionUsage,
  renewSubscription,
  getSubscriptionAnalytics,
  createManualSubscription,
  getAllSubscriptions,
  getSubscriptionByUserId,
  updateManualSubscription,
  deleteManualSubscription
} = require('../controllers/localproPlusController');

const router = express.Router();

/**
 * @swagger
 * /api/localpro-plus/plans:
 *   get:
 *     summary: Get subscription plans
 *     tags: [LocalPro Plus]
 *     security: []
 *     responses:
 *       200:
 *         description: List of subscription plans
 */
// Public routes
router.get('/plans', getPlans);

/**
 * @swagger
 * /api/localpro-plus/plans/{id}:
 *   get:
 *     summary: Get subscription plan by ID
 *     tags: [LocalPro Plus]
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
 *         description: Plan details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/plans/:id', getPlan);

// Protected routes
router.use(auth);

// Plan management routes (Admin only) - [ADMIN ONLY]
router.post('/plans', authorize('admin'), createPlan);
router.put('/plans/:id', authorize('admin'), updatePlan);
router.delete('/plans/:id', authorize('admin'), deletePlan);

/**
 * @swagger
 * /api/localpro-plus/subscribe/{planId}:
 *   post:
 *     summary: Subscribe to a plan
 *     tags: [LocalPro Plus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       201:
 *         description: Subscription created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Subscription routes
router.post('/subscribe/:planId', subscribeToPlan);

/**
 * @swagger
 * /api/localpro-plus/confirm-payment:
 *   post:
 *     summary: Confirm subscription payment
 *     tags: [LocalPro Plus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *             properties:
 *               paymentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed
 */
router.post('/confirm-payment', confirmSubscriptionPayment);

/**
 * @swagger
 * /api/localpro-plus/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [LocalPro Plus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled
 */
router.post('/cancel', cancelSubscription);

/**
 * @swagger
 * /api/localpro-plus/renew:
 *   post:
 *     summary: Renew subscription
 *     tags: [LocalPro Plus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription renewed
 */
router.post('/renew', renewSubscription);

/**
 * @swagger
 * /api/localpro-plus/my-subscription:
 *   get:
 *     summary: Get current user's subscription
 *     tags: [LocalPro Plus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// User subscription management
router.get('/my-subscription', getMySubscription);

/**
 * @swagger
 * /api/localpro-plus/settings:
 *   put:
 *     summary: Update subscription settings
 *     tags: [LocalPro Plus]
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
 *         description: Settings updated
 */
router.put('/settings', updateSubscriptionSettings);

/**
 * @swagger
 * /api/localpro-plus/usage:
 *   get:
 *     summary: Get subscription usage
 *     tags: [LocalPro Plus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics
 */
router.get('/usage', getSubscriptionUsage);

// Analytics routes (Admin only) - [ADMIN ONLY]
router.get('/analytics', authorize('admin'), getSubscriptionAnalytics);

// Admin subscription management routes (Admin only) - [ADMIN ONLY]
router.post('/admin/subscriptions', authorize('admin'), createManualSubscription);
router.get('/admin/subscriptions', authorize('admin'), getAllSubscriptions);
router.get('/admin/subscriptions/user/:userId', authorize('admin'), getSubscriptionByUserId);
router.put('/admin/subscriptions/:subscriptionId', authorize('admin'), updateManualSubscription);
router.delete('/admin/subscriptions/:subscriptionId', authorize('admin'), deleteManualSubscription);

module.exports = router;