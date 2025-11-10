# Agencies Data Entities

## Overview

The Agencies feature uses a single comprehensive data model: `Agency`. This model provides extensive agency management, provider management, administrative controls, and analytics capabilities for business operations.

## Agency Model

### Schema Definition

```javascript
const agencySchema = new mongoose.Schema({
  // Basic Information
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
  
  // Administrative Structure
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
  
  // Provider Management
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
  
  // Contact Information
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
  
  // Business Information
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
  
  // Service Areas
  serviceAreas: [{
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    radius: Number, // in kilometers
    zipCodes: [String]
  }],
  
  // Services Offered
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
  
  // Subscription Management
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
  
  // Verification System
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
  
  // Analytics & Performance
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
  
  // Agency Settings
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
  
  // Status Management
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});
```

### Key Features

#### Basic Information
- **Name**: Agency business name
- **Description**: Detailed agency description
- **Owner**: Reference to the agency owner (User)

#### Administrative Structure
- **Admins**: Array of administrative users with roles and permissions
- **Roles**: Admin, manager, supervisor role hierarchy
- **Permissions**: Granular permission system for admin users
- **Added At**: Timestamp for admin addition

#### Provider Management
- **Providers**: Array of service providers associated with the agency
- **Status**: Active, inactive, suspended, pending provider statuses
- **Commission Rate**: Percentage commission for each provider (0-100%)
- **Joined At**: Timestamp for provider joining
- **Performance**: Comprehensive performance tracking including:
  - Rating: Average provider rating (0-5)
  - Total Jobs: Total number of jobs assigned
  - Completed Jobs: Number of successfully completed jobs
  - Cancellation Rate: Percentage of cancelled jobs (0-100%)

#### Contact Information
- **Email**: Primary contact email address
- **Phone**: Primary contact phone number
- **Website**: Agency website URL
- **Address**: Complete address information including:
  - Street address
  - City, state, zip code, country
  - GPS coordinates (latitude, longitude)

#### Business Information
- **Business Type**: Legal business structure (sole proprietorship, partnership, corporation, LLC, nonprofit)
- **Registration Number**: Business registration number
- **Tax ID**: Tax identification number
- **License Number**: Professional license number
- **Insurance**: Insurance coverage details including:
  - Provider name
  - Policy number
  - Coverage amount
  - Expiry date

#### Service Areas
- **Geographic Coverage**: Multiple service areas supported
- **Name**: Service area name/description
- **Coordinates**: GPS coordinates for service area center
- **Radius**: Service radius in kilometers
- **Zip Codes**: Array of covered zip codes

#### Services Offered
- **Categories**: 20+ service categories supported including:
  - Cleaning (residential, commercial, deep cleaning)
  - Maintenance (HVAC, plumbing, electrical)
  - Construction (carpentry, flooring, roofing)
  - Landscaping (lawn care, tree services, snow removal)
  - Moving (residential, commercial, packing)
  - And many more specialized services
- **Subcategories**: Specific service subcategories
- **Pricing**: Base rate and currency for services

#### Subscription Management
- **Plan Types**: Basic, professional, enterprise subscription plans
- **Start/End Dates**: Subscription period tracking
- **Active Status**: Current subscription status
- **Features**: Available features based on subscription plan

#### Verification System
- **Verification Status**: Boolean verification status
- **Verified At**: Timestamp of verification completion
- **Documents**: Array of verification documents including:
  - Document type (business license, insurance certificate, tax certificate, other)
  - File URL and Cloudinary public ID
  - Filename and upload timestamp

#### Analytics & Performance
- **Total Bookings**: Complete booking count
- **Total Revenue**: Total revenue generated
- **Average Rating**: Overall customer rating (0-5)
- **Total Reviews**: Number of customer reviews
- **Monthly Stats**: Monthly performance tracking including:
  - Month and year
  - Bookings count
  - Revenue amount
  - New providers added

#### Agency Settings
- **Auto Approve Providers**: Automatic provider approval setting
- **Require Provider Verification**: Provider verification requirement
- **Default Commission Rate**: Default commission rate for new providers
- **Notification Preferences**: Email and SMS notification settings

### Database Indexes

#### Performance Indexes
```javascript
// Basic indexes
agencySchema.index({ owner: 1 });
agencySchema.index({ 'providers.user': 1 });
agencySchema.index({ isActive: 1 });

// Geospatial index (temporarily disabled due to coordinate format issues)
// agencySchema.index({ 'serviceAreas.coordinates': '2dsphere' });
```

### Virtual Properties

#### Provider Count
```javascript
agencySchema.virtual('providerCount').get(function() {
  return this.providers.length;
});
```

