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
    enum: ['cleaning', 'plumbing', 'electrical', 'moving', 'other'],
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
  images: [String],
  features: [String],
  requirements: [String],
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
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    method: String,
    transactionId: String,
    paidAt: Date
  },
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
serviceSchema.index({ category: 1, subcategory: 1 });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ serviceArea: 1 });
serviceSchema.index({ isActive: 1 });

bookingSchema.index({ client: 1 });
bookingSchema.index({ provider: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: 1 });

module.exports = {
  Service: mongoose.model('Service', serviceSchema),
  Booking: mongoose.model('Booking', bookingSchema)
};
