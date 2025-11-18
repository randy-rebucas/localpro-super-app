# Provider Update Endpoint - Full Payload Structure

**Endpoint:** `PUT /api/providers/profile`  
**Access:** Authenticated (Provider)

## Complete Payload Structure

The update endpoint accepts a flexible payload. Include only the fields you want to update. Nested objects are merged, not replaced.

```json
{
  // ============================================
  // DIRECT PROVIDER FIELDS (Updateable)
  // ============================================
  "status": "active",
  "providerType": "individual",
  
  "settings": {
    "profileVisibility": "public",
    "showContactInfo": true,
    "showPricing": true,
    "showReviews": true,
    "allowDirectBooking": true,
    "requireApproval": false
  },
  
  "onboarding": {
    "completed": false,
    "currentStep": "profile_setup",
    "progress": 50,
    "steps": [{
      "step": "profile_setup",
      "completed": true,
      "completedAt": "2024-01-01T00:00:00.000Z",
      "data": {}
    }]
  },
  
  "metadata": {
    "lastActive": "2024-01-01T00:00:00.000Z",
    "profileViews": 100,
    "searchRanking": 5,
    "featured": false,
    "promoted": false,
    "tags": ["tag1", "tag2"],
    "notes": "Admin notes"
  },

  // ============================================
  // BUSINESS INFO (Updateable for business/agency)
  // ============================================
  "businessInfo": {
    "businessName": "Updated Business Name",
    "businessType": "small_business",
    "businessRegistration": "REG-12345",
    "taxId": "TAX-12345",
    "businessAddress": {
      "street": "456 Business Avenue",
      "city": "Quezon City",
      "state": "Metro Manila",
      "zipCode": "1100",
      "country": "Philippines",
      "coordinates": {
        "lat": 14.6760,
        "lng": 121.0437
      }
    },
    "businessPhone": "+1234567890",
    "businessEmail": "business@example.com",
    "website": "https://example.com",
    "businessDescription": "Business description",
    "yearEstablished": 2020,
    "numberOfEmployees": 10
  },

  // ============================================
  // PROFESSIONAL INFO (Updateable)
  // ============================================
  "professionalInfo": {
    "specialties": [{
      "experience": 12,
      "hourlyRate": 80,
      "certifications": [{
        "name": "Certification Name",
        "issuer": "Issuing Organization",
        "dateIssued": "2020-01-01",
        "expiryDate": "2025-01-01",
        "certificateNumber": "CERT-12345"
      }],
      "skills": ["skillId1", "skillId2"],
      "serviceAreas": [{
        "city": "New York",
        "state": "NY",
        "radius": 35
      }]
    }],
    "languages": ["English", "Spanish", "French"],
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
      },
      "wednesday": {
        "start": "09:00",
        "end": "17:00",
        "available": true
      },
      "thursday": {
        "start": "09:00",
        "end": "17:00",
        "available": true
      },
      "friday": {
        "start": "09:00",
        "end": "17:00",
        "available": true
      },
      "saturday": {
        "start": "09:00",
        "end": "17:00",
        "available": false
      },
      "sunday": {
        "start": "09:00",
        "end": "17:00",
        "available": false
      }
    },
    "emergencyServices": true,
    "travelDistance": 50,
    "minimumJobValue": 100,
    "maximumJobValue": 10000
  }

  // ============================================
  // NOTE: The following collections are NOT
  // updateable through this endpoint:
  // - verification (managed separately)
  // - financialInfo (managed separately)
  // - preferences (managed separately)
  // - performance (system-calculated)
  // ============================================
}
```

---

## Referenced Collections (Full Structure)

### 1. ProviderBusinessInfo
**Updateable via:** `businessInfo` field in update payload

```json
{
  "businessName": "String",
  "businessType": "String",
  "businessRegistration": "String",
  "taxId": "String",
  "businessAddress": {
    "street": "String",
    "city": "String",
    "state": "String",
    "zipCode": "String",
    "country": "String",
    "coordinates": {
      "lat": "Number",
      "lng": "Number"
    }
  },
  "businessPhone": "String",
  "businessEmail": "String",
  "website": "String",
  "businessDescription": "String",
  "yearEstablished": "Number",
  "numberOfEmployees": "Number"
}
```

