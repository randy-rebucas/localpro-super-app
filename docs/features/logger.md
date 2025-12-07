# Logger System

The LocalPro Super App features a comprehensive logging system built on Winston with MongoDB storage, request correlation, and runtime management capabilities.

## Overview

The logging system provides:
- **Multi-transport logging** (Console, Files, Database)
- **Request correlation** for distributed tracing
- **Runtime log level management**
- **Structured logging** with context
- **Performance tracking**
- **Security event logging**
- **Log querying and analytics**

## Base Path

```
/api/logs
```

## Architecture

### Components

1. **Base Logger** (`src/config/logger.js`) - Winston configuration
2. **Database Transport** (`src/config/databaseTransport.js`) - MongoDB log storage
3. **Logger Service** (`src/services/loggerService.js`) - Enhanced logging utilities
4. **App Logger** (`src/utils/logger.js`) - Context-aware logging wrapper
5. **Request Correlation** (`src/middleware/requestCorrelation.js`) - Distributed tracing
6. **Request Logger** (`src/middleware/requestLogger.js`) - HTTP request logging

### Log Levels

| Level | Priority | Description |
|-------|----------|-------------|
| `error` | 0 | Error conditions |
| `warn` | 1 | Warning conditions |
| `info` | 2 | Informational messages |
| `http` | 3 | HTTP request logging |
| `debug` | 4 | Debug-level messages |

### Log Categories

- `error` - Application errors
- `security` - Security events
- `http` - HTTP requests/responses
- `performance` - Performance metrics
- `business` - Business events
- `application` - General application logs
- `database` - Database operations
- `audit` - Audit trail events

## API Endpoints

### Runtime Configuration [ADMIN ONLY]

#### Get Logger Configuration

```http
GET /api/logs/config
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "defaultLevel": "info",
    "levels": {
      "error": 0,
      "warn": 1,
      "info": 2,
      "http": 3,
      "debug": 4
    },
    "overrides": {
      "AuthService": "debug",
      "PaymentService": "warn"
    },
    "metrics": {
      "totalLogs": 15420,
      "byLevel": {
        "error": 45,
        "warn": 230,
        "info": 8500,
        "http": 5200,
        "debug": 1445
      },
      "byCategory": {
        "http": 5200,
        "application": 8500,
        "security": 275
      },
      "lastReset": "2024-12-07T10:00:00.000Z",
      "uptime": 86400000,
      "logsPerMinute": "10.71"
    }
  }
}
```

#### Set Global Log Level

```http
PUT /api/logs/config/level
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "level": "debug"
}
```

**Valid Levels:** `error`, `warn`, `info`, `http`, `debug`

**Response:**
```json
{
  "success": true,
  "message": "Log level changed from info to debug",
  "data": {
    "previousLevel": "info",
    "currentLevel": "debug"
  }
}
```

#### Set Log Level Override

Override log level for specific modules/contexts:

```http
PUT /api/logs/config/override
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "context": "PaymentService",
  "level": "debug"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Log level override set for PaymentService",
  "data": {
    "context": "PaymentService",
    "level": "debug",
    "overrides": {
      "PaymentService": "debug",
      "AuthService": "debug"
    }
  }
}
```

#### Remove Log Level Override

```http
DELETE /api/logs/config/override/:context
Authorization: Bearer <admin_token>
```

### Log Metrics [ADMIN ONLY]

#### Get Real-time Metrics

```http
GET /api/logs/metrics
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 15420,
    "byLevel": {
      "error": 45,
      "warn": 230,
      "info": 8500,
      "http": 5200,
      "debug": 1445
    },
    "byCategory": {
      "http": 5200,
      "application": 8500,
      "security": 275
    },
    "lastReset": "2024-12-07T10:00:00.000Z",
    "uptime": 86400000,
    "logsPerMinute": "10.71"
  }
}
```

#### Reset Metrics

```http
POST /api/logs/metrics/reset
Authorization: Bearer <admin_token>
```

### Log Queries [ADMIN ONLY]

#### Query Logs

```http
GET /api/logs/query
Authorization: Bearer <admin_token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `level` | string | Filter by log level |
| `category` | string | Filter by category |
| `startDate` | ISO string | Start date for range |
| `endDate` | ISO string | End date for range |
| `correlationId` | string | Filter by correlation ID |
| `userId` | string | Filter by user ID |
| `search` | string | Text search in message |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (max: 100) |
| `sortBy` | string | Sort field (default: timestamp) |
| `sortOrder` | string | `asc` or `desc` (default: desc) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "logId": "abc123...",
      "level": "info",
      "message": "User logged in",
      "category": "security",
      "timestamp": "2024-12-07T10:30:00.000Z",
      "metadata": {
        "correlationId": "lq7x9a-xyz123",
        "userId": "user123"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1500,
    "pages": 30
  }
}
```

