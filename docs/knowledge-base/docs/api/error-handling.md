# Error Handling

## Overview

All API endpoints return standardized error responses for consistent error handling.

## Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details",
  "code": "ERROR_CODE",
  "details": {
    "field": "Field-specific error"
  }
}
```

## HTTP Status Codes

### 400 Bad Request
Invalid request data or validation errors.

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "title": "Title is required",
    "price": "Price must be a number"
  }
}
```

### 401 Unauthorized
Missing or invalid authentication token.

```json
{
  "success": false,
  "message": "No token, authorization denied",
  "code": "UNAUTHORIZED"
}
```

### 403 Forbidden
Insufficient permissions.

```json
{
  "success": false,
  "message": "Access denied. Admin privileges required.",
  "code": "FORBIDDEN"
}
```

### 404 Not Found
Resource not found.

```json
{
  "success": false,
  "message": "Service not found",
  "code": "NOT_FOUND"
}
```

### 409 Conflict
Resource conflict (e.g., duplicate entry).

```json
{
  "success": false,
  "message": "Service already exists",
  "code": "ALREADY_EXISTS"
}
```

### 429 Too Many Requests
Rate limit exceeded.

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

### 500 Internal Server Error
Server error.

```json
{
  "success": false,
  "message": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## Error Codes

See [Error Codes Reference](../reference/error-codes.md) for complete list.

## Common Errors

### Authentication Errors
- `UNAUTHORIZED` - No token or invalid token
- `TOKEN_EXPIRED` - Token has expired
- `INVALID_CODE` - Invalid verification code

### Validation Errors
- `VALIDATION_ERROR` - Request validation failed
- `MISSING_FIELD` - Required field missing
- `INVALID_INPUT` - Invalid input data

### Resource Errors
- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Resource already exists
- `CONFLICT` - Resource conflict

## Error Handling Best Practices

### Client-Side

```typescript
try {
  const response = await apiClient.get('/api/services');
  // Handle success
} catch (error) {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        // Show validation errors
        showErrors(data.details);
        break;
      case 401:
        // Redirect to login
        redirectToLogin();
        break;
      case 403:
        // Show access denied
        showAccessDenied();
        break;
      case 404:
        // Show not found
        showNotFound();
        break;
      case 500:
        // Show server error
        showServerError();
        break;
    }
  }
}
```

### Server-Side

Errors are automatically handled by error middleware and logged.

## Related Documentation

- [Error Codes Reference](../reference/error-codes.md)
- [API Overview](./overview.md)

