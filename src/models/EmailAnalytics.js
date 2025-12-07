const mongoose = require('mongoose');

/**
 * Email Analytics Schema
 * Tracks individual email events for detailed analytics
 */
const emailEventSchema = new mongoose.Schema({
  // Campaign reference
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailCampaign',
    required: true,
    index: true
  },
  
  // Subscriber reference
  subscriber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailSubscriber',
    required: true,
    index: true
  },
  
  // Email address (denormalized for quick access)
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  
  // Event type
  eventType: {
    type: String,
    enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained', 'converted'],
    required: true,
    index: true
  },
  
  // Event timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Metadata based on event type
  metadata: {
    // For clicks
    linkUrl: String,
    linkLabel: String,
    
    // For bounces
    bounceType: {
      type: String,
      enum: ['soft', 'hard']
    },
    bounceReason: String,
    bounceCode: String,
    
    // For complaints
    complaintType: String,
    feedbackId: String,
    
    // For conversions
    conversionType: String,
    conversionValue: Number,
    orderId: mongoose.Schema.Types.ObjectId,
    
    // For unsubscribes
    unsubscribeReason: String,
    unsubscribeFeedback: String
  },
  
  // Device and location info
  deviceInfo: {
    userAgent: String,
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown']
    },
    browser: String,
    os: String,
    clientType: {
      type: String,
      enum: ['webmail', 'desktop', 'mobile', 'unknown']
    }
  },
  
  // Geo location
  location: {
    ip: String,
    country: String,
    region: String,
    city: String
  },
  
  // Tracking identifiers
  messageId: String,
  trackingId: String,
  
  // Is this a unique event (first time for this subscriber/campaign combo)
  isUnique: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
emailEventSchema.index({ campaign: 1, eventType: 1 });
emailEventSchema.index({ campaign: 1, subscriber: 1 });
emailEventSchema.index({ subscriber: 1, eventType: 1 });
emailEventSchema.index({ campaign: 1, timestamp: -1 });
emailEventSchema.index({ eventType: 1, timestamp: -1 });

// Static Methods
emailEventSchema.statics.recordEvent = async function(data) {
  const { campaign, subscriber, email, eventType, metadata, deviceInfo, location, messageId } = data;
  
  // Check if this is a unique event
  let isUnique = true;
  if (['opened', 'clicked'].includes(eventType)) {
    const existingEvent = await this.findOne({
      campaign,
      subscriber,
      eventType
    });
    isUnique = !existingEvent;
  }
  
  return this.create({
    campaign,
    subscriber,
    email,
    eventType,
    metadata,
    deviceInfo,
    location,
    messageId,
    isUnique
  });
};

emailEventSchema.statics.getCampaignEvents = async function(campaignId, options = {}) {
  const query = { campaign: campaignId };
  
  if (options.eventType) {
    query.eventType = options.eventType;
  }
  
  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = options.startDate;
    if (options.endDate) query.timestamp.$lte = options.endDate;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 100)
    .populate('subscriber', 'email firstName lastName');
};

emailEventSchema.statics.getCampaignAnalytics = async function(campaignId) {
  const result = await this.aggregate([
    { $match: { campaign: new mongoose.Types.ObjectId(campaignId) } },
    {
      $group: {
        _id: '$eventType',
        total: { $sum: 1 },
        unique: { $sum: { $cond: ['$isUnique', 1, 0] } }
      }
    }
  ]);
  
  const analytics = {
    sent: { total: 0, unique: 0 },
    delivered: { total: 0, unique: 0 },
    opened: { total: 0, unique: 0 },
    clicked: { total: 0, unique: 0 },
    bounced: { total: 0, unique: 0 },
    unsubscribed: { total: 0, unique: 0 },
    complained: { total: 0, unique: 0 },
    converted: { total: 0, unique: 0 }
  };
  
  result.forEach(r => {
    if (analytics[r._id]) {
      analytics[r._id] = { total: r.total, unique: r.unique };
    }
  });
  
  return analytics;
};

emailEventSchema.statics.getClicksByLink = async function(campaignId) {
  return this.aggregate([
    {
      $match: {
        campaign: new mongoose.Types.ObjectId(campaignId),
        eventType: 'clicked'
      }
    },
    {
      $group: {
        _id: '$metadata.linkUrl',
        totalClicks: { $sum: 1 },
        uniqueClicks: { $sum: { $cond: ['$isUnique', 1, 0] } },
        label: { $first: '$metadata.linkLabel' }
      }
    },
    { $sort: { totalClicks: -1 } }
  ]);
};

