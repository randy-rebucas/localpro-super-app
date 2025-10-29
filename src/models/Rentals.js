const mongoose = require('mongoose');

const rentalItemSchema = new mongoose.Schema({
  name: {
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
    enum: ['tools', 'vehicles', 'equipment', 'machinery'],
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pricing: {
    hourly: Number,
    daily: Number,
    weekly: Number,
    monthly: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    schedule: [{
      startDate: Date,
      endDate: Date,
      reason: String // 'rented', 'maintenance', 'unavailable'
    }]
  },
  location: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    pickupRequired: { type: Boolean, default: true },
    deliveryAvailable: { type: Boolean, default: false },
    deliveryFee: Number
  },
  specifications: {
    brand: String,
    model: String,
    year: Number,
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    features: [String],
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'inches' }
    },
    weight: {
      value: Number,
      unit: { type: String, default: 'lbs' }
    }
  },
  requirements: {
    minAge: Number,
    licenseRequired: { type: Boolean, default: false },
    licenseType: String,
    deposit: Number,
    insuranceRequired: { type: Boolean, default: false }
  },
  images: [{
    url: String,
    publicId: String,
    thumbnail: String,
    alt: String
  }],
  documents: [{
    type: {
      type: String,
      enum: ['manual', 'warranty', 'insurance', 'license', 'other']
    },
    url: String,
    publicId: String,
    name: String
  }],
  maintenance: {
    lastService: Date,
    nextService: Date,
    serviceHistory: [{
      date: Date,
      type: String,
      description: String,
      cost: Number
    }]
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
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const rentalSchema = new mongoose.Schema({
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
    }
  },
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
    deposit: Number,
    insuranceFee: Number,
    totalAmount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  pickup: {
    location: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    scheduledTime: Date,
    actualTime: Date,
    contactPerson: String,
    contactPhone: String
  },
  return: {
    scheduledTime: Date,
    actualTime: Date,
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'damaged']
    },
    notes: String,
    images: [{
      url: String,
      publicId: String,
      thumbnail: String
    }]
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'partial'],
      default: 'pending'
    },
    method: String,
    transactionId: String,
    paidAt: Date,
    refundedAt: Date
  },
  insurance: {
    isRequired: { type: Boolean, default: false },
    provider: String,
    policyNumber: String,
    coverage: Number
  },
  communication: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date
  }
}, {
  timestamps: true
});

// Indexes
rentalItemSchema.index({ category: 1, subcategory: 1 });
rentalItemSchema.index({ owner: 1 });
// rentalItemSchema.index({ 'location.coordinates': '2dsphere' }); // Temporarily disabled due to coordinate format issues
rentalItemSchema.index({ isActive: 1 });

rentalSchema.index({ renter: 1 });
rentalSchema.index({ owner: 1 });
rentalSchema.index({ item: 1 });
rentalSchema.index({ status: 1 });
rentalSchema.index({ 'rentalPeriod.startDate': 1 });

// Additional performance indexes for rental items
rentalItemSchema.index({ category: 1, subcategory: 1, isActive: 1 }); // Category filtering with status
rentalItemSchema.index({ owner: 1, isActive: 1, category: 1 }); // Owner items by category
rentalItemSchema.index({ 'availability.isAvailable': 1, 'availability.schedule.startDate': 1, isActive: 1 }); // Availability filtering
rentalItemSchema.index({ 'location.address.city': 1, 'location.address.state': 1, isActive: 1 }); // Location filtering
rentalItemSchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lng': 1, isActive: 1 }); // Geospatial filtering
rentalItemSchema.index({ 'pricing.hourly': 1, 'pricing.daily': 1, 'pricing.weekly': 1, 'pricing.monthly': 1 }); // Pricing filtering
rentalItemSchema.index({ 'specifications.brand': 1, 'specifications.model': 1, isActive: 1 }); // Brand/model filtering
rentalItemSchema.index({ 'specifications.condition': 1, category: 1, isActive: 1 }); // Condition filtering
rentalItemSchema.index({ 'specifications.features': 1, isActive: 1 }); // Features filtering
rentalItemSchema.index({ 'requirements.minAge': 1, 'requirements.licenseRequired': 1, isActive: 1 }); // Requirements filtering
rentalItemSchema.index({ 'requirements.deposit': 1, 'requirements.insuranceRequired': 1, isActive: 1 }); // Requirements filtering
rentalItemSchema.index({ tags: 1, isActive: 1 }); // Tags filtering

// Text search index for rental items
rentalItemSchema.index({
  name: 'text',
  description: 'text',
  'specifications.brand': 'text',
  'specifications.model': 'text',
  tags: 'text'
});

// Additional performance indexes for rentals
rentalSchema.index({ client: 1, status: 1, 'rentalPeriod.startDate': 1 }); // Client rentals with date
rentalSchema.index({ item: 1, status: 1, 'rentalPeriod.startDate': 1 }); // Item rentals with date
rentalSchema.index({ 'payment.status': 1, status: 1 }); // Payment status filtering
rentalSchema.index({ 'payment.method': 1, status: 1 }); // Payment method filtering
rentalSchema.index({ 'delivery.address.city': 1, 'delivery.address.state': 1, status: 1 }); // Delivery location filtering
rentalSchema.index({ createdAt: -1, status: 1 }); // Recently created rentals
rentalSchema.index({ updatedAt: -1, status: 1 }); // Recently updated rentals

module.exports = {
  RentalItem: mongoose.model('RentalItem', rentalItemSchema),
  Rental: mongoose.model('Rental', rentalSchema)
};
