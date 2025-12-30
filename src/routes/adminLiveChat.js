const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinaryStorage = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary');
const { auth, authorize } = require('../middleware/auth');
const liveChatController = require('../controllers/liveChatController');

// Configure Cloudinary (must be done before creating storage)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for file uploads
// Note: multer-storage-cloudinary v2.x uses factory function (no 'new') with flat options
const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: 'localpro/live-chat/attachments',
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
  transformation: [
    { width: 1920, height: 1080, crop: 'limit' },
    { quality: 'auto' }
  ]
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  }
});

// ============================================
// ADMIN ROUTES (Authentication Required)
// ============================================

// Apply authentication middleware to all routes
router.use(auth);
router.use(authorize('admin', 'super_admin', 'support'));

/**
 * @swagger
 * /api/admin/live-chat/sessions:
 *   get:
 *     summary: Get all chat sessions
 *     tags: [Admin]
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
 *           enum: [active, closed, pending]
 *     responses:
 *       200:
 *         description: List of chat sessions
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/sessions', liveChatController.getAdminSessions);

/**
 * @swagger
 * /api/admin/live-chat/analytics:
 *   get:
 *     summary: Get chat analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *     responses:
 *       200:
 *         description: Chat analytics
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/analytics', authorize('admin', 'super_admin'), liveChatController.getAnalytics);

/**
 * @swagger
 * /api/admin/live-chat/sessions/{sessionId}:
 *   get:
 *     summary: Get single session details with messages
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Session details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete session (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Session deleted
 */
router.get('/sessions/:sessionId', liveChatController.getAdminSession);

/**
 * @swagger
 * /api/admin/live-chat/sessions/{sessionId}/reply:
 *   post:
 *     summary: Send agent reply
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *               message:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Reply sent
 */
router.post(
  '/sessions/:sessionId/reply',
  upload.array('files', 5),
  liveChatController.sendAgentReply
);

/**
 * @swagger
 * /api/admin/live-chat/sessions/{sessionId}/assign:
 *   patch:
 *     summary: Assign session to agent
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *               - agentId
 *             properties:
 *               agentId:
 *                 type: string
 *                 format: ObjectId
 *     responses:
 *       200:
 *         description: Session assigned
 */
router.patch('/sessions/:sessionId/assign', liveChatController.assignSession);

/**
 * @swagger
 * /api/admin/live-chat/sessions/{sessionId}/status:
 *   patch:
 *     summary: Update session status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, closed, pending]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/sessions/:sessionId/status', liveChatController.updateSessionStatus);

/**
 * @swagger
 * /api/admin/live-chat/sessions/{sessionId}/notes:
 *   post:
 *     summary: Add internal note to session
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note added
 */
router.post('/sessions/:sessionId/notes', liveChatController.addSessionNote);

/**
 * @swagger
 * /api/admin/live-chat/sessions/{sessionId}/transfer:
 *   post:
 *     summary: Transfer session to another agent
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *               - agentId
 *             properties:
 *               agentId:
 *                 type: string
 *                 format: ObjectId
 *     responses:
 *       200:
 *         description: Session transferred
 */
router.post('/sessions/:sessionId/transfer', liveChatController.transferSession);

/**
 * @swagger
 * /api/admin/live-chat/sessions/{sessionId}/typing:
 *   post:
 *     summary: Send typing indicator (agent)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Typing indicator sent
 */
router.post('/sessions/:sessionId/typing', liveChatController.sendTypingIndicator);

/**
 * @swagger
 * /api/admin/live-chat/customers/{email}/history:
 *   get:
 *     summary: Get customer chat history by email
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Customer chat history
 */
router.get('/customers/:email/history', liveChatController.getCustomerHistory);

router.delete('/sessions/:sessionId', authorize('admin', 'super_admin'), liveChatController.deleteSession);

module.exports = router;

