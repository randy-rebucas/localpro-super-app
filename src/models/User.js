const mongoose = require('mongoose');
const crypto = require('crypto');
const UserReferral = require('./UserReferral');
const UserActivity = require('./UserActivity');
const UserWallet = require('./UserWallet');
const UserTrust = require('./UserTrust');
const UserManagement = require('./UserManagement');
const UserAgency = require('./UserAgency');
const Provider = require('./Provider');

// ============================================
// CONSTANTS
// ============================================

const VALID_ROLES = ['client', 'provider', 'admin', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'partner', 'staff'];
const VALID_OAUTH_PROVIDERS = ['google', 'apple', 'facebook', 'github', 'microsoft', 'twitter', 'linkedin'];
const VALID_2FA_METHODS = ['sms', 'email', 'authenticator', 'none'];
const VALID_DEVICE_TYPES = ['mobile', 'tablet', 'desktop', 'unknown'];
const VALID_AUTH_METHODS = ['password', 'oauth', 'mpin', 'otp', 'api_key', 'magic_link'];
const VALID_DATA_RETENTION_POLICIES = ['standard', 'minimal', 'extended'];
const VALID_GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
const VALID_REGISTRATION_METHODS = ['partner', 'direct', 'admin'];

// Session configuration
const MAX_SESSIONS_PER_USER = 10;
const SESSION_EXPIRY_DAYS = 30;
const MAX_LOGIN_HISTORY = 50;
const MAX_TRUSTED_DEVICES = 10;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const MAX_LOCK_DURATION_MINUTES = 60;
const PASSWORD_RESET_EXPIRY_HOURS = 1;
const ACCOUNT_DELETION_GRACE_DAYS = 30;

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
  password: {
    type: String,
    select: false // Don't include password in queries by default
  },
  // MPIN (Mobile Personal Identification Number) for biometric-free authentication
  mpin: {
    type: String,
    select: false, // Don't include MPIN in queries by default
    minlength: 4,
    maxlength: 6
  },
  mpinEnabled: {
    type: Boolean,
    default: false
  },
  mpinAttempts: {
    type: Number,
    default: 0
  },
  mpinLockedUntil: {
    type: Date,
    default: null
  },
  emailVerificationCode: {
    type: String,
    expires: '10m' // Email OTP expires in 10 minutes
  },
  lastEmailOTPSent: {
    type: Date,
    default: null
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    trim: true
  },
  birthdate: {
    type: Date
  },
  roles: {
    type: [String],
    enum: ['client', 'provider', 'admin', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'partner', 'staff'],
    default: ['client']
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
  refreshToken: {
    type: String,
    default: null
  },
  refreshTokenExpiresAt: {
    type: Date,
    default: null
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
    }
  },
  // LocalPro Plus subscription reference
  localProPlusSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSubscription'
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserWallet'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Trust and verification system reference
  trust: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserTrust'
  },
  // Referral system integration
  referral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserReferral'
  },
  
  // Settings reference
  settings: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSettings'
  },
  
  // Push notification tokens (FCM/Firebase)
  fcmTokens: [{
    token: {
      type: String,
      required: true
    },
    deviceId: {
      type: String,
      required: true
    },
    deviceType: {
      type: String,
      enum: ['ios', 'android', 'web'],
      default: 'android'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // User management reference
  management: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserManagement'
  },
  
  // Activity tracking
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserActivity'
  },
  // Partner relationship (to identify users added from partners)
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    default: null,
    index: true
  },
  // Registration method (e.g., 'partner', 'direct', 'admin')
  registrationMethod: {
    type: String,
    enum: ['partner', 'direct', 'admin'],
    default: 'direct',
    index: true
  },
  // Agency relationship (for agency_owner and agency_admin roles)
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAgency'
  },

  // ============================================
  // OAUTH/SOCIAL LOGIN INTEGRATION
  // ============================================

  // OAuth provider connections (embedded)
  oauthProviders: [{
    provider: {
      type: String,
      enum: ['google', 'apple', 'facebook', 'github', 'microsoft', 'twitter', 'linkedin'],
      required: true
    },
    providerId: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    displayName: String,
    avatar: String,
    accessToken: { type: String, select: false },
    refreshToken: { type: String, select: false },
    tokenExpiresAt: Date,
    scope: [String],
    linkedAt: { type: Date, default: Date.now },
    lastUsedAt: Date,
    metadata: mongoose.Schema.Types.Mixed
  }],

  // External system identifiers for third-party integrations
  externalIds: [{
    system: { type: String, required: true, trim: true },
    externalId: { type: String, required: true, trim: true },
    metadata: mongoose.Schema.Types.Mixed,
    linkedAt: { type: Date, default: Date.now },
    syncedAt: Date
  }],

  // ============================================
  // ENHANCED SECURITY FEATURES
  // ============================================

  // Two-Factor Authentication (2FA)
  twoFactor: {
    enabled: { type: Boolean, default: false },
    method: {
      type: String,
      enum: ['sms', 'email', 'authenticator', 'none'],
      default: 'none'
    },
    secret: { type: String, select: false },
    backupCodes: [{
      code: { type: String, select: false },
      usedAt: Date
    }],
    verifiedAt: Date,
    lastUsedAt: Date
  },

  // Session management (embedded for recent sessions)
  sessions: [{
    sessionId: { type: String, required: true },
    deviceId: String,
    deviceName: String,
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    },
    browser: String,
    os: String,
    ipAddress: String,
    location: {
      city: String,
      country: String,
      countryCode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    createdAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
    authMethod: {
      type: String,
      enum: ['password', 'oauth', 'mpin', 'otp', 'api_key', 'magic_link'],
      default: 'password'
    }
  }],

  // Password reset
  passwordReset: {
    token: { type: String, select: false },
    tokenHash: { type: String, select: false },
    expiresAt: Date,
    requestedAt: Date,
    requestedIp: String,
    usedAt: Date
  },

  // Account security tracking
  security: {
    passwordChangedAt: Date,
    lastPasswordChangeIp: String,
    failedLoginAttempts: { type: Number, default: 0 },
    lastFailedLoginAt: Date,
    lastFailedLoginIp: String,
    accountLockedUntil: Date,
    lockReason: String,
    securityQuestions: [{
      question: String,
      answerHash: { type: String, select: false }
    }],
    trustedDevices: [{
      deviceId: { type: String, required: true },
      deviceFingerprint: String,
      deviceName: String,
      trustedAt: { type: Date, default: Date.now },
      lastUsedAt: Date
    }],
    loginHistory: [{
      timestamp: { type: Date, default: Date.now },
      ipAddress: String,
      userAgent: String,
      location: String,
      success: { type: Boolean, default: true },
      method: String,
      sessionId: String,
      failureReason: String
    }]
  },

  // ============================================
  // EXTENSIBILITY & INTEGRATION FEATURES
  // ============================================

  // Extensible metadata for custom integrations
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // User-level webhook subscriptions
  webhooks: [{
    url: { type: String, required: true },
    events: [{ type: String }],
    secret: { type: String, select: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastTriggeredAt: Date,
    failureCount: { type: Number, default: 0 },
    lastFailureAt: Date,
    lastFailureReason: String
  }],

  // API permissions for the user
  apiPermissions: {
    canCreateApiKeys: { type: Boolean, default: false },
    maxApiKeys: { type: Number, default: 5 },
    allowedScopes: [String],
    rateLimitOverride: Number,
    webhookLimit: { type: Number, default: 10 }
  },

  // ============================================
  // DATA PRIVACY AND COMPLIANCE
  // ============================================

  privacy: {
    gdprConsent: {
      given: { type: Boolean, default: false },
      givenAt: Date,
      version: String,
      ipAddress: String,
      withdrawnAt: Date
    },
    marketingConsent: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      givenAt: Date,
      updatedAt: Date
    },
    dataRetentionPolicy: {
      type: String,
      enum: ['standard', 'minimal', 'extended'],
      default: 'standard'
    },
    doNotSell: { type: Boolean, default: false },
    doNotTrack: { type: Boolean, default: false },
    accountDeletion: {
      requestedAt: Date,
      scheduledFor: Date,
      reason: String,
      cancelledAt: Date,
      processedAt: Date
    }
  },

  // Terms and agreements tracking
  agreements: [{
    type: { type: String, required: true },
    version: { type: String, required: true },
    acceptedAt: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String
  }],

  // Schema versioning for migrations
  schemaVersion: { type: Number, default: 2 }
}, {
  timestamps: true
});

// Index for better performance (phoneNumber and email already have unique indexes)
userSchema.index({ roles: 1 }); // Multi-role index
userSchema.index({ refreshToken: 1 }); // Refresh token lookup
// Note: Status indexes are now in UserManagement model
userSchema.index({ management: 1 });
userSchema.index({ agency: 1 }); // Agency relationship index
// Note: Referral indexes are now in UserReferral model
userSchema.index({ referral: 1 });
userSchema.index({ wallet: 1 });
userSchema.index({ activity: 1 });
userSchema.index({ trust: 1 });
// Note: Trust score indexes are now in UserTrust model