#### Get Logs by Correlation ID

```http
GET /api/logs/correlation/:correlationId
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "correlationId": "lq7x9a-xyz123",
    "logs": [
      {
        "level": "http",
        "message": "POST /api/auth/login",
        "timestamp": "2024-12-07T10:30:00.000Z"
      },
      {
        "level": "info",
        "message": "User authenticated",
        "timestamp": "2024-12-07T10:30:00.050Z"
      },
      {
        "level": "info",
        "message": "Token generated",
        "timestamp": "2024-12-07T10:30:00.100Z"
      }
    ],
    "count": 3
  }
}
```

### Error Analysis [ADMIN ONLY]

#### Get Error Summary

```http
GET /api/logs/errors/summary?timeframe=24h
Authorization: Bearer <admin_token>
```

**Timeframes:** `1h`, `24h`, `7d`, `30d`

**Response:**
```json
{
  "success": true,
  "data": {
    "timeframe": "24h",
    "totalErrors": 45,
    "errorTypes": [
      {
        "_id": "ValidationError",
        "count": 20,
        "messages": ["Invalid email format", "Password too short"],
        "lastOccurrence": "2024-12-07T10:25:00.000Z"
      },
      {
        "_id": "MongooseError",
        "count": 15,
        "messages": ["Connection timeout"],
        "lastOccurrence": "2024-12-07T09:45:00.000Z"
      }
    ],
    "since": "2024-12-06T10:30:00.000Z"
  }
}
```

#### Get Log Statistics

```http
GET /api/logs/statistics?timeframe=24h
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timeframe": "24h",
    "byLevel": {
      "error": 45,
      "warn": 230,
      "info": 8500,
      "http": 5200
    },
    "byCategory": {
      "http": 5200,
      "application": 8500,
      "security": 275
    },
    "byHour": [
      { "hour": "2024-12-07 00:00", "count": 520 },
      { "hour": "2024-12-07 01:00", "count": 480 },
      { "hour": "2024-12-07 02:00", "count": 410 }
    ],
    "since": "2024-12-06T10:30:00.000Z"
  }
}
```

#### Get Slow Operations

```http
GET /api/logs/slow-operations?threshold=1000&timeframe=24h
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "threshold": 1000,
    "timeframe": "24h",
    "operations": [
      {
        "message": "Database query",
        "category": "database",
        "response": {
          "responseTime": 2500
        },
        "metadata": {
          "collection": "users",
          "operation": "find"
        },
        "timestamp": "2024-12-07T10:20:00.000Z"
      }
    ],
    "count": 12
  }
}
```

### Log Management [ADMIN ONLY]

#### Get All Logs

```http
GET /api/logs
Authorization: Bearer <admin_token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `level` | string | Filter by level |
| `category` | string | Filter by category |
| `source` | string | Filter by source |
| `startDate` | ISO string | Start date |
| `endDate` | ISO string | End date |
| `userId` | string | Filter by user |
| `url` | string | Filter by URL |
| `method` | string | HTTP method |
| `statusCode` | number | Response status |
| `search` | string | Text search |
| `page` | number | Page number |
| `limit` | number | Items per page |
| `sortBy` | string | Sort field |
| `sortOrder` | string | Sort direction |

#### Get Log Details

```http
GET /api/logs/:logId
Authorization: Bearer <admin_token>
```

#### Get Log Statistics (Legacy)

```http
GET /api/logs/stats?timeframe=24h
Authorization: Bearer <admin_token>
```

#### Get Error Trends

```http
GET /api/logs/analytics/error-trends?timeframe=7d
Authorization: Bearer <admin_token>
```

#### Get Performance Metrics

```http
GET /api/logs/analytics/performance?timeframe=24h
Authorization: Bearer <admin_token>
```

#### Get User Activity Logs

```http
GET /api/logs/user/:userId/activity?timeframe=7d
Authorization: Bearer <token>
```

**Note:** Users can only view their own activity; admins can view any user's.

#### Export Logs

```http
GET /api/logs/export/data?format=json
Authorization: Bearer <admin_token>
```

**Formats:** `json`, `csv`

#### Dashboard Summary

```http
GET /api/logs/dashboard/summary
Authorization: Bearer <admin_token>
```

#### Global Search

```http
GET /api/logs/search/global?q=error&timeframe=7d
Authorization: Bearer <admin_token>
```

#### Clean Up Expired Logs

```http
POST /api/logs/cleanup
Authorization: Bearer <admin_token>
```

#### Flush All Logs

```http
POST /api/logs/flush
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "type": "all"  // "all", "database", or "files"
}
```

Or via DELETE:

```http
DELETE /api/logs/flush
Authorization: Bearer <admin_token>
```

## Usage Examples

### Using the AppLogger

```javascript
const { AppLogger, logger } = require('../utils/logger');

