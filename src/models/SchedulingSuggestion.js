const mongoose = require('mongoose');

/**
 * SchedulingSuggestion Model
 * 
 * Stores AI-powered scheduling suggestions (daily/weekly schedules, fill-in jobs)
 * References: User (provider), Job, JobRankingScore
 */
const schedulingSuggestionSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'fill_in', 'idle_time'],
    required: true,
    index: true
  },
  suggestedJobs: [{
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    rankingScore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobRankingScore',
      default: null
    },
    suggestedStartTime: Date,
    suggestedEndTime: Date,
    reason: String,
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  }],
  dateRange: {
    start: {
      type: Date,
      required: true,
      index: true
    },
    end: {
      type: Date,
      required: true,
      index: true
    }
  },
  summary: {
    totalJobs: {
      type: Number,
      default: 0
    },
    estimatedEarnings: Number,
    estimatedHours: Number,
    averageScore: Number
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'partial', 'expired'],
    default: 'pending',
    index: true
  },
  acceptedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  rejectedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  viewedAt: Date,
  expiresAt: {
    type: Date
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
schedulingSuggestionSchema.index({ provider: 1, type: 1, status: 1 });
schedulingSuggestionSchema.index({ provider: 1, 'dateRange.start': 1, 'dateRange.end': 1 });
schedulingSuggestionSchema.index({ status: 1, expiresAt: 1 });
schedulingSuggestionSchema.index({ provider: 1, createdAt: -1 });

// Method to mark as viewed
schedulingSuggestionSchema.methods.markAsViewed = function() {
  this.viewedAt = new Date();
  return this.save();
};

// Method to accept a job from the suggestion
schedulingSuggestionSchema.methods.acceptJob = function(jobId) {
  if (!this.acceptedJobs.includes(jobId)) {
    this.acceptedJobs.push(jobId);
  }
  
  // Remove from rejected if it was there
  this.rejectedJobs = this.rejectedJobs.filter(id => id.toString() !== jobId.toString());
  
  // Update status
  if (this.acceptedJobs.length > 0 && this.rejectedJobs.length === 0 && 
      this.acceptedJobs.length === this.suggestedJobs.length) {
    this.status = 'accepted';
  } else if (this.acceptedJobs.length > 0) {
    this.status = 'partial';
  }
  
  return this.save();
};

// Method to reject a job from the suggestion
schedulingSuggestionSchema.methods.rejectJob = function(jobId) {
  if (!this.rejectedJobs.includes(jobId)) {
    this.rejectedJobs.push(jobId);
  }
  
  // Remove from accepted if it was there
  this.acceptedJobs = this.acceptedJobs.filter(id => id.toString() !== jobId.toString());
  
  // Update status
  if (this.rejectedJobs.length === this.suggestedJobs.length) {
    this.status = 'rejected';
  } else if (this.rejectedJobs.length > 0) {
    this.status = 'partial';
  }
  
  return this.save();
};

// Static method to find active suggestions for a provider
schedulingSuggestionSchema.statics.findActiveSuggestions = function(providerId, type = null) {
  const query = {
    provider: providerId,
    status: { $in: ['pending', 'partial'] },
    expiresAt: { $gt: new Date() }
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to find suggestions by date range
schedulingSuggestionSchema.statics.findByDateRange = function(providerId, startDate, endDate, type = null) {
  const query = {
    provider: providerId,
    'dateRange.start': { $lte: endDate },
    'dateRange.end': { $gte: startDate }
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query).sort({ 'dateRange.start': 1 });
};

// Static method to cleanup expired suggestions
schedulingSuggestionSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { expiresAt: { $lt: new Date() }, status: 'pending' },
    { status: 'expired' }
  );
};

module.exports = mongoose.model('SchedulingSuggestion', schedulingSuggestionSchema);
