const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinaryStorage = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary');
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

// Configure multer with size limits
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
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
// PUBLIC ROUTES (No Authentication Required)
// ============================================

/**
 * @swagger
 * /api/live-chat/sessions:
 *   post:
 *     summary: Create new chat session
 *     tags: [Live Chat]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Session created
 */
router.post('/sessions', liveChatController.createSession);

/**
 * @swagger
 * /api/live-chat/sessions/{sessionId}:
 *   get:
 *     summary: Get session details
 *     tags: [Live Chat]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/sessions/:sessionId', liveChatController.getSession);

/**
 * @swagger
 * /api/live-chat/sessions/{sessionId}/messages:
 *   post:
 *     summary: Send message (user)
 *     tags: [Live Chat]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Message sent
 *   get:
 *     summary: Get messages for a session
 *     tags: [Live Chat]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
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
 *         description: List of messages
 */
router.post(
  '/sessions/:sessionId/messages',
  upload.array('files', 5),
  liveChatController.sendMessage
);
router.get('/sessions/:sessionId/messages', liveChatController.getMessages);

/**
 * @swagger
 * /api/live-chat/upload:
 *   post:
 *     summary: Upload attachment
 *     tags: [Live Chat]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded
 */
router.post(
  '/upload',
  upload.array('files', 5),
  liveChatController.uploadAttachment
);

/**
 * @swagger
 * /api/live-chat/sessions/{sessionId}/end:
 *   patch:
 *     summary: End chat session (user initiated)
 *     tags: [Live Chat]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session ended
 */
router.patch('/sessions/:sessionId/end', liveChatController.endSession);

/**
 * @swagger
 * /api/live-chat/sessions/{sessionId}/rate:
 *   post:
 *     summary: Rate chat session
 *     tags: [Live Chat]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rating submitted
 */
router.post('/sessions/:sessionId/rate', liveChatController.rateSession);

/**
 * @swagger
 * /api/live-chat/sessions/{sessionId}/typing:
 *   post:
 *     summary: Send typing indicator (user)
 *     tags: [Live Chat]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Typing indicator sent
 */
router.post('/sessions/:sessionId/typing', liveChatController.sendTypingIndicator);

module.exports = router;

