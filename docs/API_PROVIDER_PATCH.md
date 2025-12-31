# Provider Profile PATCH Endpoint Documentation

## Overview

The PATCH endpoint allows partial updates to a provider profile. Unlike PUT which replaces the entire resource, PATCH only updates the fields you specify, making it ideal for incremental updates.

**Endpoint:** `PATCH /api/providers/profile`  
**Authentication:** Required (Bearer Token)  
**Authorization:** User must have a provider profile

---

## Request

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### URL Parameters

None

### Request Body

The request body is a JSON object containing only the fields you want to update. All fields are optional.

#### Top-Level Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `status` | String | Provider status | Enum: `pending`, `active`, `suspended`, `inactive`, `rejected` |
| `providerType` | String | Type of provider | Enum: `individual`, `business`, `agency` |
| `settings` | Object | Provider settings (deep merge) | See Settings Object below |
| `metadata` | Object | Provider metadata (deep merge) | See Metadata Object below |
| `onboarding` | Object | Onboarding progress (deep merge) | See Onboarding Object below |
| `businessInfo` | Object | Business information (for business/agency) | See Business Info Object below |
| `professionalInfo` | Object | Professional information | See Professional Info Object below |
| `preferences` | Object | Provider preferences | See Preferences Object below |
| `financialInfo` | Object | Financial information | See Financial Info Object below |

#### Settings Object

```json
{
  "settings": {
    "profileVisibility": "public" | "private" | "verified_only",
    "showContactInfo": true | false,
    "showPricing": true | false,
    "showReviews": true | false,
    "allowDirectBooking": true | false,
    "requireApproval": true | false
  }
}
```

#### Metadata Object

```json
{
  "metadata": {
    "lastActive": "2025-01-30T00:00:00.000Z",
    "profileViews": 0,
    "searchRanking": 0,
    "featured": true | false,
    "promoted": true | false,
    "tags": ["tag1", "tag2"],
    "notes": "Admin notes"
  }
}
```

#### Onboarding Object

```json
{
  "onboarding": {
    "completed": true | false,
    "currentStep": "profile_setup" | "business_info" | "professional_info" | "verification" | "documents" | "portfolio" | "preferences" | "review",
    "progress": 0-100,
    "steps": [
      {
        "step": "string",
        "completed": true | false,
        "completedAt": "2025-01-30T00:00:00.000Z",
        "data": {}
      }
    ]
  }
}
```

#### Business Info Object

Only applicable for `business` or `agency` provider types.

```json
{
  "businessInfo": {
    "businessName": "Business Name",
    "businessType": "sole_proprietorship" | "partnership" | "corporation" | "llc" | "nonprofit",
    "registrationNumber": "REG123456",
    "taxId": "TAX123456",
    "licenseNumber": "LIC123456",
    "contact": {
      "email": "business@example.com",
      "phone": "+1234567890",
      "website": "https://example.com",
      "address": {
        "street": "123 Main St",
        "city": "City",
        "state": "State",
        "zipCode": "12345",
        "country": "Country",
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      }
    },
    "insurance": {
      "provider": "Insurance Co",
      "policyNumber": "POL123456",
      "coverageAmount": 1000000,
      "expiryDate": "2025-12-31T00:00:00.000Z"
    }
  }
}
```

#### Professional Info Object

```json
{
  "professionalInfo": {
    "specialties": [
      {
        "category": "cleaning" | "plumbing" | "electrical" | "moving" | "landscaping" | "pest_control" | "handyman" | "painting" | "carpentry" | "flooring" | "roofing" | "hvac" | "appliance_repair" | "locksmith" | "home_security" | "pool_maintenance" | "carpet_cleaning" | "window_cleaning" | "gutter_cleaning" | "power_washing" | "snow_removal" | "other",
        "skills": ["skill1", "skill2"],
        "serviceAreas": [
          {
            "city": "City",
            "state": "State",
            "zipCode": "12345",
            "radius": 25
          }
        ],
        "pricing": {
          "baseRate": 50,
          "currency": "USD"
        }
      }
    ],
    "languages": ["English", "Spanish"],
    "availability": {
      "monday": { "available": true, "startTime": "09:00", "endTime": "17:00" },
      "tuesday": { "available": true, "startTime": "09:00", "endTime": "17:00" }
    },
    "emergencyServices": true | false,
    "travelDistance": 50,
    "minimumJobValue": 100,
    "maximumJobValue": 10000
  }
}
```

