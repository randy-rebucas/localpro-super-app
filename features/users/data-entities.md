# Users Data Entities

## Overview

The Users feature uses the `User` model as the primary data entity, which provides comprehensive user management functionality. This model supports multiple user types, verification systems, trust scoring, and complex relationships with other platform entities.

## User Model

### Schema Definition

```javascript
const userSchema = new mongoose.Schema({
  // Basic Information
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
    trim: true
  },
  lastName: {
    type: String,
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
  lastVerificationSent: {
    type: Date,
    default: null
  },

  // Profile Information
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

  // User Preferences
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

  // LocalPro Plus subscription reference
  localProPlusSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription'
  },

  // Wallet Information
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

  // Agency Relationship
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

  // User Status
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
```

### Key Features

#### Basic Information
- **Phone Number**: Primary identifier, required and unique
- **Email**: Optional secondary identifier, unique when provided
- **Name**: First and last name for user identification
- **Role**: User type determining permissions and access levels
- **Verification Status**: Overall verification status and verification code management

#### Profile Information
- **Avatar**: Profile picture with Cloudinary integration
- **Bio**: User description and introduction
- **Address**: Complete address information with geocoding support
- **Skills**: Array of user skills and capabilities
- **Experience**: Years of experience in relevant field
- **Rating System**: Average rating and total review count
- **Business Information**: Business name, type, years in business
- **Service Areas**: Geographic areas where user provides services
- **Specialties**: Specific service specialties and expertise
- **Certifications**: Professional certifications with document support
- **Insurance**: Insurance information and document management
- **Background Check**: Background check status and documentation
- **Portfolio**: Work portfolio with images and descriptions
- **Availability**: Work schedule and availability management

#### Trust & Reputation System
- **Trust Score**: Calculated score based on verification and performance
- **Verification Levels**: Multi-level verification system
- **Badges**: Achievement badges for user accomplishments
- **Response Time**: Average response time to inquiries
- **Completion Rate**: Percentage of completed jobs/services
- **Cancellation Rate**: Percentage of cancelled jobs/services

#### Agency Management
- **Agency Membership**: Relationship with service agencies
- **Agency Role**: Role within the agency hierarchy
- **Commission Rate**: Commission percentage for agency work
- **Status**: Membership status within the agency

#### Referral System
- **Referral Code**: Unique code for user referrals
- **Referral Tracking**: Complete referral statistics and rewards
- **Referral Tiers**: Bronze, silver, gold, platinum tiers
- **Referral Preferences**: User preferences for referral sharing

#### Activity Tracking
- **Login History**: Last login time and IP address
- **Session Data**: Total sessions and average duration
- **Device Information**: Device type and user agent tracking
- **Activity Monitoring**: Last active time and behavior patterns

#### User Management
- **Status Management**: User lifecycle status tracking
- **Notes System**: Admin notes and user categorization
- **Tags**: User categorization and management
- **Soft Delete**: Logical deletion with audit trail

### Database Indexes

#### Performance Indexes
```javascript
// Basic indexes
userSchema.index({ role: 1 });
userSchema.index({ 'agency.agencyId': 1, 'agency.status': 1 });
userSchema.index({ status: 1, isActive: 1 });
userSchema.index({ 'referral.referredBy': 1, 'referral.referralStats.referralTier': 1 });
userSchema.index({ trustScore: -1, 'profile.rating': -1 });

// Compound indexes for common queries
userSchema.index({ role: 1, isActive: 1, status: 1 });
userSchema.index({ 'profile.address.city': 1, 'profile.address.state': 1, role: 1 });
userSchema.index({ 'profile.rating': -1, 'profile.totalReviews': -1, isActive: 1 });
userSchema.index({ 'profile.businessName': 1, role: 1 });
userSchema.index({ 'profile.skills': 1, role: 1, isActive: 1 });
userSchema.index({ 'profile.specialties': 1, role: 1, isActive: 1 });
userSchema.index({ 'profile.serviceAreas': 1, role: 1, isActive: 1 });
userSchema.index({ 'profile.certifications.name': 1, role: 1 });
userSchema.index({ 'profile.insurance.hasInsurance': 1, role: 1 });
userSchema.index({ 'profile.backgroundCheck.status': 1, role: 1 });
userSchema.index({ 'activity.lastActiveAt': -1, isActive: 1 });
userSchema.index({ createdAt: -1, role: 1 });
userSchema.index({ updatedAt: -1, isActive: 1 });
userSchema.index({ 'profile.experience': -1, role: 1, isActive: 1 });
userSchema.index({ 'profile.availability.isAvailable': 1, role: 1, isActive: 1 });
```

#### Text Search Index
```javascript
// Text search index for comprehensive search
userSchema.index({
  firstName: 'text',
  lastName: 'text',
  'profile.businessName': 'text',
  'profile.skills': 'text',
  'profile.specialties': 'text',
  'profile.bio': 'text'
});
```

#### Sparse Indexes
```javascript
// Sparse indexes for optional fields
userSchema.index({ 'profile.businessName': 1 }, { sparse: true });
userSchema.index({ 'profile.website': 1 }, { sparse: true });
```

### Virtual Fields

#### Full Name
```javascript
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});
```

### Instance Methods

#### Verification Methods
```javascript
// Generate verification code
userSchema.methods.generateVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  return code;
};

// Verify code
userSchema.methods.verifyCode = function(code) {
  return this.verificationCode === code;
};
```

#### Trust Score Calculation
```javascript
// Calculate trust score
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
```

#### Badge Management
```javascript
// Add badge
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
```

