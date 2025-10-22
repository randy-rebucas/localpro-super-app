const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  referee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'expired', 'cancelled'],
    default: 'pending',
    index: true
  },
  referralType: {
    type: String,
    enum: ['signup', 'service_booking', 'supplies_purchase', 'course_enrollment', 'loan_application', 'rental_booking', 'subscription_upgrade'],
    required: true,
    index: true
  },
  // The specific action that triggered the referral reward
  triggerAction: {
    type: {
      type: String,
      enum: ['booking', 'purchase', 'enrollment', 'loan', 'rental', 'subscription'],
      required: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    referenceType: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  // Reward configuration
  reward: {
    type: {
      type: String,
      enum: ['credit', 'discount', 'cash', 'points', 'subscription_days'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    description: String,
    // For percentage-based rewards
    isPercentage: {
      type: Boolean,
      default: false
    },
    maxAmount: Number, // Maximum reward amount for percentage-based rewards
    // For subscription rewards
    subscriptionDays: Number,
    // For discount rewards
    discountCode: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount']
    }
  },
  // Tracking information
  tracking: {
    source: {
      type: String,
      enum: ['email', 'sms', 'social_media', 'direct_link', 'qr_code', 'app_share'],
      default: 'direct_link'
    },
    campaign: String, // Optional campaign identifier
    medium: String, // Optional medium (e.g., 'facebook', 'twitter', 'email')
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    ipAddress: String,
    userAgent: String,
    referrerUrl: String
  },
  // Timeline tracking
  timeline: {
    referredAt: {
      type: Date,
      default: Date.now
    },
    signupAt: Date,
    firstActionAt: Date,
    completedAt: Date,
    rewardedAt: Date,
    expiresAt: {
      type: Date,
      default: function() {
        // Referral expires in 90 days
        return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      }
    }
  },
  // Reward distribution
  rewardDistribution: {
    referrerReward: {
      amount: Number,
      currency: String,
      type: String,
      status: {
        type: String,
        enum: ['pending', 'processed', 'paid', 'failed'],
        default: 'pending'
      },
      processedAt: Date,
      paymentMethod: String,
      transactionId: String
    },
    refereeReward: {
      amount: Number,
      currency: String,
      type: String,
      status: {
        type: String,
        enum: ['pending', 'processed', 'paid', 'failed'],
        default: 'pending'
      },
      processedAt: Date,
      paymentMethod: String,
      transactionId: String
    }
  },
  // Additional metadata
  metadata: {
    notes: String,
    tags: [String],
    customFields: mongoose.Schema.Types.Mixed
  },
  // Validation and verification
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verificationMethod: {
      type: String,
      enum: ['automatic', 'manual', 'admin']
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Analytics
  analytics: {
    clickCount: {
      type: Number,
      default: 0
    },
    conversionRate: Number,
    totalValue: Number,
    lifetimeValue: Number
  }
}, {
  timestamps: true
});

// Indexes for better performance
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referee: 1, status: 1 });
// referralCode already has unique: true which creates an index
referralSchema.index({ referralType: 1, status: 1 });
referralSchema.index({ 'timeline.referredAt': -1 });
referralSchema.index({ 'timeline.expiresAt': 1 });
referralSchema.index({ 'triggerAction.referenceId': 1, 'triggerAction.referenceType': 1 });

// Compound indexes
referralSchema.index({ referrer: 1, referralType: 1, status: 1 });
referralSchema.index({ referee: 1, referralType: 1, status: 1 });
referralSchema.index({ referrer: 1, 'timeline.referredAt': -1 });
referralSchema.index({ status: 1, 'timeline.expiresAt': 1 });
referralSchema.index({ 'rewardDistribution.referrerReward.status': 1, 'rewardDistribution.refereeReward.status': 1 });