#### Preferences Object

```json
{
  "preferences": {
    "notificationSettings": {
      "email": {
        "newBookings": true | false,
        "jobUpdates": true | false,
        "paymentUpdates": true | false
      },
      "sms": {
        "newBookings": true | false,
        "urgentUpdates": true | false
      },
      "push": {
        "enabled": true | false,
        "newBookings": true | false,
        "jobUpdates": true | false
      }
    },
    "communicationPreferences": {
      "preferredContactMethod": "phone" | "email" | "sms" | "app",
      "responseTime": "immediate" | "within_hour" | "within_day"
    },
    "workPreferences": {
      "preferredJobTypes": ["one_time", "recurring"],
      "preferredJobSizes": ["small", "medium", "large"],
      "preferredPaymentMethods": ["cash", "card", "bank_transfer"]
    }
  }
}
```

#### Financial Info Object

```json
{
  "financialInfo": {
    "bankAccount": {
      "accountType": "checking" | "savings",
      "accountNumber": "123456789",
      "routingNumber": "987654321",
      "bankName": "Bank Name",
      "accountHolderName": "John Doe"
    },
    "paymentMethods": [
      {
        "type": "bank_transfer" | "paypal" | "paymaya" | "check",
        "details": {},
        "isDefault": true | false
      }
    ],
    "commissionRate": 10,
    "taxInformation": {
      "taxId": "TAX123456",
      "taxStatus": "individual" | "business"
    }
  }
}
```

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Provider profile updated successfully",
  "data": {
    "provider": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "status": "active",
      "providerType": "individual",
      "settings": { /* ... */ },
      "businessInfo": { /* populated if exists */ },
      "professionalInfo": { /* populated if exists */ },
      "verification": { /* populated if exists */ },
      "financialInfo": { /* populated if exists */ },
      "performance": { /* populated if exists */ },
      "preferences": { /* populated if exists */ },
      "createdAt": "2025-01-30T00:00:00.000Z",
      "updatedAt": "2025-01-30T00:00:00.000Z"
    },
    "updatedFields": ["settings", "professionalInfo"]
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Invalid status",
      "param": "status",
      "location": "body"
    }
  ]
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "message": "Provider profile not found"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to update provider profile",
  "error": "Error message (only in development)"
}
```

---

## Examples

### Example 1: Update Only Settings

**Request:**
```http
PATCH /api/providers/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "settings": {
    "profileVisibility": "private",
    "showContactInfo": false,
    "allowDirectBooking": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Provider profile updated successfully",
  "data": {
    "provider": { /* full provider object */ },
    "updatedFields": ["settings"]
  }
}
```

### Example 2: Update Status and Professional Info

**Request:**
```http
PATCH /api/providers/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "active",
  "professionalInfo": {
    "travelDistance": 50,
    "emergencyServices": true,
    "minimumJobValue": 100
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Provider profile updated successfully",
  "data": {
    "provider": { /* full provider object */ },
    "updatedFields": ["status", "professionalInfo"]
  }
}
```

### Example 3: Update Business Information

**Request:**
```http
PATCH /api/providers/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "businessInfo": {
    "businessName": "ABC Services Inc",
    "contact": {
      "email": "contact@abcservices.com",
      "phone": "+1234567890",
      "website": "https://abcservices.com"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Provider profile updated successfully",
  "data": {
    "provider": { /* full provider object */ },
    "updatedFields": ["businessInfo"]
  }
}
```

### Example 4: Update Multiple Nested Fields

**Request:**
```http
PATCH /api/providers/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "settings": {
    "profileVisibility": "public"
  },
  "professionalInfo": {
    "specialties": [
      {
        "category": "cleaning",
        "serviceAreas": [
          {
            "city": "New York",
            "state": "NY",
            "zipCode": "10001",
            "radius": 25
          }
        ]
      }
    ]
  },
  "preferences": {
    "notificationSettings": {
      "email": {
        "newBookings": true
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Provider profile updated successfully",
  "data": {
    "provider": { /* full provider object */ },
    "updatedFields": ["settings", "professionalInfo", "preferences"]
  }
}
```

---

## Deep Merging Behavior

The PATCH endpoint uses **deep merging** for nested objects. This means:

- **Settings, Metadata, Onboarding**: These objects are merged, not replaced. Existing values are preserved unless explicitly overridden.
- **Business Info, Preferences, Financial Info**: These are also deep merged, allowing you to update only specific nested fields.

### Example of Deep Merging

**Before:**
```json
{
  "settings": {
    "profileVisibility": "public",
    "showContactInfo": true,
    "showPricing": true
  }
}
```

**PATCH Request:**
```json
{
  "settings": {
    "showContactInfo": false
  }
}
```

**After:**
```json
{
  "settings": {
    "profileVisibility": "public",  // Preserved
    "showContactInfo": false,        // Updated
    "showPricing": true              // Preserved
  }
}
```

---

## Validation Rules

### Status
- Must be one of: `pending`, `active`, `suspended`, `inactive`, `rejected`

### Provider Type
- Must be one of: `individual`, `business`, `agency`

### Settings
- `profileVisibility`: Must be `public`, `private`, or `verified_only`
- All boolean fields: Must be `true` or `false`

### Professional Info
- `specialties[].category`: Must be a valid service category key
- `travelDistance`: Must be a number
- `minimumJobValue`: Must be a number
- `maximumJobValue`: Must be a number
- `emergencyServices`: Must be a boolean

### Business Info
- Only applicable for `business` or `agency` provider types
- All fields are optional

---

## Protected Fields

The following fields **cannot** be updated via PATCH:

- `_id` - Provider ID
- `userId` - User ID (immutable)
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp (automatically managed)
- `deleted` - Soft delete flag
- `deletedOn` - Deletion timestamp

Attempting to update these fields will result in them being silently ignored.

---

## Related Documents

- Related documents (businessInfo, professionalInfo, verification, financialInfo, performance, preferences) are automatically populated in the response.

---

## Audit Logging

All PATCH operations are logged for audit purposes. The audit log includes:

- User ID
- Provider ID
- Method (PATCH)
- Updated fields
- Before and after values
- Timestamp

---

## Error Handling

### Common Errors

1. **Validation Errors**: Check the `errors` array in the response for specific validation failures
2. **Provider Not Found**: Ensure the user has created a provider profile first
3. **Business Info for Individual**: Business info updates are only allowed for `business` or `agency` provider types
4. **Invalid Field Types**: Ensure all field types match the expected schema

### Troubleshooting

- **400 Bad Request**: Review validation errors in the response
- **401 Unauthorized**: Check that the Authorization header is present and valid
- **404 Not Found**: Create a provider profile first using `POST /api/providers/profile`
- **500 Internal Server Error**: Check server logs for detailed error information (development mode only)

---

## Best Practices

1. **Update Only What You Need**: PATCH is designed for partial updates. Only send the fields you want to change.

2. **Use Deep Merging Wisely**: Remember that nested objects are merged, not replaced. This allows incremental updates.

3. **Validate Before Sending**: Ensure all enum values and types are correct before sending the request.

4. **Handle Errors Gracefully**: Always check the `success` field and handle errors appropriately.

5. **Check Updated Fields**: The response includes an `updatedFields` array showing which fields were actually updated.

---

## Rate Limiting

This endpoint is subject to the standard API rate limiting:
- **Authenticated users**: 100 requests per 15 minutes
- **Rate limit headers**: Check `X-RateLimit-*` headers in responses

---

## Version History

- **v1.0.0** (2025-01-30): Initial implementation
  - Support for partial updates
  - Deep merging for nested objects
  - Support for all provider-related documents
  - Comprehensive validation
  - Audit logging

---

## Support

For issues or questions regarding this endpoint, please contact the API support team or refer to the main API documentation.
