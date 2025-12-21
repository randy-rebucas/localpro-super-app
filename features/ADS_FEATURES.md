# Ads Features Documentation

## Overview

The Ads feature enables businesses to create and manage advertising campaigns, track performance, and reach their target audience effectively. It provides a comprehensive advertising platform with campaign management, audience targeting, performance analytics, budget management, and ad moderation capabilities.

## Base Path
`/api/ads`

---

## Core Features

### 1. Ad Campaign Management
- **Campaign Creation** - Create comprehensive advertising campaigns
- **Campaign Types** - Support for multiple ad types:
  - `banner` - Banner advertisements
  - `sponsored_listing` - Sponsored listings
  - `video` - Video advertisements
  - `text` - Text advertisements
  - `interactive` - Interactive advertisements
- **Campaign Categories** - Organize ads by category:
  - `hardware_stores` - Hardware stores
  - `suppliers` - Suppliers
  - `training_schools` - Training schools
  - `services` - Services
  - `products` - Products
- **Campaign Status** - Manage campaign lifecycle:
  - `draft` - Campaign being created
  - `pending` - Awaiting approval
  - `approved` - Approved by admin
  - `active` - Campaign active
  - `paused` - Campaign paused
  - `completed` - Campaign completed
  - `rejected` - Rejected by admin
- **Campaign Updates** - Update campaign details and settings
- **Campaign Deletion** - Soft delete campaigns

### 2. Advertiser Management
- **Advertiser Accounts** - Business advertising accounts
- **Business Information** - Comprehensive business details:
  - Business name
  - Business type
  - Business description
  - Contact information
  - Business address
- **Business Types** - Support for different business types:
  - `hardware_store` - Hardware stores
  - `supplier` - Suppliers
  - `training_school` - Training schools
  - `service_provider` - Service providers
  - `manufacturer` - Manufacturers
- **Verification System** - Business verification with documents
- **Subscription Plans** - Advertiser subscription management:
  - `basic` - Basic plan
  - `premium` - Premium plan
  - `enterprise` - Enterprise plan

### 3. Audience Targeting
- **Demographic Targeting** - Target by demographics:
  - Age range
  - Gender
  - Location
  - Interests
- **Behavioral Targeting** - Target by behavior:
  - User types (providers, clients, both)
  - Activity level (active, moderate, new)
- **Location Targeting** - Geographic targeting:
  - City-level targeting
  - State-level targeting
  - Country-level targeting
  - Coordinate-based targeting
- **Custom Audiences** - Create custom target audiences

### 4. Budget & Bidding Management
- **Budget Configuration** - Set campaign budgets:
  - Total budget
  - Daily budget
  - Currency support
- **Bidding Strategies** - Multiple bidding strategies:
  - `cpc` - Cost per click
  - `cpm` - Cost per mille (thousand impressions)
  - `cpa` - Cost per acquisition
  - `fixed` - Fixed pricing
- **Bid Management** - Set bid amounts and maximum bids
- **Budget Tracking** - Track budget spend and remaining budget
- **Auto-Bidding** - Automatic bid optimization

### 5. Content Management
- **Ad Content** - Rich ad content:
  - Headlines
  - Body text
  - Images
  - Videos
  - Logos
- **Call-to-Action** - Customizable CTAs:
  - CTA text
  - CTA URL
- **Media Upload** - Upload images and videos
- **Media Management** - Manage ad media assets
- **Content Preview** - Preview ad content before publishing

### 6. Scheduling & Timing
- **Campaign Scheduling** - Schedule campaign start and end dates
- **Time Slots** - Set specific time slots for ad display:
  - Day of week
  - Start time
  - End time
- **Date Range** - Define campaign duration
- **Recurring Schedules** - Set up recurring ad schedules

### 7. Performance Tracking & Analytics
- **Impression Tracking** - Track ad impressions
- **Click Tracking** - Track ad clicks
- **Conversion Tracking** - Track conversions
- **Performance Metrics** - Comprehensive metrics:
  - Click-through rate (CTR)
  - Cost per click (CPC)
  - Cost per mille (CPM)
  - Total spend
  - Conversion rate
