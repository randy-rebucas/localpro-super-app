const mongoose = require('mongoose');
const crypto = require('crypto');

// ============================================
// CONSTANTS
// ============================================

const SERVICE_STATUSES = ['draft', 'pending_review', 'approved', 'rejected', 'suspended', 'archived'];
const SERVICE_TYPES = ['one_time', 'recurring', 'emergency', 'maintenance', 'installation', 'consultation', 'subscription'];
const PRICING_TYPES = ['hourly', 'fixed', 'per_sqft', 'per_item', 'per_unit', 'tiered', 'quote_based'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'disputed', 'refunded'];
const PAYMENT_STATUSES = ['pending', 'authorized', 'paid', 'partially_refunded', 'refunded', 'failed', 'cancelled'];
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'paypal', 'paymaya', 'paymongo', 'gcash', 'wallet', 'split'];
const DISPUTE_STATUSES = ['open', 'under_review', 'resolved_client', 'resolved_provider', 'escalated', 'closed'];
const RECURRENCE_TYPES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'custom'];
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// ============================================
// SERVICE SCHEMA
// ============================================

const serviceSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: 300
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },

  // SEO & Discovery
  seo: {
    metaTitle: { type: String, trim: true, maxlength: 70 },
    metaDescription: { type: String, trim: true, maxlength: 160 },
    keywords: [{ type: String, trim: true }],
    canonicalUrl: { type: String, trim: true }
  },
  tags: [{ type: String, trim: true, lowercase: true }],
  searchKeywords: [{ type: String, trim: true, lowercase: true }],

  // Approval Workflow
  status: {
    type: String,
    enum: SERVICE_STATUSES,
    default: 'draft'
  },
  approval: {
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'requires_changes'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    notes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    changesRequested: [{ type: String, trim: true }]
  },

  // Pricing (Enhanced)
  pricing: {
    type: {
      type: String,
      enum: PRICING_TYPES,
      required: true
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'PHP',
      trim: true
    },
    minPrice: { type: Number, min: 0 },
    maxPrice: { type: Number, min: 0 },
    pricePerUnit: { type: Number, min: 0 },
    unitName: { type: String, trim: true }, // e.g., "sqft", "item", "hour"
    tieredPricing: [{
      minQuantity: { type: Number, min: 1 },
      maxQuantity: { type: Number },
      pricePerUnit: { type: Number, min: 0 }
    }],
    depositRequired: { type: Boolean, default: false },
    depositPercentage: { type: Number, min: 0, max: 100 },
    depositAmount: { type: Number, min: 0 }
  },

  // Multi-Currency Support
  localizedPricing: [{
    currency: { type: String, required: true },
    basePrice: { type: Number, required: true, min: 0 },
    exchangeRate: { type: Number, min: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }],

  // Promotions & Discounts
  promotions: {
    active: { type: Boolean, default: false },
    discountType: { type: String, enum: ['percentage', 'fixed', 'none'], default: 'none' },
    discountValue: { type: Number, min: 0 },
    promoCode: { type: String, trim: true, uppercase: true },
    startDate: Date,
    endDate: Date,
    maxUses: { type: Number, min: 0 },
    usedCount: { type: Number, default: 0 },
    minOrderValue: { type: Number, min: 0 },
    applicableTo: { type: String, enum: ['all', 'new_customers', 'returning_customers'], default: 'all' }
  },

  // Commission & Platform Fees
  commission: {
    rate: { type: Number, min: 0, max: 100, default: 15 }, // Platform commission percentage
    fixedFee: { type: Number, min: 0, default: 0 },
    customRate: { type: Boolean, default: false },
    overrideReason: { type: String, trim: true }
  },

  // Availability & Capacity
  availability: {
    schedule: [{
      day: {
        type: String,
        enum: DAYS_OF_WEEK
      },
      startTime: { type: String, trim: true },
      endTime: { type: String, trim: true },
      isAvailable: { type: Boolean, default: true },
      slots: { type: Number, default: 1 } // Max bookings per time slot
    }],
    timezone: { type: String, default: 'Asia/Manila', trim: true },
    leadTime: { type: Number, default: 24 }, // Hours notice required
    maxAdvanceBooking: { type: Number, default: 30 }, // Days in advance
    bufferTime: { type: Number, default: 30 }, // Minutes between bookings
    instantBooking: { type: Boolean, default: false }
  },
  capacity: {
    maxDailyBookings: { type: Number, min: 1, default: 10 },
    maxWeeklyBookings: { type: Number, min: 1 },
    maxConcurrentBookings: { type: Number, min: 1, default: 1 },
    currentDailyBookings: { type: Number, default: 0 },
    overbookingAllowed: { type: Boolean, default: false },
    overbookingLimit: { type: Number, default: 0 }
  },

  // Service Area (Enhanced)
  serviceArea: {
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function(arr) {
            return arr.length === 2 &&
                   arr[0] >= -180 && arr[0] <= 180 &&
                   arr[1] >= -90 && arr[1] <= 90;
          },
          message: 'Coordinates must be [longitude, latitude] array'
        }
      }
    },
    radius: { type: Number, required: true, min: 1, max: 1000 },
    serviceZones: [{
      name: { type: String, trim: true },
      coordinates: {
        type: { type: String, enum: ['Polygon'] },
        coordinates: [[[Number]]]
      },
      surcharge: { type: Number, default: 0 },
      available: { type: Boolean, default: true }
    }],
    excludedAreas: [{
      name: { type: String, trim: true },
      coordinates: {
        type: { type: String, enum: ['Polygon'] },
        coordinates: [[[Number]]]
      },
      reason: { type: String, trim: true }
    }],
    travelFee: {
      enabled: { type: Boolean, default: false },
      freeRadius: { type: Number, default: 5 },
      pricePerKm: { type: Number, default: 0 }
    }
  },

  // Media
  images: [{
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    alt: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 }
  }],
  videos: [{
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    title: { type: String, trim: true },
    duration: { type: Number }
  }],

  // Service Details
  features: [{ type: String, trim: true }],
  requirements: [{ type: String, trim: true }],
  inclusions: [{ type: String, trim: true }],
  exclusions: [{ type: String, trim: true }],
  faqs: [{
    question: { type: String, trim: true },
    answer: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 }
  }],

  serviceType: {
    type: String,
    enum: SERVICE_TYPES,
    default: 'one_time'
  },
  estimatedDuration: {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
    unit: { type: String, enum: ['minutes', 'hours', 'days'], default: 'minutes' }
  },
  teamSize: { type: Number, default: 1, min: 1 },
  equipmentProvided: { type: Boolean, default: true },
  materialsIncluded: { type: Boolean, default: false },

  // Warranty & Insurance
  warranty: {
    hasWarranty: { type: Boolean, default: false },
    duration: { type: Number, min: 0 },
    durationUnit: { type: String, enum: ['days', 'months', 'years'], default: 'days' },
    description: { type: String, trim: true },
    terms: { type: String, trim: true }
  },
  insurance: {
    covered: { type: Boolean, default: false },
    coverageAmount: { type: Number, min: 0 },
    provider: { type: String, trim: true },
    policyNumber: { type: String, trim: true }
  },

  // Emergency Service
  emergencyService: {
    available: { type: Boolean, default: false },
    surcharge: { type: Number, min: 0 },
    surchargeType: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
    responseTime: { type: String, trim: true },
    availableHours: { type: String, trim: true }
  },

  // Service Variants/Packages
  servicePackages: [{
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    price: { type: Number, min: 0, required: true },
    compareAtPrice: { type: Number, min: 0 },
    features: [{ type: String, trim: true }],
    duration: { type: Number, min: 0 },
    isPopular: { type: Boolean, default: false },
    maxBookings: { type: Number },
    sortOrder: { type: Number, default: 0 }
  }],
  addOns: [{
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    price: { type: Number, min: 0, required: true },
    category: { type: String, trim: true },
    isRequired: { type: Boolean, default: false },
    maxQuantity: { type: Number, default: 1 },
    sortOrder: { type: Number, default: 0 }
  }],

  // Analytics & Metrics
  analytics: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    cancelledBookings: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    lastViewedAt: Date,
    lastBookedAt: Date
  },

  // Rating (Enhanced)
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    },
    categories: {
      quality: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      timeliness: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      communication: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
      value: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } }
    },
    recommendationRate: { type: Number, default: 0 }
  },

  // Featured & Visibility
  featured: {
    isFeatured: { type: Boolean, default: false },
    featuredAt: Date,
    featuredUntil: Date,
    featuredPosition: { type: Number },
    featuredReason: { type: String, trim: true }
  },
  visibility: {
    isPublic: { type: Boolean, default: true },
    showPrice: { type: Boolean, default: true },
    showAvailability: { type: Boolean, default: true },
    requiresApproval: { type: Boolean, default: false }
  },

  // External Integrations
  externalIds: [{
    system: { type: String, required: true, trim: true },
    externalId: { type: String, required: true, trim: true },
    metadata: mongoose.Schema.Types.Mixed,
    syncedAt: Date
  }],

  // Webhooks (Service-level)
  webhooks: [{
    url: { type: String, required: true },
    events: [{ type: String }],
    secret: { type: String, select: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],

  // Compliance & Certifications
  compliance: {
    licensesRequired: [{ type: String, trim: true }],
    certificationsRequired: [{ type: String, trim: true }],
    insuranceRequired: { type: Boolean, default: false },
    backgroundCheckRequired: { type: Boolean, default: false },
    ageRestriction: { type: Number, min: 0 }
  },

  // Versioning
  version: { type: Number, default: 1 },
  versionHistory: [{
    version: { type: Number },
    changes: mongoose.Schema.Types.Mixed,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, trim: true }
  }],

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  isActive: { type: Boolean, default: true },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// ============================================
// BOOKING SCHEMA (Enhanced)
// ============================================

const bookingSchema = new mongoose.Schema({
  // References
  bookingNumber: {
    type: String,
    unique: true,
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  servicePackage: {
    type: mongoose.Schema.Types.ObjectId // Reference to selected package
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },

  // Booking Details
  bookingDate: { type: Date, required: true },
  bookingEndDate: Date,
  duration: { type: Number, required: true, min: 0 },
  durationUnit: { type: String, enum: ['minutes', 'hours', 'days'], default: 'minutes' },
  timeSlot: {
    start: { type: String, trim: true },
    end: { type: String, trim: true }
  },

  // Recurring Bookings
  recurring: {
    isRecurring: { type: Boolean, default: false },
    type: { type: String, enum: RECURRENCE_TYPES },
    interval: { type: Number, default: 1 },
    daysOfWeek: [{ type: String, enum: DAYS_OF_WEEK }],
    dayOfMonth: { type: Number, min: 1, max: 31 },
    endDate: Date,
    maxOccurrences: { type: Number },
    currentOccurrence: { type: Number, default: 1 },
    parentBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    childBookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }]
  },

  // Address & Location
  address: {
    street: { type: String, trim: true },
    unit: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
    },
    instructions: { type: String, trim: true },
    accessCode: { type: String, trim: true }
  },

  // GPS Tracking
  tracking: {
    enabled: { type: Boolean, default: false },
    providerLocation: {
      coordinates: [Number],
      updatedAt: Date
    },
    eta: { type: Number }, // Minutes
    distance: { type: Number }, // Kilometers
    arrivedAt: Date,
    startedAt: Date,
    completedAt: Date,
    locationHistory: [{
      coordinates: [Number],
      timestamp: { type: Date, default: Date.now },
      accuracy: { type: Number }
    }]
  },

  specialInstructions: { type: String, trim: true, maxlength: 1000 },

  // Status & Timeline
  status: {
    type: String,
    enum: BOOKING_STATUSES,
    default: 'pending'
  },
  statusHistory: [{
    status: { type: String, enum: BOOKING_STATUSES },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, trim: true }
  }],

  // Cancellation
  cancellation: {
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, trim: true },
    reasonCode: { type: String, enum: ['client_request', 'provider_unavailable', 'weather', 'emergency', 'no_show', 'other'] },
    refundAmount: { type: Number, default: 0 },
    refundStatus: { type: String, enum: ['pending', 'processing', 'completed', 'denied'], default: 'pending' },
    penaltyApplied: { type: Boolean, default: false },
    penaltyAmount: { type: Number, default: 0 }
  },

  // Rescheduling
  rescheduling: {
    isRescheduled: { type: Boolean, default: false },
    originalDate: Date,
    rescheduleCount: { type: Number, default: 0 },
    history: [{
      fromDate: Date,
      toDate: Date,
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      requestedAt: { type: Date, default: Date.now },
      reason: { type: String, trim: true },
      approved: { type: Boolean },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
  },

  // Selected Add-ons
  addOns: [{
    addOnId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String, trim: true },
    price: { type: Number, min: 0 },
    quantity: { type: Number, default: 1 }
  }],

  // Pricing & Payment (Enhanced)
  pricing: {
    basePrice: { type: Number, min: 0 },
    packagePrice: { type: Number, min: 0 },
    addOnsTotal: { type: Number, default: 0 },
    travelFee: { type: Number, default: 0 },
    emergencySurcharge: { type: Number, default: 0 },
    discount: {
      amount: { type: Number, default: 0 },
      type: { type: String, enum: ['percentage', 'fixed'] },
      code: { type: String, trim: true },
      reason: { type: String, trim: true }
    },
    tax: {
      rate: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    platformFee: { type: Number, default: 0 },
    providerEarnings: { type: Number, default: 0 },
    subtotal: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
    currency: { type: String, default: 'PHP', trim: true },
    exchangeRate: { type: Number, default: 1 }
  },

  // Payment
  payment: {
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending'
    },
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'cash'
    },
    // Deposit
    deposit: {
      required: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      paidAt: Date,
      status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' }
    },
    // Split Payment Support
    splitPayments: [{
      method: { type: String, enum: PAYMENT_METHODS },
      amount: { type: Number, min: 0 },
      status: { type: String, enum: PAYMENT_STATUSES },
      transactionId: { type: String, trim: true },
      paidAt: Date
    }],
    // Transaction IDs
    transactionId: { type: String, trim: true },
    paypalOrderId: { type: String, trim: true },
    paypalTransactionId: { type: String, trim: true },
    paymayaReferenceNumber: { type: String, trim: true },
    paymayaCheckoutId: { type: String, trim: true },
    paymayaPaymentId: { type: String, trim: true },
    paymayaInvoiceId: { type: String, trim: true },
    paymayaTransactionId: { type: String, trim: true },
    paymongoIntentId: { type: String, trim: true },
    paymongoChargeId: { type: String, trim: true },
    paymongoPaymentId: { type: String, trim: true },
    paidAt: Date,
    paidAmount: { type: Number, default: 0 },
    // Escrow
    escrow: {
      enabled: { type: Boolean, default: false },
      escrowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Escrow' },
      status: { type: String, enum: ['pending', 'held', 'released', 'refunded'] },
      heldAt: Date,
      releasedAt: Date
    }
  },

  // Tips/Gratuity
  tip: {
    amount: { type: Number, default: 0 },
    addedAt: Date,
    method: { type: String, enum: PAYMENT_METHODS },
    transactionId: { type: String, trim: true }
  },

  // Disputes
  dispute: {
    hasDispute: { type: Boolean, default: false },
    status: { type: String, enum: DISPUTE_STATUSES },
    openedAt: Date,
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, trim: true },
    reasonCode: { type: String, enum: ['quality', 'no_show', 'incomplete', 'damage', 'pricing', 'other'] },
    description: { type: String, trim: true },
    evidence: [{
      type: { type: String, enum: ['photo', 'video', 'document', 'text'] },
      url: { type: String, trim: true },
      description: { type: String, trim: true },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      uploadedAt: { type: Date, default: Date.now }
    }],
    resolution: {
      resolvedAt: Date,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      outcome: { type: String, enum: ['client_favor', 'provider_favor', 'split', 'dismissed'] },
      refundAmount: { type: Number, default: 0 },
      notes: { type: String, trim: true }
    },
    messages: [{
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      message: { type: String, trim: true },
      timestamp: { type: Date, default: Date.now },
      isInternal: { type: Boolean, default: false }
    }]
  },

  // Reviews (Bidirectional)
  review: {
    client: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 2000 },
      createdAt: Date,
      categories: {
        quality: { type: Number, min: 1, max: 5 },
        timeliness: { type: Number, min: 1, max: 5 },
        communication: { type: Number, min: 1, max: 5 },
        value: { type: Number, min: 1, max: 5 }
      },
      wouldRecommend: { type: Boolean },
      photos: [{
        url: { type: String, trim: true },
        publicId: { type: String, trim: true },
        thumbnail: { type: String, trim: true }
      }],
      response: {
        message: { type: String, trim: true },
        respondedAt: Date
      },
      helpful: { type: Number, default: 0 },
      reported: { type: Boolean, default: false }
    },
    provider: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 1000 },
      createdAt: Date,
      wouldWorkAgain: { type: Boolean }
    }
  },

  // Completion
  completion: {
    checklist: [{
      item: { type: String, trim: true },
      completed: { type: Boolean, default: false },
      completedAt: Date,
      notes: { type: String, trim: true }
    }],
    notes: { type: String, trim: true },
    beforePhotos: [{
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
      thumbnail: { type: String, trim: true },
      caption: { type: String, trim: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    afterPhotos: [{
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
      thumbnail: { type: String, trim: true },
      caption: { type: String, trim: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    signedOff: { type: Boolean, default: false },
    signedOffAt: Date,
    signedOffBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    signature: { type: String, trim: true } // Base64 signature image
  },

  // Communication
  communication: {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    lastMessageAt: Date,
    unreadCount: {
      client: { type: Number, default: 0 },
      provider: { type: Number, default: 0 }
    }
  },

  // Documents
  documents: [{
    name: { type: String, trim: true },
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
    type: { type: String, enum: ['quote', 'invoice', 'receipt', 'contract', 'other'] },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Reminders
  reminders: [{
    type: { type: String, enum: ['upcoming', 'confirmation', 'review', 'payment', 'custom'] },
    scheduledFor: Date,
    sentAt: Date,
    channel: { type: String, enum: ['email', 'sms', 'push', 'all'] },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' }
  }],

  // Referral Tracking
  referral: {
    code: { type: String, trim: true },
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    discountApplied: { type: Number, default: 0 },
    commissionEarned: { type: Number, default: 0 }
  },

  // External Integrations
  externalIds: [{
    system: { type: String, required: true, trim: true },
    externalId: { type: String, required: true, trim: true },
    metadata: mongoose.Schema.Types.Mixed,
    syncedAt: Date
  }],

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  source: {
    type: String,
    enum: ['web', 'mobile_app', 'api', 'admin', 'partner'],
    default: 'web'
  },
  userAgent: { type: String, trim: true },
  ipAddress: { type: String, trim: true }
}, {
  timestamps: true
});

// ============================================
// SERVICE INDEXES
// ============================================

serviceSchema.index({ slug: 1 }, { unique: true, sparse: true });
serviceSchema.index({ category: 1, subcategory: 1 });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ status: 1, isActive: 1 });
serviceSchema.index({ provider: 1, isActive: 1, status: 1 });
serviceSchema.index({ 'rating.average': -1, 'rating.count': -1 });
serviceSchema.index({ 'analytics.views': -1 });
serviceSchema.index({ 'analytics.bookings': -1 });
serviceSchema.index({ 'featured.isFeatured': 1, 'featured.featuredPosition': 1 });
serviceSchema.index({ createdAt: -1, isActive: 1 });
serviceSchema.index({ updatedAt: -1, isActive: 1 });
serviceSchema.index({ 'serviceArea.coordinates': '2dsphere' });
serviceSchema.index({ tags: 1 });
serviceSchema.index({ searchKeywords: 1 });
serviceSchema.index({ 'pricing.basePrice': 1, 'pricing.currency': 1 });
serviceSchema.index({ 'promotions.active': 1, 'promotions.endDate': 1 });
serviceSchema.index({ 'externalIds.system': 1, 'externalIds.externalId': 1 }, { sparse: true });

serviceSchema.index({
  title: 'text',
  description: 'text',
  shortDescription: 'text',
  features: 'text',
  tags: 'text',
  searchKeywords: 'text'
}, {
  weights: {
    title: 10,
    tags: 8,
    searchKeywords: 6,
    shortDescription: 4,
    description: 2,
    features: 1
  }
});

// ============================================
// BOOKING INDEXES
// ============================================

bookingSchema.index({ bookingNumber: 1 }, { unique: true });
bookingSchema.index({ client: 1, status: 1 });
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ service: 1, status: 1 });
bookingSchema.index({ bookingDate: 1, status: 1 });
bookingSchema.index({ status: 1, bookingDate: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ 'recurring.isRecurring': 1, 'recurring.parentBookingId': 1 });
bookingSchema.index({ 'dispute.hasDispute': 1, 'dispute.status': 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ 'address.coordinates': '2dsphere' });
bookingSchema.index({ 'externalIds.system': 1, 'externalIds.externalId': 1 }, { sparse: true });

// ============================================
// SERVICE PRE-SAVE HOOKS
// ============================================

serviceSchema.pre('save', async function(next) {
  // Generate slug if not set
  if (!this.slug && this.title) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check for uniqueness
    let slug = baseSlug;
    let counter = 1;
    const Service = mongoose.model('Service');

    while (await Service.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }

  // Update conversion rate
  if (this.analytics && this.analytics.views > 0) {
    this.analytics.conversionRate = (this.analytics.bookings / this.analytics.views) * 100;
  }

  // Update average order value
  if (this.analytics && this.analytics.completedBookings > 0) {
    this.analytics.averageOrderValue = this.analytics.revenue / this.analytics.completedBookings;
  }

  next();
});

// ============================================
// BOOKING PRE-SAVE HOOKS
// ============================================

bookingSchema.pre('save', async function(next) {
  // Generate booking number if not set
  if (!this.bookingNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.bookingNumber = `BK${dateStr}${random}`;
  }

  // Calculate totals
  if (this.isModified('pricing') || this.isModified('addOns')) {
    const basePrice = this.pricing.basePrice || 0;
    const packagePrice = this.pricing.packagePrice || 0;
    const addOnsTotal = (this.addOns || []).reduce((sum, addon) =>
      sum + (addon.price * (addon.quantity || 1)), 0
    );
    const travelFee = this.pricing.travelFee || 0;
    const emergencySurcharge = this.pricing.emergencySurcharge || 0;

    const subtotal = basePrice + packagePrice + addOnsTotal + travelFee + emergencySurcharge;
    const discount = this.pricing.discount?.amount || 0;
    const taxAmount = (subtotal - discount) * (this.pricing.tax?.rate || 0) / 100;

    this.pricing.addOnsTotal = addOnsTotal;
    this.pricing.subtotal = subtotal;
    this.pricing.tax.amount = taxAmount;
    this.pricing.totalAmount = subtotal - discount + taxAmount;
  }

  next();
});

// ============================================
// SERVICE INSTANCE METHODS
// ============================================

// Generate unique slug
serviceSchema.methods.generateSlug = async function() {
  const baseSlug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let slug = baseSlug;
  let counter = 1;
  const Service = mongoose.model('Service');

  while (await Service.findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  this.slug = slug;
  await this.save();
  return slug;
};

// Update analytics
serviceSchema.methods.recordView = async function(isUnique = false) {
  this.analytics.views += 1;
  if (isUnique) {
    this.analytics.uniqueViews += 1;
  }
  this.analytics.lastViewedAt = new Date();
  await this.save();
  return this;
};

serviceSchema.methods.recordClick = async function() {
  this.analytics.clicks += 1;
  await this.save();
  return this;
};

serviceSchema.methods.recordInquiry = async function() {
  this.analytics.inquiries += 1;
  await this.save();
  return this;
};

serviceSchema.methods.recordBooking = async function(amount = 0) {
  this.analytics.bookings += 1;
  this.analytics.lastBookedAt = new Date();
  if (amount > 0) {
    this.analytics.revenue += amount;
  }
  await this.save();
  return this;
};

serviceSchema.methods.recordCompletion = async function(amount = 0) {
  this.analytics.completedBookings += 1;
  if (amount > 0) {
    this.analytics.revenue += amount;
  }
  await this.save();
  return this;
};

serviceSchema.methods.recordCancellation = async function() {
  this.analytics.cancelledBookings += 1;
  await this.save();
  return this;
};

// Rating management
serviceSchema.methods.addRating = async function(rating, categories = {}) {
  const count = this.rating.count;
  const newCount = count + 1;

  // Update overall rating
  this.rating.average = ((this.rating.average * count) + rating) / newCount;
  this.rating.count = newCount;

  // Update distribution
  const ratingKey = Math.round(rating).toString();
  if (this.rating.distribution[ratingKey] !== undefined) {
    this.rating.distribution[ratingKey] += 1;
  }

  // Update category ratings
  for (const [cat, value] of Object.entries(categories)) {
    if (this.rating.categories[cat]) {
      const catCount = this.rating.categories[cat].count;
      const newCatCount = catCount + 1;
      this.rating.categories[cat].average =
        ((this.rating.categories[cat].average * catCount) + value) / newCatCount;
      this.rating.categories[cat].count = newCatCount;
    }
  }

  await this.save();
  return this;
};

// Pricing helpers
serviceSchema.methods.calculatePrice = function(options = {}) {
  const { quantity = 1, packageId = null, addOnIds = [], applyPromo = true } = options;

  let total = 0;

  // Base or package price
  if (packageId) {
    const pkg = this.servicePackages.id(packageId);
    if (pkg) {
      total = pkg.price;
    }
  } else if (this.pricing.type === 'tiered' && this.pricing.tieredPricing.length > 0) {
    const tier = this.pricing.tieredPricing.find(t =>
      quantity >= t.minQuantity && (!t.maxQuantity || quantity <= t.maxQuantity)
    );
    total = tier ? tier.pricePerUnit * quantity : this.pricing.basePrice * quantity;
  } else {
    total = this.pricing.basePrice * quantity;
  }

  // Add-ons
  for (const addOnId of addOnIds) {
    const addOn = this.addOns.id(addOnId);
    if (addOn) {
      total += addOn.price;
    }
  }

  // Apply promotion
  if (applyPromo && this.promotions.active && this.promotions.endDate > new Date()) {
    if (total >= (this.promotions.minOrderValue || 0)) {
      if (this.promotions.discountType === 'percentage') {
        total -= total * (this.promotions.discountValue / 100);
      } else if (this.promotions.discountType === 'fixed') {
        total -= this.promotions.discountValue;
      }
    }
  }

  return Math.max(0, total);
};

// Availability check
serviceSchema.methods.isAvailableOn = function(date, timeSlot = null) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const schedule = this.availability.schedule.find(s => s.day === dayName);

  if (!schedule || !schedule.isAvailable) {
    return false;
  }

  if (timeSlot && schedule.startTime && schedule.endTime) {
    const slotTime = timeSlot.split(':').map(Number);
    const startTime = schedule.startTime.split(':').map(Number);
    const endTime = schedule.endTime.split(':').map(Number);

    const slotMinutes = slotTime[0] * 60 + slotTime[1];
    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];

    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  }

  return true;
};

// Status transitions
serviceSchema.methods.submit = async function() {
  if (this.status !== 'draft') {
    throw new Error('Only draft services can be submitted');
  }
  this.status = 'pending_review';
  this.approval.status = 'pending';
  await this.save();
  return this;
};

serviceSchema.methods.approve = async function(reviewerId, notes = '') {
  this.status = 'approved';
  this.approval.status = 'approved';
  this.approval.reviewedBy = reviewerId;
  this.approval.reviewedAt = new Date();
  this.approval.notes = notes;
  this.isActive = true;
  await this.save();
  return this;
};

serviceSchema.methods.reject = async function(reviewerId, reason) {
  this.status = 'rejected';
  this.approval.status = 'rejected';
  this.approval.reviewedBy = reviewerId;
  this.approval.reviewedAt = new Date();
  this.approval.rejectionReason = reason;
  this.isActive = false;
  await this.save();
  return this;
};

serviceSchema.methods.suspend = async function(reason) {
  this.status = 'suspended';
  this.isActive = false;
  this.approval.notes = reason;
  await this.save();
  return this;
};

serviceSchema.methods.archive = async function() {
  this.status = 'archived';
  this.isActive = false;
  await this.save();
  return this;
};

// Feature service
serviceSchema.methods.feature = async function(until, position = null, reason = '') {
  this.featured.isFeatured = true;
  this.featured.featuredAt = new Date();
  this.featured.featuredUntil = until;
  if (position) this.featured.featuredPosition = position;
  this.featured.featuredReason = reason;
  await this.save();
  return this;
};

serviceSchema.methods.unfeature = async function() {
  this.featured.isFeatured = false;
  this.featured.featuredAt = null;
  this.featured.featuredUntil = null;
  this.featured.featuredPosition = null;
  await this.save();
  return this;
};

// External ID management
serviceSchema.methods.linkExternalId = async function(system, externalId, metadata = {}) {
  const existing = this.externalIds.find(e => e.system === system);
  if (existing) {
    existing.externalId = externalId;
    existing.metadata = metadata;
    existing.syncedAt = new Date();
  } else {
    this.externalIds.push({ system, externalId, metadata, syncedAt: new Date() });
  }
  await this.save();
  return this;
};

serviceSchema.methods.getExternalId = function(system) {
  const entry = this.externalIds.find(e => e.system === system);
  return entry ? entry.externalId : null;
};

// Metadata
serviceSchema.methods.setMetadata = async function(key, value) {
  if (!this.metadata) this.metadata = {};
  const keys = key.split('.');
  let current = this.metadata;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  this.markModified('metadata');
  await this.save();
  return this;
};

serviceSchema.methods.getMetadata = function(key, defaultValue = null) {
  if (!this.metadata) return defaultValue;
  const keys = key.split('.');
  let current = this.metadata;
  for (const k of keys) {
    if (current === null || current === undefined) return defaultValue;
    current = current[k];
  }
  return current !== undefined ? current : defaultValue;
};

// ============================================
// BOOKING INSTANCE METHODS
// ============================================

// Status transitions
bookingSchema.methods.confirm = async function(userId) {
  if (this.status !== 'pending') {
    throw new Error('Only pending bookings can be confirmed');
  }
  this.status = 'confirmed';
  this.statusHistory.push({
    status: 'confirmed',
    updatedBy: userId,
    note: 'Booking confirmed'
  });
  await this.save();
  return this;
};

bookingSchema.methods.startService = async function(userId) {
  if (this.status !== 'confirmed') {
    throw new Error('Only confirmed bookings can be started');
  }
  this.status = 'in_progress';
  this.tracking.startedAt = new Date();
  this.statusHistory.push({
    status: 'in_progress',
    updatedBy: userId,
    note: 'Service started'
  });
  await this.save();
  return this;
};

bookingSchema.methods.complete = async function(userId, notes = '') {
  if (this.status !== 'in_progress') {
    throw new Error('Only in-progress bookings can be completed');
  }
  this.status = 'completed';
  this.tracking.completedAt = new Date();
  this.completion.notes = notes;
  this.statusHistory.push({
    status: 'completed',
    updatedBy: userId,
    note: notes || 'Service completed'
  });
  await this.save();

  // Update service analytics
  const Service = mongoose.model('Service');
  const service = await Service.findById(this.service);
  if (service) {
    await service.recordCompletion(this.pricing.totalAmount);
  }

  return this;
};

bookingSchema.methods.cancel = async function(userId, reason, reasonCode = 'other') {
  if (['completed', 'cancelled', 'refunded'].includes(this.status)) {
    throw new Error('This booking cannot be cancelled');
  }

  this.status = 'cancelled';
  this.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: userId,
    reason,
    reasonCode
  };
  this.statusHistory.push({
    status: 'cancelled',
    updatedBy: userId,
    note: reason,
    reason: reasonCode
  });
  await this.save();

  // Update service analytics
  const Service = mongoose.model('Service');
  const service = await Service.findById(this.service);
  if (service) {
    await service.recordCancellation();
  }

  return this;
};

