const mongoose = require('mongoose');

/**
 * JobProgress Model
 * 
 * Progress tracking for jobs with task completion
 * References: Job, JobSchedule, TaskChecklist, User (provider)
 */
const jobProgressSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  jobSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobSchedule',
    default: null
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  taskChecklist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskChecklist',
    default: null
  },
  tasks: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    order: Number,
    title: String,
    description: String,
    isRequired: Boolean,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending'
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    proofOfWork: [{
      type: {
        type: String,
        enum: ['photo', 'video']
      },
      url: String,
      publicId: String,
      thumbnail: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'paused', 'completed', 'cancelled'],
    default: 'not_started',
    index: true
  },
  startedAt: Date,
  pausedAt: Date,
  completedAt: Date,
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  },
  notes: String
}, {
  timestamps: true
});

// Indexes
jobProgressSchema.index({ job: 1, provider: 1 });
jobProgressSchema.index({ jobSchedule: 1 });
jobProgressSchema.index({ provider: 1, status: 1 });
jobProgressSchema.index({ status: 1, progressPercentage: 1 });

// Method to update progress percentage
jobProgressSchema.methods.updateProgress = function() {
  if (!this.tasks || this.tasks.length === 0) {
    this.progressPercentage = 0;
    return;
  }

  const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
  this.progressPercentage = Math.round((completedTasks / this.tasks.length) * 100);
  
  // Update status based on progress
  if (this.progressPercentage === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (this.progressPercentage > 0 && this.status === 'not_started') {
    this.status = 'in_progress';
    if (!this.startedAt) {
      this.startedAt = new Date();
    }
  }
  
  this.lastUpdatedAt = new Date();
  return this.save();
};

// Method to complete a task
jobProgressSchema.methods.completeTask = function(taskIndex, completedBy, notes = null, proofOfWork = []) {
  if (this.tasks[taskIndex]) {
    this.tasks[taskIndex].status = 'completed';
    this.tasks[taskIndex].completedAt = new Date();
    this.tasks[taskIndex].completedBy = completedBy;
    if (notes) {
      this.tasks[taskIndex].notes = notes;
    }
    if (proofOfWork && proofOfWork.length > 0) {
      this.tasks[taskIndex].proofOfWork = proofOfWork;
    }
    return this.updateProgress();
  }
  throw new Error('Task not found');
};

// Method to start job
jobProgressSchema.methods.start = function() {
  this.status = 'in_progress';
  this.startedAt = new Date();
  if (this.pausedAt) {
    this.pausedAt = null;
  }
  return this.save();
};

// Method to pause job
jobProgressSchema.methods.pause = function() {
  if (this.status === 'in_progress') {
    this.status = 'paused';
    this.pausedAt = new Date();
    return this.save();
  }
  throw new Error('Job is not in progress');
};

// Static method to find progress by job
jobProgressSchema.statics.findByJob = function(jobId, providerId = null) {
  const query = { job: jobId };
  if (providerId) {
    query.provider = providerId;
  }
  return this.findOne(query);
};

module.exports = mongoose.model('JobProgress', jobProgressSchema);
