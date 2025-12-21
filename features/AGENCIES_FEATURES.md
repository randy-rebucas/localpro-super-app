# Agencies Features Documentation

## Overview

The Agencies feature provides comprehensive agency management functionality for the LocalPro Super App. This feature enables businesses to create and manage agencies, onboard service providers, handle administrative tasks, and track performance analytics across their service operations. It supports multi-provider organizations with flexible commission structures, geographic service areas, and comprehensive business management tools.

## Base Path
`/api/agencies`

---

## Core Features

### 1. Agency Management
- **Agency Creation** - Create comprehensive agency profiles with business information
- **Agency Updates** - Modify agency details, services, and settings
- **Agency Deletion** - Soft delete agencies (archive functionality)
- **Logo Management** - Upload and manage agency logos
- **Business Information** - Complete business details including:
  - Business type (LLC, Corporation, Partnership, etc.)
  - Registration numbers
  - Tax identification
  - License numbers
  - Insurance information
- **Contact Information** - Email, phone, website, and address management

### 2. Provider Management
- **Provider Onboarding** - Add providers to agencies with commission rates
- **Provider Status** - Manage provider status (active, inactive, suspended, pending)
- **Commission Management** - Set and manage commission rates per provider
- **Performance Tracking** - Track provider performance metrics:
  - Ratings
  - Total jobs
  - Completed jobs
  - Cancellation rates
- **Provider Removal** - Remove providers from agencies
- **Provider Verification** - Require provider verification before activation

### 3. Administrative Controls
- **Multi-level Roles** - Support for different admin roles:
  - Owner (full control)
  - Admin (administrative access)
  - Manager (management access)
  - Supervisor (supervisory access)
- **Permission System** - Granular permission control for admins
- **Admin Management** - Add and remove admins from agencies
- **Access Control** - User access control and validation

### 4. Service Area Management
- **Geographic Coverage** - Define service areas with coordinates
- **Radius Management** - Set service radius in kilometers
- **Multi-location Support** - Support for multiple service areas per agency
- **Zip Code Mapping** - Map service areas to zip codes
- **Location-based Search** - Find agencies by location

### 5. Service Management
- **Service Categories** - Support for 20+ service categories:
  - Cleaning (residential, commercial, deep cleaning)
  - Plumbing
  - Electrical
  - Moving
  - Landscaping
  - Painting
  - Carpentry
  - Flooring
  - Roofing
  - HVAC
  - And more
- **Subcategory Support** - Multiple subcategories per service
- **Pricing Configuration** - Set base rates per service category
- **Currency Support** - Multi-currency pricing support

### 6. Subscription Management
- **Subscription Plans** - Three subscription tiers:
  - Basic Plan - Essential features
  - Professional Plan - Advanced features
  - Enterprise Plan - Full features
- **Feature Access** - Plan-based feature access control
- **Subscription Status** - Track subscription active/inactive status
- **Subscription Dates** - Start and end date management

### 7. Verification System
- **Document Upload** - Upload business documents:
  - Business license
  - Insurance certificate
  - Tax certificate
  - Other compliance documents
- **Verification Status** - Track verification status (pending, verified, rejected, expired)
- **Document Management** - Store and manage verification documents
- **Compliance Tracking** - Track compliance requirements

### 8. Analytics & Reporting
- **Performance Metrics** - Comprehensive analytics:
  - Total bookings
  - Total revenue
  - Average rating
  - Review count
  - Provider count
- **Monthly Statistics** - Monthly trends and analysis
- **Provider Performance** - Individual provider analytics
- **Revenue Tracking** - Revenue trends and reporting
- **Booking Trends** - Booking pattern analysis

### 9. Agency Settings
- **Auto-approval** - Auto-approve provider requests
- **Verification Requirements** - Require provider verification
- **Default Commission** - Set default commission rates
- **Notification Preferences** - Configure email and SMS notifications:
  - New bookings
  - Provider updates
  - Payment updates
  - Urgent updates

### 10. Agency Discovery
- **Browse Agencies** - Paginated listing of all agencies
- **Advanced Search** - Search by name, description, location
- **Filtering** - Filter by:
  - Location (city, state)
  - Service type
  - Industry
- **Agency Details** - Comprehensive agency information

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get all agencies | `page`, `limit`, `search`, `location`, `serviceType`, `industry`, `sortBy`, `sortOrder` |
| GET | `/:id` | Get agency details | - |

