const mongoose = require('mongoose');

/**
 * MaskedCall Model
 * 
 * Masked calling system for privacy protection
 * References: User (provider, client), Job, Conversation
 */
const maskedCallSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  providerPhone: {
    type: String,
    required: true
  },
  clientPhone: {
    type: String,
    required: true
  },
  maskedNumber: {
    type: String,
    required: true
  },
  calls: [{
    callId: {
      type: String,
      required: true,
      unique: true
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true
    },
    from: String,
    to: String,
    status: {
      type: String,
      enum: ['initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer'],
      default: 'initiated'
    },
    duration: Number, // in seconds
    startedAt: Date,
    answeredAt: Date,
    endedAt: Date,
    recordingUrl: String,
    recordingPublicId: String,
    cost: Number,
    metadata: mongoose.Schema.Types.Mixed
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
maskedCallSchema.index({ provider: 1, client: 1 });
maskedCallSchema.index({ job: 1 });
maskedCallSchema.index({ conversation: 1 });
maskedCallSchema.index({ maskedNumber: 1 });
maskedCallSchema.index({ isActive: 1, expiresAt: 1 });

// Static method to find active masked call
maskedCallSchema.statics.findActive = function(providerId, clientId, jobId = null) {
  const query = {
    provider: providerId,
    client: clientId,
    isActive: true
  };
  if (jobId) {
    query.job = jobId;
  }
  return this.findOne(query);
};

module.exports = mongoose.model('MaskedCall', maskedCallSchema);
