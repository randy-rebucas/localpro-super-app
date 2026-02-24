const mongoose = require('mongoose');

const providerFinancialInfoSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true
  },
  bankAccount: {
    accountHolder: String,
    accountNumber: String, // encrypted
    routingNumber: String, // encrypted
    bankName: String,
    accountType: {
      type: String,
      enum: ['checking', 'savings']
    }
  },
  taxInfo: {
    ssn: String, // encrypted
    ein: String, // encrypted
    taxClassification: String,
    w9Submitted: {
      type: Boolean,
      default: false
    }
  },
  paymentMethods: [{
    type: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'paymaya', 'check']
    },
    details: mongoose.Schema.Types.Mixed,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  commissionRate: {
    type: Number,
    default: 0.1, // 10% default
    min: 0,
    max: 1
  },
  minimumPayout: {
    type: Number,
    default: 50,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
// Note: provider already has unique: true which creates an index

// Methods
providerFinancialInfoSchema.methods.updateBankAccount = function(bankAccountData) {
  this.bankAccount = {
    ...this.bankAccount,
    ...bankAccountData
  };
  return this.save();
};

providerFinancialInfoSchema.methods.updateTaxInfo = function(taxInfoData) {
  this.taxInfo = {
    ...this.taxInfo,
    ...taxInfoData
  };
  return this.save();
};

providerFinancialInfoSchema.methods.addPaymentMethod = function(paymentMethodData) {
  if (!this.paymentMethods) {
    this.paymentMethods = [];
  }
  
  // If this is set as default, unset other defaults
  if (paymentMethodData.isDefault) {
    this.paymentMethods.forEach(method => {
      method.isDefault = false;
    });
  }
  
  this.paymentMethods.push(paymentMethodData);
  return this.save();
};

providerFinancialInfoSchema.methods.removePaymentMethod = function(paymentMethodId) {
  this.paymentMethods = this.paymentMethods.filter(
    method => method._id.toString() !== paymentMethodId.toString()
  );
  return this.save();
};

providerFinancialInfoSchema.methods.setDefaultPaymentMethod = function(paymentMethodId) {
  this.paymentMethods.forEach(method => {
    method.isDefault = method._id.toString() === paymentMethodId.toString();
  });
  return this.save();
};

providerFinancialInfoSchema.methods.getDefaultPaymentMethod = function() {
  return this.paymentMethods.find(method => method.isDefault) || null;
};

providerFinancialInfoSchema.methods.updateCommissionRate = function(rate) {
  if (rate < 0 || rate > 1) {
    throw new Error('Commission rate must be between 0 and 1');
  }
  this.commissionRate = rate;
  return this.save();
};

providerFinancialInfoSchema.methods.updateMinimumPayout = function(amount) {
  if (amount < 0) {
    throw new Error('Minimum payout must be non-negative');
  }
  this.minimumPayout = amount;
  return this.save();
};

providerFinancialInfoSchema.methods.submitW9 = function() {
  this.taxInfo.w9Submitted = true;
  return this.save();
};

providerFinancialInfoSchema.methods.getSummary = function() {
  return {
    hasBankAccount: !!(this.bankAccount && this.bankAccount.accountNumber),
    hasTaxInfo: !!(this.taxInfo && (this.taxInfo.ssn || this.taxInfo.ein)),
    w9Submitted: this.taxInfo?.w9Submitted || false,
    paymentMethodsCount: this.paymentMethods ? this.paymentMethods.length : 0,
    hasDefaultPaymentMethod: !!this.getDefaultPaymentMethod(),
    commissionRate: this.commissionRate,
    minimumPayout: this.minimumPayout
  };
};

// Static methods
providerFinancialInfoSchema.statics.findOrCreateForProvider = async function(providerId) {
  let financialInfo = await this.findOne({ provider: providerId });
  if (!financialInfo) {
    financialInfo = new this({
      provider: providerId
    });
    await financialInfo.save();
  }
  return financialInfo;
};

module.exports = mongoose.model('ProviderFinancialInfo', providerFinancialInfoSchema);

