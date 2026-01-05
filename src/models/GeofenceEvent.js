const mongoose = require('mongoose');

const geofenceEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: ['entered', 'exited'],
    required: true
  },
  location: {
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
    }
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
geofenceEventSchema.index({ userId: 1, timestamp: -1 });
geofenceEventSchema.index({ jobId: 1, timestamp: -1 });
geofenceEventSchema.index({ eventType: 1, timestamp: -1 });
// Geospatial index - using compound index on lat/lng for location queries
// Note: For 2dsphere queries with $near, you need GeoJSON format: { type: "Point", coordinates: [lng, lat] }
// This compound index supports range queries on coordinates
geofenceEventSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Static method to get geofence events for a job
geofenceEventSchema.statics.getEventsByJob = function(jobId) {
  return this.find({
    jobId: jobId
  }).sort({ timestamp: -1 });
};

// Static method to get geofence events for a user
geofenceEventSchema.statics.getEventsByUser = function(userId) {
  return this.find({
    userId: userId
  }).sort({ timestamp: -1 });
};

// Static method to get geofence events for a user and job
geofenceEventSchema.statics.getEventsByUserAndJob = function(userId, jobId) {
  return this.find({
    userId: userId,
    jobId: jobId
  }).sort({ timestamp: -1 });
};

module.exports = mongoose.model('GeofenceEvent', geofenceEventSchema);
