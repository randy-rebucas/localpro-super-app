const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const partnerSchema = new mongoose.Schema({
  // Basic Partner Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Unique slug for third-party app login
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 50
  },

  // Contact Information
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },

  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },

  // Business Information
  businessInfo: {
    companyName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    website: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 50
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
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

  // API Integration Credentials
  apiCredentials: {
    clientId: {
      type: String,
      unique: true,
      sparse: true
    },
    clientSecret: {
      type: String,
      select: false // Don't include in queries by default
    },
    apiKey: {
      type: String,
      unique: true,
      sparse: true
    },
    webhookUrl: {
      type: String,
      trim: true
    },
    callbackUrl: {
      type: String,
      trim: true
    }
  },

  // Partner Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive', 'rejected'],
    default: 'pending'
  },

  // Onboarding Process
  onboarding: {
    completed: {
      type: Boolean,
      default: false
    },
    steps: [{
      step: {
        type: String,
        enum: ['basic_info', 'business_info', 'api_setup', 'verification', 'activation']
      },
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      data: mongoose.Schema.Types.Mixed
    }],
    currentStep: {
      type: String,
      enum: ['basic_info', 'business_info', 'api_setup', 'verification', 'activation'],
      default: 'basic_info'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date
  },

  // Verification & Compliance
  verification: {
    emailVerified: {
      type: Boolean,
      default: false
    },
    phoneVerified: {
      type: Boolean,
      default: false
    },
    businessVerified: {
      type: Boolean,
      default: false
    },
    documents: [{
      type: {
        type: String,
        enum: ['business_registration', 'tax_id', 'contract', 'other']
      },
      name: String,
      url: String,
      publicId: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },

  // Usage & Analytics
  usage: {
    totalRequests: {
      type: Number,
      default: 0
    },
    monthlyRequests: {
      type: Number,
      default: 0
    },
    lastRequestAt: Date,
    apiLimits: {
      monthlyLimit: {
        type: Number,
        default: 10000
      },
      burstLimit: {
        type: Number,
        default: 100
      }
    }
  },

  // Admin Management
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  notes: [{
    content: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Metadata
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },

  // Soft delete
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
partnerSchema.index({ slug: 1 }); // Unique slug index already exists
partnerSchema.index({ email: 1 }); // Unique email index already exists
partnerSchema.index({ status: 1 });
partnerSchema.index({ 'onboarding.completed': 1 });
partnerSchema.index({ 'apiCredentials.clientId': 1 }, { sparse: true });
partnerSchema.index({ 'apiCredentials.apiKey': 1 }, { sparse: true });
partnerSchema.index({ createdAt: -1 });
partnerSchema.index({ 'businessInfo.industry': 1 });
partnerSchema.index({ tags: 1 });
partnerSchema.index({ isActive: 1, deleted: 1 });

// Text search index
partnerSchema.index({
  name: 'text',
  'businessInfo.companyName': 'text',
  'businessInfo.description': 'text',
  'businessInfo.industry': 'text'
});

// Pre-save middleware for slug generation
partnerSchema.pre('save', async function(next) {
  // Generate slug if not provided or name changed
  if (this.isNew || this.isModified('name')) {
    if (!this.slug && this.name) {
      let baseSlug = this.generateSlug(this.name);
      let slug = baseSlug;
      let counter = 1;

      // Ensure unique slug
      while (await mongoose.model('Partner').findOne({ slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      this.slug = slug;
    }
  }

  // Generate API credentials if onboarding is completed and credentials don't exist
  if (this.onboarding && this.onboarding.completed && !this.apiCredentials.clientId) {
    this.apiCredentials.clientId = uuidv4();
    this.apiCredentials.clientSecret = uuidv4();
    this.apiCredentials.apiKey = uuidv4();
  }

  // Update onboarding progress
  if (this.onboarding && this.onboarding.steps) {
    const completedSteps = this.onboarding.steps.filter(step => step.completed).length;
    const totalSteps = 5; // basic_info, business_info, api_setup, verification, activation
    this.onboarding.progress = Math.round((completedSteps / totalSteps) * 100);

    // Mark onboarding as completed if all steps are done
    if (completedSteps === totalSteps && !this.onboarding.completed) {
      this.onboarding.completed = true;
      this.onboarding.completedAt = new Date();
    }
  }

  next();
});

// Instance methods
partnerSchema.methods.generateSlug = function(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 50); // Limit length
};

partnerSchema.methods.generateApiCredentials = function() {
  this.apiCredentials.clientId = uuidv4();
  this.apiCredentials.clientSecret = uuidv4();
  this.apiCredentials.apiKey = uuidv4();
  return this.save();
};

partnerSchema.methods.verifyCredentials = function(clientId, clientSecret) {
  return this.apiCredentials.clientId === clientId &&
         this.apiCredentials.clientSecret === clientSecret;
};

partnerSchema.methods.updateUsage = function(requestCount = 1) {
  this.usage.totalRequests += requestCount;
  this.usage.monthlyRequests += requestCount;
  this.usage.lastRequestAt = new Date();
  return this.save();
};

partnerSchema.methods.addNote = function(content, addedBy) {
  this.notes.push({
    content,
    addedBy,
    addedAt: new Date()
  });
  return this.save();
};

partnerSchema.methods.completeOnboardingStep = function(step, data = {}) {
  const stepIndex = this.onboarding.steps.findIndex(s => s.step === step);
  if (stepIndex >= 0) {
    this.onboarding.steps[stepIndex].completed = true;
    this.onboarding.steps[stepIndex].completedAt = new Date();
    this.onboarding.steps[stepIndex].data = data;
  } else {
    this.onboarding.steps.push({
      step,
      completed: true,
      completedAt: new Date(),
      data
    });
  }

  // Update current step
  const stepOrder = ['basic_info', 'business_info', 'api_setup', 'verification', 'activation'];
  const currentStepIndex = stepOrder.indexOf(step);
  if (currentStepIndex < stepOrder.length - 1) {
    this.onboarding.currentStep = stepOrder[currentStepIndex + 1];
  }

  return this.save();
};

partnerSchema.methods.softDelete = function(deletedBy) {
  this.deleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.isActive = false;
  return this.save();
};

partnerSchema.methods.restore = function() {
  this.deleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  this.isActive = true;
  return this.save();
};

// Static methods
partnerSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, deleted: { $ne: true } });
};

partnerSchema.statics.findActive = function() {
  return this.find({ status: 'active', isActive: true, deleted: { $ne: true } });
};

partnerSchema.statics.findPendingOnboarding = function() {
  return this.find({
    'onboarding.completed': false,
    status: { $in: ['pending', 'active'] },
    deleted: { $ne: true }
  });
};

partnerSchema.statics.generateSlug = function(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
};

module.exports = mongoose.model('Partner', partnerSchema);