#### Active Provider Count
```javascript
agencySchema.virtual('activeProviderCount').get(function() {
  return this.providers.filter(p => p.status === 'active').length;
});
```

### Instance Methods

#### Add Provider
```javascript
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
```

#### Update Provider Status
```javascript
agencySchema.methods.updateProviderStatus = function(userId, status) {
  const provider = this.providers.find(p => p.user.toString() === userId.toString());
  if (!provider) {
    throw new Error('Provider not found in this agency');
  }
  
  provider.status = status;
  return this.save();
};
```

#### Update Provider Performance
```javascript
agencySchema.methods.updateProviderPerformance = function(userId, performanceData) {
  const provider = this.providers.find(p => p.user.toString() === userId.toString());
  if (!provider) {
    throw new Error('Provider not found in this agency');
  }
  
  Object.assign(provider.performance, performanceData);
  return this.save();
};
```

#### Add Admin
```javascript
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
```

#### Remove Admin
```javascript
agencySchema.methods.removeAdmin = function(userId) {
  this.admins = this.admins.filter(a => a.user.toString() !== userId.toString());
  return this.save();
};
```

#### Check Admin Status
```javascript
agencySchema.methods.isAdmin = function(userId) {
  return this.admins.some(a => a.user.toString() === userId.toString());
};
```

#### Check Provider Status
```javascript
agencySchema.methods.isProvider = function(userId) {
  return this.providers.some(p => p.user.toString() === userId.toString());
};
```

#### Check Access
```javascript
agencySchema.methods.hasAccess = function(userId) {
  return this.owner.toString() === userId.toString() || 
         this.isAdmin(userId) || 
         this.isProvider(userId);
};
```

## Data Relationships

### Agency Relationships
- **Owner**: One-to-one relationship with User model
- **Admins**: One-to-many relationship with User model
- **Providers**: One-to-many relationship with User model

## Validation Rules

### Agency Validation
- **Name**: Required, trimmed string
- **Description**: Required string
- **Owner**: Required, valid User ID reference
- **Contact Email**: Required, valid email format, lowercase
- **Contact Phone**: Required string
- **Business Type**: Must be one of the defined business types
- **Commission Rate**: Must be between 0 and 100
- **Provider Status**: Must be one of the defined statuses
- **Admin Role**: Must be one of the defined roles

## Default Values

### Agency Defaults
- **Business Type**: 'sole_proprietorship'
- **Provider Status**: 'pending'
- **Commission Rate**: 10%
- **Subscription Plan**: 'basic'
- **Subscription Active**: true
- **Verification Status**: false
- **Auto Approve Providers**: false
- **Require Provider Verification**: true
- **Default Commission Rate**: 10%
- **Is Active**: true

## Service Categories

### Cleaning Services
- **Residential Cleaning**: Regular home cleaning services
- **Commercial Cleaning**: Office and business cleaning
- **Deep Cleaning**: Intensive cleaning services
- **Carpet Cleaning**: Specialized carpet cleaning
- **Window Cleaning**: Window and glass cleaning
- **Power Washing**: Exterior surface cleaning

### Maintenance Services
- **HVAC**: Heating, ventilation, and air conditioning
- **Plumbing**: Pipe repair, installation, maintenance
- **Electrical**: Electrical system repair and installation
- **Appliance Repair**: Home appliance repair services
- **Locksmith**: Lock installation and repair
- **Handyman**: General repair and maintenance

### Construction Services
- **Carpentry**: Woodwork and furniture construction
- **Flooring**: Floor installation and repair
- **Roofing**: Roof repair and installation
- **Painting**: Interior and exterior painting
- **Home Security**: Security system installation

### Landscaping Services
- **Lawn Care**: Grass cutting and lawn maintenance
- **Tree Services**: Tree trimming and removal
- **Snow Removal**: Winter snow clearing services
- **Pool Maintenance**: Swimming pool cleaning and maintenance
- **Pest Control**: Pest elimination and prevention

### Moving Services
- **Residential Moving**: Home relocation services
- **Commercial Moving**: Business relocation services
- **Packing Services**: Packing and unpacking assistance

## Performance Considerations

### Query Optimization
- Use `select()` to limit returned fields
- Use `populate()` sparingly and only when needed
- Use `lean()` for read-only operations
- Implement proper indexing for common queries

### Caching Strategy
- Cache frequently accessed agency data
- Use Redis for agency statistics and analytics
- Implement cache invalidation on agency updates
- Cache provider lists and performance data

### Indexing Strategy
- Create compound indexes for common query patterns
- Use sparse indexes for optional fields
- Implement geospatial indexes for location-based queries
- Monitor index usage and performance

This comprehensive data model provides all the functionality needed for a robust agency management system while maintaining performance and scalability.
