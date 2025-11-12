# Trust Verification Feature Documentation

## Overview
The Trust Verification feature enables users to verify their identity and build trust scores through document verification.

## Base Path
`/api/trust-verification`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/verified-users` | Get verified users | page, limit, minTrustScore |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/requests` | Get verification requests | AUTHENTICATED |
| GET | `/requests/:id` | Get verification request | AUTHENTICATED |
| POST | `/requests` | Create verification request | AUTHENTICATED |
| PUT | `/requests/:id` | Update verification request | AUTHENTICATED |
| DELETE | `/requests/:id` | Delete verification request | AUTHENTICATED |
| POST | `/requests/:id/documents` | Upload verification documents | AUTHENTICATED |
| DELETE | `/requests/:id/documents/:documentId` | Delete verification document | AUTHENTICATED |
| GET | `/my-requests` | Get my verification requests | AUTHENTICATED |
| PUT | `/requests/:id/review` | Review verification request | **admin** |
| GET | `/statistics` | Get verification statistics | **admin** |

## Request/Response Examples

### Create Verification Request
```http
POST /api/trust-verification/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "identity",
  "documents": [],
  "additionalInfo": "Additional verification information"
}
```

### Upload Documents
```http
POST /api/trust-verification/requests/:id/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "files": [<file1>, <file2>]
}
```

### Review Request (Admin)
```http
PUT /api/trust-verification/requests/:id/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",
  "adminNotes": "Documents verified",
  "trustScore": 85
}
```

## Verification Types

- `identity` - Identity verification
- `business` - Business verification
- `professional` - Professional license verification

## Request Status

- `pending` - Awaiting review
- `approved` - Approved
- `rejected` - Rejected
- `needs_more_info` - Requires more information

## Related Features
- Providers
- User Management
- Trust Scoring

