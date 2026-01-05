const mongoose = require('mongoose');

/**
 * QuoteTemplate Model
 * 
 * Quick quote builder templates
 * References: ServiceCategory, JobCategory, User (provider)
 */
const quoteTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
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
    index: true
  },
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
    default: 0
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
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  notes: String,
  terms: String,
  validityDays: {
    type: Number,
    default: 30
  },
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
quoteTemplateSchema.index({ provider: 1, isActive: 1 });
quoteTemplateSchema.index({ serviceType: 1, isActive: 1 });
quoteTemplateSchema.index({ category: 1, isActive: 1 });
quoteTemplateSchema.index({ jobCategory: 1, isActive: 1 });

// Method to calculate totals
quoteTemplateSchema.methods.calculateTotals = function() {
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

// Static method to find templates by provider
quoteTemplateSchema.statics.findByProvider = function(providerId) {
  return this.find({
    provider: providerId,
    isActive: true
  }).sort({ isDefault: -1, name: 1 });
};

// Static method to find templates by service type
quoteTemplateSchema.statics.findByServiceType = function(serviceType) {
  return this.find({
    serviceType: serviceType,
    isActive: true,
    $or: [
      { provider: null },
      { isDefault: true }
    ]
  }).sort({ isDefault: -1, name: 1 });
};

module.exports = mongoose.model('QuoteTemplate', quoteTemplateSchema);