// Additional performance indexes
userSchema.index({ roles: 1, isActive: 1 }); // Compound index for common queries
userSchema.index({ 'profile.address.city': 1, 'profile.address.state': 1, roles: 1 }); // Location-based queries
// Note: roles: 1, isActive: 1 index already defined above
// Note: Activity indexes are now in UserActivity model
userSchema.index({ activity: 1, isActive: 1 }); // Recent activity
userSchema.index({ createdAt: -1, roles: 1 }); // Registration date with roles
userSchema.index({ updatedAt: -1, isActive: 1 }); // Last updated

// Text search index for comprehensive search
userSchema.index({
  firstName: 'text',
  lastName: 'text',
  'profile.bio': 'text'
});

// Sparse indexes for optional fields
// Note: email already has unique: true, sparse: true which creates an index
userSchema.index({ 'profile.website': 1 }, { sparse: true });

// ============================================
// OAUTH & EXTERNAL ID INDEXES
// ============================================
userSchema.index(
  { 'oauthProviders.provider': 1, 'oauthProviders.providerId': 1 },
  { unique: true, sparse: true, name: 'oauth_provider_unique' }
);
userSchema.index({ 'oauthProviders.email': 1 }, { sparse: true });
userSchema.index(
  { 'externalIds.system': 1, 'externalIds.externalId': 1 },
  { sparse: true, name: 'external_id_lookup' }
);

// ============================================
// SESSION & SECURITY INDEXES
// ============================================
userSchema.index({ 'sessions.sessionId': 1 }, { sparse: true });
userSchema.index({ 'sessions.expiresAt': 1 }, { sparse: true }); // For cleanup jobs
userSchema.index({ 'sessions.isActive': 1, 'sessions.lastActiveAt': -1 }, { sparse: true });
userSchema.index({ 'security.accountLockedUntil': 1 }, { sparse: true });
userSchema.index({ 'passwordReset.tokenHash': 1 }, { sparse: true });
userSchema.index({ 'twoFactor.enabled': 1 }, { sparse: true });

// ============================================
// PRIVACY & COMPLIANCE INDEXES
// ============================================
userSchema.index({ 'privacy.accountDeletion.scheduledFor': 1 }, { sparse: true });
userSchema.index({ 'privacy.gdprConsent.given': 1 }, { sparse: true });
userSchema.index({ 'agreements.type': 1, 'agreements.version': 1 }, { sparse: true });
userSchema.index({ schemaVersion: 1 });

// Pre-validate hook to clean undefined values before validation and validate birthdate
userSchema.pre('validate', function(next) {
  // Validate birthdate is not in the future
  if (this.birthdate && this.birthdate > new Date()) {
    this.invalidate('birthdate', 'Birthdate cannot be in the future');
  }

  // Ensure roles array exists and has at least 'client'
  if (!this.roles || !Array.isArray(this.roles) || this.roles.length === 0) {
    this.roles = ['client'];
  }
  // Ensure 'client' is always present
  if (!this.roles.includes('client')) {
    this.roles.unshift('client');
  }

  // Remove undefined values from profile nested objects that cause casting errors
  if (this.profile) {
    const nestedFields = ['avatar', 'insurance', 'backgroundCheck', 'availability'];

    nestedFields.forEach(field => {
      // If field is undefined, remove it to prevent Mongoose casting errors
      if (this.profile[field] === undefined) {
        // Use unset to properly remove the field
        delete this.profile[field];
      }
    });
  }

  // Initialize security object if needed
  if (!this.security) {
    this.security = {
      failedLoginAttempts: 0,
      loginHistory: [],
      trustedDevices: [],
      securityQuestions: []
    };
  }

  // Initialize privacy object if needed
  if (!this.privacy) {
    this.privacy = {
      gdprConsent: { given: false },
      marketingConsent: { email: false, sms: false, push: false },
      dataRetentionPolicy: 'standard',
      doNotSell: false,
      doNotTrack: false
    };
  }

  // Initialize twoFactor if needed
  if (!this.twoFactor) {
    this.twoFactor = {
      enabled: false,
      method: 'none',
      backupCodes: []
    };
  }

  // Initialize empty arrays if needed
  if (!this.oauthProviders) this.oauthProviders = [];
  if (!this.externalIds) this.externalIds = [];
  if (!this.sessions) this.sessions = [];
  if (!this.webhooks) this.webhooks = [];
  if (!this.agreements) this.agreements = [];

  // Set schema version for new documents
  if (this.isNew && !this.schemaVersion) {
    this.schemaVersion = 2;
  }

  next();
});

// Post-save hook to ensure referral, activity, and wallet documents exist
// Use a flag to prevent infinite loops
userSchema.post('save', async function() {
  // Skip if this is a save triggered by the hook itself
  if (this._skipRelatedDocumentsCreation) {
    return;
  }
  
  // Only create referral/activity/wallet for new users or if missing
  if (this.isNew || !this.referral || !this.activity || !this.wallet) {
    try {
      let needsSave = false;
      
      // Create referral document if it doesn't exist
      if (!this.referral) {
        const referral = await UserReferral.findOrCreateForUser(this._id);
        this.referral = referral._id;
        needsSave = true;
      }
      
      // Create activity document if it doesn't exist
      if (!this.activity) {
        const activity = await UserActivity.findOrCreateForUser(this._id);
        this.activity = activity._id;
        needsSave = true;
      }
      
      // Create wallet document if it doesn't exist
      if (!this.wallet) {
        const wallet = await UserWallet.findOrCreateForUser(this._id);
        this.wallet = wallet._id;
        needsSave = true;
      }
      
      // Create trust document if it doesn't exist
      if (!this.trust) {
        const trust = await UserTrust.findOrCreateForUser(this._id);
        this.trust = trust._id;
        needsSave = true;
      }
      
      // Create management document if it doesn't exist
      if (!this.management) {
        const management = await UserManagement.findOrCreateForUser(this._id);
        this.management = management._id;
        needsSave = true;
      }
      
      // Create agency document if it doesn't exist
      if (!this.agency) {
        const agency = await UserAgency.findOrCreateForUser(this._id);
        this.agency = agency._id;
        needsSave = true;
      }
      
      // Save once if any documents were created
      if (needsSave) {
        this._skipRelatedDocumentsCreation = true;
        await this.save({ validateBeforeSave: false });
        this._skipRelatedDocumentsCreation = false;
      }
    } catch (error) {
      console.error('Error creating referral/activity/wallet documents:', error);
      // Don't throw - allow user save to succeed even if related docs fail
    }
  }
  
  // Create provider profile if user has provider role and profile doesn't exist
  if (this.roles && this.roles.includes('provider')) {
    try {
      // Check for existing provider (including soft-deleted ones)
      const existingProvider = await Provider.findOne({ userId: this._id });
      if (!existingProvider) {
        // Create a basic provider profile with default values
        const providerData = {
          userId: this._id,
          providerType: 'individual', // Default to individual, can be updated later
          status: 'pending',
          onboarding: {
            completed: false,
            currentStep: 'profile_setup',
            progress: 10,
            steps: [
              { step: 'profile_setup', completed: true, completedAt: new Date() }
            ]
          }
        };
        
        const provider = new Provider(providerData);
        await provider.save();
        
        console.log('Provider profile created automatically for user:', this._id);
      } else if (existingProvider.deleted) {
        // Restore soft-deleted provider profile
        existingProvider.deleted = false;
        existingProvider.deletedOn = null;
        await existingProvider.save();
        
        console.log('Provider profile restored automatically for user:', this._id);
      }
    } catch (error) {
      console.error('Error creating/restoring provider profile:', error);
      // Don't throw - allow user save to succeed even if provider creation fails
    }
  } else {
    // Soft delete provider profile if user does not have provider role
    try {
      const existingProvider = await Provider.findOne({ userId: this._id, deleted: { $ne: true } });
      if (existingProvider) {
        existingProvider.deleted = true;
        existingProvider.deletedOn = new Date();
        await existingProvider.save();
        console.log('Provider profile soft deleted automatically for user:', this._id);
      }
    } catch (error) {
      console.error('Error soft deleting provider profile:', error);
      // Don't throw - allow user save to succeed even if provider removal fails
    }
  }
});


// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
userSchema.virtual('age').get(function() {
  if (!this.birthdate) {
    return null;
  }
  const today = new Date();
  const birthDate = new Date(this.birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Note: role field is kept for backward compatibility but synced via pre-save hook
// The virtual is not needed since we keep the actual field (hidden from queries with select: false)

// Method to check if user has a specific role
userSchema.methods.hasRole = function(role) {
  if (!this.roles || this.roles.length === 0) {
    return false;
  }
  return this.roles.includes(role);
};

// Method to check if user has any of the specified roles
userSchema.methods.hasAnyRole = function(roles) {
  if (!this.roles || this.roles.length === 0) {
    return false;
  }
  if (!Array.isArray(roles)) {
    roles = [roles];
  }
  return roles.some(role => this.roles.includes(role));
};

// Method to check if user has all of the specified roles
userSchema.methods.hasAllRoles = function(roles) {
  if (!this.roles || this.roles.length === 0) {
    return false;
  }
  if (!Array.isArray(roles)) {
    roles = [roles];
  }
  return roles.every(role => this.roles.includes(role));
};

// Method to add a role to user
userSchema.methods.addRole = function(role) {
  if (!this.roles) {
    this.roles = [];
  }
  if (VALID_ROLES.includes(role) && !this.roles.includes(role)) {
    this.roles.push(role);
    // Ensure 'client' is always present if user has other roles
    if (this.roles.length > 1 && !this.roles.includes('client')) {
      this.roles.unshift('client');
    }
  }
  return this;
};

// Method to remove a role from user
userSchema.methods.removeRole = function(role) {
  if (!this.roles) {
    this.roles = ['client'];
    return this;
  }
  // Don't allow removing 'client' if it's the only role
  if (role === 'client' && this.roles.length === 1) {
    return this;
  }
  this.roles = this.roles.filter(r => r !== role);
  // Ensure at least 'client' role exists
  if (this.roles.length === 0) {
    this.roles = ['client'];
  }
  return this;
};

// Method to set roles (replaces all existing roles)
userSchema.methods.setRoles = function(roles) {
  if (!Array.isArray(roles)) {
    roles = [roles];
  }
  this.roles = roles.filter(role => VALID_ROLES.includes(role));
  // Ensure 'client' is always present
  if (!this.roles.includes('client')) {
    this.roles.unshift('client');
  }
  return this;
};

// Method to add or update FCM token for push notifications
userSchema.methods.addFcmToken = function(token, deviceId, deviceType = 'android') {
  if (!this.fcmTokens) {
    this.fcmTokens = [];
  }
  
  // Check if token or device already exists
  const existingIndex = this.fcmTokens.findIndex(t => 
    t.token === token || t.deviceId === deviceId
  );
  
  if (existingIndex >= 0) {
    // Update existing token
    this.fcmTokens[existingIndex].token = token;
    this.fcmTokens[existingIndex].lastUsedAt = new Date();
  } else {
    // Add new token
    this.fcmTokens.push({
      token,
      deviceId,
      deviceType,
      createdAt: new Date(),
      lastUsedAt: new Date()
    });
  }
  
  // Limit to 5 devices per user (remove oldest)
  if (this.fcmTokens.length > 5) {
    this.fcmTokens.sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt));
    this.fcmTokens = this.fcmTokens.slice(0, 5);
  }
  
  return this;
};

// Method to remove FCM token
userSchema.methods.removeFcmToken = function(tokenOrDeviceId) {
  if (!this.fcmTokens) {
    return this;
  }
  this.fcmTokens = this.fcmTokens.filter(t => 
    t.token !== tokenOrDeviceId && t.deviceId !== tokenOrDeviceId
  );
  return this;
};

// Method to get all FCM tokens as array of strings
userSchema.methods.getFcmTokens = function() {
  if (!this.fcmTokens || this.fcmTokens.length === 0) {
    return [];
  }
  return this.fcmTokens.map(t => t.token);
};

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

// Helper method to ensure trust is populated
userSchema.methods.ensureTrust = async function(options = {}) {
  const { forceRefresh = false } = options;
  
  // If trust doesn't exist, create it
  if (!this.trust) {
    const trust = await UserTrust.findOrCreateForUser(this._id);
    this.trust = trust._id;
    await this.save({ validateBeforeSave: false });
    return trust;
  }
  
  // Check if trust is populated by checking for a property that exists when populated
  const isPopulated = this.trust && 
    typeof this.trust === 'object' && 
    this.trust._id && 
    this.trust.trustScore !== undefined;
  
  // Populate if not already populated or if force refresh requested
  if (!isPopulated || forceRefresh) {
    await this.populate('trust');
  }
  
  return this.trust;
};

// Method to calculate trust score
userSchema.methods.calculateTrustScore = async function() {
  const trust = await this.ensureTrust();
  trust.calculateTrustScore();
  await trust.save();
  return trust.trustScore;
};

// Method to add badge
userSchema.methods.addBadge = async function(badgeType, description) {
  const trust = await this.ensureTrust();
  trust.addBadge(badgeType, description);
  await trust.save();
  return this;
};

// Method to remove badge
userSchema.methods.removeBadge = async function(badgeType) {
  const trust = await this.ensureTrust();
  trust.removeBadge(badgeType);
  await trust.save();
  return this;
};

// Method to check if user has badge
userSchema.methods.hasBadge = async function(badgeType) {
  const trust = await this.ensureTrust();
  return trust.hasBadge(badgeType);
};

// Method to update response time
userSchema.methods.updateResponseTime = async function(responseTimeMinutes) {
  const trust = await this.ensureTrust();
  trust.updateResponseTime(responseTimeMinutes);
  await trust.save();
  return this;
};

// Method to update completion rate
userSchema.methods.updateCompletionRate = async function(completed, total) {
  const trust = await this.ensureTrust();
  trust.updateCompletionRate(completed, total);
  await trust.save();
  return this;
};

// Method to update cancellation rate
userSchema.methods.updateCancellationRate = async function(cancelled, total) {
  const trust = await this.ensureTrust();
  trust.updateCancellationRate(cancelled, total);
  await trust.save();
  return this;
};

// Method to verify a verification type
userSchema.methods.verify = async function(verificationType) {
  const trust = await this.ensureTrust();
  trust.verify(verificationType);
  await trust.save();
  return this;
};

// Method to unverify a verification type
userSchema.methods.unverify = async function(verificationType) {
  const trust = await this.ensureTrust();
  trust.unverify(verificationType);
  await trust.save();
  return this;
};

// Method to get trust summary
userSchema.methods.getTrustSummary = async function() {
  const trust = await this.ensureTrust();
  return trust.getTrustSummary();
};

// Helper method to ensure referral is populated
userSchema.methods.ensureReferral = async function(options = {}) {
  const { forceRefresh = false } = options;
  
  // If referral doesn't exist, create it
  if (!this.referral) {
    const referral = await UserReferral.findOrCreateForUser(this._id);
    this.referral = referral._id;
    await this.save({ validateBeforeSave: false });
    return referral;
  }
  
  // Check if referral is populated by checking for a property that exists when populated
  const isPopulated = this.referral && 
    typeof this.referral === 'object' && 
    this.referral._id && 
    this.referral.referralCode !== undefined;
  
  // Populate if not already populated or if force refresh requested
  if (!isPopulated || forceRefresh) {
    await this.populate('referral');
  }
  
  return this.referral;
};

// Method to generate referral code
userSchema.methods.generateReferralCode = async function() {
  const referral = await this.ensureReferral();
  const initials = (this.firstName?.charAt(0) || '') + (this.lastName?.charAt(0) || '');
  referral.generateReferralCode(initials);
  await referral.save();
  return referral.referralCode;
};

// Method to update referral stats
userSchema.methods.updateReferralStats = async function(type, amount = 0) {
  const referral = await this.ensureReferral();
  await referral.updateReferralStats(type, amount);
  return this;
};

// Method to get referral link
userSchema.methods.getReferralLink = async function(baseUrl = process.env.FRONTEND_URL) {
  let referral = await this.ensureReferral();
  if (!referral.referralCode) {
    await this.generateReferralCode();
    // Re-fetch the referral to get the updated referralCode
    referral = await this.ensureReferral({ forceRefresh: true });
  }
  return referral.getReferralLink(baseUrl);
};

// Method to check if user was referred
userSchema.methods.wasReferred = async function() {
  const referral = await this.ensureReferral();
  return referral.wasReferred();
};

// Helper method to ensure activity is populated
userSchema.methods.ensureActivity = async function(options = {}) {
  const { forceRefresh = false } = options;
  
  // If activity doesn't exist, create it
  if (!this.activity) {
    const activity = await UserActivity.findOrCreateForUser(this._id);
    this.activity = activity._id;
    await this.save({ validateBeforeSave: false });
    return activity;
  }
  
  // Check if activity is populated by checking for a property that exists when populated
  const isPopulated = this.activity && 
    typeof this.activity === 'object' && 
    this.activity._id && 
    this.activity.lastActiveAt !== undefined;
  
  // Populate if not already populated or if force refresh requested
  if (!isPopulated || forceRefresh) {
    await this.populate('activity');
  }
  
  return this.activity;
};

// Helper method to ensure agency is populated
userSchema.methods.ensureAgency = async function(options = {}) {
  const { forceRefresh = false } = options;
  
  // If agency doesn't exist, create it
  if (!this.agency) {
    const agency = await UserAgency.findOrCreateForUser(this._id);
    this.agency = agency._id;
    await this.save({ validateBeforeSave: false });
    return agency;
  }
  
  // Check if agency is populated by checking for a property that exists when populated
  const isPopulated = this.agency && 
    typeof this.agency === 'object' && 
    this.agency._id && 
    this.agency.agencyId !== undefined;
  
  // Populate if not already populated or if force refresh requested
  if (!isPopulated || forceRefresh) {
    await this.populate({
      path: 'agency',
      populate: {
        path: 'agencyId',
        select: 'name type contact.address'
      }
    });
  }
  
  return this.agency;
};

// Helper method to ensure management is populated
userSchema.methods.ensureManagement = async function(options = {}) {
  const { forceRefresh = false } = options;
  
  // If management doesn't exist, create it
  if (!this.management) {
    const management = await UserManagement.findOrCreateForUser(this._id);
    this.management = management._id;
    await this.save({ validateBeforeSave: false });
    return management;
  }
  
  // Check if management is populated by checking for a property that exists when populated
  const isPopulated = this.management && 
    typeof this.management === 'object' && 
    this.management._id && 
    this.management.status !== undefined;
  
  // Populate if not already populated or if force refresh requested
  if (!isPopulated || forceRefresh) {
    await this.populate('management');
  }
  
  return this.management;
};

// Method to update login information
userSchema.methods.updateLoginInfo = async function(ip, userAgent) {
  const management = await this.ensureManagement();
  await management.updateLoginInfo(ip);
  
  const activity = await this.ensureActivity();
  await activity.updateActivity(userAgent);
  
  return this.save();
};

// Method to get device type from user agent
userSchema.methods.getDeviceType = async function(userAgent) {
  if (!userAgent) return 'unknown';
  const activity = await this.ensureActivity();
  return activity.getDeviceType(userAgent);
};

// Method to add note to user
userSchema.methods.addNote = async function(note, addedBy) {
  const management = await this.ensureManagement();
  await management.addNote(note, addedBy);
  return this;
};

// Method to update user status
userSchema.methods.updateStatus = async function(status, reason, updatedBy) {
  const management = await this.ensureManagement();
  
  // Don't allow status update if user is deleted
  if (management.deletedAt) {
    throw new Error('Cannot update status of deleted user');
  }
  
  await management.updateStatus(status, reason, updatedBy);
  
  // Update isActive based on status
  this.isActive = ['active', 'pending_verification'].includes(status);
  
  return this.save();
};

// Method to add tag to user
userSchema.methods.addTag = async function(tag) {
  const management = await this.ensureManagement();
  await management.addTag(tag);
  return this;
};

// Method to remove tag from user
userSchema.methods.removeTag = async function(tag) {
  const management = await this.ensureManagement();
  await management.removeTag(tag);
  return this;
};

// Method to check if user has tag
userSchema.methods.hasTag = async function(tag) {
  const management = await this.ensureManagement();
  return management.hasTag(tag);
};

// Method to set tags (replaces all existing tags)
userSchema.methods.setTags = async function(tags) {
  const management = await this.ensureManagement();
  await management.setTags(tags);
  return this;
};

// Method to soft delete user
userSchema.methods.softDelete = async function(deletedBy) {
  const management = await this.ensureManagement();
  await management.softDelete(deletedBy);
  this.isActive = false;
  return this.save();
};

// Method to restore user
userSchema.methods.restore = async function(restoredBy) {
  const management = await this.ensureManagement();
  await management.restore(restoredBy);
  this.isActive = true;
  return this.save();
};

// Method to get user activity summary
userSchema.methods.getActivitySummary = async function() {
  const activity = await this.ensureActivity();
  const management = await this.ensureManagement();
  const trust = await this.ensureTrust();
  
  const activitySummary = activity ? activity.getSummary() : {};
  const managementSummary = management ? management.getSummary() : {};
  const trustSummary = trust ? trust.getTrustSummary() : {};
  
  return {
    ...activitySummary,
    ...managementSummary,
    isActive: this.isActive,
    trustScore: trustSummary.trustScore,
    verification: trustSummary.verification
  };
};

// Static method to get users by status
userSchema.statics.getUsersByStatus = async function(status) {
  const UserManagement = mongoose.model('UserManagement');
  const managementDocs = await UserManagement.find({ status, deletedAt: null });
  const userIds = managementDocs.map(m => m.user);
  return this.find({ _id: { $in: userIds } });
};

// Static method to get users by role (supports both single role and array)
userSchema.statics.getUsersByRole = function(role) {
  if (Array.isArray(role)) {
    return this.find({ roles: { $in: role } });
  }
  return this.find({ roles: role });
};

// Static method to get active users
userSchema.statics.getActiveUsers = async function() {
  const UserManagement = mongoose.model('UserManagement');
  const managementDocs = await UserManagement.find({ status: 'active', deletedAt: null });
  const userIds = managementDocs.map(m => m.user);
  return this.find({ _id: { $in: userIds }, isActive: true });
};

// Static method to get users with low trust score
userSchema.statics.getLowTrustUsers = async function(threshold = 30) {
  const UserTrust = mongoose.model('UserTrust');
  const trustDocs = await UserTrust.find({ trustScore: { $lt: threshold } });
  const userIds = trustDocs.map(t => t.user);
  return this.find({ _id: { $in: userIds } });
};

// Static method to get recently registered users
userSchema.statics.getRecentUsers = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.find({ createdAt: { $gte: date } });
};

