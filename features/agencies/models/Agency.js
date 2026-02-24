const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'supervisor'],
      default: 'admin'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    permissions: [String]
  }],
  providers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending'],
      default: 'pending'
    },
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 10
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    performance: {
      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalJobs: {
        type: Number,
        default: 0
      },
      completedJobs: {
        type: Number,
        default: 0
      },
      cancellationRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    }
  }],
  contact: {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
      // Note: Agency contact phone is not required to be unique.
      // It may be the same as the owner's personal phoneNumber (which is unique in User model).
    },
    website: String,
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
    }
  },
  business: {
    type: {
      type: String,
      enum: ['sole_proprietorship', 'partnership', 'corporation', 'llc', 'nonprofit'],
      default: 'sole_proprietorship'
    },
    registrationNumber: String,
    taxId: String,
    licenseNumber: String,
    insurance: {
      provider: String,
      policyNumber: String,
      coverageAmount: Number,
      expiryDate: Date
    }
  },
  serviceAreas: [{
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    radius: Number, // in kilometers
    zipCodes: [String]
  }],
  services: [{
    category: {
      type: String,
      enum: [
        'cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 
        'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 
        'appliance_repair', 'locksmith', 'handyman', 'home_security',
        'pool_maintenance', 'pest_control', 'carpet_cleaning', 'window_cleaning',
        'gutter_cleaning', 'power_washing', 'snow_removal', 'other'
      ]
    },
    subcategories: [String],
    pricing: {
      baseRate: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    }
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'professional', 'enterprise'],
      default: 'basic'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    features: [String]
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    documents: [{
      type: {
        type: String,
        enum: ['business_license', 'insurance_certificate', 'tax_certificate', 'other']
      },
      url: String,
      publicId: String,
      filename: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  analytics: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    monthlyStats: [{
      month: String,
      year: Number,
      bookings: Number,
      revenue: Number,
      newProviders: Number
    }]
  },
  settings: {
    autoApproveProviders: {
      type: Boolean,
      default: false
    },
    requireProviderVerification: {
      type: Boolean,
      default: true
    },
    defaultCommissionRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },
    notificationPreferences: {
      email: {
        newBookings: { type: Boolean, default: true },
        providerUpdates: { type: Boolean, default: true },
        paymentUpdates: { type: Boolean, default: true }
      },
      sms: {
        newBookings: { type: Boolean, default: false },
        urgentUpdates: { type: Boolean, default: true }
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
agencySchema.index({ owner: 1 });
agencySchema.index({ 'providers.user': 1 });
// agencySchema.index({ 'serviceAreas.coordinates': '2dsphere' }); // Temporarily disabled due to coordinate format issues
agencySchema.index({ isActive: 1 });

// Virtual for provider count
agencySchema.virtual('providerCount').get(function() {
  return this.providers.length;
});

// Virtual for active provider count
agencySchema.virtual('activeProviderCount').get(function() {
  return this.providers.filter(p => p.status === 'active').length;
});

// Method to add provider
agencySchema.methods.addProvider = function(userId, commissionRate = 10) {
  const existingProvider = this.providers.find(p => p.user.toString() === userId.toString());
  if (existingProvider) {
    throw new Error('Provider already exists in this agency');
  }
  
  this.providers.push({
    user: userId,
    commissionRate: commissionRate,
    status: 'pending'
  });
  
  return this.save();
};

// Method to update provider status
agencySchema.methods.updateProviderStatus = function(userId, status) {
  const provider = this.providers.find(p => p.user.toString() === userId.toString());
  if (!provider) {
    throw new Error('Provider not found in this agency');
  }
  
  provider.status = status;
  return this.save();
};

// Method to update provider performance
agencySchema.methods.updateProviderPerformance = function(userId, performanceData) {
  const provider = this.providers.find(p => p.user.toString() === userId.toString());
  if (!provider) {
    throw new Error('Provider not found in this agency');
  }
  
  // Agency stores its own performance metrics for providers
  // This is separate from the Provider model's performance
  Object.assign(provider.performance, performanceData);
  return this.save();
};

// Method to add admin
agencySchema.methods.addAdmin = function(userId, role = 'admin', permissions = []) {
  const existingAdmin = this.admins.find(a => a.user.toString() === userId.toString());
  if (existingAdmin) {
    throw new Error('User is already an admin of this agency');
  }
  
  this.admins.push({
    user: userId,
    role: role,
    permissions: permissions
  });
  
  return this.save();
};

// Method to remove admin
agencySchema.methods.removeAdmin = function(userId) {
  this.admins = this.admins.filter(a => a.user.toString() !== userId.toString());
  return this.save();
};

// Method to check if user is admin
agencySchema.methods.isAdmin = function(userId) {
  return this.admins.some(a => a.user.toString() === userId.toString());
};

// Method to check if user is provider
agencySchema.methods.isProvider = function(userId) {
  return this.providers.some(p => p.user.toString() === userId.toString());
};

// Method to check if user has access
agencySchema.methods.hasAccess = function(userId) {
  return this.owner.toString() === userId.toString() || 
         this.isAdmin(userId) || 
         this.isProvider(userId);
};

module.exports = mongoose.model('Agency', agencySchema);