const mongoose = require('mongoose');

/**
 * JobSchedule Model
 * 
 * Links scheduled jobs to calendar availability blocks
 * References: User (provider), Job, CalendarAvailability, TimeEntry
 */
const jobScheduleSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to Job.applications[]._id
    default: null
  },
  scheduledStartTime: {
    type: Date,
    required: true,
    index: true
  },
  scheduledEndTime: {
    type: Date,
    required: true,
    index: true
  },
  actualStartTime: {
    type: Date,
    default: null
  },
  actualEndTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled',
    index: true
  },
  calendarAvailability: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CalendarAvailability',
    default: null
  },
  timeEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeEntry',
    default: null
  },
  location: {
    address: String,
    city: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  notes: String,
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: Date,
  latenessAlertSent: {
    type: Boolean,
    default: false
  },
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
jobScheduleSchema.index({ provider: 1, scheduledStartTime: 1 });
jobScheduleSchema.index({ job: 1, status: 1 });
jobScheduleSchema.index({ provider: 1, status: 1, scheduledStartTime: 1 });
jobScheduleSchema.index({ scheduledStartTime: 1, scheduledEndTime: 1 });

// Validate that scheduledEndTime is after scheduledStartTime
jobScheduleSchema.pre('validate', function(next) {
  if (this.scheduledEndTime && this.scheduledStartTime && this.scheduledEndTime <= this.scheduledStartTime) {
    this.invalidate('scheduledEndTime', 'scheduledEndTime must be after scheduledStartTime');
  }
  next();
});

// Method to check if schedule is upcoming
jobScheduleSchema.methods.isUpcoming = function() {
  return this.status === 'scheduled' && this.scheduledStartTime > new Date();
};

// Method to check if schedule is active
jobScheduleSchema.methods.isActive = function() {
  return this.status === 'in_progress';
};

// Static method to find schedules for a provider in a date range
jobScheduleSchema.statics.findSchedules = function(providerId, startDate, endDate, status = null) {
  const query = {
    provider: providerId,
    scheduledStartTime: { $gte: startDate },
    scheduledEndTime: { $lte: endDate }
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query).sort({ scheduledStartTime: 1 });
};

// Static method to find upcoming schedules
jobScheduleSchema.statics.findUpcoming = function(providerId, limit = 10) {
  return this.find({
    provider: providerId,
    status: 'scheduled',
    scheduledStartTime: { $gte: new Date() }
  })
  .sort({ scheduledStartTime: 1 })
  .limit(limit);
};

// Static method to find schedules that need reminders
jobScheduleSchema.statics.findRemindersNeeded = function(minutesBefore = 60) {
  const reminderTime = new Date();
  reminderTime.setMinutes(reminderTime.getMinutes() + minutesBefore);
  
  return this.find({
    status: 'scheduled',
    reminderSent: false,
    scheduledStartTime: { $gte: new Date(), $lte: reminderTime }
  });
};

module.exports = mongoose.model('JobSchedule', jobScheduleSchema);