// Static method to populate all related documents
userSchema.statics.populateRelated = function(query) {
  return query
    .populate('referral')
    .populate('activity')
    .populate('wallet')
    .populate('trust')
    .populate('management')
    .populate('agency')
    .populate('settings')
    .populate('localProPlusSubscription')
    .populate({
      path: 'management',
      populate: [
        { path: 'statusUpdatedBy', select: 'firstName lastName' },
        { path: 'deletedBy', select: 'firstName lastName' }
      ]
    })
    .populate({
      path: 'agency',
      populate: {
        path: 'agencyId',
        select: 'name type contact.address'
      }
    });
};

// Static method to find user with all related documents
userSchema.statics.findByIdWithRelated = function(userId) {
  return this.findById(userId)
    .populate('referral')
    .populate('activity')
    .populate('wallet')
    .populate('trust')
    .populate('management')
    .populate('agency')
    .populate('settings')
    .populate('localProPlusSubscription')
    .populate({
      path: 'agency',
      populate: {
        path: 'agencyId',
        select: 'name type contact.address'
      }
    });
};

// Method to populate all related documents
userSchema.methods.populateAll = async function() {
  await this.populate([
    { path: 'referral' },
    { path: 'activity' },
    { path: 'wallet' },
    { path: 'trust' },
    { 
      path: 'management',
      populate: [
        { path: 'statusUpdatedBy', select: 'firstName lastName email' },
        { path: 'deletedBy', select: 'firstName lastName email' }
      ]
    },
    {
      path: 'agency',
      populate: {
        path: 'agencyId',
        select: 'name type contact.address'
      }
    },
    { path: 'settings' },
    { path: 'localProPlusSubscription' }
  ]);
  return this;
};

