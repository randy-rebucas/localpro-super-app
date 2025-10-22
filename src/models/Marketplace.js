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
    type: [String], // Array of zip codes or cities
    required: true
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
      enum: ['cash', 'card', 'bank_transfer', 'paypal', 'paymaya'],
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

bookingSchema.index({ client: 1 });
bookingSchema.index({ provider: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ client: 1, status: 1 });
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ service: 1, status: 1 });

module.exports = {
  Service: mongoose.model('Service', serviceSchema),
  Booking: mongoose.model('Booking', bookingSchema)
};
