const mongoose = require('mongoose');

const gpsLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timeEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeEntry',
    default: null,
    index: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  accuracy: {
    type: Number, // GPS accuracy in meters
    default: null
  },
  altitude: {
    type: Number, // Altitude in meters
    default: null
  },
  speed: {
    type: Number, // Speed in km/h
    default: null
  },
  heading: {
    type: Number, // Heading in degrees (0-360)
    min: 0,
    max: 360,
    default: null
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
gpsLogSchema.index({ userId: 1, timestamp: -1 });
gpsLogSchema.index({ timeEntryId: 1, timestamp: 1 });
gpsLogSchema.index({ timestamp: -1 });
// Geospatial index - using compound index on lat/lng for location queries
// Note: For 2dsphere queries with $near, you need GeoJSON format: { type: "Point", coordinates: [lng, lat] }
// This compound index supports range queries on coordinates
gpsLogSchema.index({ latitude: 1, longitude: 1 });

// Pre-validate hook for data validation
gpsLogSchema.pre('validate', function(next) {
  // Validate timestamp is within time entry's time range if timeEntryId is provided
  // This will be checked in application logic as we need to populate timeEntry
  next();
});

// Static method to get GPS logs for a time entry
gpsLogSchema.statics.getLogsByTimeEntry = function(timeEntryId) {
  return this.find({
    timeEntryId: timeEntryId
  }).sort({ timestamp: 1 });
};

// Static method to get GPS logs for a user in time range
gpsLogSchema.statics.getLogsByTimeRange = function(userId, startDate, endDate) {
  return this.find({
    userId: userId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ timestamp: 1 });
};

// Static method to batch create GPS logs
gpsLogSchema.statics.batchCreate = function(logs) {
  return this.insertMany(logs);
};

module.exports = mongoose.model('GPSLog', gpsLogSchema);
