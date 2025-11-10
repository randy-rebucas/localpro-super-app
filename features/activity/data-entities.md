# Activity Data Entities

## Overview

The Activity feature uses a single comprehensive data model: `Activity`. This model provides extensive activity tracking, social engagement, and analytics capabilities across all platform features.

## Activity Model

### Schema Definition

```javascript
const activitySchema = new mongoose.Schema({
  // User Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Activity Classification
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
  
  // Activity Details
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
  
  // Target Entity Information
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
  
  // Related Entities
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
  
  // Location Information
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
  
  // Metadata
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
  
  // Visibility and Privacy
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
  
  // Categorization and Impact
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
  
  // Analytics and Engagement
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
  
  // Social Interactions
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
```

### Key Features

#### User Information
- **User Reference**: Link to the user who performed the activity
- **User Context**: User information for activity display and filtering

#### Activity Classification
- **Type**: Specific activity type from comprehensive enum list
- **Category**: High-level category for organization and filtering
- **Action**: Human-readable action description
- **Description**: Detailed activity description
- **Details**: Flexible metadata storage for activity-specific information

#### Entity Relationships
- **Target Entity**: Primary entity the activity relates to
- **Related Entities**: Additional entities involved in the activity
- **Entity References**: Dynamic references based on entity type
- **Entity Names**: Human-readable entity names for display
- **Entity URLs**: Direct links to entity details

#### Location Information
- **Geospatial Data**: GPS coordinates for location-based activities
- **Address Information**: Human-readable address details
- **Geographic Context**: City and country information
- **Spatial Indexing**: 2dsphere index for geospatial queries

#### Metadata and Context
- **Technical Metadata**: IP address, user agent, device information
- **Session Information**: Session and request tracking
- **App Version**: Application version for compatibility tracking
- **Device Classification**: Mobile, tablet, desktop identification

#### Privacy and Visibility
- **Visibility Levels**: Public, private, connections, followers
- **Visibility Control**: Granular control over activity sharing
- **Soft Delete**: Activity deletion without data loss
- **Visibility Toggle**: Dynamic visibility control

#### Categorization and Impact
- **Tags**: Flexible tagging system for categorization
- **Impact Levels**: Low, medium, high, critical impact classification
- **Points System**: Gamification through point allocation
- **Activity Scoring**: Automated point calculation based on type and impact

#### Analytics and Engagement
- **View Tracking**: Activity view count and tracking
- **Like System**: Like count and user interaction tracking
- **Share Tracking**: Share count and sharing behavior
- **Comment System**: Comment count and discussion tracking

#### Social Interactions
- **Interaction Types**: View, like, share, comment, bookmark
- **User Tracking**: User-specific interaction tracking
- **Timestamp Management**: Interaction timing and history
- **Metadata Storage**: Interaction-specific metadata

### Database Indexes

#### Performance Indexes
```javascript
// Basic indexes
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
```

### Virtual Properties

#### Activity Age
```javascript
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
```

#### Activity Summary
```javascript
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
```

### Pre-save Middleware

#### Automatic Category Assignment
```javascript
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
```

### Static Methods

#### Get Activity Feed
```javascript
activitySchema.statics.getActivityFeed = function(userId, options = {}) {
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

  // Visibility filter
  if (visibility === 'public') {
    query.visibility = 'public';
  } else if (visibility === 'connections') {
    query.$or = [
      { visibility: 'public' },
      { visibility: 'connections' }
    ];
  }

  // Type and category filters
  if (types.length > 0) {
    query.type = { $in: types };
  }
  if (categories.length > 0) {
    query.category = { $in: categories };
  }

  // User filter
  if (includeOwn) {
    query.$or = [
      { user: userId },
      { visibility: 'public' }
    ];
  } else {
    query.user = { $ne: userId };
  }

  return this.find(query)
    .populate('user', 'firstName lastName email avatar role')
    .populate('targetEntity.id')
    .populate('relatedEntities.id')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();
};
```

#### Get User Activities
```javascript
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
```

#### Get Activity Statistics
```javascript
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
        categories: { $push: '$category' },
        types: { $push: '$type' }
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
```

### Instance Methods

#### Add Interaction
```javascript
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
```

#### Remove Interaction
```javascript
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
```

#### Soft Delete
```javascript
activitySchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isVisible = false;
  return this.save();
};
```

### Helper Methods

#### Get Category From Type
```javascript
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
```

#### Calculate Points
```javascript
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
```

## Data Relationships

### Activity Relationships
- **User**: Many-to-one relationship with User model
- **Target Entity**: Dynamic relationship with various entity types
- **Related Entities**: One-to-many relationship with various entity types
- **Interactions**: One-to-many relationship with User interactions

## Validation Rules

### Activity Validation
- **User**: Must be a valid User ID
- **Type**: Must be one of the defined activity types
- **Category**: Must be one of the defined categories
- **Action**: Required, maximum 100 characters
- **Description**: Required, maximum 500 characters
- **Visibility**: Must be one of the defined visibility levels
- **Impact**: Must be one of the defined impact levels

## Default Values

### Activity Defaults
- **visibility**: 'private' (private by default)
- **isVisible**: true (visible by default)
- **isDeleted**: false (not deleted by default)
- **deletedAt**: null (no deletion date initially)
- **impact**: 'medium' (medium impact by default)
- **points**: 0 (no points initially, calculated automatically)
- **analytics**: All counts start at 0

## Performance Considerations

### Query Optimization
- Use `select()` to limit returned fields
- Use `lean()` for read-only operations
- Use `populate()` sparingly and only when needed
- Use aggregation pipelines for complex analytics

### Caching Strategy
- Cache frequently accessed activity feeds
- Use Redis for activity statistics and analytics
- Implement cache invalidation on activity updates
- Cache user activity summaries

### Indexing Strategy
- Create compound indexes for common query patterns
- Use sparse indexes for optional fields
- Implement geospatial indexes for location-based queries
- Monitor index usage and performance

This comprehensive data model provides all the functionality needed for a robust activity tracking and social engagement system while maintaining performance and scalability.
