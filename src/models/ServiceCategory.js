const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    trim: true
  },
  subcategories: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  metadata: {
    color: String,
    tags: [String]
  }
}, {
  timestamps: true
});

// Indexes
serviceCategorySchema.index({ isActive: 1, displayOrder: 1 });
serviceCategorySchema.index({ key: 1 });

// Static method to get active categories ordered by displayOrder
serviceCategorySchema.statics.getActiveCategories = function() {
  return this.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .select('-__v -createdAt -updatedAt');
};

// Static method to get category by key
serviceCategorySchema.statics.getByKey = function(key) {
  return this.findOne({ key: key.toLowerCase(), isActive: true })
    .select('-__v -createdAt -updatedAt');
};

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);

