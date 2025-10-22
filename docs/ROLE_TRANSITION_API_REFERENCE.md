# 🔧 **LocalPro Super App - Role Transition API Reference**

## **Overview**

This document provides comprehensive API reference for all role transition endpoints in the LocalPro Super App. It includes request/response schemas, validation rules, error codes, and implementation examples.

---

## **Base Configuration**

### **Base URL**
```
https://api.localpro.com/v1
```

### **Authentication**
All endpoints require JWT Bearer token authentication:
```http
Authorization: Bearer <jwt-token>
```

### **Content Types**
- **JSON**: `application/json`
- **Form Data**: `multipart/form-data` (for file uploads)

---

## **Client to Provider Upgrade APIs**

### **1. Create Provider Profile**

**Endpoint:** `POST /api/providers/create-profile`  
**Access:** Private (Client role required)  
**Rate Limit:** 5 requests per hour

#### **Request Schema**
```json
{
  "providerType": "individual|business|agency",
  "businessInfo": {
    "businessName": "string (required, 2-100 chars)",
    "businessType": "individual|small_business|enterprise|franchise",
    "yearsInBusiness": "number (0-50)",
    "serviceAreas": ["string (required, min 1)"],
    "specialties": ["string (required, min 1)"],
    "website": "string (optional, valid URL)",
    "description": "string (optional, max 500 chars)"
  },
  "professionalInfo": {
    "experience": "number (required, 0-50)",
    "skills": ["string (required, min 3)"],
    "certifications": [
      {
        "name": "string (required)",
        "issuer": "string (required)",
        "issueDate": "date (required)",
        "expiryDate": "date (optional)"
      }
    ],
    "references": [
      {
        "name": "string (required)",
        "contact": "string (required)",
        "relationship": "string (required)"
      }
    ]
  },
  "verification": {
    "hasInsurance": "boolean (required)",
    "insuranceProvider": "string (if hasInsurance: true)",
    "insurancePolicyNumber": "string (if hasInsurance: true)",
    "backgroundCheckConsent": "boolean (required)"
  }
}
```

#### **Response Schema**
```json
{
  "success": true,
  "message": "Provider profile created successfully",
  "data": {
    "providerId": "string (ObjectId)",
    "status": "pending|approved|rejected",
    "onboarding": {
      "currentStep": "profile_setup|business_info|professional_info|verification|documents|portfolio|preferences|review",
      "progress": "number (0-100)",
      "completed": "boolean",
      "steps": [
        {
          "step": "string",
          "completed": "boolean",
          "completedAt": "date",
          "data": "object"
        }
      ]
    },
    "requirements": {
      "documents": ["string"],
      "verifications": ["string"],
      "estimatedTime": "string"
    }
  },
  "timestamp": "string (ISO 8601)"
}
```

#### **Validation Rules**
- `providerType` must be one of: individual, business, agency
- `businessName` must be unique across the platform
- `serviceAreas` must include at least one valid city/region
- `specialties` must include at least one valid specialty
- `experience` must be a positive number
- `skills` must include at least 3 relevant skills

#### **Error Responses**