**Validation:**
- `businessName`: Required if `providerType` is `'business'` or `'agency'`

---

### 2. ProviderProfessionalInfo
**Updateable via:** `professionalInfo` field in update payload

```json
{
  "specialties": [{
    "experience": "Number (years, min: 0)",
    "hourlyRate": "Number (min: 0)",
    "certifications": [{
      "name": "String",
      "issuer": "String",
      "dateIssued": "Date",
      "expiryDate": "Date",
      "certificateNumber": "String"
    }],
    "skills": ["ObjectId[] (ref: ProviderSkill)"],
    "serviceAreas": [{
      "city": "String",
      "state": "String",
      "radius": "Number (miles/km, min: 0)"
    }]
  }],
  "languages": ["String[]"],
  "availability": {
    "monday": {
      "start": "String (HH:mm format)",
      "end": "String (HH:mm format)",
      "available": "Boolean"
    },
    "tuesday": { /* same structure */ },
    "wednesday": { /* same structure */ },
    "thursday": { /* same structure */ },
    "friday": { /* same structure */ },
    "saturday": { /* same structure */ },
    "sunday": { /* same structure */ }
  },
  "emergencyServices": "Boolean",
  "travelDistance": "Number (min: 0)",
  "minimumJobValue": "Number (min: 0)",
  "maximumJobValue": "Number (min: 0)"
}
```

**Validation:**
- `specialties[].category`: Must be a valid ServiceCategory key (if provided)
- All numeric fields have minimum value constraints (typically 0)

---

### 3. ProviderVerification
**NOT updateable via this endpoint** - Managed through separate verification endpoints

```json
{
  "identityVerified": "Boolean",
  "businessVerified": "Boolean",
  "backgroundCheck": {
    "status": "String (enum: 'pending', 'passed', 'failed', 'not_required')",
    "dateCompleted": "Date",
    "reportId": "String"
  },
  "insurance": {
    "hasInsurance": "Boolean",
    "insuranceProvider": "String",
    "policyNumber": "String",
    "coverageAmount": "Number",
    "expiryDate": "Date",
    "documents": ["String[] (URLs)"]
  },
  "licenses": [{
    "type": "String",
    "number": "String",
    "issuingAuthority": "String",
    "issueDate": "Date",
    "expiryDate": "Date",
    "documents": ["String[] (URLs)"]
  }],
  "references": [{
    "name": "String",
    "relationship": "String",
    "phone": "String",
    "email": "String",
    "company": "String",
    "verified": "Boolean"
  }],
  "portfolio": {
    "images": ["String[] (URLs)"],
    "videos": ["String[] (URLs)"],
    "descriptions": ["String[]"],
    "beforeAfter": [{
      "before": "String (URL)",
      "after": "String (URL)",
      "description": "String"
    }]
  }
}
```

---

### 4. ProviderFinancialInfo
**NOT updateable via this endpoint** - Managed through separate finance endpoints (security-sensitive)

```json
{
  "bankAccount": {
    "accountHolder": "String",
    "accountNumber": "String (encrypted)",
    "routingNumber": "String (encrypted)",
    "bankName": "String",
    "accountType": "String (enum: 'checking', 'savings')"
  },
  "taxInfo": {
    "ssn": "String (encrypted)",
    "ein": "String (encrypted)",
    "taxClassification": "String",
    "w9Submitted": "Boolean"
  },
  "paymentMethods": [{
    "type": "String (enum: 'bank_transfer', 'paypal', 'paymaya', 'check')",
    "details": "Mixed",
    "isDefault": "Boolean"
  }],
  "commissionRate": "Number (0-1, default: 0.1)",
  "minimumPayout": "Number (min: 0, default: 50)"
}
```

**Note:** Financial info is excluded from public/provider profile responses for security reasons.

---

### 5. ProviderPerformance
**NOT updateable via this endpoint** - System-calculated metrics

