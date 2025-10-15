const mongoose = require('mongoose');

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
  
  // Business Information (for business/agency providers)
  businessInfo: {
    businessName: String,
    businessType: String,
    businessRegistration: String,
    taxId: String,
    businessAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    businessPhone: String,
    businessEmail: String,
    website: String,
    businessDescription: String,
    yearEstablished: Number,
    numberOfEmployees: Number
  },
  
  // Professional Information
  professionalInfo: {
    specialties: [{
      category: {
        type: String,
        enum: ['cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 'pest_control', 'handyman', 'painting', 'carpentry', 'other']
      },
      subcategories: [String],
      experience: Number, // years of experience
      certifications: [{
        name: String,
        issuer: String,
        dateIssued: Date,
        expiryDate: Date,
        certificateNumber: String
      }],
      skills: [String],
      hourlyRate: Number,
      serviceAreas: [{
        city: String,
        state: String,
        radius: Number // in miles/km
      }]
    }],
    languages: [String],
    availability: {
      monday: { start: String, end: String, available: Boolean },
      tuesday: { start: String, end: String, available: Boolean },
      wednesday: { start: String, end: String, available: Boolean },
      thursday: { start: String, end: String, available: Boolean },
      friday: { start: String, end: String, available: Boolean },
      saturday: { start: String, end: String, available: Boolean },
      sunday: { start: String, end: String, available: Boolean }
    },
    emergencyServices: Boolean,
    travelDistance: Number, // maximum travel distance
    minimumJobValue: Number,
    maximumJobValue: Number
  },
  
  // Verification & Documentation
  verification: {
    identityVerified: { type: Boolean, default: false },
    businessVerified: { type: Boolean, default: false },
    backgroundCheck: {
      status: { type: String, enum: ['pending', 'passed', 'failed', 'not_required'], default: 'pending' },
      dateCompleted: Date,
      reportId: String
    },
    insurance: {
      hasInsurance: { type: Boolean, default: false },
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
      verified: { type: Boolean, default: false }
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
  },
  
  // Financial Information
  financialInfo: {
    bankAccount: {
      accountHolder: String,
      accountNumber: String, // encrypted
      routingNumber: String, // encrypted
      bankName: String,
      accountType: { type: String, enum: ['checking', 'savings'] }
    },
    taxInfo: {
      ssn: String, // encrypted
      ein: String, // encrypted
      taxClassification: String,
      w9Submitted: { type: Boolean, default: false }
    },
    paymentMethods: [{
      type: { type: String, enum: ['bank_transfer', 'paypal', 'paymaya', 'check'] },
      details: mongoose.Schema.Types.Mixed,
      isDefault: { type: Boolean, default: false }
    }],
    commissionRate: { type: Number, default: 0.1 }, // 10% default
    minimumPayout: { type: Number, default: 50 }
  },
  
  // Performance Metrics
  performance: {
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    totalJobs: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    cancelledJobs: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }, // average response time in minutes
    completionRate: { type: Number, default: 0 },
    repeatCustomerRate: { type: Number, default: 0 },
    earnings: {
      total: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
      lastMonth: { type: Number, default: 0 },
      pending: { type: Number, default: 0 }
    },
    badges: [{
      name: String,
      description: String,
      earnedDate: Date,
      category: String
    }]
  },
  
  // Provider Preferences
  preferences: {
    notificationSettings: {
      newJobAlerts: { type: Boolean, default: true },
      messageNotifications: { type: Boolean, default: true },
      paymentNotifications: { type: Boolean, default: true },
      reviewNotifications: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false }
    },
    jobPreferences: {
      preferredJobTypes: [String],
      avoidJobTypes: [String],
      preferredTimeSlots: [String],
      maxJobsPerDay: { type: Number, default: 5 },
      advanceBookingDays: { type: Number, default: 30 }
    },
    communicationPreferences: {
      preferredContactMethod: { type: String, enum: ['phone', 'email', 'sms', 'app'], default: 'app' },
      responseTimeExpectation: { type: Number, default: 60 }, // minutes
      autoAcceptJobs: { type: Boolean, default: false }
    }
  },
  
  // Subscription & Plans
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'professional', 'premium', 'enterprise'],
      default: 'basic'
    },
    features: [String],
    limits: {
      maxServices: { type: Number, default: 5 },
      maxBookingsPerMonth: { type: Number, default: 50 },
      prioritySupport: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false }
    },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    nextBillingDate: Date,
    autoRenew: { type: Boolean, default: true }
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
providerSchema.index({ userId: 1 });
providerSchema.index({ status: 1 });
providerSchema.index({ providerType: 1 });
providerSchema.index({ 'professionalInfo.specialties.category': 1 });
providerSchema.index({ 'professionalInfo.serviceAreas.city': 1, 'professionalInfo.serviceAreas.state': 1 });
providerSchema.index({ 'performance.rating': -1 });
providerSchema.index({ 'performance.totalJobs': -1 });
providerSchema.index({ 'metadata.featured': 1 });
providerSchema.index({ 'metadata.promoted': 1 });
providerSchema.index({ createdAt: -1 });

