const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Email Subscriber Schema
 * Manages email subscribers and their preferences for marketing communications
 */
const emailSubscriberSchema = new mongoose.Schema({
  // Link to user (optional - for registered users)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  
  // Email (required for all subscribers)
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email address']
  },
  
  // Subscriber information
  firstName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  
  // Subscription status
  status: {
    type: String,
    enum: ['subscribed', 'unsubscribed', 'pending', 'bounced', 'complained'],
    default: 'pending'
  },
  
  // Subscription preferences
  preferences: {
    // Types of emails to receive
    newsletter: {
      type: Boolean,
      default: true
    },
    promotional: {
      type: Boolean,
      default: true
    },
    announcements: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: true
    },
    monthlyDigest: {
      type: Boolean,
      default: false
    },
    productUpdates: {
      type: Boolean,
      default: true
    },
    tips: {
      type: Boolean,
      default: true
    }
  },
  
  // Email frequency preference
  frequency: {
    type: String,
    enum: ['immediate', 'daily', 'weekly', 'monthly'],
    default: 'immediate'
  },
  
  // Source of subscription
  source: {
    type: String,
    enum: ['website', 'app', 'checkout', 'popup', 'footer', 'referral', 'import', 'api', 'admin', 'booking', 'registration'],
    default: 'website'
  },
  
  // Source details
  sourceDetails: {
    campaign: String,
    referrer: String,
    landingPage: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String
  },
  
  // Segmentation tags
  tags: [{
    type: String,
    trim: true
  }],
  
  // Custom fields for segmentation
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Location for geo-targeting
  location: {
    city: String,
    state: String,
    country: String,
    timezone: String
  },
  
  // Engagement metrics
  engagement: {
    totalEmailsSent: {
      type: Number,
      default: 0
    },
    totalOpens: {
      type: Number,
      default: 0
    },
    totalClicks: {
      type: Number,
      default: 0
    },
    lastOpenedAt: Date,
    lastClickedAt: Date,
    lastEmailSentAt: Date,
    engagementScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Subscription dates
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  unsubscribedAt: Date,
  
  // Double opt-in
  doubleOptIn: {
    required: {
      type: Boolean,
      default: true
    },
    token: String,
    tokenExpires: Date,
    confirmed: {
      type: Boolean,
      default: false
    }
  },
  
  // Unsubscribe token (for one-click unsubscribe)
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Unsubscribe reason
  unsubscribeReason: {
    type: String,
    enum: ['too_many_emails', 'not_relevant', 'never_signed_up', 'privacy', 'other'],
  },
  unsubscribeFeedback: String,
  
  // Bounce information
  bounceInfo: {
    type: {
      type: String,
      enum: ['soft', 'hard']
    },
    count: {
      type: Number,
      default: 0
    },
    lastBounceAt: Date,
    reason: String
  },
  
  // Complaint information
  complaintInfo: {
    complainedAt: Date,
    feedbackType: String,
    reportedBy: String
  },
  
  // IP and consent tracking
  consent: {
    ipAddress: String,
    userAgent: String,
    consentedAt: Date,
    consentMethod: {
      type: String,
      enum: ['checkbox', 'form', 'api', 'import', 'verbal']
    },
    privacyPolicyVersion: String
  },
  
  // GDPR compliance
  gdpr: {
    dataProcessingConsent: {
      type: Boolean,
      default: false
    },
    marketingConsent: {
      type: Boolean,
      default: false
    },
    thirdPartyConsent: {
      type: Boolean,
      default: false
    },
    consentDate: Date,
    lastUpdated: Date
  },
  
  // Lists/segments this subscriber belongs to
  lists: [{
    type: String,
    trim: true
  }],
  
  // Campaign history
  campaignHistory: [{
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailCampaign'
    },
    sentAt: Date,
    openedAt: Date,
    clickedAt: Date,
    clickedLinks: [String],
    unsubscribedFromCampaign: Boolean
  }],
  
  // Notes (admin)
  notes: String,
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
emailSubscriberSchema.index({ email: 1 }, { unique: true });
emailSubscriberSchema.index({ user: 1 }, { sparse: true });
emailSubscriberSchema.index({ status: 1 });
emailSubscriberSchema.index({ tags: 1 });
emailSubscriberSchema.index({ lists: 1 });
emailSubscriberSchema.index({ 'location.city': 1 });
emailSubscriberSchema.index({ 'location.country': 1 });
emailSubscriberSchema.index({ subscribedAt: -1 });
emailSubscriberSchema.index({ 'engagement.engagementScore': -1 });
emailSubscriberSchema.index({ 'engagement.lastOpenedAt': -1 });
emailSubscriberSchema.index({ unsubscribeToken: 1 }, { sparse: true });
emailSubscriberSchema.index({ 'doubleOptIn.token': 1 }, { sparse: true });
emailSubscriberSchema.index({ isDeleted: 1 });
emailSubscriberSchema.index({ email: 'text', firstName: 'text', lastName: 'text' });

