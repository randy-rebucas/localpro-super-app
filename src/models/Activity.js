const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      // Authentication & Profile
      'user_login', 'user_logout', 'user_register', 'profile_update', 'avatar_upload',
      'password_change', 'email_verification', 'phone_verification',
      
      // Marketplace Activities
      'service_created', 'service_updated', 'service_deleted', 'service_published',
      'service_viewed', 'service_favorited', 'service_shared',
      'booking_created', 'booking_accepted', 'booking_rejected', 'booking_completed',
      'booking_cancelled', 'booking_rescheduled',
      'review_created', 'review_updated', 'review_deleted',
      
      // Job Board Activities
      'job_created', 'job_updated', 'job_deleted', 'job_published', 'job_closed',
      'job_applied', 'job_application_withdrawn', 'job_application_approved',
      'job_application_rejected', 'job_application_shortlisted',
      
      // Academy Activities
      'course_created', 'course_updated', 'course_deleted', 'course_published',
      'course_enrolled', 'course_completed', 'course_progress_updated',
      'course_review_created', 'certificate_earned',
      
      // Financial Activities
      'payment_made', 'payment_received', 'payment_failed', 'payment_refunded',
      'withdrawal_requested', 'withdrawal_approved', 'withdrawal_rejected',
      'invoice_created', 'invoice_paid', 'invoice_overdue',
      
      // Communication Activities
      'message_sent', 'message_received', 'conversation_started',
      'notification_sent', 'notification_read', 'email_sent',
      
      // Agency Activities
      'agency_joined', 'agency_left', 'agency_created', 'agency_updated',
      'provider_added', 'provider_removed', 'provider_status_updated',
      
      // Referral Activities
      'referral_sent', 'referral_accepted', 'referral_completed',
      'referral_reward_earned', 'referral_invitation_sent',
      
      // Trust & Verification
      'verification_requested', 'verification_approved', 'verification_rejected',
      'document_uploaded', 'document_verified', 'badge_earned',
      
      // Supply & Rental Activities
      'supply_created', 'supply_ordered', 'supply_delivered', 'supply_reviewed',
      'rental_created', 'rental_booked', 'rental_returned', 'rental_reviewed',
      
      // Advertisement Activities
      'ad_created', 'ad_updated', 'ad_published', 'ad_clicked', 'ad_promoted',
      
      // System Activities
      'settings_updated', 'preferences_changed', 'subscription_created',
      'subscription_cancelled', 'subscription_renewed',
      
      // Social Activities
      'connection_made', 'connection_removed', 'follow_started', 'follow_stopped',
      'content_liked', 'content_shared', 'content_commented',
      
      // Other
      'search_performed', 'filter_applied', 'export_requested', 'report_generated'
    ]
  },
  category: {
    type: String,
    required: true,
    enum: [
      'authentication', 'profile', 'marketplace', 'job_board', 'academy',
      'financial', 'communication', 'agency', 'referral', 'verification',
      'supplies', 'rentals', 'advertising', 'system', 'social', 'other'
    ]
  },
  action: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  targetEntity: {
    type: {
      type: String,
      enum: [
        'user', 'service', 'job', 'course', 'booking', 'application',
        'review', 'payment', 'agency', 'referral', 'verification',
        'supply', 'rental', 'ad', 'message', 'notification', 'document'
      ]
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetEntity.type'
    },
    name: String,
    url: String
  },
  relatedEntities: [{
    type: {
      type: String,
      enum: [
        'user', 'service', 'job', 'course', 'booking', 'application',
        'review', 'payment', 'agency', 'referral', 'verification',
        'supply', 'rental', 'ad', 'message', 'notification', 'document'
      ]
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntities.type'
    },
    name: String,
    role: String // e.g., 'client', 'provider', 'employer', 'applicant'
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    address: String,
    city: String,
    country: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    device: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown']
    },
    browser: String,
    os: String,
    appVersion: String,
    sessionId: String,
    requestId: String
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'connections', 'followers'],
    default: 'private'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  impact: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 0
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    }
  },
  interactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['view', 'like', 'share', 'comment', 'bookmark'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ category: 1, createdAt: -1 });