// Method to get comprehensive user summary
userSchema.methods.getSummary = async function() {
  await this.populateAll();
  
  const walletSummary = this.wallet ? await this.wallet.getBalanceSummary() : null;
  const activitySummary = this.activity ? this.activity.getSummary() : null;
  const managementSummary = this.management ? this.management.getSummary() : null;
  const trustSummary = this.trust ? await this.trust.getTrustSummary() : null;
  const referralSummary = this.referral ? {
    referralCode: this.referral.referralCode,
    wasReferred: this.referral.wasReferred(),
    tier: this.referral.referralStats.referralTier,
    totalReferrals: this.referral.referralStats.totalReferrals,
    successfulReferrals: this.referral.referralStats.successfulReferrals
  } : null;
  
  return {
    id: this._id,
    phoneNumber: this.phoneNumber,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    roles: this.roles,
    status: managementSummary?.status,
    isActive: this.isActive,
    isVerified: this.isVerified,
    trust: trustSummary,
    wallet: walletSummary,
    activity: activitySummary,
    management: managementSummary,
    referral: referralSummary,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Pre-remove hook to handle cleanup of related documents
userSchema.pre('remove', async function(next) {
  try {
    // Mark user as deleted instead of actually removing
    this.deletedAt = new Date();
    this.isActive = false;
    this.status = 'banned';
    await this.save();
    
    // Note: We don't delete related documents (referral, activity, wallet)
    // as they may be needed for historical records and financial audits
    // Instead, we mark the user as deleted
    
    next();
  } catch (error) {
    next(error);
  }
});

// Helper method to ensure wallet is populated
userSchema.methods.ensureWallet = async function(options = {}) {
  const { forceRefresh = false } = options;
  
  // If wallet doesn't exist, create it
  if (!this.wallet) {
    const wallet = await UserWallet.findOrCreateForUser(this._id);
    this.wallet = wallet._id;
    await this.save({ validateBeforeSave: false });
    return wallet;
  }
  
  // Check if wallet is populated by checking for a property that exists when populated
  const isPopulated = this.wallet && 
    typeof this.wallet === 'object' && 
    this.wallet._id && 
    this.wallet.balance !== undefined;
  
  // Populate if not already populated or if force refresh requested
  if (!isPopulated || forceRefresh) {
    await this.populate('wallet');
  }
  
  return this.wallet;
};

// Method to get wallet balance
userSchema.methods.getWalletBalance = async function() {
  const wallet = await this.ensureWallet();
  await wallet.updateBalance();
  return wallet.getBalanceSummary();
};

// Method to add wallet credit
userSchema.methods.addWalletCredit = async function(data) {
  const wallet = await this.ensureWallet();
  return wallet.addCredit(data);
};

// Method to add wallet debit
userSchema.methods.addWalletDebit = async function(data) {
  const wallet = await this.ensureWallet();
  return wallet.addDebit(data);
};

// MPIN (Mobile Personal Identification Number) methods
userSchema.methods.setMpin = async function(mpin) {
  // Validate MPIN format (4-6 digits)
  if (!mpin || !/^\d{4,6}$/.test(mpin)) {
    throw new Error('MPIN must be 4-6 digits');
  }
  
  this.mpin = mpin;
  this.mpinEnabled = true;
  this.mpinAttempts = 0;
  this.mpinLockedUntil = null;
  await this.save();
  return true;
};

userSchema.methods.verifyMpin = async function(mpin) {
  // Check if MPIN is enabled
  if (!this.mpinEnabled) {
    throw new Error('MPIN not enabled for this user');
  }
  
  // Check if MPIN is locked
  if (this.mpinLockedUntil && this.mpinLockedUntil > new Date()) {
    const remainingTime = Math.ceil((this.mpinLockedUntil - new Date()) / 1000 / 60);
    throw new Error(`MPIN locked. Try again in ${remainingTime} minutes`);
  }
  
  // Verify MPIN
  if (this.mpin !== mpin) {
    this.mpinAttempts += 1;
    
    // Lock MPIN after 5 failed attempts for 15 minutes
    if (this.mpinAttempts >= 5) {
      this.mpinLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await this.save();
      throw new Error('MPIN locked due to too many failed attempts. Try again in 15 minutes');
    }
    
    await this.save();
    throw new Error(`Invalid MPIN. ${5 - this.mpinAttempts} attempts remaining`);
  }
  
  // Reset attempts on successful verification
  this.mpinAttempts = 0;
  await this.save();
  return true;
};

userSchema.methods.disableMpin = async function() {
  this.mpin = undefined;
  this.mpinEnabled = false;
  this.mpinAttempts = 0;
  this.mpinLockedUntil = null;
  await this.save();
  return true;
};

userSchema.methods.isMpinLocked = function() {
  return this.mpinLockedUntil && this.mpinLockedUntil > new Date();
};

userSchema.methods.getMpinStatus = function() {
  return {
    enabled: this.mpinEnabled,
    locked: this.isMpinLocked(),
    attempts: this.mpinAttempts,
    lockedUntil: this.mpinLockedUntil
  };
};

// Password hashing methods
const bcrypt = require('bcryptjs');

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  // Hash password with cost of 10
  if (this.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// ============================================
// OAUTH/SOCIAL LOGIN METHODS
// ============================================

// Connect an OAuth provider
userSchema.methods.connectOAuthProvider = async function(provider, data) {
  if (!VALID_OAUTH_PROVIDERS.includes(provider)) {
    throw new Error(`Invalid OAuth provider: ${provider}`);
  }

  if (!data.providerId) {
    throw new Error('Provider ID is required');
  }

  if (!this.oauthProviders) {
    this.oauthProviders = [];
  }

  // Check if provider is already connected
  const existingIndex = this.oauthProviders.findIndex(p => p.provider === provider);

  const providerData = {
    provider,
    providerId: data.providerId,
    email: data.email,
    displayName: data.displayName,
    avatar: data.avatar,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    tokenExpiresAt: data.tokenExpiresAt,
    scope: data.scope || [],
    linkedAt: new Date(),
    lastUsedAt: new Date(),
    metadata: data.metadata || {}
  };

  if (existingIndex >= 0) {
    // Update existing provider
    this.oauthProviders[existingIndex] = providerData;
  } else {
    // Add new provider
    this.oauthProviders.push(providerData);
  }

  await this.save();
  return this;
};

// Disconnect an OAuth provider
userSchema.methods.disconnectOAuthProvider = async function(provider) {
  if (!this.oauthProviders || this.oauthProviders.length === 0) {
    return this;
  }

  // Prevent disconnecting if it's the only auth method
  const hasPassword = !!this.password;
  const hasMpin = this.mpinEnabled;
  const otherProviders = this.oauthProviders.filter(p => p.provider !== provider);

  if (!hasPassword && !hasMpin && otherProviders.length === 0) {
    throw new Error('Cannot disconnect last authentication method');
  }

  this.oauthProviders = otherProviders;
  await this.save();
  return this;
};

// Get OAuth provider connection
userSchema.methods.getOAuthProvider = function(provider) {
  if (!this.oauthProviders) return null;
  return this.oauthProviders.find(p => p.provider === provider) || null;
};

// Check if OAuth provider is connected
userSchema.methods.hasOAuthProvider = function(provider) {
  return !!this.getOAuthProvider(provider);
};

// Get all connected OAuth providers (names only)
userSchema.methods.getConnectedProviders = function() {
  if (!this.oauthProviders) return [];
  return this.oauthProviders.map(p => ({
    provider: p.provider,
    email: p.email,
    displayName: p.displayName,
    linkedAt: p.linkedAt,
    lastUsedAt: p.lastUsedAt
  }));
};

// Update OAuth provider last used
userSchema.methods.updateOAuthLastUsed = async function(provider) {
  if (!this.oauthProviders) return this;

  const providerIndex = this.oauthProviders.findIndex(p => p.provider === provider);
  if (providerIndex >= 0) {
    this.oauthProviders[providerIndex].lastUsedAt = new Date();
    await this.save();
  }
  return this;
};

// Refresh OAuth token (stores new tokens)
userSchema.methods.refreshOAuthToken = async function(provider, tokens) {
  if (!this.oauthProviders) {
    throw new Error('No OAuth providers connected');
  }

  const providerIndex = this.oauthProviders.findIndex(p => p.provider === provider);
  if (providerIndex < 0) {
    throw new Error(`Provider ${provider} not connected`);
  }

  if (tokens.accessToken) {
    this.oauthProviders[providerIndex].accessToken = tokens.accessToken;
  }
  if (tokens.refreshToken) {
    this.oauthProviders[providerIndex].refreshToken = tokens.refreshToken;
  }
  if (tokens.tokenExpiresAt) {
    this.oauthProviders[providerIndex].tokenExpiresAt = tokens.tokenExpiresAt;
  }
  this.oauthProviders[providerIndex].lastUsedAt = new Date();

  await this.save();
  return this;
};

// ============================================
// EXTERNAL ID METHODS (Third-party integrations)
// ============================================

// Link external system ID
userSchema.methods.linkExternalId = async function(system, externalId, metadata = {}) {
  if (!system || !externalId) {
    throw new Error('System and external ID are required');
  }

  if (!this.externalIds) {
    this.externalIds = [];
  }

  const existingIndex = this.externalIds.findIndex(e => e.system === system);

  const externalIdData = {
    system: system.toLowerCase().trim(),
    externalId: externalId.trim(),
    metadata,
    linkedAt: new Date(),
    syncedAt: new Date()
  };

  if (existingIndex >= 0) {
    this.externalIds[existingIndex] = externalIdData;
  } else {
    this.externalIds.push(externalIdData);
  }

  await this.save();
  return this;
};

// Unlink external system ID
userSchema.methods.unlinkExternalId = async function(system) {
  if (!this.externalIds) return this;

  this.externalIds = this.externalIds.filter(e => e.system !== system.toLowerCase());
  await this.save();
  return this;
};

// Get external ID for a system
userSchema.methods.getExternalId = function(system) {
  if (!this.externalIds) return null;
  const entry = this.externalIds.find(e => e.system === system.toLowerCase());
  return entry ? entry.externalId : null;
};

// Get all external IDs
userSchema.methods.getAllExternalIds = function() {
  if (!this.externalIds) return [];
  return this.externalIds.map(e => ({
    system: e.system,
    externalId: e.externalId,
    linkedAt: e.linkedAt,
    syncedAt: e.syncedAt
  }));
};

// Update external ID sync timestamp
userSchema.methods.updateExternalIdSync = async function(system) {
  if (!this.externalIds) return this;

  const entry = this.externalIds.find(e => e.system === system.toLowerCase());
  if (entry) {
    entry.syncedAt = new Date();
    await this.save();
  }
  return this;
};

// ============================================
// TWO-FACTOR AUTHENTICATION (2FA) METHODS
// ============================================

// Enable Two-Factor Authentication
userSchema.methods.enableTwoFactor = async function(method, secret = null) {
  const validMethods = ['sms', 'email', 'authenticator'];
  if (!validMethods.includes(method)) {
    throw new Error(`Invalid 2FA method: ${method}. Valid methods: ${validMethods.join(', ')}`);
  }

  if (!this.twoFactor) {
    this.twoFactor = {};
  }

  this.twoFactor.method = method;

  if (method === 'authenticator' && secret) {
    this.twoFactor.secret = secret;
  }

  // Don't enable until verified
  this.twoFactor.enabled = false;

  await this.save();
  return this;
};

// Verify and activate 2FA
userSchema.methods.verifyAndActivateTwoFactor = async function() {
  if (!this.twoFactor || this.twoFactor.method === 'none') {
    throw new Error('2FA not configured');
  }

  this.twoFactor.enabled = true;
  this.twoFactor.verifiedAt = new Date();

  await this.save();
  return this;
};

// Disable Two-Factor Authentication
userSchema.methods.disableTwoFactor = async function() {
  if (!this.twoFactor) {
    this.twoFactor = {};
  }

  this.twoFactor.enabled = false;
  this.twoFactor.method = 'none';
  this.twoFactor.secret = undefined;
  this.twoFactor.backupCodes = [];
  this.twoFactor.verifiedAt = undefined;
  this.twoFactor.lastUsedAt = undefined;

  await this.save();
  return this;
};

// Update 2FA last used
userSchema.methods.updateTwoFactorLastUsed = async function() {
  if (this.twoFactor) {
    this.twoFactor.lastUsedAt = new Date();
    await this.save();
  }
  return this;
};

// Generate backup codes
userSchema.methods.generateBackupCodes = async function(count = 10) {
  if (!this.twoFactor) {
    this.twoFactor = {};
  }

  const codes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);

    // Store hashed version
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    hashedCodes.push({ code: hash, usedAt: null });
  }

  this.twoFactor.backupCodes = hashedCodes;
  await this.save();

  // Return plaintext codes (only shown once)
  return codes;
};

// Use a backup code
userSchema.methods.useBackupCode = async function(code) {
  if (!this.twoFactor || !this.twoFactor.backupCodes || this.twoFactor.backupCodes.length === 0) {
    return false;
  }

  const hash = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');

  const backupCode = this.twoFactor.backupCodes.find(
    bc => bc.code === hash && !bc.usedAt
  );

  if (!backupCode) {
    return false;
  }

  // Mark code as used
  backupCode.usedAt = new Date();
  await this.save();

  return true;
};

// Get remaining backup codes count
userSchema.methods.getRemainingBackupCodesCount = function() {
  if (!this.twoFactor || !this.twoFactor.backupCodes) {
    return 0;
  }
  return this.twoFactor.backupCodes.filter(bc => !bc.usedAt).length;
};

// Check if 2FA is enabled
userSchema.methods.isTwoFactorEnabled = function() {
  return this.twoFactor && this.twoFactor.enabled === true;
};

// Get 2FA status
userSchema.methods.getTwoFactorStatus = function() {
  if (!this.twoFactor) {
    return {
      enabled: false,
      method: 'none',
      verifiedAt: null,
      backupCodesRemaining: 0
    };
  }

  return {
    enabled: this.twoFactor.enabled,
    method: this.twoFactor.method,
    verifiedAt: this.twoFactor.verifiedAt,
    lastUsedAt: this.twoFactor.lastUsedAt,
    backupCodesRemaining: this.getRemainingBackupCodesCount()
  };
};

// ============================================
// SESSION MANAGEMENT METHODS
// ============================================

// Create a new session
userSchema.methods.createSession = async function(deviceInfo, authMethod = 'password') {
  if (!this.sessions) {
    this.sessions = [];
  }

  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days default

  const session = {
    sessionId,
    deviceId: deviceInfo.deviceId || crypto.randomBytes(16).toString('hex'),
    deviceName: deviceInfo.deviceName,
    deviceType: deviceInfo.deviceType || 'unknown',
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    ipAddress: deviceInfo.ipAddress,
    location: deviceInfo.location || {},
    createdAt: new Date(),
    lastActiveAt: new Date(),
    expiresAt,
    isActive: true,
    authMethod
  };

  // Limit to 10 active sessions, remove oldest if needed
  const activeSessions = this.sessions.filter(s => s.isActive);
  if (activeSessions.length >= 10) {
    const oldestSession = activeSessions.sort((a, b) =>
      new Date(a.lastActiveAt) - new Date(b.lastActiveAt)
    )[0];
    if (oldestSession) {
      oldestSession.isActive = false;
    }
  }

  this.sessions.push(session);
  await this.save();

  return sessionId;
};

// Update session activity
userSchema.methods.updateSessionActivity = async function(sessionId, ipAddress = null) {
  if (!this.sessions) return null;

  const session = this.sessions.find(s => s.sessionId === sessionId && s.isActive);
  if (session) {
    session.lastActiveAt = new Date();
    if (ipAddress) {
      session.ipAddress = ipAddress;
    }
    await this.save();
  }
  return session;
};

// Revoke a specific session
userSchema.methods.revokeSession = async function(sessionId) {
  if (!this.sessions) return this;

  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.isActive = false;
    await this.save();
  }
  return this;
};

