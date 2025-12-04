const express = require('express');
const router = express.Router();
const multer = require('multer');
const CloudinaryStorage = require('multer-storage-cloudinary');
const cloudinaryModule = require('cloudinary');
const liveChatController = require('../controllers/liveChatController');

// Configure Cloudinary storage for file uploads
// Note: multer-storage-cloudinary expects the full cloudinary module (with .v2)
const storage = new CloudinaryStorage({
  cloudinary: cloudinaryModule,
  params: {
    folder: 'localpro/live-chat/attachments',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
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
 * @route   POST /api/live-chat/sessions
 * @desc    Create new chat session
 * @access  Public
 */
router.post('/sessions', liveChatController.createSession);

/**
 * @route   GET /api/live-chat/sessions/:sessionId
 * @desc    Get session details
 * @access  Public (with session ID)
 */
router.get('/sessions/:sessionId', liveChatController.getSession);

/**
 * @route   POST /api/live-chat/sessions/:sessionId/messages
 * @desc    Send message (user)
 * @access  Public (with session ID)
 */
router.post(
  '/sessions/:sessionId/messages',
  upload.array('files', 5),
  liveChatController.sendMessage
);

/**
 * @route   GET /api/live-chat/sessions/:sessionId/messages
 * @desc    Get messages for a session
 * @access  Public (with session ID)
 */
router.get('/sessions/:sessionId/messages', liveChatController.getMessages);

/**
 * @route   POST /api/live-chat/upload
 * @desc    Upload attachment
 * @access  Public (with session ID in body)
 */
router.post(
  '/upload',
  upload.array('files', 5),
  liveChatController.uploadAttachment
);

/**
 * @route   PATCH /api/live-chat/sessions/:sessionId/end
 * @desc    End chat session (user initiated)
 * @access  Public (with session ID)
 */
router.patch('/sessions/:sessionId/end', liveChatController.endSession);

/**
 * @route   POST /api/live-chat/sessions/:sessionId/rate
 * @desc    Rate chat session
 * @access  Public (with session ID)
 */
router.post('/sessions/:sessionId/rate', liveChatController.rateSession);

/**
 * @route   POST /api/live-chat/sessions/:sessionId/typing
 * @desc    Send typing indicator (user)
 * @access  Public (with session ID)
 */
router.post('/sessions/:sessionId/typing', liveChatController.sendTypingIndicator);

module.exports = router;

