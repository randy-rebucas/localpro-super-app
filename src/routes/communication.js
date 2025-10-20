const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getConversations,
  getConversation,
  createConversation,
  sendMessage,
  markAsRead,
  deleteConversation,
  sendEmailNotification,
  sendSMSNotification,
  getUnreadCount,
  searchConversations,
  getConversationWithUser,
  updateMessage,
  deleteMessage,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationCount
} = require('../controllers/communicationController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Conversation routes
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversation);
router.post('/conversations', createConversation);
router.delete('/conversations/:id', deleteConversation);

// Message routes
router.post('/conversations/:id/messages', sendMessage);
router.put('/conversations/:id/messages/:messageId', updateMessage);
router.delete('/conversations/:id/messages/:messageId', deleteMessage);

// Read status routes
router.put('/conversations/:id/read', markAsRead);

// Notification routes
router.get('/notifications', getUserNotifications);
router.get('/notifications/count', getNotificationCount);
router.put('/notifications/:notificationId/read', markNotificationAsRead);
router.put('/notifications/read-all', markAllNotificationsAsRead);
router.delete('/notifications/:notificationId', deleteNotification);
router.post('/notifications/email', sendEmailNotification);
router.post('/notifications/sms', sendSMSNotification);

// Utility routes
router.get('/unread-count', getUnreadCount);
router.get('/search', searchConversations);
router.get('/conversation-with/:userId', getConversationWithUser);

module.exports = router;