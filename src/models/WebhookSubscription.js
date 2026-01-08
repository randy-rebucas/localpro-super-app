const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * WebhookSubscription Schema
 * Allows users to subscribe to webhook events via HTTP callbacks
 */
const webhookSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Webhook URL to receive events
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid HTTP/HTTPS URL'
    }
  },

  // Event types to subscribe to
  eventTypes: [{
    type: String,
    enum: [
      'booking.confirmed',
      'booking.completed',
      'booking.cancelled',
      'message.received',
      'payment.successful',
      'payment.failed',
      'application.status_changed',
      'referral.completed',
      'subscription.renewed',
      'subscription.cancelled',
      '*' // Subscribe to all events
    ]
  }],

  // Secret key for HMAC signature verification
  secret: {
    type: String,
    required: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },

  // Subscription status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Delivery statistics
  deliveryStats: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    successfulDeliveries: {
      type: Number,
      default: 0
    },
    failedDeliveries: {
      type: Number,
      default: 0
    },
    lastSuccessAt: Date,
    lastFailureAt: Date,
    lastFailureReason: String
  },

  // Subscription metadata
  description: String,
  
  // Contact information for webhook issues
  contact: {
    email: String,
    phone: String
  }
}, {
  timestamps: true
});

// Indexes
webhookSubscriptionSchema.index({ userId: 1, isActive: 1 });
webhookSubscriptionSchema.index({ eventTypes: 1, isActive: 1 });

// Record successful delivery
webhookSubscriptionSchema.methods.recordSuccess = function() {
  this.deliveryStats.totalAttempts += 1;
  this.deliveryStats.successfulDeliveries += 1;
  this.deliveryStats.lastSuccessAt = new Date();
  return this.save();
};

// Record failed delivery
webhookSubscriptionSchema.methods.recordFailure = function(reason) {
  this.deliveryStats.totalAttempts += 1;
  this.deliveryStats.failedDeliveries += 1;
  this.deliveryStats.lastFailureAt = new Date();
  this.deliveryStats.lastFailureReason = reason;
  
  // Auto-disable after too many failures
  if (this.deliveryStats.failedDeliveries >= 10) {
    this.isActive = false;
  }
  
  return this.save();
};

// Regenerate secret
webhookSubscriptionSchema.methods.regenerateSecret = function() {
  this.secret = crypto.randomBytes(32).toString('hex');
  return this.save();
};

module.exports = mongoose.model('WebhookSubscription', webhookSubscriptionSchema);