### Authenticated Endpoints - Agency Management

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/` | Create agency | AUTHENTICATED |
| PUT | `/:id` | Update agency | AUTHENTICATED (owner/admin) |
| DELETE | `/:id` | Delete agency | AUTHENTICATED (owner/admin) |
| POST | `/:id/logo` | Upload agency logo | AUTHENTICATED (owner/admin) |

### Authenticated Endpoints - Provider Management

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/:id/providers` | Add provider | AUTHENTICATED (owner/admin) |
| DELETE | `/:id/providers/:providerId` | Remove provider | AUTHENTICATED (owner/admin) |
| PUT | `/:id/providers/:providerId/status` | Update provider status | AUTHENTICATED (owner/admin) |

### Authenticated Endpoints - Admin Management

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/:id/admins` | Add admin | AUTHENTICATED (owner) |
| DELETE | `/:id/admins/:adminId` | Remove admin | AUTHENTICATED (owner) |

### Authenticated Endpoints - Analytics & User Actions

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/:id/analytics` | Get agency analytics | AUTHENTICATED (owner/admin) |
| GET | `/my/agencies` | Get my agencies | AUTHENTICATED |
| POST | `/join` | Join agency | AUTHENTICATED |
| POST | `/leave` | Leave agency | AUTHENTICATED |

---

## Request/Response Examples

### Create Agency

```http
POST /api/agencies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Elite Cleaning Services",
  "description": "Professional cleaning services for residential and commercial properties",
  "contact": {
    "email": "info@elitecleaning.com",
    "phone": "+1-555-0123",
    "website": "https://elitecleaning.com",
    "address": {
      "street": "123 Business Ave",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94102",
      "country": "USA"
    }
  },
  "business": {
    "type": "llc",
    "registrationNumber": "LLC123456789",
    "taxId": "12-3456789",
    "licenseNumber": "LIC789012345",
    "insurance": {
      "provider": "State Farm",
      "policyNumber": "SF123456789",
      "coverageAmount": 1000000,
      "expiryDate": "2024-12-31T23:59:59.000Z"
    }
  },
  "serviceAreas": [
    {
      "name": "San Francisco Bay Area",
      "coordinates": {
        "lat": 37.7749,
        "lng": -122.4194
      },
      "radius": 50,
      "zipCodes": ["94102", "94103", "94104"]
    }
  ],
  "services": [
    {
      "category": "cleaning",
      "subcategories": ["residential", "commercial", "deep_cleaning"],
      "pricing": {
        "baseRate": 50,
        "currency": "USD"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agency created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "name": "Elite Cleaning Services",
    "description": "Professional cleaning services for residential and commercial properties",
    "owner": "60f7b3b3b3b3b3b3b3b3b3b4",
    "contact": {
      "email": "info@elitecleaning.com",
      "phone": "+1-555-0123",
      "website": "https://elitecleaning.com"
    },
    "isActive": true,
    "createdAt": "2025-09-20T10:30:00.000Z"
  }
}
```

### Add Provider to Agency

```http
POST /api/agencies/:id/providers
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "60f7b3b3b3b3b3b3b3b3b3b5",
  "commissionRate": 15
}
```

**Response:**
```json
{
  "success": true,
  "message": "Provider added successfully",
  "data": {
    "user": "60f7b3b3b3b3b3b3b3b3b3b5",
    "status": "pending",
    "commissionRate": 15,
    "joinedAt": "2025-09-20T10:30:00.000Z"
  }
}
```

### Update Provider Status

```http
PUT /api/agencies/:id/providers/:providerId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Provider status updated successfully",
  "data": {
    "status": "active",
    "updatedAt": "2025-09-20T11:00:00.000Z"
  }
}
```

### Add Admin to Agency

```http
POST /api/agencies/:id/admins
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "60f7b3b3b3b3b3b3b3b3b3b6",
  "role": "manager",
  "permissions": ["manage_providers", "view_analytics"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin added successfully",
  "data": {
    "user": "60f7b3b3b3b3b3b3b3b3b3b6",
    "role": "manager",
    "permissions": ["manage_providers", "view_analytics"],
    "addedAt": "2025-09-20T10:30:00.000Z"
  }
}
```

### Upload Agency Logo

```http
POST /api/agencies/:id/logo
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "logo": <file>
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/example/image/upload/v1234567890/logo.jpg",
    "publicId": "localpro/agencies/logos/logo_1234567890"
  }
}
```

### Get Agency Analytics