// Create a context-specific logger
const authLogger = new AppLogger('AuthService');

// Basic logging
authLogger.info('User authentication started', { userId: '123' });
authLogger.debug('Checking credentials', { method: 'password' });
authLogger.warn('Invalid login attempt', { attempts: 3 });
authLogger.error('Authentication failed', error, { userId: '123' });

// Specialized logging
authLogger.authEvent('login_success', userId, { provider: 'google' });
authLogger.securityEvent('suspicious_activity', { ip: '1.2.3.4' });
authLogger.performance('token_generation', 45, { tokenType: 'access' });
authLogger.database('insert', 'users', 25, { operation: 'create' });
```

### Using the Logger Service

```javascript
const loggerService = require('../services/loggerService');

// Log with correlation
loggerService.info('Processing payment', {
  requestId: req.id,
  correlationId: req.correlationId,
  category: 'payment',
  amount: 100
});

// Log database operation
loggerService.logDatabaseOp('find', 'users', 150, {
  query: { email: 'user@example.com' }
});

// Log external API call
loggerService.logExternalApi('Stripe', '/v1/charges', 200, 350, {
  amount: 5000,
  currency: 'USD'
});

// Log security event
loggerService.logSecurityEvent('brute_force_detected', {
  ip: '1.2.3.4',
  attempts: 10,
  severity: 'high'
});

// Log audit event
loggerService.logAudit('user_role_changed', userId, {
  previousRole: 'user',
  newRole: 'admin',
  changedBy: adminId
});
```

### Request Correlation

Every request automatically receives:
- `req.id` - Unique request ID
- `req.correlationId` - Correlation ID for tracing

Response headers include:
- `X-Request-ID` - The request ID
- `X-Correlation-ID` - The correlation ID

To trace a request through the system:

```bash
curl -H "X-Correlation-ID: my-trace-123" https://api.example.com/endpoint
```

Then query logs by correlation ID:

```http
GET /api/logs/correlation/my-trace-123
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Default log level | `info` |
| `LOG_DATABASE_ENABLED` | Enable DB logging | `true` |
| `LOG_BATCH_SIZE` | DB batch insert size | `100` |
| `LOG_FLUSH_INTERVAL` | DB flush interval (ms) | `5000` |
| `NODE_ENV` | Environment | `development` |

### Log Files

Logs are stored in the `logs/` directory:

| File Pattern | Description | Retention |
|--------------|-------------|-----------|
| `error-YYYY-MM-DD.log` | Error logs | 14 days |
| `combined-YYYY-MM-DD.log` | All logs | 14 days |
| `http-YYYY-MM-DD.log` | HTTP requests | 7 days |

### Database Storage

Logs are stored in the `logs` MongoDB collection with TTL indexes for automatic cleanup based on category:

| Category | Retention |
|----------|-----------|
| `error` | 90 days |
| `security` | 365 days |
| `audit` | 730 days |
| `http` | 7 days |
| `performance` | 30 days |
| `application` | 30 days |
| `debug` | 7 days |

## Best Practices

1. **Use Context-Specific Loggers**
   ```javascript
   const logger = new AppLogger('ModuleName');
   ```

2. **Include Correlation IDs**
   ```javascript
   logger.info('Message', { correlationId: req.correlationId });
   ```

3. **Use Appropriate Log Levels**
   - `error`: Unrecoverable errors
   - `warn`: Recoverable issues, security events
   - `info`: Business events, state changes
   - `http`: HTTP requests
   - `debug`: Development debugging

4. **Sanitize Sensitive Data**
   - Never log passwords, tokens, or PII
   - Use the built-in sanitization utilities

5. **Structure Your Logs**
   ```javascript
   logger.info('User action', {
     userId: user.id,
     action: 'purchase',
     amount: 100,
     correlationId: req.correlationId
   });
   ```

## Related Features

- [Activities](./activities.md) - User activity tracking
- [Analytics](./analytics.md) - Platform analytics
- [Audit Logs](./auditLogs.md) - Compliance audit trail

