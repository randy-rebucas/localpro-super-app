const mongoose = require('mongoose');
const UserReferral = require('./UserReferral');
const UserActivity = require('./UserActivity');
const UserWallet = require('./UserWallet');
const UserTrust = require('./UserTrust');
const UserManagement = require('./UserManagement');
const UserAgency = require('./UserAgency');
const Provider = require('./Provider');

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
    enum: ['client', 'provider', 'admin', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'partner'],
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
  // Agency relationship (for agency_owner and agency_admin roles)
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAgency'
  }
}, {
  timestamps: true
});

// Index for better performance (phoneNumber and email already have unique indexes)
userSchema.index({ roles: 1 }); // Multi-role index
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
  const validRoles = ['client', 'provider', 'admin', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'partner'];
  if (validRoles.includes(role) && !this.roles.includes(role)) {
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
  const validRoles = ['client', 'provider', 'admin', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'partner'];
  this.roles = roles.filter(role => validRoles.includes(role));
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

module.exports = mongoose.model('User', userSchema);
