# Provider PATCH Endpoint - Quick Reference Examples

## Table of Contents
- [Basic Updates](#basic-updates)
- [Settings Updates](#settings-updates)
- [Professional Info Updates](#professional-info-updates)
- [Business Info Updates](#business-info-updates)
- [Preferences Updates](#preferences-updates)
- [Financial Info Updates](#financial-info-updates)
- [Combined Updates](#combined-updates)
- [cURL Examples](#curl-examples)
- [JavaScript/TypeScript Examples](#javascripttypescript-examples)

---

## Basic Updates

### Update Status Only

```json
PATCH /api/providers/profile
{
  "status": "active"
}
```

### Update Provider Type

```json
PATCH /api/providers/profile
{
  "providerType": "business"
}
```

### Update Status and Type

```json
PATCH /api/providers/profile
{
  "status": "active",
  "providerType": "business"
}
```

---

## Settings Updates

### Update Profile Visibility

```json
PATCH /api/providers/profile
{
  "settings": {
    "profileVisibility": "private"
  }
}
```

### Update Multiple Settings

```json
PATCH /api/providers/profile
{
  "settings": {
    "profileVisibility": "private",
    "showContactInfo": false,
    "allowDirectBooking": false,
    "requireApproval": true
  }
}
```

### Update Single Setting (Deep Merge)

```json
PATCH /api/providers/profile
{
  "settings": {
    "showPricing": false
  }
}
```

**Note:** Other settings remain unchanged due to deep merging.

---

## Professional Info Updates

### Update Travel Distance

```json
PATCH /api/providers/profile
{
  "professionalInfo": {
    "travelDistance": 50
  }
}
```

### Update Emergency Services

```json
PATCH /api/providers/profile
{
  "professionalInfo": {
    "emergencyServices": true
  }
}
```

### Update Job Value Range

```json
PATCH /api/providers/profile
{
  "professionalInfo": {
    "minimumJobValue": 100,
    "maximumJobValue": 5000
  }
}
```

### Update Languages

```json
PATCH /api/providers/profile
{
  "professionalInfo": {
    "languages": ["English", "Spanish", "French"]
  }
}
```

### Update Specialties

```json
PATCH /api/providers/profile
{
  "professionalInfo": {
    "specialties": [
      {
        "category": "cleaning",
        "skills": ["deep_cleaning", "move_out_cleaning"],
        "serviceAreas": [
          {
            "city": "New York",
            "state": "NY",
            "zipCode": "10001",
            "radius": 25
          }
        ],
        "pricing": {
          "baseRate": 50,
          "currency": "USD"
        }
      }
    ]
  }
}
```

### Update Availability

```json
PATCH /api/providers/profile
{
  "professionalInfo": {
    "availability": {
      "monday": {
        "available": true,
        "startTime": "09:00",
        "endTime": "17:00"
      },
      "tuesday": {
        "available": true,
        "startTime": "09:00",
        "endTime": "17:00"
      },
      "wednesday": {
        "available": false
      }
    }
  }
}
```

---

## Business Info Updates

### Update Business Name

```json
PATCH /api/providers/profile
{
  "businessInfo": {
    "businessName": "ABC Services Inc"
  }
}
```

### Update Contact Information

```json
PATCH /api/providers/profile
{
  "businessInfo": {
    "contact": {
      "email": "contact@abcservices.com",
      "phone": "+1234567890",
      "website": "https://abcservices.com"
    }
  }
}
```

### Update Business Address

```json
PATCH /api/providers/profile
{
  "businessInfo": {
    "contact": {
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
}
```

### Update Insurance Information

```json
PATCH /api/providers/profile
{
  "businessInfo": {
    "insurance": {
      "provider": "ABC Insurance Co",
      "policyNumber": "POL123456",
      "coverageAmount": 1000000,
      "expiryDate": "2025-12-31T00:00:00.000Z"
    }
  }
}
```

---

## Preferences Updates

### Update Notification Settings

```json
PATCH /api/providers/profile
{
  "preferences": {
    "notificationSettings": {
      "email": {
        "newBookings": true,
        "jobUpdates": true,
        "paymentUpdates": true
      },
      "sms": {
        "newBookings": false,
        "urgentUpdates": true
      },
      "push": {
        "enabled": true,
        "newBookings": true
      }
    }
  }
}
```

### Update Communication Preferences

```json
PATCH /api/providers/profile
{
  "preferences": {
    "communicationPreferences": {
      "preferredContactMethod": "email",
      "responseTime": "within_hour"
    }
  }
}
```

### Update Work Preferences

```json
PATCH /api/providers/profile
{
  "preferences": {
    "workPreferences": {
      "preferredJobTypes": ["one_time", "recurring"],
      "preferredJobSizes": ["medium", "large"],
      "preferredPaymentMethods": ["card", "bank_transfer"]
    }
  }
}
```

---

## Financial Info Updates

### Update Bank Account

```json
PATCH /api/providers/profile
{
  "financialInfo": {
    "bankAccount": {
      "accountType": "checking",
      "accountNumber": "123456789",
      "routingNumber": "987654321",
      "bankName": "Bank Name",
      "accountHolderName": "John Doe"
    }
  }
}
```

### Update Payment Methods

```json
PATCH /api/providers/profile
{
  "financialInfo": {
    "paymentMethods": [
      {
        "type": "bank_transfer",
        "isDefault": true
      },
      {
        "type": "paypal",
        "isDefault": false
      }
    ]
  }
}
```

### Update Commission Rate

```json
PATCH /api/providers/profile
{
  "financialInfo": {
    "commissionRate": 15
  }
}
```

---

## Combined Updates

### Update Multiple Sections

```json
PATCH /api/providers/profile
{
  "status": "active",
  "settings": {
    "profileVisibility": "public",
    "showContactInfo": true
  },
  "professionalInfo": {
    "travelDistance": 50,
    "emergencyServices": true
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

---

## cURL Examples

### Basic Update

```bash
curl -X PATCH https://api.example.com/api/providers/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

### Update Settings

```bash
curl -X PATCH https://api.example.com/api/providers/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "profileVisibility": "private",
      "showContactInfo": false
    }
  }'
```

### Update Professional Info

```bash
curl -X PATCH https://api.example.com/api/providers/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "professionalInfo": {
      "travelDistance": 50,
      "emergencyServices": true,
      "minimumJobValue": 100
    }
  }'
```

---

## JavaScript/TypeScript Examples

### Using Fetch API

```javascript
async function updateProviderProfile(updates) {
  const response = await fetch('/api/providers/profile', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('Updated fields:', data.data.updatedFields);
    return data.data.provider;
  } else {
    throw new Error(data.message);
  }
}

// Usage
updateProviderProfile({
  status: 'active',
  settings: {
    profileVisibility: 'public'
  }
});
```

### Using Axios

```javascript
import axios from 'axios';

async function updateProviderProfile(updates) {
  try {
    const response = await axios.patch(
      '/api/providers/profile',
      updates,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return response.data.data.provider;
  } catch (error) {
    if (error.response) {
      console.error('Validation errors:', error.response.data.errors);
    }
    throw error;
  }
}

// Usage
updateProviderProfile({
  professionalInfo: {
    travelDistance: 50
  }
});
```

### TypeScript Example

```typescript
interface ProviderPatchRequest {
  status?: 'pending' | 'active' | 'suspended' | 'inactive' | 'rejected';
  providerType?: 'individual' | 'business' | 'agency';
  settings?: {
    profileVisibility?: 'public' | 'private' | 'verified_only';
    showContactInfo?: boolean;
    showPricing?: boolean;
    showReviews?: boolean;
    allowDirectBooking?: boolean;
    requireApproval?: boolean;
  };
  professionalInfo?: {
    travelDistance?: number;
    emergencyServices?: boolean;
    minimumJobValue?: number;
    maximumJobValue?: number;
    languages?: string[];
  };
  // ... other fields
}

async function patchProviderProfile(
  updates: ProviderPatchRequest
): Promise<Provider> {
  const response = await fetch('/api/providers/profile', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }

  return data.data.provider;
}
```

### React Hook Example

```javascript
import { useState } from 'react';

function useProviderPatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const patchProvider = async (updates) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/providers/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { patchProvider, loading, error };
}

// Usage in component
function ProviderSettings() {
  const { patchProvider, loading, error } = useProviderPatch();

  const handleVisibilityChange = async (visibility) => {
    try {
      await patchProvider({
        settings: { profileVisibility: visibility }
      });
      // Show success message
    } catch (err) {
      // Show error message
    }
  };

  return (
    // Component JSX
  );
}
```

---

## Error Handling Examples

### JavaScript Error Handling

```javascript
async function updateProviderWithErrorHandling(updates) {
  try {
    const response = await fetch('/api/providers/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        // Validation errors
        console.error('Validation errors:', data.errors);
        data.errors.forEach(error => {
          console.error(`${error.param}: ${error.msg}`);
        });
      } else if (response.status === 401) {
        // Unauthorized
        console.error('Invalid or expired token');
      } else if (response.status === 404) {
        // Provider not found
        console.error('Provider profile not found');
      } else {
        // Other errors
        console.error('Error:', data.message);
      }
      throw new Error(data.message);
    }

    return data.data;
  } catch (error) {
    console.error('Failed to update provider:', error);
    throw error;
  }
}
```

---

## Testing Examples

### Jest Test Example

```javascript
describe('PATCH /api/providers/profile', () => {
  it('should update provider status', async () => {
    const response = await request(app)
      .patch('/api/providers/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        status: 'active'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.provider.status).toBe('active');
    expect(response.body.data.updatedFields).toContain('status');
  });

  it('should validate status enum', async () => {
    const response = await request(app)
      .patch('/api/providers/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        status: 'invalid_status'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });
});
```

---

## Notes

- All fields are optional - only send what you want to update
- Nested objects are deep merged - existing values are preserved
- Protected fields (`_id`, `userId`, etc.) are automatically ignored
- The response includes an `updatedFields` array showing what was changed
- All updates are logged for audit purposes