// Virtuals
emailSubscriberSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || this.email;
});

emailSubscriberSchema.virtual('openRate').get(function() {
  if (this.engagement.totalEmailsSent === 0) return 0;
  return ((this.engagement.totalOpens / this.engagement.totalEmailsSent) * 100).toFixed(2);
});

emailSubscriberSchema.virtual('clickRate').get(function() {
  if (this.engagement.totalEmailsSent === 0) return 0;
  return ((this.engagement.totalClicks / this.engagement.totalEmailsSent) * 100).toFixed(2);
});

emailSubscriberSchema.virtual('isActive').get(function() {
  return this.status === 'subscribed' && !this.isDeleted;
});

// Ensure virtuals are serialized
emailSubscriberSchema.set('toJSON', { virtuals: true });
emailSubscriberSchema.set('toObject', { virtuals: true });

// Pre-save middleware
emailSubscriberSchema.pre('save', function(next) {
  // Generate unsubscribe token if not exists
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = crypto.randomBytes(32).toString('hex');
  }
  
  // Calculate engagement score
  this.calculateEngagementScore();
  
  next();
});

// Instance Methods
emailSubscriberSchema.methods.calculateEngagementScore = function() {
  let score = 0;
  const sent = this.engagement.totalEmailsSent;
  
  if (sent === 0) {
    this.engagement.engagementScore = 50; // New subscriber starts at 50
    return;
  }
  
  // Open rate contributes 40%
  const openRate = (this.engagement.totalOpens / sent) * 100;
  score += Math.min(openRate * 0.4, 40);
  
  // Click rate contributes 40%
  const clickRate = (this.engagement.totalClicks / sent) * 100;
  score += Math.min(clickRate * 4, 40); // Clicks are worth more
  
  // Recency contributes 20%
  if (this.engagement.lastOpenedAt) {
    const daysSinceOpen = (Date.now() - this.engagement.lastOpenedAt) / (1000 * 60 * 60 * 24);
    if (daysSinceOpen < 7) score += 20;
    else if (daysSinceOpen < 30) score += 15;
    else if (daysSinceOpen < 90) score += 10;
    else if (daysSinceOpen < 180) score += 5;
  }
  
  this.engagement.engagementScore = Math.round(Math.min(score, 100));
};

emailSubscriberSchema.methods.generateConfirmationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.doubleOptIn.token = crypto.createHash('sha256').update(token).digest('hex');
  this.doubleOptIn.tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

emailSubscriberSchema.methods.confirmSubscription = async function() {
  this.status = 'subscribed';
  this.doubleOptIn.confirmed = true;
  this.confirmedAt = new Date();
  this.doubleOptIn.token = undefined;
  this.doubleOptIn.tokenExpires = undefined;
  return this.save();
};

emailSubscriberSchema.methods.unsubscribe = async function(reason, feedback) {
  this.status = 'unsubscribed';
  this.unsubscribedAt = new Date();
  if (reason) this.unsubscribeReason = reason;
  if (feedback) this.unsubscribeFeedback = feedback;
  return this.save();
};

emailSubscriberSchema.methods.resubscribe = async function() {
  if (this.status === 'bounced' || this.bounceInfo.type === 'hard') {
    throw new Error('Cannot resubscribe a hard-bounced email');
  }
  this.status = 'subscribed';
  this.unsubscribedAt = undefined;
  this.unsubscribeReason = undefined;
  this.unsubscribeFeedback = undefined;
  this.subscribedAt = new Date();
  return this.save();
};

emailSubscriberSchema.methods.recordEmailSent = async function(campaignId) {
  this.engagement.totalEmailsSent += 1;
  this.engagement.lastEmailSentAt = new Date();
  
  if (campaignId) {
    this.campaignHistory.push({
      campaignId,
      sentAt: new Date()
    });
  }
  
  return this.save();
};

emailSubscriberSchema.methods.recordOpen = async function(campaignId) {
  this.engagement.totalOpens += 1;
  this.engagement.lastOpenedAt = new Date();
  
  if (campaignId) {
    const history = this.campaignHistory.find(h => 
      h.campaignId.toString() === campaignId.toString() && !h.openedAt
    );
    if (history) {
      history.openedAt = new Date();
    }
  }
  
  this.calculateEngagementScore();
  return this.save();
};

emailSubscriberSchema.methods.recordClick = async function(campaignId, linkUrl) {
  this.engagement.totalClicks += 1;
  this.engagement.lastClickedAt = new Date();
  
  if (campaignId) {
    const history = this.campaignHistory.find(h => 
      h.campaignId.toString() === campaignId.toString()
    );
    if (history) {
      if (!history.clickedAt) history.clickedAt = new Date();
      if (linkUrl && !history.clickedLinks.includes(linkUrl)) {
        history.clickedLinks.push(linkUrl);
      }
    }
  }
  
  this.calculateEngagementScore();
  return this.save();
};