```json
{
  "rating": "Number (0-5, default: 0)",
  "totalReviews": "Number (min: 0, default: 0)",
  "totalJobs": "Number (min: 0, default: 0)",
  "completedJobs": "Number (min: 0, default: 0)",
  "cancelledJobs": "Number (min: 0, default: 0)",
  "responseTime": "Number (minutes, default: 0)",
  "completionRate": "Number (0-100, default: 0)",
  "repeatCustomerRate": "Number (0-100, default: 0)",
  "earnings": {
    "total": "Number (min: 0, default: 0)",
    "thisMonth": "Number (min: 0, default: 0)",
    "lastMonth": "Number (min: 0, default: 0)",
    "pending": "Number (min: 0, default: 0)"
  },
  "badges": [{
    "name": "String",
    "description": "String",
    "earnedDate": "Date",
    "category": "String"
  }]
}
```

**Note:** Performance metrics are automatically calculated by the system based on job activity, reviews, and earnings.

---

### 6. ProviderPreferences
**NOT updateable via this endpoint** - Managed through separate preferences endpoints

```json
{
  "notificationSettings": {
    "newJobAlerts": "Boolean (default: true)",
    "messageNotifications": "Boolean (default: true)",
    "paymentNotifications": "Boolean (default: true)",
    "reviewNotifications": "Boolean (default: true)",
    "marketingEmails": "Boolean (default: false)"
  },
  "jobPreferences": {
    "preferredJobTypes": ["String[]"],
    "avoidJobTypes": ["String[]"],
    "preferredTimeSlots": ["String[]"],
    "maxJobsPerDay": "Number (default: 5)",
    "advanceBookingDays": "Number (default: 30)"
  },
  "communicationPreferences": {
    "preferredContactMethod": "String (enum: 'phone', 'email', 'sms', 'app', default: 'app')",
    "responseTimeExpectation": "Number (minutes, default: 60)",
    "autoAcceptJobs": "Boolean (default: false)"
  }
}
```

---

## Field Validation Rules

### Provider Direct Fields
- `status`: Must be one of: `'pending'`, `'active'`, `'suspended'`, `'inactive'`, `'rejected'`
- `providerType`: Must be one of: `'individual'`, `'business'`, `'agency'` (if provided)
- `settings.profileVisibility`: Must be one of: `'public'`, `'private'`, `'verified_only'`

### Business Info
- `businessInfo.businessName`: Required if `providerType` is `'business'` or `'agency'`

### Professional Info
- `specialties[].category`: Must be a valid ServiceCategory key (if provided)
- `specialties[].experience`: Number, minimum: 0
- `specialties[].hourlyRate`: Number, minimum: 0
- `specialties[].serviceAreas[].radius`: Number, minimum: 0
- `travelDistance`: Number, minimum: 0
- `minimumJobValue`: Number, minimum: 0
- `maximumJobValue`: Number, minimum: 0

---

## Example Update Payloads

### Example 1: Update Settings Only
```json
{
  "settings": {
    "showPricing": false,
    "requireApproval": true
  }
}
```

### Example 2: Update Professional Info Only
```json
{
  "professionalInfo": {
    "languages": ["English", "Spanish"],
    "emergencyServices": true,
    "travelDistance": 50
  }
}
```

### Example 3: Update Business Info Only
```json
{
  "businessInfo": {
    "businessPhone": "+1234567891",
    "website": "https://newwebsite.com",
    "numberOfEmployees": 15
  }
}
```

### Example 4: Update Multiple Sections
```json
{
  "status": "active",
  "settings": {
    "profileVisibility": "public",
    "showPricing": true
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
  "businessInfo": {
    "businessName": "Updated Business Name",
    "businessPhone": "+1234567890"
  }
}
```

---

## Important Notes

1. **Partial Updates**: Only include fields you want to update. Nested objects are merged, not replaced.

2. **Business Info**: Only applicable for `business` or `agency` provider types.

3. **Professional Info**: When updating `specialties`, the entire array is replaced. To add/update a single specialty, include all specialties in the array.

4. **Read-Only Collections**: The following collections are NOT updateable through this endpoint:
   - `verification` - Use verification-specific endpoints
   - `financialInfo` - Use finance-specific endpoints (security-sensitive)
   - `preferences` - Use preferences-specific endpoints
   - `performance` - System-calculated, not directly updateable

5. **Validation**: All fields are validated according to their schema rules. Invalid data will result in a 400 error with validation details.

6. **Audit Logging**: All updates are logged for audit purposes with before/after data.

