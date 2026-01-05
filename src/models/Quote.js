const mongoose = require('mongoose');

/**
 * Quote Model
 * 
 * Quotes/Estimates for jobs with client approval workflow
 * References: Job, QuoteTemplate, User (provider, client)
 */
const quoteSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  quoteNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuoteTemplate',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  items: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    type: {
      type: String,
      enum: ['labor', 'material', 'equipment', 'service', 'other'],
      default: 'service'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0
    },
    unit: {
      type: String,
      default: 'each'
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      default: 0
    },
    isOptional: {
      type: Boolean,
      default: false
    }
  }],
  labor: {
    hourlyRate: Number,
    estimatedHours: Number,
    total: Number
  },
  materials: [{
    name: String,
    description: String,
    quantity: Number,
    unit: String,
    unitPrice: Number,
    total: Number
  }],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    rate: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    },
    value: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'converted'],
    default: 'draft',
    index: true
  },
  validityDays: {
    type: Number,
    default: 30
  },
  expiresAt: {
    type: Date
  },
  approval: {
    approved: {
      type: Boolean,
      default: false
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: String,
    rejectedAt: Date,
    digitalSignature: {
      signature: String,
      signedAt: Date,
      ipAddress: String,
      userAgent: String
    }
  },
  notes: String,
  terms: String,
  viewedAt: Date,
  sentAt: Date,
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
quoteSchema.index({ job: 1, status: 1 });
quoteSchema.index({ provider: 1, status: 1 });
quoteSchema.index({ client: 1, status: 1 });
quoteSchema.index({ status: 1, expiresAt: 1 });

// Pre-save hook to set expiresAt
quoteSchema.pre('save', function(next) {
  if (!this.expiresAt && this.validityDays) {
    this.expiresAt = new Date();
    this.expiresAt.setDate(this.expiresAt.getDate() + this.validityDays);
  }
  next();
});

// Method to calculate totals
quoteSchema.methods.calculateTotals = function() {
  let subtotal = 0;
  
  // Calculate items total
  this.items.forEach(item => {
    item.total = (item.quantity || 1) * (item.unitPrice || 0);
    subtotal += item.total;
  });
  
  // Add labor total
  if (this.labor && this.labor.hourlyRate && this.labor.estimatedHours) {
    this.labor.total = this.labor.hourlyRate * this.labor.estimatedHours;
    subtotal += this.labor.total;
  }
  
  // Add materials total
  if (this.materials && this.materials.length > 0) {
    this.materials.forEach(material => {
      material.total = (material.quantity || 1) * (material.unitPrice || 0);
      subtotal += material.total;
    });
  }
  
  this.subtotal = subtotal;
  
  // Calculate tax
  if (this.tax && this.tax.rate) {
    this.tax.amount = (this.subtotal * this.tax.rate) / 100;
  }
  
  // Calculate discount
  if (this.discount && this.discount.value > 0) {
    if (this.discount.type === 'percentage') {
      this.discount.amount = (this.subtotal * this.discount.value) / 100;
    } else {
      this.discount.amount = this.discount.value;
    }
  }
  
  // Calculate total
  this.total = this.subtotal + (this.tax?.amount || 0) - (this.discount?.amount || 0);
  
  return this.save();
};

// Method to approve quote
quoteSchema.methods.approve = function(approvedBy, digitalSignature = null, ipAddress = null, userAgent = null) {
  this.status = 'approved';
  this.approval.approved = true;
  this.approval.approvedAt = new Date();
  this.approval.approvedBy = approvedBy;
  if (digitalSignature) {
    this.approval.digitalSignature = {
      signature: digitalSignature,
      signedAt: new Date(),
      ipAddress: ipAddress,
      userAgent: userAgent
    };
  }
  return this.save();
};

// Method to reject quote
quoteSchema.methods.reject = function(rejectionReason) {
  this.status = 'rejected';
  this.approval.approved = false;
  this.approval.rejectionReason = rejectionReason;
  this.approval.rejectedAt = new Date();
  return this.save();
};

// Static method to generate quote number
quoteSchema.statics.generateQuoteNumber = async function() {
  const prefix = 'QT';
  const year = new Date().getFullYear();
  const count = await this.countDocuments({ quoteNumber: new RegExp(`^${prefix}${year}`) });
  const sequence = String(count + 1).padStart(6, '0');
  return `${prefix}${year}${sequence}`;
};

// Static method to find quotes by job
quoteSchema.statics.findByJob = function(jobId) {
  return this.find({ job: jobId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Quote', quoteSchema);