// Virtual for referral age in days
referralSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const referredAt = this.timeline.referredAt;
  const diffTime = Math.abs(now - referredAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days until expiration
referralSchema.virtual('daysUntilExpiration').get(function() {
  const now = new Date();
  const expiresAt = this.timeline.expiresAt;
  const diffTime = expiresAt - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total reward value
referralSchema.virtual('totalRewardValue').get(function() {
  const referrerReward = this.rewardDistribution.referrerReward.amount || 0;
  const refereeReward = this.rewardDistribution.refereeReward.amount || 0;
  return referrerReward + refereeReward;
});

// Method to generate unique referral code
referralSchema.statics.generateReferralCode = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Generate 8-character code
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

// Method to check if referral is valid
referralSchema.methods.isValid = function() {
  const now = new Date();
  return this.status === 'pending' && this.timeline.expiresAt > now;
};

// Method to mark as completed
referralSchema.methods.markCompleted = function(triggerAction) {
  this.status = 'completed';
  this.triggerAction = triggerAction;
  this.timeline.completedAt = new Date();
  this.verification.isVerified = true;
  this.verification.verifiedAt = new Date();
  this.verification.verificationMethod = 'automatic';
  return this.save();
};

// Method to process rewards
referralSchema.methods.processRewards = async function() {
  if (this.status !== 'completed') {
    throw new Error('Cannot process rewards for incomplete referral');
  }

  // Process referrer reward
  if (this.rewardDistribution.referrerReward.amount > 0) {
    this.rewardDistribution.referrerReward.status = 'processed';
    this.rewardDistribution.referrerReward.processedAt = new Date();
  }

  // Process referee reward
  if (this.rewardDistribution.refereeReward.amount > 0) {
    this.rewardDistribution.refereeReward.status = 'processed';
    this.rewardDistribution.refereeReward.processedAt = new Date();
  }

  this.timeline.rewardedAt = new Date();
  return this.save();
};

// Method to calculate reward amount based on trigger action
referralSchema.methods.calculateReward = function(triggerAmount, rewardConfig) {
  if (rewardConfig.isPercentage) {
    const calculatedAmount = (triggerAmount * rewardConfig.amount) / 100;
    return Math.min(calculatedAmount, rewardConfig.maxAmount || Infinity);
  }
  return rewardConfig.amount;
};

// Static method to get referral statistics
referralSchema.statics.getReferralStats = async function(userId, timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);

  const stats = await this.aggregate([
    {
      $match: {
        referrer: mongoose.Types.ObjectId(userId),
        'timeline.referredAt': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalReferrals: { $sum: 1 },
        completedReferrals: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingReferrals: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        totalRewards: {
          $sum: {
            $add: [
              '$rewardDistribution.referrerReward.amount',
              '$rewardDistribution.refereeReward.amount'
            ]
          }
        },
        totalValue: { $sum: '$triggerAction.amount' }
      }
    }
  ]);

  return stats[0] || {
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalRewards: 0,
    totalValue: 0
  };
};

// Static method to find active referral by code
referralSchema.statics.findActiveByCode = function(referralCode) {
  return this.findOne({
    referralCode: referralCode,
    status: 'pending',
    'timeline.expiresAt': { $gt: new Date() }
  });
};

// Pre-save middleware to ensure unique referral code
referralSchema.pre('save', async function(next) {
  if (this.isNew && !this.referralCode) {
    let referralCode;
    let isUnique = false;
    
    while (!isUnique) {
      referralCode = this.constructor.generateReferralCode();
      const existing = await this.constructor.findOne({ referralCode });
      if (!existing) {
        isUnique = true;
      }
    }
    
    this.referralCode = referralCode;
  }
  next();
});

// Pre-save middleware to update analytics
referralSchema.pre('save', function(next) {
  if (this.isModified('analytics.clickCount') && this.analytics.clickCount > 0) {
    // Calculate conversion rate if we have completion data
    if (this.status === 'completed') {
      this.analytics.conversionRate = 1 / this.analytics.clickCount;
    }
  }
  next();
});

module.exports = mongoose.model('Referral', referralSchema);
