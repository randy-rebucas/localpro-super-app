# Partners Features Documentation

## Overview

The Partners feature enables third-party companies and applications to integrate with the LocalPro Super App platform. Partners can onboard through a structured multi-step process, receive API credentials, and access the platform programmatically through REST APIs and webhooks. This feature facilitates partnerships with technology companies, business partners, marketplaces, and enterprise clients.

## Base Path
`/api/partners`

---

## Core Features

### 1. Partner Onboarding
- **Multi-Step Onboarding** - Structured onboarding process with 5 steps:
  - `basic_info` - Name, email, phone
  - `business_info` - Company details, industry
  - `api_setup` - Webhook and callback URLs
  - `verification` - Document uploads
  - `activation` - API credentials generation
- **Progress Tracking** - Track onboarding progress (0-100%)
- **Step Management** - Manage current step and completion status
- **Onboarding History** - Track onboarding timeline
- **Resume Capability** - Resume onboarding from any step

### 2. Partner Management
- **Partner Creation** - Create new partner accounts
- **Partner Status** - Manage partner lifecycle:
  - `pending` - Awaiting onboarding completion
  - `active` - Partner active and operational
  - `suspended` - Temporarily suspended
  - `inactive` - Partner deactivated
  - `rejected` - Partner application rejected
- **Partner Updates** - Update partner information
- **Soft Delete** - Soft delete partners with audit trail
- **Partner Search** - Search partners by name, company, industry

### 3. API Integration
- **API Credentials** - Secure API access credentials:
  - `clientId` - Client identifier (UUID)
  - `clientSecret` - Client secret (UUID, never exposed)
  - `apiKey` - API key for authentication (UUID)
- **Credential Generation** - Automatic credential generation on activation
- **Credential Security** - Credentials encrypted and never exposed in logs
- **API Authentication** - Client credentials-based authentication
- **Rate Limiting** - Configurable rate limits per partner

### 4. Slug-Based Access
- **Unique Slugs** - Unique slug for each partner
- **Slug Generation** - Automatic slug generation from partner name
- **Slug Validation** - Lowercase, alphanumeric + hyphens
- **Slug Lookup** - Retrieve partner by slug for third-party login
- **Slug Uniqueness** - Automatic deduplication

### 5. Business Information
- **Company Details** - Store comprehensive business information:
  - Company name
  - Website
  - Industry
  - Description
  - Business address with coordinates
- **Contact Information** - Email and phone number
- **Business Address** - Full address with geolocation

### 6. Verification & Compliance
- **Verification Status** - Track verification status:
  - Email verified
  - Phone verified
  - Business verified
- **Document Management** - Upload and manage verification documents:
  - Business registration
  - Tax ID
  - Contract
  - Other documents
- **Document Verification** - Admin verification of documents
- **Compliance Tracking** - Track compliance requirements

### 7. Usage Tracking & Analytics
- **API Usage** - Track API usage statistics:
  - Total requests (lifetime)
  - Monthly requests
  - Last request timestamp
- **API Limits** - Configure API limits:
  - Monthly limit
  - Burst limit
- **Usage Monitoring** - Monitor usage against limits
- **Usage Reports** - Generate usage reports

### 8. Webhook Support
- **Webhook Configuration** - Configure webhook URL
- **Webhook Events** - Receive notifications for:
  - Partner status changes
  - API usage alerts
  - System maintenance notifications
  - Security events
- **Webhook Delivery** - Reliable webhook delivery
- **Webhook Security** - Secure webhook signatures

### 9. Admin Management
- **Partner Administration** - Complete partner lifecycle management
- **Admin Notes** - Add notes to partner records
- **Status Management** - Change partner status
- **Partner Assignment** - Assign partners to admin users
- **Audit Trail** - Complete audit trail for all actions

### 10. Integration Features
- **Callback URLs** - Configure callback URLs for OAuth flows
- **Third-Party Login** - Enable third-party login via slug
- **API Access** - Programmatic API access
- **SDK Support** - JavaScript SDK for easy integration
- **Documentation** - Comprehensive API documentation

---

## API Endpoints

