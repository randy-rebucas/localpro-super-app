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

// ==================== Public Escrow Routes ====================

// Get user's escrows (client or provider)
router.get('/', getEscrows);

// Get escrow details
router.get('/:id', getEscrowDetails);

// Get escrow transaction history (audit log)
router.get('/:id/transactions', getEscrowTransactions);

// Get payout details
router.get('/:id/payout', getPayoutDetails);

// ==================== Client Routes ====================

// Create new escrow
router.post('/create', createEscrow);

// Capture held payment (client approval)
router.post('/:id/capture', capturePayment);

// Refund payment (before capture)
router.post('/:id/refund', refundPayment);

// Initiate dispute
router.post('/:id/dispute', initiateDispute);

// ==================== Provider Routes ====================

// Upload proof of work
router.post('/:id/proof-of-work', uploadProofOfWork);

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
