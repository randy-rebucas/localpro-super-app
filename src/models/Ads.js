const mongoose = require('mongoose');

const advertiserSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['hardware_store', 'supplier', 'training_school', 'service_provider', 'manufacturer'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  contact: {
    email: String,
    phone: String,
    website: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  verification: {
    isVerified: { type: Boolean, default: false },
    documents: [{
      type: {
        type: String,
        enum: ['business_license', 'tax_certificate', 'insurance', 'other']
      },
      url: String,
      uploadedAt: Date
    }],
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const adCampaignSchema = new mongoose.Schema({
  advertiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertiser',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['banner', 'sponsored_listing', 'video', 'text', 'interactive'],
    required: true
  },
  category: {
    type: String,
    enum: ['hardware_stores', 'suppliers', 'training_schools', 'services', 'products'],
    required: true
  },
  targetAudience: {
    demographics: {
      ageRange: [Number],
      gender: [String],
      location: [String],
      interests: [String]
    },
    behavior: {
      userTypes: [String], // ['providers', 'clients', 'both']
      activityLevel: String // 'active', 'moderate', 'new'
    }
  },
  content: {
    headline: String,
    body: String,
    images: [String],
    video: String,
    callToAction: {
      text: String,
      url: String
    },
    logo: String
  },
  budget: {
    total: {
      type: Number,
      required: true
    },
    daily: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  bidding: {
    strategy: {
      type: String,
      enum: ['cpc', 'cpm', 'cpa', 'fixed'],
      default: 'cpc'
    },
    bidAmount: Number,
    maxBid: Number
  },
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    timeSlots: [{
      day: String,
      startTime: String,
      endTime: String
    }]
  },
  performance: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 }, // click-through rate
    cpc: { type: Number, default: 0 }, // cost per click
    cpm: { type: Number, default: 0 }  // cost per mille
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'active', 'paused', 'completed', 'rejected'],
    default: 'draft'
  },
  approval: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    notes: String,
    rejectionReason: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const adImpressionSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdCampaign',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['impression', 'click', 'conversion'],
    required: true
  },
  context: {
    page: String,
    section: String,
    position: String
  },
  device: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop']
  },
  location: {
    ip: String,
    country: String,
    city: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
advertiserSchema.index({ user: 1 });
advertiserSchema.index({ businessType: 1 });
advertiserSchema.index({ 'verification.isVerified': 1 });

adCampaignSchema.index({ advertiser: 1 });
adCampaignSchema.index({ category: 1 });
adCampaignSchema.index({ status: 1 });
adCampaignSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });

adImpressionSchema.index({ campaign: 1 });
adImpressionSchema.index({ user: 1 });
adImpressionSchema.index({ type: 1 });
adImpressionSchema.index({ timestamp: -1 });

module.exports = {
  Advertiser: mongoose.model('Advertiser', advertiserSchema),
  AdCampaign: mongoose.model('AdCampaign', adCampaignSchema),
  AdImpression: mongoose.model('AdImpression', adImpressionSchema)
};