**400 - Validation Error**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "businessInfo.businessName",
      "code": "REQUIRED",
      "message": "Business name is required"
    }
  ]
}
```

**409 - Profile Exists**
```json
{
  "success": false,
  "message": "Provider profile already exists",
  "code": "PROFILE_EXISTS"
}
```

### **2. Update Onboarding Step**

**Endpoint:** `PUT /api/providers/onboarding/step`  
**Access:** Private (Provider role required)  
**Rate Limit:** 10 requests per minute

#### **Request Schema**
```json
{
  "step": "business_info|professional_info|verification|documents|portfolio|preferences|review",
  "data": {
    // Step-specific data object
  }
}
```

#### **Step-Specific Data Schemas**

**business_info**
```json
{
  "businessName": "string",
  "businessType": "string",
  "yearsInBusiness": "number",
  "serviceAreas": ["string"],
  "specialties": ["string"],
  "website": "string",
  "description": "string"
}
```

**professional_info**
```json
{
  "experience": "number",
  "skills": ["string"],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "issueDate": "date",
      "expiryDate": "date"
    }
  ],
  "references": [
    {
      "name": "string",
      "contact": "string",
      "relationship": "string"
    }
  ]
}
```

**verification**
```json
{
  "hasInsurance": "boolean",
  "insuranceProvider": "string",
  "insurancePolicyNumber": "string",
  "backgroundCheckConsent": "boolean"
}
```

**documents**
```json
{
  "documents": [
    {
      "type": "identity|business_registration|insurance|background_check",
      "fileId": "string",
      "description": "string"
    }
  ]
}
```

**portfolio**
```json
{
  "workSamples": [
    {
      "title": "string",
      "description": "string",
      "imageUrl": "string",
      "category": "string"
    }
  ],
  "testimonials": [
    {
      "clientName": "string",
      "rating": "number (1-5)",
      "comment": "string",
      "date": "date"
    }
  ]
}
```

**preferences**
```json
{
  "serviceSettings": {
    "allowDirectBooking": "boolean",
    "requireApproval": "boolean",
    "autoAcceptJobs": "boolean"
  },
  "availability": {
    "schedule": [
      {
        "day": "monday|tuesday|wednesday|thursday|friday|saturday|sunday",
        "startTime": "string (HH:MM)",
        "endTime": "string (HH:MM)",
        "isAvailable": "boolean"
      }
    ]
  },
  "pricing": {
    "baseRate": "number",
    "currency": "string",
    "pricingModel": "hourly|fixed|per_sqft"
  }
}
```

#### **Response Schema**
```json
{
  "success": true,
  "message": "Onboarding step updated successfully",
  "data": {
    "step": "string",
    "progress": "number (0-100)",
    "completed": "boolean",
    "nextStep": "string",
    "validation": {
      "valid": "boolean",
      "errors": ["string"],
      "warnings": ["string"]
    }
  }
}
```

### **3. Upload Documents**

**Endpoint:** `POST /api/providers/documents`  
**Access:** Private (Provider role required)  
**Rate Limit:** 20 requests per hour

#### **Request Schema (multipart/form-data)**
```
documentType: string (required)
file: file (required, max 10MB)
description: string (optional)
```

#### **Supported Document Types**
- `identity` - Government-issued ID
- `business_registration` - Business license/registration
- `insurance` - Insurance certificate
- `background_check` - Background check report
- `licenses` - Professional licenses
- `references` - Reference letters

#### **Supported File Types**
- **Images**: JPG, JPEG, PNG (max 5MB)
- **Documents**: PDF (max 10MB)

#### **Response Schema**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "documentId": "string",
    "type": "string",
    "filename": "string",
    "size": "number (bytes)",
    "url": "string",
    "status": "pending|verified|rejected",
    "uploadedAt": "date"
  }
}
```

### **4. Submit for Review**

**Endpoint:** `POST /api/providers/submit-review`  
**Access:** Private (Provider role required)  
**Rate Limit:** 1 request per hour

#### **Request Schema**
```json
{
  "finalReview": {
    "termsAccepted": "boolean (required)",
    "privacyAccepted": "boolean (required)",
    "marketingConsent": "boolean (optional)",
    "additionalNotes": "string (optional, max 500 chars)"
  }
}
```

#### **Response Schema**
```json
{
  "success": true,
  "message": "Application submitted for review",
  "data": {
    "applicationId": "string",
    "submittedAt": "date",
    "estimatedReviewTime": "string",
    "status": "pending_review",
    "nextSteps": "string"
  }
}
```

### **5. Get Onboarding Progress**

**Endpoint:** `GET /api/providers/onboarding/progress`  
**Access:** Private (Provider role required)  
**Rate Limit:** 60 requests per hour

#### **Response Schema**
```json
{
  "success": true,
  "data": {
    "currentStep": "string",
    "progress": "number (0-100)",
    "completedSteps": ["string"],
    "remainingSteps": ["string"],
    "estimatedTimeRemaining": "string",
    "requirements": {
      "documents": [
        {
          "type": "string",
          "required": "boolean",
          "uploaded": "boolean",
          "status": "string"
        }
      ],
      "verifications": [
        {
          "type": "string",
          "required": "boolean",
          "completed": "boolean",
          "status": "string"
        }
      ]
    }
  }
}
```

---

## **Agency Management APIs**

### **1. Create Agency**

**Endpoint:** `POST /api/agencies`  
**Access:** Private (Provider role required)  
**Rate Limit:** 3 requests per day

