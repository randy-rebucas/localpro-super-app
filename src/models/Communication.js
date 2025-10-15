const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['client', 'provider', 'admin', 'support'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    }
  }],
  type: {
    type: String,
    enum: ['booking', 'job_application', 'support', 'general', 'agency'],
    default: 'general'
  },
  subject: {
    type: String,
    required: true
  },
  context: {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'closed', 'archived'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [String],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system', 'booking_update', 'payment_update'],
    default: 'text'
  },
  attachments: [{
    filename: String,
    url: String,
    publicId: String,
    mimeType: String,
    size: Number
  }],
  metadata: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'booking_created', 'booking_confirmed', 'booking_cancelled', 'booking_completed',
      'job_application', 'application_status_update', 'job_posted',
      'message_received', 'payment_received', 'payment_failed',
      'referral_reward', 'course_enrollment', 'order_confirmation',
      'subscription_renewal', 'subscription_cancelled', 'system_announcement'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  scheduledFor: Date,
  sentAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ type: 1, status: 1 });
conversationSchema.index({ 'context.bookingId': 1 });
conversationSchema.index({ 'context.jobId': 1 });
conversationSchema.index({ updatedAt: -1 });

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'readBy.user': 1 });

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });

// Virtual for unread message count
conversationSchema.virtual('unreadCount').get(function() {
  return this.participants.reduce((total, participant) => {
    return total + (participant.lastReadAt < this.lastMessage.timestamp ? 1 : 0);
  }, 0);
});

// Method to add participant
conversationSchema.methods.addParticipant = function(userId, role) {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  if (existingParticipant) {
    throw new Error('User is already a participant in this conversation');
  }
  
  this.participants.push({
    user: userId,
    role: role
  });
  
  return this.save();
};

// Method to remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

// Method to mark as read
conversationSchema.methods.markAsRead = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.lastReadAt = new Date();
    return this.save();
  }
  throw new Error('User is not a participant in this conversation');
};

// Method to update last message
conversationSchema.methods.updateLastMessage = function(message) {
  this.lastMessage = {
    content: message.content,
    sender: message.sender,
    timestamp: message.createdAt
  };
  return this.save();
};

// Method to mark message as read
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(r => r.user.toString() === userId.toString());
  if (existingReaction) {
    existingReaction.emoji = emoji;
    existingReaction.timestamp = new Date();
  } else {
    this.reactions.push({
      user: userId,
      emoji: emoji
    });
  }
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  return this.save();
};

// Static method to get user conversations
conversationSchema.statics.getUserConversations = function(userId, limit = 20, skip = 0) {
  return this.find({
    'participants.user': userId,
    isActive: true
  })
  .populate('participants.user', 'firstName lastName profile.avatar')
  .populate('lastMessage.sender', 'firstName lastName')
  .sort({ updatedAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to get conversation messages
messageSchema.statics.getConversationMessages = function(conversationId, limit = 50, skip = 0) {
  return this.find({
    conversation: conversationId,
    'metadata.isDeleted': false
  })
  .populate('sender', 'firstName lastName profile.avatar')
  .populate('metadata.replyTo')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, limit = 20, skip = 0) {
  return this.find({
    user: userId,
    expiresAt: { $gt: new Date() }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function(userId, notificationIds = []) {
  const query = { user: userId };
  if (notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }
  
  return this.updateMany(query, {
    isRead: true,
    readAt: new Date()
  });
};

module.exports = {
  Conversation: mongoose.model('Conversation', conversationSchema),
  Message: mongoose.model('Message', messageSchema),
  Notification: mongoose.model('Notification', notificationSchema)
};