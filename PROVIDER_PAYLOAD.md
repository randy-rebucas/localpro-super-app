# Provider Payload Structure

This document describes the complete provider payload structure for the LocalPro Super App.

## Provider Model Schema

### Base Provider Fields

```javascript
{
  // Required Fields
  userId: ObjectId,              // Reference to User (required, unique)
  providerType: String,         // Enum: 'individual', 'business', 'agency' (required)
  
  // Status
  status: String,                // Enum: 'pending', 'active', 'suspended', 'inactive', 'rejected'
                                 // Default: 'pending'
  
  // References (ObjectIds - auto-created)
  businessInfo: ObjectId,       // Reference to ProviderBusinessInfo (required for business/agency)
  professionalInfo: ObjectId,   // Reference to ProviderProfessionalInfo
  verification: ObjectId,        // Reference to ProviderVerification
  financialInfo: ObjectId,        // Reference to ProviderFinancialInfo
  performance: ObjectId,         // Reference to ProviderPerformance
  preferences: ObjectId,          // Reference to ProviderPreferences
  
  // Onboarding Progress
  onboarding: {
    completed: Boolean,          // Default: false
    currentStep: String,         // Default: 'profile_setup'
    progress: Number,            // Percentage (0-100), default: 0
    steps: [{
      step: String,
      completed: Boolean,
      completedAt: Date,
      data: Mixed
    }]
  },
  
  // Provider Settings
  settings: {
    profileVisibility: String,   // Enum: 'public', 'private', 'verified_only'
                                 // Default: 'public'
    showContactInfo: Boolean,    // Default: true
    showPricing: Boolean,         // Default: true
    showReviews: Boolean,         // Default: true
    allowDirectBooking: Boolean, // Default: true
    requireApproval: Boolean     // Default: false
  },
  
  // Metadata
  metadata: {
    lastActive: Date,
    profileViews: Number,        // Default: 0
    searchRanking: Number,       // Default: 0
    featured: Boolean,           // Default: false
    promoted: Boolean,           // Default: false
    tags: [String],
    notes: String                 // Admin notes
  },
  
  // Timestamps (auto-generated)
  createdAt: Date,
  updatedAt: Date
}
```

## Related Models

### ProviderBusinessInfo

