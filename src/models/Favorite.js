const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  itemType: {
    type: String,
    enum: ['service', 'provider', 'course', 'supply', 'job'],
    required: true,
    index: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  metadata: {
    addedAt: {
      type: Date,
      default: Date.now
    },
    lastViewedAt: {
      type: Date,
      default: Date.now
    },
    viewCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Compound index to ensure one favorite per user per item
favoriteSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });

// Index for efficient queries
favoriteSchema.index({ user: 1, itemType: 1 });
favoriteSchema.index({ createdAt: -1 });
favoriteSchema.index({ 'metadata.lastViewedAt': -1 });

// Note: Virtual population for 'item' is handled in the controller
// since we need to dynamically determine the model based on itemType

// Instance method to update last viewed
favoriteSchema.methods.updateLastViewed = function() {
  this.metadata.lastViewedAt = new Date();
  this.metadata.viewCount += 1;
  return this.save();
};

// Static method to get favorites by type
favoriteSchema.statics.getFavoritesByType = function(userId, itemType, options = {}) {
  const query = {
    user: userId,
    itemType: itemType
  };

  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }

  return this.find(query)
    .populate('itemId')
    .sort(options.sortBy || { createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to check if item is favorited
favoriteSchema.statics.isFavorited = function(userId, itemType, itemId) {
  return this.findOne({
    user: userId,
    itemType: itemType,
    itemId: itemId
  });
};

// Pre-save middleware
favoriteSchema.pre('save', function(next) {
  if (this.isNew) {
    this.metadata.addedAt = new Date();
    this.metadata.lastViewedAt = new Date();
    this.metadata.viewCount = 0;
  }
  next();
});

module.exports = mongoose.model('Favorite', favoriteSchema);

