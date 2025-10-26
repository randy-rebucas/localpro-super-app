const { Conversation, Message, Notification } = require('../models/Communication');
const EmailService = require('../services/emailService');
const TwilioService = require('../services/twilioService');
const logger = require('../utils/logger');


// @desc    Get user conversations
// @route   GET /api/communication/conversations
// @access  Private
const getConversations = async(req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      'participants.user': req.user.id
    })
      .populate('participants.user', 'firstName lastName profile.avatar profile.isOnline')
      .populate('lastMessage.sender', 'firstName lastName profile.avatar')
      .select('-messages') // Exclude full messages for list view
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(); // Use lean() for better performance

    const total = await Conversation.countDocuments({
      'participants.user': req.user.id
    });

    res.status(200).json({
      success: true,
      count: conversations.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: conversations
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single conversation
// @route   GET /api/communication/conversations/:id
// @access  Private
const getConversation = async(req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants.user', 'firstName lastName profile.avatar')
      .populate('lastMessage.sender', 'firstName lastName profile.avatar');

    // Get messages separately
    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.some(p => p.user._id.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this conversation'
      });
    }

    // Mark messages as read for this user
    await Message.updateMany(
      {
        conversation: req.params.id,
        'readBy.user': { $ne: req.user.id }
      },
      {
        $push: {
          readBy: {
            user: req.user.id,
            readAt: new Date()
          }
        }
      }
    );

    // Add messages to conversation object
    conversation.messages = messages;

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new conversation
// @route   POST /api/communication/conversations
// @access  Private
const createConversation = async(req, res) => {
  try {
    const { participants, type = 'direct' } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Participants are required'
      });
    }

    // Add current user to participants
    const allParticipants = [...new Set([req.user.id, ...participants])];

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      'participants.user': { $all: allParticipants },
      type
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        message: 'Conversation already exists',
        data: existingConversation
      });
    }

    // Create participants array with user and role
    const participantsArray = allParticipants.map(userId => ({
      user: userId,
      role: userId === req.user.id ? 'client' : 'client' // Default role, can be customized
    }));

    const conversation = await Conversation.create({
      participants: participantsArray,
      type,
      subject: req.body.subject || 'New Conversation',
      context: req.body.context || {}
    });

    await conversation.populate('participants.user', 'firstName lastName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation
    });
  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send message
// @route   POST /api/communication/conversations/:id/messages
// @access  Private
const sendMessage = async(req, res) => {
  try {
    const { content, type = 'text' } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.some(p => p.user.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this conversation'
      });
    }

    // Create message in separate Message model
    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user.id,
      content,
      type,
      metadata: {},
      readBy: [{
        user: req.user.id,
        readAt: new Date()
      }]
    });

    // Update conversation's last message
    conversation.lastMessage = {
      content: message.content,
      sender: message.sender,
      timestamp: message.createdAt
    };
    conversation.updatedAt = new Date();

    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'firstName lastName profile.avatar');

    // Send push notification to other participants
    // const otherParticipants = conversation.participants.filter(p => p.user.toString() !== req.user.id);

    // TODO: Implement push notification service
    // await PushNotificationService.sendNotification({
    //   recipients: otherParticipants,
    //   title: 'New Message',
    //   body: content,
    //   data: { conversationId: conversation._id }
    // });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/communication/conversations/:id/read