// Reschedule
bookingSchema.methods.reschedule = async function(newDate, userId, reason = '') {
  if (['completed', 'cancelled', 'refunded'].includes(this.status)) {
    throw new Error('This booking cannot be rescheduled');
  }

  this.rescheduling.history.push({
    fromDate: this.bookingDate,
    toDate: newDate,
    requestedBy: userId,
    reason,
    approved: true,
    approvedBy: userId
  });

  this.rescheduling.originalDate = this.rescheduling.originalDate || this.bookingDate;
  this.rescheduling.isRescheduled = true;
  this.rescheduling.rescheduleCount += 1;
  this.bookingDate = newDate;

  this.statusHistory.push({
    status: this.status,
    updatedBy: userId,
    note: `Rescheduled to ${newDate.toISOString()}`
  });

  await this.save();
  return this;
};

// GPS tracking
bookingSchema.methods.updateProviderLocation = async function(coordinates, accuracy = null) {
  this.tracking.providerLocation = {
    coordinates,
    updatedAt: new Date()
  };
  this.tracking.locationHistory.push({
    coordinates,
    accuracy
  });

  // Keep only last 100 locations
  if (this.tracking.locationHistory.length > 100) {
    this.tracking.locationHistory = this.tracking.locationHistory.slice(-100);
  }

  await this.save();
  return this;
};