#### **Request Schema**
```json
{
  "name": "string (required, 2-100 chars)",
  "description": "string (required, 10-1000 chars)",
  "contact": {
    "email": "string (required, valid email)",
    "phone": "string (required, valid phone)",
    "website": "string (optional, valid URL)",
    "address": {
      "street": "string (required)",
      "city": "string (required)",
      "state": "string (required)",
      "zipCode": "string (required)",
      "country": "string (required)"
    }
  },
  "business": {
    "type": "string (required)",
    "licenseNumber": "string (required)",
    "taxId": "string (required)",
    "foundedYear": "number (required)"
  },
  "serviceAreas": ["string (required, min 1)"],
  "subscription": {
    "plan": "basic|professional|premium|enterprise",
    "billingCycle": "monthly|yearly"
  }
}
```

#### **Response Schema**
```json
{
  "success": true,
  "message": "Agency created successfully",
  "data": {
    "agencyId": "string",
    "name": "string",
    "status": "pending|approved|rejected",
    "owner": {
      "userId": "string",
      "name": "string",
      "email": "string"
    },
    "createdAt": "date",
    "nextSteps": "string"
  }
}
```

### **2. Add Agency Admin**

**Endpoint:** `POST /api/agencies/:id/admins`  
**Access:** Private (Agency Owner role required)  
**Rate Limit:** 10 requests per hour

#### **Request Schema**
```json
{
  "userId": "string (required, valid ObjectId)",
  "role": "admin|manager|supervisor",
  "permissions": [
    "manage_providers",
    "view_analytics",
    "manage_bookings",
    "manage_finances",
    "manage_settings"
  ],
  "notifyUser": "boolean (optional, default: true)"
}
```

#### **Response Schema**
```json
{
  "success": true,
  "message": "Admin added successfully",
  "data": {
    "adminId": "string",
    "userId": "string",
    "role": "string",
    "permissions": ["string"],
    "addedAt": "date",
    "status": "pending|active"
  }
}
```

---

## **Instructor Application APIs**

### **1. Apply as Instructor**

**Endpoint:** `POST /api/instructors/apply`  
**Access:** Private (Provider role required)  
**Rate Limit:** 2 requests per day

#### **Request Schema**
```json
{
  "credentials": {
    "education": "string (required)",
    "certifications": [
      {
        "name": "string (required)",
        "issuer": "string (required)",
        "issueDate": "date (required)",
        "expiryDate": "date (optional)"
      }
    ],
    "experience": "string (required, 5-1000 chars)"
  },
  "teachingExperience": {
    "yearsTeaching": "number (required, 0-50)",
    "subjects": ["string (required, min 1)"],
    "studentCount": "number (optional)",
    "teachingMethods": ["string (optional)"]
  },
  "courseProposal": {
    "title": "string (required, 5-100 chars)",
    "description": "string (required, 50-2000 chars)",
    "targetAudience": "string (required)",
    "duration": "number (required, hours)",
    "learningOutcomes": ["string (required, min 3)"],
    "prerequisites": ["string (optional)"]
  },
  "supportingDocuments": [
    {
      "type": "resume|certificate|portfolio|sample_lesson",
      "fileId": "string (required)"
    }
  ]
}
```

#### **Response Schema**
```json
{
  "success": true,
  "message": "Instructor application submitted",
  "data": {
    "applicationId": "string",
    "status": "pending|under_review|approved|rejected",
    "submittedAt": "date",
    "estimatedReviewTime": "string",
    "requirements": {
      "additionalDocuments": ["string"],
      "interviewRequired": "boolean",
      "demoLessonRequired": "boolean"
    }
  }
}
```

---

## **Supplier Registration APIs**

### **1. Register as Supplier**

**Endpoint:** `POST /api/suppliers/register`  
**Access:** Private (Any role)  
**Rate Limit:** 1 request per day

#### **Request Schema**
```json
{
  "businessInfo": {
    "businessName": "string (required)",
    "businessType": "individual|small_business|enterprise",
    "yearsInBusiness": "number (required)",
    "licenseNumber": "string (required)",
    "taxId": "string (required)"
  },
  "contact": {
    "email": "string (required, valid email)",
    "phone": "string (required)",
    "website": "string (optional)",
    "address": {
      "street": "string (required)",
      "city": "string (required)",
      "state": "string (required)",
      "zipCode": "string (required)",
      "country": "string (required)"
    }
  },
  "productCategories": ["string (required, min 1)"],
  "serviceAreas": ["string (required, min 1)"],
  "supplyCapabilities": {
    "inventoryCapacity": "number (required)",
    "deliveryAreas": ["string (required)"],
    "deliveryTime": "string (required)",
    "minimumOrder": "number (optional)"
  },
  "documents": [
    {
      "type": "business_license|tax_certificate|insurance|quality_certificate",
      "fileId": "string (required)"
    }
  ]
}
```

