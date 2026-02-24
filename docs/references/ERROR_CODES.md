# LocalPro Super App - Error Codes Reference

## Overview

This document provides a comprehensive reference for all error codes returned by the LocalPro API. Understanding these codes will help developers handle errors appropriately in client applications.

---

## Table of Contents

1. [Error Response Format](#error-response-format)
2. [HTTP Status Codes](#http-status-codes)
3. [Application Error Codes](#application-error-codes)
4. [Authentication Errors](#authentication-errors)
5. [Validation Errors](#validation-errors)
6. [Resource Errors](#resource-errors)
7. [Payment Errors](#payment-errors)
8. [Rate Limiting Errors](#rate-limiting-errors)
9. [File Upload Errors](#file-upload-errors)
10. [Database Errors](#database-errors)
11. [Third-Party Service Errors](#third-party-service-errors)
12. [WebSocket Errors](#websocket-errors)
13. [Error Handling Best Practices](#error-handling-best-practices)

---

## Error Response Format

All API errors follow a consistent JSON structure:

### Standard Error Response

```json
{
  "success": false,
  "message": "Human-readable error description",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "errors": [],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "statusCode": 400,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "value": null
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Always `false` for errors |
| `message` | String | Human-readable error message |
| `code` | String | Machine-readable error code |
| `statusCode` | Number | HTTP status code |
| `errors` | Array | Detailed validation errors (if applicable) |
| `timestamp` | String | ISO 8601 timestamp |

---

## HTTP Status Codes

| Status | Meaning | When Used |
|--------|---------|-----------|
| `200` | OK | Successful request |
| `201` | Created | Resource successfully created |
| `204` | No Content | Successful deletion |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Resource already exists |
| `422` | Unprocessable Entity | Validation failed |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side error |
| `502` | Bad Gateway | Third-party service error |
| `503` | Service Unavailable | Service temporarily down |

---

## Application Error Codes

### General Errors

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `SERVER_ERROR` | 500 | Internal server error | Contact support if persistent |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable | Retry with exponential backoff |
| `BAD_REQUEST` | 400 | Malformed request | Check request format |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not supported | Use correct HTTP method |
| `NOT_IMPLEMENTED` | 501 | Feature not implemented | Feature coming soon |

### Example: Server Error

```json
{
  "success": false,
  "message": "An unexpected error occurred. Please try again later.",
  "code": "SERVER_ERROR",
  "statusCode": 500,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Authentication Errors

### Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `UNAUTHORIZED` | 401 | No authentication provided | Include Authorization header |
| `INVALID_TOKEN` | 401 | JWT token is invalid | Re-authenticate |
| `TOKEN_EXPIRED` | 401 | JWT token has expired | Refresh token or re-login |
| `TOKEN_REVOKED` | 401 | Token has been revoked | Re-authenticate |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password | Check credentials |
| `INVALID_MPIN` | 401 | Wrong MPIN | Check MPIN |
| `MPIN_LOCKED` | 423 | MPIN locked after attempts | Wait or contact support |
| `INVALID_OTP` | 401 | Wrong or expired OTP | Request new OTP |
| `OTP_EXPIRED` | 401 | OTP has expired | Request new OTP |
| `OTP_MAX_ATTEMPTS` | 429 | Too many OTP attempts | Wait before retrying |
| `ACCOUNT_DISABLED` | 403 | Account has been disabled | Contact support |
| `ACCOUNT_NOT_VERIFIED` | 403 | Account not verified | Complete verification |
| `INVALID_API_KEY` | 401 | Invalid API key | Check API key |
| `API_KEY_EXPIRED` | 401 | API key has expired | Generate new API key |
| `API_KEY_REVOKED` | 401 | API key has been revoked | Generate new API key |

### Example: Token Expired

```json
{
  "success": false,
  "message": "Your session has expired. Please log in again.",
  "code": "TOKEN_EXPIRED",
  "statusCode": 401,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Example: Invalid Credentials

```json
{
  "success": false,
  "message": "Invalid email or password",
  "code": "INVALID_CREDENTIALS",
  "statusCode": 401,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Validation Errors

### Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `VALIDATION_ERROR` | 400 | Input validation failed | Check `errors` array |
| `INVALID_ID_FORMAT` | 400 | Invalid MongoDB ObjectId | Use valid 24-char hex ID |
| `MISSING_REQUIRED_FIELD` | 400 | Required field missing | Include all required fields |
| `INVALID_FORMAT` | 400 | Field format invalid | Check field requirements |
| `VALUE_OUT_OF_RANGE` | 400 | Value outside allowed range | Use value within range |
| `INVALID_ENUM_VALUE` | 400 | Value not in allowed list | Use allowed value |
| `STRING_TOO_LONG` | 400 | String exceeds max length | Shorten input |
| `STRING_TOO_SHORT` | 400 | String below min length | Lengthen input |
| `INVALID_EMAIL` | 400 | Invalid email format | Use valid email |
| `INVALID_PHONE` | 400 | Invalid phone format | Use E.164 format |
| `INVALID_URL` | 400 | Invalid URL format | Use valid URL |
| `INVALID_DATE` | 400 | Invalid date format | Use ISO 8601 format |

### Example: Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "statusCode": 400,
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "value": null
    },
    {
      "field": "phoneNumber",
      "message": "Phone number must be in E.164 format (e.g., +1234567890)",
      "value": "123-456-7890"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      "value": null
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Example: Invalid ID Format

```json
{
  "success": false,
  "message": "Invalid ID format",
  "code": "INVALID_ID_FORMAT",
  "statusCode": 400,
  "errors": [
    {
      "field": "id",
      "message": "Invalid ObjectId format",
      "value": "invalid-id"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Resource Errors

### Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `NOT_FOUND` | 404 | Resource not found | Verify resource ID |
| `USER_NOT_FOUND` | 404 | User doesn't exist | Check user ID |
| `PROVIDER_NOT_FOUND` | 404 | Provider doesn't exist | Check provider ID |
| `BOOKING_NOT_FOUND` | 404 | Booking doesn't exist | Check booking ID |
| `SERVICE_NOT_FOUND` | 404 | Service doesn't exist | Check service ID |
| `JOB_NOT_FOUND` | 404 | Job doesn't exist | Check job ID |
| `AGENCY_NOT_FOUND` | 404 | Agency doesn't exist | Check agency ID |
| `CONFLICT` | 409 | Resource conflict | Resource already exists |
| `DUPLICATE_ENTRY` | 409 | Duplicate value | Use unique value |
| `ALREADY_EXISTS` | 409 | Resource already exists | Use existing resource |
| `FORBIDDEN` | 403 | Access denied | Check permissions |
| `INSUFFICIENT_PERMISSIONS` | 403 | Missing required role | Request access |
| `RESOURCE_LOCKED` | 423 | Resource is locked | Try again later |
| `RESOURCE_DELETED` | 410 | Resource was deleted | Resource no longer available |

### Example: Not Found

```json
{
  "success": false,
  "message": "Booking not found",
  "code": "BOOKING_NOT_FOUND",
  "statusCode": 404,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Example: Duplicate Entry

```json
{
  "success": false,
  "message": "A user with this email already exists",
  "code": "DUPLICATE_ENTRY",
  "statusCode": 409,
  "errors": [
    {
      "field": "email",
      "message": "Email is already registered",
      "value": "user@example.com"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Payment Errors

### Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `PAYMENT_FAILED` | 402 | Payment processing failed | Try different payment method |
| `PAYMENT_DECLINED` | 402 | Payment was declined | Check card details |
| `INSUFFICIENT_FUNDS` | 402 | Insufficient wallet balance | Add funds to wallet |
| `INVALID_CARD` | 400 | Invalid card details | Check card information |
| `CARD_EXPIRED` | 400 | Card has expired | Use valid card |
| `PAYMENT_METHOD_NOT_FOUND` | 404 | Payment method not found | Add payment method |
| `ESCROW_NOT_FOUND` | 404 | Escrow record not found | Check escrow ID |
| `ESCROW_ALREADY_RELEASED` | 409 | Funds already released | No action needed |
| `ESCROW_ALREADY_REFUNDED` | 409 | Funds already refunded | No action needed |
| `PAYOUT_FAILED` | 500 | Payout processing failed | Contact support |
| `PAYOUT_MINIMUM_NOT_MET` | 400 | Below minimum payout | Earn more before payout |
| `INVALID_AMOUNT` | 400 | Invalid payment amount | Use valid amount |
| `CURRENCY_MISMATCH` | 400 | Currency doesn't match | Use correct currency |
| `PAYMENT_GATEWAY_ERROR` | 502 | Payment gateway issue | Try again later |

### Example: Payment Declined

```json
{
  "success": false,
  "message": "Your payment was declined. Please try a different payment method.",
  "code": "PAYMENT_DECLINED",
  "statusCode": 402,
  "errors": [
    {
      "field": "payment",
      "message": "Card was declined by the issuing bank",
      "value": null
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Example: Insufficient Funds

```json
{
  "success": false,
  "message": "Insufficient wallet balance",
  "code": "INSUFFICIENT_FUNDS",
  "statusCode": 402,
  "errors": [
    {
      "field": "amount",
      "message": "Required: $50.00, Available: $25.00",
      "value": 5000
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Rate Limiting Errors

### Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait and retry |
| `DAILY_LIMIT_EXCEEDED` | 429 | Daily limit reached | Wait until tomorrow |
| `API_QUOTA_EXCEEDED` | 429 | API quota exceeded | Upgrade plan |

### Rate Limit Headers

When rate limited, the response includes helpful headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |
| `Retry-After` | Seconds until retry is allowed |

### Example: Rate Limit Exceeded

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "statusCode": 429,
  "retryAfter": 60,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Response Headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705318260
Retry-After: 60
```

---

## File Upload Errors

### Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `FILE_UPLOAD_ERROR` | 400 | File upload failed | Try again |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit | Use smaller file |
| `INVALID_FILE_TYPE` | 400 | File type not allowed | Use allowed format |
| `NO_FILE_PROVIDED` | 400 | No file in request | Include file |
| `TOO_MANY_FILES` | 400 | Too many files | Reduce file count |
| `FILE_CORRUPTED` | 400 | File is corrupted | Re-upload file |
| `UPLOAD_LIMIT_EXCEEDED` | 429 | Upload limit reached | Wait before uploading |

### File Size Limits

| File Type | Max Size |
|-----------|----------|
| Images | 5 MB |
| Documents | 10 MB |
| Videos | 100 MB |

### Allowed File Types

| Category | Extensions |
|----------|------------|
| Images | jpg, jpeg, png, gif, webp |
| Documents | pdf, doc, docx |
| Videos | mp4, mov, webm |

### Example: File Too Large

```json
{
  "success": false,
  "message": "File size exceeds the maximum allowed limit",
  "code": "FILE_TOO_LARGE",
  "statusCode": 413,
  "errors": [
    {
      "field": "file",
      "message": "Maximum file size is 5MB. Your file is 8.5MB.",
      "value": "8.5MB"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Example: Invalid File Type

```json
{
  "success": false,
  "message": "File type not allowed",
  "code": "INVALID_FILE_TYPE",
  "statusCode": 400,
  "errors": [
    {
      "field": "file",
      "message": "Allowed types: jpg, jpeg, png, gif. Received: exe",
      "value": "document.exe"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Database Errors

### Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `DATABASE_ERROR` | 500 | Database operation failed | Retry or contact support |
| `DUPLICATE_ENTRY` | 409 | Unique constraint violation | Use unique value |
| `REFERENCE_ERROR` | 400 | Invalid reference | Check referenced ID |
| `CONSTRAINT_VIOLATION` | 400 | Constraint check failed | Fix constraint issue |
| `CONNECTION_ERROR` | 503 | Database connection failed | Retry later |
| `TIMEOUT_ERROR` | 504 | Database query timeout | Optimize query |

### Example: Duplicate Entry (MongoDB 11000)

```json
{
  "success": false,
  "message": "Duplicate key error",
  "code": "DUPLICATE_ENTRY",
  "statusCode": 409,
  "errors": [
    {
      "field": "phoneNumber",
      "message": "This phone number is already registered",
      "value": "+1234567890"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Third-Party Service Errors

### Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `EXTERNAL_SERVICE_ERROR` | 502 | Third-party service failed | Retry later |
| `TWILIO_ERROR` | 502 | Twilio SMS/call failed | Check Twilio status |
| `CLOUDINARY_ERROR` | 502 | Cloudinary upload failed | Retry upload |
| `PAYPAL_ERROR` | 502 | PayPal API error | Check PayPal status |
| `PAYMAYA_ERROR` | 502 | PayMaya API error | Check PayMaya status |
| `PAYMONGO_ERROR` | 502 | PayMongo API error | Check PayMongo status |
| `FIREBASE_ERROR` | 502 | Firebase notification failed | Retry notification |
| `EMAIL_SEND_FAILED` | 502 | Email delivery failed | Verify email address |
| `SMS_SEND_FAILED` | 502 | SMS delivery failed | Verify phone number |

### Example: SMS Send Failed

```json
{
  "success": false,
  "message": "Failed to send SMS. Please try again.",
  "code": "SMS_SEND_FAILED",
  "statusCode": 502,
  "errors": [
    {
      "field": "phoneNumber",
      "message": "Unable to deliver SMS to this number",
      "value": "+1234567890"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## WebSocket Errors

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `WS_AUTH_FAILED` | WebSocket authentication failed | Send valid token |
| `WS_CONNECTION_CLOSED` | Connection was closed | Reconnect |
| `WS_INVALID_MESSAGE` | Invalid message format | Check message format |
| `WS_ROOM_NOT_FOUND` | Chat room doesn't exist | Check room ID |
| `WS_NOT_AUTHORIZED` | Not authorized for room | Request access |
| `WS_RATE_LIMITED` | Too many messages | Slow down |

### Example: WebSocket Error

```json
{
  "type": "error",
  "code": "WS_AUTH_FAILED",
  "message": "Authentication required. Please provide a valid token.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Error Handling Best Practices

### Client-Side Handling

```javascript
async function makeApiRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      switch (data.code) {
        case 'TOKEN_EXPIRED':
          // Attempt token refresh
          await refreshToken();
          // Retry original request
          return makeApiRequest(url, options);

        case 'RATE_LIMIT_EXCEEDED':
          // Wait and retry
          const retryAfter = data.retryAfter || 60;
          await delay(retryAfter * 1000);
          return makeApiRequest(url, options);

        case 'VALIDATION_ERROR':
          // Show field-specific errors
          data.errors.forEach(error => {
            showFieldError(error.field, error.message);
          });
          break;

        case 'UNAUTHORIZED':
          // Redirect to login
          redirectToLogin();
          break;

        default:
          // Show generic error
          showError(data.message);
      }

      throw new ApiError(data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other error
    showError('Network error. Please check your connection.');
    throw error;
  }
}
```

### Retry Strategy

For transient errors (5xx, rate limits), implement exponential backoff:

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Only retry on transient errors
      if (!isRetryableError(error)) throw error;

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await sleep(delay);
    }
  }
}

function isRetryableError(error) {
  const retryableCodes = [
    'SERVER_ERROR',
    'SERVICE_UNAVAILABLE',
    'RATE_LIMIT_EXCEEDED',
    'EXTERNAL_SERVICE_ERROR',
    'CONNECTION_ERROR',
    'TIMEOUT_ERROR'
  ];
  return retryableCodes.includes(error.code);
}
```

### User-Friendly Messages

Map technical errors to user-friendly messages:

```javascript
const userMessages = {
  'SERVER_ERROR': 'Something went wrong. Please try again later.',
  'UNAUTHORIZED': 'Please log in to continue.',
  'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
  'NOT_FOUND': 'The requested item was not found.',
  'FORBIDDEN': 'You don\'t have permission to perform this action.',
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment.',
  'PAYMENT_DECLINED': 'Your payment was declined. Please try another method.',
  'FILE_TOO_LARGE': 'The file is too large. Please use a smaller file.'
};

function getUserMessage(errorCode) {
  return userMessages[errorCode] || 'An error occurred. Please try again.';
}
```

### Logging Errors

Log errors appropriately for debugging:

```javascript
function logError(error, context = {}) {
  console.error('API Error:', {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    timestamp: error.timestamp,
    context,
    // Don't log sensitive data
    // stack: error.stack (only in development)
  });

  // Send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    errorTracker.captureException(error, { extra: context });
  }
}
```

---

## Error Code Quick Reference

| Code | HTTP | Category |
|------|------|----------|
| `SERVER_ERROR` | 500 | General |
| `UNAUTHORIZED` | 401 | Auth |
| `INVALID_TOKEN` | 401 | Auth |
| `TOKEN_EXPIRED` | 401 | Auth |
| `INVALID_CREDENTIALS` | 401 | Auth |
| `INVALID_MPIN` | 401 | Auth |
| `INVALID_OTP` | 401 | Auth |
| `FORBIDDEN` | 403 | Access |
| `NOT_FOUND` | 404 | Resource |
| `CONFLICT` | 409 | Resource |
| `DUPLICATE_ENTRY` | 409 | Database |
| `VALIDATION_ERROR` | 400 | Validation |
| `INVALID_ID_FORMAT` | 400 | Validation |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate Limit |
| `FILE_UPLOAD_ERROR` | 400 | Upload |
| `FILE_TOO_LARGE` | 413 | Upload |
| `PAYMENT_FAILED` | 402 | Payment |
| `PAYMENT_DECLINED` | 402 | Payment |
| `INSUFFICIENT_FUNDS` | 402 | Payment |
| `EXTERNAL_SERVICE_ERROR` | 502 | External |

---

*Last Updated: January 2026*
*Document Version: 1.0*
