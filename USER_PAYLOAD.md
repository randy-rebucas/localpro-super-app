# User Payload Structure

This document describes the complete user payload structure for the LocalPro Super App.

## User Model Schema

### Base User Fields

```javascript
{
  // Required Fields
  phoneNumber: String,        // Required, unique, trimmed
  firstName: String,          // Optional, trimmed
  lastName: String,           // Optional, trimmed
  
  // Optional Fields
  email: String,              // Optional, unique (sparse), lowercase, trimmed
  gender: String,             // Enum: 'male', 'female', 'other', 'prefer_not_to_say'
  birthdate: Date,            // Optional date
  
  // Roles & Status
  roles: [String],            // Array of roles, default: ['client']
                             // Valid roles: 'client', 'provider', 'admin', 'supplier', 
                             //              'instructor', 'agency_owner', 'agency_admin'
  isVerified: Boolean,        // Default: false
  isActive: Boolean,          // Default: true
  
  // Verification
  verificationCode: String,   // Auto-generated, expires in 5 minutes
  lastVerificationSent: Date, // Timestamp of last code sent
  
  // Profile Object
  profile: {
    avatar: {
      url: String,
      publicId: String,
      thumbnail: String
    },
    bio: String,
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
  
  // References (ObjectIds)
  localProPlusSubscription: ObjectId,  // Reference to UserSubscription
  wallet: ObjectId,                    // Reference to UserWallet
  trust: ObjectId,                     // Reference to UserTrust
  referral: ObjectId,                   // Reference to UserReferral
  settings: ObjectId,                   // Reference to UserSettings
  management: ObjectId,                 // Reference to UserManagement
  activity: ObjectId,                   // Reference to UserActivity
  agency: ObjectId,                     // Reference to UserAgency
  
  // Timestamps (auto-generated)
  createdAt: Date,
  updatedAt: Date
}
```

## API Payload Examples

### 1. Create User (POST /api/users)

**Request Payload:**
```json
{
  "phoneNumber": "+1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "gender": "male",
  "birthdate": "1990-01-15",
  "roles": ["client", "provider"],
  "profile": {
    "bio": "Professional service provider",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      }
    }
  }
}
```

**Response Payload:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phoneNumber": "+1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "gender": "male",
    "birthdate": "1990-01-15T00:00:00.000Z",
    "roles": ["client", "provider"],
    "isVerified": false,
    "isActive": true,
    "profile": {
      "bio": "Professional service provider",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      }
    },
    "wallet": "507f1f77bcf86cd799439012",
    "trust": "507f1f77bcf86cd799439013",
    "referral": "507f1f77bcf86cd799439014",
    "activity": "507f1f77bcf86cd799439015",
    "management": "507f1f77bcf86cd799439016",
    "agency": "507f1f77bcf86cd799439017",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "User created successfully"
}
```

### 2. Get User by ID (GET /api/users/:id)

**Response Payload (with populated references):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "phoneNumber": "+1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "gender": "male",
    "birthdate": "1990-01-15T00:00:00.000Z",
    "roles": ["client", "provider"],
    "isVerified": true,
    "isActive": true,
    "profile": {
      "avatar": {
        "url": "https://example.com/avatar.jpg",
        "publicId": "avatar_123",
        "thumbnail": "https://example.com/avatar_thumb.jpg"
      },
      "bio": "Professional service provider",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      }
    },
    "agency": {
      "_id": "507f1f77bcf86cd799439017",
      "agencyId": {
        "_id": "507f1f77bcf86cd799439018",
        "name": "ABC Agency",
        "type": "service_provider"
      }
    },
    "referral": {
      "_id": "507f1f77bcf86cd799439014",
      "referralCode": "JD123456",
      "referredBy": {
        "_id": "507f1f77bcf86cd799439020",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      }
    },
    "settings": {
      "_id": "507f1f77bcf86cd799439021",
      "notifications": {
        "email": true,
        "sms": true,
        "push": false
      }
    },
    "provider": {
      "_id": "507f1f77bcf86cd799439022",
      "professionalInfo": {
        "specialties": [],
        "certifications": []
      },
      "businessInfo": {
        "businessName": "John's Services"
      },
      "verification": {
        "phoneVerified": true,
        "emailVerified": true
      },
      "performance": {
        "rating": 4.5,
        "totalReviews": 25
      }
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Update User (PUT /api/users/:id)

**Request Payload:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "gender": "male",
  "birthdate": "1990-01-15",
  "profile": {
    "bio": "Updated bio information",
    "address": {
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90001",
      "coordinates": {
        "lat": 34.0522,
        "lng": -118.2437
      }
    }
  }
}
```

**Note:** The profile object is deep-merged, so you only need to include fields you want to update.

### 4. User Registration Flow (POST /api/auth/verify-code)

**Initial Registration (Minimal):**
```json
{
  "phoneNumber": "+1234567890",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered and logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "phoneNumber": "+1234567890",
    "firstName": null,
    "lastName": null,
    "email": null,
    "roles": ["client"],
    "isVerified": true,
    "subscription": null,
    "trustScore": 0
  },
  "isNewUser": true
}
```

### 5. Complete Onboarding (POST /api/auth/complete-onboarding)

**Request Payload:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "roles": ["client", "provider"],
  "gender": "male",
  "birthdate": "1990-01-15",
  "profile": {
    "bio": "Professional service provider",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }
}
```

## Field Validation Rules

### Required Fields
- `phoneNumber`: Required for all user creation operations
- `firstName`, `lastName`: Required for admin user creation (POST /api/users)

### Optional Fields
- `email`: Optional, but must be unique if provided
- `gender`: Must be one of: `'male'`, `'female'`, `'other'`, `'prefer_not_to_say'`
- `birthdate`: Must be a valid date, cannot be in the future
- `roles`: Array of strings, defaults to `['client']`. Must include at least 'client' role

### Profile Object
- `profile.bio`: String, optional
- `profile.avatar`: Object with `url`, `publicId`, `thumbnail` (all optional)
- `profile.address`: Object with optional fields:
  - `street`, `city`, `state`, `zipCode`, `country` (all strings)
  - `coordinates`: Object with `lat` (Number) and `lng` (Number)

### Auto-Generated Fields
These fields are automatically created and should not be included in request payloads:
- `_id`: MongoDB ObjectId
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `verificationCode`: Auto-generated for verification
- `lastVerificationSent`: Timestamp
- `wallet`, `trust`, `referral`, `activity`, `management`, `agency`: Auto-created references

## Virtual Fields

The User model includes virtual fields that are computed but not stored:

- `fullName`: Returns `${firstName} ${lastName}`
- `age`: Calculated from `birthdate`

## Related Documents

When fetching a user, related documents can be populated:
- `wallet`: UserWallet document
- `trust`: UserTrust document (contains trust score, badges, verifications)
- `referral`: UserReferral document (contains referral code and stats)
- `activity`: UserActivity document (contains activity tracking)
- `management`: UserManagement document (contains status, tags, notes)
- `agency`: UserAgency document (contains agency relationship)
- `settings`: UserSettings document
- `localProPlusSubscription`: UserSubscription document

## Provider Data

If a user has the `'provider'` role, additional provider data is automatically attached when fetching users:
- `provider`: Provider document with populated:
  - `professionalInfo`: Professional information
  - `businessInfo`: Business information
  - `verification`: Verification status
  - `preferences`: Provider preferences
  - `performance`: Performance metrics

