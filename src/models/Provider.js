const mongoose = require('mongoose');
const ProviderVerification = require('./ProviderVerification');
const ProviderPreferences = require('./ProviderPreferences');
const ProviderFinancialInfo = require('./ProviderFinancialInfo');
const ProviderBusinessInfo = require('./ProviderBusinessInfo');
const ProviderProfessionalInfo = require('./ProviderProfessionalInfo');
const ProviderPerformance = require('./ProviderPerformance');

const providerSchema = new mongoose.Schema({
  // Basic Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Provider Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive', 'rejected'],
    default: 'pending'
  },
  
  // Provider Type
  providerType: {
    type: String,
    enum: ['individual', 'business', 'agency'],
    required: true
  },
  
  // Business Information reference (for business/agency providers)
  businessInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderBusinessInfo'
  },
  
  // Professional Information reference
  professionalInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderProfessionalInfo'
  },
  
  // Verification & Documentation reference
  verification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderVerification'
  },
  
  // Financial Information reference
  financialInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderFinancialInfo'
  },
  
  // Performance Metrics reference
  performance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderPerformance'
  },
  
  // Provider Preferences reference
  preferences: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderPreferences'
  },
  
  // Onboarding Progress
  onboarding: {
    completed: { type: Boolean, default: false },
    steps: [{
      step: String,
      completed: { type: Boolean, default: false },
      completedAt: Date,
      data: mongoose.Schema.Types.Mixed
    }],
    currentStep: { type: String, default: 'profile_setup' },
    progress: { type: Number, default: 0 } // percentage
  },
  
  // Provider Settings
  settings: {
    profileVisibility: { type: String, enum: ['public', 'private', 'verified_only'], default: 'public' },
    showContactInfo: { type: Boolean, default: true },
    showPricing: { type: Boolean, default: true },
    showReviews: { type: Boolean, default: true },
    allowDirectBooking: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false }
  },
  
  // Metadata
  metadata: {
    lastActive: Date,
    profileViews: { type: Number, default: 0 },
    searchRanking: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    promoted: { type: Boolean, default: false },
    tags: [String],
    notes: String // admin notes
  }
}, {
  timestamps: true
});

// Indexes for better performance
// userId already has unique: true which creates an index
providerSchema.index({ status: 1 });
providerSchema.index({ providerType: 1 });
providerSchema.index({ 'professionalInfo.serviceAreas.city': 1, 'professionalInfo.serviceAreas.state': 1 });
providerSchema.index({ performance: 1 });
providerSchema.index({ 'metadata.featured': 1 });
providerSchema.index({ 'metadata.promoted': 1 });
providerSchema.index({ createdAt: -1 });
providerSchema.index({ verification: 1 });
providerSchema.index({ preferences: 1 });
providerSchema.index({ financialInfo: 1 });
providerSchema.index({ businessInfo: 1 });
providerSchema.index({ professionalInfo: 1 });

// Virtual for full name
providerSchema.virtual('fullName').get(function() {
  // Note: This virtual may not work correctly if businessInfo is not populated
  // Use ensureBusinessInfo() or populate('businessInfo') before accessing
  if (this.businessInfo && typeof this.businessInfo === 'object' && this.businessInfo.businessName) {
    return this.businessInfo.businessName;
  }
  return `${this.userId?.firstName || ''} ${this.userId?.lastName || ''}`.trim();
});

// Virtual for completion rate (deprecated - use ensurePerformance() instead)
providerSchema.virtual('completionRate').get(function() {
  // Note: This virtual may not work correctly if performance is not populated
  // Use ensurePerformance() or populate('performance') before accessing
  if (this.performance && typeof this.performance === 'object' && this.performance.totalJobs) {
    if (this.performance.totalJobs === 0) return 0;
    return (this.performance.completedJobs / this.performance.totalJobs) * 100;
  }
  return 0;
});

// Pre-save middleware to update performance metrics and validate businessInfo
providerSchema.pre('save', async function(next) {
  // Validate businessInfo is required for business/agency providers
  if (this.providerType === 'business' || this.providerType === 'agency') {
    // If businessInfo is populated, check it directly
    if (this.businessInfo && typeof this.businessInfo === 'object' && this.businessInfo.businessName) {
      // Already populated and has businessName - good
    } else if (this.businessInfo) {
      // businessInfo is an ObjectId, need to check if it exists and has businessName
      try {
        const businessInfo = await ProviderBusinessInfo.findById(this.businessInfo);
        if (!businessInfo || !businessInfo.businessName) {
          return next(new Error('Business information (businessName) is required for business and agency providers'));
        }
      } catch (error) {
        return next(new Error('Business information (businessName) is required for business and agency providers'));
      }
    } else {
      return next(new Error('Business information (businessName) is required for business and agency providers'));
    }
  }
  
  // Note: Subscription is now managed through User model (localProPlusSubscription)
  
  // Update last active
  this.metadata.lastActive = new Date();
  
  next();
});

