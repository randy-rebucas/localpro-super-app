# Error Monitoring Feature Documentation

## Overview
The Error Monitoring feature tracks, logs, and manages application errors for debugging and system health.

## Base Path
`/api/error-monitoring`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Error monitoring info |

### Authenticated Endpoints (Admin Only)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/stats` | Get error statistics | **admin** |
| GET | `/unresolved` | Get unresolved errors | **admin** |
| GET | `/:errorId` | Get error details | **admin** |
| PATCH | `/:errorId/resolve` | Resolve error | **admin** |
| GET | `/dashboard/summary` | Get dashboard summary | **admin** |

## Request/Response Examples

### Get Error Statistics
```http
GET /api/error-monitoring/stats?timeframe=7d
Authorization: Bearer <token>
```

### Resolve Error
```http
PATCH /api/error-monitoring/:errorId/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolution": "Fixed in version 2.1.0",
  "notes": "Updated validation logic"
}
```

## Error Status

- `unresolved` - Error not yet resolved
- `resolved` - Error resolved
- `ignored` - Error ignored

## Related Features
- Logs
- Monitoring
- Audit Logs

