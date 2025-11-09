# Error Monitoring Data Entities Documentation

## Overview

This document provides comprehensive documentation for all data entities in the Error Monitoring system. These entities manage error tracking, logging, and monitoring to help identify, analyze, and resolve application issues.

---

## Table of Contents

1. [ErrorTracking](#1-errortracking)
2. [Log](#2-log)
3. [Entity Relationships](#entity-relationships)
4. [Database Indexes](#database-indexes)
5. [Error Types and Severity](#error-types-and-severity)
6. [Alert Thresholds](#alert-thresholds)
7. [Usage Examples](#usage-examples)
8. [Service Methods](#service-methods)

---

## 1. ErrorTracking

The `ErrorTracking` entity tracks and aggregates application errors, providing detailed information about error occurrences, context, and resolution status.

### Schema Definition

```javascript
{
  errorId: String,              // Required, Unique
  errorType: String,           // Required, Enum
  severity: String,            // Required, Enum
  message: String,             // Required
  stack: String,
  request: {
    method: String,
    url: String,
    headers: Object,
    body: Object,
    params: Object,
    query: Object,
    ip: String,
    userAgent: String
  },
  user: {
    userId: ObjectId,
    email: String,
    role: String
  },
  environment: String,         // Default: process.env.NODE_ENV
  metadata: Object,            // Default: {}
  resolved: Boolean,           // Default: false
  resolvedAt: Date,
  resolvedBy: ObjectId,
  resolution: String,
  occurrences: Number,         // Default: 1
  firstOccurred: Date,         // Default: Date.now
  lastOccurred: Date,          // Default: Date.now
  createdAt: Date,
  updatedAt: Date
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `errorId` | String | Yes | - | Unique MD5 hash generated from error signature |
| `errorType` | String | Yes | - | Type of error (see Error Types below) |
| `severity` | String | Yes | - | Error severity level (see Severity Levels below) |
| `message` | String | Yes | - | Error message |
| `stack` | String | No | - | Error stack trace |
| `request.method` | String | No | - | HTTP method (GET, POST, etc.) |
| `request.url` | String | No | - | Request URL |
| `request.headers` | Object | No | - | Request headers (sensitive data redacted) |
| `request.body` | Object | No | - | Request body (sensitive data redacted) |
| `request.params` | Object | No | - | URL parameters |
| `request.query` | Object | No | - | Query parameters |
| `request.ip` | String | No | - | Client IP address |
| `request.userAgent` | String | No | - | User agent string |
| `user.userId` | ObjectId | No | - | User ID if authenticated |
| `user.email` | String | No | - | User email if authenticated |
| `user.role` | String | No | - | User role if authenticated |
| `environment` | String | No | process.env.NODE_ENV | Environment (development, production, etc.) |
| `metadata` | Object | No | {} | Additional error metadata |
| `resolved` | Boolean | No | false | Whether error has been resolved |
| `resolvedAt` | Date | No | - | When error was resolved |
| `resolvedBy` | ObjectId | No | - | User who resolved the error |
| `resolution` | String | No | - | Resolution description |
| `occurrences` | Number | No | 1 | Number of times this error occurred |
| `firstOccurred` | Date | No | Date.now | First occurrence timestamp |
| `lastOccurred` | Date | No | Date.now | Last occurrence timestamp |
| `createdAt` | Date | No | Date.now | Record creation timestamp |
| `updatedAt` | Date | No | Date.now | Record update timestamp |

### Error ID Generation

The `errorId` is generated using an MD5 hash of the error signature, which includes:
- Error message
- First line of stack trace
- Request URL (if available)
- HTTP method (if available)

This ensures that identical errors are grouped together and tracked as occurrences of the same error.

### Example Document

```json
{
  "_id": "507f1f77bcf86cd799439020",
  "errorId": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "errorType": "validation",
  "severity": "high",
  "message": "Validation failed: email is required",
  "stack": "ValidationError: Validation failed: email is required\n    at Model.validate (/app/models/User.js:45:12)\n    ...",
  "request": {
    "method": "POST",
    "url": "/api/users",
    "headers": {
      "content-type": "application/json",
      "authorization": "[REDACTED]"
    },
    "body": {
      "name": "John Doe",
      "password": "[REDACTED]"
    },
    "params": {},
    "query": {},
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  "user": {
    "userId": "507f1f77bcf86cd799439010",
    "email": "user@example.com",
    "role": "client"
  },
  "environment": "production",
  "metadata": {
    "operation": "user_registration",
    "source": "api"
  },
  "resolved": false,
  "occurrences": 15,
  "firstOccurred": "2024-01-15T10:00:00.000Z",
  "lastOccurred": "2024-01-20T14:30:00.000Z",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-20T14:30:00.000Z"
}
```

---

## 2. Log

The `Log` entity stores all application logs including errors, warnings, info messages, HTTP requests, and debug information with automatic retention policies.

### Schema Definition

```javascript
{
  logId: String,                // Required, Unique
  level: String,               // Required, Enum
  message: String,             // Required
  category: String,            // Enum, Default: 'application'
  source: String,             // Enum, Default: 'winston'
  request: {
    method: String,
    url: String,
    headers: Object,
    body: Object,
    params: Object,
    query: Object,
    ip: String,
    userAgent: String,
    userId: ObjectId
  },
  response: {
    statusCode: Number,
    responseTime: Number,
    success: Boolean
  },
  error: {
    name: String,
    message: String,
    stack: String,
    code: String,
    statusCode: Number
  },
  metadata: Object,           // Default: {}
  environment: String,        // Default: process.env.NODE_ENV
  timestamp: Date,            // Default: Date.now
  retentionDate: Date,        // Auto-calculated based on level
  createdAt: Date,
  updatedAt: Date
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `logId` | String | Yes | - | Unique log identifier |
| `level` | String | Yes | - | Log level (error, warn, info, http, debug) |
| `message` | String | Yes | - | Log message |
| `category` | String | No | 'application' | Log category (see Categories below) |
| `source` | String | No | 'winston' | Log source (see Sources below) |
| `request.method` | String | No | - | HTTP method |
| `request.url` | String | No | - | Request URL |
| `request.headers` | Object | No | - | Request headers |
| `request.body` | Object | No | - | Request body |
| `request.params` | Object | No | - | URL parameters |
| `request.query` | Object | No | - | Query parameters |
| `request.ip` | String | No | - | Client IP address |
| `request.userAgent` | String | No | - | User agent string |
| `request.userId` | ObjectId | No | - | User ID if authenticated |
| `response.statusCode` | Number | No | - | HTTP response status code |
| `response.responseTime` | Number | No | - | Response time in milliseconds |
| `response.success` | Boolean | No | - | Whether request was successful |
| `error.name` | String | No | - | Error name/type |
| `error.message` | String | No | - | Error message |
| `error.stack` | String | No | - | Error stack trace |
| `error.code` | String | No | - | Error code |
| `error.statusCode` | Number | No | - | HTTP status code for error |
| `metadata` | Object | No | {} | Additional log metadata |
| `environment` | String | No | process.env.NODE_ENV | Environment name |
| `timestamp` | Date | No | Date.now | Log timestamp |
| `retentionDate` | Date | No | Auto-calculated | Date when log should be deleted |

### Log Levels

- `error`: Error logs (retention: 90 days)
- `warn`: Warning logs (retention: 30 days)
- `info`: Information logs (retention: 14 days)
- `http`: HTTP request logs (retention: 7 days)
- `debug`: Debug logs (retention: 3 days)

### Categories

- `application`: General application logs
- `http`: HTTP request/response logs
- `error`: Error-specific logs
- `performance`: Performance-related logs
- `business`: Business logic logs
- `security`: Security-related logs
- `audit`: Audit trail logs
- `system`: System-level logs

### Sources

- `winston`: Winston logger
- `audit`: Audit logger
- `error_monitoring`: Error monitoring service
- `request_logger`: Request logger middleware
- `manual`: Manually created logs

### Retention Policy

Logs are automatically deleted based on their level:

| Level | Retention Period |
|-------|-----------------|
| `error` | 90 days |
| `warn` | 30 days |
| `info` | 14 days |
| `http` | 7 days |
| `debug` | 3 days |

The `retentionDate` is automatically calculated when a log is created, and MongoDB TTL index automatically deletes expired logs.

### Virtual Properties

#### `formattedTimestamp`
Returns the timestamp as an ISO string.

```javascript
const log = await Log.findById(id);
console.log(log.formattedTimestamp); // "2024-01-15T10:00:00.000Z"
```

### Static Methods

#### `getLogStats(timeframe)`
Get log statistics grouped by level and category.

```javascript
const stats = await Log.getLogStats('24h');
// Returns: [
//   {
//     _id: 'error',
//     categories: [
//       { category: 'application', count: 10 },
//       { category: 'database', count: 5 }
//     ],
//     totalCount: 15
//   },
//   ...
// ]
```

#### `getErrorStats(timeframe)`
Get error statistics grouped by error name.

```javascript
const errorStats = await Log.getErrorStats('7d');
// Returns: [
//   {
//     _id: 'ValidationError',
//     count: 25,
//     messages: ['Validation failed: email required', ...]
//   },
//   ...
// ]
```

#### `getPerformanceStats(timeframe)`
Get performance statistics grouped by URL.

```javascript
const perfStats = await Log.getPerformanceStats('24h');
// Returns: [
//   {
//     _id: '/api/users',
//     avgResponseTime: 150.5,
//     maxResponseTime: 500,
//     minResponseTime: 50,
//     count: 1000
//   },
//   ...
// ]
```

#### `cleanupExpiredLogs()`
Manually cleanup expired logs (usually handled by TTL index).

```javascript
const result = await Log.cleanupExpiredLogs();
console.log(`Deleted ${result.deletedCount} expired logs`);
```

### Example Document

```json
{
  "_id": "507f1f77bcf86cd799439021",
  "logId": "log-2024-01-15-10-00-00-abc123",
  "level": "error",
  "message": "Database connection failed",
  "category": "database",
  "source": "winston",
  "request": {
    "method": "GET",
    "url": "/api/users",
    "headers": {
      "content-type": "application/json"
    },
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "userId": "507f1f77bcf86cd799439010"
  },
  "response": {
    "statusCode": 500,
    "responseTime": 2500,
    "success": false
  },
  "error": {
    "name": "MongoError",
    "message": "Connection timeout",
    "stack": "MongoError: Connection timeout\n    at ...",
    "code": "ETIMEDOUT",
    "statusCode": 500
  },
  "metadata": {
    "operation": "fetch_users",
    "retryAttempt": 3
  },
  "environment": "production",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "retentionDate": "2024-04-15T10:00:00.000Z",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

## Entity Relationships

```
User
  ├── ErrorTracking (many:1 via user.userId)
  └── Log (many:1 via request.userId)

ErrorTracking
  └── (standalone, aggregated by errorId)

Log
  └── (standalone, individual log entries)
```

### Relationship Details

1. **User → ErrorTracking**: Many errors can be associated with one user (via `user.userId`)
2. **User → Log**: Many logs can be associated with one user (via `request.userId`)
3. **ErrorTracking**: Standalone entity that aggregates errors by unique `errorId`
4. **Log**: Standalone entity for individual log entries

---

## Database Indexes

### ErrorTracking Indexes

```javascript
// Unique index
{ errorId: 1 }  // Unique constraint

// Compound indexes
{ errorType: 1, severity: 1 }
{ resolved: 1, lastOccurred: -1 }
{ 'user.userId': 1 }
{ createdAt: -1 }
```

### Log Indexes

```javascript
// Unique index
{ logId: 1 }  // Unique constraint

// Compound indexes
{ level: 1, timestamp: -1 }
{ category: 1, timestamp: -1 }
{ source: 1, timestamp: -1 }
{ 'request.userId': 1, timestamp: -1 }
{ 'request.url': 1, timestamp: -1 }
{ 'request.method': 1, timestamp: -1 }
{ 'response.statusCode': 1, timestamp: -1 }
{ 'error.name': 1, timestamp: -1 }
{ timestamp: -1 }

// TTL index for automatic cleanup
{ retentionDate: 1 }, { expireAfterSeconds: 0 }
```

---

## Error Types and Severity

### Error Types

| Type | Description | Examples |
|------|-------------|----------|
| `application` | General application errors | Unhandled exceptions, logic errors |
| `database` | Database-related errors | Connection failures, query errors, validation errors |
| `external_api` | Third-party API errors | PayPal API errors, external service failures |
| `validation` | Input validation errors | Invalid email format, missing required fields |
| `authentication` | Authentication failures | Invalid token, expired session |
| `authorization` | Authorization failures | Insufficient permissions, access denied |
| `rate_limit` | Rate limiting errors | Too many requests, API quota exceeded |
| `payment` | Payment processing errors | Payment gateway failures, transaction errors |
| `other` | Uncategorized errors | Unknown error types |

### Severity Levels

| Severity | Description | Alert Threshold | Examples |
|----------|-------------|-----------------|----------|
| `critical` | System-breaking errors | 1 occurrence | Database connection failures, payment processing errors |
| `high` | Important errors requiring attention | 5 occurrences | Authentication failures, validation errors |
| `medium` | Moderate errors | 10 occurrences | API errors, rate limiting |
| `low` | Minor errors | 20 occurrences | Non-critical warnings, info-level issues |

### Severity Determination Logic

The system automatically determines severity based on:

1. **Critical**:
   - MongoDB duplicate key errors (code 11000)
   - HTTP status codes >= 500
   - Payment-related endpoints

2. **High**:
   - Validation errors
   - JWT errors
   - HTTP status codes 400-499
   - Authentication/authorization endpoints

3. **Medium**:
   - Token expiration errors
   - HTTP status codes 300-399

4. **Low**:
   - All other errors

---

## Alert Thresholds

The system automatically sends alerts when error occurrences reach certain thresholds:

| Severity | Threshold | Description |
|----------|-----------|-------------|
| `critical` | 1 | Alert on first occurrence |
| `high` | 5 | Alert after 5 occurrences |
| `medium` | 10 | Alert after 10 occurrences |
| `low` | 20 | Alert after 20 occurrences |

Alerts are logged and can be integrated with external services like:
- Slack
- Discord
- Email notifications
- Monitoring services (Sentry, DataDog, etc.)

---

## Usage Examples

### Tracking an Error

```javascript
const errorMonitoringService = require('../services/errorMonitoringService');

try {
  // Some operation that might fail
  await riskyOperation();
} catch (error) {
  // Track error with request context
  await errorMonitoringService.trackError(error, req, {
    operation: 'riskyOperation',
    additionalContext: 'custom data'
  });
}
```

### Getting Error Statistics

```javascript
const errorMonitoringService = require('../services/errorMonitoringService');

// Get error stats for last 24 hours
const stats = await errorMonitoringService.getErrorStats('24h');

// Get error stats for last 7 days
const weeklyStats = await errorMonitoringService.getErrorStats('7d');
```

### Getting Unresolved Errors

```javascript
const errorMonitoringService = require('../services/errorMonitoringService');

// Get top 50 unresolved errors
const unresolved = await errorMonitoringService.getUnresolvedErrors(50);

// Get unresolved critical errors
const criticalErrors = unresolved.filter(e => e.severity === 'critical');
```

### Resolving an Error

```javascript
const errorMonitoringService = require('../services/errorMonitoringService');

const errorId = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const resolvedBy = req.user.id; // Admin user ID
const resolution = 'Fixed validation logic in User model';

await errorMonitoringService.resolveError(errorId, resolvedBy, resolution);
```

### Getting Error Details

```javascript
const errorMonitoringService = require('../services/errorMonitoringService');

const errorId = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const errorDetails = await errorMonitoringService.getErrorDetails(errorId);

console.log(`Error: ${errorDetails.message}`);
console.log(`Occurrences: ${errorDetails.occurrences}`);
console.log(`First occurred: ${errorDetails.firstOccurred}`);
console.log(`Last occurred: ${errorDetails.lastOccurred}`);
```

### Querying Logs

```javascript
const Log = require('../models/Log');

// Get all error logs from last 24 hours
const errorLogs = await Log.find({
  level: 'error',
  timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
}).sort({ timestamp: -1 });

// Get logs for a specific user
const userLogs = await Log.find({
  'request.userId': userId
}).sort({ timestamp: -1 }).limit(100);

// Get performance logs
const perfLogs = await Log.find({
  category: 'performance',
  'response.responseTime': { $gt: 1000 } // Slower than 1 second
}).sort({ 'response.responseTime': -1 });
```

### Getting Log Statistics

```javascript
const Log = require('../models/Log');

// Get log stats for last 24 hours
const stats = await Log.getLogStats('24h');

// Get error stats
const errorStats = await Log.getErrorStats('7d');

// Get performance stats
const perfStats = await Log.getPerformanceStats('24h');
```

### Creating a Manual Log Entry

```javascript
const Log = require('../models/Log');
const { v4: uuidv4 } = require('uuid');

const log = await Log.create({
  logId: `log-${Date.now()}-${uuidv4()}`,
  level: 'info',
  message: 'Custom business event occurred',
  category: 'business',
  source: 'manual',
  metadata: {
    eventType: 'user_upgrade',
    planId: 'premium'
  }
});
```

### Cleanup Expired Logs

```javascript
const Log = require('../models/Log');

// Manually cleanup expired logs (usually handled by TTL index)
const result = await Log.cleanupExpiredLogs();
console.log(`Deleted ${result.deletedCount} expired logs`);
```

---

## Service Methods

### ErrorMonitoringService

The `ErrorMonitoringService` provides the following methods:

#### `trackError(error, req, additionalInfo)`
Tracks an error and creates or updates an error record.

**Parameters:**
- `error` (Error): The error object
- `req` (Request, optional): Express request object
- `additionalInfo` (Object, optional): Additional metadata

**Returns:** Promise<ErrorTracking>

#### `getErrorStats(timeframe)`
Gets error statistics for a specified timeframe.

**Parameters:**
- `timeframe` (String): '1h', '24h', '7d', or '30d'

**Returns:** Promise<Array>

#### `getUnresolvedErrors(limit)`
Gets unresolved errors sorted by last occurrence.

**Parameters:**
- `limit` (Number, optional): Maximum number of errors to return (default: 50)

**Returns:** Promise<Array<ErrorTracking>>

#### `resolveError(errorId, resolvedBy, resolution)`
Marks an error as resolved.

**Parameters:**
- `errorId` (String): The error ID
- `resolvedBy` (ObjectId): User ID who resolved the error
- `resolution` (String): Resolution description

**Returns:** Promise<ErrorTracking>

#### `getErrorDetails(errorId)`
Gets detailed information about a specific error.

**Parameters:**
- `errorId` (String): The error ID

**Returns:** Promise<ErrorTracking>

---

## Data Sanitization

The error monitoring system automatically sanitizes sensitive data:

### Headers Sanitized
- `authorization`
- `cookie`
- `x-api-key`
- `x-auth-token`

### Body Fields Sanitized
- `password`
- `token`
- `secret`
- `key`
- `creditCard`
- `ssn`
- `pin`

All sensitive data is replaced with `[REDACTED]` before storage.

---

## Best Practices

1. **Always track errors**: Use the error monitoring service for all error handling
2. **Include context**: Provide request object and additional metadata when tracking errors
3. **Resolve errors promptly**: Mark errors as resolved when fixed
4. **Monitor alert thresholds**: Set up notifications for critical errors
5. **Review logs regularly**: Use log statistics to identify patterns
6. **Clean up old logs**: Rely on TTL indexes for automatic cleanup
7. **Use appropriate log levels**: Use correct log levels for better filtering
8. **Categorize logs**: Use appropriate categories for better organization
9. **Monitor performance**: Use performance logs to identify slow endpoints
10. **Protect sensitive data**: Trust the automatic sanitization but be cautious

---

## Model Exports

### ErrorTracking
The `ErrorTracking` model is exported from `src/services/errorMonitoringService.js`:

```javascript
const errorMonitoringService = require('../services/errorMonitoringService');
// ErrorTracking model is internal to the service
```

### Log
The `Log` model is exported from `src/models/Log.js`:

```javascript
const Log = require('../models/Log');
```

---

## Related Documentation

- [Logging and Error Monitoring](./LOGGING_AND_ERROR_MONITORING.md)
- [API Endpoints with Roles](./API_ENDPOINTS_WITH_ROLES.md)

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0

