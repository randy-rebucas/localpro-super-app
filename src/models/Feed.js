const mongoose = require('mongoose');

/**
 * Feed Item Schema
 * Unified feed model that aggregates content from various sources
 */
const feedItemSchema = new mongoose.Schema({
  // Content Type
  contentType: {
    type: String,
    required: true,
    enum: [
      'activity',
      'job',
      'service',
      'course',
      'ad',
      'promo',
      'agency',
      'supply',
      'rental',
      'reward',
      'referral',
      'announcement',
      'achievement',
      'milestone'
    ],
    index: true
  },
  
  // Content Reference
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentModel'
  },
  
  contentModel: {
    type: String,
    required: true,
    enum: [
      'Activity',
      'Job',
      'Service',
      'Academy',
      'Ad',
      'Agency',
      'Supplies',
      'Rental',
      'Referral',
      'Announcement'
    ]
  },
  
  // Author/Creator
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Feed Item Details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  summary: {
    type: String,
    maxlength: 280
  },
  
  // Media
  media: {
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'badge', 'icon']
    },
    url: String,
    thumbnail: String,
    publicId: String
  },
  
  images: [{
    url: String,
    thumbnail: String,
    publicId: String
  }],
  
  // Categorization
  category: {
    type: String,
    index: true
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  
  // Visibility & Targeting
  visibility: {
    type: String,
    enum: ['public', 'private', 'connections', 'followers', 'targeted'],
    default: 'public',
    index: true
  },
  
  targetAudience: {
    roles: [{
      type: String,
      enum: ['client', 'provider', 'supplier', 'partner', 'admin', 'instructor', 'agency_owner', 'agency_admin']
    }],
    locations: [{
      city: String,
      state: String,
      country: String,
      radius: Number
    }],
    interests: [String],
    minPoints: Number,
    verified: Boolean
  },
  
  // Priority & Featured
  priority: {
    type: Number,
    default: 0,
    index: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  featuredUntil: Date,
  
  isPromoted: {
    type: Boolean,
    default: false
  },
  
  promotionData: {
    budget: Number,
    spent: Number,
    impressions: Number,
    clicks: Number,
    ctr: Number,
    startDate: Date,
    endDate: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'scheduled', 'expired', 'archived'],
    default: 'active',
    index: true
  },
  
  publishedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  scheduledFor: Date,
  
  expiresAt: Date,
  
  // Engagement Analytics
  analytics: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    viewedBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: Date
    }],
    interactedBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      type: { type: String, enum: ['like', 'share', 'comment', 'bookmark', 'click'] },
      timestamp: Date
    }]
  },
  
  // Call to Action
  cta: {
    text: String,
    url: String,
    type: {
      type: String,
      enum: ['link', 'apply', 'enroll', 'book', 'view', 'share', 'custom']
    }
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Flags
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  isVisible: {
    type: Boolean,
    default: true
  },
  
  isReported: {
    type: Boolean,
    default: false
  },
  
  reportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound Indexes
feedItemSchema.index({ contentType: 1, publishedAt: -1 });
feedItemSchema.index({ author: 1, publishedAt: -1 });
feedItemSchema.index({ status: 1, publishedAt: -1 });
feedItemSchema.index({ isFeatured: 1, priority: -1, publishedAt: -1 });
feedItemSchema.index({ visibility: 1, publishedAt: -1 });
feedItemSchema.index({ 'targetAudience.roles': 1, publishedAt: -1 });
feedItemSchema.index({ category: 1, publishedAt: -1 });

// Virtual for engagement score
feedItemSchema.virtual('engagementScore').get(function() {
  const { likes, shares, comments, bookmarks, views } = this.analytics;
  if (views === 0) return 0;
  
  // Weighted engagement score
  const score = (
    (likes * 2) +
    (shares * 3) +
    (comments * 4) +
    (bookmarks * 2)
  ) / Math.max(views, 1);
  
  return Math.round(score * 100) / 100;
});

// Methods

/**
 * Add interaction to feed item
 */
feedItemSchema.methods.addInteraction = async function(userId, type) {
  if (!['view', 'like', 'share', 'comment', 'bookmark', 'click'].includes(type)) {
    throw new Error('Invalid interaction type');
  }
  
  if (type === 'view') {
    this.analytics.views += 1;
    
    // Track unique views
    const hasViewed = this.analytics.viewedBy.some(
      v => v.user.toString() === userId.toString()
    );
    
    if (!hasViewed) {
      this.analytics.uniqueViews += 1;
      if (this.analytics.viewedBy.length < 1000) { // Limit stored views
        this.analytics.viewedBy.push({ user: userId, timestamp: new Date() });
      }
    }
  } else {
    this.analytics[type + 's'] += 1;
    
    // Track interaction
    const hasInteracted = this.analytics.interactedBy.some(
      i => i.user.toString() === userId.toString() && i.type === type
    );
    
    if (!hasInteracted && this.analytics.interactedBy.length < 1000) {
      this.analytics.interactedBy.push({
        user: userId,
        type,
        timestamp: new Date()
      });
    }
  }
  
  // Update engagement rate
  this.analytics.engagementRate = this.engagementScore;
  
  await this.save();
  return this;
};

/**
 * Remove interaction from feed item
 */
feedItemSchema.methods.removeInteraction = async function(userId, type) {
  if (!['like', 'share', 'comment', 'bookmark'].includes(type)) {
    throw new Error('Invalid interaction type');
  }
  
  if (this.analytics[type + 's'] > 0) {
    this.analytics[type + 's'] -= 1;
  }
  
  // Remove from interactedBy
  this.analytics.interactedBy = this.analytics.interactedBy.filter(
    i => !(i.user.toString() === userId.toString() && i.type === type)
  );
  
  // Update engagement rate
  this.analytics.engagementRate = this.engagementScore;
  
  await this.save();
  return this;
};

/**
 * Check if content should be shown to user
 */
feedItemSchema.methods.canViewContent = function(user) {
  // Deleted or invisible items
  if (this.isDeleted || !this.isVisible) return false;
  
  // Status check
  if (this.status !== 'active') return false;
  
  // Expiration check
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  
  // Visibility check
  if (this.visibility === 'private' && this.author.toString() !== user.id) {
    return false;
  }
  
  // Role targeting
  if (this.targetAudience?.roles?.length > 0) {
    const userRoles = Array.isArray(user.role) ? user.role : [user.role];
    const hasMatchingRole = userRoles.some(role => 
      this.targetAudience.roles.includes(role)
    );
    if (!hasMatchingRole) return false;
  }
  
  return true;
};

// Static Methods

/**
 * Get personalized feed for user
 */
feedItemSchema.statics.getPersonalizedFeed = async function(user, options = {}) {
  const {
    page = 1,
    limit = 20,
    contentTypes = [],
    categories = [],
    timeframe = '7d',
    sortBy = 'relevance' // relevance, recent, trending, popular
  } = options;
  
  const query = {
    isDeleted: false,
    isVisible: true,
    status: 'active'
  };
  
  // Time filter
  const timeframes = {
    '1h': 1 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    'all': null
  };
  
  if (timeframes[timeframe]) {
    query.publishedAt = {
      $gte: new Date(Date.now() - timeframes[timeframe])
    };
  }
  
  // Content type filter
  if (contentTypes.length > 0) {
    query.contentType = { $in: contentTypes };
  }
  
  // Category filter
  if (categories.length > 0) {
    query.category = { $in: categories };
  }
  
  // Visibility and targeting
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  query.$or = [
    { visibility: 'public', 'targetAudience.roles': { $size: 0 } },
    { visibility: 'public', 'targetAudience.roles': { $in: userRoles } },
    { author: user.id }
  ];
  
  // Sorting
  let sort = {};
  switch (sortBy) {
    case 'recent':
      sort = { publishedAt: -1 };
      break;
    case 'trending':
      sort = { 'analytics.engagementRate': -1, publishedAt: -1 };
      break;
    case 'popular':
      sort = { 'analytics.views': -1, 'analytics.likes': -1 };
      break;
    case 'relevance':
    default:
      sort = { isFeatured: -1, priority: -1, publishedAt: -1 };
      break;
  }
  
  const skip = (page - 1) * limit;
  
  const items = await this.find(query)
    .populate('author', 'firstName lastName email avatar role verified profile')
    .populate('contentId')
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .lean();
        
        const total = await this.countDocuments(query);
  
  return {
    items,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

/**
 * Get trending feed items
 */
feedItemSchema.statics.getTrending = async function(limit = 10, timeframe = '24h') {
  const timeframes = {
    '1h': 1 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  
  const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['24h']));
  
  return await this.find({
    isDeleted: false,
    isVisible: true,
    status: 'active',
    publishedAt: { $gte: since }
  })
  .populate('author', 'firstName lastName email avatar role verified profile')
  .sort({ 'analytics.engagementRate': -1, 'analytics.views': -1 })
  .limit(limit)
  .lean();
};

/**
 * Get featured items
 */
feedItemSchema.statics.getFeatured = async function(limit = 5) {
  return await this.find({
    isDeleted: false,
    isVisible: true,
    status: 'active',
    isFeatured: true,
    $or: [
      { featuredUntil: { $exists: false } },
      { featuredUntil: { $gte: new Date() } }
    ]
  })
  .populate('author', 'firstName lastName email avatar role verified profile')
  .populate('contentId')
  .sort({ priority: -1, publishedAt: -1 })
  .limit(limit)
  .lean();
};

/**
 * Create feed item from content
 */
feedItemSchema.statics.createFromContent = async function(contentType, content, additionalData = {}) {
  const feedItem = {
    contentType,
    contentId: content._id,
    author: content.userId || content.user || content.createdBy,
    ...additionalData
  };
  
  // Map content type to model
  const modelMap = {
    activity: 'Activity',
    job: 'Job',
    service: 'Service',
    course: 'Academy',
    ad: 'Ad',
    promo: 'Ad',
    agency: 'Agency',
    supply: 'Supplies',
    rental: 'Rental',
    reward: 'Referral',
    referral: 'Referral'
  };
  
  feedItem.contentModel = modelMap[contentType] || 'Activity';
  
  return await this.create(feedItem);
};

module.exports = mongoose.model('Feed', feedItemSchema);