// Virtual for full name
providerSchema.virtual('fullName').get(function() {
  if (this.businessInfo && this.businessInfo.businessName) {
    return this.businessInfo.businessName;
  }
  return `${this.userId.firstName} ${this.userId.lastName}`;
});

// Virtual for completion rate
providerSchema.virtual('completionRate').get(function() {
  if (this.performance.totalJobs === 0) return 0;
  return (this.performance.completedJobs / this.performance.totalJobs) * 100;
});

// Pre-save middleware to update performance metrics
providerSchema.pre('save', function(next) {
  // Update completion rate
  if (this.performance.totalJobs > 0) {
    this.performance.completionRate = (this.performance.completedJobs / this.performance.totalJobs) * 100;
  }
  
  // Update last active
  this.metadata.lastActive = new Date();
  
  next();
});

// Methods
providerSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.performance.rating * this.performance.totalReviews) + newRating;
  this.performance.totalReviews += 1;
  this.performance.rating = totalRating / this.performance.totalReviews;
  return this.save();
};

providerSchema.methods.addJob = function(status) {
  this.performance.totalJobs += 1;
  if (status === 'completed') {
    this.performance.completedJobs += 1;
  } else if (status === 'cancelled') {
    this.performance.cancelledJobs += 1;
  }
  return this.save();
};

providerSchema.methods.updateEarnings = function(amount) {
  this.performance.earnings.total += amount;
  this.performance.earnings.thisMonth += amount;
  return this.save();
};

providerSchema.methods.isVerified = function() {
  return this.verification.identityVerified && 
         (this.providerType === 'individual' || this.verification.businessVerified);
};

providerSchema.methods.canAcceptJobs = function() {
  return this.status === 'active' && 
         this.verification.identityVerified &&
         (this.providerType === 'individual' || this.verification.businessVerified);
};

providerSchema.methods.getServiceAreas = function() {
  return this.professionalInfo.specialties.flatMap(specialty => 
    specialty.serviceAreas.map(area => ({
      ...area,
      category: specialty.category
    }))
  );
};

// Static methods
providerSchema.statics.findByLocation = function(city, state, category) {
  const query = {
    status: 'active',
    'professionalInfo.specialties.serviceAreas': {
      $elemMatch: { city, state }
    }
  };
  
  if (category) {
    query['professionalInfo.specialties.category'] = category;
  }
  
  return this.find(query);
};

providerSchema.statics.findTopRated = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'performance.rating': -1, 'performance.totalReviews': -1 })
    .limit(limit);
};

providerSchema.statics.findFeatured = function() {
  return this.find({ 
    status: 'active', 
    'metadata.featured': true 
  }).sort({ 'performance.rating': -1 });
};

module.exports = mongoose.model('Provider', providerSchema);
