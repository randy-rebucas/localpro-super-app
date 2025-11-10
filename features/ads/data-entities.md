# Ads Data Entities

This document provides comprehensive documentation for all advertising-related data entities in the LocalPro Super App.

## Table of Contents

- [Overview](#overview)
- [Advertiser Entity](#advertiser-entity)
- [Ad Campaign Entity](#ad-campaign-entity)
- [Ad Impression Entity](#ad-impression-entity)
- [Field Reference](#field-reference)
- [Validation Rules](#validation-rules)
- [Database Indexes](#database-indexes)
- [Relationships](#relationships)

## Overview

The advertising system consists of three main entities:

1. **Advertiser** - Business accounts that create and manage ads
2. **AdCampaign** - Individual advertising campaigns with content and targeting
3. **AdImpression** - Tracking data for impressions, clicks, and conversions

## Advertiser Entity

The `Advertiser` model represents business accounts that can create and manage advertising campaigns.

### Schema Definition

```javascript
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
      publicId: String,
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
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user` | ObjectId | Yes | Reference to User account |
| `businessName` | String | Yes | Official business name |
| `businessType` | String | Yes | Type of business (enum) |
| `description` | String | Yes | Business description |
| `contact.email` | String | No | Business email |
| `contact.phone` | String | No | Business phone |
| `contact.website` | String | No | Business website |
| `contact.address` | Object | No | Business address details |
| `verification.isVerified` | Boolean | No | Verification status |
| `verification.documents` | Array | No | Verification documents |
| `subscription.plan` | String | No | Subscription plan type |
| `subscription.isActive` | Boolean | No | Subscription status |
| `isActive` | Boolean | No | Account active status |

## Ad Campaign Entity

The `AdCampaign` model represents individual advertising campaigns with content, targeting, and performance data.

### Schema Definition

```javascript
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
  location: {
    city: String,
    state: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  images: [{
    url: String,
    publicId: String,
    thumbnail: String
  }],
  content: {
    headline: String,
    body: String,
    images: [{
      url: String,
      publicId: String,
      thumbnail: String
    }],
    video: {
      url: String,
      publicId: String,
      thumbnail: String
    },
    callToAction: {
      text: String,
      url: String
    },
    logo: {
      url: String,
      publicId: String,
      thumbnail: String
    }
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
  },
  isFeatured: {
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
  promotion: {
    type: {
      type: String,
      enum: ['featured', 'sponsored', 'boosted']
    },
    duration: Number, // in days
    budget: Number,
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active'
    }
  }
}, {
  timestamps: true
});
```

### Field Descriptions

#### Core Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `advertiser` | ObjectId | Yes | Reference to Advertiser |
| `title` | String | Yes | Campaign title |
| `description` | String | Yes | Campaign description |
| `type` | String | Yes | Ad type (enum) |
| `category` | String | Yes | Ad category (enum) |

#### Targeting & Location
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetAudience.demographics` | Object | No | Demographic targeting |
| `targetAudience.behavior` | Object | No | Behavioral targeting |
| `location` | Object | No | Geographic targeting |

#### Content & Media
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | Array | No | Campaign images |
| `content.headline` | String | No | Ad headline |
| `content.body` | String | No | Ad body text |
| `content.video` | Object | No | Video content |
| `content.callToAction` | Object | No | CTA button/link |

#### Budget & Bidding
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `budget.total` | Number | Yes | Total budget |
| `budget.daily` | Number | No | Daily budget limit |
| `budget.currency` | String | No | Currency (default: USD) |
| `bidding.strategy` | String | No | Bidding strategy |
| `bidding.bidAmount` | Number | No | Bid amount |

#### Performance & Analytics
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `performance.impressions` | Number | No | Total impressions |
| `performance.clicks` | Number | No | Total clicks |
| `performance.conversions` | Number | No | Total conversions |
| `performance.ctr` | Number | No | Click-through rate |
| `views` | Number | No | Total views |
| `clicks` | Number | No | Total clicks |
| `impressions` | Number | No | Total impressions |

#### Status & Control
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | String | No | Campaign status |
| `isActive` | Boolean | No | Active status |
| `isFeatured` | Boolean | No | Featured status |
| `promotion` | Object | No | Promotion details |

## Ad Impression Entity

The `AdImpression` model tracks user interactions with ads for analytics and billing.

### Schema Definition

```javascript
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
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `campaign` | ObjectId | Yes | Reference to AdCampaign |
| `user` | ObjectId | No | Reference to User (if logged in) |
| `type` | String | Yes | Interaction type (enum) |
| `context.page` | String | No | Page where ad was shown |
| `context.section` | String | No | Section within page |
| `context.position` | String | No | Position within section |
| `device` | String | No | Device type |
| `location.ip` | String | No | User IP address |
| `location.country` | String | No | User country |
| `location.city` | String | No | User city |
| `timestamp` | Date | No | Interaction timestamp |

## Validation Rules

### Advertiser Validation
- `businessName` must be provided and trimmed
- `businessType` must be one of the defined enum values
- `description` is required
- `verification.documents.type` must be valid enum value
- `subscription.plan` must be valid enum value

### Ad Campaign Validation
- `title` and `description` are required
- `type` must be one of: `['banner', 'sponsored_listing', 'video', 'text', 'interactive']`
- `category` must be one of: `['hardware_stores', 'suppliers', 'training_schools', 'services', 'products']`
- `budget.total` is required and must be a positive number
- `schedule.startDate` and `schedule.endDate` are required
- `schedule.startDate` must be before `schedule.endDate`
- `bidding.strategy` must be one of: `['cpc', 'cpm', 'cpa', 'fixed']`
- `status` must be one of: `['draft', 'pending', 'approved', 'active', 'paused', 'completed', 'rejected']`

### Ad Impression Validation
- `campaign` reference is required
- `type` must be one of: `['impression', 'click', 'conversion']`
- `device` must be one of: `['mobile', 'tablet', 'desktop']`

## Database Indexes

### Advertiser Indexes
```javascript
advertiserSchema.index({ user: 1 });
advertiserSchema.index({ businessType: 1 });
advertiserSchema.index({ 'verification.isVerified': 1 });
```

### Ad Campaign Indexes
```javascript
adCampaignSchema.index({ advertiser: 1 });
adCampaignSchema.index({ category: 1 });
adCampaignSchema.index({ status: 1 });
adCampaignSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
adCampaignSchema.index({ isActive: 1 });
adCampaignSchema.index({ isFeatured: 1 });
```

### Ad Impression Indexes
```javascript
adImpressionSchema.index({ campaign: 1 });
adImpressionSchema.index({ user: 1 });
adImpressionSchema.index({ type: 1 });
adImpressionSchema.index({ timestamp: -1 });
```

## Relationships

### Advertiser Relationships
- **One-to-One** with User (via `user` field)
- **One-to-Many** with AdCampaign (via `advertiser` field)

### Ad Campaign Relationships
- **Many-to-One** with Advertiser (via `advertiser` field)
- **One-to-Many** with AdImpression (via `campaign` field)

### Ad Impression Relationships
- **Many-to-One** with AdCampaign (via `campaign` field)
- **Many-to-One** with User (via `user` field, optional)

## Usage Notes

1. **Soft Deletes**: Use `isActive: false` instead of hard deletes
2. **Timestamps**: All entities have automatic `createdAt` and `updatedAt` timestamps
3. **Population**: Always populate related fields when returning data to clients
4. **Validation**: Use Mongoose validation before saving data
5. **Indexing**: Query performance is optimized with strategic indexes
6. **Analytics**: Track all interactions through AdImpression entity
