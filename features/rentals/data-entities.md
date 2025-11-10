# Rentals Data Entities

This document provides comprehensive documentation for all rental-related data entities in the LocalPro Super App.

## Table of Contents

- [Overview](#overview)
- [RentalItem Entity](#rentalitem-entity)
- [Rental Entity](#rental-entity)
- [Field Reference](#field-reference)
- [Validation Rules](#validation-rules)
- [Database Indexes](#database-indexes)
- [Relationships](#relationships)

## Overview

The rentals system consists of two main entities:

1. **RentalItem** - Equipment available for rent with detailed specifications and availability
2. **Rental** - Individual rental transactions with payment and logistics information

## RentalItem Entity

The `RentalItem` model represents equipment that can be rented out by owners.

### Schema Definition

```javascript
const rentalItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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
  images: [{
    url: String,
    publicId: String,
    thumbnail: String,
    alt: String
  }],
  documents: [{
    type: {
      type: String,
      enum: ['manual', 'warranty', 'insurance', 'license', 'other']
    },
    url: String,
    publicId: String,
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
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  tags: [String],
  bookings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    },
    totalCost: {
      type: Number,
      required: true
    },
    specialRequests: String,
    contactInfo: {
      phone: String,
      email: String
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  }
}, {
  timestamps: true
});
```

### Field Descriptions

#### Core Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Equipment name |
| `title` | String | Yes | Display title |
| `description` | String | Yes | Detailed description |
| `category` | String | Yes | Equipment category (enum) |
| `subcategory` | String | Yes | Equipment subcategory |
| `owner` | ObjectId | Yes | Reference to User (owner) |

#### Pricing
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pricing.hourly` | Number | No | Hourly rate |
| `pricing.daily` | Number | No | Daily rate |
| `pricing.weekly` | Number | No | Weekly rate |
| `pricing.monthly` | Number | No | Monthly rate |
| `pricing.currency` | String | No | Currency (default: USD) |

#### Availability
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `availability.isAvailable` | Boolean | No | Current availability status |
| `availability.schedule` | Array | No | Unavailable periods |

#### Location
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `location.address` | Object | No | Physical address |
| `location.coordinates` | Object | No | GPS coordinates |
| `location.pickupRequired` | Boolean | No | Pickup required flag |
| `location.deliveryAvailable` | Boolean | No | Delivery available flag |
| `location.deliveryFee` | Number | No | Delivery fee amount |

#### Specifications
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `specifications.brand` | String | No | Equipment brand |
| `specifications.model` | String | No | Equipment model |
| `specifications.year` | Number | No | Manufacturing year |
| `specifications.condition` | String | No | Equipment condition |
| `specifications.features` | Array | No | Equipment features |
| `specifications.dimensions` | Object | No | Physical dimensions |
| `specifications.weight` | Object | No | Equipment weight |

#### Requirements
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requirements.minAge` | Number | No | Minimum renter age |
| `requirements.licenseRequired` | Boolean | No | License requirement flag |
| `requirements.licenseType` | String | No | Required license type |
| `requirements.deposit` | Number | No | Security deposit amount |
| `requirements.insuranceRequired` | Boolean | No | Insurance requirement flag |

#### Media
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | Array | No | Equipment images |
| `documents` | Array | No | Related documents |

#### Maintenance
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `maintenance.lastService` | Date | No | Last service date |
| `maintenance.nextService` | Date | No | Next service due date |
| `maintenance.serviceHistory` | Array | No | Service history records |

#### Social Features
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rating.average` | Number | No | Average rating (0-5) |
| `rating.count` | Number | No | Number of ratings |
| `reviews` | Array | No | User reviews |
| `averageRating` | Number | No | Calculated average rating |

#### Status & Control
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isActive` | Boolean | No | Active status |
| `isFeatured` | Boolean | No | Featured status |
| `views` | Number | No | View count |
| `tags` | Array | No | Search tags |

#### Bookings
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bookings` | Array | No | Embedded booking records |
| `bookings.user` | ObjectId | Yes | Renter reference |
| `bookings.startDate` | Date | Yes | Rental start date |
| `bookings.endDate` | Date | Yes | Rental end date |
| `bookings.quantity` | Number | No | Quantity rented |
| `bookings.totalCost` | Number | Yes | Total rental cost |
| `bookings.status` | String | No | Booking status |

## Rental Entity

The `Rental` model represents individual rental transactions with detailed logistics and payment information.

### Schema Definition

```javascript
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
    images: [{
      url: String,
      publicId: String,
      thumbnail: String
    }]
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
```

### Field Descriptions

#### Core Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `item` | ObjectId | Yes | Reference to RentalItem |
| `renter` | ObjectId | Yes | Reference to User (renter) |
| `owner` | ObjectId | Yes | Reference to User (owner) |

#### Rental Period
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rentalPeriod.startDate` | Date | Yes | Rental start date |
| `rentalPeriod.endDate` | Date | Yes | Rental end date |
| `rentalPeriod.duration` | Number | Yes | Duration in hours |

#### Pricing
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pricing.rate` | Number | Yes | Base rental rate |
| `pricing.period` | String | Yes | Rate period (enum) |
| `pricing.subtotal` | Number | No | Subtotal amount |
| `pricing.deliveryFee` | Number | No | Delivery fee |
| `pricing.deposit` | Number | No | Security deposit |
| `pricing.insuranceFee` | Number | No | Insurance fee |
| `pricing.totalAmount` | Number | No | Total amount |
| `pricing.currency` | String | No | Currency |

#### Pickup & Return
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pickup.location` | Object | No | Pickup location |
| `pickup.scheduledTime` | Date | No | Scheduled pickup time |
| `pickup.actualTime` | Date | No | Actual pickup time |
| `return.scheduledTime` | Date | No | Scheduled return time |
| `return.actualTime` | Date | No | Actual return time |
| `return.condition` | String | No | Return condition |

#### Status & Payment
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | String | No | Rental status |
| `payment.status` | String | No | Payment status |
| `payment.method` | String | No | Payment method |
| `payment.transactionId` | String | No | Transaction ID |

#### Insurance & Communication
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `insurance.isRequired` | Boolean | No | Insurance requirement |
| `insurance.provider` | String | No | Insurance provider |
| `communication` | Array | No | Communication history |
| `review` | Object | No | Rental review |

## Validation Rules

### RentalItem Validation
- `name` and `title` are required and trimmed
- `category` must be one of: `['tools', 'vehicles', 'equipment', 'machinery']`
- `subcategory` is required
- `owner` reference is required
- `pricing.currency` defaults to 'USD'
- `specifications.condition` must be one of: `['excellent', 'good', 'fair', 'poor']`
- `requirements.licenseRequired` and `requirements.insuranceRequired` are boolean
- `rating.average` must be between 0 and 5
- `reviews.rating` must be between 1 and 5

### Rental Validation
- `item`, `renter`, and `owner` references are required
- `rentalPeriod.startDate` and `rentalPeriod.endDate` are required
- `rentalPeriod.startDate` must be before `rentalPeriod.endDate`
- `pricing.rate` and `pricing.period` are required
- `pricing.period` must be one of: `['hourly', 'daily', 'weekly', 'monthly']`
- `status` must be one of: `['pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed']`
- `payment.status` must be one of: `['pending', 'paid', 'refunded', 'partial']`

## Database Indexes

### RentalItem Indexes
```javascript
// Basic indexes
rentalItemSchema.index({ category: 1, subcategory: 1 });
rentalItemSchema.index({ owner: 1 });
rentalItemSchema.index({ isActive: 1 });

// Performance indexes
rentalItemSchema.index({ category: 1, subcategory: 1, isActive: 1 });
rentalItemSchema.index({ owner: 1, isActive: 1, category: 1 });
rentalItemSchema.index({ 'availability.isAvailable': 1, 'availability.schedule.startDate': 1, isActive: 1 });
rentalItemSchema.index({ 'location.address.city': 1, 'location.address.state': 1, isActive: 1 });
rentalItemSchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lng': 1, isActive: 1 });
rentalItemSchema.index({ 'pricing.hourly': 1, 'pricing.daily': 1, 'pricing.weekly': 1, 'pricing.monthly': 1 });
rentalItemSchema.index({ 'specifications.brand': 1, 'specifications.model': 1, isActive: 1 });
rentalItemSchema.index({ 'specifications.condition': 1, category: 1, isActive: 1 });
rentalItemSchema.index({ 'specifications.features': 1, isActive: 1 });
rentalItemSchema.index({ 'requirements.minAge': 1, 'requirements.licenseRequired': 1, isActive: 1 });
rentalItemSchema.index({ 'requirements.deposit': 1, 'requirements.insuranceRequired': 1, isActive: 1 });
rentalItemSchema.index({ tags: 1, isActive: 1 });

// Text search index
rentalItemSchema.index({
  name: 'text',
  title: 'text',
  description: 'text',
  'specifications.brand': 'text',
  'specifications.model': 'text',
  tags: 'text'
});
```

### Rental Indexes
```javascript
// Basic indexes
rentalSchema.index({ renter: 1 });
rentalSchema.index({ owner: 1 });
rentalSchema.index({ item: 1 });
rentalSchema.index({ status: 1 });
rentalSchema.index({ 'rentalPeriod.startDate': 1 });

// Performance indexes
rentalSchema.index({ renter: 1, status: 1, 'rentalPeriod.startDate': 1 });
rentalSchema.index({ item: 1, status: 1, 'rentalPeriod.startDate': 1 });
rentalSchema.index({ 'payment.status': 1, status: 1 });
rentalSchema.index({ 'payment.method': 1, status: 1 });
rentalSchema.index({ createdAt: -1, status: 1 });
rentalSchema.index({ updatedAt: -1, status: 1 });
```

## Relationships

### RentalItem Relationships
- **Many-to-One** with User (via `owner` field)
- **One-to-Many** with embedded Bookings (via `bookings` array)
- **One-to-Many** with embedded Reviews (via `reviews` array)

### Rental Relationships
- **Many-to-One** with RentalItem (via `item` field)
- **Many-to-One** with User (via `renter` field)
- **Many-to-One** with User (via `owner` field)

## Usage Notes

1. **Soft Deletes**: Use `isActive: false` instead of hard deletes
2. **Timestamps**: All entities have automatic `createdAt` and `updatedAt` timestamps
3. **Population**: Always populate related fields when returning data to clients
4. **Validation**: Use Mongoose validation before saving data
5. **Indexing**: Query performance is optimized with strategic indexes
6. **Geospatial**: Location-based queries use MongoDB's geospatial features
7. **Embedded Documents**: Bookings and reviews are embedded for performance
8. **Rating Calculation**: Average rating is calculated and stored for performance
