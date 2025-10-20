const Communication = require('../models/Communication');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const TwilioService = require('../services/twilioService');

// @desc    Get user conversations
// @route   GET /api/communication/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await Communication.find({
      participants: req.user.id
    })
    .populate('participants', 'firstName lastName profile.avatar')
    .populate('lastMessage.sender', 'firstName lastName profile.avatar')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(Number(limit));

    const total = await Communication.countDocuments({
      participants: req.user.id
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
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single conversation
// @route   GET /api/communication/conversations/:id
// @access  Private
const getConversation = async (req, res) => {
  try {
    const conversation = await Communication.findById(req.params.id)
      .populate('participants', 'firstName lastName profile.avatar')
      .populate('messages.sender', 'firstName lastName profile.avatar');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this conversation'
      });
    }

    // Mark messages as read for this user
    conversation.messages.forEach(message => {
      if (!message.readBy.includes(req.user.id)) {
        message.readBy.push(req.user.id);
      }
    });

    await conversation.save();

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new conversation
// @route   POST /api/communication/conversations
// @access  Private
const createConversation = async (req, res) => {
  try {
    const { participants, type = 'direct', metadata = {} } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Participants are required'
      });
    }

    // Add current user to participants
    const allParticipants = [...new Set([req.user.id, ...participants])];

    // Check if conversation already exists
    const existingConversation = await Communication.findOne({
      participants: { $all: allParticipants },
      type
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        message: 'Conversation already exists',
        data: existingConversation
      });
    }

    const conversation = await Communication.create({
      participants: allParticipants,
      type,
      metadata,
      messages: []
    });

    await conversation.populate('participants', 'firstName lastName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send message
// @route   POST /api/communication/conversations/:id/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { content, type = 'text', metadata = {} } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const conversation = await Communication.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this conversation'
      });
    }

    const message = {
      sender: req.user.id,
      content,
      type,
      metadata,
      timestamp: new Date(),
      readBy: [req.user.id]
    };

    conversation.messages.push(message);
    conversation.lastMessage = message;
    conversation.updatedAt = new Date();

    await conversation.save();

    // Populate sender info
    await conversation.populate('lastMessage.sender', 'firstName lastName profile.avatar');

    // Send push notification to other participants
    const otherParticipants = conversation.participants.filter(p => p.toString() !== req.user.id);
    
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
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/communication/conversations/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const conversation = await Communication.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark messages as read in this conversation'
      });
    }

    // Mark all messages as read for this user
    conversation.messages.forEach(message => {
      if (!message.readBy.includes(req.user.id)) {
        message.readBy.push(req.user.id);
      }
    });

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete conversation
// @route   DELETE /api/communication/conversations/:id
// @access  Private
const deleteConversation = async (req, res) => {
  try {
    const conversation = await Communication.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this conversation'
      });
    }

    await Communication.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send email notification
// @route   POST /api/communication/email
// @access  Private
const sendEmailNotification = async (req, res) => {
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
    console.error('Send email notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send SMS notification
// @route   POST /api/communication/sms
// @access  Private
const sendSMSNotification = async (req, res) => {
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
    console.error('Send SMS notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/communication/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const conversations = await Communication.find({
      participants: req.user.id
    });

    let unreadCount = 0;

    conversations.forEach(conversation => {
      conversation.messages.forEach(message => {
        if (!message.readBy.includes(req.user.id)) {
          unreadCount++;
        }
      });
    });

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search conversations
// @route   GET /api/communication/search
// @access  Private
const searchConversations = async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const conversations = await Communication.find({
      participants: req.user.id,
      'messages.content': new RegExp(query, 'i')
    })
    .populate('participants', 'firstName lastName profile.avatar')
    .populate('lastMessage.sender', 'firstName lastName profile.avatar')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(Number(limit));

    const total = await Communication.countDocuments({
      participants: req.user.id,
      'messages.content': new RegExp(query, 'i')
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
    console.error('Search conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get conversation with user
// @route   GET /api/communication/conversation-with/:userId
// @access  Private
const getConversationWithUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversation = await Communication.findOne({
      participants: { $all: [req.user.id, userId] },
      type: 'direct'
    })
    .populate('participants', 'firstName lastName profile.avatar')
    .populate('messages.sender', 'firstName lastName profile.avatar');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get conversation with user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update message
// @route   PUT /api/communication/conversations/:id/messages/:messageId
// @access  Private
const updateMessage = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const conversation = await Communication.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update messages in this conversation'
      });
    }

    const message = conversation.messages.id(req.params.messageId);

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
    message.updatedAt = new Date();

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/communication/conversations/:id/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const conversation = await Communication.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is a participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete messages in this conversation'
      });
    }

    const message = conversation.messages.id(req.params.messageId);

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

    message.remove();
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user notifications
// @route   GET /api/communication/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
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

    const notifications = await Communication.Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Communication.Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: notifications
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/communication/notifications/:notificationId/read
// @access  Private
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Communication.Notification.findOne({
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
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/communication/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Communication.Notification.updateMany(
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
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/communication/notifications/:notificationId
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Communication.Notification.findOneAndDelete({
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
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get notification count
// @route   GET /api/communication/notifications/count
// @access  Private
const getNotificationCount = async (req, res) => {
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

    const count = await Communication.Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get notification count error:', error);
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