#### Response Time Management
```javascript
// Update response time
userSchema.methods.updateResponseTime = function(responseTimeMinutes) {
  if (!this.responseTime.average) {
    this.responseTime.average = responseTimeMinutes;
  } else {
    const totalTime = this.responseTime.average * this.responseTime.totalResponses;
    this.responseTime.totalResponses += 1;
    this.responseTime.average = (totalTime + responseTimeMinutes) / this.responseTime.totalResponses;
  }
};
```

#### Referral System
```javascript
// Generate referral code
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

// Update referral stats
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

// Get referral link
userSchema.methods.getReferralLink = function(baseUrl = process.env.FRONTEND_URL) {
  const referralCode = this.generateReferralCode();
  return `${baseUrl}/signup?ref=${referralCode}`;
};

// Check if user was referred
userSchema.methods.wasReferred = function() {
  return !!this.referral.referredBy;
};
```

#### Login Management
```javascript
// Update login information
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

// Get device type from user agent
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
```

#### User Management
```javascript
// Add note to user
userSchema.methods.addNote = function(note, addedBy) {
  this.notes.push({
    note,
    addedBy,
    addedAt: new Date()
  });
  return this.save();
};

// Update user status
userSchema.methods.updateStatus = function(status, reason, updatedBy) {
  this.status = status;
  this.statusReason = reason;
  this.statusUpdatedAt = new Date();
  this.statusUpdatedBy = updatedBy;
  
  // Update isActive based on status
  this.isActive = ['active', 'pending_verification'].includes(status);
  
  return this.save();
};

// Add tag to user
userSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this.save();
};

// Remove tag from user
userSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

// Check if user has tag
userSchema.methods.hasTag = function(tag) {
  return this.tags.includes(tag);
};

// Get user activity summary
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
```

### Static Methods

#### User Queries
```javascript
// Get users by status
userSchema.statics.getUsersByStatus = function(status) {
  return this.find({ status });
};

// Get users by role
userSchema.statics.getUsersByRole = function(role) {
  return this.find({ role });
};

// Get active users
userSchema.statics.getActiveUsers = function() {
  return this.find({ isActive: true, status: 'active' });
};

// Get users with low trust score
userSchema.statics.getLowTrustUsers = function(threshold = 30) {
  return this.find({ trustScore: { $lt: threshold } });
};

// Get recently registered users
userSchema.statics.getRecentUsers = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.find({ createdAt: { $gte: date } });
};
```

## Data Relationships

### User Relationships
- **UserSettings**: One-to-one relationship via `settings` field
- **Agency**: Many-to-one relationship via `agency.agencyId` field
- **UserSubscription**: One-to-one relationship via `localProPlusSubscription` field
- **Referral System**: Self-referencing via `referral.referredBy` field

### Population Support
```javascript
// Populate agency information
await User.findById(userId).populate('agency.agencyId', 'name type address');

// Populate referral information
await User.findById(userId).populate('referral.referredBy', 'firstName lastName email');

// Populate settings
await User.findById(userId).populate('settings');
```

## Validation Rules

### Required Fields
- **phoneNumber**: Must be unique and follow international format
- **firstName**: Required for user identification
- **lastName**: Required for user identification

### Optional Fields
- **email**: Must be unique when provided, validated format
- **profile.businessName**: Required for business users
- **profile.skills**: Array of strings
- **profile.specialties**: Array of strings
- **profile.serviceAreas**: Array of strings

### Enum Validations
- **role**: Must be one of the defined user roles
- **profile.businessType**: Must be one of the defined business types
- **profile.backgroundCheck.status**: Must be one of the defined statuses
- **agency.role**: Must be one of the defined agency roles
- **agency.status**: Must be one of the defined statuses
- **referral.referralSource**: Must be one of the defined sources
- **referral.referralStats.referralTier**: Must be one of the defined tiers

### Range Validations
- **profile.rating**: Must be between 0 and 5
- **trustScore**: Must be between 0 and 100
- **completionRate**: Must be between 0 and 100
- **cancellationRate**: Must be between 0 and 100
- **agency.commissionRate**: Must be between 0 and 100

## Default Values

The User model includes comprehensive default values that provide sensible defaults for all fields:

- **role**: 'client' (most common user type)
- **isVerified**: false (requires verification)
- **isActive**: true (active by default)
- **status**: 'pending_verification' (requires verification)
- **trustScore**: 0 (starts with no trust)
- **completionRate**: 0 (no completed jobs initially)
- **cancellationRate**: 0 (no cancelled jobs initially)
- **preferences.notifications**: All enabled by default
- **preferences.language**: 'en' (English default)
- **wallet.currency**: 'USD' (US Dollar default)
- **referral.referralStats.referralTier**: 'bronze' (lowest tier)

## Performance Considerations

### Indexing Strategy
The User model uses a comprehensive indexing strategy to optimize common queries:

1. **Single Field Indexes**: For basic filtering and sorting
2. **Compound Indexes**: For complex queries involving multiple fields
3. **Text Search Index**: For full-text search across multiple fields
4. **Sparse Indexes**: For optional fields that may not exist

### Query Optimization
- Use `select()` to limit returned fields
- Use `lean()` for read-only operations
- Use `populate()` sparingly and only when needed
- Use aggregation pipelines for complex analytics

### Caching Strategy
- Cache frequently accessed user data
- Use Redis for session management
- Implement cache invalidation on user updates
- Cache user statistics and analytics

This comprehensive User model provides all the functionality needed for a robust user management system while maintaining performance and scalability.
