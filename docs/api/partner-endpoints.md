# Partner API Endpoints

## Overview

The Partner API provides endpoints for partner onboarding, management, and integration. All endpoints return JSON responses with a consistent structure.

**Base Path:** `/api/partners`

---

## Authentication

- **Admin Endpoints**: Require Bearer token authentication with admin role
- **Public Endpoints**: No authentication required (for onboarding)
- **Partner Endpoints**: Use API key authentication (for third-party access)

---

## Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "message": "Optional message",
  "data": { ... },
  "code": "ERROR_CODE"
}
```

---

## Endpoints

### Public Endpoints (No Authentication Required)

#### Start Partner Onboarding

**POST** `/api/partners/onboarding/start`

Initiates the partner onboarding process.

**Request Body:**
```json
{
  "name": "Partner Company Name",
  "email": "contact@partner.com",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Partner onboarding started successfully",
  "data": {
    "partner": {
      "id": "partner_id",
      "name": "Partner Company Name",
      "email": "contact@partner.com",
      "slug": "partner-company-name",
      "onboarding": {
        "completed": false,
        "currentStep": "business_info",
        "progress": 20
      }
    }
  }
}
```

---

#### Get Partner by Slug

**GET** `/api/partners/slug/:slug`

Retrieves partner information by slug (for third-party login).

**Parameters:**
- `slug` (path parameter) - Partner slug (lowercase letters, numbers, and hyphens only)

**Response:**
```json
{
  "success": true,
  "data": {
    "partner": {
      "id": "partner_id",
      "name": "Partner Company Name",
      "slug": "partner-company-name",
      "businessInfo": {
        "companyName": "Partner Inc.",
        "website": "https://partner.com",
        "industry": "Technology"
      }
    }
  }
}
```

---

#### Update Business Information

**PUT** `/api/partners/:id/business-info`

Updates partner business information during onboarding.

**Parameters:**
- `id` (path parameter) - Partner ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "businessInfo": {
    "companyName": "Partner Inc.",
    "website": "https://partner.com",
    "industry": "Technology",
    "description": "Leading technology solutions provider"
  }
}
```

**Validation:**
- `businessInfo.companyName`: 2-100 characters (optional)
- `businessInfo.website`: Valid URL (optional)
- `businessInfo.industry`: 2-50 characters (optional)
- `businessInfo.description`: Max 500 characters (optional)

---

#### Complete API Setup

**PUT** `/api/partners/:id/api-setup`

Configures API settings during onboarding.

**Parameters:**
- `id` (path parameter) - Partner ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "webhookUrl": "https://partner.com/webhooks/localpro",
  "callbackUrl": "https://partner.com/callback"
}
```

**Validation:**
- `webhookUrl`: Valid URL (optional)
- `callbackUrl`: Valid URL (optional)

---

#### Complete Verification

**PUT** `/api/partners/:id/verification`

Uploads verification documents.

**Parameters:**
- `id` (path parameter) - Partner ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "documents": [
    {
      "type": "business_registration",
      "name": "Business License",
      "url": "https://storage.example.com/doc1.pdf"
    }
  ]
}
```

---

#### Activate Partner

**PUT** `/api/partners/:id/activate`

Completes onboarding and activates the partner. Generates API credentials.

**Parameters:**
- `id` (path parameter) - Partner ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Partner activated successfully",
  "data": {
    "partner": {
      "id": "partner_id",
      "name": "Partner Company Name",
      "email": "contact@partner.com",
      "slug": "partner-company-name",
      "status": "active",
      "apiCredentials": {
        "clientId": "generated_client_id",
        "apiKey": "generated_api_key",
        "webhookUrl": "https://partner.com/webhooks",
        "callbackUrl": "https://partner.com/callback"
      }
    }
  }
}
```

---

### Admin Endpoints (Require Bearer Token + Admin Role)

#### Create Partner

**POST** `/api/partners`

Creates a new partner (admin only).

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "name": "Partner Company Name",
  "email": "contact@partner.com",
  "phoneNumber": "+1234567890",
  "businessInfo": {
    "companyName": "Partner Inc.",
    "industry": "Technology"
  },
  "slug": "custom-slug"
}
```

**Validation:**
- `name`: Required, 2-100 characters
- `email`: Required, valid email format
- `phoneNumber`: Required, valid phone format (E.164)
- `slug`: Optional, lowercase letters, numbers, and hyphens only

---

#### Get Partners

**GET** `/api/partners`

Retrieves paginated list of partners.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `status` - Filter by status: `pending`, `active`, `suspended`, `inactive`, `rejected`
- `onboardingCompleted` - Filter by onboarding completion: `true`/`false`
- `search` - Search in name, company name, description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (default: `createdAt`)
- `sortOrder` - Sort order: `asc`/`desc` (default: `desc`)

**Example Request:**
```
GET /api/partners?status=active&page=1&limit=20&search=tech
```

