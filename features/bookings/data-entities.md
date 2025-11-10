# Bookings Data Entities

## Overview

The Bookings feature uses two main data entities to manage services and bookings. These entities are designed to support a comprehensive service marketplace with booking management, payment processing, and communication systems.

## 🛠️ Service Entity

The main entity representing service listings in the marketplace.

### Schema Definition

```javascript
const serviceSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Classification
  category: {
    type: String,
    enum: [
      'cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 
      'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 
      'appliance_repair', 'locksmith', 'handyman', 'home_security',
      'pool_maintenance', 'pest_control', 'carpet_cleaning', 'window_cleaning',
      'gutter_cleaning', 'power_washing', 'snow_removal', 'other'
    ],
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  
  // Provider Information
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Pricing Structure
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
  
  // Availability Management
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
  
  // Service Area
  serviceArea: {
    type: [String], // Array of zip codes or cities
    required: true
  },
  
  // Media and Features
  images: [{
    url: String,
    publicId: String,
    thumbnail: String,
    alt: String
  }],
  features: [String],
  requirements: [String],
  
  // Enhanced Service Features
  serviceType: {
    type: String,
    enum: ['one_time', 'recurring', 'emergency', 'maintenance', 'installation'],
    default: 'one_time'
  },
  estimatedDuration: {
    min: Number, // minimum hours
    max: Number  // maximum hours
  },
  teamSize: {
    type: Number,
    default: 1,
    min: 1
  },
  equipmentProvided: {
    type: Boolean,
    default: true
  },
  materialsIncluded: {
    type: Boolean,
    default: false
  },
  
  // Warranty and Insurance
  warranty: {
    hasWarranty: { type: Boolean, default: false },
    duration: Number, // in days
    description: String
  },
  insurance: {
    covered: { type: Boolean, default: false },
    coverageAmount: Number
  },
  
  // Emergency Services
  emergencyService: {
    available: { type: Boolean, default: false },
    surcharge: Number,
    responseTime: String // e.g., "within 2 hours"
  },
  
  // Service Packages and Add-ons
  servicePackages: [{
    name: String,
    description: String,
    price: Number,
    features: [String],
    duration: Number
  }],
  addOns: [{
    name: String,
    description: String,
    price: Number,
    category: String
  }],
  
  // Status and Rating
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
```

### Key Features

- **Comprehensive Service Info** - Title, description, and detailed specifications
- **Category System** - Hierarchical categorization with subcategories
- **Pricing Flexibility** - Multiple pricing models (hourly, fixed, per sqft, per item)
- **Availability Management** - Schedule-based availability with timezone support
- **Service Area Coverage** - Geographic service area definition
- **Enhanced Features** - Service types, duration estimates, team size, equipment info
- **Warranty & Insurance** - Service guarantees and coverage information
- **Emergency Services** - Emergency availability with surcharge options
- **Packages & Add-ons** - Service packages and additional options
- **Rating System** - Average rating and review count tracking

### Indexes

```javascript
// Performance indexes
serviceSchema.index({ category: 1, subcategory: 1 });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ serviceArea: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ provider: 1, isActive: 1 });
serviceSchema.index({ 'rating.average': -1, 'rating.count': -1 });

// Advanced filtering indexes
serviceSchema.index({ category: 1, subcategory: 1, isActive: 1 });
serviceSchema.index({ provider: 1, isActive: 1, category: 1 });
serviceSchema.index({ serviceArea: 1, isActive: 1, category: 1 });
serviceSchema.index({ 'rating.average': -1, 'rating.count': -1, isActive: 1 });
serviceSchema.index({ 'pricing.basePrice': 1, category: 1, isActive: 1 });
serviceSchema.index({ 'pricing.type': 1, category: 1, isActive: 1 });
serviceSchema.index({ serviceType: 1, category: 1, isActive: 1 });
serviceSchema.index({ 'estimatedDuration.min': 1, 'estimatedDuration.max': 1, isActive: 1 });
serviceSchema.index({ teamSize: 1, category: 1, isActive: 1 });
serviceSchema.index({ equipmentProvided: 1, materialsIncluded: 1, isActive: 1 });
serviceSchema.index({ 'warranty.hasWarranty': 1, category: 1, isActive: 1 });
serviceSchema.index({ 'insurance.covered': 1, category: 1, isActive: 1 });
serviceSchema.index({ 'emergencyService.available': 1, category: 1, isActive: 1 });
serviceSchema.index({ features: 1, isActive: 1 });
serviceSchema.index({ requirements: 1, isActive: 1 });
serviceSchema.index({ createdAt: -1, isActive: 1 });
serviceSchema.index({ updatedAt: -1, isActive: 1 });

// Text search index
serviceSchema.index({
  title: 'text',
  description: 'text',
  features: 'text',
  requirements: 'text'
});
```

## 📋 Booking Entity

The main entity representing individual booking transactions with complete lifecycle management.

### Schema Definition

