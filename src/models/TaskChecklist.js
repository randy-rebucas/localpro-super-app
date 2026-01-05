const mongoose = require('mongoose');

/**
 * TaskChecklist Model
 * 
 * Step-by-step task checklist templates per service type
 * References: ServiceCategory, JobCategory
 */
const taskChecklistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    default: null
  },
  jobCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobCategory',
    default: null
  },
  serviceType: {
    type: String,
    required: true,
    index: true
  },
  tasks: [{
    order: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    isRequired: {
      type: Boolean,
      default: true
    },
    estimatedDuration: Number, // in minutes
    requiresProof: {
      type: Boolean,
      default: false
    },
    proofType: {
      type: String,
      enum: ['photo', 'video', 'both', 'none'],
      default: 'none'
    }
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
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

// Indexes
taskChecklistSchema.index({ serviceType: 1, isActive: 1 });
taskChecklistSchema.index({ category: 1, isActive: 1 });
taskChecklistSchema.index({ jobCategory: 1, isActive: 1 });

// Static method to find checklist by service type
taskChecklistSchema.statics.findByServiceType = function(serviceType) {
  return this.findOne({
    serviceType: serviceType,
    isActive: true,
    isDefault: true
  });
};

// Static method to find checklist by category
taskChecklistSchema.statics.findByCategory = function(categoryId) {
  return this.find({
    $or: [
      { category: categoryId },
      { jobCategory: categoryId }
    ],
    isActive: true
  }).sort({ isDefault: -1, name: 1 });
};

module.exports = mongoose.model('TaskChecklist', taskChecklistSchema);