emailSubscriberSchema.methods.recordBounce = async function(type, reason) {
  this.bounceInfo.type = type;
  this.bounceInfo.count += 1;
  this.bounceInfo.lastBounceAt = new Date();
  this.bounceInfo.reason = reason;
  
  if (type === 'hard' || this.bounceInfo.count >= 3) {
    this.status = 'bounced';
  }
  
  return this.save();
};

emailSubscriberSchema.methods.recordComplaint = async function(feedbackType, reportedBy) {
  this.status = 'complained';
  this.complaintInfo = {
    complainedAt: new Date(),
    feedbackType,
    reportedBy
  };
  return this.save();
};

emailSubscriberSchema.methods.updatePreferences = async function(preferences) {
  Object.assign(this.preferences, preferences);
  return this.save();
};

emailSubscriberSchema.methods.addTag = async function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return this;
};

emailSubscriberSchema.methods.removeTag = async function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

emailSubscriberSchema.methods.addToList = async function(listName) {
  if (!this.lists.includes(listName)) {
    this.lists.push(listName);
    return this.save();
  }
  return this;
};

emailSubscriberSchema.methods.removeFromList = async function(listName) {
  this.lists = this.lists.filter(l => l !== listName);
  return this.save();
};

// Static Methods
emailSubscriberSchema.statics.findByEmail = async function(email) {
  return this.findOne({ email: email.toLowerCase(), isDeleted: false });
};

emailSubscriberSchema.statics.findByUnsubscribeToken = async function(token) {
  return this.findOne({ unsubscribeToken: token, isDeleted: false });
};

emailSubscriberSchema.statics.findByConfirmationToken = async function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    'doubleOptIn.token': hashedToken,
    'doubleOptIn.tokenExpires': { $gt: Date.now() },
    isDeleted: false
  });
};

emailSubscriberSchema.statics.getActiveSubscribers = async function(options = {}) {
  const query = {
    status: 'subscribed',
    isDeleted: false
  };
  
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  if (options.lists && options.lists.length > 0) {
    query.lists = { $in: options.lists };
  }
  
  if (options.preference) {
    query[`preferences.${options.preference}`] = true;
  }
  
  return this.find(query);
};

emailSubscriberSchema.statics.getSubscriberStats = async function() {
  const stats = await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    subscribed: 0,
    unsubscribed: 0,
    pending: 0,
    bounced: 0,
    complained: 0
  };
  
  stats.forEach(s => {
    result[s._id] = s.count;
    result.total += s.count;
  });
  
  return result;
};

emailSubscriberSchema.statics.getEngagementDistribution = async function() {
  return this.aggregate([
    { $match: { status: 'subscribed', isDeleted: false } },
    {
      $bucket: {
        groupBy: '$engagement.engagementScore',
        boundaries: [0, 20, 40, 60, 80, 101],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          avgOpens: { $avg: '$engagement.totalOpens' },
          avgClicks: { $avg: '$engagement.totalClicks' }
        }
      }
    }
  ]);
};

emailSubscriberSchema.statics.findOrCreate = async function(email, data = {}) {
  let subscriber = await this.findOne({ email: email.toLowerCase() });
  
  if (!subscriber) {
    subscriber = await this.create({
      email: email.toLowerCase(),
      ...data
    });
  }
  
  return subscriber;
};

emailSubscriberSchema.statics.syncFromUser = async function(user) {
  if (!user.email) return null;
  
  let subscriber = await this.findOne({ email: user.email.toLowerCase() });
  
  if (subscriber) {
    // Update subscriber with user data
    subscriber.user = user._id;
    subscriber.firstName = user.firstName || subscriber.firstName;
    subscriber.lastName = user.lastName || subscriber.lastName;
    subscriber.phoneNumber = user.phoneNumber || subscriber.phoneNumber;
    if (user.profile?.address) {
      subscriber.location = {
        city: user.profile.address.city,
        state: user.profile.address.state,
        country: user.profile.address.country
      };
    }
    await subscriber.save();
  } else {
    // Create new subscriber from user
    subscriber = await this.create({
      user: user._id,
      email: user.email.toLowerCase(),
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      source: 'registration',
      status: 'subscribed',
      doubleOptIn: {
        required: false,
        confirmed: true
      },
      confirmedAt: new Date(),
      location: user.profile?.address ? {
        city: user.profile.address.city,
        state: user.profile.address.state,
        country: user.profile.address.country
      } : undefined
    });
  }
  
  return subscriber;
};

const EmailSubscriber = mongoose.model('EmailSubscriber', emailSubscriberSchema);

module.exports = EmailSubscriber;

