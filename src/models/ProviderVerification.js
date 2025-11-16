const mongoose = require('mongoose');

const providerVerificationSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true
  },
  identityVerified: {
    type: Boolean,
    default: false
  },
  businessVerified: {
    type: Boolean,
    default: false
  },
  backgroundCheck: {
    status: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'not_required'],
      default: 'pending'
    },
    dateCompleted: Date,
    reportId: String
  },
  insurance: {
    hasInsurance: {
      type: Boolean,
      default: false
    },
    insuranceProvider: String,
    policyNumber: String,
    coverageAmount: Number,
    expiryDate: Date,
    documents: [String] // URLs to insurance documents
  },
  licenses: [{
    type: String,
    number: String,
    issuingAuthority: String,
    issueDate: Date,
    expiryDate: Date,
    documents: [String]
  }],
  references: [{
    name: String,
    relationship: String,
    phone: String,
    email: String,
    company: String,
    verified: {
      type: Boolean,
      default: false
    }
  }],
  portfolio: {
    images: [String],
    videos: [String],
    descriptions: [String],
    beforeAfter: [{
      before: String,
      after: String,
      description: String
    }]
  }
}, {
  timestamps: true
});

// Indexes
// Note: provider already has unique: true which creates an index
providerVerificationSchema.index({ identityVerified: 1 });
providerVerificationSchema.index({ businessVerified: 1 });
providerVerificationSchema.index({ 'backgroundCheck.status': 1 });

// Methods
providerVerificationSchema.methods.verifyIdentity = function() {
  this.identityVerified = true;
  return this.save();
};

providerVerificationSchema.methods.verifyBusiness = function() {
  this.businessVerified = true;
  return this.save();
};

providerVerificationSchema.methods.unverifyIdentity = function() {
  this.identityVerified = false;
  return this.save();
};

providerVerificationSchema.methods.unverifyBusiness = function() {
  this.businessVerified = false;
  return this.save();
};

providerVerificationSchema.methods.updateBackgroundCheck = function(status, reportId = null) {
  this.backgroundCheck.status = status;
  if (status === 'passed' || status === 'failed') {
    this.backgroundCheck.dateCompleted = new Date();
  }
  if (reportId) {
    this.backgroundCheck.reportId = reportId;
  }
  return this.save();
};

providerVerificationSchema.methods.addInsurance = function(insuranceData) {
  this.insurance = {
    ...this.insurance,
    ...insuranceData,
    hasInsurance: true
  };
  return this.save();
};

providerVerificationSchema.methods.removeInsurance = function() {
  this.insurance = {
    hasInsurance: false,
    insuranceProvider: undefined,
    policyNumber: undefined,
    coverageAmount: undefined,
    expiryDate: undefined,
    documents: []
  };
  return this.save();
};

providerVerificationSchema.methods.addLicense = function(licenseData) {
  if (!this.licenses) {
    this.licenses = [];
  }
  this.licenses.push({
    ...licenseData,
    issueDate: licenseData.issueDate || new Date()
  });
  return this.save();
};

providerVerificationSchema.methods.removeLicense = function(licenseId) {
  this.licenses = this.licenses.filter(
    license => license._id.toString() !== licenseId.toString()
  );
  return this.save();
};

providerVerificationSchema.methods.addReference = function(referenceData) {
  if (!this.references) {
    this.references = [];
  }
  this.references.push({
    ...referenceData,
    verified: false
  });
  return this.save();
};

providerVerificationSchema.methods.verifyReference = function(referenceId) {
  const reference = this.references.id(referenceId);
  if (reference) {
    reference.verified = true;
    return this.save();
  }
  throw new Error('Reference not found');
};

providerVerificationSchema.methods.removeReference = function(referenceId) {
  this.references = this.references.filter(
    ref => ref._id.toString() !== referenceId.toString()
  );
  return this.save();
};

providerVerificationSchema.methods.addPortfolioImage = function(imageUrl) {
  if (!this.portfolio) {
    this.portfolio = { images: [], videos: [], descriptions: [], beforeAfter: [] };
  }
  if (!this.portfolio.images) {
    this.portfolio.images = [];
  }
  this.portfolio.images.push(imageUrl);
  return this.save();
};

providerVerificationSchema.methods.addPortfolioVideo = function(videoUrl) {
  if (!this.portfolio) {
    this.portfolio = { images: [], videos: [], descriptions: [], beforeAfter: [] };
  }
  if (!this.portfolio.videos) {
    this.portfolio.videos = [];
  }
  this.portfolio.videos.push(videoUrl);
  return this.save();
};

providerVerificationSchema.methods.addBeforeAfter = function(beforeAfterData) {
  if (!this.portfolio) {
    this.portfolio = { images: [], videos: [], descriptions: [], beforeAfter: [] };
  }
  if (!this.portfolio.beforeAfter) {
    this.portfolio.beforeAfter = [];
  }
  this.portfolio.beforeAfter.push(beforeAfterData);
  return this.save();
};

providerVerificationSchema.methods.getVerificationSummary = function() {
  return {
    identityVerified: this.identityVerified,
    businessVerified: this.businessVerified,
    backgroundCheck: {
      status: this.backgroundCheck.status,
      dateCompleted: this.backgroundCheck.dateCompleted
    },
    insurance: {
      hasInsurance: this.insurance.hasInsurance,
      coverageAmount: this.insurance.coverageAmount,
      expiryDate: this.insurance.expiryDate
    },
    licensesCount: this.licenses ? this.licenses.length : 0,
    referencesCount: this.references ? this.references.length : 0,
    verifiedReferencesCount: this.references ? this.references.filter(r => r.verified).length : 0,
    portfolio: {
      imagesCount: this.portfolio?.images?.length || 0,
      videosCount: this.portfolio?.videos?.length || 0,
      beforeAfterCount: this.portfolio?.beforeAfter?.length || 0
    }
  };
};

// Static methods
providerVerificationSchema.statics.findOrCreateForProvider = async function(providerId) {
  let verification = await this.findOne({ provider: providerId });
  if (!verification) {
    verification = new this({
      provider: providerId
    });
    await verification.save();
  }
  return verification;
};

module.exports = mongoose.model('ProviderVerification', providerVerificationSchema);