**Response:**
```json
{
  "success": true,
  "data": {
    "partners": [
      {
        "id": "partner_id",
        "name": "Partner Company Name",
        "email": "contact@partner.com",
        "slug": "partner-company-name",
        "status": "active",
        "onboarding": {
          "completed": true,
          "progress": 100
        },
        "businessInfo": {
          "companyName": "Partner Inc.",
          "website": "https://partner.com",
          "industry": "Technology"
        },
        "usage": {
          "totalRequests": 1500,
          "monthlyRequests": 450
        },
        "createdAt": "2025-12-14T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

#### Get Partner Details

**GET** `/api/partners/:id`

Retrieves detailed partner information.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Parameters:**
- `id` (path parameter) - Partner ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "data": {
    "partner": {
      "id": "partner_id",
      "name": "Partner Company Name",
      "email": "contact@partner.com",
      "slug": "partner-company-name",
      "status": "active",
      "phoneNumber": "+1234567890",
      "businessInfo": { ... },
      "apiCredentials": { ... },
      "onboarding": { ... },
      "notes": [ ... ],
      "createdAt": "2025-12-14T10:00:00Z",
      "updatedAt": "2025-12-14T10:00:00Z"
    }
  }
}
```

---

#### Update Partner

**PUT** `/api/partners/:id`

Updates partner information.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Parameters:**
- `id` (path parameter) - Partner ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "name": "Updated Partner Name",
  "status": "suspended",
  "businessInfo": {
    "companyName": "Updated Company Name"
  }
}
```

**Validation:**
- `name`: Optional, 2-100 characters
- `email`: Optional, valid email format
- `phoneNumber`: Optional, valid phone format
- `status`: Optional, must be one of: `pending`, `active`, `suspended`, `inactive`, `rejected`

---

#### Delete Partner

**DELETE** `/api/partners/:id`

Soft deletes a partner.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Parameters:**
- `id` (path parameter) - Partner ID (MongoDB ObjectId)

**Response:**
```json
{
  "success": true,
  "message": "Partner deleted successfully"
}
```

---

#### Add Partner Note

**POST** `/api/partners/:id/notes`

Adds an admin note to partner.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Parameters:**
- `id` (path parameter) - Partner ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "content": "Partner requested additional API limits"
}
```

**Validation:**
- `content`: Required, 1-1000 characters

**Response:**
```json
{
  "success": true,
  "message": "Note added successfully",
  "data": {
    "note": {
      "id": "note_id",
      "content": "Partner requested additional API limits",
      "createdBy": "admin_user_id",
      "createdAt": "2025-12-14T10:00:00Z"
    }
  }
}
```

---

## Error Codes

- `VALIDATION_ERROR`: Invalid request data
- `PARTNER_EXISTS`: Partner with email/slug already exists
- `PARTNER_NOT_FOUND`: Partner not found
- `INCOMPLETE_ONBOARDING`: Onboarding not complete for activation
- `MISSING_NOTE_CONTENT`: Note content is required
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions (admin role required)

---

## Rate Limiting

- **Public endpoints**: 100 requests per 15 minutes
- **Admin endpoints**: 1000 requests per 15 minutes
- **Partner API endpoints**: Configurable per partner (default: 10,000/month)

---

## Partner Status Values

- `pending` - Awaiting onboarding completion
- `active` - Partner active and operational
- `suspended` - Temporarily suspended
- `inactive` - Partner deactivated
- `rejected` - Partner application rejected

---

## Onboarding Steps

The partner onboarding process consists of 5 steps:

1. **basic_info** - Name, email, phone (completed on start)
2. **business_info** - Company details, industry
3. **api_setup** - Webhook and callback URLs
4. **verification** - Document uploads
5. **activation** - API credentials generation

Progress is tracked as a percentage (0-100%).

---

## Webhook Events

Partners can receive webhook notifications for:
- Partner status changes
- API usage alerts
- System maintenance notifications
- Security events

---

## Example Usage

### Complete Onboarding Flow

```bash
# 1. Start onboarding
curl -X POST http://localhost:3000/api/partners/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Solutions Inc.",
    "email": "contact@techsolutions.com",
    "phoneNumber": "+1234567890"
  }'

# 2. Update business info (use partner ID from step 1)
curl -X PUT http://localhost:3000/api/partners/{partner_id}/business-info \
  -H "Content-Type: application/json" \
  -d '{
    "businessInfo": {
      "companyName": "Tech Solutions Inc.",
      "website": "https://techsolutions.com",
      "industry": "Technology"
    }
  }'

# 3. Complete API setup
curl -X PUT http://localhost:3000/api/partners/{partner_id}/api-setup \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://techsolutions.com/webhooks",
    "callbackUrl": "https://techsolutions.com/callback"
  }'

# 4. Submit verification
curl -X PUT http://localhost:3000/api/partners/{partner_id}/verification \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "type": "business_registration",
        "name": "Business License",
        "url": "https://storage.example.com/license.pdf"
      }
    ]
  }'

# 5. Activate partner
curl -X PUT http://localhost:3000/api/partners/{partner_id}/activate
```

### Admin Operations

```bash
# Get all active partners
curl -X GET "http://localhost:3000/api/partners?status=active" \
  -H "Authorization: Bearer <admin_token>"

# Add note to partner
curl -X POST http://localhost:3000/api/partners/{partner_id}/notes \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Partner requested API rate limit increase"
  }'
```

---

## Related Documentation

- [Partner Features Documentation](../../features/PARTNERS_FEATURES.md)
- [Partner API Endpoints (Detailed)](../../features/partners/api-endpoints.md)
- [Partner Portal Layout Structure](./partner-portal-layout-structure.md)
- [Partner Portal Modules Recommendation](./partner-portal-modules-recommendation.md)

