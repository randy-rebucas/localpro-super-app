const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createOrGetConversation,
  getConversations,
  sendMessage,
  getMessages,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../controllers/communicationController');

// @route   POST /api/communication/conversations
// @desc    Create or get conversation
// @access  Private
router.post('/conversations', auth, createOrGetConversation);

// @route   GET /api/communication/conversations
// @desc    Get user conversations
// @access  Private
router.get('/conversations', auth, getConversations);

// @route   POST /api/communication/messages
// @desc    Send message
// @access  Private
router.post('/messages', auth, sendMessage);

// @route   GET /api/communication/conversations/:id/messages
// @desc    Get conversation messages
// @access  Private
router.get('/conversations/:id/messages', auth, getMessages);

// @route   GET /api/communication/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', auth, getNotifications);

// @route   PUT /api/communication/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id/read', auth, markNotificationAsRead);

// @route   PUT /api/communication/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', auth, markAllNotificationsAsRead);

module.exports = router;