- **Analytics Dashboard** - Visualize campaign performance
- **Performance Reports** - Generate performance reports

### 8. Featured Ads & Promotions
- **Featured Ads** - Promote ads to featured status
- **Promotion Types** - Different promotion types
- **Promotion Duration** - Set promotion duration
- **Promotion Budget** - Allocate promotion budget
- **Featured Placement** - Priority placement for featured ads

### 9. Ad Moderation
- **Admin Review** - Admin review of ads
- **Approval Process** - Approve or reject ads
- **Rejection Reasons** - Provide rejection reasons
- **Content Moderation** - Content compliance checking
- **Pending Ads** - Manage pending ad queue

### 10. Search & Discovery
- **Ad Browsing** - Browse available ads
- **Category Filtering** - Filter by category
- **Location Filtering** - Filter by location
- **Search Functionality** - Search ads by keywords
- **Featured Ads Display** - Display featured ads prominently

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get all ads | `page`, `limit`, `search`, `category`, `location`, `sortBy`, `sortOrder` |
| GET | `/categories` | Get ad categories | - |
| GET | `/enum-values` | Get enum values | - |
| GET | `/featured` | Get featured ads | `limit` |
| GET | `/:id` | Get ad details | - |
| POST | `/:id/click` | Track ad click | - |

### Authenticated Endpoints - Campaigns

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/` | Create ad campaign | AUTHENTICATED |
| PUT | `/:id` | Update ad campaign | AUTHENTICATED |
| DELETE | `/:id` | Delete ad campaign | AUTHENTICATED |
| POST | `/:id/images` | Upload ad images | AUTHENTICATED |
| DELETE | `/:id/images/:imageId` | Delete ad image | AUTHENTICATED |
| POST | `/:id/promote` | Promote ad | AUTHENTICATED |
| GET | `/my-ads` | Get my ads | AUTHENTICATED |
| GET | `/:id/analytics` | Get ad analytics | AUTHENTICATED |

### Authenticated Endpoints - Admin

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/pending` | Get pending ads | **admin** |
| PUT | `/:id/approve` | Approve ad | **admin** |
| PUT | `/:id/reject` | Reject ad | **admin** |
| GET | `/statistics` | Get ad statistics | **admin** |

---

## Request/Response Examples

### Create Ad Campaign

```http
POST /api/ads
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Hardware Store Sale",
  "description": "50% off all tools this weekend",
  "type": "banner",
  "category": "hardware_stores",
  "targetAudience": {
    "demographics": {
      "ageRange": [25, 65],
      "gender": ["male", "female"],
      "location": ["New York", "California"],
      "interests": ["construction", "diy"]
    },
    "behavior": {
      "userTypes": ["providers", "clients"],
      "activityLevel": "active"
    }
  },
  "location": {
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  },
  "content": {
    "headline": "Special Weekend Offer",
    "body": "Get 50% off all tools and equipment",
    "callToAction": {
      "text": "Shop Now",
      "url": "https://example.com/shop"
    }
  },
  "budget": {
    "total": 1000,
    "daily": 100,
    "currency": "USD"
  },
  "bidding": {
    "strategy": "cpc",
    "bidAmount": 2.50,
    "maxBid": 5.00
  },
  "schedule": {
    "startDate": "2025-01-20T00:00:00.000Z",
    "endDate": "2025-01-31T23:59:59.000Z",
    "timeSlots": [
      {
        "day": "monday",
        "startTime": "09:00",
        "endTime": "17:00"
      },
      {
        "day": "wednesday",
        "startTime": "09:00",
        "endTime": "17:00"
      },
      {
        "day": "friday",
        "startTime": "09:00",
        "endTime": "17:00"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ad created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "Hardware Store Sale",
    "description": "50% off all tools this weekend",
    "type": "banner",
    "category": "hardware_stores",
    "advertiser": "64a1b2c3d4e5f6789012346",
    "budget": {
      "total": 1000,
      "daily": 100,
      "currency": "USD"
    },
    "status": "draft",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Get Ads

```http
GET /api/ads?page=1&limit=20&category=hardware_stores&location=New York
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "pages": 15,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Hardware Store Sale",
      "description": "50% off all tools this weekend",
      "type": "banner",
      "category": "hardware_stores",
      "advertiser": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": {
            "url": "https://example.com/avatar.jpg"
          }
        }
      },
      "budget": {
        "total": 1000,
        "daily": 100,
        "currency": "USD"
      },
      "status": "active",
      "isActive": true,
      "isFeatured": false,
      "views": 150,
      "clicks": 25,
      "impressions": 500,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### Get Ad Details