activitySchema.index({ 'targetEntity.type': 1, 'targetEntity.id': 1 });
activitySchema.index({ visibility: 1, isVisible: 1, createdAt: -1 });
activitySchema.index({ tags: 1 });
activitySchema.index({ impact: 1, createdAt: -1 });
activitySchema.index({ points: -1, createdAt: -1 });
activitySchema.index({ isDeleted: 1, createdAt: -1 });

// Compound indexes
activitySchema.index({ user: 1, type: 1, createdAt: -1 });
activitySchema.index({ user: 1, category: 1, createdAt: -1 });
activitySchema.index({ user: 1, visibility: 1, isVisible: 1, createdAt: -1 });
activitySchema.index({ user: 1, isDeleted: 1, createdAt: -1 });
activitySchema.index({ type: 1, category: 1, createdAt: -1 });
activitySchema.index({ 'targetEntity.type': 1, 'targetEntity.id': 1, createdAt: -1 });

// Virtual for activity age
activitySchema.virtual('age').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Virtual for activity summary
activitySchema.virtual('summary').get(function() {
  return {
    id: this._id,
    type: this.type,
    action: this.action,
    description: this.description,
    age: this.age,
    points: this.points,
    impact: this.impact,
    targetEntity: this.targetEntity,
    analytics: this.analytics
  };
});

// Pre-save middleware
activitySchema.pre('save', function(next) {
  // Set category based on type if not provided
  if (!this.category) {
    this.category = this.getCategoryFromType(this.type);
  }
  
  // Set points based on type and impact
  if (this.points === 0) {
    this.points = this.calculatePoints(this.type, this.impact);
  }
  
  next();
});

// Static methods
activitySchema.statics.getActivityFeed = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    types = [],
    categories = [],
    visibility = 'public',
    includeOwn = true,
    timeframe = '7d'
  } = options;

  const query = {
    isDeleted: false,
    isVisible: true
  };

  // Timeframe filter
  const timeframes = {
    '1h': 1 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };

  if (timeframe && timeframes[timeframe]) {
    const cutoff = new Date(Date.now() - timeframes[timeframe]);
    query.createdAt = { $gte: cutoff };
  }

  // Type and category filters
  if (types && types.length > 0) {
    query.type = { $in: types };
  }
  if (categories && categories.length > 0) {
    query.category = { $in: categories };
  }

  // Build visibility and user filter together to avoid $or conflicts
  const visibilityConditions = [];

  // Include user's own activities if requested
  if (includeOwn && userId) {
    visibilityConditions.push({ user: userId });
  }

  // Add visibility-based conditions
  if (visibility === 'public') {
    visibilityConditions.push({ visibility: 'public' });
  } else if (visibility === 'connections') {
    visibilityConditions.push({ visibility: 'public' });
    visibilityConditions.push({ visibility: 'connections' });
  }

  // Apply the combined $or condition
  if (visibilityConditions.length > 0) {
    query.$or = visibilityConditions;
  }

  // If not including own and explicit exclusion needed
  if (!includeOwn && userId) {
    query.user = { $ne: userId };
  }

  try {
    return await this.find(query)
      .populate('user', 'firstName lastName email avatar role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
  } catch (error) {
    // Log error details for debugging
    console.error('Activity.getActivityFeed error:', error.message);
    throw error;
  }
};

activitySchema.statics.getUserActivities = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    types = [],
    categories = [],
    timeframe = '30d'
  } = options;

  const query = {
    user: userId,
    isDeleted: false
  };

  // Timeframe filter
  const timeframes = {
    '1h': 1 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };

  if (timeframe && timeframes[timeframe]) {
    const cutoff = new Date(Date.now() - timeframes[timeframe]);
    query.createdAt = { $gte: cutoff };
  }

  // Type and category filters
  if (types.length > 0) {
    query.type = { $in: types };
  }
  if (categories.length > 0) {
    query.category = { $in: categories };
  }

  return this.find(query)
    .populate('targetEntity.id')
    .populate('relatedEntities.id')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();
};

