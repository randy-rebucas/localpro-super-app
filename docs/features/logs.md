# Logs Feature Documentation

## Overview
The Logs feature provides comprehensive application logging, search, and analysis capabilities. It includes:
- Real-time log collection via Winston
- Database storage with MongoDB
- Log analysis and statistics
- Performance metrics tracking
- Error trend analysis
- Log export functionality
- Automatic log cleanup with retention policies

## Architecture

### Components

1. **Winston Logger** (`src/config/logger.js`)
   - Console output with colorization
   - Daily rotating file logs
   - Database transport for MongoDB storage

2. **Database Transport** (`src/config/databaseTransport.js`)
   - Batched writes for performance
   - Automatic sanitization of sensitive data
   - Configurable flush intervals

3. **Log Model** (`src/models/Log.js`)
   - Comprehensive schema for all log types
   - TTL indexes for automatic cleanup
   - Aggregation pipelines for statistics

4. **Log Management Service** (`src/services/logManagementService.js`)
   - Statistics and analytics
   - Export functionality
   - Cleanup operations

## Base Path
`/api/logs`

## Endpoints

### Authenticated Endpoints (Admin Only)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/stats` | Get log statistics | **admin** |
| GET | `/` | Get logs with filtering | **admin** |
| GET | `/:logId` | Get log details | **admin** |
| GET | `/analytics/error-trends` | Get error trends | **admin** |
| GET | `/analytics/performance` | Get performance metrics | **admin** |
| GET | `/user/:userId/activity` | Get user activity logs | **admin** |
| GET | `/export/data` | Export logs | **admin** |
| GET | `/dashboard/summary` | Get dashboard summary | **admin** |
| GET | `/search/global` | Search logs globally | **admin** |
| POST | `/cleanup` | Cleanup expired logs | **admin** |
| POST | `/flush` | Flush all logs | **admin** |
| DELETE | `/flush` | Flush all logs (alternative) | **admin** |

## Request/Response Examples

### Get Log Statistics
```http
GET /api/logs/stats?timeframe=24h
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "timeframe": "24h",
    "logs": {
      "byLevel": [
        {
          "_id": "error",
          "totalCount": 15,
          "categories": [
            { "category": "application", "count": 10 },
            { "category": "http", "count": 5 }
          ]
        }
      ],
      "errors": [...],
      "performance": [...]
    },
    "audit": {
      "byCategory": [...]
    },
    "summary": {
      "totalLogs": 1500,
      "totalErrors": 15,
      "totalAuditEvents": 250
    }
  }
}
```