bookingSchema.methods.markArrived = async function() {
  this.tracking.arrivedAt = new Date();
  await this.save();
  return this;
};

// Dispute management
bookingSchema.methods.openDispute = async function(userId, reason, reasonCode, description) {
  if (this.dispute.hasDispute) {
    throw new Error('A dispute is already open for this booking');
  }

  this.dispute = {
    hasDispute: true,
    status: 'open',
    openedAt: new Date(),
    openedBy: userId,
    reason,
    reasonCode,
    description,
    evidence: [],
    messages: []
  };
  this.status = 'disputed';

  this.statusHistory.push({
    status: 'disputed',
    updatedBy: userId,
    note: `Dispute opened: ${reason}`
  });

  await this.save();
  return this;
};

bookingSchema.methods.addDisputeEvidence = async function(userId, type, url, description = '') {
  if (!this.dispute.hasDispute) {
    throw new Error('No dispute exists for this booking');
  }

  this.dispute.evidence.push({
    type,
    url,
    description,
    uploadedBy: userId
  });

  await this.save();
  return this;
};

bookingSchema.methods.addDisputeMessage = async function(userId, message, isInternal = false) {
  if (!this.dispute.hasDispute) {
    throw new Error('No dispute exists for this booking');
  }

  this.dispute.messages.push({
    sender: userId,
    message,
    isInternal
  });

  await this.save();
  return this;
};