// Post-save hook to ensure verification document exists
providerSchema.post('save', async function() {
  if (this._skipVerificationCreation) {
    return;
  }
  
  let needsSave = false;
  
  // Create verification document if it doesn't exist
  if (!this.verification) {
    const verification = await ProviderVerification.findOrCreateForProvider(this._id);
    this.verification = verification._id;
    needsSave = true;
  }
  
  // Create preferences document if it doesn't exist
  if (!this.preferences) {
    const preferences = await ProviderPreferences.findOrCreateForProvider(this._id);
    this.preferences = preferences._id;
    needsSave = true;
  }
  
  // Create financialInfo document if it doesn't exist
  if (!this.financialInfo) {
    const financialInfo = await ProviderFinancialInfo.findOrCreateForProvider(this._id);
    this.financialInfo = financialInfo._id;
    needsSave = true;
  }
  
  // Create businessInfo document if it doesn't exist (for business/agency providers)
  if ((this.providerType === 'business' || this.providerType === 'agency') && !this.businessInfo) {
    const businessInfo = await ProviderBusinessInfo.findOrCreateForProvider(this._id);
    this.businessInfo = businessInfo._id;
    needsSave = true;
  }
  
  // Create professionalInfo document if it doesn't exist
  if (!this.professionalInfo) {
    const professionalInfo = await ProviderProfessionalInfo.findOrCreateForProvider(this._id);
    this.professionalInfo = professionalInfo._id;
    needsSave = true;
  }
  
  // Create performance document if it doesn't exist
  if (!this.performance) {
    const performance = await ProviderPerformance.findOrCreateForProvider(this._id);
    this.performance = performance._id;
    needsSave = true;
  }
  
  if (needsSave) {
    this._skipVerificationCreation = true;
    await this.save({ validateBeforeSave: false });
    this._skipVerificationCreation = false;
  }
});

// Validation method
providerSchema.methods.validateBusinessInfo = async function() {
  if (this.providerType === 'business' || this.providerType === 'agency') {
    const businessInfo = await this.ensureBusinessInfo();
    if (!businessInfo || !businessInfo.businessName) {
      throw new Error('Business information (businessName) is required for business and agency providers');
    }
  }
  return true;
};

providerSchema.methods.ensureBusinessInfo = async function(options = {}) {
  const { forceRefresh = false } = options;
  if (!this.businessInfo) {
    const businessInfo = await ProviderBusinessInfo.findOrCreateForProvider(this._id);
    this.businessInfo = businessInfo._id;
    await this.save({ validateBeforeSave: false });
    return businessInfo;
  }
  const isPopulated = this.businessInfo && 
    typeof this.businessInfo === 'object' && 
    this.businessInfo._id && 
    this.businessInfo.businessName !== undefined;
  if (!isPopulated || forceRefresh) {
    await this.populate('businessInfo');
  }
  return this.businessInfo;
};

providerSchema.methods.ensurePerformance = async function(options = {}) {
  const { forceRefresh = false } = options;
  if (!this.performance) {
    const performance = await ProviderPerformance.findOrCreateForProvider(this._id);
    this.performance = performance._id;
    await this.save({ validateBeforeSave: false });
    return performance;
  }
  const isPopulated = this.performance && 
    typeof this.performance === 'object' && 
    this.performance._id && 
    this.performance.rating !== undefined;
  if (!isPopulated || forceRefresh) {
    await this.populate('performance');
  }
  return this.performance;
};

// Methods
providerSchema.methods.updateRating = async function(newRating) {
  const performance = await this.ensurePerformance();
  await performance.updateRating(newRating);
  return this;
};

providerSchema.methods.addJob = async function(status) {
  const performance = await this.ensurePerformance();
  await performance.addJob(status);
  return this;
};

providerSchema.methods.updateEarnings = async function(amount) {
  const performance = await this.ensurePerformance();
  await performance.updateEarnings(amount);
  return this;
};

providerSchema.methods.ensureVerification = async function(options = {}) {
  const { forceRefresh = false } = options;
  if (!this.verification) {
    const verification = await ProviderVerification.findOrCreateForProvider(this._id);
    this.verification = verification._id;
    await this.save({ validateBeforeSave: false });
    return verification;
  }
  const isPopulated = this.verification && 
    typeof this.verification === 'object' && 
    this.verification._id && 
    this.verification.identityVerified !== undefined;
  if (!isPopulated || forceRefresh) {
    await this.populate('verification');
  }
  return this.verification;
};