```http
GET /api/ads/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "Hardware Store Sale",
    "description": "50% off all tools this weekend",
    "type": "banner",
    "category": "hardware_stores",
    "advertiser": {
      "_id": "64a1b2c3d4e5f6789012346",
      "firstName": "John",
      "lastName": "Doe",
      "profile": {
        "avatar": {
          "url": "https://example.com/avatar.jpg"
        },
        "bio": "Hardware store owner"
      }
    },
    "targetAudience": {
      "demographics": {
        "ageRange": [25, 65],
        "gender": ["male", "female"],
        "location": ["New York", "California"]
      },
      "behavior": {
        "userTypes": ["providers", "clients"],
        "activityLevel": "active"
      }
    },
    "location": {
      "city": "New York",
      "state": "NY",
      "country": "USA"
    },
    "images": [
      {
        "url": "https://example.com/ad-image.jpg",
        "publicId": "ad_image_123",
        "thumbnail": "https://example.com/ad-image-thumb.jpg"
      }
    ],
    "content": {
      "headline": "Special Weekend Offer",
      "body": "Get 50% off all tools and equipment",
      "callToAction": {
        "text": "Shop Now",
        "url": "https://example.com/shop"
      }
    },
    "budget": {
      "total": 1000,
      "daily": 100,
      "currency": "USD"
    },
    "bidding": {
      "strategy": "cpc",
      "bidAmount": 2.50,
      "maxBid": 5.00
    },
    "schedule": {
      "startDate": "2025-01-20T00:00:00.000Z",
      "endDate": "2025-01-31T23:59:59.000Z",
      "timeSlots": [
        {
          "day": "monday",
          "startTime": "09:00",
          "endTime": "17:00"
        }
      ]
    },
    "performance": {
      "impressions": 500,
      "clicks": 25,
      "conversions": 5,
      "spend": 62.50,
      "ctr": 5.0,
      "cpc": 2.50,
      "cpm": 125.00
    },
    "status": "active",
    "isActive": true,
    "isFeatured": false,
    "views": 150,
    "clicks": 25,
    "impressions": 500,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Promote Ad

```http
POST /api/ads/:id/promote
Authorization: Bearer <token>
Content-Type: application/json

{
  "promotionType": "featured",
  "duration": 30,
  "budget": 500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ad promoted successfully",
  "data": {
    "type": "featured",
    "duration": 30,
    "budget": 500,
    "startDate": "2025-01-15T10:00:00.000Z",
    "endDate": "2025-02-14T10:00:00.000Z",
    "status": "active"
  }
}
```

### Get Ad Analytics

```http
GET /api/ads/:id/analytics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "views": 150,
    "clicks": 25,
    "impressions": 500,
    "conversions": 5,
    "spend": 62.50,
    "ctr": 5.0,
    "cpc": 2.50,
    "cpm": 125.00,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Upload Ad Images

```http
POST /api/ads/:id/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "images": [<file1>, <file2>]
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 image(s) uploaded successfully",
  "data": [
    {
      "url": "https://example.com/ad-image1.jpg",
      "publicId": "ad_image_123",
      "thumbnail": "https://example.com/ad-image1-thumb.jpg"
    },
    {
      "url": "https://example.com/ad-image2.jpg",
      "publicId": "ad_image_124",
      "thumbnail": "https://example.com/ad-image2-thumb.jpg"
    }
  ]
}
```

### Get Featured Ads

