const mongoose = require('mongoose');

const userTrustSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
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
      enum: ['verified_provider', 'top_rated', 'fast_response', 'reliable', 'expert', 'newcomer', 'trusted']
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
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
  // Last calculated timestamp
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
// Note: user already has unique: true which creates an index
userTrustSchema.index({ trustScore: -1 });
userTrustSchema.index({ 'verification.phoneVerified': 1, 'verification.emailVerified': 1 });
userTrustSchema.index({ completionRate: -1 });

// Method to calculate trust score
userTrustSchema.methods.calculateTrustScore = function() {
  let score = 0;
  
  // Base verification points
  if (this.verification.phoneVerified) score += 10;
  if (this.verification.emailVerified) score += 10;
  if (this.verification.identityVerified) score += 20;
  if (this.verification.businessVerified) score += 15;
  if (this.verification.addressVerified) score += 10;
  if (this.verification.bankAccountVerified) score += 15;
  
  // Completion rate bonus (up to 10 points)
  score += Math.round(this.completionRate / 10);
  
  // Badge bonus (up to 10 points)
  score += Math.min(10, this.badges.length * 2);
  
  this.trustScore = Math.min(100, score);
  this.lastCalculated = new Date();
  return this.trustScore;
};

// Method to add badge
userTrustSchema.methods.addBadge = function(badgeType, description) {
  const existingBadge = this.badges.find(badge => badge.type === badgeType);
  if (!existingBadge) {
    this.badges.push({
      type: badgeType,
      earnedAt: new Date(),
      description: description || ''
    });
    // Recalculate trust score when badge is added
    this.calculateTrustScore();
  }
  return this;
};

// Method to remove badge
userTrustSchema.methods.removeBadge = function(badgeType) {
  this.badges = this.badges.filter(badge => badge.type !== badgeType);
  // Recalculate trust score when badge is removed
  this.calculateTrustScore();
  return this;
};

// Method to check if user has badge
userTrustSchema.methods.hasBadge = function(badgeType) {
  return this.badges.some(badge => badge.type === badgeType);
};

// Method to update response time
userTrustSchema.methods.updateResponseTime = function(responseTimeMinutes) {
  if (!this.responseTime || !this.responseTime.average || !this.responseTime.totalResponses) {
    this.responseTime = {
      average: responseTimeMinutes,
      totalResponses: 1
    };
  } else {
    const totalTime = this.responseTime.average * this.responseTime.totalResponses;
    this.responseTime.totalResponses += 1;
    this.responseTime.average = (totalTime + responseTimeMinutes) / this.responseTime.totalResponses;
  }
  return this;
};

// Method to update completion rate
userTrustSchema.methods.updateCompletionRate = function(completed, total) {
  if (total > 0) {
    this.completionRate = Math.round((completed / total) * 100);
    // Recalculate trust score when completion rate changes
    this.calculateTrustScore();
  }
  return this;
};

// Method to update cancellation rate
userTrustSchema.methods.updateCancellationRate = function(cancelled, total) {
  if (total > 0) {
    this.cancellationRate = Math.round((cancelled / total) * 100);
  }
  return this;
};

// Method to verify a verification type
userTrustSchema.methods.verify = function(verificationType) {
  const validTypes = ['phone', 'email', 'identity', 'business', 'address', 'bankAccount'];
  if (!validTypes.includes(verificationType)) {
    throw new Error(`Invalid verification type: ${verificationType}`);
  }
  
  const fieldName = `${verificationType}Verified`;
  if (this.verification[fieldName] !== undefined) {
    this.verification[fieldName] = true;
    if (!this.verification.verifiedAt) {
      this.verification.verifiedAt = new Date();
    }
    // Recalculate trust score when verification is updated
    this.calculateTrustScore();
  }
  return this;
};

// Method to unverify a verification type
userTrustSchema.methods.unverify = function(verificationType) {
  const validTypes = ['phone', 'email', 'identity', 'business', 'address', 'bankAccount'];
  if (!validTypes.includes(verificationType)) {
    throw new Error(`Invalid verification type: ${verificationType}`);
  }
  
  const fieldName = `${verificationType}Verified`;
  if (this.verification[fieldName] !== undefined) {
    this.verification[fieldName] = false;
    // Recalculate trust score when verification is removed
    this.calculateTrustScore();
  }
  return this;
};

// Method to get verification summary
userTrustSchema.methods.getVerificationSummary = function() {
  const verifications = {
    phone: this.verification.phoneVerified,
    email: this.verification.emailVerified,
    identity: this.verification.identityVerified,
    business: this.verification.businessVerified,
    address: this.verification.addressVerified,
    bankAccount: this.verification.bankAccountVerified
  };
  
  const verifiedCount = Object.values(verifications).filter(v => v === true).length;
  const totalCount = Object.keys(verifications).length;
  
  return {
    verifications,
    verifiedCount,
    totalCount,
    percentage: Math.round((verifiedCount / totalCount) * 100),
    verifiedAt: this.verification.verifiedAt
  };
};

// Method to get trust summary
userTrustSchema.methods.getTrustSummary = function() {
  return {
    trustScore: this.trustScore,
    verification: this.getVerificationSummary(),
    badges: this.badges,
    responseTime: this.responseTime,
    completionRate: this.completionRate,
    cancellationRate: this.cancellationRate,
    lastCalculated: this.lastCalculated
  };
};

// Static method to find or create trust document for user
userTrustSchema.statics.findOrCreateForUser = async function(userId) {
  let trust = await this.findOne({ user: userId });
  
  if (!trust) {
    trust = await this.create({ user: userId });
    // Calculate initial trust score
    trust.calculateTrustScore();
    await trust.save();
  }
  
  return trust;
};

module.exports = mongoose.model('UserTrust', userTrustSchema);

