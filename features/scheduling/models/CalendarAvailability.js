const mongoose = require('mongoose');

/**
 * CalendarAvailability Model
 * 
 * Manages provider availability blocks (recurring or one-time)
 * References: User (provider), TimeEntry (for conflict detection)
 */
const calendarAvailabilitySchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    trim: true,
    default: 'Available'
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    interval: {
      type: Number,
      default: 1, // Every 1 week, every 2 weeks, etc.
      min: 1
    },
    daysOfWeek: [{
      type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      min: 0,
      max: 6
    }],
    endDate: Date, // When recurrence ends
    occurrenceCount: Number // Or end after N occurrences
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    enum: ['available', 'unavailable', 'busy'],
    default: 'available'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
calendarAvailabilitySchema.index({ provider: 1, startTime: 1, endTime: 1 });
calendarAvailabilitySchema.index({ provider: 1, isAvailable: 1 });
calendarAvailabilitySchema.index({ startTime: 1, endTime: 1 }); // For conflict detection

// Validate that endTime is after startTime
calendarAvailabilitySchema.pre('validate', function(next) {
  if (this.endTime && this.startTime && this.endTime <= this.startTime) {
    this.invalidate('endTime', 'endTime must be after startTime');
  }
  next();
});

// Method to check if availability overlaps with a time range
calendarAvailabilitySchema.methods.overlaps = function(startTime, endTime) {
  return this.startTime < endTime && this.endTime > startTime;
};

// Static method to find availability for a provider in a date range
calendarAvailabilitySchema.statics.findAvailability = function(providerId, startDate, endDate) {
  return this.find({
    provider: providerId,
    startTime: { $lt: endDate },
    endTime: { $gt: startDate }
  }).sort({ startTime: 1 });
};

// Static method to find conflicts with time entries
calendarAvailabilitySchema.statics.findConflicts = async function(providerId, startTime, endTime, excludeId = null) {
  const query = {
    provider: providerId,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
    isAvailable: true
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

module.exports = mongoose.model('CalendarAvailability', calendarAvailabilitySchema);