### Public Endpoints - Onboarding

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/onboarding/start` | Start partner onboarding |
| PUT | `/:id/business-info` | Update business information |
| PUT | `/:id/api-setup` | Configure API settings |
| PUT | `/:id/verification` | Submit verification documents |
| PUT | `/:id/activate` | Activate partner |
| GET | `/slug/:slug` | Get partner by slug |

### Authenticated Endpoints - Admin

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/` | Create partner | **admin** |
| GET | `/` | Get partners list | **admin** |
| GET | `/:id` | Get partner details | **admin** |
| PUT | `/:id` | Update partner | **admin** |
| DELETE | `/:id` | Delete partner | **admin** |
| POST | `/:id/notes` | Add admin note | **admin** |

### Partner API Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/api/partner/*` | Partner API endpoints | API Key |

---

## Request/Response Examples

### Start Partner Onboarding

```http
POST /api/partners/onboarding/start
Content-Type: application/json

{
  "name": "Tech Solutions Inc.",
  "email": "contact@techsolutions.com",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Partner onboarding started successfully",
  "data": {
    "partner": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Tech Solutions Inc.",
      "email": "contact@techsolutions.com",
      "phoneNumber": "+1234567890",
      "slug": "tech-solutions-inc",
      "status": "pending",
      "onboarding": {
        "completed": false,
        "currentStep": "business_info",
        "progress": 20,
        "startedAt": "2025-01-15T10:00:00.000Z"
      },
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  }
}
```

### Update Business Information

```http
PUT /api/partners/:id/business-info
Content-Type: application/json

{
  "businessInfo": {
    "companyName": "Tech Solutions Inc.",
    "website": "https://techsolutions.com",
    "industry": "Software Development",
    "description": "Leading provider of enterprise software solutions",
    "address": {
      "street": "123 Tech Street",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94105",
      "country": "USA",
      "coordinates": {
        "lat": 37.7749,
        "lng": -122.4194
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Business information updated successfully",
  "data": {
    "partner": {
      "_id": "64a1b2c3d4e5f6789012345",
      "businessInfo": {
        "companyName": "Tech Solutions Inc.",
        "website": "https://techsolutions.com",
        "industry": "Software Development",
        "description": "Leading provider of enterprise software solutions",
        "address": {
          "street": "123 Tech Street",
          "city": "San Francisco",
          "state": "CA",
          "zipCode": "94105",
          "country": "USA",
          "coordinates": {
            "lat": 37.7749,
            "lng": -122.4194
          }
        }
      },
      "onboarding": {
        "currentStep": "api_setup",
        "progress": 40
      }
    }
  }
}
```

### Configure API Settings

```http
PUT /api/partners/:id/api-setup
Content-Type: application/json

{
  "webhookUrl": "https://api.techsolutions.com/webhooks/localpro",
  "callbackUrl": "https://app.techsolutions.com/auth/callback"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API settings configured successfully",
  "data": {
    "partner": {
      "_id": "64a1b2c3d4e5f6789012345",
      "apiCredentials": {
        "webhookUrl": "https://api.techsolutions.com/webhooks/localpro",
        "callbackUrl": "https://app.techsolutions.com/auth/callback"
      },
      "onboarding": {
        "currentStep": "verification",
        "progress": 60
      }
    }
  }
}
```

### Submit Verification Documents

```http
PUT /api/partners/:id/verification
Content-Type: application/json

{
  "documents": [
    {
      "type": "business_registration",
      "name": "Business License",
      "url": "https://storage.example.com/docs/license.pdf",
      "publicId": "partners/documents/license_123"
    },
    {
      "type": "tax_id",
      "name": "Tax Identification",
      "url": "https://storage.example.com/docs/tax.pdf",
      "publicId": "partners/documents/tax_123"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification documents submitted successfully",
  "data": {
    "partner": {
      "_id": "64a1b2c3d4e5f6789012345",
      "verification": {
        "documents": [
          {
            "_id": "64a1b2c3d4e5f6789012346",
            "type": "business_registration",
            "name": "Business License",
            "url": "https://storage.example.com/docs/license.pdf",
            "uploadedAt": "2025-01-15T10:30:00.000Z",
            "verified": false
          }
        ]
      },
      "onboarding": {
        "currentStep": "activation",
        "progress": 80
      }
    }
  }
}
```

### Activate Partner

