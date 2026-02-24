const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const escrowSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'PHP', 'EUR', 'GBP', 'JPY']
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    description: 'Amount in cents'
  },
  holdProvider: {
    type: String,
    enum: ['paymongo', 'xendit', 'stripe', 'paypal', 'paymaya'],
    required: true
  },
  providerHoldId: {
    type: String,
    required: true,
    description: 'Payment authorization id from gateway'
  },
  status: {
    type: String,
    enum: ['CREATED', 'FUNDS_HELD', 'IN_PROGRESS', 'COMPLETE', 'DISPUTE', 'REFUNDED', 'PAYOUT_INITIATED', 'PAYOUT_COMPLETED'],
    default: 'CREATED',
    index: true
  },
  proofOfWork: {
    uploadedAt: Date,
    documents: [{
      type: String,
      url: String,
      uploadedAt: Date,
      metadata: {
        fileSize: Number,
        mimeType: String
      }
    }],
    notes: String
  },
  clientApproval: {
    approved: {
      type: Boolean,
      default: false
    },
    approvedAt: Date,
    notes: String
  },
  dispute: {
    raised: {
      type: Boolean,
      default: false
    },
    raisedAt: Date,
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    evidence: [{
      type: String,
      url: String,
      uploadedAt: Date
    }],
    adminResolution: {
      decidedAt: Date,
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      decision: {
        type: String,
        enum: ['REFUND_CLIENT', 'PAYOUT_PROVIDER', 'SPLIT']
      },
      notes: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for common queries
escrowSchema.index({ bookingId: 1, status: 1 });
escrowSchema.index({ clientId: 1, status: 1 });
escrowSchema.index({ providerId: 1, status: 1 });
escrowSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Escrow', escrowSchema);
