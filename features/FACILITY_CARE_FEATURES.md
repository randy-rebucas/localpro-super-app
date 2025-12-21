# Facility Care Features Documentation

## Overview

The Facility Care feature provides end-to-end facility care offerings including recurring services, formal contracts, and subscription management. It enables providers to offer facility maintenance and care services (janitorial, landscaping, pest control, maintenance, security) and clients to book these services with flexible scheduling, contract management, and recurring payment options.

## Base Path
`/api/facility-care`

---

## Core Features

### 1. Facility Care Services
- **Service Creation** - Providers can create comprehensive facility care service listings
- **Service Management** - Update and manage service details, pricing, and availability
- **Service Categories** - Support for multiple service categories:
  - `janitorial` - Janitorial services
  - `landscaping` - Landscaping services
  - `pest_control` - Pest control services
  - `maintenance` - Maintenance services
  - `security` - Security services
- **Pricing Models** - Flexible pricing options:
  - Hourly pricing
  - Monthly pricing
  - Per square foot pricing
  - Per visit pricing
  - Contract-based pricing
- **Service Areas** - Define geographic service coverage
- **Availability Scheduling** - Set availability schedules with time slots
- **Image Management** - Upload and manage service images

### 2. Contract Management
- **Contract Creation** - Create formal service contracts with detailed terms
- **Contract Details** - Comprehensive contract information:
  - Client and provider information
  - Facility details (name, address, size, type)
  - Contract duration and frequency
  - Service scope and special requirements
  - Pricing and payment terms
  - Performance KPIs
- **Contract Status** - Manage contract lifecycle:
  - `draft` - Contract being created
  - `pending` - Awaiting approval
  - `active` - Contract active
  - `suspended` - Temporarily suspended
  - `completed` - Contract completed
  - `terminated` - Contract terminated
- **Document Management** - Upload and manage contract documents
- **Performance Tracking** - Track KPIs and performance metrics
- **Contract Reviews** - Review and rate contract performance

### 3. Subscription Management
- **Subscription Creation** - Create recurring service subscriptions
- **Subscription Types** - Support for different subscription types:
  - `janitorial` - Janitorial subscriptions
  - `landscaping` - Landscaping subscriptions
  - `pest_control` - Pest control subscriptions
  - `maintenance` - Maintenance subscriptions
  - `comprehensive` - Comprehensive facility care
- **Subscription Plans** - Flexible subscription plans with features
- **Service Scheduling** - Automatic service scheduling:
  - Weekly schedules
  - Bi-weekly schedules
  - Monthly schedules
  - Quarterly schedules
- **Service History** - Track service delivery history
- **Payment History** - Track subscription payment history
- **Status Management** - Manage subscription status (active, paused, cancelled, expired)

### 4. Facility Information
- **Facility Details** - Comprehensive facility information:
  - Facility name
  - Address (street, city, state, zip code, country)
  - Facility size (area in square feet)
  - Facility type (office, retail, warehouse, residential, industrial, healthcare, educational)
- **Facility Management** - Manage multiple facilities per client
- **Facility Context** - Link services, contracts, and subscriptions to facilities

### 5. Service Scheduling
- **Recurring Schedules** - Set up recurring service schedules
- **Frequency Options** - Multiple frequency options:
  - `daily` - Daily service
  - `weekly` - Weekly service
  - `bi-weekly` - Bi-weekly service
  - `monthly` - Monthly service
  - `quarterly` - Quarterly service
  - `as_needed` - As needed service
- **Schedule Management** - Manage service schedules and availability
- **Service History** - Track completed services with dates and status
- **Next Service Tracking** - Track next scheduled service date

### 6. Payment Management
- **Payment Terms** - Flexible payment terms:
  - `net_15` - Net 15 days
  - `net_30` - Net 30 days
  - `net_60` - Net 60 days
  - `due_on_receipt` - Due on receipt
- **Payment Methods** - Multiple payment methods
- **Auto-Pay** - Automatic payment processing
- **Payment History** - Complete payment history tracking
- **Payment Status** - Track payment status (pending, paid, failed)
- **Recurring Payments** - Automatic recurring payment processing

