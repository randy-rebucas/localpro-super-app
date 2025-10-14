const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['provider', 'client', 'enterprise'],
    required: true
  },
  tier: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    required: true
  },
  pricing: {
    monthly: {
      type: Number,
      required: true
    },
    yearly: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  features: {
    marketplace: {
      maxListings: Number,
      featuredListings: Number,
      prioritySupport: { type: Boolean, default: false }
    },
    supplies: {
      discount: Number, // percentage
      freeShipping: { type: Boolean, default: false },
      subscriptionKits: { type: Boolean, default: false }
    },
    academy: {
      freeCourses: Number,
      certificationAccess: { type: Boolean, default: false },
      liveSessions: { type: Boolean, default: false }
    },
    finance: {
      loanEligibility: { type: Boolean, default: false },
      lowerInterestRates: Number,
      fasterApproval: { type: Boolean, default: false }
    },
    rentals: {
      discount: Number,
      priorityBooking: { type: Boolean, default: false },
      insuranceIncluded: { type: Boolean, default: false }
    },
    ads: {
      adCredits: Number,
      advancedTargeting: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false }
    },
    facilityCare: {
      contractManagement: { type: Boolean, default: false },
      performanceTracking: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false }
    },
    general: {
      prioritySupport: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      whiteLabeling: { type: Boolean, default: false }
    }
  },
  limits: {
    maxUsers: Number,
    maxProjects: Number,
    storageLimit: String, // e.g., "10GB"
    apiCalls: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const userSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'suspended', 'pending'],
    default: 'pending'
  },
  billing: {
    cycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    nextBillingDate: Date,
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'mobile_money', 'wallet'],
      required: true
    },
    details: {
      cardLast4: String,
      bankName: String,
      accountType: String
    },
    autoRenew: {
      type: Boolean,
      default: true
    }
  },
  usage: {
    marketplaceListings: { type: Number, default: 0 },
    adCredits: { type: Number, default: 0 },
    apiCalls: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 } // in MB
  },
  benefits: {
    activated: [String], // List of activated benefits
    used: [{
      benefit: String,
      usedAt: Date,
      amount: Number
    }]
  },
  cancellation: {
    requestedAt: Date,
    reason: String,
    effectiveDate: Date,
    refundAmount: Number
  }
}, {
  timestamps: true
});

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription',
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
  type: {
    type: String,
    enum: ['subscription', 'upgrade', 'downgrade', 'renewal', 'refund'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'mobile_money', 'wallet', 'paypal'],
    required: true
  },
  transactionId: String,
  externalReference: String,
  description: String,
  paypalOrderId: String,
  paypalSubscriptionId: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

const featureUsageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription',
    required: true
  },
  feature: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    resource: String,
    amount: Number,
    metadata: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
subscriptionPlanSchema.index({ type: 1, tier: 1 });
subscriptionPlanSchema.index({ isActive: 1 });

userSubscriptionSchema.index({ user: 1 });
userSubscriptionSchema.index({ plan: 1 });
userSubscriptionSchema.index({ status: 1 });
userSubscriptionSchema.index({ 'billing.nextBillingDate': 1 });

paymentSchema.index({ user: 1 });
paymentSchema.index({ subscription: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

featureUsageSchema.index({ user: 1 });
featureUsageSchema.index({ subscription: 1 });
featureUsageSchema.index({ feature: 1 });
featureUsageSchema.index({ timestamp: -1 });

module.exports = {
  SubscriptionPlan: mongoose.model('SubscriptionPlan', subscriptionPlanSchema),
  UserSubscription: mongoose.model('UserSubscription', userSubscriptionSchema),
  Payment: mongoose.model('Payment', paymentSchema),
  FeatureUsage: mongoose.model('FeatureUsage', featureUsageSchema)
};
