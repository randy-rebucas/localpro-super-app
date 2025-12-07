const mongoose = require('mongoose');

/**
 * Email Campaign Schema
 * Manages email marketing campaigns and newsletters
 */
const emailCampaignSchema = new mongoose.Schema({
  // Campaign identification
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  previewText: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Campaign type
  type: {
    type: String,
    enum: ['newsletter', 'promotional', 'announcement', 'digest', 'welcome_series', 're_engagement', 'transactional'],
    default: 'newsletter'
  },
  
  // Content
  content: {
    html: {
      type: String,
      required: true
    },
    plainText: String,
    template: {
      type: String,
      enum: ['newsletter', 'promotional', 'announcement', 'digest', 'minimal', 'custom'],
      default: 'newsletter'
    }
  },
  
  // Sender information
  sender: {
    name: {
      type: String,
      default: 'LocalPro'
    },
    email: {
      type: String,
      default: 'noreply@localpro.com'
    },
    replyTo: String
  },
  
  // Targeting and segmentation
  audience: {
    type: {
      type: String,
      enum: ['all', 'segment', 'list', 'manual'],
      default: 'all'
    },
    // Filter by user roles
    roles: [{
      type: String,
      enum: ['client', 'provider', 'admin', 'supplier', 'instructor', 'agency_owner', 'agency_admin']
    }],
    // Filter by location
    locations: [{
      city: String,
      state: String,
      country: String
    }],
    // Filter by subscription status
    subscriptionStatus: [{
      type: String,
      enum: ['active', 'inactive', 'trial', 'cancelled']
    }],
    // Filter by user activity
    activityFilter: {
      lastActiveWithin: Number, // days
      minBookings: Number,
      minOrders: Number,
      registeredAfter: Date,
      registeredBefore: Date
    },
    // Manual list of subscriber IDs
    subscriberIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailSubscriber'
    }],
    // Exclude specific subscribers
    excludeIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailSubscriber'
    }],
    // Estimated recipient count
    estimatedRecipients: {
      type: Number,
      default: 0
    }
  },
  
  // Scheduling
  schedule: {
    type: {
      type: String,
      enum: ['immediate', 'scheduled', 'recurring'],
      default: 'immediate'
    },
    scheduledAt: Date,
    timezone: {
      type: String,
      default: 'Asia/Manila'
    },
    // For recurring campaigns
    recurring: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly']
      },
      dayOfWeek: Number, // 0-6 for weekly
      dayOfMonth: Number, // 1-31 for monthly
      time: String, // HH:MM format
      endDate: Date
    }
  },
  
  // Campaign status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed'],
    default: 'draft'
  },
  
  // A/B Testing
  abTest: {
    enabled: {
      type: Boolean,
      default: false
    },
    variants: [{
      name: String,
      subject: String,
      content: String,
      percentage: Number, // Percentage of audience
      winner: Boolean
    }],
    testMetric: {
      type: String,
      enum: ['open_rate', 'click_rate', 'conversion_rate'],
      default: 'open_rate'
    },
    testDuration: Number, // Hours before selecting winner
    winnerSelected: Boolean,
    winnerSelectedAt: Date
  },
  
  // Analytics and tracking
  analytics: {
    totalRecipients: {
      type: Number,
      default: 0
    },
    sent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    uniqueOpens: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    },
    uniqueClicks: {
      type: Number,
      default: 0
    },
    bounced: {
      type: Number,
      default: 0
    },
    softBounced: {
      type: Number,
      default: 0
    },
    hardBounced: {
      type: Number,
      default: 0
    },
    unsubscribed: {
      type: Number,
      default: 0
    },
    complained: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  
  // Tracking settings
  tracking: {
    openTracking: {
      type: Boolean,
      default: true
    },
    clickTracking: {
      type: Boolean,
      default: true
    },
    conversionTracking: {
      type: Boolean,
      default: false
    },
    googleAnalytics: {
      enabled: {
        type: Boolean,
        default: false
      },
      utmSource: String,
      utmMedium: String,
      utmCampaign: String
    }
  },
  
  // Links in the campaign
  links: [{
    url: String,
    label: String,
    clicks: {
      type: Number,
      default: 0
    }
  }],
  
  // Tags for organization
  tags: [{
    type: String,
    trim: true
  }],
  
  // Campaign metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Sending progress
  sendingProgress: {
    startedAt: Date,
    completedAt: Date,
    lastProcessedAt: Date,
    currentBatch: {
      type: Number,
      default: 0
    },
    totalBatches: {
      type: Number,
      default: 0
    },
    errors: [{
      subscriberId: mongoose.Schema.Types.ObjectId,
      email: String,
      error: String,
      timestamp: Date
    }]
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
emailCampaignSchema.index({ status: 1 });
emailCampaignSchema.index({ type: 1 });
emailCampaignSchema.index({ 'schedule.scheduledAt': 1 });
emailCampaignSchema.index({ createdBy: 1 });
emailCampaignSchema.index({ tags: 1 });
emailCampaignSchema.index({ createdAt: -1 });
emailCampaignSchema.index({ isDeleted: 1 });
emailCampaignSchema.index({ name: 'text', subject: 'text' });

// Virtuals
emailCampaignSchema.virtual('openRate').get(function() {
  if (this.analytics.delivered === 0) return 0;
  return ((this.analytics.uniqueOpens / this.analytics.delivered) * 100).toFixed(2);
});

emailCampaignSchema.virtual('clickRate').get(function() {
  if (this.analytics.delivered === 0) return 0;
  return ((this.analytics.uniqueClicks / this.analytics.delivered) * 100).toFixed(2);
});

emailCampaignSchema.virtual('bounceRate').get(function() {
  if (this.analytics.sent === 0) return 0;
  return ((this.analytics.bounced / this.analytics.sent) * 100).toFixed(2);
});

emailCampaignSchema.virtual('unsubscribeRate').get(function() {
  if (this.analytics.delivered === 0) return 0;
  return ((this.analytics.unsubscribed / this.analytics.delivered) * 100).toFixed(2);
});

emailCampaignSchema.virtual('deliveryRate').get(function() {
  if (this.analytics.sent === 0) return 0;
  return ((this.analytics.delivered / this.analytics.sent) * 100).toFixed(2);
});

// Ensure virtuals are serialized
emailCampaignSchema.set('toJSON', { virtuals: true });
emailCampaignSchema.set('toObject', { virtuals: true });

// Pre-save middleware
emailCampaignSchema.pre('save', function(next) {
  // Set scheduled status if scheduledAt is set
  if (this.schedule.type === 'scheduled' && this.schedule.scheduledAt && this.status === 'draft') {
    this.status = 'scheduled';
  }
  next();
});

// Instance Methods
emailCampaignSchema.methods.updateAnalytics = async function(updates) {
  Object.keys(updates).forEach(key => {
    if (this.analytics[key] !== undefined) {
      this.analytics[key] += updates[key];
    }
  });
  return this.save();
};

emailCampaignSchema.methods.incrementOpen = async function(isUnique = true) {
  this.analytics.opened += 1;
  if (isUnique) {
    this.analytics.uniqueOpens += 1;
  }
  return this.save();
};

emailCampaignSchema.methods.incrementClick = async function(linkUrl, isUnique = true) {
  this.analytics.clicked += 1;
  if (isUnique) {
    this.analytics.uniqueClicks += 1;
  }
  
  // Update link click count
  const link = this.links.find(l => l.url === linkUrl);
  if (link) {
    link.clicks += 1;
  }
  
  return this.save();
};

emailCampaignSchema.methods.recordBounce = async function(type = 'soft') {
  this.analytics.bounced += 1;
  if (type === 'hard') {
    this.analytics.hardBounced += 1;
  } else {
    this.analytics.softBounced += 1;
  }
  return this.save();
};

emailCampaignSchema.methods.recordUnsubscribe = async function() {
  this.analytics.unsubscribed += 1;
  return this.save();
};

emailCampaignSchema.methods.pause = async function() {
  if (this.status === 'sending') {
    this.status = 'paused';
    return this.save();
  }
  throw new Error('Can only pause campaigns that are currently sending');
};

emailCampaignSchema.methods.resume = async function() {
  if (this.status === 'paused') {
    this.status = 'sending';
    return this.save();
  }
  throw new Error('Can only resume paused campaigns');
};

emailCampaignSchema.methods.cancel = async function() {
  if (['draft', 'scheduled', 'paused'].includes(this.status)) {
    this.status = 'cancelled';
    return this.save();
  }
  throw new Error('Cannot cancel campaign in current status');
};

emailCampaignSchema.methods.duplicate = async function(newName) {
  const campaignData = this.toObject();
  delete campaignData._id;
  delete campaignData.createdAt;
  delete campaignData.updatedAt;
  
  campaignData.name = newName || `${this.name} (Copy)`;
  campaignData.status = 'draft';
  campaignData.analytics = {
    totalRecipients: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    uniqueOpens: 0,
    clicked: 0,
    uniqueClicks: 0,
    bounced: 0,
    softBounced: 0,
    hardBounced: 0,
    unsubscribed: 0,
    complained: 0,
    conversions: 0,
    revenue: 0
  };
  campaignData.sendingProgress = {
    currentBatch: 0,
    totalBatches: 0,
    errors: []
  };
  
  const EmailCampaign = mongoose.model('EmailCampaign');
  return EmailCampaign.create(campaignData);
};

emailCampaignSchema.methods.softDelete = async function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Static Methods
emailCampaignSchema.statics.getScheduledCampaigns = async function() {
  return this.find({
    status: 'scheduled',
    'schedule.scheduledAt': { $lte: new Date() },
    isDeleted: false
  });
};

emailCampaignSchema.statics.getRecurringCampaigns = async function() {
  return this.find({
    'schedule.type': 'recurring',
    status: { $in: ['scheduled', 'sent'] },
    isDeleted: false,
    $or: [
      { 'schedule.recurring.endDate': { $gte: new Date() } },
      { 'schedule.recurring.endDate': null }
    ]
  });
};

emailCampaignSchema.statics.getCampaignStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$type',
        totalCampaigns: { $sum: 1 },
        totalSent: { $sum: '$analytics.sent' },
        totalDelivered: { $sum: '$analytics.delivered' },
        totalOpens: { $sum: '$analytics.uniqueOpens' },
        totalClicks: { $sum: '$analytics.uniqueClicks' },
        totalBounces: { $sum: '$analytics.bounced' },
        totalUnsubscribes: { $sum: '$analytics.unsubscribed' }
      }
    }
  ]);
};

emailCampaignSchema.statics.getTopPerformingCampaigns = async function(limit = 10, metric = 'openRate') {
  const campaigns = await this.find({
    status: 'sent',
    isDeleted: false,
    'analytics.delivered': { $gt: 0 }
  }).sort({ createdAt: -1 }).limit(100);
  
  // Calculate rates and sort
  const campaignsWithRates = campaigns.map(c => ({
    ...c.toObject(),
    openRate: (c.analytics.uniqueOpens / c.analytics.delivered) * 100,
    clickRate: (c.analytics.uniqueClicks / c.analytics.delivered) * 100
  }));
  
  campaignsWithRates.sort((a, b) => b[metric] - a[metric]);
  return campaignsWithRates.slice(0, limit);
};

const EmailCampaign = mongoose.model('EmailCampaign', emailCampaignSchema);

module.exports = EmailCampaign;

