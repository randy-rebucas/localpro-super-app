const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['identity', 'business', 'address', 'bank_account', 'insurance', 'background_check'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  notes: String,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

const trustEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'verification_completed', 'badge_earned', 'review_received', 
      'booking_completed', 'response_time_improved', 'cancellation',
      'dispute_resolved', 'insurance_verified', 'background_check_passed'
    ],
    required: true
  },
  description: String,
  points: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  previousTrustScore: Number,
  newTrustScore: Number
}, {
  timestamps: true
});

const disputeSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  complainant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  respondent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['service_quality', 'payment', 'communication', 'safety', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'closed'],
    default: 'open'
  },
  evidence: [{
    type: {
      type: String,
      enum: ['photo', 'document', 'message', 'other']
    },
    url: String,
    description: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  resolution: {
    description: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    outcome: {
      type: String,
      enum: ['favor_complainant', 'favor_respondent', 'partial_favor', 'no_fault']
    },
    refundAmount: Number,
    penaltyPoints: Number
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
verificationRequestSchema.index({ user: 1, type: 1 });
verificationRequestSchema.index({ status: 1 });
verificationRequestSchema.index({ expiresAt: 1 });

trustEventSchema.index({ user: 1, type: 1 });
trustEventSchema.index({ createdAt: -1 });

disputeSchema.index({ booking: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ complainant: 1 });
disputeSchema.index({ respondent: 1 });

module.exports = {
  VerificationRequest: mongoose.model('VerificationRequest', verificationRequestSchema),
  TrustEvent: mongoose.model('TrustEvent', trustEventSchema),
  Dispute: mongoose.model('Dispute', disputeSchema)
};
