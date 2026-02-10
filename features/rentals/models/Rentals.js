const mongoose = require('mongoose');

// ============================================================================
// CONSTANTS
// ============================================================================

const RENTAL_CATEGORIES = ['tools', 'vehicles', 'equipment', 'machinery', 'electronics', 'outdoor', 'party', 'construction', 'sports', 'other'];
const ITEM_CONDITIONS = ['excellent', 'good', 'fair', 'poor'];
const RETURN_CONDITIONS = ['excellent', 'good', 'fair', 'poor', 'damaged'];
const RENTAL_STATUSES = ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed', 'overdue'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
const PAYMENT_STATUSES = ['pending', 'paid', 'partial', 'refunded', 'failed', 'disputed'];
const PAYMENT_METHODS = ['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'cash', 'wallet'];
const DOCUMENT_TYPES = ['manual', 'warranty', 'insurance', 'license', 'certificate', 'inspection', 'other'];
const DAMAGE_SEVERITIES = ['minor', 'moderate', 'major', 'total_loss'];
const DISPUTE_STATUSES = ['open', 'under_review', 'resolved', 'escalated', 'closed'];
const DISPUTE_TYPES = ['damage', 'late_return', 'payment', 'condition', 'availability', 'other'];
const INSURANCE_TYPES = ['basic', 'standard', 'premium', 'comprehensive'];
const DELIVERY_METHODS = ['pickup', 'delivery', 'both'];
const DIMENSION_UNITS = ['inches', 'feet', 'cm', 'meters'];
const WEIGHT_UNITS = ['lbs', 'kg', 'oz', 'g'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NGN'];

// ============================================================================
// RENTAL CATEGORY SCHEMA
// ============================================================================

const rentalCategorySchema = new mongoose.Schema({
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
    ref: 'RentalCategory',
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
rentalCategorySchema.pre('save', function(next) {
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
// RENTAL ITEM SCHEMA
// ============================================================================

const rentalItemSchema = new mongoose.Schema({
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
    enum: RENTAL_CATEGORIES,
    required: true
  },
  categoryRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalCategory'
  },
  subcategory: {
    type: String,
    required: true
  },
  tags: [String],

  // Ownership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Inventory
  inventory: {
    totalQuantity: { type: Number, default: 1 },
    availableQuantity: { type: Number, default: 1 },
    minRentalQuantity: { type: Number, default: 1 },
    maxRentalQuantity: Number,
    sku: String,
    serialNumbers: [String]
  },

  // Pricing
  pricing: {
    hourly: Number,
    daily: Number,
    weekly: Number,
    monthly: Number,
    currency: {
      type: String,
      enum: CURRENCIES,
      default: 'USD'
    },
    minimumRental: {
      duration: Number,
      period: { type: String, enum: ['hours', 'days', 'weeks', 'months'], default: 'days' }
    },
    maximumRental: {
      duration: Number,
      period: { type: String, enum: ['hours', 'days', 'weeks', 'months'] }
    },
    discounts: [{
      minDuration: Number,
      period: { type: String, enum: ['hours', 'days', 'weeks', 'months'] },
      discountPercent: Number,
      isActive: { type: Boolean, default: true }
    }],
    lateFee: {
      amount: Number,
      period: { type: String, enum: ['hour', 'day'], default: 'day' },
      gracePeriodHours: { type: Number, default: 2 }
    },
    cleaningFee: Number
  },

  // Availability
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    availableFrom: Date,
    availableUntil: Date,
    schedule: [{
      startDate: Date,
      endDate: Date,
      reason: { type: String, enum: ['rented', 'maintenance', 'unavailable', 'reserved', 'blocked'] },
      rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental' },
      notes: String
    }],
    instantBooking: { type: Boolean, default: false },
    advanceBookingDays: { type: Number, default: 90 },
    minNoticePeriodHours: { type: Number, default: 24 }
  },

  // Location & Delivery
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
    pickupInstructions: String,
    pickupRequired: { type: Boolean, default: true },
    deliveryAvailable: { type: Boolean, default: false },
    deliveryRadius: Number, // in miles
    deliveryFee: Number,
    deliveryFeePerMile: Number,
    deliveryNotes: String
  },

  // Specifications
  specifications: {
    brand: String,
    model: String,
    year: Number,
    condition: {
      type: String,
      enum: ITEM_CONDITIONS,
      default: 'good'
    },
    conditionNotes: String,
    features: [String],
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
    capacity: String,
    powerSource: String,
    fuelType: String,
    customSpecs: mongoose.Schema.Types.Mixed
  },

  // Requirements
  requirements: {
    minAge: Number,
    licenseRequired: { type: Boolean, default: false },
    licenseType: String,
    certificationRequired: { type: Boolean, default: false },
    certificationType: String,
    trainingRequired: { type: Boolean, default: false },
    trainingDuration: Number, // minutes
    deposit: {
      amount: Number,
      refundable: { type: Boolean, default: true },
      refundConditions: String
    },
    insuranceRequired: { type: Boolean, default: false },
    insuranceMinCoverage: Number,
    idVerificationRequired: { type: Boolean, default: true },
    backgroundCheckRequired: { type: Boolean, default: false },
    customRequirements: [String]
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
    type: {
      type: String,
      enum: DOCUMENT_TYPES
    },
    url: String,
    publicId: String,
    name: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Maintenance
  maintenance: {
    lastService: Date,
    nextService: Date,
    maintenanceInterval: Number, // days between services
    serviceHistory: [{
      date: Date,
      type: String,
      description: String,
      cost: Number,
      performedBy: String,
      documents: [{
        url: String,
        publicId: String,
        name: String
      }],
      nextServiceDate: Date
    }],
    conditionHistory: [{
      date: { type: Date, default: Date.now },
      condition: { type: String, enum: ITEM_CONDITIONS },
      notes: String,
      inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
  },

  // Insurance Options
  insuranceOptions: [{
    type: { type: String, enum: INSURANCE_TYPES },
    name: String,
    description: String,
    coverage: Number,
    deductible: Number,
    dailyRate: Number,
    provider: String,
    isDefault: { type: Boolean, default: false }
  }],

  // Rental Terms
  rentalTerms: {
    termsAndConditions: String,
    cancellationPolicy: {
      type: { type: String, enum: ['flexible', 'moderate', 'strict', 'custom'], default: 'moderate' },
      description: String,
      refundPolicy: [{
        hoursBeforeStart: Number,
        refundPercent: Number
      }]
    },
    damagePolicy: String,
    usageRestrictions: [String],
    includedAccessories: [String],
    optionalAccessories: [{
      name: String,
      description: String,
      dailyRate: Number,
      depositAmount: Number
    }]
  },

  // Embedded Bookings (for quick availability checks)
  bookings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental' },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    },
    totalCost: {
      type: Number,
      required: true
    },
    specialRequests: String,
    contactInfo: {
      phone: String,
      email: String
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Reviews (embedded for quick access)
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental' },
    rating: {
      overall: { type: Number, required: true, min: 1, max: 5 },
      condition: { type: Number, min: 1, max: 5 },
      accuracy: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 }
    },
    title: String,
    comment: String,
    pros: [String],
    cons: [String],
    images: [{
      url: String,
      publicId: String
    }],
    ownerResponse: {
      comment: String,
      respondedAt: Date
    },
    isVerified: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Ratings Summary
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    breakdown: {
      condition: { average: Number, count: Number },
      accuracy: { average: Number, count: Number },
      value: { average: Number, count: Number },
      communication: { average: Number, count: Number }
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
    inquiries: { type: Number, default: 0 },
    bookingsCount: { type: Number, default: 0 },
    completedRentals: { type: Number, default: 0 },
    cancelledRentals: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRentalDuration: Number,
    repeatRenterPercent: Number,
    lastViewedAt: Date,
    lastBookedAt: Date
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
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
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

  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  schemaVersion: { type: Number, default: 2 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================================
// RENTAL SCHEMA (Booking/Transaction)
// ============================================================================

const rentalSchema = new mongoose.Schema({
  // Reference Number
  rentalNumber: {
    type: String,
    unique: true
  },

  // Core References
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalItem',
    required: true
  },
  renter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Rental Period
  rentalPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      required: true // in hours
    },
    actualStartDate: Date,
    actualEndDate: Date,
    extendedUntil: Date,
    extensions: [{
      requestedAt: { type: Date, default: Date.now },
      newEndDate: Date,
      additionalCost: Number,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      approvedAt: Date,
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
  },

  // Quantity
  quantity: {
    type: Number,
    default: 1
  },

  // Pricing & Fees
  pricing: {
    rate: {
      type: Number,
      required: true
    },
    period: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      required: true
    },
    subtotal: Number,
    deliveryFee: Number,
    cleaningFee: Number,
    serviceFee: Number,
    deposit: {
      amount: Number,
      status: { type: String, enum: ['pending', 'held', 'released', 'forfeited', 'partial_release'], default: 'pending' },
      heldAt: Date,
      releasedAt: Date,
      amountReleased: Number,
      forfeitReason: String
    },
    insuranceFee: Number,
    accessories: [{
      name: String,
      quantity: Number,
      dailyRate: Number,
      total: Number
    }],
    discountApplied: {
      code: String,
      type: { type: String, enum: ['percent', 'fixed'] },
      amount: Number
    },
    lateFees: {
      amount: Number,
      reason: String,
      addedAt: Date
    },
    damageFees: {
      amount: Number,
      reason: String,
      addedAt: Date
    },
    adjustments: [{
      description: String,
      amount: Number,
      addedAt: { type: Date, default: Date.now },
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    totalAmount: Number,
    currency: {
      type: String,
      enum: CURRENCIES,
      default: 'USD'
    }
  },

  // Pickup Details
  pickup: {
    method: { type: String, enum: DELIVERY_METHODS, default: 'pickup' },
    location: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    scheduledTime: Date,
    actualTime: Date,
    contactPerson: String,
    contactPhone: String,
    instructions: String,
    conditionAtPickup: {
      condition: { type: String, enum: ITEM_CONDITIONS },
      notes: String,
      fuelLevel: String,
      mileage: Number,
      images: [{
        url: String,
        publicId: String,
        thumbnail: String,
        takenAt: { type: Date, default: Date.now }
      }],
      checklist: [{
        item: String,
        checked: Boolean,
        notes: String
      }],
      signedBy: String,
      signatureUrl: String,
      signedAt: Date
    },
    confirmedAt: Date,
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // Return Details
  return: {
    location: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    scheduledTime: Date,
    actualTime: Date,
    conditionAtReturn: {
      condition: { type: String, enum: RETURN_CONDITIONS },
      notes: String,
      fuelLevel: String,
      mileage: Number,
      images: [{
        url: String,
        publicId: String,
        thumbnail: String,
        takenAt: { type: Date, default: Date.now }
      }],
      checklist: [{
        item: String,
        checked: Boolean,
        notes: String
      }],
      signedBy: String,
      signatureUrl: String,
      signedAt: Date
    },
    confirmedAt: Date,
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isLate: { type: Boolean, default: false },
    lateHours: Number
  },

  // Status
  status: {
    type: String,
    enum: RENTAL_STATUSES,
    default: 'pending'
  },
  statusHistory: [{
    status: { type: String, enum: RENTAL_STATUSES },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    notes: String
  }],

  // Payment
  payment: {
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending'
    },
    method: { type: String, enum: PAYMENT_METHODS },
    transactionId: String,
    paymentIntentId: String,
    paidAt: Date,
    paidAmount: Number,
    refundedAt: Date,
    refundedAmount: Number,
    refundReason: String,
    paymentHistory: [{
      action: { type: String, enum: ['charge', 'refund', 'adjustment'] },
      amount: Number,
      transactionId: String,
      processedAt: { type: Date, default: Date.now },
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: String
    }],
    invoiceUrl: String,
    receiptUrl: String
  },

  // Insurance
  insurance: {
    selected: { type: Boolean, default: false },
    type: { type: String, enum: INSURANCE_TYPES },
    provider: String,
    policyNumber: String,
    coverage: Number,
    deductible: Number,
    premium: Number,
    validFrom: Date,
    validUntil: Date,
    claimFiled: { type: Boolean, default: false },
    claimDetails: {
      claimNumber: String,
      filedAt: Date,
      description: String,
      amount: Number,
      status: { type: String, enum: ['pending', 'approved', 'denied', 'paid'] },
      resolvedAt: Date
    }
  },

  // Rental Agreement
  agreement: {
    templateUsed: String,
    customTerms: String,
    signedByRenter: { type: Boolean, default: false },
    renterSignature: {
      url: String,
      signedAt: Date,
      ipAddress: String
    },
    signedByOwner: { type: Boolean, default: false },
    ownerSignature: {
      url: String,
      signedAt: Date,
      ipAddress: String
    },
    documentUrl: String,
    agreedTerms: [{
      term: String,
      agreedAt: Date
    }]
  },

  // Damage Reports
  damageReports: [{
    reportedAt: { type: Date, default: Date.now },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    severity: { type: String, enum: DAMAGE_SEVERITIES },
    description: String,
    location: String,
    estimatedCost: Number,
    actualCost: Number,
    images: [{
      url: String,
      publicId: String,
      thumbnail: String,
      description: String
    }],
    status: { type: String, enum: ['reported', 'assessing', 'repair_scheduled', 'repaired', 'claimed', 'resolved'], default: 'reported' },
    resolution: {
      resolvedAt: Date,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      outcome: String,
      chargedToRenter: Number,
      coveredByInsurance: Number
    },
    notes: String
  }],

  // Disputes
  disputes: [{
    type: { type: String, enum: DISPUTE_TYPES },
    status: { type: String, enum: DISPUTE_STATUSES, default: 'open' },
    filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    filedAt: { type: Date, default: Date.now },
    description: String,
    evidence: [{
      type: { type: String, enum: ['image', 'document', 'text'] },
      url: String,
      description: String,
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    resolution: {
      resolvedAt: Date,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      outcome: String,
      compensationAmount: Number,
      notes: String
    },
    messages: [{
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      message: String,
      timestamp: { type: Date, default: Date.now },
      isStaff: { type: Boolean, default: false }
    }]
  }],

  // Communication Thread
  communication: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    attachments: [{
      url: String,
      type: String,
      name: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    },
    readAt: Date,
    isSystemMessage: { type: Boolean, default: false }
  }],

  // Review
  review: {
    rating: {
      overall: { type: Number, min: 1, max: 5 },
      condition: { type: Number, min: 1, max: 5 },
      accuracy: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 }
    },
    title: String,
    comment: String,
    createdAt: Date,
    ownerResponse: {
      comment: String,
      respondedAt: Date
    }
  },

  // Owner's Review of Renter
  renterReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    recommendRenter: Boolean,
    createdAt: Date
  },

  // Cancellation
  cancellation: {
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    refundAmount: Number,
    refundStatus: { type: String, enum: ['pending', 'processed', 'denied'] },
    processedAt: Date
  },

  // Special Requests
  specialRequests: String,
  internalNotes: [{
    note: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],

  // Notifications
  notifications: {
    reminderSent: { type: Boolean, default: false },
    pickupReminderSentAt: Date,
    returnReminderSentAt: Date,
    overdueNoticeSentAt: Date
  },

  // Metadata
  source: { type: String, enum: ['web', 'mobile', 'api', 'admin'], default: 'web' },
  metadata: mongoose.Schema.Types.Mixed,
  schemaVersion: { type: Number, default: 2 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================================
// INDEXES - RENTAL ITEM
// ============================================================================

rentalItemSchema.index({ slug: 1 }, { unique: true, sparse: true });
rentalItemSchema.index({ category: 1, subcategory: 1 });
rentalItemSchema.index({ owner: 1 });
rentalItemSchema.index({ 'location.coordinates': '2dsphere' });
rentalItemSchema.index({ isActive: 1, 'approval.status': 1 });
rentalItemSchema.index({ isFeatured: 1, isActive: 1 });
rentalItemSchema.index({ 'rating.average': -1, 'rating.count': -1 });
rentalItemSchema.index({ category: 1, subcategory: 1, isActive: 1, 'approval.status': 1 });
rentalItemSchema.index({ owner: 1, isActive: 1, category: 1 });
rentalItemSchema.index({ 'availability.isAvailable': 1, isActive: 1 });
rentalItemSchema.index({ 'location.address.city': 1, 'location.address.state': 1, isActive: 1 });
rentalItemSchema.index({ 'pricing.hourly': 1, 'pricing.daily': 1 });
rentalItemSchema.index({ 'specifications.brand': 1, 'specifications.model': 1, isActive: 1 });
rentalItemSchema.index({ 'specifications.condition': 1, category: 1, isActive: 1 });
rentalItemSchema.index({ tags: 1, isActive: 1 });
rentalItemSchema.index({ createdAt: -1 });
rentalItemSchema.index({ 'analytics.views': -1 });
rentalItemSchema.index({ 'analytics.completedRentals': -1 });

// Text search index
rentalItemSchema.index({
  name: 'text',
  title: 'text',
  description: 'text',
  shortDescription: 'text',
  'specifications.brand': 'text',
  'specifications.model': 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    name: 8,
    tags: 5,
    'specifications.brand': 3,
    'specifications.model': 3,
    description: 1
  }
});

// ============================================================================
// INDEXES - RENTAL
// ============================================================================

rentalSchema.index({ rentalNumber: 1 }, { unique: true, sparse: true });
rentalSchema.index({ renter: 1, status: 1 });
rentalSchema.index({ owner: 1, status: 1 });
rentalSchema.index({ item: 1, status: 1 });
rentalSchema.index({ status: 1 });
rentalSchema.index({ 'rentalPeriod.startDate': 1 });
rentalSchema.index({ 'rentalPeriod.endDate': 1 });
rentalSchema.index({ 'payment.status': 1, status: 1 });
rentalSchema.index({ createdAt: -1, status: 1 });
rentalSchema.index({ 'return.scheduledTime': 1, status: 1 });
rentalSchema.index({ item: 1, 'rentalPeriod.startDate': 1, 'rentalPeriod.endDate': 1 });
rentalSchema.index({ 'disputes.status': 1 });
rentalSchema.index({ 'damageReports.status': 1 });

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

// Generate slug for rental item
rentalItemSchema.pre('save', async function(next) {
  if (this.isModified('title') && !this.slug) {
    const baseSlug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }

  // Update available quantity based on active bookings
  if (this.isModified('bookings')) {
    const activeBookings = this.bookings.filter(b =>
      ['pending', 'confirmed'].includes(b.status) &&
      new Date(b.endDate) > new Date()
    );
    const bookedQuantity = activeBookings.reduce((sum, b) => sum + (b.quantity || 1), 0);
    this.inventory.availableQuantity = Math.max(0, this.inventory.totalQuantity - bookedQuantity);
  }

  next();
});

// Generate rental number
rentalSchema.pre('save', async function(next) {
  if (this.isNew && !this.rentalNumber) {
    const date = new Date();
    const prefix = 'RNT';
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    this.rentalNumber = `${prefix}-${datePart}-${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate total amount
  if (this.isModified('pricing')) {
    const p = this.pricing;
    let total = p.subtotal || 0;
    total += p.deliveryFee || 0;
    total += p.cleaningFee || 0;
    total += p.serviceFee || 0;
    total += p.insuranceFee || 0;
    total += p.lateFees?.amount || 0;
    total += p.damageFees?.amount || 0;

    if (p.accessories && p.accessories.length > 0) {
      total += p.accessories.reduce((sum, acc) => sum + (acc.total || 0), 0);
    }
    if (p.adjustments && p.adjustments.length > 0) {
      total += p.adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    }
    if (p.discountApplied && p.discountApplied.amount) {
      total -= p.discountApplied.amount;
    }

    this.pricing.totalAmount = Math.max(0, total);
  }

  // Track status changes
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
  }

  next();
});

// ============================================================================
// VIRTUAL FIELDS
// ============================================================================

rentalItemSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0];
});

rentalItemSchema.virtual('isAvailableNow').get(function() {
  if (!this.availability.isAvailable || !this.isActive) return false;

  const now = new Date();
  const hasBlockingSchedule = this.availability.schedule.some(s =>
    s.startDate <= now && s.endDate >= now &&
    ['rented', 'unavailable', 'blocked'].includes(s.reason)
  );

  return !hasBlockingSchedule && this.inventory.availableQuantity > 0;
});

rentalSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'active') return false;
  return new Date() > new Date(this.rentalPeriod.endDate);
});

rentalSchema.virtual('daysRemaining').get(function() {
  if (!['confirmed', 'active'].includes(this.status)) return null;
  const end = new Date(this.rentalPeriod.endDate);
  const now = new Date();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
});

// ============================================================================
// RENTAL ITEM INSTANCE METHODS
// ============================================================================

/**
 * Check if item is available for specific dates
 */
rentalItemSchema.methods.checkAvailability = function(startDate, endDate, quantity = 1) {
  if (!this.isActive || !this.availability.isAvailable) {
    return { available: false, reason: 'Item is not available' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check availability window
  if (this.availability.availableFrom && start < this.availability.availableFrom) {
    return { available: false, reason: 'Item not yet available' };
  }
  if (this.availability.availableUntil && end > this.availability.availableUntil) {
    return { available: false, reason: 'Item not available after this date' };
  }

  // Check blocked schedules
  const conflicts = this.availability.schedule.filter(s => {
    if (!['rented', 'unavailable', 'blocked', 'reserved'].includes(s.reason)) return false;
    return (start <= s.endDate && end >= s.startDate);
  });

  if (conflicts.length > 0) {
    return { available: false, reason: 'Item has schedule conflicts', conflicts };
  }

  // Check quantity
  const overlappingBookings = this.bookings.filter(b =>
    ['pending', 'confirmed'].includes(b.status) &&
    start <= b.endDate && end >= b.startDate
  );
  const bookedQuantity = overlappingBookings.reduce((sum, b) => sum + (b.quantity || 1), 0);

  if (this.inventory.totalQuantity - bookedQuantity < quantity) {
    return { available: false, reason: 'Insufficient quantity available' };
  }

  return { available: true };
};

/**
 * Calculate rental price
 */
rentalItemSchema.methods.calculatePrice = function(startDate, endDate, options = {}) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const hours = Math.ceil((end - start) / (1000 * 60 * 60));
  const days = Math.ceil(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  let rate = 0;
  let period = 'daily';

  // Determine best rate
  if (months >= 1 && this.pricing.monthly) {
    rate = this.pricing.monthly * months + (this.pricing.daily || 0) * (days % 30);
    period = 'monthly';
  } else if (weeks >= 1 && this.pricing.weekly) {
    rate = this.pricing.weekly * weeks + (this.pricing.daily || 0) * (days % 7);
    period = 'weekly';
  } else if (days >= 1 && this.pricing.daily) {
    rate = this.pricing.daily * days;
    period = 'daily';
  } else if (this.pricing.hourly) {
    rate = this.pricing.hourly * hours;
    period = 'hourly';
  }

  const quantity = options.quantity || 1;
  let subtotal = rate * quantity;

  // Apply duration discounts
  if (this.pricing.discounts && this.pricing.discounts.length > 0) {
    const applicable = this.pricing.discounts
      .filter(d => d.isActive && days >= d.minDuration)
      .sort((a, b) => b.minDuration - a.minDuration)[0];

    if (applicable) {
      subtotal *= (1 - applicable.discountPercent / 100);
    }
  }

  const result = {
    subtotal: Math.round(subtotal * 100) / 100,
    rate,
    period,
    duration: { hours, days, weeks, months },
    quantity,
    deliveryFee: options.delivery ? (this.location.deliveryFee || 0) : 0,
    cleaningFee: this.pricing.cleaningFee || 0,
    deposit: this.requirements.deposit?.amount || 0,
    currency: this.pricing.currency
  };

  result.total = result.subtotal + result.deliveryFee + result.cleaningFee;

  return result;
};

/**
 * Add a booking
 */
rentalItemSchema.methods.addBooking = async function(bookingData) {
  const availability = this.checkAvailability(
    bookingData.startDate,
    bookingData.endDate,
    bookingData.quantity || 1
  );

  if (!availability.available) {
    throw new Error(availability.reason);
  }

  this.bookings.push({
    user: bookingData.user,
    startDate: bookingData.startDate,
    endDate: bookingData.endDate,
    quantity: bookingData.quantity || 1,
    totalCost: bookingData.totalCost,
    specialRequests: bookingData.specialRequests,
    contactInfo: bookingData.contactInfo,
    status: 'pending'
  });

  // Update availability schedule
  this.availability.schedule.push({
    startDate: bookingData.startDate,
    endDate: bookingData.endDate,
    reason: 'reserved'
  });

  this.analytics.bookingsCount++;
  this.analytics.lastBookedAt = new Date();

  return this.save();
};

/**
 * Add a review
 */
rentalItemSchema.methods.addReview = async function(reviewData) {
  const existingReview = this.reviews.find(r =>
    r.user.toString() === reviewData.user.toString()
  );

  if (existingReview) {
    throw new Error('User has already reviewed this item');
  }

  this.reviews.push({
    user: reviewData.user,
    rentalId: reviewData.rentalId,
    rating: reviewData.rating,
    title: reviewData.title,
    comment: reviewData.comment,
    pros: reviewData.pros,
    cons: reviewData.cons,
    images: reviewData.images,
    isVerified: !!reviewData.rentalId
  });

  await this.updateRating();
  return this.save();
};

/**
 * Update rating statistics
 */
rentalItemSchema.methods.updateRating = async function() {
  const validReviews = this.reviews.filter(r => !r.isHidden);

  if (validReviews.length === 0) {
    this.rating = {
      average: 0,
      count: 0,
      breakdown: {},
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
    return;
  }

  // Calculate overall average
  const sum = validReviews.reduce((s, r) => s + r.rating.overall, 0);
  this.rating.average = Math.round((sum / validReviews.length) * 10) / 10;
  this.rating.count = validReviews.length;

  // Calculate breakdown averages
  const categories = ['condition', 'accuracy', 'value', 'communication'];
  categories.forEach(cat => {
    const catReviews = validReviews.filter(r => r.rating[cat]);
    if (catReviews.length > 0) {
      const catSum = catReviews.reduce((s, r) => s + r.rating[cat], 0);
      this.rating.breakdown[cat] = {
        average: Math.round((catSum / catReviews.length) * 10) / 10,
        count: catReviews.length
      };
    }
  });

  // Calculate distribution
  this.rating.distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  validReviews.forEach(r => {
    const roundedRating = Math.round(r.rating.overall);
    if (roundedRating >= 1 && roundedRating <= 5) {
      this.rating.distribution[roundedRating]++;
    }
  });
};

/**
 * Increment view count
 */
rentalItemSchema.methods.incrementViews = async function() {
  this.analytics.views++;
  this.analytics.lastViewedAt = new Date();
  return this.save();
};

/**
 * Block dates for maintenance
 */
rentalItemSchema.methods.blockDates = function(startDate, endDate, reason = 'maintenance', notes = '') {
  this.availability.schedule.push({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    reason,
    notes
  });
  return this.save();
};

/**
 * Unblock dates
 */
rentalItemSchema.methods.unblockDates = function(scheduleId) {
  this.availability.schedule = this.availability.schedule.filter(
    s => s._id.toString() !== scheduleId.toString()
  );
  return this.save();
};

// ============================================================================
// RENTAL INSTANCE METHODS
// ============================================================================

/**
 * Confirm the rental
 */
rentalSchema.methods.confirm = async function(confirmedBy) {
  if (this.status !== 'pending') {
    throw new Error('Can only confirm pending rentals');
  }

  this.status = 'confirmed';
  this.statusHistory.push({
    status: 'confirmed',
    changedAt: new Date(),
    changedBy: confirmedBy
  });

  return this.save();
};

/**
 * Start the rental (mark as active)
 */
rentalSchema.methods.startRental = async function(pickupData = {}) {
  if (this.status !== 'confirmed') {
    throw new Error('Can only start confirmed rentals');
  }

  this.status = 'active';
  this.rentalPeriod.actualStartDate = new Date();
  this.pickup.actualTime = new Date();

  if (pickupData.condition) {
    this.pickup.conditionAtPickup = pickupData.condition;
  }
  if (pickupData.confirmedBy) {
    this.pickup.confirmedBy = pickupData.confirmedBy;
    this.pickup.confirmedAt = new Date();
  }

  this.statusHistory.push({
    status: 'active',
    changedAt: new Date(),
    changedBy: pickupData.confirmedBy
  });

  return this.save();
};

/**
 * Complete the rental (return item)
 */
rentalSchema.methods.completeRental = async function(returnData = {}) {
  if (this.status !== 'active') {
    throw new Error('Can only complete active rentals');
  }

  this.status = 'completed';
  this.rentalPeriod.actualEndDate = new Date();
  this.return.actualTime = new Date();

  if (returnData.condition) {
    this.return.conditionAtReturn = returnData.condition;
  }
  if (returnData.confirmedBy) {
    this.return.confirmedBy = returnData.confirmedBy;
    this.return.confirmedAt = new Date();
  }

  // Check for late return
  if (new Date() > this.rentalPeriod.endDate) {
    this.return.isLate = true;
    this.return.lateHours = Math.ceil(
      (new Date() - this.rentalPeriod.endDate) / (1000 * 60 * 60)
    );
  }

  this.statusHistory.push({
    status: 'completed',
    changedAt: new Date(),
    changedBy: returnData.confirmedBy
  });

  return this.save();
};

/**
 * Cancel the rental
 */
rentalSchema.methods.cancel = async function(cancelledBy, reason = '') {
  if (['completed', 'cancelled'].includes(this.status)) {
    throw new Error('Cannot cancel completed or already cancelled rentals');
  }

  this.status = 'cancelled';
  this.cancellation = {
    cancelledAt: new Date(),
    cancelledBy,
    reason
  };

  this.statusHistory.push({
    status: 'cancelled',
    changedAt: new Date(),
    changedBy: cancelledBy,
    reason
  });

  return this.save();
};

/**
 * Request extension
 */
rentalSchema.methods.requestExtension = async function(newEndDate, additionalCost) {
  if (!['confirmed', 'active'].includes(this.status)) {
    throw new Error('Can only extend confirmed or active rentals');
  }

  this.rentalPeriod.extensions.push({
    newEndDate,
    additionalCost,
    status: 'pending'
  });

  return this.save();
};

/**
 * Approve extension
 */
rentalSchema.methods.approveExtension = async function(extensionId, approvedBy) {
  const extension = this.rentalPeriod.extensions.id(extensionId);
  if (!extension || extension.status !== 'pending') {
    throw new Error('Extension not found or already processed');
  }

  extension.status = 'approved';
  extension.approvedAt = new Date();
  extension.approvedBy = approvedBy;

  this.rentalPeriod.endDate = extension.newEndDate;
  this.rentalPeriod.extendedUntil = extension.newEndDate;
  this.pricing.totalAmount += extension.additionalCost;

  return this.save();
};

/**
 * Add damage report
 */
rentalSchema.methods.reportDamage = async function(reportData) {
  this.damageReports.push({
    reportedBy: reportData.reportedBy,
    severity: reportData.severity,
    description: reportData.description,
    location: reportData.location,
    estimatedCost: reportData.estimatedCost,
    images: reportData.images
  });

  return this.save();
};

/**
 * File a dispute
 */
rentalSchema.methods.fileDispute = async function(disputeData) {
  const existingOpenDispute = this.disputes.find(d =>
    ['open', 'under_review'].includes(d.status)
  );

  if (existingOpenDispute) {
    throw new Error('An open dispute already exists for this rental');
  }

  this.disputes.push({
    type: disputeData.type,
    filedBy: disputeData.filedBy,
    description: disputeData.description,
    evidence: disputeData.evidence
  });

  this.status = 'disputed';
  this.statusHistory.push({
    status: 'disputed',
    changedAt: new Date(),
    changedBy: disputeData.filedBy,
    reason: 'Dispute filed'
  });

  return this.save();
};

/**
 * Add message to communication thread
 */
rentalSchema.methods.addMessage = async function(senderId, message, attachments = []) {
  this.communication.push({
    sender: senderId,
    recipient: senderId.toString() === this.renter.toString() ? this.owner : this.renter,
    message,
    attachments
  });

  return this.save();
};

/**
 * Add review
 */
rentalSchema.methods.addReview = async function(reviewData) {
  if (this.status !== 'completed') {
    throw new Error('Can only review completed rentals');
  }

  if (this.review && this.review.rating) {
    throw new Error('Review already submitted');
  }

  this.review = {
    rating: reviewData.rating,
    title: reviewData.title,
    comment: reviewData.comment,
    createdAt: new Date()
  };

  return this.save();
};

/**
 * Process payment
 */
rentalSchema.methods.processPayment = async function(paymentData) {
  this.payment.status = 'paid';
  this.payment.method = paymentData.method;
  this.payment.transactionId = paymentData.transactionId;
  this.payment.paymentIntentId = paymentData.paymentIntentId;
  this.payment.paidAt = new Date();
  this.payment.paidAmount = paymentData.amount || this.pricing.totalAmount;

  this.payment.paymentHistory.push({
    action: 'charge',
    amount: this.payment.paidAmount,
    transactionId: paymentData.transactionId
  });

  // Hold deposit
  if (this.pricing.deposit?.amount) {
    this.pricing.deposit.status = 'held';
    this.pricing.deposit.heldAt = new Date();
  }

  return this.save();
};

/**
 * Process refund
 */
rentalSchema.methods.processRefund = async function(refundData) {
  this.payment.refundedAt = new Date();
  this.payment.refundedAmount = refundData.amount;
  this.payment.refundReason = refundData.reason;

  if (refundData.amount >= this.payment.paidAmount) {
    this.payment.status = 'refunded';
  } else {
    this.payment.status = 'partial';
  }

  this.payment.paymentHistory.push({
    action: 'refund',
    amount: refundData.amount,
    transactionId: refundData.transactionId,
    notes: refundData.reason
  });

  return this.save();
};

/**
 * Release deposit
 */
rentalSchema.methods.releaseDeposit = async function(amount = null, reason = '') {
  if (!this.pricing.deposit || this.pricing.deposit.status !== 'held') {
    throw new Error('No deposit to release');
  }

  const releaseAmount = amount || this.pricing.deposit.amount;

  if (releaseAmount < this.pricing.deposit.amount) {
    this.pricing.deposit.status = 'partial_release';
    this.pricing.deposit.forfeitReason = reason;
  } else {
    this.pricing.deposit.status = 'released';
  }

  this.pricing.deposit.amountReleased = releaseAmount;
  this.pricing.deposit.releasedAt = new Date();

  return this.save();
};

/**
 * Sign rental agreement
 */
rentalSchema.methods.signAgreement = async function(signerType, signatureData) {
  if (signerType === 'renter') {
    this.agreement.signedByRenter = true;
    this.agreement.renterSignature = {
      url: signatureData.url,
      signedAt: new Date(),
      ipAddress: signatureData.ipAddress
    };
  } else if (signerType === 'owner') {
    this.agreement.signedByOwner = true;
    this.agreement.ownerSignature = {
      url: signatureData.url,
      signedAt: new Date(),
      ipAddress: signatureData.ipAddress
    };
  }

  return this.save();
};

// ============================================================================
// STATIC METHODS - RENTAL ITEM
// ============================================================================

/**
 * Find by slug
 */
rentalItemSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true, isDeleted: false });
};

/**
 * Search items
 */
rentalItemSchema.statics.searchItems = async function(query, filters = {}, options = {}) {
  const searchQuery = {
    isActive: true,
    isDeleted: { $ne: true },
    'approval.status': 'approved'
  };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  if (filters.category) searchQuery.category = filters.category;
  if (filters.subcategory) searchQuery.subcategory = filters.subcategory;
  if (filters.condition) searchQuery['specifications.condition'] = filters.condition;
  if (filters.owner) searchQuery.owner = filters.owner;

  if (filters.priceMin || filters.priceMax) {
    searchQuery['pricing.daily'] = {};
    if (filters.priceMin) searchQuery['pricing.daily'].$gte = filters.priceMin;
    if (filters.priceMax) searchQuery['pricing.daily'].$lte = filters.priceMax;
  }

  if (filters.availableNow) {
    searchQuery['availability.isAvailable'] = true;
  }

  // Geo query
  if (filters.lat && filters.lng && filters.radius) {
    searchQuery['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [filters.lng, filters.lat]
        },
        $maxDistance: filters.radius * 1609.34 // Convert miles to meters
      }
    };
  }

  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const sortOptions = {};
  switch (options.sort) {
    case 'price_low': sortOptions['pricing.daily'] = 1; break;
    case 'price_high': sortOptions['pricing.daily'] = -1; break;
    case 'rating': sortOptions['rating.average'] = -1; break;
    case 'popular': sortOptions['analytics.completedRentals'] = -1; break;
    case 'newest': sortOptions.createdAt = -1; break;
    default:
      if (query) sortOptions.score = { $meta: 'textScore' };
      else sortOptions.createdAt = -1;
  }

  const [items, total] = await Promise.all([
    this.find(searchQuery)
      .select(query ? { score: { $meta: 'textScore' } } : {})
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('owner', 'firstName lastName profilePicture rating'),
    this.countDocuments(searchQuery)
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get featured items
 */
rentalItemSchema.statics.getFeaturedItems = function(limit = 10) {
  return this.find({
    isFeatured: true,
    isActive: true,
    isDeleted: { $ne: true },
    'approval.status': 'approved',
    $or: [
      { featuredUntil: { $exists: false } },
      { featuredUntil: { $gte: new Date() } }
    ]
  })
    .sort({ 'rating.average': -1, 'analytics.completedRentals': -1 })
    .limit(limit)
    .populate('owner', 'firstName lastName profilePicture');
};

/**
 * Get popular items
 */
rentalItemSchema.statics.getPopularItems = function(limit = 10, category = null) {
  const query = {
    isActive: true,
    isDeleted: { $ne: true },
    'approval.status': 'approved'
  };

  if (category) query.category = category;

  return this.find(query)
    .sort({ 'analytics.completedRentals': -1, 'rating.average': -1 })
    .limit(limit)
    .populate('owner', 'firstName lastName profilePicture');
};

/**
 * Get items by owner
 */
rentalItemSchema.statics.getByOwner = function(ownerId, includeInactive = false) {
  const query = { owner: ownerId, isDeleted: { $ne: true } };
  if (!includeInactive) query.isActive = true;

  return this.find(query).sort({ createdAt: -1 });
};

/**
 * Get nearby items
 */
rentalItemSchema.statics.getNearby = function(lng, lat, maxDistanceMiles = 25, limit = 20) {
  return this.find({
    isActive: true,
    isDeleted: { $ne: true },
    'approval.status': 'approved',
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistanceMiles * 1609.34
      }
    }
  }).limit(limit);
};

// ============================================================================
// STATIC METHODS - RENTAL
// ============================================================================

/**
 * Find by rental number
 */
rentalSchema.statics.findByRentalNumber = function(rentalNumber) {
  return this.findOne({ rentalNumber })
    .populate('item')
    .populate('renter', 'firstName lastName email phone profilePicture')
    .populate('owner', 'firstName lastName email phone profilePicture');
};

/**
 * Get user rentals (as renter)
 */
rentalSchema.statics.getUserRentals = function(userId, status = null, options = {}) {
  const query = { renter: userId };
  if (status) query.status = status;

  const page = options.page || 1;
  const limit = options.limit || 20;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('item', 'title slug images pricing')
    .populate('owner', 'firstName lastName profilePicture');
};

/**
 * Get owner rentals
 */
rentalSchema.statics.getOwnerRentals = function(ownerId, status = null, options = {}) {
  const query = { owner: ownerId };
  if (status) query.status = status;

  const page = options.page || 1;
  const limit = options.limit || 20;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('item', 'title slug images pricing')
    .populate('renter', 'firstName lastName profilePicture');
};

/**
 * Get item rentals
 */
rentalSchema.statics.getItemRentals = function(itemId, options = {}) {
  const query = { item: itemId };
  if (options.status) query.status = options.status;

  return this.find(query)
    .sort({ 'rentalPeriod.startDate': -1 })
    .populate('renter', 'firstName lastName profilePicture');
};

/**
 * Get overdue rentals
 */
rentalSchema.statics.getOverdueRentals = function() {
  return this.find({
    status: 'active',
    'rentalPeriod.endDate': { $lt: new Date() }
  })
    .populate('item', 'title owner')
    .populate('renter', 'firstName lastName email phone');
};

/**
 * Get rentals needing return soon
 */
rentalSchema.statics.getRentalsEndingSoon = function(hoursAhead = 24) {
  const now = new Date();
  const endTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  return this.find({
    status: 'active',
    'rentalPeriod.endDate': { $gte: now, $lte: endTime }
  })
    .populate('item', 'title')
    .populate('renter', 'firstName lastName email');
};

/**
 * Get open disputes
 */
rentalSchema.statics.getOpenDisputes = function() {
  return this.find({
    'disputes.status': { $in: ['open', 'under_review'] }
  })
    .populate('item', 'title')
    .populate('renter', 'firstName lastName')
    .populate('owner', 'firstName lastName');
};

/**
 * Get rental statistics
 */
rentalSchema.statics.getStatistics = async function(ownerId = null, dateRange = {}) {
  const matchQuery = {};
  if (ownerId) matchQuery.owner = new mongoose.Types.ObjectId(ownerId);
  if (dateRange.start) matchQuery.createdAt = { $gte: new Date(dateRange.start) };
  if (dateRange.end) {
    matchQuery.createdAt = matchQuery.createdAt || {};
    matchQuery.createdAt.$lte = new Date(dateRange.end);
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalRentals: { $sum: 1 },
        completedRentals: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledRentals: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        activeRentals: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$payment.status', 'paid'] },
              '$pricing.totalAmount',
              0
            ]
          }
        },
        averageRentalValue: { $avg: '$pricing.totalAmount' },
        disputeCount: {
          $sum: { $cond: [{ $gt: [{ $size: '$disputes' }, 0] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalRentals: 0,
    completedRentals: 0,
    cancelledRentals: 0,
    activeRentals: 0,
    totalRevenue: 0,
    averageRentalValue: 0,
    disputeCount: 0
  };
};

// ============================================================================
// CATEGORY INDEXES
// ============================================================================

rentalCategorySchema.index({ slug: 1 }, { unique: true });
rentalCategorySchema.index({ parentCategory: 1 });
rentalCategorySchema.index({ isActive: 1, order: 1 });

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  RentalItem: mongoose.model('RentalItem', rentalItemSchema),
  Rental: mongoose.model('Rental', rentalSchema),
  RentalCategory: mongoose.model('RentalCategory', rentalCategorySchema),
  // Export constants for validation
  RENTAL_CATEGORIES,
  ITEM_CONDITIONS,
  RETURN_CONDITIONS,
  RENTAL_STATUSES,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  DOCUMENT_TYPES,
  DAMAGE_SEVERITIES,
  DISPUTE_STATUSES,
  DISPUTE_TYPES,
  INSURANCE_TYPES,
  DELIVERY_METHODS,
  DIMENSION_UNITS,
  WEIGHT_UNITS,
  CURRENCIES
};
