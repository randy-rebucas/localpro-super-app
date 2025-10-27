const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['salary_advance', 'micro_loan', 'business_loan', 'equipment_loan'],
    required: true
  },
  amount: {
    requested: {
      type: Number,
      required: true,
      min: 0
    },
    approved: Number,
    disbursed: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  purpose: {
    type: String,
    required: true
  },
  term: {
    duration: {
      type: Number,
      required: true // in months
    },
    interestRate: {
      type: Number,
      required: true // annual percentage rate
    },
    repaymentFrequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly'],
      default: 'monthly'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'disbursed', 'active', 'completed', 'defaulted'],
    default: 'pending'
  },
  application: {
    submittedAt: {
      type: Date,
      default: Date.now
    },
    documents: [{
      type: {
        type: String,
        enum: ['income_proof', 'bank_statement', 'id_document', 'business_license', 'other']
      },
      url: String,
      uploadedAt: Date
    }],
    creditScore: Number,
    riskAssessment: {
      score: Number,
      factors: [String]
    }
  },
  approval: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    conditions: [String],
    notes: String
  },
  disbursement: {
    method: {
      type: String,
      enum: ['bank_transfer', 'mobile_money', 'cash'],
      default: 'bank_transfer'
    },
    accountDetails: {
      bankName: String,
      accountNumber: String,
      routingNumber: String
    },
    disbursedAt: Date,
    transactionId: String
  },
  repayment: {
    schedule: [{
      dueDate: Date,
      amount: Number,
      principal: Number,
      interest: Number,
      status: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'waived'],
        default: 'pending'
      },
      paidAt: Date,
      transactionId: String
    }],
    totalPaid: {
      type: Number,
      default: 0
    },
    remainingBalance: Number,
    nextPaymentDate: Date
  },
  partner: {
    name: String, // Fintech company name
    apiKey: String,
    loanId: String // External loan reference
  }
}, {
  timestamps: true
});

const salaryAdvanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    requested: {
      type: Number,
      required: true,
      min: 0
    },
    approved: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  salary: {
    monthly: Number,
    nextPayDate: Date,
    frequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly'],
      default: 'monthly'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'disbursed', 'repaid'],
    default: 'pending'
  },
  repayment: {
    dueDate: Date,
    amount: Number,
    deductedFromSalary: { type: Boolean, default: true },
    repaidAt: Date
  },
  fees: {
    processingFee: Number,
    interestRate: Number,
    totalFees: Number
  }
}, {
  timestamps: true
});

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['loan_disbursement', 'loan_repayment', 'salary_advance', 'payment', 'refund', 'fee'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  description: String,
  reference: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'mobile_money', 'card', 'cash', 'paypal', 'paymaya'],
    default: 'bank_transfer'
  },
  transactionId: String,
  externalReference: String,
  paypalOrderId: String,
  paypalTransactionId: String,
  paymayaReferenceNumber: String,
  paymayaCheckoutId: String,
  paymayaPaymentId: String,
  paymayaInvoiceId: String,
  paymayaTransactionId: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
loanSchema.index({ borrower: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ type: 1 });
loanSchema.index({ 'application.submittedAt': -1 });

salaryAdvanceSchema.index({ employee: 1 });
salaryAdvanceSchema.index({ employer: 1 });
salaryAdvanceSchema.index({ status: 1 });

transactionSchema.index({ user: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ reference: 1 });

// Finance model for user financial data
const financeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    pendingBalance: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    autoWithdraw: {
      type: Boolean,
      default: false
    },
    minBalance: {
      type: Number,
      default: 0
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
      }
    }
  },
  transactions: [{
    type: {
      type: String,
      enum: ['income', 'expense', 'withdrawal', 'refund', 'bonus', 'referral'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    category: String,
    description: String,
    paymentMethod: {
      type: String,
      enum: ['wallet', 'bank_transfer', 'mobile_money', 'card', 'cash', 'paypal', 'paymaya'],
      default: 'wallet'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'completed'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    reference: String,
    accountDetails: mongoose.Schema.Types.Mixed,
    adminNotes: String,
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Indexes
// user already has unique: true which creates an index
financeSchema.index({ 'transactions.timestamp': -1 });
financeSchema.index({ 'transactions.type': 1 });

module.exports = {
  Loan: mongoose.model('Loan', loanSchema),
  SalaryAdvance: mongoose.model('SalaryAdvance', salaryAdvanceSchema),
  Transaction: mongoose.model('Transaction', transactionSchema),
  Finance: mongoose.model('Finance', financeSchema)
};
