const mongoose = require('mongoose');

// ============================================================================
// PRODUCT REVIEW SCHEMA
// ============================================================================

const productReviewSchema = new mongoose.Schema({
  // References
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  // Rating Details
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    shipping: {
      type: Number,
      min: 1,
      max: 5
    }
  },

  // Review Content
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: 200
  }],

  // Media
  images: [{
    url: String,
    publicId: String,
    thumbnail: String,
    caption: String
  }],
  videos: [{
    url: String,
    publicId: String,
    thumbnail: String
  }],

  // Supplier Response
  supplierResponse: {
    comment: {
      type: String,
      maxlength: 1000
    },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Verification & Status
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,

  // Moderation
  isApproved: {
    type: Boolean,
    default: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  moderationNotes: String,

  // Engagement
  helpfulCount: {
    type: Number,
    default: 0
  },
  notHelpfulCount: {
    type: Number,
    default: 0
  },
  helpfulVotes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: String, enum: ['helpful', 'not_helpful'] },
    votedAt: { type: Date, default: Date.now }
  }],
  reportCount: {
    type: Number,
    default: 0
  },
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, enum: ['spam', 'inappropriate', 'offensive', 'fake', 'other'] },
    description: String,
    reportedAt: { type: Date, default: Date.now }
  }],

  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewedAt: Date,

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  schemaVersion: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// ============================================================================
// INDEXES
// ============================================================================

// Core indexes
productReviewSchema.index({ product: 1, createdAt: -1 });
productReviewSchema.index({ user: 1, createdAt: -1 });
productReviewSchema.index({ order: 1 });
productReviewSchema.index({ 'rating.overall': -1 });

// Query optimization indexes
productReviewSchema.index({ product: 1, isApproved: 1, isHidden: 1 });
productReviewSchema.index({ product: 1, isVerified: 1 });
productReviewSchema.index({ product: 1, verifiedPurchase: 1 });
productReviewSchema.index({ isApproved: 1, isFlagged: 1 });
productReviewSchema.index({ isDeleted: 1 });
productReviewSchema.index({ createdAt: -1 });

// Compound indexes for filtering
productReviewSchema.index({ product: 1, 'rating.overall': 1, isApproved: 1 });
productReviewSchema.index({ user: 1, product: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

// Text search index
productReviewSchema.index({
  title: 'text',
  comment: 'text',
  'pros': 'text',
  'cons': 'text'
}, {
  weights: {
    title: 5,
    comment: 3,
    pros: 2,
    cons: 2
  }
});

// ============================================================================
// METHODS
// ============================================================================

// Toggle helpful vote
productReviewSchema.methods.toggleHelpfulVote = async function(userId, voteType) {
  const existingVote = this.helpfulVotes.find(v => v.user.toString() === userId.toString());
  
  if (existingVote) {
    if (existingVote.vote === voteType) {
      // Remove vote
      this.helpfulVotes = this.helpfulVotes.filter(v => v.user.toString() !== userId.toString());
      if (voteType === 'helpful') this.helpfulCount = Math.max(0, this.helpfulCount - 1);
      else this.notHelpfulCount = Math.max(0, this.notHelpfulCount - 1);
    } else {
      // Change vote
      existingVote.vote = voteType;
      existingVote.votedAt = new Date();
      if (voteType === 'helpful') {
        this.helpfulCount++;
        this.notHelpfulCount = Math.max(0, this.notHelpfulCount - 1);
      } else {
        this.notHelpfulCount++;
        this.helpfulCount = Math.max(0, this.helpfulCount - 1);
      }
    }
  } else {
    // Add new vote
    this.helpfulVotes.push({ user: userId, vote: voteType });
    if (voteType === 'helpful') this.helpfulCount++;
    else this.notHelpfulCount++;
  }
  
  await this.save();
};

// Report review
productReviewSchema.methods.addReport = async function(userId, reason, description) {
  const existingReport = this.reports.find(r => r.user.toString() === userId.toString());
  
  if (!existingReport) {
    this.reports.push({ user: userId, reason, description });
    this.reportCount++;
    
    // Auto-flag if too many reports
    if (this.reportCount >= 3) {
      this.isFlagged = true;
    }
    
    await this.save();
  }
};

// ============================================================================
// STATICS
// ============================================================================

// Get product rating summary
productReviewSchema.statics.getProductRatingSummary = async function(productId) {
  const reviews = await this.find({
    product: productId,
    isApproved: true,
    isHidden: false,
    isDeleted: false
  });

  if (reviews.length === 0) {
    return {
      average: 0,
      count: 0,
      breakdown: {
        quality: { average: 0, count: 0 },
        value: { average: 0, count: 0 },
        shipping: { average: 0, count: 0 }
      },
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  // Overall average
  const totalRating = reviews.reduce((sum, r) => sum + r.rating.overall, 0);
  const average = totalRating / reviews.length;

  // Breakdown averages
  const breakdown = {};
  ['quality', 'value', 'shipping'].forEach(aspect => {
    const aspectReviews = reviews.filter(r => r.rating[aspect]);
    if (aspectReviews.length > 0) {
      const aspectTotal = aspectReviews.reduce((sum, r) => sum + r.rating[aspect], 0);
      breakdown[aspect] = {
        average: aspectTotal / aspectReviews.length,
        count: aspectReviews.length
      };
    } else {
      breakdown[aspect] = { average: 0, count: 0 };
    }
  });

  // Distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    const rating = Math.floor(review.rating.overall);
    distribution[rating]++;
  });

  return {
    average,
    count: reviews.length,
    breakdown,
    distribution
  };
};

// Get user's review for product
productReviewSchema.statics.getUserReviewForProduct = async function(userId, productId) {
  return await this.findOne({
    user: userId,
    product: productId,
    isDeleted: false
  });
};

// Check if user can review product
productReviewSchema.statics.canUserReviewProduct = async function(userId, productId) {
  const Order = mongoose.model('Order');
  
  // Check if user has purchased the product
  const order = await Order.findOne({
    customer: userId,
    'items.product': productId,
    'payment.status': 'paid',
    status: { $in: ['delivered', 'completed'] }
  });
  
  if (!order) return { canReview: false, reason: 'no_purchase' };
  
  // Check if user already reviewed
  const existingReview = await this.getUserReviewForProduct(userId, productId);
  if (existingReview) return { canReview: false, reason: 'already_reviewed' };
  
  return { canReview: true, orderId: order._id };
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Update product rating summary after save
productReviewSchema.post('save', async function() {
  if (this.isApproved && !this.isHidden && !this.isDeleted) {
    const Product = mongoose.model('Product');
    const summary = await this.constructor.getProductRatingSummary(this.product);
    await Product.findByIdAndUpdate(this.product, { rating: summary });
  }
});

// Update product rating summary after delete
productReviewSchema.post('remove', async function() {
  const Product = mongoose.model('Product');
  const summary = await this.constructor.getProductRatingSummary(this.product);
  await Product.findByIdAndUpdate(this.product, { rating: summary });
});

module.exports = mongoose.model('ProductReview', productReviewSchema);