```javascript
const bookingSchema = new mongoose.Schema({
  // Core References
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
  
  // Booking Details
  bookingDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  
  // Location Information
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
  
  // Status Management
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Pricing Information
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
  
  // Payment Processing
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'paypal', 'paymaya'],
      default: 'cash'
    },
    transactionId: String,
    paypalOrderId: String,
    paypalTransactionId: String,
    paymayaReferenceNumber: String,
    paymayaCheckoutId: String,
    paymayaPaymentId: String,
    paymayaInvoiceId: String,
    paymayaTransactionId: String,
    paidAt: Date
  },
  
  // Review System
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date,
    // Enhanced review system
    categories: {
      quality: { type: Number, min: 1, max: 5 },
      timeliness: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 }
    },
    wouldRecommend: { type: Boolean, default: false },
    photos: [{
      url: String,
      publicId: String,
      thumbnail: String
    }]
  },
  
  // Communication System
  communication: {
    messages: [{
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      message: String,
      timestamp: { type: Date, default: Date.now },
      type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
      }
    }],
    lastMessageAt: Date
  },
  
  // Timeline Tracking
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Document Management
  documents: [{
    name: String,
    url: String,
    publicId: String,
    type: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Photo Documentation
  beforePhotos: [{
    url: String,
    publicId: String,
    thumbnail: String
  }],
  afterPhotos: [{
    url: String,
    publicId: String,
    thumbnail: String
  }],
  
  // Completion Details
  completionNotes: String,
  clientSatisfaction: {
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});
```

### Key Features

- **Complete Lifecycle** - From creation to completion with status tracking
- **Multi-Party References** - Service, client, and provider relationships
- **Flexible Pricing** - Base price with additional fees support
- **Payment Integration** - Multiple payment methods with transaction tracking
- **Enhanced Review System** - Categorized ratings with recommendation tracking
- **Real-time Communication** - Built-in messaging system
- **Timeline Tracking** - Complete audit trail of status changes
- **Document Management** - File upload and sharing capabilities
- **Photo Documentation** - Before/after photo capture
- **Satisfaction Tracking** - Client feedback and satisfaction metrics

### Indexes

```javascript
// Core indexes
bookingSchema.index({ client: 1 });
bookingSchema.index({ provider: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ client: 1, status: 1 });
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ service: 1, status: 1 });

// Advanced filtering indexes
bookingSchema.index({ client: 1, status: 1, bookingDate: 1 });
bookingSchema.index({ provider: 1, status: 1, bookingDate: 1 });
bookingSchema.index({ service: 1, status: 1, bookingDate: 1 });
bookingSchema.index({ status: 1, bookingDate: 1, createdAt: -1 });
bookingSchema.index({ 'payment.status': 1, status: 1 });
bookingSchema.index({ 'payment.method': 1, status: 1 });
bookingSchema.index({ 'address.city': 1, 'address.state': 1, status: 1 });
bookingSchema.index({ 'review.rating': 1, status: 1 });
bookingSchema.index({ 'review.wouldRecommend': 1, status: 1 });
bookingSchema.index({ createdAt: -1, status: 1 });
bookingSchema.index({ updatedAt: -1, status: 1 });
```

## 🔗 Relationships

### Service Relationships
- **Provider** → `User` (Many-to-One)
- **Bookings** → `Booking` (One-to-Many, via service reference)

### Booking Relationships
- **Service** → `Service` (Many-to-One)
- **Client** → `User` (Many-to-One)
- **Provider** → `User` (Many-to-One)
- **Messages** → `User` (Many-to-Many, via sender reference)
- **Timeline** → `User` (Many-to-Many, via updatedBy reference)
- **Documents** → `User` (Many-to-Many, via uploadedBy reference)

## 📊 Data Validation

### Service Validation
- **Required Fields**: title, description, category, subcategory, provider, pricing.type, pricing.basePrice, serviceArea
- **Enum Values**: category, subcategory, pricing.type, serviceType, emergencyService.responseTime
- **Numeric Ranges**: pricing.basePrice (≥0), rating.average (0-5), teamSize (≥1)

### Booking Validation
- **Required Fields**: service, client, provider, bookingDate, duration
- **Status Enums**: status, payment.status, payment.method
- **Date Validation**: bookingDate, paidAt, createdAt
- **Rating Validation**: review.rating (1-5), categories (1-5)

## 🚀 Performance Considerations

### Query Optimization
- **Compound Indexes** - Multi-field indexes for complex filtering
- **Text Search** - Full-text search across service fields
- **Geospatial Queries** - Location-based service discovery
- **Pagination** - Efficient large dataset handling

### Caching Strategy
- **Service Listings** - Cache frequently accessed service lists
- **Category Data** - Cache category and subcategory aggregations
- **Search Results** - Cache search queries and filters
- **Booking Status** - Cache booking status for real-time updates

### Data Consistency
- **Status Updates** - Atomic operations for booking status changes
- **Payment Processing** - Transaction-based payment handling
- **Rating Calculation** - Automatic average rating updates
- **Timeline Tracking** - Incremental timeline updates

---

*This documentation covers the core data structures. For API usage and implementation examples, see the related documentation files.*
