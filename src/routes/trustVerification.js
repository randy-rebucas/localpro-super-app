const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const {
  getVerificationRequestRequests,
  getVerificationRequestRequest,
  createVerificationRequestRequest,
  updateVerificationRequestRequest,
  reviewVerificationRequestRequest,
  deleteVerificationRequestRequest,
  uploadVerificationDocuments,
  deleteVerificationDocument,
  getMyVerificationRequestRequests,
  getVerificationRequestStatistics,
  getVerifiedUsers
} = require('../controllers/trustVerificationController');

const router = express.Router();

// Public routes
router.get('/verified-users', getVerifiedUsers);

// Protected routes
router.use(auth);

// Verification request routes
router.get('/requests', getVerificationRequestRequests);
router.get('/requests/:id', getVerificationRequestRequest);
router.post('/requests', createVerificationRequestRequest);
router.put('/requests/:id', updateVerificationRequestRequest);
router.delete('/requests/:id', deleteVerificationRequestRequest);

// Document management routes
router.post('/requests/:id/documents', uploadVerificationDocuments);
router.delete('/requests/:id/documents/:documentId', deleteVerificationDocument);

// User-specific routes
router.get('/my-requests', getMyVerificationRequestRequests);

// Admin routes - [ADMIN ONLY]
router.put('/requests/:id/review', authorize('admin'), reviewVerificationRequestRequest);
router.get('/statistics', authorize('admin'), getVerificationRequestStatistics);

module.exports = router;