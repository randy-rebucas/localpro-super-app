const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const escrowTransactionSchema = new mongoose.Schema({
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
  transactionType: {
    type: String,
    enum: ['HOLD', 'CAPTURE', 'REFUND', 'DISPUTE_INITIATED', 'DISPUTE_RESOLVED', 'PAYOUT'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    description: 'Amount in cents'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    required: true
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gateway: {
    provider: String,
    transactionId: String,
    responseCode: String,
    responseMessage: String
  },
  metadata: {
    reason: String,
    notes: String,
    relatedPayoutId: mongoose.Schema.Types.ObjectId,
    tags: [String]
  },
  previousBalance: {
    type: Number,
    description: 'Balance before transaction'
  },
  newBalance: {
    type: Number,
    description: 'Balance after transaction'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { 
  timestamps: false,
  collection: 'escrow_transactions'
});

// Immutable - prevent updates
escrowTransactionSchema.pre('findByIdAndUpdate', function(next) {
  next(new Error('Escrow transactions are immutable'));
});

escrowTransactionSchema.pre('updateOne', function(next) {
  next(new Error('Escrow transactions are immutable'));
});

// Indexes for auditing
escrowTransactionSchema.index({ escrowId: 1, timestamp: -1 });
escrowTransactionSchema.index({ transactionType: 1, timestamp: -1 });
escrowTransactionSchema.index({ initiatedBy: 1, timestamp: -1 });
escrowTransactionSchema.index({ timestamp: -1 });

module.exports = mongoose.model('EscrowTransaction', escrowTransactionSchema);
