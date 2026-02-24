const mongoose = require('mongoose');

const userReferralSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
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
}, {
  timestamps: true
});

// Indexes
// Note: user and referralCode already have unique: true which creates indexes
userReferralSchema.index({ referredBy: 1 });
userReferralSchema.index({ 'referralStats.referralTier': 1 });

// Method to generate referral code
userReferralSchema.methods.generateReferralCode = function(userInitials = '') {
  if (!this.referralCode) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Generate 8-character code with user initials if provided
    if (userInitials) {
      result = userInitials.toUpperCase();
      // Add remaining random characters
      for (let i = userInitials.length; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    } else {
      // Generate 8 random characters
      for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    }
    
    this.referralCode = result;
  }
  return this.referralCode;
};

// Method to update referral stats
userReferralSchema.methods.updateReferralStats = function(type, amount = 0) {
  if (type === 'referral_made') {
    this.referralStats.totalReferrals += 1;
    this.referralStats.lastReferralAt = new Date();
  } else if (type === 'referral_completed') {
    this.referralStats.successfulReferrals += 1;
  } else if (type === 'reward_earned') {
    this.referralStats.totalRewardsEarned += amount;
  } else if (type === 'reward_paid') {
    this.referralStats.totalRewardsPaid += amount;
  }
  
  // Update referral tier based on successful referrals
  const successfulReferrals = this.referralStats.successfulReferrals;
  if (successfulReferrals >= 50) {
    this.referralStats.referralTier = 'platinum';
  } else if (successfulReferrals >= 20) {
    this.referralStats.referralTier = 'gold';
  } else if (successfulReferrals >= 5) {
    this.referralStats.referralTier = 'silver';
  } else {
    this.referralStats.referralTier = 'bronze';
  }
  
  return this.save();
};

// Method to get referral link
userReferralSchema.methods.getReferralLink = function(baseUrl = process.env.FRONTEND_URL) {
  if (!this.referralCode) {
    throw new Error('Referral code not generated');
  }
  return `${baseUrl}/signup?ref=${this.referralCode}`;
};

// Method to check if user was referred
userReferralSchema.methods.wasReferred = function() {
  return !!this.referredBy;
};

// Static method to find or create referral for user
userReferralSchema.statics.findOrCreateForUser = async function(userId) {
  let referral = await this.findOne({ user: userId });
  if (!referral) {
    referral = await this.create({ user: userId });
  }
  return referral;
};

module.exports = mongoose.model('UserReferral', userReferralSchema);