bookingSchema.methods.resolveDispute = async function(userId, outcome, refundAmount = 0, notes = '') {
  if (!this.dispute.hasDispute) {
    throw new Error('No dispute exists for this booking');
  }

  this.dispute.status = 'closed';
  this.dispute.resolution = {
    resolvedAt: new Date(),
    resolvedBy: userId,
    outcome,
    refundAmount,
    notes
  };

  if (refundAmount > 0) {
    this.status = 'refunded';
    this.cancellation.refundAmount = refundAmount;
    this.cancellation.refundStatus = 'pending';
  } else {
    this.status = 'completed';
  }

  this.statusHistory.push({
    status: this.status,
    updatedBy: userId,
    note: `Dispute resolved: ${outcome}`
  });

  await this.save();
  return this;
};

// Reviews
bookingSchema.methods.addClientReview = async function(rating, comment, categories = {}, wouldRecommend = true, photos = []) {
  if (this.status !== 'completed') {
    throw new Error('Can only review completed bookings');
  }

  this.review.client = {
    rating,
    comment,
    createdAt: new Date(),
    categories,
    wouldRecommend,
    photos
  };

  await this.save();

  // Update service rating
  const Service = mongoose.model('Service');
  const service = await Service.findById(this.service);
  if (service) {
    await service.addRating(rating, categories);
  }

  return this;
};