### 7. Performance & KPIs
- **KPI Tracking** - Track key performance indicators:
  - Metric name
  - Target value
  - Actual value
  - Unit of measurement
- **Service Level** - Define service levels:
  - `standard` - Standard service level
  - `premium` - Premium service level
  - `custom` - Custom service level
- **Performance Monitoring** - Monitor contract and subscription performance
- **Performance Reports** - Generate performance reports

### 8. Review & Rating System
- **Service Reviews** - Review facility care services
- **Contract Reviews** - Review contract performance
- **Rating System** - 1-5 star rating system
- **Review Comments** - Detailed feedback and comments
- **Review History** - Track review history over time

### 9. Document Management
- **Contract Documents** - Upload and manage contract documents
- **Document Types** - Support for multiple document types:
  - `contract` - Contract documents
  - `invoice` - Invoice documents
  - `report` - Service reports
  - `certificate` - Certificates
  - `other` - Other documents
- **Document Storage** - Secure cloud storage for documents
- **Document Access** - Control document access and sharing

### 10. Service Discovery
- **Browse Services** - Browse facility care services
- **Location-Based Search** - Find nearby services
- **Category Filtering** - Filter by service category
- **Service Details** - View comprehensive service information

---

## API Endpoints

### Public Endpoints - Services

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get facility care services | `page`, `limit`, `category`, `area`, `provider`, `isActive` |
| GET | `/nearby` | Get nearby services | `lat`, `lng`, `radius` |
| GET | `/:id` | Get service details | - |

### Authenticated Endpoints - Services

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/` | Create facility care service | **provider, admin** |
| PUT | `/:id` | Update facility care service | **provider, admin** |
| DELETE | `/:id` | Delete facility care service | **provider, admin** |
| POST | `/:id/images` | Upload service images | **provider, admin** |
| DELETE | `/:id/images/:imageId` | Delete service image | **provider, admin** |
| POST | `/:id/reviews` | Add service review | AUTHENTICATED |
| GET | `/my-services` | Get my services | AUTHENTICATED |
| POST | `/:id/book` | Book facility care service | AUTHENTICATED |
| PUT | `/:id/bookings/:bookingId/status` | Update booking status | AUTHENTICATED |
| GET | `/my-bookings` | Get my bookings | AUTHENTICATED |

### Authenticated Endpoints - Contracts

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/contracts` | List user contracts | AUTHENTICATED |
| POST | `/contracts` | Create contract | AUTHENTICATED |
| GET | `/contracts/:id` | Get contract details | AUTHENTICATED |
| PUT | `/contracts/:id` | Update contract | AUTHENTICATED |
| PUT | `/contracts/:id/status` | Update contract status | AUTHENTICATED |
| POST | `/contracts/:id/documents` | Upload contract document | AUTHENTICATED |
| DELETE | `/contracts/:id/documents/:docId` | Delete document | AUTHENTICATED |