providerSchema.methods.isVerified = async function() {
  const verification = await this.ensureVerification();
  return verification.identityVerified && 
         (this.providerType === 'individual' || verification.businessVerified);
};

providerSchema.methods.canAcceptJobs = async function() {
  const verification = await this.ensureVerification();
  return this.status === 'active' && 
         verification.identityVerified &&
         (this.providerType === 'individual' || verification.businessVerified);
};

providerSchema.methods.ensurePreferences = async function(options = {}) {
  const { forceRefresh = false } = options;
  if (!this.preferences) {
    const preferences = await ProviderPreferences.findOrCreateForProvider(this._id);
    this.preferences = preferences._id;
    await this.save({ validateBeforeSave: false });
    return preferences;
  }
  const isPopulated = this.preferences && 
    typeof this.preferences === 'object' && 
    this.preferences._id && 
    this.preferences.notificationSettings !== undefined;
  if (!isPopulated || forceRefresh) {
    await this.populate('preferences');
  }
  return this.preferences;
};

providerSchema.methods.ensureFinancialInfo = async function(options = {}) {
  const { forceRefresh = false } = options;
  if (!this.financialInfo) {
    const financialInfo = await ProviderFinancialInfo.findOrCreateForProvider(this._id);
    this.financialInfo = financialInfo._id;
    await this.save({ validateBeforeSave: false });
    return financialInfo;
  }
  const isPopulated = this.financialInfo && 
    typeof this.financialInfo === 'object' && 
    this.financialInfo._id && 
    this.financialInfo.commissionRate !== undefined;
  if (!isPopulated || forceRefresh) {
    await this.populate('financialInfo');
  }
  return this.financialInfo;
};

providerSchema.methods.ensureProfessionalInfo = async function(options = {}) {
  const { forceRefresh = false } = options;
  if (!this.professionalInfo) {
    const professionalInfo = await ProviderProfessionalInfo.findOrCreateForProvider(this._id);
    this.professionalInfo = professionalInfo._id;
    await this.save({ validateBeforeSave: false });
    return professionalInfo;
  }
  const isPopulated = this.professionalInfo && 
    typeof this.professionalInfo === 'object' && 
    this.professionalInfo._id && 
    this.professionalInfo.specialties !== undefined;
  if (!isPopulated || forceRefresh) {
    await this.populate('professionalInfo');
  }
  return this.professionalInfo;
};

providerSchema.methods.getServiceAreas = async function() {
  const professionalInfo = await this.ensureProfessionalInfo();
  return professionalInfo.getServiceAreas();
};

// Static methods
providerSchema.statics.findByLocation = async function(city, state) {
  // Find providers with professionalInfo that has matching service areas
  const ProviderProfessionalInfo = mongoose.model('ProviderProfessionalInfo');
  const professionalInfos = await ProviderProfessionalInfo.find({
    'specialties.serviceAreas': {
      $elemMatch: { city, state }
    }
  });
  
  const providerIds = professionalInfos.map(pi => pi.provider);
  
  if (providerIds.length === 0) {
    return [];
  }
  
  return this.find({
    _id: { $in: providerIds },
    status: 'active'
  })
    .populate('professionalInfo')
    .populate('businessInfo')
    .populate('verification')
    .populate('performance');
};

providerSchema.statics.findTopRated = async function(limit = 10) {
  // Find top rated providers by querying ProviderPerformance first
  const topPerformances = await ProviderPerformance.find()
    .sort({ rating: -1, totalReviews: -1 })
    .limit(limit * 2) // Get more to account for filtering
    .populate({
      path: 'provider',
      match: { status: 'active' }
    });
  
  const providerIds = topPerformances
    .filter(p => p.provider && p.provider.status === 'active')
    .map(p => p.provider._id)
    .slice(0, limit); // Take only the requested limit
  
  if (providerIds.length === 0) {
    return [];
  }
  
  return this.find({
    _id: { $in: providerIds },
    status: 'active'
  })
    .populate('professionalInfo')
    .populate('businessInfo')
    .populate('verification')
    .populate('performance')
    .limit(limit);
};

providerSchema.statics.findFeatured = async function() {
  const featuredProviders = await this.find({ 
    status: 'active', 
    'metadata.featured': true 
  })
    .populate('professionalInfo')
    .populate('businessInfo')
    .populate('verification')
    .populate('performance');
  
  // Sort by rating
  return featuredProviders.sort((a, b) => {
    const ratingA = a.performance?.rating || 0;
    const ratingB = b.performance?.rating || 0;
    return ratingB - ratingA;
  });
};

module.exports = mongoose.model('Provider', providerSchema);
