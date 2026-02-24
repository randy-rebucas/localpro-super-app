const mongoose = require('mongoose');

const userWalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currency: {
    type: String,
    default: 'USD',
    required: true
  },
  // Current balance (calculated from transactions)
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  // Pending balance (for withdrawals, holds, etc.)
  pendingBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  // Available balance (balance - pendingBalance)
  availableBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  // Last balance update timestamp
  lastBalanceUpdate: {
    type: Date,
    default: Date.now
  },
  // Wallet settings
  settings: {
    autoWithdraw: {
      type: Boolean,
      default: false
    },
    minBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    minWithdrawalAmount: {
      type: Number,
      default: 100,
      min: 0
    },
    notificationSettings: {
      lowBalance: {
        type: Boolean,
        default: true
      },
      withdrawal: {
        type: Boolean,
        default: true
      },
      payment: {
        type: Boolean,
        default: true
      },
      deposit: {
        type: Boolean,
        default: true
      }
    }
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'frozen', 'suspended', 'closed'],
    default: 'active'
  },
  // Status reason
  statusReason: String,
  // Last transaction date
  lastTransactionAt: Date
}, {
  timestamps: true
});

// Indexes
// Note: user already has unique: true which creates an index
userWalletSchema.index({ status: 1 });
userWalletSchema.index({ balance: -1 });

// Method to get current balance from transactions (source of truth)
userWalletSchema.methods.getCurrentBalance = async function() {
  const WalletTransaction = mongoose.model('WalletTransaction');
  const result = await WalletTransaction.aggregate([
    {
      $match: {
        wallet: this._id,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalCredits: {
          $sum: { $cond: [{ $eq: ['$transactionType', 'credit'] }, '$amount', 0] }
        },
        totalDebits: {
          $sum: { $cond: [{ $eq: ['$transactionType', 'debit'] }, '$amount', 0] }
        }
      }
    }
  ]);
  
  if (result.length === 0) {
    return 0;
  }
  
  return result[0].totalCredits - result[0].totalDebits;
};

// Method to update balance from transactions
userWalletSchema.methods.updateBalance = async function() {
  const currentBalance = await this.getCurrentBalance();
  this.balance = currentBalance;
  this.availableBalance = Math.max(0, this.balance - this.pendingBalance);
  this.lastBalanceUpdate = new Date();
  await this.save();
  return this.balance;
};

// Method to add credit (deposit, reward, refund, etc.)
userWalletSchema.methods.addCredit = async function(data) {
  if (this.status !== 'active') {
    throw new Error(`Cannot add credit to wallet with status: ${this.status}`);
  }
  
  const WalletTransaction = mongoose.model('WalletTransaction');
  const transaction = await WalletTransaction.createCredit({
    walletId: this._id,
    userId: this.user,
    category: data.category,
    amount: data.amount,
    currency: data.currency || this.currency,
    description: data.description,
    reference: data.reference,
    paymentMethod: data.paymentMethod,
    metadata: data.metadata
  });
  
  this.lastTransactionAt = new Date();
  await this.save();
  
  return transaction;
};

// Method to add debit (payment, withdrawal, fee, etc.)
userWalletSchema.methods.addDebit = async function(data) {
  if (this.status !== 'active') {
    throw new Error(`Cannot add debit to wallet with status: ${this.status}`);
  }
  
  const currentBalance = await this.getCurrentBalance();
  
  // Check available balance (balance - pending)
  const availableBalance = Math.max(0, currentBalance - this.pendingBalance);
  
  if (availableBalance < data.amount) {
    throw new Error('Insufficient available balance');
  }
  
  const WalletTransaction = mongoose.model('WalletTransaction');
  const transaction = await WalletTransaction.createDebit({
    walletId: this._id,
    userId: this.user,
    category: data.category,
    amount: data.amount,
    currency: data.currency || this.currency,
    description: data.description,
    reference: data.reference,
    paymentMethod: data.paymentMethod,
    metadata: data.metadata
  });
  
  this.lastTransactionAt = new Date();
  await this.save();
  
  return transaction;
};

// Method to hold balance (for pending withdrawals, etc.)
userWalletSchema.methods.holdBalance = async function(amount, _reason) {
  const currentBalance = await this.getCurrentBalance();
  const availableBalance = Math.max(0, currentBalance - this.pendingBalance);
  
  if (availableBalance < amount) {
    throw new Error('Insufficient available balance to hold');
  }
  
  this.pendingBalance += amount;
  this.availableBalance = Math.max(0, this.balance - this.pendingBalance);
  await this.save();
  
  return this;
};

// Method to release held balance
userWalletSchema.methods.releaseBalance = async function(amount) {
  if (this.pendingBalance < amount) {
    throw new Error('Cannot release more than pending balance');
  }
  
  this.pendingBalance = Math.max(0, this.pendingBalance - amount);
  this.availableBalance = Math.max(0, this.balance - this.pendingBalance);
  await this.save();
  
  return this;
};

// Method to get transaction history
userWalletSchema.methods.getTransactions = async function(options = {}) {
  const {
    limit = 50,
    skip = 0,
    startDate,
    endDate,
    category,
    transactionType,
    status = 'completed'
  } = options;
  
  const query = {
    wallet: this._id,
    status
  };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  
  if (category) query.category = category;
  if (transactionType) query.transactionType = transactionType;
  
  const WalletTransaction = mongoose.model('WalletTransaction');
  return WalletTransaction.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('reference.id')
    .populate('processedBy', 'firstName lastName');
};

// Method to get balance summary
userWalletSchema.methods.getBalanceSummary = async function() {
  await this.updateBalance();
  
  return {
    balance: this.balance,
    pendingBalance: this.pendingBalance,
    availableBalance: this.availableBalance,
    currency: this.currency,
    lastUpdated: this.lastBalanceUpdate,
    lastTransactionAt: this.lastTransactionAt
  };
};

// Method to check if balance is low
userWalletSchema.methods.isLowBalance = function() {
  return this.settings.minBalance > 0 && this.availableBalance < this.settings.minBalance;
};

// Static method to find or create wallet for user
userWalletSchema.statics.findOrCreateForUser = async function(userId, currency = 'USD') {
  let wallet = await this.findOne({ user: userId });
  
  if (!wallet) {
    wallet = await this.create({
      user: userId,
      currency
    });
  }
  
  return wallet;
};

// Pre-save hook to calculate available balance
userWalletSchema.pre('save', function(next) {
  this.availableBalance = Math.max(0, this.balance - this.pendingBalance);
  next();
});

module.exports = mongoose.model('UserWallet', userWalletSchema);

