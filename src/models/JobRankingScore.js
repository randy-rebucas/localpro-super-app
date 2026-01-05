const mongoose = require('mongoose');

/**
 * JobRankingScore Model
 * 
 * Stores AI-powered ranking scores for jobs per provider
 * References: User (provider), Job, ProviderPerformance, ProviderProfessionalInfo
 */
const jobRankingScoreSchema = new mongoose.Schema({
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
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    index: true
  },
  scoreBreakdown: {
    skillsMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    certificationsMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    locationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    etaScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    earningsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    ratingsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    pastPerformanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  details: {
    matchedSkills: [String],
    matchedCertifications: [String],
    distance: Number, // Distance in km/miles
    estimatedTravelTime: Number, // Estimated travel time in minutes
    estimatedEarnings: Number,
    estimatedEarningsPerHour: Number,
    jobCategoryMatch: Boolean,
    jobTypeMatch: Boolean
  },
  calculatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Expire after 7 days
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    },
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
jobRankingScoreSchema.index({ provider: 1, overallScore: -1 });
jobRankingScoreSchema.index({ provider: 1, isActive: 1, overallScore: -1 });
jobRankingScoreSchema.index({ job: 1, overallScore: -1 });
jobRankingScoreSchema.index({ provider: 1, calculatedAt: -1 });
jobRankingScoreSchema.index({ expiresAt: 1 }); // For cleanup jobs

// Unique index to prevent duplicate rankings
jobRankingScoreSchema.index({ provider: 1, job: 1 }, { unique: true });

// Static method to find top ranked jobs for a provider
jobRankingScoreSchema.statics.findTopJobs = function(providerId, limit = 10, minScore = 0) {
  return this.find({
    provider: providerId,
    isActive: true,
    overallScore: { $gte: minScore },
    expiresAt: { $gt: new Date() }
  })
  .sort({ overallScore: -1 })
  .limit(limit)
  .populate('job');
};

// Static method to find or create ranking for a provider-job pair
jobRankingScoreSchema.statics.findOrCreateRanking = async function(providerId, jobId, scoreData) {
  let ranking = await this.findOne({ provider: providerId, job: jobId });
  
  if (!ranking) {
    ranking = new this({
      provider: providerId,
      job: jobId,
      ...scoreData
    });
    await ranking.save();
  } else {
    // Update existing ranking
    Object.assign(ranking, scoreData);
    ranking.calculatedAt = new Date();
    await ranking.save();
  }
  
  return ranking;
};

// Static method to cleanup expired rankings
jobRankingScoreSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { expiresAt: { $lt: new Date() } },
    { isActive: false }
  );
};

module.exports = mongoose.model('JobRankingScore', jobRankingScoreSchema);