// Revoke all sessions except current
userSchema.methods.revokeAllSessions = async function(exceptSessionId = null) {
  if (!this.sessions) return this;

  this.sessions.forEach(session => {
    if (session.sessionId !== exceptSessionId) {
      session.isActive = false;
    }
  });

  await this.save();
  return this;
};

// Get active sessions
userSchema.methods.getActiveSessions = function() {
  if (!this.sessions) return [];

  const now = new Date();
  return this.sessions
    .filter(s => s.isActive && (!s.expiresAt || new Date(s.expiresAt) > now))
    .map(s => ({
      sessionId: s.sessionId,
      deviceName: s.deviceName,
      deviceType: s.deviceType,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ipAddress,
      location: s.location,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      authMethod: s.authMethod
    }));
};

// Validate session
userSchema.methods.validateSession = function(sessionId) {
  if (!this.sessions) return false;

  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (!session) return false;
  if (!session.isActive) return false;
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) return false;

  return true;
};

// Clean expired sessions
userSchema.methods.cleanExpiredSessions = async function() {
  if (!this.sessions) return this;

  const now = new Date();
  let changed = false;

  this.sessions.forEach(session => {
    if (session.isActive && session.expiresAt && new Date(session.expiresAt) < now) {
      session.isActive = false;
      changed = true;
    }
  });

  // Remove sessions older than 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const originalLength = this.sessions.length;
  this.sessions = this.sessions.filter(s => new Date(s.createdAt) > cutoff);

  if (this.sessions.length !== originalLength) {
    changed = true;
  }

  if (changed) {
    await this.save();
  }

  return this;
};

// ============================================
// PASSWORD RESET METHODS
// ============================================

// Create password reset token
userSchema.methods.createPasswordResetToken = async function(ipAddress = null) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

  this.passwordReset = {
    token: undefined, // Don't store plaintext
    tokenHash,
    expiresAt,
    requestedAt: new Date(),
    requestedIp: ipAddress,
    usedAt: null
  };

  await this.save();
  return token; // Return plaintext token to send via email
};

