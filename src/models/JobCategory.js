const mongoose = require('mongoose');

const jobCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  metadata: {
    icon: String,
    color: String,
    tags: [String]
  }
}, {
  timestamps: true
});

// Indexes
jobCategorySchema.index({ isActive: 1, displayOrder: 1 });
// Note: name already has unique: true which creates an index

// Static method to get active categories ordered by displayOrder
jobCategorySchema.statics.getActiveCategories = function() {
  return this.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .select('-__v -createdAt -updatedAt');
};

module.exports = mongoose.model('JobCategory', jobCategorySchema);