bookingSchema.methods.addProviderReview = async function(rating, comment, wouldWorkAgain = true) {
  if (this.status !== 'completed') {
    throw new Error('Can only review completed bookings');
  }

  this.review.provider = {
    rating,
    comment,
    createdAt: new Date(),
    wouldWorkAgain
  };

  await this.save();
  return this;
};

bookingSchema.methods.respondToReview = async function(message) {
  if (!this.review.client) {
    throw new Error('No client review to respond to');
  }

  this.review.client.response = {
    message,
    respondedAt: new Date()
  };

  await this.save();
  return this;
};

// Payment
bookingSchema.methods.markPaid = async function(amount, transactionId, method) {
  this.payment.status = 'paid';
  this.payment.paidAmount = amount;
  this.payment.transactionId = transactionId;
  this.payment.method = method;
  this.payment.paidAt = new Date();

  await this.save();
  return this;
};

bookingSchema.methods.addTip = async function(amount, method, transactionId = null) {
  this.tip = {
    amount,
    addedAt: new Date(),
    method,
    transactionId
  };

  await this.save();
  return this;
};

// Completion checklist
bookingSchema.methods.updateChecklist = async function(itemIndex, completed, notes = '') {
  if (this.completion.checklist[itemIndex]) {
    this.completion.checklist[itemIndex].completed = completed;
    this.completion.checklist[itemIndex].completedAt = completed ? new Date() : null;
    this.completion.checklist[itemIndex].notes = notes;
    await this.save();
  }
  return this;
};

