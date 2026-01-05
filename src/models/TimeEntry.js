const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  clockInTime: {
    type: Date,
    required: true
  },
  clockOutTime: {
    type: Date,
    default: null
  },
  breakStartTime: {
    type: Date,
    default: null
  },
  breakEndTime: {
    type: Date,
    default: null
  },
  totalWorkTime: {
    type: Number, // Total work time in seconds
    default: null
  },
  source: {
    type: String,
    enum: ['mobile', 'admin'],
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  location: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    accuracy: {
      type: Number, // GPS accuracy in meters
      default: null
    }
  },
  manualEdit: {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reason: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
timeEntrySchema.index({ userId: 1, clockInTime: -1 });
timeEntrySchema.index({ userId: 1, clockOutTime: 1 }); // For active entries (queries with clockOutTime: null)
timeEntrySchema.index({ jobId: 1 });
timeEntrySchema.index({ createdAt: -1 });
// Geospatial index - using compound index on lat/lng for location queries
// Note: For 2dsphere queries with $near, you need GeoJSON format: { type: "Point", coordinates: [lng, lat] }
// This compound index supports range queries on coordinates
timeEntrySchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Pre-validate hook for data validation
timeEntrySchema.pre('validate', function(next) {
  // Validate clockOutTime is after clockInTime if provided
  if (this.clockOutTime && this.clockInTime && this.clockOutTime <= this.clockInTime) {
    this.invalidate('clockOutTime', 'clockOutTime must be after clockInTime');
  }
  
  // Validate breakStartTime is after clockInTime if provided
  if (this.breakStartTime && this.clockInTime && this.breakStartTime < this.clockInTime) {
    this.invalidate('breakStartTime', 'breakStartTime must be after clockInTime');
  }
  
  // Validate breakEndTime is after breakStartTime if provided
  if (this.breakEndTime && this.breakStartTime && this.breakEndTime <= this.breakStartTime) {
    this.invalidate('breakEndTime', 'breakEndTime must be after breakStartTime');
  }
  
  // Calculate totalWorkTime if clockOutTime is provided
  if (this.clockOutTime && this.clockInTime) {
    const workDuration = (this.clockOutTime - this.clockInTime) / 1000; // Convert to seconds
    const breakDuration = (this.breakStartTime && this.breakEndTime) 
      ? (this.breakEndTime - this.breakStartTime) / 1000 
      : 0;
    this.totalWorkTime = Math.max(0, workDuration - breakDuration);
  }
  
  next();
});

// Method to check if time entry is active
timeEntrySchema.methods.isActive = function() {
  return this.clockOutTime === null;
};

// Method to get active time entry for a user
timeEntrySchema.statics.getActiveEntry = function(userId) {
  return this.findOne({
    userId: userId,
    clockOutTime: null
  });
};

// Method to check if user has active entry
timeEntrySchema.statics.hasActiveEntry = async function(userId) {
  const activeEntry = await this.getActiveEntry(userId);
  return activeEntry !== null;
};

// Static method to get time entries for user in date range
timeEntrySchema.statics.getEntriesByDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId: userId,
    clockInTime: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ clockInTime: -1 });
};

// Static method to get time entries for a job
timeEntrySchema.statics.getEntriesByJob = function(jobId) {
  return this.find({
    jobId: jobId
  }).sort({ clockInTime: -1 });
};

// Static method to get pending manual edit requests
timeEntrySchema.statics.getPendingEdits = function() {
  return this.find({
    'manualEdit.status': 'pending'
  });
};

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
