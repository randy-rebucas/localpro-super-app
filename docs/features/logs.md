# Logs Feature Documentation

## Overview
The Logs feature provides comprehensive application logging, search, and analysis capabilities.

## Base Path
`/api/logs`

## Endpoints

### Authenticated Endpoints (Admin Only)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/stats` | Get log statistics | **admin** |
| GET | `/` | Get logs | **admin** |
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

### Search Logs
```http
GET /api/logs/search/global?query=error&level=error&startDate=2025-01-01&limit=100
Authorization: Bearer <token>
```

### Get Error Trends
```http
GET /api/logs/analytics/error-trends?timeframe=30d
Authorization: Bearer <token>
```

## Log Levels

- `error` - Error logs
- `warn` - Warning logs
- `info` - Information logs
- `debug` - Debug logs

## Related Features
- Error Monitoring
- Audit Logs
- Monitoring

