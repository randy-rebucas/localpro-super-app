const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  summary: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: [
      'system',           // System-wide announcements
      'maintenance',      // Maintenance notifications
      'feature',          // New feature announcements
      'security',         // Security alerts
      'promotion',        // Promotional announcements
      'policy',           // Policy updates
      'event',            // Event announcements
      'emergency',        // Emergency notifications
      'update',           // App updates
      'general'           // General announcements
    ],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'archived'],
    default: 'draft'
  },
  targetAudience: {
    type: String,
    enum: [
      'all',              // All users
      'providers',        // Service providers only
      'clients',          // Clients only
      'agencies',         // Agency members only
      'premium',          // Premium users only
      'verified',         // Verified users only
      'specific_roles'    // Specific roles (stored in targetRoles)
    ],
    default: 'all'
  },
  targetRoles: [{
    type: String,
    enum: ['admin', 'provider', 'client', 'agency_admin', 'agency_owner', 'instructor', 'supplier', 'advertiser']
  }],
  targetLocations: [{
    type: String,
    trim: true
  }],
  targetCategories: [{
    type: String,
    enum: [
      'cleaning', 'plumbing', 'electrical', 'moving', 'landscaping',
      'painting', 'carpentry', 'flooring', 'roofing', 'hvac',
      'appliance_repair', 'locksmith', 'handyman', 'home_security',
      'pool_maintenance', 'pest_control', 'carpet_cleaning', 'window_cleaning',
      'gutter_cleaning', 'power_washing', 'snow_removal', 'other'
    ]
  }],
  scheduledAt: {
    type: Date,
    default: null
  },
  publishedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isSticky: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  requireAcknowledgment: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'document', 'video', 'audio'],
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorRole: {
    type: String,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  acknowledgments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      userName: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: 500
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      isEdited: {
        type: Boolean,
        default: false
      },
      editedAt: {
        type: Date,
        default: null
      },
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }]
  }],
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    totalAcknowledged: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
announcementSchema.index({ status: 1, publishedAt: -1 });
announcementSchema.index({ type: 1, priority: 1 });
announcementSchema.index({ targetAudience: 1, targetRoles: 1 });
announcementSchema.index({ scheduledAt: 1 });
announcementSchema.index({ expiresAt: 1 });
announcementSchema.index({ isSticky: 1, publishedAt: -1 });
announcementSchema.index({ tags: 1 });
announcementSchema.index({ author: 1 });
announcementSchema.index({ createdAt: -1 });

// Virtual for checking if announcement is active
announcementSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'published' && 
         (!this.scheduledAt || this.scheduledAt <= now) &&
         (!this.expiresAt || this.expiresAt > now);
});

// Virtual for checking if announcement is expired
announcementSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt <= new Date();
});

// Virtual for checking if announcement is scheduled
announcementSchema.virtual('isScheduled').get(function() {
  return this.status === 'scheduled' && this.scheduledAt && this.scheduledAt > new Date();
});

// Pre-save middleware
announcementSchema.pre('save', function(next) {
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Update lastModifiedAt
  this.metadata.lastModifiedAt = new Date();
  
  // Increment version on updates
  if (this.isModified() && !this.isNew) {
    this.metadata.version += 1;
  }
  
  next();
});

// Static method to get active announcements
announcementSchema.statics.getActiveAnnouncements = function(targetAudience = 'all', userRoles = []) {
  const now = new Date();
  const query = {
    status: 'published',
    isDeleted: false,
    $and: [
      {
        $or: [
          { scheduledAt: { $lte: now } },
          { scheduledAt: null }
        ]
      },
      {
        $or: [
          { expiresAt: { $gt: now } },
          { expiresAt: null }
        ]
      }
    ]
  };

  // Filter by target audience
  if (targetAudience !== 'all') {
    query.$and.push({
      $or: [
        { targetAudience: targetAudience },
        { targetAudience: 'all' }
      ]
    });
  }

  // Filter by user roles if specific roles are targeted
  if (userRoles.length > 0) {
    query.$and.push({ targetRoles: { $in: userRoles } });
  }

  return this.find(query)
    .sort({ isSticky: -1, priority: -1, publishedAt: -1 })
    .populate('author', 'firstName lastName email avatar')
    .populate('metadata.lastModifiedBy', 'firstName lastName email');
};

// Static method to get announcements for user
announcementSchema.statics.getAnnouncementsForUser = function(userId, userRole, userLocation, userCategories) {
  const now = new Date();
  const query = {
    status: 'published',
    isDeleted: false,
    $and: [
      {
        $or: [
          { scheduledAt: { $lte: now } },
          { scheduledAt: null }
        ]
      },
      {
        $or: [
          { expiresAt: { $gt: now } },
          { expiresAt: null }
        ]
      },
      {
        $or: [
          { targetAudience: 'all' },
          { targetAudience: userRole },
          { targetRoles: { $in: [userRole] } }
        ]
      }
    ]
  };

  // Add location-based filtering if user location is provided
  if (userLocation) {
    query.$and.push({ targetLocations: { $in: [userLocation] } });
  }

  // Add category-based filtering if user categories are provided
  if (userCategories && userCategories.length > 0) {
    query.$and.push({ targetCategories: { $in: userCategories } });
  }

  return this.find(query)
    .sort({ isSticky: -1, priority: -1, publishedAt: -1 })
    .populate('author', 'firstName lastName email avatar')
    .populate('acknowledgments.user', 'firstName lastName email');
};

// Instance method to increment views
announcementSchema.methods.incrementViews = function(userId) {
  this.views += 1;
  this.analytics.totalViews += 1;
  
  // Track unique views (you might want to implement this with a separate collection)
  // For now, we'll just increment total views
  return this.save();
};

// Instance method to acknowledge announcement
announcementSchema.methods.acknowledge = function(userId) {
  const existingAcknowledgment = this.acknowledgments.find(
    ack => ack.user.toString() === userId.toString()
  );
  
  if (!existingAcknowledgment) {
    this.acknowledgments.push({ user: userId });
    this.analytics.totalAcknowledged += 1;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to add comment
announcementSchema.methods.addComment = function(userId, userName, content) {
  if (!this.allowComments) {
    throw new Error('Comments are not allowed for this announcement');
  }
  
  this.comments.push({
    user: userId,
    userName: userName,
    content: content
  });
  
  this.analytics.totalComments += 1;
  return this.save();
};

// Instance method to soft delete
announcementSchema.methods.softDelete = function(deletedBy) {
  this.metadata.isDeleted = true;
  this.metadata.deletedAt = new Date();
  this.metadata.deletedBy = deletedBy;
  this.status = 'archived';
  return this.save();
};

module.exports = mongoose.model('Announcement', announcementSchema);
