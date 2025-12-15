# Partner API Endpoints

## Overview

The Partner API provides endpoints for partner onboarding, management, and integration. All endpoints return JSON responses with a consistent structure.

## Authentication

- **Admin Endpoints**: Require Bearer token authentication with admin role
- **Public Endpoints**: No authentication required (for onboarding)
- **Partner Endpoints**: Use API key authentication (for third-party access)

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

## Endpoints

### Public Endpoints

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

#### Get Partner by Slug

**GET** `/api/partners/slug/{slug}`

Retrieves partner information by slug (for third-party login).

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

#### Update Business Information

**PUT** `/api/partners/{id}/business-info`

Updates partner business information during onboarding.

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

#### Complete API Setup

**PUT** `/api/partners/{id}/api-setup`

Configures API settings during onboarding.

**Request Body:**
```json
{
  "webhookUrl": "https://partner.com/webhooks/localpro",
  "callbackUrl": "https://partner.com/callback"
}
```

#### Complete Verification

**PUT** `/api/partners/{id}/verification`

Uploads verification documents.

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

#### Activate Partner

**PUT** `/api/partners/{id}/activate`

Completes onboarding and activates the partner.

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

### Admin Endpoints

#### Create Partner

**POST** `/api/partners`

Creates a new partner (admin only).

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

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

#### Get Partners

**GET** `/api/partners`

Retrieves paginated list of partners.

**Query Parameters:**
- `status`: Filter by status (pending, active, suspended, inactive, rejected)
- `onboardingCompleted`: Filter by onboarding completion (true/false)
- `search`: Search in name, company name, description
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort order (asc/desc, default: desc)

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
        "businessInfo": { ... },
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

#### Get Partner Details

**GET** `/api/partners/{id}`

Retrieves detailed partner information.

#### Update Partner

**PUT** `/api/partners/{id}`

Updates partner information.

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

#### Delete Partner

**DELETE** `/api/partners/{id}`

Soft deletes a partner.

#### Add Partner Note

**POST** `/api/partners/{id}/notes`

Adds an admin note to partner.

**Request Body:**
```json
{
  "content": "Partner requested additional API limits"
}
```

## Error Codes

- `VALIDATION_ERROR`: Invalid request data
- `PARTNER_EXISTS`: Partner with email/slug already exists
- `PARTNER_NOT_FOUND`: Partner not found
- `INCOMPLETE_ONBOARDING`: Onboarding not complete for activation
- `MISSING_NOTE_CONTENT`: Note content is required

## Rate Limiting

- Public endpoints: 100 requests per 15 minutes
- Admin endpoints: 1000 requests per 15 minutes
- Partner API endpoints: Configurable per partner (default: 10,000/month)

## Webhook Events

Partners can receive webhook notifications for:
- Partner status changes
- API usage alerts
- System maintenance notifications
- Security events
