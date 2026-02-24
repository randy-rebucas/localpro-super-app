const mongoose = require('mongoose');

// Live Chat Session Schema - for guest/visitor support chat
const liveChatSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
      referrer: String,
      pageUrl: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'closed', 'archived'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  agentName: String,
  department: {
    type: String,
    enum: ['general', 'sales', 'support', 'billing', 'technical'],
    default: 'general'
  },
  tags: [String],
  lastMessage: {
    content: String,
    type: {
      type: String,
      enum: ['user', 'agent', 'system']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  messageCount: {
    type: Number,
    default: 0
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  firstResponseAt: Date,
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
  },
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Live Chat Message Schema
const liveChatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['user', 'agent', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  agentName: String,
  agentAvatar: String,
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    id: String,
    name: String,
    type: String,
    size: Number,
    url: String,
    publicId: String,
    previewUrl: String
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
    deletedAt: Date
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
liveChatSessionSchema.index({ status: 1, createdAt: -1 });
liveChatSessionSchema.index({ assignedAgent: 1, status: 1 });
liveChatSessionSchema.index({ 'user.email': 1 });
liveChatSessionSchema.index({ department: 1, status: 1 });
liveChatSessionSchema.index({ updatedAt: -1 });
liveChatSessionSchema.index({ priority: 1, status: 1 });

liveChatMessageSchema.index({ sessionId: 1, createdAt: 1 });
liveChatMessageSchema.index({ sessionId: 1, type: 1 });
liveChatMessageSchema.index({ createdAt: -1 });

// Virtual for response time calculation
liveChatSessionSchema.virtual('responseTime').get(function() {
  if (this.firstResponseAt && this.startedAt) {
    return this.firstResponseAt - this.startedAt;
  }
  return null;
});

// Virtual for session duration
liveChatSessionSchema.virtual('duration').get(function() {
  const endTime = this.endedAt || new Date();
  return endTime - this.startedAt;
});

// Method to update last message
liveChatSessionSchema.methods.updateLastMessage = async function(message) {
  this.lastMessage = {
    content: message.content.substring(0, 200), // Truncate for preview
    type: message.type,
    timestamp: message.createdAt || new Date()
  };
  this.messageCount += 1;
  
  // Update unread count for admin if message is from user
  if (message.type === 'user') {
    this.unreadCount += 1;
  }
  
  return this.save();
};

// Method to assign agent
liveChatSessionSchema.methods.assignToAgent = async function(agentId, agentName) {
  this.assignedAgent = agentId;
  this.agentName = agentName;
  this.status = 'active';
  return this.save();
};

// Method to close session
liveChatSessionSchema.methods.closeSession = async function() {
  this.status = 'closed';
  this.endedAt = new Date();
  return this.save();
};

// Method to rate session
liveChatSessionSchema.methods.rateSession = async function(score, feedback) {
  this.rating = {
    score,
    feedback,
    ratedAt: new Date()
  };
  return this.save();
};

// Static method to get pending sessions
liveChatSessionSchema.statics.getPendingSessions = function(limit = 50) {
  return this.find({ status: 'pending' })
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit)
    .lean();
};

// Static method to get active sessions for an agent
liveChatSessionSchema.statics.getAgentSessions = function(agentId, status = 'active') {
  return this.find({ 
    assignedAgent: agentId,
    status 
  })
    .sort({ updatedAt: -1 })
    .lean();
};

// Static method to get session analytics
liveChatSessionSchema.statics.getAnalytics = async function(startDate, endDate) {
  const match = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  const [stats] = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        avgMessages: { $avg: '$messageCount' },
        closedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
        },
        avgRating: { $avg: '$rating.score' },
        byStatus: {
          $push: '$status'
        },
        byDepartment: {
          $push: '$department'
        }
      }
    }
  ]);

  return stats || {
    totalSessions: 0,
    avgMessages: 0,
    closedSessions: 0,
    avgRating: null
  };
};

// Static method to get messages for a session
liveChatMessageSchema.statics.getSessionMessages = function(sessionId, limit = 100, skip = 0) {
  return this.find({
    sessionId,
    'metadata.isDeleted': { $ne: true }
  })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Pre-save middleware to set firstResponseAt
liveChatSessionSchema.pre('save', function(next) {
  // If this is an agent message and firstResponseAt isn't set
  if (this.isModified('lastMessage') && 
      this.lastMessage.type === 'agent' && 
      !this.firstResponseAt) {
    this.firstResponseAt = new Date();
  }
  next();
});

const LiveChatSession = mongoose.model('LiveChatSession', liveChatSessionSchema);
const LiveChatMessage = mongoose.model('LiveChatMessage', liveChatMessageSchema);

module.exports = {
  LiveChatSession,
  LiveChatMessage
};

