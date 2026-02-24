const mongoose = require('mongoose');

const facilityCareServiceSchema = new mongoose.Schema({
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
    enum: ['janitorial', 'landscaping', 'pest_control', 'maintenance', 'security'],
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
      enum: ['hourly', 'monthly', 'per_sqft', 'per_visit', 'contract'],
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
  serviceArea: {
    type: [String], // Array of zip codes or cities
    required: true
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
  features: [String],
  requirements: [String],
  images: [String],
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

const contractSchema = new mongoose.Schema({
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
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacilityCareService',
    required: true
  },
  facility: {
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    size: {
      area: Number,
      unit: { type: String, default: 'sqft' }
    },
    type: {
      type: String,
      enum: ['office', 'retail', 'warehouse', 'residential', 'industrial', 'healthcare', 'educational']
    }
  },
  contractDetails: {
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
      required: true // in months
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'as_needed'],
      required: true
    },
    scope: [String], // List of services included
    specialRequirements: [String]
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually'],
      default: 'monthly'
    },
    additionalFees: [{
      description: String,
      amount: Number,
      frequency: String
    }],
    totalAmount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  payment: {
    terms: {
      type: String,
      enum: ['net_15', 'net_30', 'net_60', 'due_on_receipt'],
      default: 'net_30'
    },
    method: String,
    autoPay: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'suspended', 'completed', 'terminated'],
    default: 'pending'
  },
  performance: {
    serviceLevel: {
      type: String,
      enum: ['standard', 'premium', 'custom'],
      default: 'standard'
    },
    kpis: [{
      metric: String,
      target: String,
      actual: String,
      unit: String
    }]
  },
  documents: [{
    type: {
      type: String,
      enum: ['contract', 'invoice', 'report', 'certificate', 'other']
    },
    name: String,
    url: String,
    uploadedAt: Date
  }],
  reviews: [{
    date: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

const subscriptionSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacilityCareService',
    required: true
  },
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  subscriptionType: {
    type: String,
    enum: ['janitorial', 'landscaping', 'pest_control', 'maintenance', 'comprehensive'],
    required: true
  },
  plan: {
    name: String,
    features: [String],
    frequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly'],
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    nextService: Date,
    lastService: Date,
    serviceHistory: [{
      scheduledDate: Date,
      actualDate: Date,
      status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled']
      },
      notes: String,
      provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active'
  },
  payment: {
    method: String,
    autoPay: { type: Boolean, default: true },
    lastPayment: Date,
    nextPayment: Date,
    paymentHistory: [{
      date: Date,
      amount: Number,
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed']
      },
      transactionId: String
    }]
  },
  preferences: {
    preferredTime: String,
    contactMethod: String,
    specialInstructions: String
  }
}, {
  timestamps: true
});

// Indexes
facilityCareServiceSchema.index({ category: 1 });
facilityCareServiceSchema.index({ provider: 1 });
facilityCareServiceSchema.index({ serviceArea: 1 });
facilityCareServiceSchema.index({ isActive: 1 });

contractSchema.index({ client: 1 });
contractSchema.index({ provider: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ 'contractDetails.startDate': 1, 'contractDetails.endDate': 1 });

subscriptionSchema.index({ client: 1 });
subscriptionSchema.index({ service: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ 'schedule.nextService': 1 });

module.exports = {
  FacilityCareService: mongoose.model('FacilityCareService', facilityCareServiceSchema),
  Contract: mongoose.model('Contract', contractSchema),
  Subscription: mongoose.model('Subscription', subscriptionSchema)
};
