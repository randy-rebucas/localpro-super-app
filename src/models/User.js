const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['client', 'provider', 'admin', 'supplier', 'instructor'],
    default: 'client'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    expires: '5m'
  },
  profile: {
    avatar: {
      url: String,
      publicId: String,
      thumbnail: String
    },
    bio: String,
    address: {
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
    skills: [String],
    experience: Number,
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    // Enhanced profile features inspired by LocalPro
    businessName: String,
    businessType: {
      type: String,
      enum: ['individual', 'small_business', 'enterprise', 'franchise']
    },
    yearsInBusiness: Number,
    serviceAreas: [String], // Cities/regions served
    specialties: [String], // Specific service specialties
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      document: {
        url: String,
        publicId: String,
        filename: String
      }
    }],
    insurance: {
      hasInsurance: { type: Boolean, default: false },
      provider: String,
      policyNumber: String,
      coverageAmount: Number,
      expiryDate: Date,
      document: {
        url: String,
        publicId: String,
        filename: String
      }
    },
    backgroundCheck: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'not_required'],
        default: 'pending'
      },
      completedAt: Date,
      document: {
        url: String,
        publicId: String,
        filename: String
      }
    },
    portfolio: [{
      title: String,
      description: String,
      images: [{
        url: String,
        publicId: String,
        thumbnail: String
      }],
      category: String,
      completedAt: Date
    }],
    availability: {
      schedule: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startTime: String,
        endTime: String,
        isAvailable: { type: Boolean, default: true }
      }],
      timezone: { type: String, default: 'UTC' },
      emergencyService: { type: Boolean, default: false }
    }
  },
  preferences: {
    notifications: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Trust and verification system inspired by LocalPro
  trustScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  verification: {
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    identityVerified: { type: Boolean, default: false },
    businessVerified: { type: Boolean, default: false },
    addressVerified: { type: Boolean, default: false },
    bankAccountVerified: { type: Boolean, default: false },
    verifiedAt: Date
  },
  badges: [{
    type: {
      type: String,
      enum: ['verified_provider', 'top_rated', 'fast_response', 'reliable', 'expert', 'newcomer']
    },
    earnedAt: Date,
    description: String
  }],
  responseTime: {
    average: Number, // in minutes
    totalResponses: { type: Number, default: 0 }
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  cancellationRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Index for better performance (phoneNumber and email already have unique indexes)
userSchema.index({ role: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to generate verification code
userSchema.methods.generateVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  return code;
};

// Method to verify code
userSchema.methods.verifyCode = function(code) {
  return this.verificationCode === code;
};

// Method to calculate trust score
userSchema.methods.calculateTrustScore = function() {
  let score = 0;
  
  // Base verification points
  if (this.verification.phoneVerified) score += 10;
  if (this.verification.emailVerified) score += 10;
  if (this.verification.identityVerified) score += 20;
  if (this.verification.businessVerified) score += 15;
  if (this.verification.addressVerified) score += 10;
  if (this.verification.bankAccountVerified) score += 15;
  
  // Rating points (up to 20 points)
  score += Math.round(this.profile.rating * 4);
  
  // Review count bonus (up to 10 points)
  if (this.profile.totalReviews > 0) {
    score += Math.min(10, Math.floor(this.profile.totalReviews / 5));
  }
  
  // Completion rate bonus (up to 10 points)
  score += Math.round(this.completionRate / 10);
  
  // Badge bonus (up to 10 points)
  score += Math.min(10, this.badges.length * 2);
  
  this.trustScore = Math.min(100, score);
  return this.trustScore;
};

// Method to add badge
userSchema.methods.addBadge = function(badgeType, description) {
  const existingBadge = this.badges.find(badge => badge.type === badgeType);
  if (!existingBadge) {
    this.badges.push({
      type: badgeType,
      earnedAt: new Date(),
      description: description
    });
  }
};

// Method to update response time
userSchema.methods.updateResponseTime = function(responseTimeMinutes) {
  if (!this.responseTime.average) {
    this.responseTime.average = responseTimeMinutes;
  } else {
    const totalTime = this.responseTime.average * this.responseTime.totalResponses;
    this.responseTime.totalResponses += 1;
    this.responseTime.average = (totalTime + responseTimeMinutes) / this.responseTime.totalResponses;
  }
};

module.exports = mongoose.model('User', userSchema);