```http
GET /api/ads/featured?limit=10
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "Featured Hardware Sale",
      "type": "banner",
      "category": "hardware_stores",
      "advertiser": {
        "_id": "64a1b2c3d4e5f6789012346",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": {
            "url": "https://example.com/avatar.jpg"
          }
        }
      },
      "isFeatured": true,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### Get Ad Categories

```http
GET /api/ads/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "hardware_stores",
      "count": 45
    },
    {
      "_id": "suppliers",
      "count": 32
    },
    {
      "_id": "training_schools",
      "count": 18
    },
    {
      "_id": "services",
      "count": 28
    },
    {
      "_id": "products",
      "count": 15
    }
  ]
}
```

### Track Ad Click

```http
POST /api/ads/:id/click
```

**Response:**
```json
{
  "success": true,
  "message": "Click tracked successfully"
}
```

### Approve Ad (Admin)

```http
PUT /api/ads/:id/approve
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Ad approved successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "status": "approved",
    "approval": {
      "reviewedBy": "64a1b2c3d4e5f6789012347",
      "reviewedAt": "2025-01-15T11:00:00.000Z"
    }
  }
}
```

### Get Ad Statistics (Admin)

```http
GET /api/ads/statistics
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAds": 150,
    "adsByStatus": [
      {
        "_id": true,
        "count": 120
      },
      {
        "_id": false,
        "count": 30
      }
    ],
    "adsByCategory": [
      {
        "_id": "hardware_stores",
        "count": 45
      },
      {
        "_id": "suppliers",
        "count": 32
      }
    ],
    "totalViews": {
      "totalViews": 15000,
      "totalClicks": 2500
    },
    "monthlyTrends": [
      {
        "_id": {
          "year": 2025,
          "month": 1
        },
        "count": 30
      }
    ]
  }
}
```

---

## Ad Campaign Flow

### 1. Campaign Creation
- Advertiser creates campaign via `POST /api/ads`
- Campaign created with status `draft`
- Advertiser uploads images and content
- Campaign details configured (budget, targeting, schedule)

### 2. Campaign Submission
- Advertiser submits campaign for review
- Campaign status changes to `pending`
- Campaign added to admin review queue

### 3. Admin Review
- Admin reviews campaign via `GET /api/ads/pending`
- Admin approves or rejects campaign
- Status changes to `approved` or `rejected`

### 4. Campaign Activation
- Approved campaign status changes to `active`
- Campaign starts running based on schedule
- Ads displayed to target audience

### 5. Performance Tracking
- System tracks impressions, clicks, conversions
- Performance metrics calculated (CTR, CPC, CPM)
- Analytics available via `GET /api/ads/:id/analytics`

### 6. Campaign Management
- Advertiser can pause, resume, or update campaign
- Budget tracked and managed
- Campaign completes or expires

---

## Campaign Status Flow

```
draft → pending → approved → active → completed
                    ↓
                 rejected