```http
PUT /api/partners/:id/activate
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Partner activated successfully",
  "data": {
    "partner": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Tech Solutions Inc.",
      "email": "contact@techsolutions.com",
      "slug": "tech-solutions-inc",
      "status": "active",
      "onboarding": {
        "completed": true,
        "progress": 100,
        "completedAt": "2025-01-15T11:00:00.000Z"
      },
      "apiCredentials": {
        "clientId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "apiKey": "x1y2z3w4-v5u6-7890-abcd-ef1234567890",
        "webhookUrl": "https://api.techsolutions.com/webhooks/localpro",
        "callbackUrl": "https://app.techsolutions.com/auth/callback"
      },
      "usage": {
        "totalRequests": 0,
        "monthlyRequests": 0,
        "apiLimits": {
          "monthlyLimit": 10000,
          "burstLimit": 100
        }
      }
    }
  }
}
```

### Get Partner by Slug

```http
GET /api/partners/slug/tech-solutions-inc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "partner": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Tech Solutions Inc.",
      "slug": "tech-solutions-inc",
      "businessInfo": {
        "companyName": "Tech Solutions Inc.",
        "website": "https://techsolutions.com",
        "industry": "Software Development"
      },
      "status": "active"
    }
  }
}
```

### Get Partners List (Admin)

```http
GET /api/partners?status=active&page=1&limit=20&search=tech
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "partners": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "Tech Solutions Inc.",
        "email": "contact@techsolutions.com",
        "slug": "tech-solutions-inc",
        "status": "active",
        "onboarding": {
          "completed": true,
          "progress": 100
        },
        "businessInfo": {
          "companyName": "Tech Solutions Inc.",
          "industry": "Software Development"
        },
        "usage": {
          "totalRequests": 1500,
          "monthlyRequests": 450,
          "lastRequestAt": "2025-01-15T09:00:00.000Z"
        },
        "createdAt": "2025-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Add Admin Note

```http
POST /api/partners/:id/notes
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "content": "Partner requested increased API limits for Q4 campaign"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note added successfully",
  "data": {
    "partner": {
      "_id": "64a1b2c3d4e5f6789012345",
      "notes": [
        {
          "_id": "64a1b2c3d4e5f6789012347",
          "content": "Partner requested increased API limits for Q4 campaign",
          "addedBy": "64a1b2c3d4e5f6789012348",
          "addedAt": "2025-01-15T12:00:00.000Z"
        }
      ]
    }
  }
}
```

---

## Partner Onboarding Flow

### 1. Start Onboarding
- Partner initiates onboarding via `POST /onboarding/start`
- Basic information collected (name, email, phone)
- Slug automatically generated
- Status set to `pending`
- Onboarding progress: 20%

### 2. Business Information
- Partner updates business info via `PUT /:id/business-info`
- Company details, industry, address provided
- Onboarding progress: 40%

### 3. API Setup
- Partner configures API settings via `PUT /:id/api-setup`
- Webhook and callback URLs configured
- Onboarding progress: 60%

### 4. Verification
- Partner submits documents via `PUT /:id/verification`
- Documents uploaded and stored
- Admin reviews documents
- Onboarding progress: 80%

### 5. Activation
- Partner activates via `PUT /:id/activate`
- API credentials generated
- Status changes to `active`
- Onboarding completed: 100%

---

## Partner Status Flow

```
pending → active
   ↓
rejected

active → suspended → active
   ↓
