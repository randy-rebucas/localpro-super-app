const mongoose = require('mongoose');

const providerPerformanceSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  totalJobs: {
    type: Number,
    default: 0,
    min: 0
  },
  completedJobs: {
    type: Number,
    default: 0,
    min: 0
  },
  cancelledJobs: {
    type: Number,
    default: 0,
    min: 0
  },
  responseTime: {
    type: Number,
    default: 0, // average response time in minutes
    min: 0
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  repeatCustomerRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  earnings: {
    total: {
      type: Number,
      default: 0,
      min: 0
    },
    thisMonth: {
      type: Number,
      default: 0,
      min: 0
    },
    lastMonth: {
      type: Number,
      default: 0,
      min: 0
    },
    pending: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  badges: [{
    name: String,
    description: String,
    earnedDate: {
      type: Date,
      default: Date.now
    },
    category: String
  }]
}, {
  timestamps: true
});

// Indexes
// Note: provider already has unique: true which creates an index
providerPerformanceSchema.index({ rating: -1 });
providerPerformanceSchema.index({ totalJobs: -1 });
providerPerformanceSchema.index({ 'earnings.total': -1 });

// Methods
providerPerformanceSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating * this.totalReviews) + newRating;
  this.totalReviews += 1;
  this.rating = totalRating / this.totalReviews;
  return this.save();
};

providerPerformanceSchema.methods.addJob = function(status) {
  this.totalJobs += 1;
  if (status === 'completed') {
    this.completedJobs += 1;
  } else if (status === 'cancelled') {
    this.cancelledJobs += 1;
  }
  // Recalculate completion rate
  if (this.totalJobs > 0) {
    this.completionRate = (this.completedJobs / this.totalJobs) * 100;
  }
  return this.save();
};

providerPerformanceSchema.methods.updateEarnings = function(amount) {
  this.earnings.total += amount;
  this.earnings.thisMonth += amount;
  return this.save();
};

providerPerformanceSchema.methods.addEarning = function(amount, period = 'thisMonth') {
  this.earnings.total += amount;
  if (period === 'thisMonth') {
    this.earnings.thisMonth += amount;
  } else if (period === 'lastMonth') {
    this.earnings.lastMonth += amount;
  } else if (period === 'pending') {
    this.earnings.pending += amount;
  }
  return this.save();
};

providerPerformanceSchema.methods.updateResponseTime = function(responseTimeInMinutes) {
  // Calculate average response time
  if (this.totalJobs === 0) {
    this.responseTime = responseTimeInMinutes;
  } else {
    this.responseTime = ((this.responseTime * (this.totalJobs - 1)) + responseTimeInMinutes) / this.totalJobs;
  }
  return this.save();
};

providerPerformanceSchema.methods.updateRepeatCustomerRate = function(repeatCustomers, totalCustomers) {
  if (totalCustomers > 0) {
    this.repeatCustomerRate = (repeatCustomers / totalCustomers) * 100;
  }
  return this.save();
};

providerPerformanceSchema.methods.addBadge = function(badgeData) {
  if (!this.badges) {
    this.badges = [];
  }
  // Check if badge already exists
  const existingBadge = this.badges.find(b => b.name === badgeData.name);
  if (!existingBadge) {
    this.badges.push({
      ...badgeData,
      earnedDate: badgeData.earnedDate || new Date()
    });
  }
  return this.save();
};

providerPerformanceSchema.methods.removeBadge = function(badgeName) {
  if (this.badges) {
    this.badges = this.badges.filter(badge => badge.name !== badgeName);
  }
  return this.save();
};

providerPerformanceSchema.methods.hasBadge = function(badgeName) {
  return this.badges ? this.badges.some(badge => badge.name === badgeName) : false;
};

providerPerformanceSchema.methods.resetMonthlyEarnings = function() {
  this.earnings.lastMonth = this.earnings.thisMonth;
  this.earnings.thisMonth = 0;
  return this.save();
};

providerPerformanceSchema.methods.getSummary = function() {
  return {
    rating: this.rating,
    totalReviews: this.totalReviews,
    totalJobs: this.totalJobs,
    completedJobs: this.completedJobs,
    cancelledJobs: this.cancelledJobs,
    responseTime: this.responseTime,
    completionRate: this.completionRate,
    repeatCustomerRate: this.repeatCustomerRate,
    earnings: {
      total: this.earnings.total,
      thisMonth: this.earnings.thisMonth,
      lastMonth: this.earnings.lastMonth,
      pending: this.earnings.pending
    },
    badges: this.badges || []
  };
};

// Static methods
providerPerformanceSchema.statics.findOrCreateForProvider = async function(providerId) {
  let performance = await this.findOne({ provider: providerId });
  if (!performance) {
    performance = new this({
      provider: providerId
    });
    await performance.save();
  }
  return performance;
};

module.exports = mongoose.model('ProviderPerformance', providerPerformanceSchema);

