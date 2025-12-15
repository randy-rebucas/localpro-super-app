# Error Codes Reference

## Authentication Errors

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | No token or invalid token |
| `TOKEN_EXPIRED` | 401 | Token has expired |
| `INVALID_CODE` | 400 | Invalid verification code |
| `CODE_EXPIRED` | 400 | Verification code expired |

## Authorization Errors

| Code | Status | Description |
|------|--------|-------------|
| `FORBIDDEN` | 403 | Insufficient permissions |
| `ROLE_REQUIRED` | 403 | Specific role required |

## Validation Errors

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_INPUT` | 400 | Invalid input data |
| `MISSING_FIELD` | 400 | Required field missing |

## Resource Errors

| Code | Status | Description |
|------|--------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Resource already exists |
| `CONFLICT` | 409 | Resource conflict |

## Rate Limiting

| Code | Status | Description |
|------|--------|-------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

## Server Errors

| Code | Status | Description |
|------|--------|-------------|
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service unavailable |

## Example Error Response

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

