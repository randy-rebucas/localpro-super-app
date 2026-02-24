const mongoose = require('mongoose');

/**
 * JobProof Model
 * 
 * Photo/video proof of work for jobs
 * References: Job, JobProgress, User (provider)
 */
const jobProofSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  jobProgress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobProgress',
    default: null,
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['photo', 'video'],
    required: true
  },
  media: {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    thumbnail: String,
    mimeType: String,
    size: Number,
    duration: Number, // for videos, in seconds
    width: Number,
    height: Number
  },
  description: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  tags: [String]
}, {
  timestamps: true
});

// Indexes
jobProofSchema.index({ job: 1, provider: 1, timestamp: -1 });
jobProofSchema.index({ jobProgress: 1, timestamp: -1 });
jobProofSchema.index({ provider: 1, timestamp: -1 });
jobProofSchema.index({ verified: 1 });

// Static method to find proofs by job
jobProofSchema.statics.findByJob = function(jobId) {
  return this.find({ job: jobId }).sort({ timestamp: -1 });
};

// Static method to find proofs by job progress
jobProofSchema.statics.findByJobProgress = function(jobProgressId) {
  return this.find({ jobProgress: jobProgressId }).sort({ timestamp: -1 });
};

module.exports = mongoose.model('JobProof', jobProofSchema);
