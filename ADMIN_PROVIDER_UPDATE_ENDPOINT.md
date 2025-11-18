# Admin Provider Update Endpoint

## Overview
This endpoint allows administrators to update a provider profile with all data, including all referenced collections (businessInfo, professionalInfo, verification, financialInfo, preferences, and performance).

## Endpoint Details

**Method:** `PUT`  
**Route:** `/api/providers/admin/:id`  
**Access:** Admin only  
**Authentication:** Required (Bearer token)  
**Authorization:** Admin role required

## Request

### Headers
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### URL Parameters
- `id` (required): Provider MongoDB ObjectId

### Request Body
The request body can include any fields from the provider model and all referenced collections. See `PROVIDER_UPDATE_PAYLOAD_FULL.md` for complete payload structure.

**Example:**
```json
{
  "status": "active",
  "providerType": "business",
  "settings": {
    "profileVisibility": "public",
    "showPricing": true
  },
  "businessInfo": {
    "businessName": "Updated Business Name",
    "businessPhone": "+1234567890",
    "website": "https://example.com"
  },
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
    "languages": ["English", "Spanish"]
  },
  "verification": {
    "identityVerified": true,
    "businessVerified": true,
    "backgroundCheck": {
      "status": "passed",
      "dateCompleted": "2024-01-01T00:00:00.000Z"
    }
  },
  "financialInfo": {
    "commissionRate": 0.15,
    "minimumPayout": 100
  },
  "preferences": {
    "notificationSettings": {
      "newJobAlerts": true,
      "marketingEmails": false
    }
  },
  "performance": {
    "rating": 4.5,
    "totalReviews": 50
  }
}
```

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Provider updated successfully",
  "data": {
    "_id": "provider_id",
    "userId": { /* User object */ },
    "status": "active",
    "providerType": "business",
    "businessInfo": { /* BusinessInfo object */ },
    "professionalInfo": { /* ProfessionalInfo object */ },
    "verification": { /* Verification object */ },
    "financialInfo": { /* FinancialInfo object */ },
    "preferences": { /* Preferences object */ },
    "performance": { /* Performance object */ },
    "settings": { /* Settings object */ },
    "onboarding": { /* Onboarding object */ },
    "metadata": { /* Metadata object */ },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
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
  "message": "No token, authorization denied"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "User roles [provider] are not authorized to access this route. Required: [admin]"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Provider not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to update provider",
  "error": "Error message (only in development)"
}
```

## Features

### 1. Partial Updates
- Only include fields you want to update
- Nested objects are merged, not replaced
- Unspecified fields remain unchanged

### 2. All Referenced Collections Supported
- ✅ **Provider** (direct fields)
- ✅ **ProviderBusinessInfo**
- ✅ **ProviderProfessionalInfo**
- ✅ **ProviderVerification**
- ✅ **ProviderFinancialInfo**
- ✅ **ProviderPreferences**
- ✅ **ProviderPerformance**

### 3. Audit Logging
- All updates are logged with before/after data
- Tracks which collections were updated
- Records admin user who made the change

### 4. Validation
- Validates provider ID format
- Validates enum values (status, providerType, etc.)
- Validates nested object structures
- Returns detailed validation errors

## Usage Examples

### Example 1: Update Provider Status Only
```bash
curl -X PUT https://api.example.com/api/providers/admin/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

### Example 2: Update Business Info
```bash
curl -X PUT https://api.example.com/api/providers/admin/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "businessInfo": {
      "businessName": "New Business Name",
      "businessPhone": "+1234567890",
      "website": "https://newwebsite.com"
    }
  }'
```

### Example 3: Update Verification Status
```bash
curl -X PUT https://api.example.com/api/providers/admin/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "verification": {
      "identityVerified": true,
      "businessVerified": true,
      "backgroundCheck": {
        "status": "passed",
        "dateCompleted": "2024-01-01T00:00:00.000Z"
      }
    }
  }'
```

### Example 4: Comprehensive Update
```bash
curl -X PUT https://api.example.com/api/providers/admin/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "settings": {
      "profileVisibility": "public"
    },
    "professionalInfo": {
      "languages": ["English", "Spanish", "French"],
      "emergencyServices": true
    },
    "verification": {
      "identityVerified": true
    },
    "preferences": {
      "notificationSettings": {
        "marketingEmails": false
      }
    }
  }'
```

## Validation Rules

### Provider Fields
- `status`: Must be one of: `'pending'`, `'active'`, `'suspended'`, `'inactive'`, `'rejected'`
- `providerType`: Must be one of: `'individual'`, `'business'`, `'agency'`
- `settings.profileVisibility`: Must be one of: `'public'`, `'private'`, `'verified_only'`

### Professional Info
- `specialties[].category`: Must be a valid ServiceCategory key
- All numeric fields have minimum value constraints (typically 0)

### Verification
- `backgroundCheck.status`: Must be one of: `'pending'`, `'passed'`, `'failed'`, `'not_required'`

### Financial Info
- `bankAccount.accountType`: Must be one of: `'checking'`, `'savings'`
- `paymentMethods[].type`: Must be one of: `'bank_transfer'`, `'paypal'`, `'paymaya'`, `'check'`
- `commissionRate`: Must be between 0 and 1 (0% to 100%)

### Preferences
- `communicationPreferences.preferredContactMethod`: Must be one of: `'phone'`, `'email'`, `'sms'`, `'app'`

## Security Considerations

1. **Admin Only**: This endpoint requires admin role authorization
2. **Audit Trail**: All changes are logged with admin user ID
3. **Financial Data**: Financial info updates are logged but should be handled with extra care
4. **Sensitive Fields**: Some fields (like encrypted financial data) may require additional security measures

## Notes

- The endpoint automatically creates referenced collection documents if they don't exist
- Nested objects are merged, not replaced (e.g., `settings` object is merged, not replaced)
- Arrays are replaced entirely (e.g., `specialties` array is replaced, not merged)
- The response includes the fully populated provider object with all referenced collections
- Performance metrics can be manually adjusted by admins (unlike the regular update endpoint)

## Related Endpoints

- `PUT /api/providers/profile` - Regular provider update (provider can update their own profile)
- `PUT /api/providers/admin/:id/status` - Admin update provider status only
- `GET /api/providers/admin/all` - Get all providers for admin management

