const mongoose = require('mongoose');

// ============================================================================
// CONSTANTS
// ============================================================================

const PRODUCT_CATEGORIES = ['cleaning_supplies', 'tools', 'materials', 'equipment', 'safety', 'hardware', 'electrical', 'plumbing', 'painting', 'other'];
const PRODUCT_CONDITIONS = ['new', 'like_new', 'refurbished', 'used', 'damaged'];
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded', 'returned'];
const PAYMENT_STATUSES = ['pending', 'paid', 'partial', 'failed', 'refunded', 'disputed'];
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'paypal', 'paymaya', 'cod', 'wallet'];
const SUBSCRIPTION_FREQUENCIES = ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'];
const KIT_CATEGORIES = ['cleaning', 'maintenance', 'monthly', 'quarterly', 'custom', 'starter', 'professional', 'enterprise'];
const DIMENSION_UNITS = ['inches', 'cm', 'meters'];
const WEIGHT_UNITS = ['lbs', 'kg', 'oz', 'g'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'PHP', 'CAD', 'AUD'];
const DISCOUNT_TYPES = ['percent', 'fixed'];
const SHIPPING_METHODS = ['standard', 'express', 'overnight', 'pickup', 'same_day'];

// ============================================================================
// PRODUCT CATEGORY SCHEMA
// ============================================================================

const productCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: String,
  icon: String,
  image: {
    url: String,
    publicId: String
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    default: null
  },
  subcategories: [{
    name: { type: String, required: true },
    slug: String,
    description: String,
    icon: String,
    isActive: { type: Boolean, default: true }
  }],
  order: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Auto-generate slug for category
productCategorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  // Generate slugs for subcategories
  if (this.subcategories && this.subcategories.length > 0) {
    this.subcategories.forEach(sub => {
      if (!sub.slug && sub.name) {
        sub.slug = sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    });
  }
  next();
});

// ============================================================================
// PRODUCT SCHEMA
// ============================================================================

