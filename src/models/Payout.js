const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const payoutSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true
  },
  escrowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Escrow',
    required: true,
    index: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    description: 'Amount in cents'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  payoutProvider: {
    type: String,
    enum: ['xendit', 'stripe', 'paypal', 'paymaya', 'bank_transfer'],
    required: true
  },
  gatewayPayoutId: {
    type: String,
    required: true,
    description: 'Reference id from payout gateway'
  },
  providerPayoutMethod: {
    type: {
      type: String,
      enum: ['bank_account', 'wallet', 'crypto'],
      required: true
    },
    accountDetails: {
      accountNumber: String,
      accountName: String,
      bankCode: String,
      walletAddress: String
    }
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  metadata: {
    reference: String,
    description: String,
    tags: [String]
  },
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  failureReason: String,
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
// Note: escrowId and providerId already have indexes from schema definition (index: true)
payoutSchema.index({ providerId: 1, status: 1 }); // Compound index for provider queries
payoutSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);