activitySchema.statics.getActivityStats = function(userId, timeframe = '30d') {
  const timeframes = {
    '1h': 1 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };

  const cutoff = new Date(Date.now() - timeframes[timeframe]);

  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: cutoff },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalActivities: { $sum: 1 },
        totalPoints: { $sum: '$points' },
        categories: {
          $push: '$category'
        },
        types: {
          $push: '$type'
        }
      }
    },
    {
      $project: {
        totalActivities: 1,
        totalPoints: 1,
        categoryBreakdown: {
          $reduce: {
            input: '$categories',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [{ k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }]
                  ]
                }
              ]
            }
          }
        },
        typeBreakdown: {
          $reduce: {
            input: '$types',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [{ k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }]
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

// Instance methods
activitySchema.methods.addInteraction = function(userId, type, metadata = {}) {
  // Check if user already interacted with this type
  const existingInteraction = this.interactions.find(
    interaction => interaction.user.toString() === userId.toString() && interaction.type === type
  );

  if (existingInteraction) {
    // Update existing interaction
    existingInteraction.timestamp = new Date();
    existingInteraction.metadata = { ...existingInteraction.metadata, ...metadata };
  } else {
    // Add new interaction
    this.interactions.push({
      user: userId,
      type: type,
      metadata: metadata
    });
  }

  // Update analytics
  if (type === 'view') {
    this.analytics.views += 1;
  } else if (type === 'like') {
    this.analytics.likes += 1;
  } else if (type === 'share') {
    this.analytics.shares += 1;
  } else if (type === 'comment') {
    this.analytics.comments += 1;
  }

  return this.save();
};

activitySchema.methods.removeInteraction = function(userId, type) {
  this.interactions = this.interactions.filter(
    interaction => !(interaction.user.toString() === userId.toString() && interaction.type === type)
  );

  // Update analytics
  if (type === 'like') {
    this.analytics.likes = Math.max(0, this.analytics.likes - 1);
  } else if (type === 'share') {
    this.analytics.shares = Math.max(0, this.analytics.shares - 1);
  } else if (type === 'comment') {
    this.analytics.comments = Math.max(0, this.analytics.comments - 1);
  }

  return this.save();
};

activitySchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isVisible = false;
  return this.save();
};

// Helper methods
activitySchema.methods.getCategoryFromType = function(type) {
  const categoryMap = {
    'user_login': 'authentication',
    'user_logout': 'authentication',
    'user_register': 'authentication',
    'profile_update': 'profile',
    'avatar_upload': 'profile',
    'service_created': 'marketplace',
    'service_updated': 'marketplace',
    'booking_created': 'marketplace',
    'job_created': 'job_board',
    'job_applied': 'job_board',
    'course_enrolled': 'academy',
    'course_completed': 'academy',
    'payment_made': 'financial',
    'payment_received': 'financial',
    'message_sent': 'communication',
    'agency_joined': 'agency',
    'referral_sent': 'referral',
    'verification_requested': 'verification'
  };
  
  return categoryMap[type] || 'other';
};

activitySchema.methods.calculatePoints = function(type, impact) {
  const basePoints = {
    'low': 1,
    'medium': 5,
    'high': 10,
    'critical': 20
  };

  const typeMultipliers = {
    'user_register': 2,
    'service_created': 3,
    'job_applied': 2,
    'course_completed': 5,
    'referral_completed': 10,
    'verification_approved': 3
  };

  const base = basePoints[impact] || 1;
  const multiplier = typeMultipliers[type] || 1;
  
  return base * multiplier;
};

module.exports = mongoose.model('Activity', activitySchema);