#### **Response Schema**
```json
{
  "success": true,
  "message": "Supplier registration submitted",
  "data": {
    "supplierId": "string",
    "status": "pending|approved|rejected",
    "submittedAt": "date",
    "estimatedReviewTime": "string",
    "nextSteps": "string"
  }
}
```

---

## **Role Management APIs**

### **1. Get User Roles**

**Endpoint:** `GET /api/users/roles`  
**Access:** Private (Any role)  
**Rate Limit:** 60 requests per hour

#### **Response Schema**
```json
{
  "success": true,
  "data": {
    "currentRole": "string",
    "availableRoles": ["string"],
    "roleHistory": [
      {
        "role": "string",
        "assignedAt": "date",
        "assignedBy": "string",
        "status": "active|inactive"
      }
    ],
    "permissions": ["string"],
    "roleCapabilities": {
      "canCreateServices": "boolean",
      "canManageAgency": "boolean",
      "canCreateCourses": "boolean",
      "canManageInventory": "boolean"
    }
  }
}
```

### **2. Switch Role**

**Endpoint:** `POST /api/users/switch-role`  
**Access:** Private (Multi-role users)  
**Rate Limit:** 10 requests per hour

#### **Request Schema**
```json
{
  "targetRole": "string (required)",
  "reason": "string (optional, max 200 chars)"
}
```

#### **Response Schema**
```json
{
  "success": true,
  "message": "Role switched successfully",
  "data": {
    "previousRole": "string",
    "currentRole": "string",
    "switchedAt": "date",
    "dashboardUrl": "string"
  }
}
```

---

## **Analytics APIs**

### **1. Role Transition Analytics**

**Endpoint:** `GET /api/analytics/role-transitions`  
**Access:** Private (Admin role required)  
**Rate Limit:** 60 requests per hour

#### **Query Parameters**
- `startDate`: string (ISO 8601 date)
- `endDate`: string (ISO 8601 date)
- `role`: string (filter by specific role)
- `status`: string (filter by status)

