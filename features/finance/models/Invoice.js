const mongoose = require('mongoose');

/**
 * Invoice Model
 * 
 * Auto-generated invoices from job data
 * References: Job, Quote, User (provider, client)
 */
const invoiceSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  quote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    default: null
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
  invoiceNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    description: String,
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
    }
  }],
  labor: {
    hourlyRate: Number,
    actualHours: Number,
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
    enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft',
    index: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  paidAt: Date,
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'paypal', 'paymaya', 'paymongo'],
      default: null
    },
    transactionId: String,
    reference: String
  },
  notes: String,
  terms: String,
  sentAt: Date,
  viewedAt: Date,
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
invoiceSchema.index({ job: 1, status: 1 });
invoiceSchema.index({ provider: 1, status: 1 });
invoiceSchema.index({ client: 1, status: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ quote: 1 });

// Method to calculate totals
invoiceSchema.methods.calculateTotals = function() {
  let subtotal = 0;
  
  // Calculate items total
  this.items.forEach(item => {
    item.total = (item.quantity || 1) * (item.unitPrice || 0);
    subtotal += item.total;
  });
  
  // Add labor total
  if (this.labor && this.labor.hourlyRate && this.labor.actualHours) {
    this.labor.total = this.labor.hourlyRate * this.labor.actualHours;
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

// Method to mark as paid
invoiceSchema.methods.markAsPaid = function(paymentMethod, transactionId = null, reference = null) {
  this.status = 'paid';
  this.paidAt = new Date();
  this.payment.method = paymentMethod;
  if (transactionId) {
    this.payment.transactionId = transactionId;
  }
  if (reference) {
    this.payment.reference = reference;
  }
  return this.save();
};

// Static method to generate invoice number
invoiceSchema.statics.generateInvoiceNumber = async function() {
  const prefix = 'INV';
  const year = new Date().getFullYear();
  const count = await this.countDocuments({ invoiceNumber: new RegExp(`^${prefix}${year}`) });
  const sequence = String(count + 1).padStart(6, '0');
  return `${prefix}${year}${sequence}`;
};

// Static method to generate invoice from quote
invoiceSchema.statics.createFromQuote = async function(quote, jobData = {}) {
  const invoiceNumber = await this.generateInvoiceNumber();
  
  const invoice = new this({
    job: quote.job,
    quote: quote._id,
    provider: quote.provider,
    client: quote.client,
    invoiceNumber: invoiceNumber,
    items: quote.items.map(item => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      total: item.total
    })),
    labor: quote.labor ? {
      hourlyRate: quote.labor.hourlyRate,
      actualHours: jobData.actualHours || quote.labor.estimatedHours,
      total: 0
    } : null,
    materials: quote.materials ? quote.materials.map(m => ({
      name: m.name,
      description: m.description,
      quantity: m.quantity,
      unit: m.unit,
      unitPrice: m.unitPrice,
      total: m.total
    })) : [],
    subtotal: quote.subtotal,
    tax: quote.tax,
    discount: quote.discount,
    total: quote.total,
    currency: quote.currency,
    dueDate: jobData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
    notes: quote.notes,
    terms: quote.terms,
    status: 'draft'
  });
  
  await invoice.calculateTotals();
  await invoice.save();
  
  // Update quote status
  quote.status = 'converted';
  await quote.save();
  
  return invoice;
};

// Static method to find invoices by job
invoiceSchema.statics.findByJob = function(jobId) {
  return this.find({ job: jobId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Invoice', invoiceSchema);
