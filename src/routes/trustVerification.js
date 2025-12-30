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

/**
 * @swagger
 * /api/trust-verification/verified-users:
 *   get:
 *     summary: Get list of verified users
 *     tags: [Trust Verification]
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
 *     responses:
 *       200:
 *         description: List of verified users
 */
// Public routes
router.get('/verified-users', getVerifiedUsers);

// Protected routes
router.use(auth);

/**
 * @swagger
 * /api/trust-verification/requests:
 *   get:
 *     summary: Get verification requests
 *     tags: [Trust Verification]
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
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: List of verification requests
 *   post:
 *     summary: Create verification request
 *     tags: [Trust Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [identity, business, professional]
 *     responses:
 *       201:
 *         description: Request created
 */
// Verification request routes
router.get('/requests', getVerificationRequestRequests);

/**
 * @swagger
 * /api/trust-verification/requests/{id}:
 *   get:
 *     summary: Get verification request by ID
 *     tags: [Trust Verification]
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
 *         description: Request details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update verification request
 *     tags: [Trust Verification]
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
 *         description: Request updated
 *   delete:
 *     summary: Delete verification request
 *     tags: [Trust Verification]
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
 *         description: Request deleted
 */
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