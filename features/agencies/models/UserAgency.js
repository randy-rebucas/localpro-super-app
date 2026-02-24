const mongoose = require('mongoose');

const userAgencySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: false
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
}, {
  timestamps: true
});

// Indexes
// Note: user already has unique: true which creates an index
userAgencySchema.index({ agencyId: 1 });
userAgencySchema.index({ status: 1 });
userAgencySchema.index({ role: 1 });
userAgencySchema.index({ user: 1, agencyId: 1 }); // Compound index for common queries

// Methods
userAgencySchema.methods.updateAgencyInfo = function(agencyData) {
  if (agencyData.agencyId !== undefined) {
    this.agencyId = agencyData.agencyId;
  }
  if (agencyData.role !== undefined) {
    this.role = agencyData.role;
  }
  if (agencyData.status !== undefined) {
    this.status = agencyData.status;
  }
  if (agencyData.commissionRate !== undefined) {
    this.commissionRate = agencyData.commissionRate;
  }
  return this.save();
};

userAgencySchema.methods.setAgency = function(agencyId, role = 'provider', status = 'pending') {
  this.agencyId = agencyId;
  this.role = role;
  this.status = status;
  this.joinedAt = new Date();
  return this.save();
};

userAgencySchema.methods.removeAgency = function() {
  this.agencyId = null;
  this.role = 'provider';
  this.status = 'pending';
  return this.save();
};

userAgencySchema.methods.updateStatus = function(status) {
  if (!['active', 'inactive', 'suspended', 'pending'].includes(status)) {
    throw new Error('Invalid status');
  }
  this.status = status;
  return this.save();
};

userAgencySchema.methods.updateRole = function(role) {
  if (!['owner', 'admin', 'manager', 'supervisor', 'provider'].includes(role)) {
    throw new Error('Invalid role');
  }
  this.role = role;
  return this.save();
};

userAgencySchema.methods.updateCommissionRate = function(rate) {
  if (rate < 0 || rate > 100) {
    throw new Error('Commission rate must be between 0 and 100');
  }
  this.commissionRate = rate;
  return this.save();
};

userAgencySchema.methods.getSummary = function() {
  return {
    agencyId: this.agencyId,
    role: this.role,
    status: this.status,
    joinedAt: this.joinedAt,
    commissionRate: this.commissionRate,
    hasAgency: !!this.agencyId
  };
};

// Static methods
userAgencySchema.statics.findOrCreateForUser = async function(userId) {
  let userAgency = await this.findOne({ user: userId });
  if (!userAgency) {
    userAgency = new this({
      user: userId
    });
    await userAgency.save();
  }
  return userAgency;
};

module.exports = mongoose.model('UserAgency', userAgencySchema);

