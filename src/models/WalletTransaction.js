const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserWallet',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Transaction type for cash-based accounting
  transactionType: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  // Transaction category
  category: {
    type: String,
    enum: [
      'deposit',           // Money added to wallet
      'withdrawal',        // Money withdrawn from wallet
      'payment',           // Payment made
      'refund',            // Refund received
      'referral_reward',   // Referral reward
      'bonus',             // Bonus credit
      'fee',               // Fee charged
      'transfer_in',       // Transfer received
      'transfer_out',      // Transfer sent
      'adjustment'         // Manual adjustment
    ],
    required: true
  },
  // Amount (always positive, direction determined by transactionType)
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // Currency
  currency: {
    type: String,
    default: 'USD',
    required: true
  },
  // Balance after this transaction
  balanceAfter: {
    type: Number,
    required: true
  },
  // Description
  description: {
    type: String,
    required: true
  },
  // Reference to related entity (e.g., booking, order, referral)
  reference: {
    type: {
      type: String, // e.g., 'Booking', 'Order', 'Referral', 'Withdrawal'
      enum: ['Booking', 'Order', 'Referral', 'Withdrawal', 'TopUp', 'Refund', 'Transfer', 'Adjustment']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['wallet', 'bank_transfer', 'mobile_money', 'card', 'cash', 'paypal', 'paymaya', 'internal'],
    default: 'wallet'
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'reversed'],
    default: 'completed'
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  // Reversal information (if this transaction reverses another)
  reversedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WalletTransaction'
  },
  // Admin notes
  adminNotes: String,
  // Processed by (for admin actions)
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
walletTransactionSchema.index({ wallet: 1, createdAt: -1 });
walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ category: 1, status: 1 });
walletTransactionSchema.index({ 'reference.id': 1, 'reference.type': 1 });
walletTransactionSchema.index({ transactionType: 1, createdAt: -1 });
walletTransactionSchema.index({ status: 1, createdAt: -1 });

// Compound indexes
walletTransactionSchema.index({ wallet: 1, status: 1, createdAt: -1 });
walletTransactionSchema.index({ user: 1, category: 1, createdAt: -1 });

// Virtual for effective amount (positive for credit, negative for debit)
walletTransactionSchema.virtual('effectiveAmount').get(function() {
  return this.transactionType === 'credit' ? this.amount : -this.amount;
});

// Method to reverse a transaction
walletTransactionSchema.methods.reverse = async function(reason, processedBy) {
  if (this.status === 'reversed') {
    throw new Error('Transaction already reversed');
  }
  
  if (this.status !== 'completed') {
    throw new Error('Can only reverse completed transactions');
  }
  
  // Create reversal transaction
  const reversal = new this.constructor({
    wallet: this.wallet,
    user: this.user,
    transactionType: this.transactionType === 'credit' ? 'debit' : 'credit',
    category: this.category,
    amount: this.amount,
    currency: this.currency,
    description: `Reversal: ${this.description}`,
    reference: {
      type: 'Adjustment',
      id: this._id
    },
    status: 'completed',
    reversedTransaction: this._id,
    adminNotes: reason,
    processedBy
  });
  
  // Calculate new balance
  const UserWallet = mongoose.model('UserWallet');
  const wallet = await UserWallet.findById(this.wallet);
  const currentBalance = await wallet.getCurrentBalance();
  reversal.balanceAfter = this.transactionType === 'credit' 
    ? currentBalance - this.amount 
    : currentBalance + this.amount;
  
  await reversal.save();
  
  // Update original transaction
  this.status = 'reversed';
  await this.save();
  
  // Update wallet balance
  await wallet.updateBalance();
  
  return reversal;
};

// Static method to create a credit transaction
walletTransactionSchema.statics.createCredit = async function(data) {
  const { walletId, userId, category, amount, currency = 'USD', description, reference, paymentMethod = 'wallet', metadata } = data;
  
  const UserWallet = mongoose.model('UserWallet');
  const wallet = await UserWallet.findById(walletId);
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  const currentBalance = await wallet.getCurrentBalance();
  const balanceAfter = currentBalance + amount;
  
  const transaction = new this({
    wallet: walletId,
    user: userId,
    transactionType: 'credit',
    category,
    amount,
    currency,
    balanceAfter,
    description,
    reference,
    paymentMethod,
    metadata,
    status: 'completed'
  });
  
  await transaction.save();
  
  // Update wallet balance
  await wallet.updateBalance();
  
  return transaction;
};

// Static method to create a debit transaction
walletTransactionSchema.statics.createDebit = async function(data) {
  const { walletId, userId, category, amount, currency = 'USD', description, reference, paymentMethod = 'wallet', metadata } = data;
  
  const UserWallet = mongoose.model('UserWallet');
  const wallet = await UserWallet.findById(walletId);
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  const currentBalance = await wallet.getCurrentBalance();
  
  // Check sufficient balance
  if (currentBalance < amount) {
    throw new Error('Insufficient balance');
  }
  
  const balanceAfter = currentBalance - amount;
  
  const transaction = new this({
    wallet: walletId,
    user: userId,
    transactionType: 'debit',
    category,
    amount,
    currency,
    balanceAfter,
    description,
    reference,
    paymentMethod,
    metadata,
    status: 'completed'
  });
  
  await transaction.save();
  
  // Update wallet balance
  await wallet.updateBalance();
  
  return transaction;
};

// Static method to get transaction summary
walletTransactionSchema.statics.getSummary = async function(walletId, startDate, endDate) {
  const match = { wallet: walletId, status: 'completed' };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }
  
  const summary = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCredits: {
          $sum: { $cond: [{ $eq: ['$transactionType', 'credit'] }, '$amount', 0] }
        },
        totalDebits: {
          $sum: { $cond: [{ $eq: ['$transactionType', 'debit'] }, '$amount', 0] }
        },
        transactionCount: { $sum: 1 },
        creditCount: {
          $sum: { $cond: [{ $eq: ['$transactionType', 'credit'] }, 1, 0] }
        },
        debitCount: {
          $sum: { $cond: [{ $eq: ['$transactionType', 'debit'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return summary[0] || {
    totalCredits: 0,
    totalDebits: 0,
    transactionCount: 0,
    creditCount: 0,
    debitCount: 0
  };
};

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);

