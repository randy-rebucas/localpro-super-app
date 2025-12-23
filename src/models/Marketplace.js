const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 
      'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 
      'appliance_repair', 'locksmith', 'handyman', 'home_security',
      'pool_maintenance', 'pest_control', 'carpet_cleaning', 'window_cleaning',
      'gutter_cleaning', 'power_washing', 'snow_removal', 'other'
    ],
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pricing: {
    type: {
      type: String,
      enum: ['hourly', 'fixed', 'per_sqft', 'per_item'],
      required: true
    },
    basePrice: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  availability: {
    schedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String,
      endTime: String,
      isAvailable: { type: Boolean, default: true }
    }],
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  serviceArea: {
    coordinates: {
      lat: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    },
    radius: {
      type: Number,
      required: true,
      min: 1, // Minimum 1 km
      max: 1000 // Maximum 1000 km
    }
  },
  images: [{
    url: String,
    publicId: String,
    thumbnail: String,
    alt: String
  }],
  features: [String],
  requirements: [String],
  // Enhanced service features inspired by LocalPro
  serviceType: {
    type: String,
    enum: ['one_time', 'recurring', 'emergency', 'maintenance', 'installation'],
    default: 'one_time'
  },
  estimatedDuration: {
    min: Number, // minimum hours
    max: Number  // maximum hours
  },
  teamSize: {
    type: Number,
    default: 1,
    min: 1
  },
  equipmentProvided: {
    type: Boolean,
    default: true
  },
  materialsIncluded: {
    type: Boolean,
    default: false
  },
  warranty: {
    hasWarranty: { type: Boolean, default: false },
    duration: Number, // in days
    description: String
  },
  insurance: {
    covered: { type: Boolean, default: false },
    coverageAmount: Number
  },
  emergencyService: {
    available: { type: Boolean, default: false },
    surcharge: Number,
    responseTime: String // e.g., "within 2 hours"
  },
  servicePackages: [{
    name: String,
    description: String,
    price: Number,
    features: [String],
    duration: Number
  }],
  addOns: [{
    name: String,
    description: String,
    price: Number,
    category: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Pre-save hook to normalize serviceArea format (backward compatibility)
serviceSchema.pre('save', function(next) {
  // If serviceArea is in old format (array of strings), convert to new format
  if (Array.isArray(this.serviceArea) && this.serviceArea.length > 0 && typeof this.serviceArea[0] === 'string') {
    // Convert old format to new format
    this.serviceArea = this.serviceArea.map(area => {
      // Check if it's a zip code (numeric) or city name
      const isZipCode = /^\d{5}(-\d{4})?$/.test(area.trim());
      
      return {
        name: area.trim(),
        zipCodes: isZipCode ? [area.trim()] : [],
        cities: isZipCode ? [] : [area.trim()],
        // Note: coordinates and radius can be added later via geocoding
        coordinates: null,
        radius: null // in kilometers
      };
    });
  }
  next();
});

const bookingSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  specialInstructions: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  pricing: {
    basePrice: Number,
    additionalFees: [{
      description: String,
      amount: Number
    }],
    totalAmount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'paypal', 'paymaya', 'paymongo'],
      default: 'cash'
    },
    transactionId: String,
    paypalOrderId: String,
    paypalTransactionId: String,
    paymayaReferenceNumber: String,
    paymayaCheckoutId: String,
    paymayaPaymentId: String,
    paymayaInvoiceId: String,
    paymayaTransactionId: String,
    paymongoIntentId: String,
    paymongoChargeId: String,
    paymongoPaymentId: String,
    paidAt: Date
  },
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date,
    // Enhanced review system
    categories: {
      quality: { type: Number, min: 1, max: 5 },
      timeliness: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 }
    },
    wouldRecommend: { type: Boolean, default: false },
    photos: [{
      url: String,
      publicId: String,
      thumbnail: String
    }]
  },
  // Enhanced booking features
  communication: {
    messages: [{
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      message: String,
      timestamp: { type: Date, default: Date.now },
      type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
      }
    }],
    lastMessageAt: Date
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  documents: [{
    name: String,
    url: String,
    publicId: String,
    type: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  beforePhotos: [{
    url: String,
    publicId: String,
    thumbnail: String
  }],
  afterPhotos: [{
    url: String,
    publicId: String,
    thumbnail: String
  }],
  completionNotes: String,
  clientSatisfaction: {
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
serviceSchema.index({ category: 1, subcategory: 1 });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ serviceArea: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ provider: 1, isActive: 1 });
serviceSchema.index({ 'rating.average': -1, 'rating.count': -1 });

// Additional performance indexes for services
serviceSchema.index({ category: 1, subcategory: 1, isActive: 1 }); // Category filtering with status
serviceSchema.index({ provider: 1, isActive: 1, category: 1 }); // Provider services by category
serviceSchema.index({ serviceArea: 1, isActive: 1, category: 1 }); // Service area with category
serviceSchema.index({ 'rating.average': -1, 'rating.count': -1, isActive: 1 }); // Rating with status
serviceSchema.index({ 'pricing.basePrice': 1, category: 1, isActive: 1 }); // Price range filtering
serviceSchema.index({ 'pricing.type': 1, category: 1, isActive: 1 }); // Pricing type filtering
serviceSchema.index({ serviceType: 1, category: 1, isActive: 1 }); // Service type filtering
serviceSchema.index({ 'estimatedDuration.min': 1, 'estimatedDuration.max': 1, isActive: 1 }); // Duration filtering
serviceSchema.index({ teamSize: 1, category: 1, isActive: 1 }); // Team size filtering
serviceSchema.index({ equipmentProvided: 1, materialsIncluded: 1, isActive: 1 }); // Equipment/materials filtering
serviceSchema.index({ 'warranty.hasWarranty': 1, category: 1, isActive: 1 }); // Warranty filtering
serviceSchema.index({ 'insurance.covered': 1, category: 1, isActive: 1 }); // Insurance filtering
serviceSchema.index({ 'emergencyService.available': 1, category: 1, isActive: 1 }); // Emergency service filtering
serviceSchema.index({ features: 1, isActive: 1 }); // Features filtering
serviceSchema.index({ requirements: 1, isActive: 1 }); // Requirements filtering
serviceSchema.index({ createdAt: -1, isActive: 1 }); // Recently added services
serviceSchema.index({ updatedAt: -1, isActive: 1 }); // Recently updated services

// Text search index for services
serviceSchema.index({
  title: 'text',
  description: 'text',
  features: 'text',
  requirements: 'text'
});

bookingSchema.index({ client: 1 });
bookingSchema.index({ provider: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ client: 1, status: 1 });
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ service: 1, status: 1 });

// Additional performance indexes for bookings
bookingSchema.index({ client: 1, status: 1, bookingDate: 1 }); // Client bookings with date
bookingSchema.index({ provider: 1, status: 1, bookingDate: 1 }); // Provider bookings with date
bookingSchema.index({ service: 1, status: 1, bookingDate: 1 }); // Service bookings with date
bookingSchema.index({ status: 1, bookingDate: 1, createdAt: -1 }); // Status with date range
bookingSchema.index({ 'payment.status': 1, status: 1 }); // Payment status filtering
bookingSchema.index({ 'payment.method': 1, status: 1 }); // Payment method filtering
bookingSchema.index({ 'address.city': 1, 'address.state': 1, status: 1 }); // Location-based filtering
bookingSchema.index({ 'review.rating': 1, status: 1 }); // Review rating filtering
bookingSchema.index({ 'review.wouldRecommend': 1, status: 1 }); // Recommendation filtering
bookingSchema.index({ createdAt: -1, status: 1 }); // Recently created bookings
bookingSchema.index({ updatedAt: -1, status: 1 }); // Recently updated bookings

module.exports = {
  Service: mongoose.model('Service', serviceSchema),
  Booking: mongoose.model('Booking', bookingSchema)
};
