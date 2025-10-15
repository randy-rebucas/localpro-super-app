const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  submitVerificationRequest,
  getVerificationRequests,
  reviewVerificationRequest,
  getTrustScore,
  createDispute,
  getDisputes,
  resolveDispute
} = require('../controllers/trustVerificationController');

// @route   POST /api/trust-verification/verify
// @desc    Submit verification request
// @access  Private
router.post('/verify', auth, submitVerificationRequest);

// @route   GET /api/trust-verification/requests
// @desc    Get user verification requests
// @access  Private
router.get('/requests', auth, getVerificationRequests);

// @route   PUT /api/trust-verification/requests/:id/review
// @desc    Review verification request (Admin only)
// @access  Private (Admin)
router.put('/requests/:id/review', auth, authorize('admin'), reviewVerificationRequest);

// @route   GET /api/trust-verification/trust-score
// @desc    Get user trust score and events
// @access  Private
router.get('/trust-score', auth, getTrustScore);

// @route   POST /api/trust-verification/disputes
// @desc    Create dispute
// @access  Private
router.post('/disputes', auth, createDispute);

// @route   GET /api/trust-verification/disputes
// @desc    Get user disputes
// @access  Private
router.get('/disputes', auth, getDisputes);

// @route   PUT /api/trust-verification/disputes/:id/resolve
// @desc    Resolve dispute (Admin only)
// @access  Private (Admin)
router.put('/disputes/:id/resolve', auth, authorize('admin'), resolveDispute);

module.exports = router;
