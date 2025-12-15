# API Design

## Overview

LocalPro Super App follows **RESTful API** principles with consistent patterns, clear naming conventions, and standardized responses.

## API Design Principles

1. **RESTful**: Use HTTP methods correctly
2. **Consistent**: Uniform patterns across endpoints
3. **Intuitive**: Clear, predictable URLs
4. **Versioned**: Support API versioning
5. **Documented**: Complete API documentation
6. **Secure**: Authentication and authorization
7. **Performant**: Optimized queries and responses

## Base URL

```
Production: https://api.localpro.com/api
Development: http://localhost:5000/api
```

## URL Structure

### Resource-Based URLs

```
GET    /api/services           # List resources
GET    /api/services/:id       # Get single resource
POST   /api/services           # Create resource
PUT    /api/services/:id       # Update resource (full)
PATCH  /api/services/:id       # Update resource (partial)
DELETE /api/services/:id       # Delete resource
```

### Nested Resources

```
GET    /api/services/:id/bookings      # Nested resource
POST   /api/services/:id/bookings     # Create nested resource
GET    /api/services/:id/reviews      # Related resource
```

### Actions

```
POST   /api/bookings/:id/cancel       # Action on resource
PUT    /api/bookings/:id/status       # Update specific field
POST   /api/services/:id/images       # Upload files
```

## HTTP Methods

| Method | Usage | Idempotent | Safe |
|--------|-------|------------|------|
| **GET** | Retrieve data | Yes | Yes |
| **POST** | Create resource | No | No |
| **PUT** | Replace resource | Yes | No |
| **PATCH** | Partial update | No | No |
| **DELETE** | Remove resource | Yes | No |

## Status Codes

### Success Codes

| Code | Meaning | Usage |
|------|---------|-------|
| **200** | OK | Successful GET, PUT, PATCH |
| **201** | Created | Successful POST |
| **204** | No Content | Successful DELETE |

### Client Error Codes

| Code | Meaning | Usage |
|------|---------|-------|
| **400** | Bad Request | Invalid input |
| **401** | Unauthorized | Missing/invalid token |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource conflict |
| **422** | Unprocessable Entity | Validation errors |
| **429** | Too Many Requests | Rate limit exceeded |

### Server Error Codes

| Code | Meaning | Usage |
|------|---------|-------|
| **500** | Internal Server Error | Server error |
| **503** | Service Unavailable | Maintenance mode |

## Request Format

### Headers

```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
X-Request-ID: <unique-request-id>
```

### Query Parameters

```
GET /api/services?page=1&limit=20&sort=createdAt:desc&search=plumbing
```

**Common Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field and direction (e.g., "createdAt:desc")
- `search`: Search query
- `filter`: Filter criteria

### Request Body

```json
{
  "title": "Plumbing Service",
  "price": 100,
  "category": "plumbing"
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "_id": "...",
    "title": "Plumbing Service",
    "price": 100
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Invalid input data",
  "code": "VALIDATION_ERROR",
  "details": {
    "title": "Title is required",
    "price": "Price must be a number"
  }
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
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Pagination

### Standard Pagination

```
GET /api/services?page=1&limit=20
```

**Response**:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Cursor-Based Pagination (Optional)

```
GET /api/services?cursor=<cursor>&limit=20
```

## Filtering

### Simple Filters

```
GET /api/services?status=active&category=plumbing
```

### Advanced Filters

```
GET /api/services?filter[price][gte]=50&filter[price][lte]=200
GET /api/services?filter[createdAt][gte]=2025-01-01
```

## Sorting

### Single Field

```
GET /api/services?sort=createdAt:desc
GET /api/services?sort=price:asc
```

### Multiple Fields

```
GET /api/services?sort=category:asc,price:desc
```

## Searching

### Text Search

```
GET /api/services?search=plumbing
```

Searches in:
- Title
- Description
- Category name

### Advanced Search

```
GET /api/search/global?q=plumbing&type=services
```

## Error Handling

### Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "error message"
  }
}
```

### Authentication Errors

```json
{
  "success": false,
  "message": "No token, authorization denied",
  "code": "UNAUTHORIZED"
}
```

### Authorization Errors

```json
{
  "success": false,
  "message": "Access denied. Admin privileges required.",
  "code": "FORBIDDEN"
}
```

## API Versioning

### URL Versioning

```
/api/v1/services
/api/v2/services
```

### Header Versioning

```http
Accept: application/vnd.localpro.v1+json
```

### Current Approach

Currently using `/api` (latest version). Versioning can be added when needed.

## Rate Limiting

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

### Rate Limit Response

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

## File Uploads

### Upload Endpoint

```
POST /api/services/:id/images
Content-Type: multipart/form-data
```

### Request

```javascript
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);
```

### Response

```json
{
  "success": true,
  "data": {
    "images": [
      {
        "url": "https://...",
        "publicId": "...",
        "thumbnail": "https://..."
      }
    ]
  }
}
```

## Webhooks

### Webhook Endpoint

```
POST /api/webhooks/paymongo
```

### Webhook Signature Verification

```javascript
// Verify webhook signature
const signature = req.headers['x-paymongo-signature'];
const isValid = verifyWebhookSignature(payload, signature);
```

## API Documentation

### Swagger/OpenAPI

- Interactive API documentation
- Available at `/api-docs`
- Auto-generated from JSDoc comments

### Postman Collection

- Complete API collection
- Available in repository
- Import to Postman for testing

## Best Practices

### 1. Use Appropriate HTTP Methods

```javascript
// Good
GET    /api/services
POST   /api/services
PUT    /api/services/:id
DELETE /api/services/:id

// Bad
GET /api/services/create
GET /api/services/:id/delete
```

### 2. Consistent Naming

```javascript
// Good: Plural nouns
/api/services
/api/bookings
/api/users

// Bad: Mixed
/api/service
/api/bookings
/api/user
```

### 3. Clear Error Messages

```javascript
// Good
{ "message": "Service not found", "code": "NOT_FOUND" }

// Bad
{ "message": "Error", "code": "ERR_001" }
```

### 4. Proper Status Codes

```javascript
// Good
res.status(201).json({ success: true, data: service });
res.status(404).json({ success: false, message: "Not found" });

// Bad
res.status(200).json({ success: false, error: "Not found" });
```

### 5. Include Relevant Data

```javascript
// Good: Include related data when useful
{
  "service": { ... },
  "provider": { name: "...", rating: 4.5 }
}

// Bad: Include everything
{
  "service": { ... },
  "provider": { /* full user object */ }
}
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/send-code`
- `POST /api/auth/verify-code`
- `GET /api/auth/me`

### Marketplace
- `GET /api/marketplace/services`
- `POST /api/marketplace/services`
- `GET /api/marketplace/services/:id`

### Bookings
- `POST /api/marketplace/bookings`
- `GET /api/marketplace/my-bookings`
- `PUT /api/marketplace/bookings/:id/status`

### And 20+ more feature modules...

## Next Steps

- Review [API Reference](../api/endpoints.md)
- Check [Error Handling](../api/error-handling.md)
- Read [Frontend Implementation](../frontend/implementation-guide.md)