emailEventSchema.statics.getDeviceBreakdown = async function(campaignId) {
  return this.aggregate([
    {
      $match: {
        campaign: new mongoose.Types.ObjectId(campaignId),
        eventType: 'opened'
      }
    },
    {
      $group: {
        _id: '$deviceInfo.deviceType',
        count: { $sum: 1 }
      }
    }
  ]);
};

emailEventSchema.statics.getLocationBreakdown = async function(campaignId) {
  return this.aggregate([
    {
      $match: {
        campaign: new mongoose.Types.ObjectId(campaignId),
        eventType: 'opened'
      }
    },
    {
      $group: {
        _id: '$location.country',
        count: { $sum: 1 },
        cities: { $addToSet: '$location.city' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);
};

emailEventSchema.statics.getHourlyDistribution = async function(campaignId) {
  return this.aggregate([
    {
      $match: {
        campaign: new mongoose.Types.ObjectId(campaignId),
        eventType: { $in: ['opened', 'clicked'] }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          eventType: '$eventType'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.hour': 1 } }
  ]);
};

emailEventSchema.statics.getSubscriberEngagement = async function(subscriberId, options = {}) {
  const query = { subscriber: subscriberId };
  
  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = options.startDate;
    if (options.endDate) query.timestamp.$lte = options.endDate;
  }
  
  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    }
  ]);
  
  return result;
};

emailEventSchema.statics.getOverallStats = async function(startDate, endDate) {
  const query = {};
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$eventType',
        total: { $sum: 1 },
        uniqueCampaigns: { $addToSet: '$campaign' },
        uniqueSubscribers: { $addToSet: '$subscriber' }
      }
    },
    {
      $project: {
        _id: 1,
        total: 1,
        campaignCount: { $size: '$uniqueCampaigns' },
        subscriberCount: { $size: '$uniqueSubscribers' }
      }
    }
  ]);
};

emailEventSchema.statics.cleanupOldEvents = async function(daysToKeep = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
  
  return result.deletedCount;
};

const EmailEvent = mongoose.model('EmailEvent', emailEventSchema);

/**
 * Email Daily Stats Schema
 * Aggregated daily statistics for faster dashboard queries
 */
const emailDailyStatsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailCampaign',
    index: true
  },
  
  // Aggregated metrics
  sent: {
    type: Number,
    default: 0
  },
  delivered: {
    type: Number,
    default: 0
  },
  opens: {
    type: Number,
    default: 0
  },
  uniqueOpens: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  uniqueClicks: {
    type: Number,
    default: 0
  },
  bounces: {
    type: Number,
    default: 0
  },
  unsubscribes: {
    type: Number,
    default: 0
  },
  complaints: {
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
}, {
  timestamps: true
});

emailDailyStatsSchema.index({ date: 1, campaign: 1 }, { unique: true });

// Static methods
emailDailyStatsSchema.statics.updateStats = async function(date, campaignId, updates) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  return this.findOneAndUpdate(
    { date: startOfDay, campaign: campaignId },
    { $inc: updates },
    { upsert: true, new: true }
  );
};

emailDailyStatsSchema.statics.getStats = async function(startDate, endDate, campaignId = null) {
  const query = {
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (campaignId) {
    query.campaign = campaignId;
  }
  
  return this.find(query).sort({ date: 1 });
};

emailDailyStatsSchema.statics.getAggregatedStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSent: { $sum: '$sent' },
        totalDelivered: { $sum: '$delivered' },
        totalOpens: { $sum: '$opens' },
        totalUniqueOpens: { $sum: '$uniqueOpens' },
        totalClicks: { $sum: '$clicks' },
        totalUniqueClicks: { $sum: '$uniqueClicks' },
        totalBounces: { $sum: '$bounces' },
        totalUnsubscribes: { $sum: '$unsubscribes' },
        totalComplaints: { $sum: '$complaints' },
        totalConversions: { $sum: '$conversions' },
        totalRevenue: { $sum: '$revenue' }
      }
    }
  ]);
};

const EmailDailyStats = mongoose.model('EmailDailyStats', emailDailyStatsSchema);

module.exports = {
  EmailEvent,
  EmailDailyStats
};