```http
GET /api/agencies/:id/analytics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProviders": 5,
    "activeProviders": 4,
    "totalBookings": 150,
    "totalRevenue": 7500,
    "averageRating": 4.7,
    "totalReviews": 45,
    "monthlyStats": [
      {
        "month": "September",
        "year": 2025,
        "bookings": 25,
        "revenue": 1250,
        "newProviders": 2
      }
    ],
    "providerPerformance": [
      {
        "userId": "60f7b3b3b3b3b3b3b3b3b3b5",
        "status": "active",
        "commissionRate": 15,
        "performance": {
          "rating": 4.8,
          "totalJobs": 45,
          "completedJobs": 43,
          "cancellationRate": 4.4
        }
      }
    ]
  }
}
```

### Join Agency

```http
POST /api/agencies/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "agencyId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully requested to join agency"
}
```

---

## Agency Management Flow

### 1. Agency Creation
- Owner creates agency via `POST /api/agencies`
- Owner adds business information
- Owner uploads logo via `POST /api/agencies/:id/logo`
- Owner defines service areas and services
- Agency becomes active

### 2. Provider Management
- Owner adds providers via `POST /api/agencies/:id/providers`
- Owner sets commission rates
- Owner manages provider status (pending → active)
- System tracks provider performance
- Owner can remove providers if needed

### 3. Admin Management
- Owner adds admins via `POST /api/agencies/:id/admins`
- Owner assigns roles and permissions
- Admins assist with agency operations
- Owner can remove admins if needed

### 4. Service Operations
- Providers perform services under agency
- Bookings tracked and attributed to agency
- Revenue tracked and commission calculated
- Performance metrics updated

### 5. Analytics & Reporting
- Owner views agency analytics
- Owner tracks provider performance
- Owner monitors bookings and revenue
- Monthly statistics generated

---

## Provider Status Flow

```
pending → active → inactive/suspended
```

**Status Details:**
- **pending** - Provider added, awaiting approval
- **active** - Provider active and available
- **inactive** - Provider temporarily inactive
- **suspended** - Provider suspended from agency

---

## Business Types

### Sole Proprietorship
- **Description**: Individual business ownership
- **Use Case**: Single owner businesses
- **Liability**: Personal liability

### Partnership
- **Description**: Multiple business partners
- **Use Case**: Multiple owner businesses
- **Liability**: Shared liability

### Corporation
- **Description**: Corporate business structure
- **Use Case**: Large businesses
- **Liability**: Limited liability

### LLC (Limited Liability Company)
- **Description**: Limited Liability Company
- **Use Case**: Most common for agencies
- **Liability**: Limited liability

### Non-profit
- **Description**: Non-profit organization
- **Use Case**: Non-profit agencies
- **Liability**: Limited liability

---

## Service Categories

### Cleaning Services
- Residential cleaning
- Commercial cleaning
- Deep cleaning
- Post-construction cleaning
- Carpet cleaning
- Window cleaning

### Maintenance Services
- HVAC maintenance
- Plumbing services
- Electrical services
- Appliance repair
- Handyman services

### Construction Services
- Carpentry
- Flooring
- Roofing
- Painting
- General construction

### Landscaping Services
- Lawn care
- Tree services
- Snow removal
- Garden maintenance
- Irrigation

### Moving Services
- Residential moving
- Commercial moving
- Packing services
- Storage services

### And More
- Locksmith services
- Home security
- Pool maintenance
- Pest control
- Power washing
- Gutter cleaning

---

## Data Models

### Agency Model

