const mongoose = require('mongoose');

/**
 * RescheduleRequest Model
 * 
 * Handles reschedule requests and approvals for scheduled jobs
 * References: User (provider/employer), JobSchedule, Job
 */
const rescheduleRequestSchema = new mongoose.Schema({
  jobSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobSchedule',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  requestedFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Provider or employer
    required: true,
    index: true
  },
  originalStartTime: {
    type: Date,
    required: true
  },
  originalEndTime: {
    type: Date,
    required: true
  },
  requestedStartTime: {
    type: Date,
    required: true
  },
  requestedEndTime: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: Date,
  rejectionReason: String,
  comments: String,
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
rescheduleRequestSchema.index({ jobSchedule: 1, status: 1 });
rescheduleRequestSchema.index({ requestedBy: 1, status: 1 });
rescheduleRequestSchema.index({ requestedFor: 1, status: 1 });
rescheduleRequestSchema.index({ status: 1, createdAt: -1 });

// Validate that requestedEndTime is after requestedStartTime
rescheduleRequestSchema.pre('validate', function(next) {
  if (this.requestedEndTime && this.requestedStartTime && this.requestedEndTime <= this.requestedStartTime) {
    this.invalidate('requestedEndTime', 'requestedEndTime must be after requestedStartTime');
  }
  next();
});

// Method to approve reschedule request
rescheduleRequestSchema.methods.approve = function(approvedBy, comments = null) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  if (comments) {
    this.comments = comments;
  }
  return this.save();
};

// Method to reject reschedule request
rescheduleRequestSchema.methods.reject = function(rejectionReason = null) {
  this.status = 'rejected';
  if (rejectionReason) {
    this.rejectionReason = rejectionReason;
  }
  return this.save();
};

// Static method to find pending requests for a user
rescheduleRequestSchema.statics.findPendingRequests = function(userId) {
  return this.find({
    requestedFor: userId,
    status: 'pending'
  }).sort({ createdAt: -1 });
};

// Static method to find requests by status
rescheduleRequestSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('RescheduleRequest', rescheduleRequestSchema);