bookingSchema.methods.signOff = async function(userId, signature = null) {
  this.completion.signedOff = true;
  this.completion.signedOffAt = new Date();
  this.completion.signedOffBy = userId;
  if (signature) this.completion.signature = signature;

  await this.save();
  return this;
};

// External ID management
bookingSchema.methods.linkExternalId = async function(system, externalId, metadata = {}) {
  const existing = this.externalIds.find(e => e.system === system);
  if (existing) {
    existing.externalId = externalId;
    existing.metadata = metadata;
    existing.syncedAt = new Date();
  } else {
    this.externalIds.push({ system, externalId, metadata, syncedAt: new Date() });
  }
  await this.save();
  return this;
};

bookingSchema.methods.getExternalId = function(system) {
  const entry = this.externalIds.find(e => e.system === system);
  return entry ? entry.externalId : null;
};

// Metadata
bookingSchema.methods.setMetadata = async function(key, value) {
  if (!this.metadata) this.metadata = {};
  const keys = key.split('.');
  let current = this.metadata;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  this.markModified('metadata');
  await this.save();
  return this;
};

bookingSchema.methods.getMetadata = function(key, defaultValue = null) {
  if (!this.metadata) return defaultValue;
  const keys = key.split('.');
  let current = this.metadata;
  for (const k of keys) {
    if (current === null || current === undefined) return defaultValue;
    current = current[k];
  }
  return current !== undefined ? current : defaultValue;
};

