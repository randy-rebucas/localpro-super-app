const express = require('express');
const { auth } = require('../middleware/auth');
const { uploaders } = require('../config/cloudinary');
const {
  getConversations,
  getConversation,
  createConversation,
  getMessages,
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

/**
 * @swagger
 * /api/communication/conversations:
 *   get:
 *     summary: Get user conversations
 *     tags: [Communication]
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
 *     responses:
 *       200:
 *         description: List of conversations
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Create a new conversation
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantId
 *             properties:
 *               participantId:
 *                 type: string
 *                 format: ObjectId
 *               initialMessage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conversation created
 */
// Conversation routes
router.get('/conversations', getConversations);

/**
 * @swagger
 * /api/communication/conversations/{id}:
 *   get:
 *     summary: Get conversation by ID
 *     tags: [Communication]
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
 *         description: Conversation details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete conversation
 *     tags: [Communication]
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
 *         description: Conversation deleted
 */
router.get('/conversations/:id', getConversation);
router.post('/conversations', createConversation);
router.delete('/conversations/:id', deleteConversation);

/**
 * @swagger
 * /api/communication/conversations/{id}/messages:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
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
 *   post:
 *     summary: Send a message
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               content:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Message sent
 */
// Message routes
router.get('/conversations/:id/messages', getMessages);
// Allow file uploads (images and documents) - max 5 files, 10MB each
router.post('/conversations/:id/messages', uploaders.communication.array('attachments', 5), sendMessage);

/**
 * @swagger
 * /api/communication/conversations/{id}/messages/{messageId}:
 *   put:
 *     summary: Update a message
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Message updated
 *   delete:
 *     summary: Delete a message
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Message deleted
 */
router.put('/conversations/:id/messages/:messageId', updateMessage);
router.delete('/conversations/:id/messages/:messageId', deleteMessage);

/**
 * @swagger
 * /api/communication/conversations/{id}/read:
 *   put:
 *     summary: Mark conversation as read
 *     tags: [Communication]
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
 *         description: Conversation marked as read
 */
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