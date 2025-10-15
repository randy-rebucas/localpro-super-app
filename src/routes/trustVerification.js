const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getTrustVerificationRequests,
  getTrustVerificationRequest,
  createTrustVerificationRequest,
  updateTrustVerificationRequest,
  reviewTrustVerificationRequest,
  deleteTrustVerificationRequest,
  uploadVerificationDocuments,
  deleteVerificationDocument,
  getMyTrustVerificationRequests,
  getTrustVerificationStatistics,
  getVerifiedUsers
} = require('../controllers/trustVerificationController');

const router = express.Router();

// Public routes
router.get('/verified-users', getVerifiedUsers);

// Protected routes
router.use(auth);

// Verification request routes
router.get('/requests', getTrustVerificationRequests);
router.get('/requests/:id', getTrustVerificationRequest);
router.post('/requests', createTrustVerificationRequest);
router.put('/requests/:id', updateTrustVerificationRequest);
router.delete('/requests/:id', deleteTrustVerificationRequest);

// Document management routes
router.post('/requests/:id/documents', uploadVerificationDocuments);
router.delete('/requests/:id/documents/:documentId', deleteVerificationDocument);

// User-specific routes
router.get('/my-requests', getMyTrustVerificationRequests);

// Admin routes
router.put('/requests/:id/review', authorize('admin'), reviewTrustVerificationRequest);
router.get('/statistics', authorize('admin'), getTrustVerificationStatistics);

module.exports = router;