const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 300
  },

  // Categorization
  category: {
    type: String,
    enum: PRODUCT_CATEGORIES,
    required: true
  },
  categoryRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory'
  },
  subcategory: {
    type: String,
    required: true
  },
  tags: [String],

  // Product Details
  brand: {
    type: String,
    required: true
  },
  model: String,
  manufacturer: String,
  manufacturerPartNumber: String,
  sku: {
    type: String,
    required: true,
    unique: true
  },
  upc: String,
  ean: String,
  condition: {
    type: String,
    enum: PRODUCT_CONDITIONS,
    default: 'new'
  },
  // Pricing
  pricing: {
    retailPrice: {
      type: Number,
      required: true,
      min: 0
    },
    wholesalePrice: {
      type: Number,
      min: 0
    },
    costPrice: {
      type: Number,
      min: 0
    },
    compareAtPrice: Number, // Original price for showing discounts
    currency: {
      type: String,
      enum: CURRENCIES,
      default: 'USD'
    },
    taxable: { type: Boolean, default: true },
    taxRate: Number,
    bulkPricing: [{
      minQuantity: { type: Number, required: true },
      price: { type: Number, required: true },
      isActive: { type: Boolean, default: true }
    }],
    discounts: [{
      type: { type: String, enum: DISCOUNT_TYPES },
      value: Number,
      startDate: Date,
      endDate: Date,
      minQuantity: Number,
      maxQuantity: Number,
      description: String,
      isActive: { type: Boolean, default: true }
    }]
  },
  // Inventory Management
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    availableQuantity: {
      type: Number,
      default: 0
    },
    reservedQuantity: {
      type: Number,
      default: 0
    },
    minStock: {
      type: Number,
      default: 10
    },
    maxStock: Number,
    reorderPoint: Number,
    reorderQuantity: Number,
    location: String,
    warehouse: String,
    aisle: String,
    shelf: String,
    bin: String,
    trackInventory: { type: Boolean, default: true },
    allowBackorder: { type: Boolean, default: false },
    backorderLimit: Number
  },
  // Specifications
  specifications: {
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, enum: DIMENSION_UNITS, default: 'inches' }
    },
    weight: {
      value: Number,
      unit: { type: String, enum: WEIGHT_UNITS, default: 'lbs' }
    },
    material: String,
    color: String,
    size: String,
    capacity: String,
    voltage: String,
    powerRating: String,
    warranty: {
      duration: Number,
      unit: { type: String, enum: ['days', 'months', 'years'] },
      description: String,
      provider: String
    },
    certifications: [String],
    safetyInfo: String,
    features: [String],
    customSpecs: mongoose.Schema.Types.Mixed
  },
  // Shipping & Location
  shipping: {
    weight: {
      value: Number,
      unit: { type: String, enum: WEIGHT_UNITS, default: 'lbs' }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, enum: DIMENSION_UNITS, default: 'inches' }
    },
    shippingClass: String,
    freeShipping: { type: Boolean, default: false },
    freeShippingThreshold: Number,
    shippingFee: Number,
    estimatedDeliveryDays: {
      min: Number,
      max: Number
    },
    shippingMethods: [{
      method: { type: String, enum: SHIPPING_METHODS },
      fee: Number,
      estimatedDays: Number,
      isDefault: { type: Boolean, default: false }
    }],
    packageType: String,
    requiresSignature: { type: Boolean, default: false },
    fragile: { type: Boolean, default: false },
    hazardousMaterial: { type: Boolean, default: false },
    shippingRestrictions: [String]
  },
  location: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      formatted: String
    },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [longitude, latitude]
    },
    pickupAvailable: { type: Boolean, default: false },
    pickupInstructions: String
  },
  // Media
  images: [{
    url: String,
    publicId: String,
    thumbnail: String,
    alt: String,
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
  }],
  videos: [{
    url: String,
    publicId: String,
    thumbnail: String,
    title: String,
    duration: Number
  }],
  documents: [{
    type: { type: String, enum: ['manual', 'datasheet', 'msds', 'certificate', 'warranty', 'other'] },
    url: String,
    publicId: String,
    name: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Subscription Options
  isSubscriptionEligible: {
    type: Boolean,
    default: false
  },
  subscriptionOptions: {
    frequencies: [{ type: String, enum: SUBSCRIPTION_FREQUENCIES }],
    discount: Number,
    discountType: { type: String, enum: DISCOUNT_TYPES, default: 'percent' },
    minSubscriptionPeriod: Number // months
  },

  // Ratings Summary
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    breakdown: {
      quality: { average: Number, count: Number },
      value: { average: Number, count: Number },
      shipping: { average: Number, count: Number }
    },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },

  // Analytics
  analytics: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    addedToCart: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 0 },
    unitsOrdered: { type: Number, default: 0 },
    returnedCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    conversionRate: Number,
    lastViewedAt: Date,
    lastOrderedAt: Date
  },

  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    canonicalUrl: String
  },

  // Status Flags
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date,
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Approval Workflow
  approval: {
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'approved' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    rejectionReason: String,
    notes: String
  },

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Related Products
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  frequentlyBoughtWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],

  // Ownership
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  schemaVersion: { type: Number, default: 2 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================================
// PRODUCT VIRTUALS
// ============================================================================

productSchema.virtual('isLowStock').get(function() {
  return this.inventory.trackInventory && this.inventory.availableQuantity <= this.inventory.minStock;
});

productSchema.virtual('isOutOfStock').get(function() {
  return this.inventory.trackInventory && this.inventory.availableQuantity <= 0;
});

productSchema.virtual('discountedPrice').get(function() {
  if (!this.pricing.discounts || this.pricing.discounts.length === 0) return this.pricing.retailPrice;
  
  const activeDiscount = this.pricing.discounts.find(d => 
    d.isActive && 
    (!d.startDate || new Date(d.startDate) <= new Date()) &&
    (!d.endDate || new Date(d.endDate) >= new Date())
  );
  
  if (!activeDiscount) return this.pricing.retailPrice;
  
  if (activeDiscount.type === 'percent') {
    return this.pricing.retailPrice * (1 - activeDiscount.value / 100);
  }
  return this.pricing.retailPrice - activeDiscount.value;
});

// ============================================================================
// PRODUCT MIDDLEWARE
// ============================================================================

// Auto-generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  
  // Update available quantity
  if (this.isModified('inventory.quantity') || this.isModified('inventory.reservedQuantity')) {
    this.inventory.availableQuantity = Math.max(0, this.inventory.quantity - (this.inventory.reservedQuantity || 0));
  }
  
  next();
});

// Get product reviews count
productSchema.methods.getReviewsCount = async function() {
  const ProductReview = mongoose.model('ProductReview');
  return await ProductReview.countDocuments({
    product: this._id,
    isApproved: true,
    isHidden: false,
    isDeleted: false
  });
};

// Update product rating summary
productSchema.methods.updateRatingSummary = async function() {
  const ProductReview = mongoose.model('ProductReview');
  const summary = await ProductReview.getProductRatingSummary(this._id);
  this.rating = summary;
  await this.save();
};

// Get stock history
productSchema.methods.getStockHistory = async function(options = {}) {
  const StockHistory = mongoose.model('StockHistory');
  return await StockHistory.getProductHistory(this._id, options);
};

