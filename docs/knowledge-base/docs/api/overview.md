# API Overview

## Base URL

```
Production: https://api.localpro.com/api
Development: http://localhost:5000/api
```

## Authentication

All protected endpoints require JWT authentication:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details",
  "code": "ERROR_CODE"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## Common Endpoints

### Authentication
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify-code` - Verify code and login
- `GET /api/auth/me` - Get current user

### Marketplace
- `GET /api/marketplace/services` - List services
- `POST /api/marketplace/services` - Create service
- `GET /api/marketplace/services/:id` - Get service

### Bookings
- `POST /api/marketplace/bookings` - Create booking
- `GET /api/marketplace/my-bookings` - Get user bookings

## Rate Limiting

- **General**: 100 requests per 15 minutes
- **Auth**: 5 requests per 15 minutes

Rate limit headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Documentation

- [API Endpoints](./endpoints.md) - Complete endpoint reference
- [Authentication](./authentication.md) - Auth details
- [Error Handling](./error-handling.md) - Error codes and handling
- [Webhooks](./webhooks.md) - Webhook integration

## Interactive Documentation

- **Swagger UI**: Available at `/api-docs` when server is running
- **Postman Collection**: See repository root

