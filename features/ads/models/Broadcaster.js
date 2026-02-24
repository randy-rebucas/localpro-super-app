const mongoose = require('mongoose');

const broadcasterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['announcement', 'promotion', 'news', 'update', 'event', 'general'],
    default: 'general'
  },
  category: {
    type: String,
    enum: ['system', 'marketing', 'feature', 'maintenance', 'security', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'providers', 'clients', 'agencies', 'premium', 'verified', 'specific_roles'],
    default: 'all'
  },
  targetRoles: [{
    type: String,
    enum: ['admin', 'provider', 'client', 'agency_admin', 'agency_owner', 'instructor', 'supplier', 'advertiser']
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    thumbnail: String,
    alt: String
  }],
  video: {
    url: String,
    publicId: String,
    thumbnail: String
  },
  link: {
    url: String,
    text: String,
    openInNewTab: {
      type: Boolean,
      default: true
    }
  },
  schedule: {
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    timeSlots: [{
      day: String,
      startTime: String,
      endTime: String
    }]
  },
  location: {
    city: String,
    state: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isSticky: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    totalClicks: {
      type: Number,
      default: 0
    },
    uniqueClicks: {
      type: Number,
      default: 0
    },
    clickThroughRate: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
broadcasterSchema.index({ status: 1, isActive: 1 });
broadcasterSchema.index({ type: 1, category: 1 });
broadcasterSchema.index({ targetAudience: 1, targetRoles: 1 });
broadcasterSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
broadcasterSchema.index({ isFeatured: 1, createdAt: -1 });
broadcasterSchema.index({ isSticky: 1, createdAt: -1 });
broadcasterSchema.index({ author: 1 });
broadcasterSchema.index({ createdAt: -1 });
broadcasterSchema.index({ views: -1 });
broadcasterSchema.index({ clicks: -1 });

// Virtual for checking if broadcaster is currently active
broadcasterSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.isActive &&
         (!this.schedule.startDate || this.schedule.startDate <= now) &&
         (!this.schedule.endDate || this.schedule.endDate > now);
});

// Virtual for checking if broadcaster is expired
broadcasterSchema.virtual('isExpired').get(function() {
  return this.schedule.endDate && this.schedule.endDate <= new Date();
});

// Pre-save middleware
broadcasterSchema.pre('save', function(next) {
  // Update lastModifiedAt
  this.metadata.lastModifiedAt = new Date();
  
  // Increment version on updates
  if (this.isModified() && !this.isNew) {
    this.metadata.version += 1;
  }
  
  // Calculate click-through rate
  if (this.views > 0) {
    this.analytics.clickThroughRate = (this.clicks / this.views) * 100;
  }
  
  next();
});

// Instance method to increment views
broadcasterSchema.methods.incrementViews = function() {
  this.views += 1;
  this.impressions += 1;
  this.analytics.totalViews += 1;
  return this.save();
};

// Instance method to increment clicks
broadcasterSchema.methods.incrementClicks = function() {
  this.clicks += 1;
  this.analytics.totalClicks += 1;
  
  // Recalculate click-through rate
  if (this.views > 0) {
    this.analytics.clickThroughRate = (this.clicks / this.views) * 100;
  }
  
  return this.save();
};

// Instance method to soft delete
broadcasterSchema.methods.softDelete = function(deletedBy) {
  this.metadata.isDeleted = true;
  this.metadata.deletedAt = new Date();
  this.metadata.deletedBy = deletedBy;
  this.status = 'archived';
  this.isActive = false;
  return this.save();
};

// Static method to get active broadcasters
broadcasterSchema.statics.getActiveBroadcasters = function(targetAudience = 'all', userRoles = []) {
  const now = new Date();
  const query = {
    status: 'active',
    isActive: true,
    'metadata.isDeleted': false,
    $and: [
      {
        $or: [
          { 'schedule.startDate': { $lte: now } },
          { 'schedule.startDate': null }
        ]
      },
      {
        $or: [
          { 'schedule.endDate': { $gt: now } },
          { 'schedule.endDate': null }
        ]
      }
    ]
  };

  // Filter by target audience
  if (targetAudience !== 'all') {
    query.$and.push({
      $or: [
        { targetAudience: targetAudience },
        { targetAudience: 'all' }
      ]
    });
  }

  // Filter by user roles if specific roles are targeted
  if (userRoles.length > 0) {
    query.$and.push({ targetRoles: { $in: userRoles } });
  }

  return this.find(query)
    .sort({ isSticky: -1, isFeatured: -1, priority: -1, createdAt: -1 })
    .populate('author', 'firstName lastName email profile.avatar');
};

module.exports = mongoose.model('Broadcaster', broadcasterSchema);

