const { Conversation, Message, Notification } = require('../models/Communication');
const User = require('../models/User');
const { Booking } = require('../models/Marketplace');

// @desc    Create or get conversation
// @route   POST /api/communication/conversations
// @access  Private
const createOrGetConversation = async (req, res) => {
  try {
    const { participantId, bookingId, type = 'general', subject } = req.body;
    const userId = req.user.id;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: {
        $all: [
          { $elemMatch: { user: userId } },
          { $elemMatch: { user: participantId } }
        ]
      },
      booking: bookingId || null
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [
          { user: userId, role: req.user.role },
          { user: participantId, role: 'client' } // This should be determined based on user role
        ],
        booking: bookingId,
        type: type,
        subject: subject
      });
    }

    await conversation.populate([
      { path: 'participants.user', select: 'firstName lastName profile.avatar' },
      { path: 'booking', select: 'service status' }
    ]);

    res.status(200).json({
      success: true,
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

// @desc    Get user conversations
// @route   GET /api/communication/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'active', type } = req.query;

    const filter = {
      'participants.user': userId,
      status: status
    };

    if (type) filter.type = type;

    const conversations = await Conversation.find(filter)
      .populate('participants.user', 'firstName lastName profile.avatar')
      .populate('booking', 'service status')
      .populate('lastMessage.sender', 'firstName lastName')
      .sort({ 'lastMessage.timestamp': -1 });

    res.status(200).json({
      success: true,
      count: conversations.length,
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

// @desc    Send message
// @route   POST /api/communication/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text', attachments } = req.body;
    const senderId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === senderId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content: content,
      type: type,
      attachments: attachments || []
    });

    // Update conversation
    conversation.lastMessage = {
      content: content,
      sender: senderId,
      timestamp: new Date()
    };
    conversation.unreadCount += 1;
    await conversation.save();

    // Create notifications for other participants
    const otherParticipants = conversation.participants.filter(
      p => p.user.toString() !== senderId
    );

    for (const participant of otherParticipants) {
      await Notification.create({
        user: participant.user,
        type: 'message_received',
        title: 'New Message',
        message: `You have a new message from ${req.user.firstName}`,
        data: {
          conversationId: conversationId,
          messageId: message._id,
          senderId: senderId
        },
        channels: {
          inApp: true,
          push: true
        }
      });
    }

    await message.populate('sender', 'firstName lastName profile.avatar');

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

// @desc    Get conversation messages
// @route   GET /api/communication/conversations/:id/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({
      conversation: conversationId,
      'deleted.isDeleted': false
    })
      .populate('sender', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: { readBy: { user: userId, readAt: new Date() } },
        $set: { isRead: true }
      }
    );

    // Update conversation unread count
    conversation.unreadCount = 0;
    conversation.participants.forEach(p => {
      if (p.user.toString() === userId) {
        p.lastReadAt = new Date();
      }
    });
    await conversation.save();

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.reverse()
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user notifications
// @route   GET /api/communication/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isRead, type, page = 1, limit = 20 } = req.query;

    const filter = { user: userId };
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (type) filter.type = type;

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/communication/notifications/:id/read
// @access  Private
const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId
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
    const userId = req.user.id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createOrGetConversation,
  getConversations,
  sendMessage,
  getMessages,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