// @access  Private
const markAsRead = async(req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.some(p => p.user.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark messages as read in this conversation'
      });
    }

    // Mark all messages as read for this user
    await Message.updateMany(
      {
        conversation: req.params.id,
        'readBy.user': { $ne: req.user.id }
      },
      {
        $push: {
          readBy: {
            user: req.user.id,
            readAt: new Date()
          }
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete conversation
// @route   DELETE /api/communication/conversations/:id
// @access  Private
const deleteConversation = async(req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.some(p => p.user.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this conversation'
      });
    }

    // Delete all messages in this conversation
    await Message.deleteMany({ conversation: req.params.id });

    // Delete the conversation
    await Conversation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    logger.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send email notification
// @route   POST /api/communication/email
// @access  Private
const sendEmailNotification = async(req, res) => {
  try {
    const { to, subject, template, data } = req.body;

    if (!to || !subject || !template) {
      return res.status(400).json({
        success: false,
        message: 'To, subject, and template are required'
      });
    }

    const result = await EmailService.sendEmail({
      to,
      subject,
      template,
      data
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    logger.error('Send email notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send SMS notification
// @route   POST /api/communication/sms
// @access  Private
const sendSMSNotification = async(req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'To and message are required'
      });
    }

    const result = await TwilioService.sendSMS(to, message);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send SMS',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'SMS sent successfully'
    });
  } catch (error) {
    logger.error('Send SMS notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/communication/unread-count
// @access  Private
const getUnreadCount = async(req, res) => {
  try {
    // Get all conversations for the user
    const conversations = await Conversation.find({
      'participants.user': req.user.id
    });

    const conversationIds = conversations.map(conv => conv._id);

    // Count unread messages
    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      'readBy.user': { $ne: req.user.id }
    });

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search conversations
// @route   GET /api/communication/search
// @access  Private
const searchConversations = async(req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // First find conversations with messages matching the query
    const matchingMessages = await Message.find({
      content: new RegExp(query, 'i')
    }).select('conversation');

    const conversationIds = [...new Set(matchingMessages.map(msg => msg.conversation))];

    const conversations = await Conversation.find({
      'participants.user': req.user.id,
      _id: { $in: conversationIds }
    })
      .populate('participants.user', 'firstName lastName profile.avatar')
      .populate('lastMessage.sender', 'firstName lastName profile.avatar')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Conversation.countDocuments({
      'participants.user': req.user.id,
      _id: { $in: conversationIds }
    });

    res.status(200).json({
      success: true,
      count: conversations.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: conversations
    });
  } catch (error) {
    logger.error('Search conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get conversation with user
// @route   GET /api/communication/conversation-with/:userId
// @access  Private
const getConversationWithUser = async(req, res) => {
  try {
    const { userId } = req.params;

    const conversation = await Conversation.findOne({
      'participants.user': { $all: [req.user.id, userId] },
      type: 'general' // Changed from 'direct' to match schema
    })
      .populate('participants.user', 'firstName lastName profile.avatar')
      .populate('lastMessage.sender', 'firstName lastName profile.avatar');

    // Get messages separately if conversation exists
    let messages = [];
    if (conversation) {
      messages = await Message.find({ conversation: conversation._id })
        .populate('sender', 'firstName lastName profile.avatar')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Add messages to conversation object
    conversation.messages = messages;

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error('Get conversation with user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update message
// @route   PUT /api/communication/conversations/:id/messages/:messageId
// @access  Private
const updateMessage = async(req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.some(p => p.user.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update messages in this conversation'
      });
    }

    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this message'
      });
    }

    message.content = content;
    message.metadata.isEdited = true;
    message.metadata.editedAt = new Date();

    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    logger.error('Update message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/communication/conversations/:id/messages/:messageId
// @access  Private
const deleteMessage = async(req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.some(p => p.user.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete messages in this conversation'
      });
    }

    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    // Soft delete the message
    message.metadata.isDeleted = true;
    message.metadata.deletedAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user notifications
// @route   GET /api/communication/notifications
// @access  Private
const getUserNotifications = async(req, res) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {
      user: req.user.id,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    // Add filters
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: notifications
    });
  } catch (error) {
    logger.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/communication/notifications/:notificationId/read
// @access  Private
const markNotificationAsRead = async(req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/communication/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = async(req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        user: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/communication/notifications/:notificationId
// @access  Private
const deleteNotification = async(req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get notification count
// @route   GET /api/communication/notifications/count
// @access  Private
const getNotificationCount = async(req, res) => {
  try {
    const { isRead } = req.query;

    const query = {
      user: req.user.id,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const count = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    logger.error('Get notification count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
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
};
