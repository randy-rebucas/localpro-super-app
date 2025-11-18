const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
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
}, {
  timestamps: true
});

// Indexes
// Note: user already has unique: true which creates an index
userActivitySchema.index({ lastActiveAt: -1 });

// Method to update activity on login
userActivitySchema.methods.updateActivity = function(userAgent) {
  this.lastActiveAt = new Date();
  this.totalSessions += 1;
  
  // Update device info
  const deviceType = this.getDeviceType(userAgent);
  const existingDevice = this.deviceInfo.find(device => 
    device.deviceType === deviceType && device.userAgent === userAgent
  );
  
  if (existingDevice) {
    existingDevice.lastUsed = new Date();
  } else {
    this.deviceInfo.push({
      deviceType,
      userAgent,
      lastUsed: new Date()
    });
  }
  
  return this.save();
};

// Method to get device type from user agent
userActivitySchema.methods.getDeviceType = function(userAgent) {
  if (!userAgent) return 'unknown';
  
  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    return 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

// Method to get activity summary
userActivitySchema.methods.getSummary = function() {
  return {
    lastActiveAt: this.lastActiveAt,
    totalSessions: this.totalSessions,
    averageSessionDuration: this.averageSessionDuration,
    deviceCount: this.deviceInfo.length,
    preferredLoginTime: this.preferredLoginTime
  };
};

// Static method to find or create activity for user
userActivitySchema.statics.findOrCreateForUser = async function(userId) {
  let activity = await this.findOne({ user: userId });
  if (!activity) {
    activity = await this.create({ user: userId });
  }
  return activity;
};

module.exports = mongoose.model('UserActivity', userActivitySchema);