// Validate password reset token
userSchema.methods.validatePasswordResetToken = function(token) {
  if (!this.passwordReset || !this.passwordReset.tokenHash) {
    return { valid: false, reason: 'No reset token found' };
  }

  if (this.passwordReset.usedAt) {
    return { valid: false, reason: 'Token already used' };
  }

  if (new Date() > new Date(this.passwordReset.expiresAt)) {
    return { valid: false, reason: 'Token expired' };
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  if (tokenHash !== this.passwordReset.tokenHash) {
    return { valid: false, reason: 'Invalid token' };
  }

  return { valid: true };
};

// Use password reset token (mark as used)
userSchema.methods.usePasswordResetToken = async function() {
  if (this.passwordReset) {
    this.passwordReset.usedAt = new Date();
    this.security = this.security || {};
    this.security.passwordChangedAt = new Date();
    await this.save();
  }
  return this;
};

// Clear password reset token
userSchema.methods.clearPasswordResetToken = async function() {
  this.passwordReset = undefined;
  await this.save();
  return this;
};

// ============================================
// ACCOUNT SECURITY METHODS
// ============================================

// Record login attempt
userSchema.methods.recordLoginAttempt = async function(success, ipAddress, userAgent, method = 'password', sessionId = null, failureReason = null) {
  if (!this.security) {
    this.security = {};
  }
  if (!this.security.loginHistory) {
    this.security.loginHistory = [];
  }

  // Add to login history (keep last 50)
  this.security.loginHistory.unshift({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    success,
    method,
    sessionId,
    failureReason
  });

  if (this.security.loginHistory.length > 50) {
    this.security.loginHistory = this.security.loginHistory.slice(0, 50);
  }

  if (success) {
    // Reset failed attempts on successful login
    this.security.failedLoginAttempts = 0;
    this.security.accountLockedUntil = null;
    this.security.lockReason = null;
  } else {
    // Increment failed attempts
    this.security.failedLoginAttempts = (this.security.failedLoginAttempts || 0) + 1;
    this.security.lastFailedLoginAt = new Date();
    this.security.lastFailedLoginIp = ipAddress;

    // Lock account after 5 failed attempts
    if (this.security.failedLoginAttempts >= 5) {
      const lockDuration = Math.min(this.security.failedLoginAttempts * 5, 60); // Max 60 minutes
      this.security.accountLockedUntil = new Date(Date.now() + lockDuration * 60 * 1000);
      this.security.lockReason = 'Too many failed login attempts';
    }
  }

  await this.save();
  return this;
};

// Check if account is locked
userSchema.methods.isAccountLocked = function() {
  if (!this.security || !this.security.accountLockedUntil) {
    return false;
  }
  return new Date(this.security.accountLockedUntil) > new Date();
};

// Get lock status
userSchema.methods.getLockStatus = function() {
  if (!this.isAccountLocked()) {
    return { locked: false };
  }

  const lockedUntil = new Date(this.security.accountLockedUntil);
  const remainingMs = lockedUntil - new Date();
  const remainingMinutes = Math.ceil(remainingMs / 60000);

  return {
    locked: true,
    reason: this.security.lockReason,
    lockedUntil: lockedUntil,
    remainingMinutes
  };
};

// Lock account manually
userSchema.methods.lockAccount = async function(reason, durationMinutes = 60) {
  if (!this.security) {
    this.security = {};
  }

  this.security.accountLockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  this.security.lockReason = reason;

  await this.save();
  return this;
};

// Unlock account
userSchema.methods.unlockAccount = async function() {
  if (!this.security) return this;

  this.security.accountLockedUntil = null;
  this.security.lockReason = null;
  this.security.failedLoginAttempts = 0;

  await this.save();
  return this;
};

// Add trusted device
userSchema.methods.addTrustedDevice = async function(deviceInfo) {
  if (!this.security) {
    this.security = {};
  }
  if (!this.security.trustedDevices) {
    this.security.trustedDevices = [];
  }

  const existingIndex = this.security.trustedDevices.findIndex(
    d => d.deviceId === deviceInfo.deviceId
  );

  const trustedDevice = {
    deviceId: deviceInfo.deviceId,
    deviceFingerprint: deviceInfo.deviceFingerprint,
    deviceName: deviceInfo.deviceName,
    trustedAt: new Date(),
    lastUsedAt: new Date()
  };

  if (existingIndex >= 0) {
    this.security.trustedDevices[existingIndex] = trustedDevice;
  } else {
    // Limit to 10 trusted devices
    if (this.security.trustedDevices.length >= 10) {
      this.security.trustedDevices.shift();
    }
    this.security.trustedDevices.push(trustedDevice);
  }

  await this.save();
  return this;
};

// Remove trusted device
userSchema.methods.removeTrustedDevice = async function(deviceId) {
  if (!this.security || !this.security.trustedDevices) return this;

  this.security.trustedDevices = this.security.trustedDevices.filter(
    d => d.deviceId !== deviceId
  );

  await this.save();
  return this;
};

// Check if device is trusted
userSchema.methods.isTrustedDevice = function(deviceId) {
  if (!this.security || !this.security.trustedDevices) return false;
  return this.security.trustedDevices.some(d => d.deviceId === deviceId);
};

// Get trusted devices
userSchema.methods.getTrustedDevices = function() {
  if (!this.security || !this.security.trustedDevices) return [];
  return this.security.trustedDevices.map(d => ({
    deviceId: d.deviceId,
    deviceName: d.deviceName,
    trustedAt: d.trustedAt,
    lastUsedAt: d.lastUsedAt
  }));
};

// Update trusted device usage
userSchema.methods.updateTrustedDeviceUsage = async function(deviceId) {
  if (!this.security || !this.security.trustedDevices) return this;

  const device = this.security.trustedDevices.find(d => d.deviceId === deviceId);
  if (device) {
    device.lastUsedAt = new Date();
    await this.save();
  }
  return this;
};

// Get login history
userSchema.methods.getLoginHistory = function(limit = 20) {
  if (!this.security || !this.security.loginHistory) return [];
  return this.security.loginHistory.slice(0, limit);
};

// ============================================
// METADATA METHODS
// ============================================

// Set metadata value
userSchema.methods.setMetadata = async function(key, value) {
  if (!this.metadata) {
    this.metadata = {};
  }

  // Support nested keys with dot notation
  const keys = key.split('.');
  let current = this.metadata;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
  this.markModified('metadata');

  await this.save();
  return this;
};

// Get metadata value
userSchema.methods.getMetadata = function(key, defaultValue = null) {
  if (!this.metadata) return defaultValue;

  const keys = key.split('.');
  let current = this.metadata;

  for (const k of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[k];
  }

  return current !== undefined ? current : defaultValue;
};

// Delete metadata key
userSchema.methods.deleteMetadata = async function(key) {
  if (!this.metadata) return this;

  const keys = key.split('.');
  let current = this.metadata;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) return this;
    current = current[keys[i]];
  }

  delete current[keys[keys.length - 1]];
  this.markModified('metadata');

  await this.save();
  return this;
};

// ============================================
// WEBHOOK METHODS
// ============================================

// Add webhook subscription
userSchema.methods.addWebhook = async function(url, events, secret = null) {
  if (!this.webhooks) {
    this.webhooks = [];
  }

  // Check webhook limit
  const limit = this.apiPermissions?.webhookLimit || 10;
  if (this.webhooks.length >= limit) {
    throw new Error(`Webhook limit (${limit}) reached`);
  }

  const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

  this.webhooks.push({
    url,
    events: events || [],
    secret: webhookSecret,
    isActive: true,
    createdAt: new Date(),
    failureCount: 0
  });

  await this.save();
  return webhookSecret; // Return secret only on creation
};

// Remove webhook
userSchema.methods.removeWebhook = async function(webhookIndex) {
  if (!this.webhooks || webhookIndex < 0 || webhookIndex >= this.webhooks.length) {
    throw new Error('Webhook not found');
  }

  this.webhooks.splice(webhookIndex, 1);
  await this.save();
  return this;
};

// Get webhooks (without secrets)
userSchema.methods.getWebhooks = function() {
  if (!this.webhooks) return [];
  return this.webhooks.map((w, index) => ({
    index,
    url: w.url,
    events: w.events,
    isActive: w.isActive,
    createdAt: w.createdAt,
    lastTriggeredAt: w.lastTriggeredAt,
    failureCount: w.failureCount
  }));
};

// Toggle webhook active status
userSchema.methods.toggleWebhook = async function(webhookIndex, isActive) {
  if (!this.webhooks || webhookIndex < 0 || webhookIndex >= this.webhooks.length) {
    throw new Error('Webhook not found');
  }

  this.webhooks[webhookIndex].isActive = isActive;
  await this.save();
  return this;
};

// Record webhook trigger
userSchema.methods.recordWebhookTrigger = async function(webhookIndex, success, failureReason = null) {
  if (!this.webhooks || webhookIndex < 0 || webhookIndex >= this.webhooks.length) {
    return this;
  }

  this.webhooks[webhookIndex].lastTriggeredAt = new Date();

  if (!success) {
    this.webhooks[webhookIndex].failureCount += 1;
    this.webhooks[webhookIndex].lastFailureAt = new Date();
    this.webhooks[webhookIndex].lastFailureReason = failureReason;

    // Disable webhook after 10 consecutive failures
    if (this.webhooks[webhookIndex].failureCount >= 10) {
      this.webhooks[webhookIndex].isActive = false;
    }
  } else {
    // Reset failure count on success
    this.webhooks[webhookIndex].failureCount = 0;
  }

  await this.save();
  return this;
};

// ============================================
// PRIVACY & CONSENT METHODS
// ============================================

// Give GDPR consent
userSchema.methods.giveGdprConsent = async function(version, ipAddress = null) {
  if (!this.privacy) {
    this.privacy = {};
  }

  this.privacy.gdprConsent = {
    given: true,
    givenAt: new Date(),
    version,
    ipAddress,
    withdrawnAt: null
  };

  await this.save();
  return this;
};

// Withdraw GDPR consent
userSchema.methods.withdrawGdprConsent = async function() {
  if (!this.privacy || !this.privacy.gdprConsent) return this;

  this.privacy.gdprConsent.given = false;
  this.privacy.gdprConsent.withdrawnAt = new Date();

  await this.save();
  return this;
};

// Update marketing consent
userSchema.methods.updateMarketingConsent = async function(consents) {
  if (!this.privacy) {
    this.privacy = {};
  }
  if (!this.privacy.marketingConsent) {
    this.privacy.marketingConsent = {};
  }

  if (consents.email !== undefined) {
    this.privacy.marketingConsent.email = consents.email;
  }
  if (consents.sms !== undefined) {
    this.privacy.marketingConsent.sms = consents.sms;
  }
  if (consents.push !== undefined) {
    this.privacy.marketingConsent.push = consents.push;
  }

  this.privacy.marketingConsent.updatedAt = new Date();
  if (!this.privacy.marketingConsent.givenAt) {
    this.privacy.marketingConsent.givenAt = new Date();
  }

  await this.save();
  return this;
};

// Check consent status
userSchema.methods.hasConsent = function(type) {
  if (!this.privacy) return false;

  switch (type) {
    case 'gdpr':
      return this.privacy.gdprConsent?.given === true;
    case 'marketing_email':
      return this.privacy.marketingConsent?.email === true;
    case 'marketing_sms':
      return this.privacy.marketingConsent?.sms === true;
    case 'marketing_push':
      return this.privacy.marketingConsent?.push === true;
    default:
      return false;
  }
};

// Get all consent statuses
userSchema.methods.getConsentStatus = function() {
  return {
    gdpr: {
      given: this.privacy?.gdprConsent?.given || false,
      givenAt: this.privacy?.gdprConsent?.givenAt,
      version: this.privacy?.gdprConsent?.version
    },
    marketing: {
      email: this.privacy?.marketingConsent?.email || false,
      sms: this.privacy?.marketingConsent?.sms || false,
      push: this.privacy?.marketingConsent?.push || false,
      updatedAt: this.privacy?.marketingConsent?.updatedAt
    },
    doNotSell: this.privacy?.doNotSell || false,
    doNotTrack: this.privacy?.doNotTrack || false
  };
};

