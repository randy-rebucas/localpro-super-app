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
 * @route   GET /api/admin/live-chat/sessions
 * @desc    Get all chat sessions
 * @access  Private (Admin/Support)
 */
router.get('/sessions', liveChatController.getAdminSessions);

/**
 * @route   GET /api/admin/live-chat/analytics
 * @desc    Get chat analytics
 * @access  Private (Admin)
 */
router.get('/analytics', authorize('admin', 'super_admin'), liveChatController.getAnalytics);

/**
 * @route   GET /api/admin/live-chat/sessions/:sessionId
 * @desc    Get single session details with messages
 * @access  Private (Admin/Support)
 */
router.get('/sessions/:sessionId', liveChatController.getAdminSession);

/**
 * @route   POST /api/admin/live-chat/sessions/:sessionId/reply
 * @desc    Send agent reply
 * @access  Private (Admin/Support)
 */
router.post(
  '/sessions/:sessionId/reply',
  upload.array('files', 5),
  liveChatController.sendAgentReply
);

/**
 * @route   PATCH /api/admin/live-chat/sessions/:sessionId/assign
 * @desc    Assign session to agent
 * @access  Private (Admin/Support)
 */
router.patch('/sessions/:sessionId/assign', liveChatController.assignSession);

/**
 * @route   PATCH /api/admin/live-chat/sessions/:sessionId/status
 * @desc    Update session status (close, reopen, etc.)
 * @access  Private (Admin/Support)
 */
router.patch('/sessions/:sessionId/status', liveChatController.updateSessionStatus);

/**
 * @route   POST /api/admin/live-chat/sessions/:sessionId/notes
 * @desc    Add internal note to session
 * @access  Private (Admin/Support)
 */
router.post('/sessions/:sessionId/notes', liveChatController.addSessionNote);

/**
 * @route   POST /api/admin/live-chat/sessions/:sessionId/transfer
 * @desc    Transfer session to another agent
 * @access  Private (Admin/Support)
 */
router.post('/sessions/:sessionId/transfer', liveChatController.transferSession);

/**
 * @route   POST /api/admin/live-chat/sessions/:sessionId/typing
 * @desc    Send typing indicator (agent)
 * @access  Private (Admin/Support)
 */
router.post('/sessions/:sessionId/typing', liveChatController.sendTypingIndicator);

/**
 * @route   GET /api/admin/live-chat/customers/:email/history
 * @desc    Get customer chat history by email
 * @access  Private (Admin/Support)
 */
router.get('/customers/:email/history', liveChatController.getCustomerHistory);

/**
 * @route   DELETE /api/admin/live-chat/sessions/:sessionId
 * @desc    Delete session
 * @access  Private (Admin)
 */
router.delete('/sessions/:sessionId', authorize('admin', 'super_admin'), liveChatController.deleteSession);

module.exports = router;