### Get Logs with Filtering
```http
GET /api/logs?level=error&category=application&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=50
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "logId": "abc123...",
      "level": "error",
      "message": "Database connection failed",
      "category": "application",
      "source": "winston",
      "timestamp": "2024-01-15T10:30:00Z",
      "error": {
        "name": "MongoError",
        "message": "Connection refused"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

### Get Error Trends
```http
GET /api/logs/analytics/error-trends?timeframe=7d
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "2024-01-15",
      "errors": [
        { "name": "ValidationError", "count": 5 },
        { "name": "AuthenticationError", "count": 3 }
      ],
      "totalCount": 8
    }
  ]
}
```

### Get Performance Metrics
```http
GET /api/logs/analytics/performance?timeframe=24h
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "/api/marketplace/services",
      "avgResponseTime": 45.5,
      "maxResponseTime": 250,
      "minResponseTime": 15,
      "count": 500,
      "slowRequests": 5
    }
  ]
}
```

### Get Dashboard Summary
```http
GET /api/logs/dashboard/summary
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "recentLogs": [...],
    "statistics": {
      "errors24h": 15,
      "errors7d": 85,
      "auditEvents24h": 250,
      "auditEvents7d": 1500,
      "performanceIssues24h": 3
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Search Logs
```http
GET /api/logs/search/global?q=database+error&timeframe=7d
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "auditLogs": [...],
    "errorLogs": [...],
    "totalResults": 25
  }
}
```

### Export Logs
```http
GET /api/logs/export/data?format=json&level=error&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

### Flush Logs
```http
POST /api/logs/flush
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "all"  // "all", "database", or "files"
}
```

Response:
```json
{
  "success": true,
  "message": "Log flush completed successfully",
  "data": {
    "type": "all",
    "deletedFromDB": 5000,
    "deletedFiles": 12,
    "logsDirFiles": 8,
    "routesLogsDirFiles": 4,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Log Levels

| Level | Priority | Description | Retention |
|-------|----------|-------------|-----------|
| `error` | 0 | Error logs requiring attention | 90 days |
| `warn` | 1 | Warning messages | 30 days |
| `info` | 2 | Informational messages | 14 days |
| `http` | 3 | HTTP request logs | 7 days |
| `debug` | 4 | Debug information | 3 days |

## Log Categories

- `application` - General application logs
- `http` - HTTP request/response logs
- `error` - Error logs
- `performance` - Performance metrics
- `business` - Business event logs
- `security` - Security-related logs
- `audit` - Audit trail logs
- `system` - System-level logs

## Log Sources

- `winston` - Standard Winston logs
- `audit` - Audit service logs
- `error_monitoring` - Error monitoring service
- `request_logger` - HTTP request logger
- `manual` - Manually logged entries

## Log Schema

```javascript
{
  logId: String,          // Unique log identifier
  level: String,          // Log level
  message: String,        // Log message
  category: String,       // Log category
  source: String,         // Log source
  request: {              // HTTP request info (if applicable)
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
  response: {             // HTTP response info (if applicable)
    statusCode: Number,
    responseTime: Number,
    success: Boolean
  },
  error: {                // Error info (if applicable)
    name: String,
    message: String,
    stack: String,
    code: String,
    statusCode: Number
  },
  metadata: Object,       // Additional metadata
  environment: String,    // Environment (development, production)
  timestamp: Date,        // Log timestamp
  retentionDate: Date     // Automatic deletion date
}
```

## Query Parameters

### Filtering
- `level` - Filter by log level
- `category` - Filter by category
- `source` - Filter by source
- `startDate` - Start date for time range
- `endDate` - End date for time range
- `userId` - Filter by user ID
- `url` - Filter by request URL
- `method` - Filter by HTTP method
- `statusCode` - Filter by response status code
- `search` - Search in message and error fields

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `sortBy` - Sort field (default: timestamp)
- `sortOrder` - Sort order: `asc` or `desc` (default: desc)

### Timeframes
- `1h` - Last hour
- `24h` - Last 24 hours
- `7d` - Last 7 days
- `30d` - Last 30 days

## Configuration

### Environment Variables

```env
# Enable/disable database logging
LOG_DATABASE_ENABLED=true

# Log level
LOG_LEVEL=info

# Batch size for database writes
LOG_BATCH_SIZE=100

# Flush interval in milliseconds
LOG_FLUSH_INTERVAL=5000
```

### Winston Configuration

```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({ /* ... */ }),
    new DatabaseTransport({ /* ... */ })
  ]
});
```

## Custom Logging Methods

```javascript
// Log HTTP request
logger.logRequest(req, res, responseTime);

// Log error
logger.logError(error, req, additionalInfo);

// Log performance
logger.logPerformance(operation, duration, metadata);

// Log business event
logger.logBusinessEvent(event, data);

// Log security event
logger.logSecurityEvent(event, data);
```

## Retention Policies

Logs are automatically deleted based on their level:

| Log Type | Retention Period |
|----------|------------------|
| Error logs | 90 days |
| Warning logs | 30 days |
| Info logs | 14 days |
| HTTP logs | 7 days |
| Debug logs | 3 days |
| Audit logs | 7 years |

## File Storage

Logs are stored in rotating files:

```
logs/
├── error-YYYY-MM-DD.log      # Error logs
├── combined-YYYY-MM-DD.log   # All logs
└── http-YYYY-MM-DD.log       # HTTP logs
```

## Security

- Sensitive headers (authorization, cookies) are redacted
- Passwords and tokens are never logged
- Request bodies with sensitive fields are sanitized
- Admin authentication required for all endpoints

## Related Features
- [Audit Logs](/api/audit-logs)
- [Error Monitoring](/api/error-monitoring)
- [Monitoring](/api/monitoring)
- [Analytics](/api/analytics)