// ============================================
// STATIC METHODS
// ============================================

// Service statics
serviceSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true, status: 'approved' });
};

serviceSchema.statics.findByProvider = function(providerId, includeInactive = false) {
  const query = { provider: providerId };
  if (!includeInactive) {
    query.isActive = true;
    query.status = 'approved';
  }
  return this.find(query);
};

serviceSchema.statics.findFeatured = function(limit = 10) {
  return this.find({
    'featured.isFeatured': true,
    'featured.featuredUntil': { $gt: new Date() },
    isActive: true,
    status: 'approved'
  })
    .sort({ 'featured.featuredPosition': 1 })
    .limit(limit);
};

serviceSchema.statics.findByCategory = function(categoryId, options = {}) {
  const { page = 1, limit = 20, sortBy = 'rating.average', sortOrder = -1 } = options;

  return this.find({
    category: categoryId,
    isActive: true,
    status: 'approved'
  })
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit);
};

serviceSchema.statics.findNearby = function(coordinates, maxDistance = 50, options = {}) {
  const { page = 1, limit = 20 } = options;

  return this.find({
    'serviceArea.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    },
    isActive: true,
    status: 'approved'
  })
    .skip((page - 1) * limit)
    .limit(limit);
};

serviceSchema.statics.search = function(query, options = {}) {
  const { page = 1, limit = 20, category = null, minPrice = null, maxPrice = null } = options;

  const filter = {
    $text: { $search: query },
    isActive: true,
    status: 'approved'
  };

  if (category) filter.category = category;
  if (minPrice !== null) filter['pricing.basePrice'] = { $gte: minPrice };
  if (maxPrice !== null) {
    filter['pricing.basePrice'] = filter['pricing.basePrice'] || {};
    filter['pricing.basePrice'].$lte = maxPrice;
  }

  return this.find(filter, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .skip((page - 1) * limit)
    .limit(limit);
};

serviceSchema.statics.findByExternalId = function(system, externalId) {
  return this.findOne({
    'externalIds.system': system,
    'externalIds.externalId': externalId
  });
};

serviceSchema.statics.getPendingApproval = function() {
  return this.find({ status: 'pending_review' }).sort({ createdAt: 1 });
};

serviceSchema.statics.getTopRated = function(limit = 10) {
  return this.find({
    isActive: true,
    status: 'approved',
    'rating.count': { $gte: 5 }
  })
    .sort({ 'rating.average': -1, 'rating.count': -1 })
    .limit(limit);
};

// Booking statics
bookingSchema.statics.findByBookingNumber = function(bookingNumber) {
  return this.findOne({ bookingNumber });
};

bookingSchema.statics.findByClient = function(clientId, options = {}) {
  const { status = null, page = 1, limit = 20 } = options;

  const query = { client: clientId };
  if (status) query.status = status;

  return this.find(query)
    .sort({ bookingDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('service', 'title slug images pricing')
    .populate('provider', 'userId');
};

bookingSchema.statics.findByProvider = function(providerId, options = {}) {
  const { status = null, page = 1, limit = 20, startDate = null, endDate = null } = options;

  const query = { provider: providerId };
  if (status) query.status = status;
  if (startDate || endDate) {
    query.bookingDate = {};
    if (startDate) query.bookingDate.$gte = startDate;
    if (endDate) query.bookingDate.$lte = endDate;
  }

  return this.find(query)
    .sort({ bookingDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('service', 'title slug images')
    .populate('client', 'firstName lastName email phoneNumber');
};

bookingSchema.statics.findUpcoming = function(userId, role = 'client', limit = 10) {
  const query = {
    [role]: userId,
    bookingDate: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] }
  };

  return this.find(query)
    .sort({ bookingDate: 1 })
    .limit(limit);
};

bookingSchema.statics.findDisputed = function(options = {}) {
  const { status = null, page = 1, limit = 20 } = options;

  const query = { 'dispute.hasDispute': true };
  if (status) query['dispute.status'] = status;

  return this.find(query)
    .sort({ 'dispute.openedAt': -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

bookingSchema.statics.findRecurring = function(parentBookingId) {
  return this.find({
    'recurring.parentBookingId': parentBookingId
  }).sort({ bookingDate: 1 });
};

bookingSchema.statics.findByExternalId = function(system, externalId) {
  return this.findOne({
    'externalIds.system': system,
    'externalIds.externalId': externalId
  });
};

bookingSchema.statics.getStats = async function(providerId, startDate, endDate) {
  const match = { provider: providerId };
  if (startDate || endDate) {
    match.bookingDate = {};
    if (startDate) match.bookingDate.$gte = startDate;
    if (endDate) match.bookingDate.$lte = endDate;
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: '$pricing.totalAmount' }
      }
    }
  ]);

  return stats.reduce((acc, s) => {
    acc[s._id] = { count: s.count, revenue: s.revenue };
    return acc;
  }, {});
};

// ============================================
// MODEL EXPORTS
// ============================================

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

module.exports = {
  Service,
  Booking,
  // Constants
  SERVICE_STATUSES,
  SERVICE_TYPES,
  PRICING_TYPES,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  DISPUTE_STATUSES,
  RECURRENCE_TYPES,
  DAYS_OF_WEEK
};
