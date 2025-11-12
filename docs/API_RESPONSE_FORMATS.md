# API Response Formats

## Overview
This document describes the standard response formats used across all API endpoints in the LocalPro Super App.

## Standard Response Structure

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

## Paginated Responses

### List Endpoints

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "count": 100
}
```

## Common Response Patterns

### Single Resource

```json
{
  "success": true,
  "data": {
    "_id": "resource_id",
    "field1": "value1",
    "field2": "value2",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Created Resource

```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "_id": "new_resource_id",
    // Resource data
  }
}
```

### Updated Resource

```json
{
  "success": true,
  "message": "Resource updated successfully",
  "data": {
    "_id": "resource_id",
    // Updated resource data
  }
}
```

### Deleted Resource

```json
{
  "success": true,
  "message": "Resource deleted successfully"
}
```

## Error Codes

### Validation Errors (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Authentication Errors (401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": {
      "reason": "Invalid or expired token"
    }
  }
}
```

### Authorization Errors (403)

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions",
    "details": {
      "required": ["admin"],
      "current": ["client"]
    }
  }
}
```

### Not Found Errors (404)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": {
      "resource": "Service",
      "id": "invalid_id"
    }
  }
}
```

### Rate Limit Errors (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "retryAfter": 60
    }
  }
}
```

### Server Errors (500)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "details": {
      "requestId": "req_123456"
    }
  }
}
```

## Feature-Specific Responses

### Authentication Responses

#### Token Response
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "_id": "user_id",
      "phoneNumber": "+639123456789",
      "roles": ["client"],
      "profile": { ... }
    }
  }
}
```

### Marketplace Responses

#### Service List
```json
{
  "success": true,
  "data": [
    {
      "_id": "service_id",
      "title": "Home Cleaning",
      "description": "Professional cleaning service",
      "category": "cleaning",
      "pricing": {
        "type": "fixed",
        "basePrice": 500,
        "currency": "PHP"
      },
      "provider": {
        "_id": "provider_id",
        "name": "John Doe",
        "rating": 4.5
      },
      "rating": {
        "average": 4.5,
        "count": 10
      }
    }
  ],
  "pagination": { ... }
}
```

#### Booking Response
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "service": {
      "_id": "service_id",
      "title": "Home Cleaning"
    },
    "provider": {
      "_id": "provider_id",
      "name": "John Doe"
    },
    "client": {
      "_id": "client_id",
      "name": "Jane Smith"
    },
    "scheduledDate": "2025-01-20T10:00:00.000Z",
    "status": "pending",
    "payment": {
      "method": "paypal",
      "amount": 500,
      "status": "pending"
    }
  }
}
```

### Finance Responses

#### Financial Overview
```json
{
  "success": true,
  "data": {
    "balance": 50000,
    "pendingEarnings": 10000,
    "totalEarnings": 200000,
    "totalExpenses": 50000,
    "recentTransactions": [
      {
        "_id": "transaction_id",
        "type": "earning",
        "amount": 1000,
        "status": "completed",
        "createdAt": "2025-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

### Provider Dashboard Response

```json
{
  "success": true,
  "data": {
    "profile": {
      "status": "active",
      "completion": 85
    },
    "earnings": {
      "total": 200000,
      "pending": 10000,
      "available": 190000
    },
    "recentActivity": [
      // Recent bookings, reviews, etc.
    ],
    "notifications": {
      "unread": 5
    },
    "performance": {
      "totalBookings": 50,
      "averageRating": 4.5,
      "responseRate": 95
    }
  }
}
```

## Response Headers

### Standard Headers
```
Content-Type: application/json
X-Request-ID: req_123456789
X-Response-Time: 150ms
```

### Pagination Headers
```
X-Page: 1
X-Per-Page: 20
X-Total: 100
X-Total-Pages: 5
```

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
Retry-After: 60
```

## File Upload Responses

### Single File Upload
```json
{
  "success": true,
  "data": {
    "url": "https://cloudinary.com/image.jpg",
    "publicId": "public_id",
    "thumbnail": "https://cloudinary.com/thumb.jpg",
    "size": 1024000,
    "format": "jpg"
  }
}
```

### Multiple File Upload
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "url": "https://cloudinary.com/image1.jpg",
        "publicId": "public_id_1"
      },
      {
        "url": "https://cloudinary.com/image2.jpg",
        "publicId": "public_id_2"
      }
    ],
    "count": 2
  }
}
```

## Webhook Responses

### PayPal Webhook
```json
{
  "success": true,
  "data": {
    "eventType": "PAYMENT.SALE.COMPLETED",
    "resourceId": "payment_id",
    "processed": true
  }
}
```

## Related Documentation
- [Best Practices](BEST_PRACTICES.md)
- [Sample Usage](SAMPLE_USAGE.md)
- Feature-specific documentation in `docs/features/`

