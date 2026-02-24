const mongoose = require('mongoose');

/**
 * JobIssue Model
 * 
 * Issue & escalation reporting for jobs
 * References: Job, JobProgress, User (provider, client, admin)
 */
const jobIssueSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  jobProgress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobProgress',
    default: null
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['quality', 'safety', 'delay', 'communication', 'material', 'equipment', 'other'],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'escalated', 'closed'],
    default: 'reported',
    index: true
  },
  attachments: [{
    filename: String,
    url: String,
    publicId: String,
    mimeType: String,
    size: Number
  }],
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  escalation: {
    isEscalated: {
      type: Boolean,
      default: false
    },
    escalatedAt: Date,
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    escalationReason: String,
    level: {
      type: Number,
      default: 0
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolution: {
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolutionNotes: String,
    actionTaken: String
  },
  reportedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
jobIssueSchema.index({ job: 1, status: 1 });
jobIssueSchema.index({ reportedBy: 1, status: 1 });
jobIssueSchema.index({ assignedTo: 1, status: 1 });
jobIssueSchema.index({ severity: 1, status: 1 });
jobIssueSchema.index({ 'escalation.isEscalated': 1, status: 1 });

// Method to escalate issue
jobIssueSchema.methods.escalate = function(escalatedTo, reason) {
  this.escalation.isEscalated = true;
  this.escalation.escalatedAt = new Date();
  this.escalation.escalatedTo = escalatedTo;
  this.escalation.escalationReason = reason;
  this.escalation.level += 1;
  this.status = 'escalated';
  this.assignedTo = escalatedTo;
  this.updatedAt = new Date();
  return this.save();
};

// Method to resolve issue
jobIssueSchema.methods.resolve = function(resolvedBy, resolutionNotes, actionTaken) {
  this.status = 'resolved';
  this.resolution.resolvedAt = new Date();
  this.resolution.resolvedBy = resolvedBy;
  this.resolution.resolutionNotes = resolutionNotes;
  this.resolution.actionTaken = actionTaken;
  this.updatedAt = new Date();
  return this.save();
};

// Static method to find issues by job
jobIssueSchema.statics.findByJob = function(jobId, status = null) {
  const query = { job: jobId };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ reportedAt: -1 });
};

// Static method to find escalated issues
jobIssueSchema.statics.findEscalated = function() {
  return this.find({
    'escalation.isEscalated': true,
    status: { $in: ['escalated', 'in_progress'] }
  }).sort({ 'escalation.escalatedAt': -1 });
};

module.exports = mongoose.model('JobIssue', jobIssueSchema);
