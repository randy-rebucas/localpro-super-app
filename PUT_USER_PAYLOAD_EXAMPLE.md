# Complete User Payload for PUT /api/users/:id

## Endpoint
```http
PUT /api/users/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Complete Request Payload

```json
{
  // Basic Information
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+1234567890",
  "gender": "male",
  "birthdate": "1990-01-15T00:00:00.000Z",
  
  // Roles (array of strings)
  "roles": ["provider", "client"],
  
  // Verification Status
  "isVerified": true,
  
  // Profile Information (nested object - supports deep merge)
  "profile": {
    // Avatar
    "avatar": {
      "url": "https://res.cloudinary.com/example/image/upload/v1234567890/avatar.jpg",
      "publicId": "avatar_1234567890",
      "thumbnail": "https://res.cloudinary.com/example/image/upload/w_150,h_150,c_fill/avatar.jpg"
    },
    
    // Bio
    "bio": "Experienced professional with 10+ years in the industry",
    
    // Address
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      // Coordinates can be provided as GeoJSON [lng, lat] or {lat, lng}
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      }
      // OR as GeoJSON array:
      // "coordinates": [-74.0060, 40.7128]
    },
    
    // Skills (array of strings)
    "skills": ["cleaning", "maintenance", "repair", "painting"],
    
    // Experience
    "experience": 10,
    
    // Rating (0-5)
    "rating": 4.8,
    
    // Total Reviews
    "totalReviews": 150,
    
    // Business Information
    "businessName": "John's Professional Services",
    "businessType": "individual",
    "yearsInBusiness": 5,
    "serviceAreas": ["New York", "Brooklyn", "Queens", "Manhattan"],
    "specialties": ["residential", "commercial", "emergency"],
    
    // Certifications (array of objects)
    "certifications": [
      {
        "name": "Certified Professional Cleaner",
        "issuer": "Professional Cleaning Association",
        "issueDate": "2020-01-15T00:00:00.000Z",
        "expiryDate": "2025-01-15T00:00:00.000Z",
        "document": {
          "url": "https://example.com/cert.pdf",
          "publicId": "cert_123",
          "filename": "certification.pdf"
        }
      }
    ],
    
    // Insurance Information
    "insurance": {
      "hasInsurance": true,
      "provider": "ABC Insurance Company",
      "policyNumber": "POL-123456",
      "coverageAmount": 1000000,
      "expiryDate": "2025-12-31T00:00:00.000Z",
      "document": {
        "url": "https://example.com/insurance.pdf",
        "publicId": "insurance_123",
        "filename": "insurance.pdf"
      }
    },
    
    // Background Check
    "backgroundCheck": {
      "status": "approved",
      "completedAt": "2023-06-01T00:00:00.000Z",
      "document": {
        "url": "https://example.com/bgcheck.pdf",
        "publicId": "bgcheck_123",
        "filename": "background_check.pdf"
      }
    },
    
    // Portfolio (array of portfolio items)
    "portfolio": [
      {
        "title": "Office Cleaning Project",
        "description": "Complete office cleaning and maintenance",
        "images": [
          {
            "url": "https://example.com/portfolio1.jpg",
            "publicId": "portfolio_1",
            "thumbnail": "https://example.com/portfolio1_thumb.jpg"
          }
        ],
        "category": "cleaning",
        "completedAt": "2023-08-15T00:00:00.000Z"
      }
    ],
    
    // Availability Schedule
    "availability": {
      "schedule": [
        {
          "day": "monday",
          "startTime": "09:00",
          "endTime": "17:00",
          "isAvailable": true
        },
        {
          "day": "tuesday",
          "startTime": "09:00",
          "endTime": "17:00",
          "isAvailable": true
        },
        {
          "day": "wednesday",
          "startTime": "09:00",
          "endTime": "17:00",
          "isAvailable": true
        },
        {
          "day": "thursday",
          "startTime": "09:00",
          "endTime": "17:00",
          "isAvailable": true
        },
        {
          "day": "friday",
          "startTime": "09:00",
          "endTime": "17:00",
          "isAvailable": true
        },
        {
          "day": "saturday",
          "startTime": "10:00",
          "endTime": "14:00",
          "isAvailable": true
        },
        {
          "day": "sunday",
          "startTime": null,
          "endTime": null,
          "isAvailable": false
        }
      ],
      "timezone": "America/New_York",
      "emergencyService": true
    }
  },
  
  // User Status
  "isActive": true,
  
  // FCM Tokens (array of push notification tokens)
  "fcmTokens": [
    {
      "token": "fcm_token_123456789",
      "deviceId": "device_123",
      "deviceType": "android"
    }
  ],
  
  // LocalPro Plus Subscription (ObjectId reference)
  "localProPlusSubscription": "60f7b3b3b3b3b3b3b3b3b3b3",
  
  // References (these are typically managed by the system, but can be set)
  "wallet": "60f7b3b3b3b3b3b3b3b3b3b4",
  "trust": "60f7b3b3b3b3b3b3b3b3b3b5",
  "referral": "60f7b3b3b3b3b3b3b3b3b3b6",
  "settings": "60f7b3b3b3b3b3b3b3b3b3b7",
  "management": "60f7b3b3b3b3b3b3b3b3b3b8",
  "activity": "60f7b3b3b3b3b3b3b3b3b3b9",
  "agency": "60f7b3b3b3b3b3b3b3b3b3b10"
}
```

## Field Descriptions

### Basic Information
- **firstName** (String): User's first name
- **lastName** (String): User's last name
- **email** (String): User's email address (must be unique, lowercase)
- **phoneNumber** (String): User's phone number in international format (e.g., +1234567890) - must be unique
- **gender** (String, enum): One of: `'male'`, `'female'`, `'other'`, `'prefer_not_to_say'`
- **birthdate** (Date/ISO String): User's date of birth

### Roles
- **roles** (Array of Strings): User roles. Valid values: `'client'`, `'provider'`, `'admin'`, `'supplier'`, `'instructor'`, `'agency_owner'`, `'agency_admin'`, `'partner'`, `'staff'`

### Verification
- **isVerified** (Boolean): Whether the user account is verified

### Profile Object
The `profile` object supports deep merging. You can update any nested field without affecting others.

#### Profile.avatar
- **url** (String): Full URL to avatar image
- **publicId** (String): Cloud storage public ID
- **thumbnail** (String): Thumbnail URL

#### Profile.address
- **street** (String): Street address
- **city** (String): City name
- **state** (String): State/province
- **zipCode** (String): ZIP/postal code
- **country** (String): Country name
- **coordinates** (Object or Array): 
  - Object format: `{ "lat": 40.7128, "lng": -74.0060 }`
  - GeoJSON array format: `[-74.0060, 40.7128]` (will be converted to object)

#### Profile.businessType
- Valid enum values: `'individual'`, `'small_business'`, `'enterprise'`, `'franchise'`

#### Profile.backgroundCheck.status
- Valid enum values: `'pending'`, `'approved'`, `'rejected'`, `'not_required'`

#### Profile.availability.schedule[].day
- Valid enum values: `'monday'`, `'tuesday'`, `'wednesday'`, `'thursday'`, `'friday'`, `'saturday'`, `'sunday'`

### FCM Tokens
- **token** (String, required): Firebase Cloud Messaging token
- **deviceId** (String, required): Unique device identifier
- **deviceType** (String, enum): One of: `'ios'`, `'android'`, `'web'`

### References
These are typically managed by the system, but can be set if needed:
- **localProPlusSubscription**: ObjectId reference to UserSubscription
- **wallet**: ObjectId reference to UserWallet
- **trust**: ObjectId reference to UserTrust
- **referral**: ObjectId reference to UserReferral
- **settings**: ObjectId reference to UserSettings
- **management**: ObjectId reference to UserManagement
- **activity**: ObjectId reference to UserActivity
- **agency**: ObjectId reference to UserAgency

## Important Notes

1. **Partial Updates**: You can send only the fields you want to update. Omitted fields will remain unchanged.

2. **Profile Deep Merge**: The `profile` object is deep-merged, so you can update nested fields without affecting others. For example:
   ```json
   {
     "profile": {
       "bio": "New bio",
       "address": {
         "city": "New City"
       }
     }
   }
   ```
   This will only update `bio` and `address.city`, leaving other profile fields unchanged.

3. **Phone Number Validation**: 
   - Must be in international format: `+[country code][number]`
   - Must be unique across all users
   - Format: `/^\+[1-9]\d{4,14}$/`

4. **Undefined Values**: Undefined values in nested objects are automatically filtered out to prevent Mongoose casting errors.

5. **Coordinates Format**: 
   - Can be provided as `{lat, lng}` object
   - Or as GeoJSON array `[lng, lat]` (will be converted)
   - Invalid formats will be removed

6. **Date Fields**: Can be provided as ISO 8601 strings or Date objects.

## Example: Minimal Update

```json
{
  "firstName": "Jane",
  "profile": {
    "bio": "Updated bio"
  }
}
```

## Example: Update Address Only

```json
{
  "profile": {
    "address": {
      "street": "456 Oak Avenue",
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90001",
      "country": "USA",
      "coordinates": {
        "lat": 34.0522,
        "lng": -118.2437
      }
    }
  }
}
```

## Example: Update Availability

```json
{
  "profile": {
    "availability": {
      "schedule": [
        {
          "day": "monday",
          "startTime": "08:00",
          "endTime": "18:00",
          "isAvailable": true
        }
      ],
      "timezone": "America/Los_Angeles",
      "emergencyService": true
    }
  }
}
```

## Response

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    // Complete updated user object
  }
}
```

## Error Responses

### Phone Number Already Exists
```json
{
  "success": false,
  "message": "This phone number is already registered. Phone numbers must be unique across the system.",
  "code": "PHONE_NUMBER_ALREADY_EXISTS"
}
```

### Invalid Phone Format
```json
{
  "success": false,
  "message": "Invalid phone number format. Please use international format (e.g., +1234567890)",
  "code": "INVALID_PHONE_FORMAT"
}
```

### Invalid Gender
```json
{
  "success": false,
  "message": "Invalid gender value. Must be one of: male, female, other, prefer_not_to_say"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "error": "Detailed error message (in development mode only)"
}
```

