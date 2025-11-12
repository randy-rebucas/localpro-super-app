# Audit Logs Feature Documentation

## Overview
The Audit Logs feature tracks and logs all significant system actions for security, compliance, and debugging purposes.

## Base Path
`/api/audit-logs`

## Endpoints

### Authenticated Endpoints (Admin Only)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/` | Get audit logs | **admin** |
| GET | `/stats` | Get audit statistics | **admin** |
| GET | `/user/:userId/activity` | Get user activity summary | **admin** |
| GET | `/:auditId` | Get audit log details | **admin** |
| GET | `/export/data` | Export audit logs | **admin** |
| GET | `/dashboard/summary` | Get dashboard summary | **admin** |
| POST | `/cleanup` | Cleanup expired logs | **admin** |
| GET | `/metadata/categories` | Get audit metadata | **admin** |

## Request/Response Examples

### Get Audit Logs
```http
GET /api/audit-logs?action=user.created&userId=user_id&page=1&limit=50
Authorization: Bearer <token>
```

### Export Audit Logs
```http
GET /api/audit-logs/export/data?startDate=2025-01-01&endDate=2025-01-31&format=csv
Authorization: Bearer <token>
```

## Audit Categories

- `user` - User-related actions
- `service` - Service-related actions
- `booking` - Booking-related actions
- `payment` - Payment-related actions
- `admin` - Admin actions
- `system` - System actions

## Related Features
- User Management
- Logs
- Error Monitoring

