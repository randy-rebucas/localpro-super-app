const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    monthly: {
      type: Number,
      required: true
    },
    yearly: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  features: [{
    name: String,
    description: String,
    included: {
      type: Boolean,
      default: true
    },
    limit: Number, // null means unlimited
    unit: String // e.g., 'per_month', 'per_booking', 'per_user'
  }],
  limits: {
    maxServices: Number,
    maxBookings: Number,
    maxProviders: Number,
    maxStorage: Number, // in MB
    maxApiCalls: Number
  },
  benefits: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
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
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  nextBillingDate: Date,
  cancelledAt: Date,
  cancellationReason: String,
  paymentMethod: {
    type: String,
    enum: ['paypal', 'paymaya', 'stripe', 'bank_transfer'],
    default: 'paypal'
  },
  paymentDetails: {
    paypalSubscriptionId: String,
    paymayaSubscriptionId: String,
    stripeSubscriptionId: String,
    lastPaymentId: String,
    lastPaymentDate: Date,
    nextPaymentAmount: Number
  },
  usage: {
    services: {
      current: {
        type: Number,
        default: 0
      },
      limit: Number
    },
    bookings: {
      current: {
        type: Number,
        default: 0
      },
      limit: Number
    },
    storage: {
      current: {
        type: Number,
        default: 0
      },
      limit: Number
    },
    apiCalls: {
      current: {
        type: Number,
        default: 0
      },
      limit: Number
    }
  },
  features: {
    prioritySupport: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    whiteLabel: {
      type: Boolean,
      default: false
    }
  },
  trial: {
    isTrial: {
      type: Boolean,
      default: false
    },
    trialEndDate: Date,
    trialUsed: {
      type: Boolean,
      default: false
    }
  },
  history: [{
    action: {
      type: String,
      enum: ['subscribed', 'upgraded', 'downgraded', 'cancelled', 'renewed', 'suspended', 'reactivated']
    },
    fromPlan: String,
    toPlan: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: String,
    amount: Number
  }]
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
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['paypal', 'paymaya', 'stripe', 'bank_transfer'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    paypalOrderId: String,
    paypalPaymentId: String,
    paymayaCheckoutId: String,
    paymayaPaymentId: String,
    stripePaymentIntentId: String,
    bankReference: String
  },
  billingPeriod: {
    startDate: Date,
    endDate: Date
  },
  description: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  processedAt: Date,
  failedAt: Date,
  failureReason: String,
  refundedAt: Date,
  refundAmount: Number,
  refundReason: String
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
    required: true,
    enum: [
      'service_creation', 'booking_management', 'analytics_view',
      'api_call', 'file_upload', 'email_notification', 'sms_notification',
      'custom_branding', 'priority_support', 'advanced_search'
    ]
  },
  usage: {
    count: {
      type: Number,
      default: 1
    },
    amount: Number, // for features that have monetary value
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
userSubscriptionSchema.index({ user: 1 });
userSubscriptionSchema.index({ status: 1 });
userSubscriptionSchema.index({ nextBillingDate: 1 });
userSubscriptionSchema.index({ 'paymentDetails.paypalSubscriptionId': 1 });
userSubscriptionSchema.index({ 'paymentDetails.paymayaSubscriptionId': 1 });

paymentSchema.index({ user: 1 });
paymentSchema.index({ subscription: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

featureUsageSchema.index({ user: 1, feature: 1 });
featureUsageSchema.index({ subscription: 1 });
featureUsageSchema.index({ timestamp: -1 });

// Virtual for subscription duration
userSubscriptionSchema.virtual('duration').get(function() {
  if (this.endDate) {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((new Date() - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for days until renewal
userSubscriptionSchema.virtual('daysUntilRenewal').get(function() {
  if (this.nextBillingDate) {
    return Math.ceil((this.nextBillingDate - new Date()) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Method to check if subscription is active
userSubscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && (!this.endDate || this.endDate > new Date());
};

// Method to check if user has access to feature
userSubscriptionSchema.methods.hasFeatureAccess = function(featureName) {
  if (!this.isActive()) return false;
  
  const plan = this.plan;
  if (!plan) return false;
  
  const feature = plan.features.find(f => f.name === featureName);
  return feature && feature.included;
};

// Method to check usage limit
userSubscriptionSchema.methods.checkUsageLimit = function(featureName) {
  if (!this.hasFeatureAccess(featureName)) return false;
  
  const plan = this.plan;
  const feature = plan.features.find(f => f.name === featureName);
  
  if (!feature || !feature.limit) return true; // Unlimited
  
  const currentUsage = this.usage[featureName]?.current || 0;
  return currentUsage < feature.limit;
};

// Method to increment usage
userSubscriptionSchema.methods.incrementUsage = function(featureName, amount = 1) {
  if (!this.usage[featureName]) {
    this.usage[featureName] = { current: 0 };
  }
  
  this.usage[featureName].current += amount;
  return this.save();
};

// Method to cancel subscription
userSubscriptionSchema.methods.cancel = function(reason = 'User requested cancellation') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  
  this.history.push({
    action: 'cancelled',
    reason: reason,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to renew subscription
userSubscriptionSchema.methods.renew = function() {
  const now = new Date();
  const billingCycle = this.billingCycle === 'yearly' ? 365 : 30;
  
  this.nextBillingDate = new Date(now.getTime() + billingCycle * 24 * 60 * 60 * 1000);
  this.endDate = this.nextBillingDate;
  
  this.history.push({
    action: 'renewed',
    timestamp: now
  });
  
  return this.save();
};

// Static method to get active subscriptions
userSubscriptionSchema.statics.getActiveSubscriptions = function() {
  return this.find({
    status: 'active',
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: new Date() } }
    ]
  }).populate('user plan');
};

// Static method to get subscriptions due for renewal
userSubscriptionSchema.statics.getSubscriptionsDueForRenewal = function() {
  return this.find({
    status: 'active',
    nextBillingDate: { $lte: new Date() }
  }).populate('user plan');
};

module.exports = {
  SubscriptionPlan: mongoose.model('SubscriptionPlan', subscriptionPlanSchema),
  UserSubscription: mongoose.model('UserSubscription', userSubscriptionSchema),
  Payment: mongoose.model('Payment', paymentSchema),
  FeatureUsage: mongoose.model('FeatureUsage', featureUsageSchema)
};