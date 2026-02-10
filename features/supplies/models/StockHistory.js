const mongoose = require('mongoose');

// ============================================================================
// STOCK HISTORY SCHEMA
// ============================================================================

const stockHistorySchema = new mongoose.Schema({
  // References
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Stock Change Details
  quantityBefore: {
    type: Number,
    required: true
  },
  quantityChange: {
    type: Number,
    required: true
  },
  quantityAfter: {
    type: Number,
    required: true
  },

  // Change Reason
  reason: {
    type: String,
    enum: ['purchase', 'sale', 'return', 'adjustment', 'damaged', 'restock', 'transfer', 'theft', 'expired', 'promotion', 'correction'],
    required: true,
    index: true
  },
  reasonDetails: String,

  // Transaction Reference
  reference: {
    type: String,
    index: true
  },
  referenceType: {
    type: String,
    enum: ['order', 'return', 'transfer', 'adjustment', 'other']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },

  // Location Details
  warehouse: String,
  location: String,
  fromWarehouse: String,
  toWarehouse: String,

  // Financial Impact
  costImpact: Number,
  valueImpact: Number,
  currency: {
    type: String,
    default: 'USD'
  },

  // Tracking
  notes: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,

  // Audit Trail
  ipAddress: String,
  userAgent: String,

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

stockHistorySchema.index({ product: 1, createdAt: -1 });
stockHistorySchema.index({ supplier: 1, createdAt: -1 });
stockHistorySchema.index({ reason: 1, createdAt: -1 });
stockHistorySchema.index({ updatedBy: 1, createdAt: -1 });
stockHistorySchema.index({ reference: 1 });
stockHistorySchema.index({ referenceId: 1 });
stockHistorySchema.index({ createdAt: -1 });
stockHistorySchema.index({ product: 1, reason: 1, createdAt: -1 });

// ============================================================================
// STATICS
// ============================================================================

// Get stock history for product
stockHistorySchema.statics.getProductHistory = async function(productId, options = {}) {
  const {
    startDate,
    endDate,
    reason,
    limit = 50,
    skip = 0
  } = options;

  const query = { product: productId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  if (reason) query.reason = reason;

  return await this.find(query)
    .populate('updatedBy', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Get stock changes summary
stockHistorySchema.statics.getStockSummary = async function(productId, startDate, endDate) {
  const match = { product: mongoose.Types.ObjectId(productId) };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const summary = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$reason',
        totalChange: { $sum: '$quantityChange' },
        count: { $sum: 1 },
        totalValue: { $sum: '$valueImpact' }
      }
    },
    { $sort: { totalChange: -1 } }
  ]);

  return summary;
};

// Create stock history entry
stockHistorySchema.statics.createEntry = async function(data) {
  const entry = new this(data);
  await entry.save();
  return entry;
};

module.exports = mongoose.model('StockHistory', stockHistorySchema);