// Set Do Not Sell (CCPA)
userSchema.methods.setDoNotSell = async function(value) {
  if (!this.privacy) {
    this.privacy = {};
  }
  this.privacy.doNotSell = value;
  await this.save();
  return this;
};

// Set Do Not Track
userSchema.methods.setDoNotTrack = async function(value) {
  if (!this.privacy) {
    this.privacy = {};
  }
  this.privacy.doNotTrack = value;
  await this.save();
  return this;
};

// ============================================
// ACCOUNT DELETION (GDPR) METHODS
// ============================================

// Request account deletion
userSchema.methods.requestAccountDeletion = async function(reason = null) {
  if (!this.privacy) {
    this.privacy = {};
  }

  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + 30); // 30-day grace period

  this.privacy.accountDeletion = {
    requestedAt: new Date(),
    scheduledFor,
    reason,
    cancelledAt: null,
    processedAt: null
  };

  await this.save();
  return scheduledFor;
};

// Cancel account deletion request
userSchema.methods.cancelAccountDeletion = async function() {
  if (!this.privacy || !this.privacy.accountDeletion) {
    throw new Error('No deletion request found');
  }

  if (this.privacy.accountDeletion.processedAt) {
    throw new Error('Deletion already processed');
  }

  this.privacy.accountDeletion.cancelledAt = new Date();
  await this.save();
  return this;
};

// Check if account is pending deletion
userSchema.methods.isPendingDeletion = function() {
  if (!this.privacy || !this.privacy.accountDeletion) return false;

  return (
    this.privacy.accountDeletion.requestedAt &&
    !this.privacy.accountDeletion.cancelledAt &&
    !this.privacy.accountDeletion.processedAt
  );
};

// Get deletion status
userSchema.methods.getDeletionStatus = function() {
  if (!this.privacy || !this.privacy.accountDeletion) {
    return { pending: false };
  }

  const deletion = this.privacy.accountDeletion;

  return {
    pending: this.isPendingDeletion(),
    requestedAt: deletion.requestedAt,
    scheduledFor: deletion.scheduledFor,
    reason: deletion.reason,
    cancelledAt: deletion.cancelledAt,
    processedAt: deletion.processedAt
  };
};

// ============================================
// TERMS & AGREEMENTS METHODS
// ============================================

// Accept an agreement
userSchema.methods.acceptAgreement = async function(type, version, ipAddress = null, userAgent = null) {
  if (!this.agreements) {
    this.agreements = [];
  }

  // Check if this version is already accepted
  const existing = this.agreements.find(
    a => a.type === type && a.version === version
  );

  if (existing) {
    return this; // Already accepted
  }

  this.agreements.push({
    type,
    version,
    acceptedAt: new Date(),
    ipAddress,
    userAgent
  });

  await this.save();
  return this;
};

// Check if agreement is accepted
userSchema.methods.hasAcceptedAgreement = function(type, version = null) {
  if (!this.agreements) return false;

  if (version) {
    return this.agreements.some(a => a.type === type && a.version === version);
  }

  return this.agreements.some(a => a.type === type);
};

// Get latest accepted agreement version
userSchema.methods.getLatestAcceptedAgreement = function(type) {
  if (!this.agreements) return null;

  const matching = this.agreements
    .filter(a => a.type === type)
    .sort((a, b) => new Date(b.acceptedAt) - new Date(a.acceptedAt));

  return matching[0] || null;
};

// Get all accepted agreements
userSchema.methods.getAcceptedAgreements = function() {
  return this.agreements || [];
};

// ============================================
// DATA EXPORT (GDPR) METHOD
// ============================================

// Export all user data for GDPR compliance
userSchema.methods.exportUserData = async function() {
  await this.populateAll();

  return {
    exportedAt: new Date(),
    schemaVersion: this.schemaVersion,

    // Basic info
    personal: {
      id: this._id,
      phoneNumber: this.phoneNumber,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      gender: this.gender,
      birthdate: this.birthdate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    },

    // Profile
    profile: this.profile,

    // Roles and permissions
    access: {
      roles: this.roles,
      isVerified: this.isVerified,
      isActive: this.isActive,
      apiPermissions: this.apiPermissions
    },

    // Connected accounts
    connectedAccounts: {
      oauthProviders: this.getConnectedProviders(),
      externalIds: this.getAllExternalIds()
    },

    // Security settings (non-sensitive)
    security: {
      twoFactorEnabled: this.isTwoFactorEnabled(),
      twoFactorMethod: this.twoFactor?.method,
      trustedDevices: this.getTrustedDevices(),
      activeSessions: this.getActiveSessions().length
    },

    // Privacy preferences
    privacy: this.getConsentStatus(),
    agreements: this.getAcceptedAgreements(),

    // Related documents (if populated)
    referral: this.referral ? {
      referralCode: this.referral.referralCode,
      wasReferred: this.referral.wasReferred?.()
    } : null,

    wallet: this.wallet ? await this.wallet.getBalanceSummary?.() : null,
    trust: this.trust ? await this.trust.getTrustSummary?.() : null,
    activity: this.activity ? this.activity.getSummary?.() : null,
    management: this.management ? this.management.getSummary?.() : null
  };
};

// ============================================
// STATIC METHODS
// ============================================

// Find user by OAuth provider
userSchema.statics.findByOAuthProvider = function(provider, providerId) {
  return this.findOne({
    'oauthProviders.provider': provider,
    'oauthProviders.providerId': providerId
  });
};

// Find user by external ID
userSchema.statics.findByExternalId = function(system, externalId) {
  return this.findOne({
    'externalIds.system': system.toLowerCase(),
    'externalIds.externalId': externalId
  });
};

// Find user by session ID
userSchema.statics.findBySessionId = function(sessionId) {
  return this.findOne({
    'sessions.sessionId': sessionId,
    'sessions.isActive': true
  });
};

// Find user by password reset token
userSchema.statics.findByPasswordResetToken = function(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    'passwordReset.tokenHash': tokenHash,
    'passwordReset.expiresAt': { $gt: new Date() },
    'passwordReset.usedAt': null
  });
};

// Get locked accounts
userSchema.statics.getLockedAccounts = function() {
  return this.find({
    'security.accountLockedUntil': { $gt: new Date() }
  });
};

// Get users with expired passwords
userSchema.statics.getUsersWithExpiredPasswords = function(days = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return this.find({
    $or: [
      { 'security.passwordChangedAt': { $lt: cutoff } },
      { 'security.passwordChangedAt': null, createdAt: { $lt: cutoff } }
    ]
  });
};

// Get users pending deletion
userSchema.statics.getUsersPendingDeletion = function() {
  return this.find({
    'privacy.accountDeletion.requestedAt': { $exists: true },
    'privacy.accountDeletion.cancelledAt': null,
    'privacy.accountDeletion.processedAt': null
  });
};

// Get users scheduled for deletion (past due)
userSchema.statics.getUsersReadyForDeletion = function() {
  return this.find({
    'privacy.accountDeletion.scheduledFor': { $lte: new Date() },
    'privacy.accountDeletion.cancelledAt': null,
    'privacy.accountDeletion.processedAt': null
  });
};

// Get users without GDPR consent
userSchema.statics.getUsersWithoutConsent = function(consentType = 'gdpr') {
  if (consentType === 'gdpr') {
    return this.find({
      $or: [
        { 'privacy.gdprConsent.given': { $ne: true } },
        { 'privacy.gdprConsent': { $exists: false } }
      ]
    });
  }
  return this.find({});
};

// Clean expired sessions for all users (batch job)
userSchema.statics.cleanAllExpiredSessions = async function() {
  const now = new Date();
  const result = await this.updateMany(
    { 'sessions.expiresAt': { $lt: now } },
    { $set: { 'sessions.$[elem].isActive': false } },
    { arrayFilters: [{ 'elem.expiresAt': { $lt: now } }] }
  );
  return result.modifiedCount;
};

// Get users with 2FA enabled
userSchema.statics.getUsersWithTwoFactor = function() {
  return this.find({ 'twoFactor.enabled': true });
};

const User = mongoose.model('User', userSchema);

// Export model and constants
module.exports = User;
module.exports.VALID_ROLES = VALID_ROLES;
module.exports.VALID_OAUTH_PROVIDERS = VALID_OAUTH_PROVIDERS;
module.exports.VALID_2FA_METHODS = VALID_2FA_METHODS;
module.exports.VALID_DEVICE_TYPES = VALID_DEVICE_TYPES;
module.exports.VALID_AUTH_METHODS = VALID_AUTH_METHODS;
module.exports.VALID_DATA_RETENTION_POLICIES = VALID_DATA_RETENTION_POLICIES;
module.exports.VALID_GENDERS = VALID_GENDERS;
module.exports.VALID_REGISTRATION_METHODS = VALID_REGISTRATION_METHODS;
module.exports.MAX_SESSIONS_PER_USER = MAX_SESSIONS_PER_USER;
module.exports.MAX_FAILED_LOGIN_ATTEMPTS = MAX_FAILED_LOGIN_ATTEMPTS;
