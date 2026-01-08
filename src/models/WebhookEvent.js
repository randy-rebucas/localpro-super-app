const mongoose = require('mongoose');

/**
 * WebhookEvent Schema
 * Stores all webhook events for real-time notifications
 */
const webhookEventSchema = new mongoose.Schema({
  // Event type
  eventType: {
    type: String,
    required: true,
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
      'subscription.cancelled'
    ],
    index: true
  },

  // User who should receive this event notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Event payload/data
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Related entity references for easier querying
  relatedEntities: {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobApplication'
    },
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral'
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    }
  },

  // Event status
  status: {
    type: String,
    enum: ['pending', 'delivered', 'failed', 'read'],
    default: 'pending',
    index: true
  },

  // Delivery attempts (for webhook URL delivery if configured)
  deliveryAttempts: {
    type: Number,
    default: 0
  },

  lastDeliveryAttempt: {
    type: Date
  },

  deliveryError: {
    type: String
  },

  // When the event was read by the user
  readAt: {
    type: Date
  },

  // Event metadata
  metadata: {
    source: String,
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
webhookEventSchema.index({ userId: 1, createdAt: -1 });
webhookEventSchema.index({ userId: 1, status: 1, createdAt: -1 });
webhookEventSchema.index({ eventType: 1, createdAt: -1 });
webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Mark event as read
webhookEventSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Mark event as delivered
webhookEventSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  return this.save();
};

// Record delivery failure
webhookEventSchema.methods.recordDeliveryFailure = function(error) {
  this.deliveryAttempts += 1;
  this.lastDeliveryAttempt = new Date();
  this.deliveryError = error;
  this.status = 'failed';
  return this.save();
};

// Static method to get unread count for user
webhookEventSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    userId,
    status: { $in: ['pending', 'delivered'] }
  });
};

// Static method to get recent events for user
webhookEventSchema.statics.getRecentEvents = async function(userId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    eventType = null,
    status = null
  } = options;

  const query = { userId };
  
  if (eventType) {
    query.eventType = eventType;
  }
  
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Static method to mark multiple events as read
webhookEventSchema.statics.markMultipleAsRead = async function(eventIds, userId) {
  return this.updateMany(
    {
      _id: { $in: eventIds },
      userId
    },
    {
      $set: {
        status: 'read',
        readAt: new Date()
      }
    }
  );
};

// Static method to delete old events
webhookEventSchema.statics.deleteOldEvents = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate }
  });
};

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
