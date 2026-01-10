# Partner Onboarding API Documentation

> **Version:** 1.0.0  
> **Last Updated:** January 9, 2026  
> **Base URL:** `https://api.yourdomain.com/api` or `http://localhost:4000/api` (development)

## Table of Contents

1. [Overview](#overview)
2. [Onboarding Flow](#onboarding-flow)
3. [Endpoints](#endpoints)
4. [Request/Response Examples](#requestresponse-examples)
5. [Error Handling](#error-handling)
6. [Status Codes](#status-codes)

---

## Overview

The Partner Onboarding API allows new partners to register and complete their onboarding process through a series of steps. All onboarding endpoints are **public** (no authentication required) and use the partner ID returned from the initial registration step.

### Key Features

- ✅ **Public Access** - No authentication required for onboarding
- ✅ **Step-by-Step Process** - Multi-step onboarding workflow
- ✅ **Progress Tracking** - Track completion status and progress
- ✅ **Flexible Updates** - Update information at each step

---

## Onboarding Flow

The partner onboarding process consists of 5 main steps:

```
1. Start Onboarding
   ↓
2. Update Business Information
   ↓
3. Complete Verification
   ↓
4. Complete API Setup
   ↓
5. Activate Partner
```

Each step updates the onboarding progress and moves to the next step automatically.

---

## Endpoints

### 1. Start Partner Onboarding

Create a new partner account and begin the onboarding process.

**Endpoint:** `POST /api/partners/onboarding/start`

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "name": "ABC Corporation",
  "email": "contact@abccorp.com",
  "phoneNumber": "+639171234567"
}
```

**Validation Rules:**
- `name`: Required, 2-100 characters
- `email`: Required, valid email format
- `phoneNumber`: Required, valid phone number format (E.164)

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Partner onboarding started successfully",
  "data": {
    "partner": {
      "id": "507f1f77bcf86cd799439011",
      "name": "ABC Corporation",
      "email": "contact@abccorp.com",
      "slug": "abc-corporation",
      "onboarding": {
        "steps": [
          {
            "step": "basic_info",
            "completed": true,
            "completedAt": "2026-01-09T10:00:00.000Z",
            "data": {
              "name": "ABC Corporation",
              "email": "contact@abccorp.com",
              "phoneNumber": "+639171234567"
            }
          }
        ],
        "currentStep": "business_info",
        "progress": 20
      }
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

- `409 Conflict` - Partner already exists
```json
{
  "success": false,
  "message": "Partner with this email already exists",
  "code": "PARTNER_EXISTS"
}
```

---

### 2. Update Business Information

Update business/organization information during onboarding.

**Endpoint:** `PUT /api/partners/:id/business-info`

**Access:** Public (identified by partner ID)

**Path Parameters:**
- `id` (required): Partner MongoDB ObjectId

**Request Body:**
```json
{
  "businessInfo": {
    "companyName": "ABC Corporation Inc.",
    "website": "https://abccorp.com",
    "industry": "Technology",
    "description": "Leading technology company in Southeast Asia"
  }
}
```

**Validation Rules:**
- `businessInfo.companyName`: Optional, 2-100 characters
- `businessInfo.website`: Optional, valid URL
- `businessInfo.industry`: Optional, 2-50 characters
- `businessInfo.description`: Optional, max 500 characters

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Business information updated successfully",
  "data": {
    "partner": {
      "id": "507f1f77bcf86cd799439011",
      "businessInfo": {
        "companyName": "ABC Corporation Inc.",
        "website": "https://abccorp.com",
        "industry": "Technology",
        "description": "Leading technology company in Southeast Asia"
      },
      "onboarding": {
        "steps": [
          {
            "step": "basic_info",
            "completed": true,
            "completedAt": "2026-01-09T10:00:00.000Z"
          },
          {
            "step": "business_info",
            "completed": true,
            "completedAt": "2026-01-09T10:05:00.000Z",
            "data": {
              "companyName": "ABC Corporation Inc.",
              "website": "https://abccorp.com",
              "industry": "Technology"
            }
          }
        ],
        "currentStep": "verification",
        "progress": 40
      }
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation errors
- `404 Not Found` - Partner not found
```json
{
  "success": false,
  "message": "Partner not found",
  "code": "PARTNER_NOT_FOUND"
}
```

---

### 3. Complete Verification

Complete the verification step (document upload, identity verification, etc.).

**Endpoint:** `PUT /api/partners/:id/verification`

**Access:** Public (identified by partner ID)

**Path Parameters:**
- `id` (required): Partner MongoDB ObjectId

**Request Body:**
```json
{
  "documents": [
    {
      "type": "business_registration",
      "url": "https://cloudinary.com/sec_certificate.pdf"
    },
    {
      "type": "tax_certificate",
      "url": "https://cloudinary.com/bir_certificate.pdf"
    },
    {
      "type": "authorization_letter",
      "url": "https://cloudinary.com/authorization.pdf"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Verification completed successfully",
  "data": {
    "partner": {
      "id": "507f1f77bcf86cd799439011",
      "onboarding": {
        "steps": [
          {
            "step": "basic_info",
            "completed": true
          },
          {
            "step": "business_info",
            "completed": true
          },
          {
            "step": "verification",
            "completed": true,
            "completedAt": "2026-01-09T10:10:00.000Z",
            "data": {
              "documents": [...]
            }
          }
        ],
        "currentStep": "api_setup",
        "progress": 60
      }
    }
  }
}
```

**Error Responses:**

- `404 Not Found` - Partner not found
- `500 Internal Server Error` - Server error during verification

---

### 4. Complete API Setup

Configure API credentials, webhooks, and callback URLs.

**Endpoint:** `PUT /api/partners/:id/api-setup`

**Access:** Public (identified by partner ID)

**Path Parameters:**
- `id` (required): Partner MongoDB ObjectId

**Request Body:**
```json
{
  "webhookUrl": "https://your-system.com/webhooks/localpro",
  "callbackUrl": "https://your-system.com/callbacks/localpro"
}
```

**Validation Rules:**
- `webhookUrl`: Optional, valid URL
- `callbackUrl`: Optional, valid URL

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "API setup completed successfully",
  "data": {
    "partner": {
      "id": "507f1f77bcf86cd799439011",
      "apiCredentials": {
        "clientId": "client_abc123def456",
        "webhookUrl": "https://your-system.com/webhooks/localpro",
        "callbackUrl": "https://your-system.com/callbacks/localpro"
      },
      "onboarding": {
        "steps": [
          {
            "step": "basic_info",
            "completed": true
          },
          {
            "step": "business_info",
            "completed": true
          },
          {
            "step": "verification",
            "completed": true
          },
          {
            "step": "api_setup",
            "completed": true,
            "completedAt": "2026-01-09T10:15:00.000Z",
            "data": {
              "webhookUrl": "https://your-system.com/webhooks/localpro",
              "callbackUrl": "https://your-system.com/callbacks/localpro",
              "clientId": "client_abc123def456"
            }
          }
        ],
        "currentStep": "activation",
        "progress": 80
      }
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid URL format
- `404 Not Found` - Partner not found

---

### 5. Activate Partner

Final step to activate the partner account and complete onboarding.

**Endpoint:** `PUT /api/partners/:id/activate`

**Access:** Public (identified by partner ID)

**Path Parameters:**
- `id` (required): Partner MongoDB ObjectId

**Request Body:** None (empty body)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Partner activated successfully",
  "data": {
    "partner": {
      "id": "507f1f77bcf86cd799439011",
      "status": "active",
      "onboarding": {
        "steps": [
          {
            "step": "basic_info",
            "completed": true
          },
          {
            "step": "business_info",
            "completed": true
          },
          {
            "step": "verification",
            "completed": true
          },
          {
            "step": "api_setup",
            "completed": true
          },
          {
            "step": "activation",
            "completed": true,
            "completedAt": "2026-01-09T10:20:00.000Z"
          }
        ],
        "currentStep": null,
        "progress": 100,
        "completed": true,
        "completedAt": "2026-01-09T10:20:00.000Z"
      }
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Not all required steps completed
```json
{
  "success": false,
  "message": "Cannot activate partner. Please complete all required onboarding steps.",
  "code": "INCOMPLETE_ONBOARDING"
}
```

- `404 Not Found` - Partner not found

---

## Request/Response Examples

### Complete Onboarding Flow Example

#### Step 1: Start Onboarding
```bash
curl -X POST http://localhost:4000/api/partners/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Corporation",
    "email": "contact@abccorp.com",
    "phoneNumber": "+639171234567"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Partner onboarding started successfully",
  "data": {
    "partner": {
      "id": "507f1f77bcf86cd799439011",
      "name": "ABC Corporation",
      "email": "contact@abccorp.com",
      "slug": "abc-corporation",
      "onboarding": {
        "currentStep": "business_info",
        "progress": 20
      }
    }
  }
}
```

#### Step 2: Update Business Info
```bash
curl -X PUT http://localhost:4000/api/partners/507f1f77bcf86cd799439011/business-info \
  -H "Content-Type: application/json" \
  -d '{
    "businessInfo": {
      "companyName": "ABC Corporation Inc.",
      "website": "https://abccorp.com",
      "industry": "Technology"
    }
  }'
```

#### Step 3: Complete Verification
```bash
curl -X PUT http://localhost:4000/api/partners/507f1f77bcf86cd799439011/verification \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "type": "business_registration",
        "url": "https://cloudinary.com/sec_certificate.pdf"
      }
    ]
  }'
```

#### Step 4: Complete API Setup
```bash
curl -X PUT http://localhost:4000/api/partners/507f1f77bcf86cd799439011/api-setup \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://your-system.com/webhooks/localpro",
    "callbackUrl": "https://your-system.com/callbacks/localpro"
  }'
```

#### Step 5: Activate Partner
```bash
curl -X PUT http://localhost:4000/api/partners/507f1f77bcf86cd799439011/activate \
  -H "Content-Type: application/json"
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message description",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `PARTNER_EXISTS` | Partner with email already exists |
| `PARTNER_NOT_FOUND` | Partner ID not found |
| `INCOMPLETE_ONBOARDING` | Cannot activate - missing required steps |
| `ONBOARDING_START_ERROR` | Server error during onboarding start |
| `API_SETUP_ERROR` | Server error during API setup |

---

## Status Codes

| Status Code | Description |
|-------------|-------------|
| `200 OK` | Request successful |
| `201 Created` | Resource created successfully |
| `400 Bad Request` | Invalid request data or validation error |
| `404 Not Found` | Partner not found |
| `409 Conflict` | Partner already exists |
| `500 Internal Server Error` | Server error |

---

## Onboarding Steps Reference

| Step | Endpoint | Progress | Description |
|------|----------|----------|-------------|
| `basic_info` | `POST /onboarding/start` | 20% | Initial registration with name, email, phone |
| `business_info` | `PUT /:id/business-info` | 40% | Company/organization details |
| `verification` | `PUT /:id/verification` | 60% | Document verification |
| `api_setup` | `PUT /:id/api-setup` | 80% | API credentials and webhooks |
| `activation` | `PUT /:id/activate` | 100% | Final activation |

---

## Best Practices

### 1. Error Handling
- Always check the `success` field in responses
- Handle validation errors gracefully
- Display user-friendly error messages

### 2. Progress Tracking
- Store the partner ID from the initial response
- Track progress using the `onboarding.progress` field
- Check `onboarding.currentStep` to determine next action

### 3. Data Validation
- Validate all inputs on the client side before sending
- Handle server-side validation errors
- Provide clear feedback for invalid fields

### 4. Security
- While endpoints are public, use HTTPS in production
- Validate partner IDs before making requests
- Don't expose sensitive information in error messages

### 5. User Experience
- Show progress indicators based on `onboarding.progress`
- Allow users to save progress and continue later
- Provide clear instructions for each step

---

## Integration Notes

### Partner ID Storage
After starting onboarding, store the partner `id` returned in the response. This ID is required for all subsequent onboarding steps.

### Progress Tracking
The `onboarding` object in responses contains:
- `steps`: Array of completed steps with timestamps
- `currentStep`: Next step to complete
- `progress`: Percentage complete (0-100)
- `completed`: Boolean indicating if onboarding is complete

### Step Completion
Each step automatically:
- Marks the current step as completed
- Updates progress percentage
- Sets the next step as `currentStep`
- Stores step-specific data

---

## Troubleshooting

### Common Issues

#### 1. "Failed to start onboarding" Error

**Possible Causes:**
- Database connection issue
- Duplicate email or slug
- Validation error
- Missing required fields

**Solutions:**
- Check database connectivity
- Verify email is unique
- Ensure all required fields are provided
- Check server logs for detailed error messages

**Error Response (Development):**
```json
{
  "success": false,
  "message": "Failed to start onboarding",
  "code": "ONBOARDING_START_ERROR",
  "error": "Detailed error message",
  "details": "Error stack trace"
}
```

#### 2. Duplicate Entry Error

**Error Code:** `DUPLICATE_ENTRY`

**Response:**
```json
{
  "success": false,
  "message": "Partner with this email already exists",
  "code": "DUPLICATE_ENTRY",
  "field": "email"
}
```

**Solution:** Use a different email address or check if partner already exists.

#### 3. Validation Errors

**Error Code:** `VALIDATION_ERROR`

**Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

**Solution:** Review validation rules and ensure all fields meet requirements.

#### 4. Slug Generation Issues

Slugs are automatically generated from the partner name. If a slug conflict occurs, the system will append a number (e.g., `abc-corp-1`, `abc-corp-2`).

---

## Support

For questions or issues with partner onboarding:

- **Email:** partners@localpro.com
- **Documentation:** https://docs.localpro.com/partners/onboarding
- **Support Portal:** https://partners.localpro.com/support

---

**© 2026 LocalPro Super App. All rights reserved.**