```javascript
{
  // Basic Information
  name: String,                    // Required
  description: String,             // Required
  owner: ObjectId,                 // Required, User reference
  
  // Administrative Structure
  admins: [{
    user: ObjectId,                // User reference
    role: String,                  // enum: admin, manager, supervisor
    addedAt: Date,
    permissions: [String]
  }],
  
  // Provider Management
  providers: [{
    user: ObjectId,                // User reference
    status: String,                // enum: active, inactive, suspended, pending
    commissionRate: Number,        // 0-100, default: 10
    joinedAt: Date,
    performance: {
      rating: Number,              // 0-5
      totalJobs: Number,
      completedJobs: Number,
      cancellationRate: Number    // 0-100
    }
  }],
  
  // Contact Information
  contact: {
    email: String,                 // Required
    phone: String,                 // Required
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
    type: String,                  // enum: sole_proprietorship, partnership, corporation, llc, nonprofit
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
    radius: Number,                // in kilometers
    zipCodes: [String]
  }],
  
  // Services Offered
  services: [{
    category: String,              // enum: cleaning, plumbing, electrical, etc.
    subcategories: [String],
    pricing: {
      baseRate: Number,
      currency: String              // Default: USD
    }
  }],
  
  // Subscription Management
  subscription: {
    plan: String,                  // enum: basic, professional, enterprise
    startDate: Date,
    endDate: Date,
    isActive: Boolean,
    features: [String]
  },
  
  // Verification System
  verification: {
    isVerified: Boolean,           // Default: false
    verifiedAt: Date,
    documents: [{
      type: String,                // enum: business_license, insurance_certificate, tax_certificate, other
      url: String,
      publicId: String,
      filename: String,
      uploadedAt: Date
    }]
  },
  
  // Analytics & Performance
  analytics: {
    totalBookings: Number,         // Default: 0
    totalRevenue: Number,          // Default: 0
    averageRating: Number,         // Default: 0, 0-5
    totalReviews: Number,          // Default: 0
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
    autoApproveProviders: Boolean, // Default: false
    requireProviderVerification: Boolean, // Default: true
    defaultCommissionRate: Number, // Default: 10, 0-100
    notificationPreferences: {
      email: {
        newBookings: Boolean,
        providerUpdates: Boolean,
        paymentUpdates: Boolean
      },
      sms: {
        newBookings: Boolean,
        urgentUpdates: Boolean
      }
    }
  },
  
  // Media
  logo: {
    url: String,
    publicId: String
  },
  
  // Status
  isActive: Boolean,               // Default: true
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## Search & Filtering

### Query Parameters

**Pagination:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Search:**
- `search` - Search by agency name or description
- `location` - Filter by city or location
- `serviceType` - Filter by service category
- `industry` - Filter by industry

**Sorting:**
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort direction (asc, desc)

### Response Format

**List Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 25,
  "page": 1,
  "pages": 3,
  "data": [...]
}
```

**Detail Response:**
```json
{
  "success": true,
  "data": {...}
}
```

---

## Key Metrics

- **Total Agencies** - Total number of active agencies
- **Total Providers** - Total providers across all agencies
- **Total Bookings** - Total bookings for agencies
- **Total Revenue** - Total revenue generated
- **Average Rating** - Average agency ratings
- **Provider Performance** - Individual provider metrics
- **Monthly Trends** - Monthly booking and revenue trends
- **Geographic Coverage** - Agencies by location

---

## Related Features

The Agencies feature integrates with several other features in the LocalPro Super App:

- **User Management** - Owner, admin, and provider profiles
- **Providers** - Provider profiles and management
- **Marketplace** - Service bookings and management
- **Finance** - Commission payments and revenue tracking
- **Analytics** - Performance analytics and reporting
- **File Storage** - Logo and document storage (Cloudinary)
- **Email Service** - Notification system
- **Maps & Location** - Service area mapping
- **Subscriptions** - Subscription plan management
- **Verification** - Document verification system

---

## Common Use Cases

1. **Agency Creation** - Business owners create agency profiles
2. **Provider Onboarding** - Agencies add providers with commission rates
3. **Service Management** - Agencies manage services and service areas
4. **Performance Tracking** - Agencies monitor provider and agency performance
5. **Revenue Management** - Agencies track revenue and commissions
6. **Admin Management** - Agencies add admins for operations
7. **Analytics Review** - Agencies review performance analytics
8. **Geographic Expansion** - Agencies add new service areas

---

## Error Handling

**Common Error Codes:**
- `400` - Validation errors (invalid data, missing fields)
- `401` - Unauthorized (no token provided)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (agency doesn't exist)
- `409` - Conflict (duplicate provider, already member)
- `500` - Server error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "name",
      "message": "Agency name is required"
    }
  ]
}
```

---

## Best Practices

### For Agency Owners
1. **Complete Profile** - Provide complete business information
2. **Verify Documents** - Upload and verify all required documents
3. **Manage Providers** - Regularly review provider performance
4. **Monitor Analytics** - Track performance metrics regularly
5. **Update Information** - Keep agency information current

### For Providers
1. **Join Reputable Agencies** - Research agencies before joining
2. **Understand Commission** - Understand commission structure
3. **Maintain Performance** - Maintain good performance metrics
4. **Communicate** - Communicate with agency admins

### For Developers
1. **Permission Checks** - Always verify permissions before operations
2. **Status Validation** - Validate provider status before actions
3. **Commission Calculation** - Ensure accurate commission calculations
4. **Analytics Updates** - Update analytics in real-time
5. **Error Handling** - Handle all error cases gracefully

---

*For detailed implementation guidance, see the individual documentation files in the `features/agencies/` and `docs/features/` directories.*