```javascript
{
  provider: ObjectId,           // Reference to Provider (required, unique)
  businessName: String,          // Required for business/agency providers
  businessType: String,
  businessRegistration: String,
  taxId: String,
  businessAddress: {
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
  businessPhone: String,
  businessEmail: String,
  website: String,
  businessDescription: String,
  yearEstablished: Number,
  numberOfEmployees: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### ProviderProfessionalInfo

```javascript
{
  provider: ObjectId,            // Reference to Provider (required, unique)
  specialties: [{
    experience: Number,          // Years of experience (min: 0)
    certifications: [{
      name: String,
      issuer: String,
      dateIssued: Date,
      expiryDate: Date,
      certificateNumber: String
    }],
    skills: [ObjectId],           // References to ProviderSkill
    hourlyRate: Number,          // Min: 0
    serviceAreas: [{
      city: String,
      state: String,
      radius: Number             // In miles/km (min: 0)
    }]
  }],
  languages: [String],
  availability: {
    monday: {
      start: String,             // Time format (e.g., "09:00")
      end: String,               // Time format (e.g., "17:00")
      available: Boolean          // Default: true
    },
    tuesday: { ... },
    wednesday: { ... },
    thursday: { ... },
    friday: { ... },
    saturday: { ... },
    sunday: { ... }
  },
  emergencyServices: Boolean,    // Default: false
  travelDistance: Number,        // Maximum travel distance (min: 0)
  minimumJobValue: Number,       // Min: 0
  maximumJobValue: Number,       // Min: 0
  createdAt: Date,
  updatedAt: Date
}
```

### ProviderVerification

```javascript
{
  provider: ObjectId,            // Reference to Provider (required, unique)
  identityVerified: Boolean,     // Default: false
  businessVerified: Boolean,      // Default: false
  backgroundCheck: {
    status: String,              // Enum: 'pending', 'passed', 'failed', 'not_required'
                                 // Default: 'pending'
    dateCompleted: Date,
    reportId: String
  },
  insurance: {
    hasInsurance: Boolean,       // Default: false
    insuranceProvider: String,
    policyNumber: String,
    coverageAmount: Number,
    expiryDate: Date,
    documents: [String]          // URLs to insurance documents
  },
  licenses: [{
    type: String,
    number: String,
    issuingAuthority: String,
    issueDate: Date,
    expiryDate: Date,
    documents: [String]          // URLs to license documents
  }],
  references: [{
    name: String,
    relationship: String,
    phone: String,
    email: String,
    company: String,
    verified: Boolean            // Default: false
  }],
  portfolio: {
    images: [String],            // URLs to images
    videos: [String],            // URLs to videos
    descriptions: [String],
    beforeAfter: [{
      before: String,            // URL to before image
      after: String,            // URL to after image
      description: String
    }]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### ProviderPerformance

```javascript
{
  provider: ObjectId,            // Reference to Provider (required, unique)
  rating: Number,                // 0-5, default: 0
  totalReviews: Number,          // Min: 0, default: 0
  totalJobs: Number,             // Min: 0, default: 0
  completedJobs: Number,         // Min: 0, default: 0
  cancelledJobs: Number,         // Min: 0, default: 0
  responseTime: Number,           // Average response time in minutes (min: 0, default: 0)
  completionRate: Number,         // 0-100, default: 0
  repeatCustomerRate: Number,    // 0-100, default: 0
  earnings: {
    total: Number,               // Min: 0, default: 0
    thisMonth: Number,           // Min: 0, default: 0
    lastMonth: Number,            // Min: 0, default: 0
    pending: Number               // Min: 0, default: 0
  },
  badges: [{
    name: String,
    description: String,
    earnedDate: Date,
    category: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### ProviderPreferences

```javascript
{
  provider: ObjectId,            // Reference to Provider (required, unique)
  notificationSettings: {
    newJobAlerts: Boolean,       // Default: true
    messageNotifications: Boolean, // Default: true
    paymentNotifications: Boolean,  // Default: true
    reviewNotifications: Boolean,   // Default: true
    marketingEmails: Boolean        // Default: false
  },
  jobPreferences: {
    preferredJobTypes: [String],
    avoidJobTypes: [String],
    preferredTimeSlots: [String],
    maxJobsPerDay: Number,       // Default: 5
    advanceBookingDays: Number   // Default: 30
  },
  communicationPreferences: {
    preferredContactMethod: String, // Enum: 'phone', 'email', 'sms', 'app'
                                    // Default: 'app'
    responseTimeExpectation: Number, // Minutes, default: 60
    autoAcceptJobs: Boolean          // Default: false
  },
  createdAt: Date,
  updatedAt: Date
}
```

### ProviderFinancialInfo

```javascript
{
  provider: ObjectId,            // Reference to Provider (required, unique)
  bankAccount: {
    accountHolder: String,
    accountNumber: String,       // Encrypted
    routingNumber: String,       // Encrypted
    bankName: String,
    accountType: String          // Enum: 'checking', 'savings'
  },
  taxInfo: {
    ssn: String,                 // Encrypted
    ein: String,                 // Encrypted
    taxClassification: String,
    w9Submitted: Boolean         // Default: false
  },
  paymentMethods: [{
    type: String,                // Enum: 'bank_transfer', 'paypal', 'paymaya', 'check'
    details: Mixed,
    isDefault: Boolean           // Default: false
  }],
  commissionRate: Number,        // 0-1, default: 0.1 (10%)
  minimumPayout: Number,         // Min: 0, default: 50
  createdAt: Date,
  updatedAt: Date
}
```

## API Payload Examples

### 1. Create Provider Profile (POST /api/providers/profile)

**Request Payload (Individual Provider):**
```json
{
  "providerType": "individual",
  "professionalInfo": {
    "specialties": [{
      "experience": 5,
      "hourlyRate": 50,
      "serviceAreas": [{
        "city": "New York",
        "state": "NY",
        "radius": 25
      }],
      "skills": ["507f1f77bcf86cd799439011"]
    }],
    "languages": ["English", "Spanish"],
    "availability": {
      "monday": {
        "start": "09:00",
        "end": "17:00",
        "available": true
      },
      "tuesday": {
        "start": "09:00",
        "end": "17:00",
        "available": true
      }
    },
    "emergencyServices": true,
    "travelDistance": 50
  },
  "settings": {
    "profileVisibility": "public",
    "showContactInfo": true,
    "showPricing": true
  }
}
```

**Request Payload (Business Provider):**
```json
{
  "providerType": "business",
  "businessInfo": {
    "businessName": "John's Plumbing Services",
    "businessType": "small_business",
    "businessRegistration": "REG-12345",
    "taxId": "TAX-12345",
    "businessAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      }
    },
    "businessPhone": "+1234567890",
    "businessEmail": "business@example.com",
    "website": "https://example.com",
    "businessDescription": "Professional plumbing services",
    "yearEstablished": 2020,
    "numberOfEmployees": 10
  },
  "professionalInfo": {
    "specialties": [{
      "experience": 10,
      "certifications": [{
        "name": "Licensed Plumber",
        "issuer": "State Board",
        "dateIssued": "2020-01-15",
        "expiryDate": "2025-01-15",
        "certificateNumber": "PL-12345"
      }],
      "hourlyRate": 75,
      "serviceAreas": [{
        "city": "New York",
        "state": "NY",
        "radius": 30
      }]
    }],
    "languages": ["English"],
    "availability": {
      "monday": { "start": "08:00", "end": "18:00", "available": true },
      "tuesday": { "start": "08:00", "end": "18:00", "available": true },
      "wednesday": { "start": "08:00", "end": "18:00", "available": true },
      "thursday": { "start": "08:00", "end": "18:00", "available": true },
      "friday": { "start": "08:00", "end": "18:00", "available": true }
    }
  }
}
```

**Response Payload:**
```json
{
  "success": true,
  "message": "Provider profile created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "providerType": "business",
    "status": "pending",
    "businessInfo": "507f1f77bcf86cd799439013",
    "professionalInfo": "507f1f77bcf86cd799439014",
    "verification": "507f1f77bcf86cd799439015",
    "financialInfo": "507f1f77bcf86cd799439016",
    "performance": "507f1f77bcf86cd799439017",
    "preferences": "507f1f77bcf86cd799439018",
    "onboarding": {
      "completed": false,
      "currentStep": "profile_setup",
      "progress": 10,
      "steps": [{
        "step": "profile_setup",
        "completed": true,
        "completedAt": "2024-01-15T10:30:00.000Z"
      }]
    },
    "settings": {
      "profileVisibility": "public",
      "showContactInfo": true,
      "showPricing": true,
      "showReviews": true,
      "allowDirectBooking": true,
      "requireApproval": false
    },
    "metadata": {
      "lastActive": "2024-01-15T10:30:00.000Z",
      "profileViews": 0,
      "searchRanking": 0,
      "featured": false,
      "promoted": false,
      "tags": []
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get Provider Profile (GET /api/providers/profile/me)

**Response Payload (with populated references):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": {
      "_id": "507f1f77bcf86cd799439012",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890"
    },
    "providerType": "business",
    "status": "active",
    "businessInfo": {
      "_id": "507f1f77bcf86cd799439013",
      "businessName": "John's Plumbing Services",
      "businessType": "small_business",
      "businessAddress": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      },
      "businessPhone": "+1234567890",
      "businessEmail": "business@example.com",
      "website": "https://example.com",
      "yearEstablished": 2020,
      "numberOfEmployees": 10
    },
    "professionalInfo": {
      "_id": "507f1f77bcf86cd799439014",
      "specialties": [{
        "_id": "507f1f77bcf86cd799439019",
        "experience": 10,
        "certifications": [{
          "name": "Licensed Plumber",
          "issuer": "State Board",
          "dateIssued": "2020-01-15T00:00:00.000Z",
          "expiryDate": "2025-01-15T00:00:00.000Z",
          "certificateNumber": "PL-12345"
        }],
        "skills": [{
          "_id": "507f1f77bcf86cd799439020",
          "name": "Plumbing",
          "description": "General plumbing services"
        }],
        "hourlyRate": 75,
        "serviceAreas": [{
          "city": "New York",
          "state": "NY",
          "radius": 30
        }]
      }],
      "languages": ["English"],
      "availability": {
        "monday": { "start": "08:00", "end": "18:00", "available": true },
        "tuesday": { "start": "08:00", "end": "18:00", "available": true }
      },
      "emergencyServices": true,
      "travelDistance": 50
    },
    "verification": {
      "_id": "507f1f77bcf86cd799439015",
      "identityVerified": true,
      "businessVerified": true,
      "backgroundCheck": {
        "status": "passed",
        "dateCompleted": "2024-01-10T00:00:00.000Z"
      },
      "insurance": {
        "hasInsurance": true,
        "insuranceProvider": "ABC Insurance",
        "policyNumber": "POL-12345",
        "coverageAmount": 1000000,
        "expiryDate": "2025-01-15T00:00:00.000Z"
      },
      "licenses": [{
        "type": "Plumbing License",
        "number": "PL-12345",
        "issuingAuthority": "State Board",
        "issueDate": "2020-01-15T00:00:00.000Z",
        "expiryDate": "2025-01-15T00:00:00.000Z"
      }]
    },
    "performance": {
      "_id": "507f1f77bcf86cd799439017",
      "rating": 4.5,
      "totalReviews": 25,
      "totalJobs": 100,
      "completedJobs": 95,
      "cancelledJobs": 5,
      "responseTime": 15,
      "completionRate": 95,
      "repeatCustomerRate": 60,
      "earnings": {
        "total": 50000,
        "thisMonth": 5000,
        "lastMonth": 4500,
        "pending": 1000
      },
      "badges": [{
        "name": "Top Rated",
        "description": "Consistently high ratings",
        "earnedDate": "2024-01-01T00:00:00.000Z",
        "category": "performance"
      }]
    },
    "preferences": {
      "_id": "507f1f77bcf86cd799439018",
      "notificationSettings": {
        "newJobAlerts": true,
        "messageNotifications": true,
        "paymentNotifications": true,
        "reviewNotifications": true,
        "marketingEmails": false
      },
      "jobPreferences": {
        "preferredJobTypes": ["plumbing", "repair"],
        "avoidJobTypes": [],
        "preferredTimeSlots": ["morning", "afternoon"],
        "maxJobsPerDay": 5,
        "advanceBookingDays": 30
      },
      "communicationPreferences": {
        "preferredContactMethod": "app",
        "responseTimeExpectation": 60,
        "autoAcceptJobs": false
      }
    },
    "settings": {
      "profileVisibility": "public",
      "showContactInfo": true,
      "showPricing": true,
      "showReviews": true,
      "allowDirectBooking": true,
      "requireApproval": false
    },
    "onboarding": {
      "completed": true,
      "currentStep": "completed",
      "progress": 100,
      "steps": [
        { "step": "profile_setup", "completed": true, "completedAt": "2024-01-15T10:30:00.000Z" },
        { "step": "verification", "completed": true, "completedAt": "2024-01-16T10:30:00.000Z" }
      ]
    },
    "metadata": {
      "lastActive": "2024-01-20T10:30:00.000Z",
      "profileViews": 150,
      "searchRanking": 8.5,
      "featured": true,
      "promoted": false,
      "tags": ["verified", "top-rated"]
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

**Note:** `financialInfo` is typically excluded from public/provider profile responses for security reasons.

### 3. Update Provider Profile (PUT /api/providers/profile)

**Request Payload:**
```json
{
  "professionalInfo": {
    "specialties": [{
      "experience": 12,
      "hourlyRate": 80,
      "serviceAreas": [{
        "city": "New York",
        "state": "NY",
        "radius": 35
      }]
    }],
    "languages": ["English", "Spanish", "French"]
  },
  "settings": {
    "showPricing": false,
    "requireApproval": true
  }
}
```

**Note:** Only include fields you want to update. Nested objects are merged, not replaced.

### 4. Update Business Info (PUT /api/providers/profile)

**Request Payload:**
```json
{
  "businessInfo": {
    "businessName": "Updated Business Name",
    "businessPhone": "+1234567891",
    "businessEmail": "newemail@example.com",
    "website": "https://newwebsite.com",
    "numberOfEmployees": 15
  }
}
```

## Field Validation Rules

### Required Fields
- `userId`: Required, must be a valid User ObjectId, must be unique
- `providerType`: Required, must be one of: `'individual'`, `'business'`, `'agency'`
- `businessInfo.businessName`: Required if `providerType` is `'business'` or `'agency'`

### Optional Fields
- `status`: Defaults to `'pending'`, must be one of: `'pending'`, `'active'`, `'suspended'`, `'inactive'`, `'rejected'`
- `settings.profileVisibility`: Defaults to `'public'`, must be one of: `'public'`, `'private'`, `'verified_only'`

### Professional Info
- `specialties[].experience`: Number, minimum: 0
- `specialties[].hourlyRate`: Number, minimum: 0
- `specialties[].serviceAreas[].radius`: Number, minimum: 0
- `travelDistance`: Number, minimum: 0
- `minimumJobValue`: Number, minimum: 0
- `maximumJobValue`: Number, minimum: 0

### Performance
- `rating`: Number, range: 0-5
- `completionRate`: Number, range: 0-100
- `repeatCustomerRate`: Number, range: 0-100
- `earnings.*`: Number, minimum: 0

### Financial Info
- `commissionRate`: Number, range: 0-1 (0% to 100%)
- `minimumPayout`: Number, minimum: 0
- `bankAccount.accountType`: Must be one of: `'checking'`, `'savings'`

### Preferences
- `communicationPreferences.preferredContactMethod`: Must be one of: `'phone'`, `'email'`, `'sms'`, `'app'`
- `jobPreferences.maxJobsPerDay`: Number, default: 5
- `jobPreferences.advanceBookingDays`: Number, default: 30

## Auto-Generated Fields

These fields are automatically created and should not be included in request payloads:

- `_id`: MongoDB ObjectId
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `verification`: Auto-created ProviderVerification document
- `preferences`: Auto-created ProviderPreferences document
- `financialInfo`: Auto-created ProviderFinancialInfo document
- `professionalInfo`: Auto-created ProviderProfessionalInfo document (if not provided)
- `businessInfo`: Auto-created ProviderBusinessInfo document (for business/agency types)
- `performance`: Auto-created ProviderPerformance document
- `metadata.lastActive`: Auto-updated on save
- `onboarding.steps[].completedAt`: Auto-set when step is completed

## Virtual Fields

The Provider model includes virtual fields:

- `fullName`: Returns business name (for business/agency) or user's full name (for individual)
- `completionRate`: Calculated from `performance.completedJobs / performance.totalJobs` (deprecated - use `performance.completionRate` instead)

## Related Documents

When fetching a provider, related documents can be populated:
- `businessInfo`: ProviderBusinessInfo document
- `professionalInfo`: ProviderProfessionalInfo document (with populated skills)
- `verification`: ProviderVerification document
- `financialInfo`: ProviderFinancialInfo document (typically excluded from public responses)
- `performance`: ProviderPerformance document
- `preferences`: ProviderPreferences document
- `userId`: User document (with populated related documents)

## Provider Types

### Individual Provider
- `providerType`: `'individual'`
- `businessInfo`: Not required (but can be created)
- Suitable for solo service providers

### Business Provider
- `providerType`: `'business'`
- `businessInfo`: **Required** (must include `businessName`)
- Suitable for small businesses and companies

### Agency Provider
- `providerType`: `'agency'`
- `businessInfo`: **Required** (must include `businessName`)
- Suitable for agencies managing multiple providers

## Onboarding Steps

Common onboarding steps:
- `profile_setup`: Initial profile creation
- `business_info`: Business information (for business/agency)
- `professional_info`: Professional information and specialties
- `verification`: Identity and business verification
- `documents`: License and insurance document upload
- `payment_setup`: Financial information setup
- `completed`: All steps completed

## Security Notes

1. **Financial Info**: `ProviderFinancialInfo` is typically excluded from public API responses
2. **Encrypted Fields**: Bank account numbers, routing numbers, SSN, and EIN are encrypted
3. **Verification Documents**: Document URLs in verification should be secured
4. **Admin Notes**: `metadata.notes` is only visible to admins

