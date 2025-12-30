const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  createEscrow,
  capturePayment,
  refundPayment,
  processPayout,
  uploadProofOfWork,
  initiateDispute,
  resolveDispute,
  getEscrowDetails,
  getEscrows,
  getAllEscrows,
  getEscrowTransactions,
  getPayoutDetails,
  getEscrowStats
} = require('../controllers/escrowController');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/escrows:
 *   get:
 *     summary: Get user's escrows
 *     tags: [Escrows]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled, disputed]
 *     responses:
 *       200:
 *         description: List of escrows
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// ==================== Public Escrow Routes ====================

// Get user's escrows (client or provider)
router.get('/', getEscrows);

/**
 * @swagger
 * /api/escrows/{id}:
 *   get:
 *     summary: Get escrow details
 *     tags: [Escrows]
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
 *         description: Escrow details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Get escrow details
router.get('/:id', getEscrowDetails);

// Get escrow transaction history (audit log)
router.get('/:id/transactions', getEscrowTransactions);

// Get payout details
router.get('/:id/payout', getPayoutDetails);

// ==================== Client Routes ====================

/**
 * @swagger
 * /api/escrows/create:
 *   post:
 *     summary: Create a new escrow
 *     tags: [Escrows]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - providerId
 *               - serviceId
 *             properties:
 *               amount:
 *                 type: number
 *               providerId:
 *                 type: string
 *                 format: ObjectId
 *               serviceId:
 *                 type: string
 *                 format: ObjectId
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Escrow created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Create new escrow
router.post('/create', createEscrow);

/**
 * @swagger
 * /api/escrows/{id}/capture:
 *   post:
 *     summary: Capture held payment (client approval)
 *     tags: [Escrows]
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
 *         description: Payment captured
 */
// Capture held payment (client approval)
router.post('/:id/capture', capturePayment);

/**
 * @swagger
 * /api/escrows/{id}/refund:
 *   post:
 *     summary: Refund payment (before capture)
 *     tags: [Escrows]
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
 *         description: Payment refunded
 */
// Refund payment (before capture)
router.post('/:id/refund', refundPayment);

/**
 * @swagger
 * /api/escrows/{id}/dispute:
 *   post:
 *     summary: Initiate dispute
 *     tags: [Escrows]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dispute initiated
 */
// Initiate dispute
router.post('/:id/dispute', initiateDispute);

// ==================== Provider Routes ====================

/**
 * @swagger
 * /api/escrows/{id}/proof-of-work:
 *   post:
 *     summary: Upload proof of work
 *     tags: [Escrows]
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
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proof of work uploaded
 */
// Upload proof of work
router.post('/:id/proof-of-work', uploadProofOfWork);

/**
 * @swagger
 * /api/escrows/{id}/payout:
 *   post:
 *     summary: Request payout
 *     tags: [Escrows]
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
 *         description: Payout requested
 */
// Request payout
router.post('/:id/payout', processPayout);

// ==================== Admin Routes ====================

// Get all escrows (admin)
router.get('/admin/all', authorize('admin'), getAllEscrows);

// Get escrow statistics
router.get('/admin/stats', authorize('admin'), getEscrowStats);

// Resolve dispute (admin)
router.post('/:id/dispute/resolve', authorize('admin'), resolveDispute);

module.exports = router;
