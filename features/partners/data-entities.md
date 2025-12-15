# Partner Data Entities

## Overview

The Partner feature uses MongoDB with Mongoose ODM for data persistence. The main entity is the Partner model with embedded sub-documents and references.

## Partner Schema

### Main Schema

```javascript
{
  // Basic Information
  name: {
    type: String,
    required: true,
    maxlength: 100
  },

  // Unique slug for third-party access
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    maxlength: 50
  },

  // Contact Information
  email: {
    type: String,
    required: true,
    unique: true
  },

  phoneNumber: {
    type: String,
    required: true
  },

  // Business Information
  businessInfo: {
    companyName: String,
    website: String,
    industry: String,
    description: String,
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

  // API Integration Credentials
  apiCredentials: {
    clientId: String, // Generated UUID
    clientSecret: String, // Generated UUID (hidden)
    apiKey: String, // Generated UUID
    webhookUrl: String,
    callbackUrl: String
  },

  // Partner Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive', 'rejected'],
    default: 'pending'
  },

  // Onboarding Process
  onboarding: {
    completed: Boolean,
    steps: [{
      step: String, // 'basic_info', 'business_info', 'api_setup', 'verification', 'activation'
      completed: Boolean,
      completedAt: Date,
      data: Mixed
    }],
    currentStep: String,
    progress: Number, // 0-100
    startedAt: Date,
    completedAt: Date
  },

  // Verification & Compliance
  verification: {
    emailVerified: Boolean,
    phoneVerified: Boolean,
    businessVerified: Boolean,
    documents: [{
      type: String, // 'business_registration', 'tax_id', 'contract', 'other'
      name: String,
      url: String,
      publicId: String,
      uploadedAt: Date,
      verified: Boolean,
      verifiedAt: Date,
      verifiedBy: ObjectId // Reference to User
    }]
  },

  // Usage & Analytics
  usage: {
    totalRequests: Number,
    monthlyRequests: Number,
    lastRequestAt: Date,
    apiLimits: {
      monthlyLimit: Number,
      burstLimit: Number
    }
  },

  // Admin Management
  managedBy: ObjectId, // Reference to User

  notes: [{
    content: String,
    addedBy: ObjectId, // Reference to User
    addedAt: Date
  }],

  // Metadata
  tags: [String],
  isActive: Boolean,

  // Soft Delete
  deleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId, // Reference to User

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

### Performance Indexes

```javascript
// Unique indexes
{ slug: 1 } // Unique
{ email: 1 } // Unique
{ 'apiCredentials.clientId': 1 } // Sparse, unique
{ 'apiCredentials.apiKey': 1 } // Sparse, unique

// Query indexes
{ status: 1 }
{ 'onboarding.completed': 1 }
{ createdAt: -1 }
{ 'businessInfo.industry': 1 }
{ tags: 1 }
{ isActive: 1, deleted: 1 }

// Compound indexes
{ status: 1, 'onboarding.completed': 1 }
{ 'onboarding.completed': 1, createdAt: -1 }

// Text search index
{
  name: 'text',
  'businessInfo.companyName': 'text',
  'businessInfo.description': 'text',
  'businessInfo.industry': 'text'
}
```

## Relationships

### Referenced Models

- **User** (`managedBy`, `deletedBy`, `notes.addedBy`, `verification.documents.verifiedBy`): Admin users managing partners

### Embedded Sub-documents

- **businessInfo**: Partner business details
- **apiCredentials**: API access credentials
- **onboarding**: Onboarding progress tracking
- **verification**: Verification status and documents
- **usage**: API usage statistics

## Data Validation

### Required Fields

- `name`: 2-100 characters
- `slug`: Unique, lowercase, alphanumeric + hyphens
- `email`: Valid email format, unique
- `phoneNumber`: Valid international format

### Optional Fields

- `businessInfo.companyName`: 2-100 characters
- `businessInfo.website`: Valid URL
- `businessInfo.industry`: 2-50 characters
- `businessInfo.description`: Max 500 characters

### Status Transitions

```javascript
pending → active      // After onboarding completion
pending → rejected    // Admin rejection
active → suspended    // Admin suspension
active → inactive     // Partner deactivation
suspended → active    // Admin reactivation
inactive → active     // Partner reactivation
```

## Business Logic

### Slug Generation

Slugs are automatically generated from partner names:
1. Convert to lowercase
2. Remove special characters
3. Replace spaces with hyphens
4. Ensure uniqueness by appending counter if needed

### Onboarding Flow

1. **basic_info**: Name, email, phone
2. **business_info**: Company details, industry
3. **api_setup**: Webhook and callback URLs
4. **verification**: Document uploads
5. **activation**: API credentials generation

### API Credentials

Generated during activation:
- `clientId`: UUID for identification
- `clientSecret`: UUID for authentication (never exposed)
- `apiKey`: UUID for API access

### Usage Tracking

- `totalRequests`: Lifetime API calls
- `monthlyRequests`: Current month API calls
- `lastRequestAt`: Timestamp of last API call

## Security Considerations

### Data Protection

- `apiCredentials.clientSecret`: Select: false (never returned in queries)
- Soft delete preserves data integrity
- Audit logging for all changes

### Access Control

- Admin-only operations require authentication
- Public onboarding endpoints have rate limiting
- API credentials validated on each request

## Migration Strategy

### From Legacy Systems

If migrating from existing partner systems:

1. **Data Mapping**: Map legacy fields to new schema
2. **Slug Generation**: Create slugs for existing partners
3. **Credential Migration**: Generate new API credentials
4. **Status Mapping**: Convert legacy statuses to new enum values

### Database Indexes

Ensure indexes are created before production deployment:

```javascript
db.partners.createIndex({ slug: 1 }, { unique: true });
db.partners.createIndex({ email: 1 }, { unique: true });
db.partners.createIndex({ status: 1 });
db.partners.createIndex({ "onboarding.completed": 1 });
```

## Performance Considerations

### Query Optimization

- Use compound indexes for common filter combinations
- Text search index for name/company searches
- Sparse indexes for optional unique fields

### Data Growth

- `usage` sub-document grows with API calls
- `notes` array can grow with admin activity
- Consider archiving old notes if necessary

### Monitoring

Track these metrics:
- Partner registration rate
- Onboarding completion rate
- API usage patterns
- Failed authentication attempts
