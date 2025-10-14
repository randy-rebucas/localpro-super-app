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
  images: [String],
  documents: [{
    type: {
      type: String,
      enum: ['manual', 'warranty', 'insurance', 'license', 'other']
    },
    url: String,
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
    images: [String]
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
rentalItemSchema.index({ 'location.coordinates': '2dsphere' });
rentalItemSchema.index({ isActive: 1 });

rentalSchema.index({ renter: 1 });
rentalSchema.index({ owner: 1 });
rentalSchema.index({ item: 1 });
rentalSchema.index({ status: 1 });
rentalSchema.index({ 'rentalPeriod.startDate': 1 });

module.exports = {
  RentalItem: mongoose.model('RentalItem', rentalItemSchema),
  Rental: mongoose.model('Rental', rentalSchema)
};
