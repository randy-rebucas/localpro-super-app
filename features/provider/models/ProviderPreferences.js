const mongoose = require('mongoose');

const providerPreferencesSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true
  },
  notificationSettings: {
    newJobAlerts: {
      type: Boolean,
      default: true
    },
    messageNotifications: {
      type: Boolean,
      default: true
    },
    paymentNotifications: {
      type: Boolean,
      default: true
    },
    reviewNotifications: {
      type: Boolean,
      default: true
    },
    marketingEmails: {
      type: Boolean,
      default: false
    }
  },
  jobPreferences: {
    preferredJobTypes: [String],
    avoidJobTypes: [String],
    preferredTimeSlots: [String],
    maxJobsPerDay: {
      type: Number,
      default: 5
    },
    advanceBookingDays: {
      type: Number,
      default: 30
    }
  },
  communicationPreferences: {
    preferredContactMethod: {
      type: String,
      enum: ['phone', 'email', 'sms', 'app'],
      default: 'app'
    },
    responseTimeExpectation: {
      type: Number,
      default: 60 // minutes
    },
    autoAcceptJobs: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes
// Note: provider already has unique: true which creates an index

// Methods
providerPreferencesSchema.methods.updateNotificationSettings = function(settings) {
  this.notificationSettings = {
    ...this.notificationSettings,
    ...settings
  };
  return this.save();
};

providerPreferencesSchema.methods.updateJobPreferences = function(preferences) {
  this.jobPreferences = {
    ...this.jobPreferences,
    ...preferences
  };
  return this.save();
};

providerPreferencesSchema.methods.updateCommunicationPreferences = function(preferences) {
  this.communicationPreferences = {
    ...this.communicationPreferences,
    ...preferences
  };
  return this.save();
};

providerPreferencesSchema.methods.addPreferredJobType = function(jobType) {
  if (!this.jobPreferences.preferredJobTypes) {
    this.jobPreferences.preferredJobTypes = [];
  }
  if (!this.jobPreferences.preferredJobTypes.includes(jobType)) {
    this.jobPreferences.preferredJobTypes.push(jobType);
  }
  return this.save();
};

providerPreferencesSchema.methods.removePreferredJobType = function(jobType) {
  if (this.jobPreferences.preferredJobTypes) {
    this.jobPreferences.preferredJobTypes = this.jobPreferences.preferredJobTypes.filter(
      type => type !== jobType
    );
  }
  return this.save();
};

providerPreferencesSchema.methods.addAvoidJobType = function(jobType) {
  if (!this.jobPreferences.avoidJobTypes) {
    this.jobPreferences.avoidJobTypes = [];
  }
  if (!this.jobPreferences.avoidJobTypes.includes(jobType)) {
    this.jobPreferences.avoidJobTypes.push(jobType);
  }
  return this.save();
};

providerPreferencesSchema.methods.removeAvoidJobType = function(jobType) {
  if (this.jobPreferences.avoidJobTypes) {
    this.jobPreferences.avoidJobTypes = this.jobPreferences.avoidJobTypes.filter(
      type => type !== jobType
    );
  }
  return this.save();
};

providerPreferencesSchema.methods.addPreferredTimeSlot = function(timeSlot) {
  if (!this.jobPreferences.preferredTimeSlots) {
    this.jobPreferences.preferredTimeSlots = [];
  }
  if (!this.jobPreferences.preferredTimeSlots.includes(timeSlot)) {
    this.jobPreferences.preferredTimeSlots.push(timeSlot);
  }
  return this.save();
};

providerPreferencesSchema.methods.removePreferredTimeSlot = function(timeSlot) {
  if (this.jobPreferences.preferredTimeSlots) {
    this.jobPreferences.preferredTimeSlots = this.jobPreferences.preferredTimeSlots.filter(
      slot => slot !== timeSlot
    );
  }
  return this.save();
};

providerPreferencesSchema.methods.getSummary = function() {
  return {
    notificationSettings: this.notificationSettings,
    jobPreferences: {
      preferredJobTypes: this.jobPreferences.preferredJobTypes || [],
      avoidJobTypes: this.jobPreferences.avoidJobTypes || [],
      preferredTimeSlots: this.jobPreferences.preferredTimeSlots || [],
      maxJobsPerDay: this.jobPreferences.maxJobsPerDay,
      advanceBookingDays: this.jobPreferences.advanceBookingDays
    },
    communicationPreferences: this.communicationPreferences
  };
};

// Static methods
providerPreferencesSchema.statics.findOrCreateForProvider = async function(providerId) {
  let preferences = await this.findOne({ provider: providerId });
  if (!preferences) {
    preferences = new this({
      provider: providerId
    });
    await preferences.save();
  }
  return preferences;
};

module.exports = mongoose.model('ProviderPreferences', providerPreferencesSchema);