### Authenticated Endpoints - Subscriptions

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/subscriptions` | List user subscriptions | AUTHENTICATED |
| POST | `/subscriptions` | Create subscription | AUTHENTICATED |
| GET | `/subscriptions/:id` | Get subscription details | AUTHENTICATED |
| PUT | `/subscriptions/:id` | Update subscription | AUTHENTICATED |
| PUT | `/subscriptions/:id/status` | Update subscription status | AUTHENTICATED |
| GET | `/subscriptions/:id/history` | Get service history | AUTHENTICATED |
| GET | `/subscriptions/:id/payments` | Get payment history | AUTHENTICATED |

---

## Request/Response Examples

### Create Facility Care Service

```http
POST /api/facility-care
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Professional Office Cleaning",
  "description": "Comprehensive office cleaning service for commercial facilities",
  "category": "janitorial",
  "pricing": {
    "type": "monthly",
    "basePrice": 500,
    "currency": "USD"
  },
  "serviceArea": ["10001", "10002", "10003"],
  "availability": {
    "schedule": [
      {
        "day": "monday",
        "startTime": "08:00",
        "endTime": "17:00",
        "isAvailable": true
      },
      {
        "day": "wednesday",
        "startTime": "08:00",
        "endTime": "17:00",
        "isAvailable": true
      },
      {
        "day": "friday",
        "startTime": "08:00",
        "endTime": "17:00",
        "isAvailable": true
      }
    ],
    "timezone": "America/New_York"
  },
  "features": [
    "Office cleaning",
    "Restroom maintenance",
    "Trash removal",
    "Floor care"
  ],
  "requirements": [
    "Access during business hours",
    "Storage area for equipment"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Facility care service created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "Professional Office Cleaning",
    "description": "Comprehensive office cleaning service for commercial facilities",
    "category": "janitorial",
    "provider": "64a1b2c3d4e5f6789012346",
    "pricing": {
      "type": "monthly",
      "basePrice": 500,
      "currency": "USD"
    },
    "isActive": true,
    "rating": {
      "average": 0,
      "count": 0
    },
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Create Contract

```http
POST /api/facility-care/contracts
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceId": "64a1b2c3d4e5f6789012345",
  "facility": {
    "name": "ABC Corporate Office",
    "address": {
      "street": "789 Business Blvd",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "size": {
      "area": 5000,
      "unit": "sqft"
    },
    "type": "office"
  },
  "contractDetails": {
    "startDate": "2025-02-01T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.000Z",
    "duration": 11,
    "frequency": "weekly",
    "scope": [
      "Office cleaning",
      "Restroom maintenance",
      "Trash removal"
    ],
    "specialRequirements": [
      "Eco-friendly products",
      "After-hours access"
    ]
  },
  "pricing": {
    "basePrice": 500,
    "frequency": "monthly",
    "additionalFees": [
      {
        "description": "Holiday surcharge",
        "amount": 50,
        "frequency": "monthly"
      }
    ],
    "totalAmount": 5500,
    "currency": "USD"
  },
  "payment": {
    "terms": "net_30",
    "method": "bank_transfer",
    "autoPay": true
  },
  "performance": {
    "serviceLevel": "premium",
    "kpis": [
      {
        "metric": "Response Time",
        "target": 24,
        "unit": "hours"
      },
      {
        "metric": "Customer Satisfaction",
        "target": 4.5,
        "unit": "rating"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012347",
    "client": "64a1b2c3d4e5f6789012348",
    "provider": "64a1b2c3d4e5f6789012346",
    "service": "64a1b2c3d4e5f6789012345",
    "facility": {
      "name": "ABC Corporate Office",
      "address": {
        "street": "789 Business Blvd",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      },
      "size": {
        "area": 5000,
        "unit": "sqft"
      },
      "type": "office"
    },
    "status": "pending",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Create Subscription

```http
POST /api/facility-care/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "service": "64a1b2c3d4e5f6789012345",
  "contract": "64a1b2c3d4e5f6789012347",
  "subscriptionType": "janitorial",
  "plan": {
    "name": "Standard Weekly",
    "features": [
      "3x week cleaning",
      "Restroom maintenance",
      "Trash removal"
    ],
    "frequency": "weekly",
    "price": 500,
    "currency": "USD"
  },
  "schedule": {
    "startDate": "2025-02-05T00:00:00.000Z"
  },
  "payment": {
    "method": "bank_transfer",
    "autoPay": true
  },
  "preferences": {
    "preferredTime": "08:00",
    "contactMethod": "email",
    "specialInstructions": "Front desk check-in required"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012349",
    "client": "64a1b2c3d4e5f6789012348",
    "service": "64a1b2c3d4e5f6789012345",
    "contract": "64a1b2c3d4e5f6789012347",
    "subscriptionType": "janitorial",
    "plan": {
      "name": "Standard Weekly",
      "frequency": "weekly",
      "price": 500,
      "currency": "USD"
    },
    "status": "active",
    "schedule": {
      "startDate": "2025-02-05T00:00:00.000Z",
      "nextService": "2025-02-05T08:00:00.000Z"
    },
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Update Subscription Status

```http
PUT /api/facility-care/subscriptions/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "paused"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription status updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012349",
    "status": "paused",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

### Book Facility Care Service

```http
POST /api/facility-care/:id/book
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2025-01-20T00:00:00.000Z",
  "frequency": "weekly",
  "duration": 12,
  "facilityAddress": {
    "street": "123 Business St",
    "city": "Manila",
    "state": "Metro Manila",
    "zipCode": "1000",
    "country": "Philippines"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Facility care service booked successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012350",
    "client": "64a1b2c3d4e5f6789012348",
    "service": "64a1b2c3d4e5f6789012345",
    "startDate": "2025-01-20T00:00:00.000Z",
    "frequency": "weekly",
    "duration": 12,
    "status": "pending",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Get Service History

```http
GET /api/facility-care/subscriptions/:id/history
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": "64a1b2c3d4e5f6789012349",
    "serviceHistory": [
      {
        "scheduledDate": "2025-02-05T08:00:00.000Z",
        "actualDate": "2025-02-05T08:15:00.000Z",
        "status": "completed",
        "notes": "Service completed successfully",
        "provider": {
          "_id": "64a1b2c3d4e5f6789012346",
          "firstName": "John",
          "lastName": "Provider"
        }
      },
      {
        "scheduledDate": "2025-02-12T08:00:00.000Z",
        "actualDate": "2025-02-12T08:00:00.000Z",
        "status": "completed",
        "notes": "Routine service",
        "provider": {
          "_id": "64a1b2c3d4e5f6789012346",
          "firstName": "John",
          "lastName": "Provider"
        }
      }
    ]
  }
}
```

### Get Payment History

```http
GET /api/facility-care/subscriptions/:id/payments
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": "64a1b2c3d4e5f6789012349",
    "paymentHistory": [
      {
        "date": "2025-02-01T00:00:00.000Z",
        "amount": 500,
        "status": "paid",
        "transactionId": "TXN123456"
      },
      {
        "date": "2025-03-01T00:00:00.000Z",
        "amount": 500,
        "status": "paid",
        "transactionId": "TXN123457"
      }
    ]
  }
}
```

---

## Facility Care Service Flow

### 1. Service Creation
- Provider creates facility care service via `POST /api/facility-care`
- Provider sets pricing, availability, and service areas
- Provider uploads service images
- Service becomes available for booking

### 2. Contract Creation
- Client creates contract via `POST /api/facility-care/contracts`
- Contract includes facility details, scope, pricing, and terms
- Contract status: `draft` → `pending` → `active`
- Documents uploaded and verified

### 3. Subscription Setup
- Client creates subscription via `POST /api/facility-care/subscriptions`
- Subscription linked to contract and service
- Schedule configured with start date and frequency
- Payment method and auto-pay configured

### 4. Service Delivery
- Services scheduled based on frequency
- Provider performs services
- Service history updated with completion status
- Next service date calculated automatically

### 5. Payment Processing
- Payments processed based on payment terms
- Payment history tracked
- Auto-pay processes recurring payments
- Payment status updated

---

## Contract Status Flow

```
draft → pending → active → completed/terminated
```

**Status Details:**
- **draft** - Contract being created
- **pending** - Contract awaiting approval
- **active** - Contract active and services being delivered
- **suspended** - Contract temporarily suspended
- **completed** - Contract completed successfully
- **terminated** - Contract terminated early

---

## Subscription Status Flow

```
active → paused → active/cancelled
```

**Status Details:**
- **active** - Subscription active, services being delivered
- **paused** - Subscription temporarily paused
- **cancelled** - Subscription cancelled
- **expired** - Subscription expired

---

## Service Categories

### Janitorial Services
- Office cleaning
- Restroom maintenance
- Floor care
- Trash removal
- Window cleaning

### Landscaping Services
- Lawn maintenance
- Tree care
- Garden maintenance
- Irrigation
- Snow removal

### Pest Control Services
- Regular pest control
- Termite treatment
- Rodent control
- Insect control
- Preventive treatments

### Maintenance Services
- HVAC maintenance
- Plumbing maintenance
- Electrical maintenance
- General repairs
- Preventive maintenance

### Security Services
- Security patrol
- Access control
- Monitoring
- Guard services
- Alarm systems

---

## Facility Types

- **Office** - Office buildings
- **Retail** - Retail stores
- **Warehouse** - Warehouse facilities
- **Residential** - Residential buildings
- **Industrial** - Industrial facilities
- **Healthcare** - Healthcare facilities
- **Educational** - Educational institutions

---

## Pricing Models

### Hourly Pricing
- **Type**: `hourly`
- **Description**: Charged per hour of service
- **Use Case**: Flexible service needs

### Monthly Pricing
- **Type**: `monthly`
- **Description**: Fixed monthly rate
- **Use Case**: Regular recurring services

### Per Square Foot Pricing
- **Type**: `per_sqft`
- **Description**: Charged based on facility size
- **Use Case**: Size-based pricing

### Per Visit Pricing
- **Type**: `per_visit`
- **Description**: Charged per service visit
- **Use Case**: As-needed services

### Contract Pricing
- **Type**: `contract`
- **Description**: Custom contract pricing
- **Use Case**: Long-term agreements

---

## Data Models

### FacilityCareService Model

```javascript
{
  // Basic Information
  name: String,                    // Required
  description: String,             // Required
  category: String,                // Required, enum: janitorial, landscaping, pest_control, maintenance, security
  provider: ObjectId,              // Required, User reference
  
  // Pricing
  pricing: {
    type: String,                  // enum: hourly, monthly, per_sqft, per_visit, contract
    basePrice: Number,              // Required
    currency: String                // Default: USD
  },
  
  // Service Area
  serviceArea: [String],           // Zip codes or cities
  
  // Availability
  availability: {
    schedule: [{
      day: String,                  // Day of week
      startTime: String,            // Start time
      endTime: String,              // End time
      isAvailable: Boolean          // Default: true
    }],
    timezone: String                // Timezone
  },
  
  // Service Details
  features: [String],               // Service features
  requirements: [String],          // Service requirements
  
  // Media
  images: [String],                // Image URLs
  
  // Status
  isActive: Boolean,               // Default: true
  rating: {
    average: Number,                // Default: 0, 0-5
    count: Number                   // Default: 0
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Contract Model

```javascript
{
  // Parties
  client: ObjectId,                // Required, User reference
  provider: ObjectId,              // Required, User reference
  service: ObjectId,               // Required, FacilityCareService reference
  
  // Facility Information
  facility: {
    name: String,                  // Required
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    size: {
      area: Number,                 // Required
      unit: String                  // Default: sqft
    },
    type: String                    // enum: office, retail, warehouse, residential, industrial, healthcare, educational
  },
  
  // Contract Details
  contractDetails: {
    startDate: Date,                // Required
    endDate: Date,                  // Required
    duration: Number,               // in months
    frequency: String,              // enum: daily, weekly, bi-weekly, monthly, quarterly, as_needed
    scope: [String],                // Service scope
    specialRequirements: [String]   // Special requirements
  },
  
  // Pricing
  pricing: {
    basePrice: Number,              // Required
    frequency: String,              // enum: monthly, quarterly, annually
    additionalFees: [{
      description: String,
      amount: Number,
      frequency: String
    }],
    totalAmount: Number,
    currency: String                // Default: USD
  },
  
  // Payment
  payment: {
    terms: String,                  // enum: net_15, net_30, net_60, due_on_receipt
    method: String,
    autoPay: Boolean                // Default: false
  },
  
  // Status
  status: String,                   // enum: draft, pending, active, suspended, completed, terminated
  
  // Performance
  performance: {
    serviceLevel: String,           // enum: standard, premium, custom
    kpis: [{
      metric: String,
      target: Number,
      actual: Number,
      unit: String
    }]
  },
  
  // Documents
  documents: [{
    type: String,                   // enum: contract, invoice, report, certificate, other
    name: String,
    url: String,
    uploadedAt: Date
  }],
  
  // Reviews
  reviews: [{
    date: Date,
    rating: Number,                  // 1-5
    comment: String,
    reviewer: ObjectId              // User reference
  }],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Subscription Model

```javascript
{
  // Core Fields
  client: ObjectId,                 // Required, User reference
  service: ObjectId,                // Required, FacilityCareService reference
  contract: ObjectId,               // Optional, Contract reference
  subscriptionType: String,         // enum: janitorial, landscaping, pest_control, maintenance, comprehensive
  
  // Plan
  plan: {
    name: String,                   // Required
    features: [String],
    frequency: String,              // enum: weekly, bi-weekly, monthly, quarterly
    price: Number,                  // Required
    currency: String                 // Default: USD
  },
  
  // Schedule
  schedule: {
    startDate: Date,                // Required
    nextService: Date,               // Optional
    lastService: Date,               // Optional
    serviceHistory: [{
      scheduledDate: Date,
      actualDate: Date,
      status: String,               // enum: scheduled, completed, cancelled, rescheduled
      notes: String,
      provider: ObjectId            // User reference
    }]
  },
  
  // Status
  status: String,                   // enum: active, paused, cancelled, expired
  
  // Payment
  payment: {
    method: String,
    autoPay: Boolean,               // Default: false
    lastPayment: Date,
    nextPayment: Date,
    paymentHistory: [{
      date: Date,
      amount: Number,
      status: String,               // enum: pending, paid, failed
      transactionId: String
    }]
  },
  
  // Preferences
  preferences: {
    preferredTime: String,          // Time preference
    contactMethod: String,          // Preferred contact method
    specialInstructions: String     // Special instructions
  },
  
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

**Filters:**
- `category` - Filter by service category
- `area` - Filter by service area
- `provider` - Filter by provider ID
- `isActive` - Filter by active status

**Location Search:**
- `lat` - Latitude coordinate
- `lng` - Longitude coordinate
- `radius` - Search radius in kilometers

### Response Format

**List Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [...]
}
```

---

## Key Metrics

- **Total Services** - Total facility care services
- **Active Contracts** - Number of active contracts
- **Active Subscriptions** - Number of active subscriptions
- **Service Completion Rate** - Percentage of services completed on time
- **Contract Value** - Total contract value
- **Subscription Revenue** - Recurring subscription revenue
- **Customer Satisfaction** - Average ratings and reviews
- **Service Frequency** - Distribution by frequency

---

## Related Features

The Facility Care feature integrates with several other features in the LocalPro Super App:

- **User Management** - Client and provider profiles
- **Providers** - Provider profiles and management
- **Finance** - Payment processing and billing
- **File Storage** - Document and image storage (Cloudinary)
- **Email Service** - Contract and subscription notifications
- **Analytics** - Performance analytics and reporting
- **Maps & Location** - Service area mapping
- **Communication** - Contract and subscription communication

---

## Common Use Cases

1. **Service Listing** - Providers create facility care service listings
2. **Contract Creation** - Clients create formal service contracts
3. **Subscription Setup** - Clients set up recurring service subscriptions
4. **Service Delivery** - Providers deliver scheduled services
5. **Performance Tracking** - Track contract and subscription performance
6. **Payment Management** - Process recurring payments
7. **Document Management** - Manage contract documents
8. **Service History** - Track service delivery history

---

## Error Handling

**Common Error Codes:**
- `400` - Validation errors (invalid data, missing fields)
- `401` - Unauthorized (no token provided)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (service, contract, or subscription doesn't exist)
- `409` - Conflict (duplicate contract, scheduling conflict)
- `500` - Server error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "startDate",
      "message": "Start date must be in the future"
    }
  ]
}
```

---

## Best Practices

### For Providers
1. **Clear Service Descriptions** - Provide detailed service descriptions
2. **Accurate Pricing** - Set accurate and competitive pricing
3. **Availability Management** - Keep availability schedules up to date
4. **Performance Tracking** - Monitor contract and subscription performance
5. **Timely Service Delivery** - Deliver services on schedule

### For Clients
1. **Facility Information** - Provide accurate facility details
2. **Contract Terms** - Review contract terms carefully
3. **Payment Setup** - Configure payment methods and auto-pay
4. **Service Preferences** - Set clear service preferences
5. **Performance Monitoring** - Monitor service delivery and performance

### For Developers
1. **Schedule Validation** - Validate service schedules and dates
2. **Payment Processing** - Ensure reliable payment processing
3. **Service History** - Maintain accurate service history
4. **Document Management** - Secure document storage and access
5. **Notification System** - Send timely notifications for events

---

*For detailed implementation guidance, see the individual documentation files in the `features/facility-care/` and `docs/features/` directories.*