inactive → active
```

**Status Details:**
- **pending** - Awaiting onboarding completion
- **active** - Partner active and operational
- **suspended** - Temporarily suspended by admin
- **inactive** - Partner deactivated
- **rejected** - Partner application rejected

---

## Partner Types

### Technology Companies
- **Description**: App developers and integrators
- **Use Case**: Build integrations and applications
- **Features**: Full API access, webhooks, SDK support

### Business Partners
- **Description**: Companies offering complementary services
- **Use Case**: Cross-platform integrations
- **Features**: API access, referral tracking

### Marketplaces
- **Description**: Third-party platforms connecting to LocalPro
- **Use Case**: Marketplace integrations
- **Features**: Full API access, booking management

### Enterprise Clients
- **Description**: Large organizations with custom integrations
- **Use Case**: Enterprise-level integrations
- **Features**: Custom API limits, dedicated support

---

## Data Models

### Partner Model

```javascript
{
  // Basic Information
  name: String,                       // Required, 2-100 characters
  slug: String,                       // Required, unique, lowercase, alphanumeric + hyphens
  email: String,                      // Required, unique, valid email
  phoneNumber: String,                // Required, valid international format
  
  // Business Information
  businessInfo: {
    companyName: String,               // 2-100 characters
    website: String,                   // Valid URL
    industry: String,                  // 2-50 characters
    description: String,               // Max 500 characters
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
  
  // API Credentials
  apiCredentials: {
    clientId: String,                  // Generated UUID
    clientSecret: String,              // Generated UUID (hidden, never exposed)
    apiKey: String,                    // Generated UUID
    webhookUrl: String,
    callbackUrl: String
  },
  
  // Status
  status: String,                      // enum: pending, active, suspended, inactive, rejected
  
  // Onboarding
  onboarding: {
    completed: Boolean,                // Default: false
    steps: [{
      step: String,                    // enum: basic_info, business_info, api_setup, verification, activation
      completed: Boolean,
      completedAt: Date,
      data: Mixed
    }],
    currentStep: String,
    progress: Number,                  // 0-100
    startedAt: Date,
    completedAt: Date
  },
  
  // Verification
  verification: {
    emailVerified: Boolean,            // Default: false
    phoneVerified: Boolean,            // Default: false
    businessVerified: Boolean,         // Default: false
    documents: [{
      type: String,                    // enum: business_registration, tax_id, contract, other
      name: String,
      url: String,
      publicId: String,
      uploadedAt: Date,
      verified: Boolean,               // Default: false
      verifiedAt: Date,
      verifiedBy: ObjectId             // User reference
    }]
  },
  
  // Usage
  usage: {
    totalRequests: Number,             // Default: 0
    monthlyRequests: Number,           // Default: 0
    lastRequestAt: Date,
    apiLimits: {
      monthlyLimit: Number,            // Default: 10000
      burstLimit: Number                // Default: 100
    }
  },
  
  // Admin Management
  managedBy: ObjectId,                 // User reference
  notes: [{
    content: String,                   // Required
    addedBy: ObjectId,                 // User reference
    addedAt: Date                      // Default: Date.now
  }],
  
  // Metadata
  tags: [String],
  isActive: Boolean,                   // Default: true
  
  // Soft Delete
  deleted: Boolean,                    // Default: false
  deletedAt: Date,
  deletedBy: ObjectId,                 // User reference
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## Onboarding Steps

### Step 1: Basic Information
- **Step**: `basic_info`
- **Fields**: name, email, phoneNumber
- **Progress**: 20%
- **Next Step**: business_info

### Step 2: Business Information
- **Step**: `business_info`
- **Fields**: companyName, website, industry, description, address
- **Progress**: 40%
- **Next Step**: api_setup

### Step 3: API Setup
- **Step**: `api_setup`
- **Fields**: webhookUrl, callbackUrl
- **Progress**: 60%
- **Next Step**: verification

### Step 4: Verification
- **Step**: `verification`
- **Fields**: documents
- **Progress**: 80%
- **Next Step**: activation

### Step 5: Activation
- **Step**: `activation`
- **Action**: Generate API credentials
- **Progress**: 100%
- **Status**: active

---

## API Authentication

### Client Credentials Flow

```javascript
// Partner API authentication
const authenticatePartner = async (clientId, clientSecret) => {
  const partner = await Partner.findOne({
    'apiCredentials.clientId': clientId,
    'apiCredentials.clientSecret': clientSecret,
    status: 'active'
  });
  
  if (!partner) {
    throw new Error('Invalid credentials');
  }
  
  // Update usage tracking
  partner.usage.totalRequests += 1;
  partner.usage.monthlyRequests += 1;
  partner.usage.lastRequestAt = new Date();
  await partner.save();
  
  return partner;
};
```

### API Request Headers

```http
X-Client-Id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
X-Client-Secret: secret-value
```

---

## Webhook Events

### Partner Status Changed
```json
{
  "event": "partner.status_changed",
  "data": {
    "partnerId": "64a1b2c3d4e5f6789012345",
    "oldStatus": "pending",
    "newStatus": "active",
    "timestamp": "2025-01-15T11:00:00.000Z"
  }
}
```

### API Usage Alert
```json
{
  "event": "partner.api_usage_alert",
  "data": {
    "partnerId": "64a1b2c3d4e5f6789012345",
    "monthlyRequests": 8500,
    "monthlyLimit": 10000,
    "percentage": 85,
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

### System Maintenance
```json
{
  "event": "system.maintenance",
  "data": {
    "scheduledStart": "2025-01-20T02:00:00.000Z",
    "scheduledEnd": "2025-01-20T04:00:00.000Z",
    "message": "Scheduled maintenance window"
  }
}
```

---

## Search & Filtering

### Query Parameters

**Pagination:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Filters:**
- `status` - Filter by status (pending, active, suspended, inactive, rejected)
- `onboardingCompleted` - Filter by onboarding completion (true/false)
- `search` - Search in name, company name, description
- `industry` - Filter by industry

**Sorting:**
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order (asc/desc, default: desc)

### Response Format

**List Response:**
```json
{
  "success": true,
  "data": {
    "partners": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

## Key Metrics

- **Total Partners** - Total number of partners
- **Active Partners** - Number of active partners
- **Onboarding Completion Rate** - Percentage of completed onboardings
- **Average Onboarding Time** - Average time to complete onboarding
- **API Usage** - Total and monthly API usage
- **Partner Retention Rate** - Partner retention percentage
- **Verification Rate** - Percentage of verified partners

---

## Related Features

The Partners feature integrates with several other features in the LocalPro Super App:

- **User Management** - Admin user management
- **Authentication** - JWT-based authentication for admin operations
- **File Storage** - Document storage (Cloudinary)
- **Email Service** - Partner notifications
- **Analytics** - Partner usage analytics
- **Audit Logs** - Partner activity tracking
- **Marketplace** - Partner access to marketplace APIs
- **Finance** - Partner payment processing

---

## Common Use Cases

1. **Partner Onboarding** - New partners complete onboarding process
2. **API Integration** - Partners integrate via REST APIs
3. **Webhook Integration** - Partners receive real-time notifications
4. **Third-Party Login** - Partners enable login via slug
5. **Partner Management** - Admins manage partner lifecycle
6. **Usage Monitoring** - Track partner API usage
7. **Verification** - Verify partner documents and credentials
8. **Status Management** - Manage partner status and access

---

## Error Handling

**Common Error Codes:**
- `VALIDATION_ERROR` - Invalid request data
- `PARTNER_EXISTS` - Partner with email/slug already exists
- `PARTNER_NOT_FOUND` - Partner not found
- `INCOMPLETE_ONBOARDING` - Onboarding not complete for activation
- `INVALID_CREDENTIALS` - Invalid API credentials
- `RATE_LIMIT_EXCEEDED` - API rate limit exceeded
- `MISSING_NOTE_CONTENT` - Note content is required

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

## Best Practices

### For Partners
1. **Complete Onboarding** - Complete all onboarding steps
2. **Secure Credentials** - Keep API credentials secure
3. **Monitor Usage** - Monitor API usage against limits
4. **Webhook Implementation** - Implement webhook handlers properly
5. **Error Handling** - Implement proper error handling

### For Admins
1. **Thorough Review** - Review partner applications thoroughly
2. **Document Verification** - Verify all documents carefully
3. **Status Management** - Manage partner status appropriately
4. **Communication** - Maintain clear communication with partners
5. **Monitoring** - Monitor partner activity and usage

### For Developers
1. **Security** - Never expose clientSecret in responses
2. **Rate Limiting** - Implement proper rate limiting
3. **Error Handling** - Handle all error cases gracefully
4. **Logging** - Log all partner activities
5. **Performance** - Optimize queries and API responses
6. **Webhook Security** - Implement webhook signature verification

---

## Rate Limiting

- **Public Endpoints**: 100 requests per 15 minutes
- **Admin Endpoints**: 1000 requests per 15 minutes
- **Partner API Endpoints**: Configurable per partner (default: 10,000/month)
- **Burst Limit**: Configurable per partner (default: 100 requests)

---

## Security Considerations

1. **Credential Security** - API credentials encrypted and never exposed
2. **Access Control** - Strict access control for admin operations
3. **Rate Limiting** - Rate limiting prevents abuse
4. **Audit Logging** - Complete audit trail for all actions
5. **Soft Delete** - Soft delete protects against accidental data loss
6. **Webhook Security** - Webhook signature verification
7. **Input Validation** - Validate all inputs
8. **Document Security** - Secure document storage and access

---

*For detailed implementation guidance, see the individual documentation files in the `features/partners/` directory.*