#### **Response Schema**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTransitions": "number",
      "completionRate": "number",
      "averageTimeToApproval": "string",
      "successRate": "number"
    },
    "byRole": {
      "client_to_provider": {
        "total": "number",
        "completed": "number",
        "pending": "number",
        "rejected": "number",
        "averageTime": "string"
      }
    },
    "trends": {
      "daily": [
        {
          "date": "string",
          "transitions": "number",
          "completions": "number"
        }
      ]
    }
  }
}
```

### **2. Upgrade Funnel Analysis**

**Endpoint:** `GET /api/analytics/upgrade-funnel`  
**Access:** Private (Admin role required)  
**Rate Limit:** 30 requests per hour

#### **Response Schema**
```json
{
  "success": true,
  "data": {
    "funnel": {
      "initiated": "number",
      "profileSetup": "number",
      "businessInfo": "number",
      "verification": "number",
      "documents": "number",
      "submitted": "number",
      "approved": "number"
    },
    "conversionRates": {
      "initiated_to_profileSetup": "number",
      "profileSetup_to_businessInfo": "number",
      "businessInfo_to_verification": "number",
      "verification_to_documents": "number",
      "documents_to_submitted": "number",
      "submitted_to_approved": "number"
    },
    "dropOffPoints": [
      {
        "step": "string",
        "dropOffRate": "number",
        "commonReasons": ["string"],
        "recommendations": ["string"]
      }
    ]
  }
}
```

---

## **Error Codes Reference**

### **HTTP Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

### **Application Error Codes**

| **Code** | **Message** | **Description** |
|----------|-------------|-----------------|
| `ROLE_ALREADY_EXISTS` | User already has this role | User already possesses the target role |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions | User lacks required permissions |
| `PROFILE_INCOMPLETE` | Profile information incomplete | Required profile fields missing |
| `DOCUMENTS_MISSING` | Required documents missing | Essential documents not uploaded |
| `VERIFICATION_PENDING` | Verification still pending | Background checks or verifications incomplete |
| `BUSINESS_NOT_VERIFIED` | Business not verified | Business registration not verified |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded | Too many requests in time window |
| `INVALID_ROLE_TRANSITION` | Invalid role transition | Transition not allowed for current role |
| `AGENCY_NOT_FOUND` | Agency not found | Referenced agency doesn't exist |
| `USER_NOT_ELIGIBLE` | User not eligible | User doesn't meet role requirements |

### **Validation Error Codes**

| **Code** | **Field** | **Message** |
|----------|-----------|-------------|
| `REQUIRED` | Any | Field is required |
| `INVALID_FORMAT` | Email/Phone | Invalid format |
| `TOO_SHORT` | String fields | Value too short |
| `TOO_LONG` | String fields | Value too long |
| `INVALID_CHOICE` | Enum fields | Invalid selection |
| `FILE_TOO_LARGE` | File uploads | File exceeds size limit |
| `INVALID_FILE_TYPE` | File uploads | Unsupported file type |
| `DUPLICATE_VALUE` | Unique fields | Value already exists |

---

## **Rate Limiting**

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

### **Rate Limit Tiers**

| **Endpoint Category** | **Limit** | **Window** |
|----------------------|-----------|------------|
| Profile Creation | 5 requests | 1 hour |
| Document Upload | 20 requests | 1 hour |
| Role Switching | 10 requests | 1 hour |
| Analytics | 60 requests | 1 hour |
| General API | 1000 requests | 1 hour |

---

## **Webhooks**

### **Role Transition Events**

#### **1. Role Transition Initiated**
```json
{
  "event": "role_transition.initiated",
  "data": {
    "userId": "string",
    "fromRole": "string",
    "toRole": "string",
    "initiatedAt": "date"
  }
}
```

#### **2. Role Transition Approved**
```json
{
  "event": "role_transition.approved",
  "data": {
    "userId": "string",
    "fromRole": "string",
    "toRole": "string",
    "approvedAt": "date",
    "approvedBy": "string"
  }
}
```

#### **3. Role Transition Rejected**
```json
{
  "event": "role_transition.rejected",
  "data": {
    "userId": "string",
    "fromRole": "string",
    "toRole": "string",
    "rejectedAt": "date",
    "rejectedBy": "string",
    "reason": "string"
  }
}
```

---

## **SDK Examples**

### **JavaScript/Node.js**
```javascript
const LocalProAPI = require('@localpro/api-client');

const client = new LocalProAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.localpro.com/v1'
});

// Create provider profile
const providerProfile = await client.providers.createProfile({
  providerType: 'individual',
  businessInfo: {
    businessName: 'John\'s Cleaning Service',
    businessType: 'individual',
    yearsInBusiness: 2,
    serviceAreas: ['Manila', 'Quezon City'],
    specialties: ['house_cleaning', 'office_cleaning']
  },
  professionalInfo: {
    experience: 5,
    skills: ['cleaning', 'organization'],
    certifications: []
  }
});
```

### **Python**
```python
import requests

class LocalProAPI:
    def __init__(self, api_key, base_url='https://api.localpro.com/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_provider_profile(self, data):
        response = requests.post(
            f'{self.base_url}/api/providers/create-profile',
            json=data,
            headers=self.headers
        )
        return response.json()

# Usage
api = LocalProAPI('your-api-key')
result = api.create_provider_profile({
    'providerType': 'individual',
    'businessInfo': {
        'businessName': 'John\'s Cleaning Service',
        'businessType': 'individual',
        'yearsInBusiness': 2,
        'serviceAreas': ['Manila', 'Quezon City'],
        'specialties': ['house_cleaning', 'office_cleaning']
    }
})
```

---

## **Testing**

### **Test Environment**
- **Base URL**: `https://api-test.localpro.com/v1`
- **Test API Key**: `test_sk_...`
- **Webhook URL**: `https://webhook.site/your-unique-url`

### **Test Data**
```json
{
  "testUser": {
    "phoneNumber": "+639171234567",
    "email": "test@localpro.com",
    "firstName": "Test",
    "lastName": "User"
  },
  "testAgency": {
    "name": "Test Cleaning Agency",
    "email": "test@agency.com",
    "phone": "+639171234568"
  }
}
```

---

*This API reference is maintained by the LocalPro Super App development team. For technical support, contact api-support@localpro.com.*