```

**Status Details:**
- **draft** - Campaign being created
- **pending** - Awaiting admin approval
- **approved** - Approved by admin
- **active** - Campaign active and running
- **paused** - Campaign temporarily paused
- **completed** - Campaign completed
- **rejected** - Rejected by admin

---

## Ad Types

### Banner Ads
- **Type**: `banner`
- **Description**: Standard banner advertisements
- **Use Case**: General promotions, brand awareness

### Sponsored Listings
- **Type**: `sponsored_listing`
- **Description**: Sponsored content listings
- **Use Case**: Product/service listings

### Video Ads
- **Type**: `video`
- **Description**: Video advertisements
- **Use Case**: Rich media campaigns

### Text Ads
- **Type**: `text`
- **Description**: Text-only advertisements
- **Use Case**: Simple promotions

### Interactive Ads
- **Type**: `interactive`
- **Description**: Interactive advertisements
- **Use Case**: Engaging campaigns

---

## Ad Categories

- **hardware_stores** - Hardware stores
- **suppliers** - Suppliers
- **training_schools** - Training schools
- **services** - Services
- **products** - Products

---

## Bidding Strategies

### Cost Per Click (CPC)
- **Strategy**: `cpc`
- **Description**: Pay per click
- **Use Case**: Drive traffic to website

### Cost Per Mille (CPM)
- **Strategy**: `cpm`
- **Description**: Pay per thousand impressions
- **Use Case**: Brand awareness campaigns

### Cost Per Acquisition (CPA)
- **Strategy**: `cpa`
- **Description**: Pay per conversion
- **Use Case**: Performance-based campaigns

### Fixed Pricing
- **Strategy**: `fixed`
- **Description**: Fixed price per placement
- **Use Case**: Premium placements

---

## Data Models

### AdCampaign Model

```javascript
{
  // Core Fields
  advertiser: ObjectId,            // Required, Advertiser reference
  title: String,                   // Required
  description: String,             // Required
  type: String,                    // Required, enum: banner, sponsored_listing, video, text, interactive
  category: String,                 // Required, enum: hardware_stores, suppliers, training_schools, services, products
  
  // Targeting
  targetAudience: {
    demographics: {
      ageRange: [Number],           // [min, max]
      gender: [String],             // ['male', 'female']
      location: [String],           // Cities/states
      interests: [String]           // Interest categories
    },
    behavior: {
      userTypes: [String],          // ['providers', 'clients', 'both']
      activityLevel: String          // 'active', 'moderate', 'new'
    }
  },
  
  // Location
  location: {
    city: String,
    state: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Content
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
  
  // Budget
  budget: {
    total: Number,                  // Required
    daily: Number,
    currency: String                 // Default: USD
  },
  
  // Bidding
  bidding: {
    strategy: String,                // enum: cpc, cpm, cpa, fixed
    bidAmount: Number,
    maxBid: Number
  },
  
  // Schedule
  schedule: {
    startDate: Date,                 // Required
    endDate: Date,                   // Required
    timeSlots: [{
      day: String,                   // Day of week
      startTime: String,             // HH:mm format
      endTime: String                // HH:mm format
    }]
  },
  
  // Performance
  performance: {
    impressions: Number,            // Default: 0
    clicks: Number,                  // Default: 0
    conversions: Number,            // Default: 0
    spend: Number,                   // Default: 0
    ctr: Number,                     // Click-through rate
    cpc: Number,                     // Cost per click
    cpm: Number                      // Cost per mille
  },
  
  // Status
  status: String,                    // enum: draft, pending, approved, active, paused, completed, rejected
  isActive: Boolean,                 // Default: true
  isFeatured: Boolean,                // Default: false
  
  // Approval
  approval: {
    reviewedBy: ObjectId,            // User reference
    reviewedAt: Date,
    rejectionReason: String
  },
  
  // Promotion
  promotion: {
    type: String,
    duration: Number,                // in days
    budget: Number,
    startDate: Date,
    endDate: Date,
    status: String
  },
  
  // Metrics
  views: Number,                      // Default: 0
  clicks: Number,                    // Default: 0
  impressions: Number,               // Default: 0
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Advertiser Model

```javascript
{
  // Core Fields
  user: ObjectId,                    // Required, User reference
  businessName: String,              // Required
  businessType: String,              // Required, enum: hardware_store, supplier, training_school, service_provider, manufacturer
  description: String,               // Required
  
  // Contact
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
  
  // Verification
  verification: {
    isVerified: Boolean,             // Default: false
    documents: [{
      type: String,                   // enum: business_license, tax_certificate, insurance, other
      url: String,
      publicId: String,
      uploadedAt: Date
    }],
    verifiedAt: Date,
    verifiedBy: ObjectId             // User reference
  },
  
  // Subscription
  subscription: {
    plan: String,                    // enum: basic, premium, enterprise
    startDate: Date,
    endDate: Date,
    isActive: Boolean                 // Default: false
  },
  
  // Status
  isActive: Boolean,                  // Default: true
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### AdImpression Model

```javascript
{
  // Core Fields
  campaign: ObjectId,                 // Required, AdCampaign reference
  user: ObjectId,                     // Optional, User reference
  type: String,                       // Required, enum: impression, click, conversion
  
  // Context
  context: {
    page: String,
    section: String,
    position: String
  },
  
  // Device
  device: {
    type: String,                     // 'desktop', 'mobile', 'tablet'
    browser: String,
    os: String
  },
  
  // Location
  location: {
    ip: String,
    country: String,
    city: String
  },
  
  // Timestamp
  timestamp: Date                     // Default: Date.now()
}
```

---

## Search & Filtering

### Query Parameters

**Pagination:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Filters:**
- `search` - Text search in title and description
- `category` - Filter by category
- `location` - Filter by location city
- `type` - Filter by ad type
- `status` - Filter by status
- `isFeatured` - Filter featured ads

**Sorting:**
- `sortBy` - Sort field (default: 'createdAt')
- `sortOrder` - Sort direction 'asc' or 'desc' (default: 'desc')

### Response Format

**List Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "pages": 15,
  "data": [...]
}
```

---

## Key Metrics

- **Total Ads** - Total number of ads
- **Active Ads** - Number of active ads
- **Total Impressions** - Total ad impressions
- **Total Clicks** - Total ad clicks
- **Total Conversions** - Total conversions
- **Total Spend** - Total advertising spend
- **Average CTR** - Average click-through rate
- **Average CPC** - Average cost per click
- **Average CPM** - Average cost per mille
- **Conversion Rate** - Conversion rate percentage

---

## Related Features

The Ads feature integrates with several other features in the LocalPro Super App:

- **User Management** - Advertiser accounts and authentication
- **Finance** - Budget management and billing
- **File Storage** - Image and video storage (Cloudinary)
- **Analytics** - Performance tracking and reporting
- **Email Service** - Campaign notifications
- **Admin Panel** - Ad moderation and management

---

## Common Use Cases

1. **Campaign Creation** - Advertisers create advertising campaigns
2. **Ad Moderation** - Admins review and approve ads
3. **Ad Display** - Ads displayed to target audience
4. **Performance Tracking** - Track impressions, clicks, conversions
5. **Budget Management** - Manage campaign budgets
6. **Featured Promotions** - Promote ads to featured status
7. **Analytics & Reporting** - Generate performance reports
8. **Audience Targeting** - Target specific audiences

---

## Error Handling

**Common Error Codes:**
- `400` - Validation errors (invalid data, missing fields)
- `401` - Unauthorized (no token provided)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (ad doesn't exist)
- `409` - Conflict (duplicate campaign, budget exceeded)
- `500` - Server error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "budget.total",
      "message": "Budget total must be a positive number"
    }
  ]
}
```

---

## Best Practices

### For Advertisers
1. **Clear Content** - Use clear and compelling ad content
2. **Targeting** - Define specific target audiences
3. **Budget Management** - Set appropriate budgets
4. **Performance Monitoring** - Monitor campaign performance regularly
5. **A/B Testing** - Test different ad variations

### For Admins
1. **Content Review** - Review ad content for compliance
2. **Approval Process** - Process approvals promptly
3. **Rejection Reasons** - Provide clear rejection reasons
4. **Performance Monitoring** - Monitor overall ad performance
5. **Policy Enforcement** - Enforce advertising policies

### For Developers
1. **Performance Tracking** - Implement accurate tracking
2. **Budget Validation** - Validate budget constraints
3. **Schedule Management** - Handle schedule conflicts
4. **Caching** - Cache featured ads and categories
5. **Rate Limiting** - Implement rate limiting for tracking endpoints

---

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Upload endpoints**: 10 requests per 15 minutes
- **Analytics endpoints**: 50 requests per 15 minutes
- **Tracking endpoints**: 200 requests per 15 minutes

---

## Caching

- **Featured ads**: Cached for 5 minutes
- **Categories**: Cached for 10 minutes
- **Statistics**: Cached for 1 hour
- **Ad details**: Cached for 2 minutes

---

*For detailed implementation guidance, see the individual documentation files in the `features/ads/` and `docs/features/` directories.*