// Add stock history entry
productSchema.methods.addStockHistory = async function(data) {
  const StockHistory = mongoose.model('StockHistory');
  const quantityBefore = this.inventory.quantity;
  const quantityAfter = quantityBefore + data.quantityChange;
  
  const entry = await StockHistory.createEntry({
    product: this._id,
    supplier: this.supplier,
    quantityBefore,
    quantityChange: data.quantityChange,
    quantityAfter,
    reason: data.reason,
    reasonDetails: data.reasonDetails,
    reference: data.reference,
    referenceType: data.referenceType,
    referenceId: data.referenceId,
    warehouse: data.warehouse || this.inventory.warehouse,
    location: data.location || this.inventory.location,
    notes: data.notes,
    updatedBy: data.updatedBy,
    costImpact: data.costImpact,
    valueImpact: data.valueImpact,
    metadata: data.metadata
  });
  
  // Update product quantity
  this.inventory.quantity = quantityAfter;
  await this.save();
  
  return entry;
};

// ============================================================================
// PRODUCT INDEXES
// ============================================================================

// Core indexes
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ slug: 1 }, { unique: true, sparse: true });
productSchema.index({ supplier: 1, isActive: 1 });
productSchema.index({ category: 1, subcategory: 1, isActive: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ isDeleted: 1 });

// Query optimization indexes
productSchema.index({ brand: 1, category: 1, isActive: 1 });
productSchema.index({ 'pricing.retailPrice': 1, isActive: 1 });
productSchema.index({ 'inventory.availableQuantity': 1, isActive: 1 });
productSchema.index({ 'rating.average': -1, isActive: 1 });
productSchema.index({ createdAt: -1, isActive: 1 });
productSchema.index({ updatedAt: -1 });
productSchema.index({ isSubscriptionEligible: 1, isActive: 1 });
productSchema.index({ tags: 1, isActive: 1 });

// Geospatial index for location-based queries
productSchema.index({ 'location.coordinates': '2dsphere' });

// Compound indexes for complex queries
productSchema.index({ category: 1, 'pricing.retailPrice': 1, isActive: 1 });
productSchema.index({ supplier: 1, category: 1, isActive: 1 });
productSchema.index({ 'inventory.availableQuantity': 1, 'inventory.minStock': 1, isActive: 1 });
productSchema.index({ condition: 1, category: 1, isActive: 1 });
productSchema.index({ 'specifications.material': 1, category: 1, isActive: 1 });
productSchema.index({ 'specifications.color': 1, category: 1, isActive: 1 });

// Text search index
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  'specifications.material': 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,
    brand: 5,
    tags: 3,
    description: 2,
    'specifications.material': 1
  }
});

// ============================================================================
// SUBSCRIPTION KIT SCHEMA
// ============================================================================

const subscriptionKitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 300
  },
  category: {
    type: String,
    enum: KIT_CATEGORIES,
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  pricing: {
    monthlyPrice: Number,
    quarterlyPrice: Number,
    yearlyPrice: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  frequency: {
    type: String,
    enum: SUBSCRIPTION_FREQUENCIES,
    default: 'monthly'
  },
  
  // Media
  images: [{
    url: String,
    publicId: String,
    thumbnail: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Marketing
  targetAudience: [String],
  benefits: [String],
  
  // Analytics
  analytics: {
    subscribersCount: { type: Number, default: 0 },
    activeSubscriptions: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  
  // Ownership
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Auto-generate slug for kit
subscriptionKitSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// ============================================================================
// SUBSCRIPTION KIT INDEXES
// ============================================================================

subscriptionKitSchema.index({ slug: 1 }, { unique: true, sparse: true });
subscriptionKitSchema.index({ category: 1, isActive: 1 });
subscriptionKitSchema.index({ supplier: 1, isActive: 1 });
subscriptionKitSchema.index({ isFeatured: 1, isActive: 1 });
subscriptionKitSchema.index({ frequency: 1, isActive: 1 });

// ============================================================================
// ORDER SCHEMA
// ============================================================================

const orderSchema = new mongoose.Schema({
  // Reference Number
  orderNumber: {
    type: String,
    unique: true
  },
  
  // Core References
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Order Items
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    sku: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    subtotal: Number,
    discountApplied: {
      type: { type: String, enum: DISCOUNT_TYPES },
      value: Number,
      amount: Number
    },
    taxAmount: Number,
    total: Number
  }],
  // Subscription Info
  subscriptionKit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionKit'
  },
  isSubscription: {
    type: Boolean,
    default: false
  },
  subscriptionDetails: {
    frequency: { type: String, enum: SUBSCRIPTION_FREQUENCIES },
    nextDelivery: Date,
    lastDelivery: Date,
    totalDeliveries: Number,
    remainingDeliveries: Number,
    pausedAt: Date,
    resumedAt: Date,
    isActive: { type: Boolean, default: true }
  },
  
  // Pricing Summary
  pricing: {
    subtotal: Number,
    discounts: [{
      code: String,
      type: { type: String, enum: DISCOUNT_TYPES },
      value: Number,
      amount: Number,
      description: String
    }],
    totalDiscount: Number,
    taxAmount: Number,
    shippingFee: Number,
    totalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      enum: CURRENCIES,
      default: 'USD'
    }
  },
  // Customer Information
  customerInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String
  },
  
  // Shipping Details
  shippingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    street2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String,
    company: String
  },
  billingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    street2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String,
    company: String,
    sameAsShipping: { type: Boolean, default: true }
  },
  shippingMethod: {
    method: { type: String, enum: SHIPPING_METHODS },
    carrier: String,
    serviceName: String,
    estimatedDelivery: Date
  },
  tracking: {
    trackingNumber: String,
    carrier: String,
    trackingUrl: String,
    status: String,
    lastUpdate: Date,
    history: [{
      status: String,
      location: String,
      timestamp: Date,
      description: String
    }]
  },
  
  // Order Status
  status: {
    type: String,
    enum: ORDER_STATUSES,
    default: 'pending'
  },
  statusHistory: [{
    status: { type: String, enum: ORDER_STATUSES },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    notes: String
  }],
  // Payment Information
  payment: {
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending'
    },
    method: {
      type: String,
      enum: PAYMENT_METHODS
    },
    transactionId: String,
    paymentIntentId: String,
    
    // PayPal specific
    paypalOrderId: String,
    paypalTransactionId: String,
    paypalPayerId: String,
    
    // PayMaya specific
    paymayaReferenceNumber: String,
    paymayaCheckoutId: String,
    paymayaPaymentId: String,
    paymayaInvoiceId: String,
    paymayaTransactionId: String,
    
    paidAt: Date,
    paidAmount: Number,
    
    // Refund information
    refundedAt: Date,
    refundedAmount: Number,
    refundReason: String,
    
    paymentHistory: [{
      action: { type: String, enum: ['charge', 'refund', 'adjustment', 'void'] },
      amount: Number,
      transactionId: String,
      processedAt: { type: Date, default: Date.now },
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: String
    }],
    
    invoiceUrl: String,
    receiptUrl: String
  },
  
  // Order Notes
  customerNotes: String,
  internalNotes: String,
  specialInstructions: String,
  
  // Fulfillment
  fulfillment: {
    packedAt: Date,
    packedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    shippedAt: Date,
    shippedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt: Date,
    deliveredTo: String,
    signatureUrl: String
  },
  
  // Cancellation/Return
  cancellation: {
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    notes: String
  },
  returnInfo: {
    requested: { type: Boolean, default: false },
    requestedAt: Date,
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'] },
    returnedAt: Date,
    refundAmount: Number,
    restockingFee: Number,
    notes: String
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  schemaVersion: { type: Number, default: 2 }
}, {
  timestamps: true
});

// ============================================================================
// ORDER MIDDLEWARE
// ============================================================================

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

// ============================================================================
// ORDER INDEXES
// ============================================================================

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ supplier: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'payment.transactionId': 1 });
orderSchema.index({ 'tracking.trackingNumber': 1 });
orderSchema.index({ isSubscription: 1, 'subscriptionDetails.isActive': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ updatedAt: -1 });
orderSchema.index({ isDeleted: 1 });

// ============================================================================
// EXPORTS
// ============================================================================

// Import related models for reference
const ProductReview = require('./ProductReview');
const StockHistory = require('./StockHistory');

module.exports = {
  ProductCategory: mongoose.model('ProductCategory', productCategorySchema),
  Product: mongoose.model('Product', productSchema),
  SubscriptionKit: mongoose.model('SubscriptionKit', subscriptionKitSchema),
  Order: mongoose.model('Order', orderSchema),
  
  // Related models (imported)
  ProductReview,
  StockHistory,
  
  // Export constants for use in controllers/validators
  CONSTANTS: {
    PRODUCT_CATEGORIES,
    PRODUCT_CONDITIONS,
    ORDER_STATUSES,
    PAYMENT_STATUSES,
    PAYMENT_METHODS,
    SUBSCRIPTION_FREQUENCIES,
    KIT_CATEGORIES,
    DIMENSION_UNITS,
    WEIGHT_UNITS,
    CURRENCIES,
    DISCOUNT_TYPES,
    SHIPPING_METHODS
  }
};
