const mongoose = require('mongoose');

/**
 * Webhook Event Schema
 * Tracks processed webhook events to prevent duplicate processing and replay attacks
 */
const webhookEventSchema = new mongoose.Schema({
  // Provider (paymongo, stripe, xendit, paypal, paymaya)
  provider: {
    type: String,
    required: true,
    enum: ['paymongo', 'stripe', 'xendit', 'paypal', 'paymaya'],
    index: true
  },
  
  // Event ID from provider (unique per provider)
  eventId: {
    type: String,
    required: true,
    index: true
  },
  
  // Event type
  eventType: {
    type: String,
    required: true,
    index: true
  },
  
  // Event timestamp from provider
  eventTimestamp: {
    type: Date,
    required: true,
    index: true
  },
  
  // Event data (stored for debugging/audit)
  eventData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Processing status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'duplicate'],
    default: 'pending',
    index: true
  },
  
  // Processing result
  processingResult: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Error information if processing failed
  error: {
    message: String,
    stack: String,
    code: String
  },
  
  // Retry count
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Processing metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    signature: String,
    processingTime: Number // milliseconds
  },
  
  // Timestamps
  processedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 90 * 24 * 60 * 60 // Auto-delete after 90 days
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate events
webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

// Index for querying recent events
webhookEventSchema.index({ provider: 1, eventTimestamp: -1 });
webhookEventSchema.index({ status: 1, createdAt: -1 });

/**
 * Check if event has already been processed
 */
webhookEventSchema.statics.isEventProcessed = async function(provider, eventId) {
  const event = await this.findOne({ provider, eventId });
  return event && event.status === 'completed';
};

/**
 * Mark event as processing
 */
webhookEventSchema.statics.markAsProcessing = async function(provider, eventId, eventData) {
  return this.findOneAndUpdate(
    { provider, eventId },
    {
      $set: {
        status: 'processing',
        eventData,
        eventTimestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date()
      },
      $setOnInsert: {
        provider,
        eventId,
        eventType: eventData.type || eventData.event_type || 'unknown',
        createdAt: new Date()
      }
    },
    { upsert: true, new: true }
  );
};

/**
 * Mark event as completed
 */
webhookEventSchema.statics.markAsCompleted = async function(provider, eventId, result, processingTime) {
  return this.findOneAndUpdate(
    { provider, eventId },
    {
      $set: {
        status: 'completed',
        processingResult: result,
        processedAt: new Date(),
        'metadata.processingTime': processingTime
      }
    },
    { new: true }
  );
};

/**
 * Mark event as failed
 */
webhookEventSchema.statics.markAsFailed = async function(provider, eventId, error, retryCount = 0) {
  return this.findOneAndUpdate(
    { provider, eventId },
    {
      $set: {
        status: 'failed',
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code
        },
        retryCount,
        processedAt: new Date()
      }
    },
    { new: true }
  );
};

/**
 * Mark event as duplicate
 */
webhookEventSchema.statics.markAsDuplicate = async function(provider, eventId) {
  return this.findOneAndUpdate(
    { provider, eventId },
    {
      $set: {
        status: 'duplicate',
        processedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );
};

/**
 * Get webhook statistics
 */
webhookEventSchema.statics.getStatistics = async function(provider, startDate, endDate) {
  const query = { provider };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  
  const [total, completed, failed, duplicates] = await Promise.all([
    this.countDocuments(query),
    this.countDocuments({ ...query, status: 'completed' }),
    this.countDocuments({ ...query, status: 'failed' }),
    this.countDocuments({ ...query, status: 'duplicate' })
  ]);
  
  return {
    total,
    completed,
    failed,
    duplicates,
    successRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0
  };
};

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);

module.exports = WebhookEvent;

