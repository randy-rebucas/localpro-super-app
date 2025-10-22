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
    enum: ['client', 'provider', 'admin', 'supplier', 'instructor', 'agency_owner', 'agency_admin'],
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
  // Agency relationship
  agency: {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'manager', 'supervisor', 'provider'],
      default: 'provider'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending'],
      default: 'pending'
    },
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 10
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
  },
  // Referral system integration
  referral: {
    referralCode: {
      type: String,
      unique: true,
      sparse: true
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    referralSource: {
      type: String,
      enum: ['email', 'sms', 'social_media', 'direct_link', 'qr_code', 'app_share']
    },
    referralStats: {
      totalReferrals: { type: Number, default: 0 },
      successfulReferrals: { type: Number, default: 0 },
      totalRewardsEarned: { type: Number, default: 0 },
      totalRewardsPaid: { type: Number, default: 0 },
      lastReferralAt: Date,
      referralTier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze'
      }
    },
    referralPreferences: {
      autoShare: { type: Boolean, default: true },
      shareOnSocial: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false }
    }
  },
  
  // Settings reference
  settings: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSettings'
  },
  
  // User management fields
  lastLoginAt: Date,
  lastLoginIP: String,
  loginCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification', 'banned'],
    default: 'pending_verification'
  },
  statusReason: String,
  statusUpdatedAt: Date,
  statusUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String], // For categorizing users (e.g., 'vip', 'high_risk', 'new_user')
  
  // Activity tracking
  activity: {
    lastActiveAt: Date,
    totalSessions: {
      type: Number,
      default: 0
    },
    averageSessionDuration: Number, // in minutes
    preferredLoginTime: String, // time of day
    deviceInfo: [{
      deviceType: String,
      userAgent: String,
      lastUsed: Date
    }]
  }
}, {
  timestamps: true
});

// Index for better performance (phoneNumber and email already have unique indexes)
userSchema.index({ role: 1 });
userSchema.index({ 'agency.agencyId': 1, 'agency.status': 1 });
userSchema.index({ status: 1, isActive: 1 });
userSchema.index({ 'referral.referredBy': 1, 'referral.referralStats.referralTier': 1 });
userSchema.index({ trustScore: -1, 'profile.rating': -1 });

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

// Method to generate referral code
userSchema.methods.generateReferralCode = function() {
  if (!this.referral.referralCode) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Generate 8-character code with user initials
    const initials = (this.firstName.charAt(0) + this.lastName.charAt(0)).toUpperCase();
    result = initials;
    
    // Add 6 random characters
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    this.referral.referralCode = result;
  }
  return this.referral.referralCode;
};

// Method to update referral stats
userSchema.methods.updateReferralStats = function(type, amount = 0) {
  if (type === 'referral_made') {
    this.referral.referralStats.totalReferrals += 1;
    this.referral.referralStats.lastReferralAt = new Date();
  } else if (type === 'referral_completed') {
    this.referral.referralStats.successfulReferrals += 1;
  } else if (type === 'reward_earned') {
    this.referral.referralStats.totalRewardsEarned += amount;
  } else if (type === 'reward_paid') {
    this.referral.referralStats.totalRewardsPaid += amount;
  }
  
  // Update referral tier based on successful referrals
  const successfulReferrals = this.referral.referralStats.successfulReferrals;
  if (successfulReferrals >= 50) {
    this.referral.referralStats.referralTier = 'platinum';
  } else if (successfulReferrals >= 20) {
    this.referral.referralStats.referralTier = 'gold';
  } else if (successfulReferrals >= 5) {
    this.referral.referralStats.referralTier = 'silver';
  } else {
    this.referral.referralStats.referralTier = 'bronze';
  }
  
  return this.save();
};

// Method to get referral link
userSchema.methods.getReferralLink = function(baseUrl = process.env.FRONTEND_URL) {
  const referralCode = this.generateReferralCode();
  return `${baseUrl}/signup?ref=${referralCode}`;
};

// Method to check if user was referred
userSchema.methods.wasReferred = function() {
  return !!this.referral.referredBy;
};

// Method to update login information
userSchema.methods.updateLoginInfo = function(ip, userAgent) {
  this.lastLoginAt = new Date();
  this.lastLoginIP = ip;
  this.loginCount += 1;
  this.activity.lastActiveAt = new Date();
  this.activity.totalSessions += 1;
  
  // Update device info
  const deviceType = this.getDeviceType(userAgent);
  const existingDevice = this.activity.deviceInfo.find(device => 
    device.deviceType === deviceType && device.userAgent === userAgent
  );
  
  if (existingDevice) {
    existingDevice.lastUsed = new Date();
  } else {
    this.activity.deviceInfo.push({
      deviceType,
      userAgent,
      lastUsed: new Date()
    });
  }
  
  return this.save();
};

// Method to get device type from user agent
userSchema.methods.getDeviceType = function(userAgent) {
  if (!userAgent) return 'unknown';
  
  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    return 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

// Method to add note to user
userSchema.methods.addNote = function(note, addedBy) {
  this.notes.push({
    note,
    addedBy,
    addedAt: new Date()
  });
  return this.save();
};

// Method to update user status
userSchema.methods.updateStatus = function(status, reason, updatedBy) {
  this.status = status;
  this.statusReason = reason;
  this.statusUpdatedAt = new Date();
  this.statusUpdatedBy = updatedBy;
  
  // Update isActive based on status
  this.isActive = ['active', 'pending_verification'].includes(status);
  
  return this.save();
};

// Method to add tag to user
userSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this.save();
};

// Method to remove tag from user
userSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

// Method to check if user has tag
userSchema.methods.hasTag = function(tag) {
  return this.tags.includes(tag);
};

// Method to get user activity summary
userSchema.methods.getActivitySummary = function() {
  return {
    lastLoginAt: this.lastLoginAt,
    loginCount: this.loginCount,
    lastActiveAt: this.activity.lastActiveAt,
    totalSessions: this.activity.totalSessions,
    averageSessionDuration: this.activity.averageSessionDuration,
    deviceCount: this.activity.deviceInfo.length,
    status: this.status,
    isActive: this.isActive,
    trustScore: this.trustScore,
    verification: this.verification
  };
};

// Static method to get users by status
userSchema.statics.getUsersByStatus = function(status) {
  return this.find({ status });
};

// Static method to get users by role
userSchema.statics.getUsersByRole = function(role) {
  return this.find({ role });
};

// Static method to get active users
userSchema.statics.getActiveUsers = function() {
  return this.find({ isActive: true, status: 'active' });
};

// Static method to get users with low trust score
userSchema.statics.getLowTrustUsers = function(threshold = 30) {
  return this.find({ trustScore: { $lt: threshold } });
};

// Static method to get recently registered users
userSchema.statics.getRecentUsers = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.find({ createdAt: { $gte: date } });
};

module.exports = mongoose.model('User', userSchema);
