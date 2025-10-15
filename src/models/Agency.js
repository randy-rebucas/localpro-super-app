const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  logo: {
    type: String, // Cloudinary URL
    default: null
  },
  
  // Contact Information
  contactInfo: {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'Philippines'
      },
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },

  // Business Information
  businessInfo: {
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    taxId: {
      type: String,
      unique: true,
      sparse: true
    },
    businessType: {
      type: String,
      enum: ['sole_proprietorship', 'partnership', 'corporation', 'llc', 'non_profit'],
      default: 'sole_proprietorship'
    },
    industry: {
      type: String,
      enum: ['cleaning', 'maintenance', 'construction', 'logistics', 'healthcare', 'education', 'technology', 'other'],
      required: true
    },
    establishedDate: Date,
    employeeCount: {
      type: Number,
      min: 1,
      default: 1
    }
  },

  // Agency Owner/Admin
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
      default: 'manager'
    },
    permissions: [{
      type: String,
      enum: ['manage_providers', 'manage_bookings', 'view_analytics', 'manage_finances', 'manage_settings']
    }],
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Service Providers
  providers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending'],
      default: 'pending'
    },
    services: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    }],
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 10 // 10% commission
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActiveAt: Date,
    performance: {
      rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      totalBookings: {
        type: Number,
        default: 0
      },
      completedBookings: {
        type: Number,
        default: 0
      },
      cancelledBookings: {
        type: Number,
        default: 0
      },
      totalEarnings: {
        type: Number,
        default: 0
      }
    }
  }],

  // Service Areas
  serviceAreas: [{
    name: String,
    coordinates: [{
      lat: Number,
      lng: Number
    }],
    radius: {
      type: Number,
      default: 10 // km
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Agency Settings
  settings: {
    autoAcceptBookings: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: true
    },
    maxProviders: {
      type: Number,
      default: 50
    },
    workingHours: {
      monday: { start: String, end: String, isActive: Boolean },
      tuesday: { start: String, end: String, isActive: Boolean },
      wednesday: { start: String, end: String, isActive: Boolean },
      thursday: { start: String, end: String, isActive: Boolean },
      friday: { start: String, end: String, isActive: Boolean },
      saturday: { start: String, end: String, isActive: Boolean },
      sunday: { start: String, end: String, isActive: Boolean }
    },
    notificationSettings: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      pushNotifications: { type: Boolean, default: true }
    }
  },

  // Financial Information
  financial: {
    bankAccount: {
      accountNumber: String,
      bankName: String,
      accountHolderName: String,
      routingNumber: String
    },
    paymentSettings: {
      paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'paypal', 'paymaya', 'gcash'],
        default: 'bank_transfer'
      },
      paymentFrequency: {
        type: String,
        enum: ['weekly', 'bi_weekly', 'monthly'],
        default: 'weekly'
      },
      minimumPayout: {
        type: Number,
        default: 100
      }
    },
    earnings: {
      totalEarnings: { type: Number, default: 0 },
      totalCommission: { type: Number, default: 0 },
      pendingPayout: { type: Number, default: 0 },
      lastPayoutDate: Date,
      lastPayoutAmount: { type: Number, default: 0 }
    }
  },

  // Analytics and Performance
  analytics: {
    totalBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    cancelledBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    customerSatisfaction: { type: Number, default: 0 },
    providerRetention: { type: Number, default: 0 },
    monthlyGrowth: { type: Number, default: 0 }
  },

  // Status and Verification
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'pending_verification'
  },
  verificationStatus: {
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    documents: [{
      type: {
        type: String,
        enum: ['business_license', 'tax_certificate', 'insurance', 'other']
      },
      url: String,
      uploadedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
    }]
  },

  // Subscription and Billing
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'professional', 'enterprise'],
      default: 'basic'
    },
    features: [{
      type: String,
      enum: ['unlimited_providers', 'advanced_analytics', 'custom_branding', 'priority_support', 'api_access']
    }],
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    nextBillingDate: Date,
    isActive: { type: Boolean, default: true }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
agencySchema.index({ name: 1 });
agencySchema.index({ 'contactInfo.email': 1 });
agencySchema.index({ 'businessInfo.registrationNumber': 1 });
agencySchema.index({ owner: 1 });
agencySchema.index({ status: 1 });
agencySchema.index({ 'businessInfo.industry': 1 });
agencySchema.index({ 'serviceAreas.coordinates': '2dsphere' });

// Virtual for provider count
agencySchema.virtual('providerCount').get(function() {
  return this.providers.length;
});

// Virtual for active provider count
agencySchema.virtual('activeProviderCount').get(function() {
  return this.providers.filter(p => p.status === 'active').length;
});

// Methods
agencySchema.methods.addProvider = function(userId, services = [], commissionRate = 10) {
  const existingProvider = this.providers.find(p => p.user.toString() === userId.toString());
  if (existingProvider) {
    throw new Error('Provider already exists in this agency');
  }

  this.providers.push({
    user: userId,
    services: services,
    commissionRate: commissionRate,
    status: 'pending'
  });

  return this.save();
};

agencySchema.methods.removeProvider = function(userId) {
  this.providers = this.providers.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

agencySchema.methods.updateProviderStatus = function(userId, status) {
  const provider = this.providers.find(p => p.user.toString() === userId.toString());
  if (!provider) {
    throw new Error('Provider not found in this agency');
  }

  provider.status = status;
  if (status === 'active') {
    provider.lastActiveAt = new Date();
  }

  return this.save();
};

agencySchema.methods.addAdmin = function(userId, role = 'manager', permissions = []) {
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

agencySchema.methods.removeAdmin = function(userId) {
  this.admins = this.admins.filter(a => a.user.toString() !== userId.toString());
  return this.save();
};

agencySchema.methods.updateProviderPerformance = function(userId, bookingData) {
  const provider = this.providers.find(p => p.user.toString() === userId.toString());
  if (!provider) {
    throw new Error('Provider not found in this agency');
  }

  provider.performance.totalBookings += 1;
  if (bookingData.status === 'completed') {
    provider.performance.completedBookings += 1;
    provider.performance.totalEarnings += bookingData.amount || 0;
  } else if (bookingData.status === 'cancelled') {
    provider.performance.cancelledBookings += 1;
  }

  // Update agency analytics
  this.analytics.totalBookings += 1;
  if (bookingData.status === 'completed') {
    this.analytics.completedBookings += 1;
    this.analytics.totalRevenue += bookingData.amount || 0;
  } else if (bookingData.status === 'cancelled') {
    this.analytics.cancelledBookings += 1;
  }

  return this.save();
};

agencySchema.methods.isUserAdmin = function(userId) {
  return this.admins.some(admin => admin.user.toString() === userId.toString()) || 
         this.owner.toString() === userId.toString();
};

agencySchema.methods.hasPermission = function(userId, permission) {
  if (this.owner.toString() === userId.toString()) {
    return true; // Owner has all permissions
  }

  const admin = this.admins.find(a => a.user.toString() === userId.toString());
  return admin && admin.permissions.includes(permission);
};

// Static methods
agencySchema.statics.findByLocation = function(lat, lng, radius = 10) {
  return this.find({
    'serviceAreas.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    },
    status: 'active'
  });
};

agencySchema.statics.findByIndustry = function(industry) {
  return this.find({
    'businessInfo.industry': industry,
    status: 'active'
  });
};

// Pre-save middleware
agencySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Agency', agencySchema);
