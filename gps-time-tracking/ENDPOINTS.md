# GPS & Time Tracking API Endpoints

Complete list of all API endpoints for the GPS & Time Tracking feature.

**Base URL:** `/api`

**Authentication:** All endpoints require Bearer token authentication.

---

## Time Entries Endpoints

### Create Time Entry (Clock In)
```
POST /api/time-entries
```

### Get All Time Entries
```
GET /api/time-entries
```
**Query Parameters:** `page`, `limit`, `startDate`, `endDate`, `jobId`, `status`

### Get Time Entry by ID
```
GET /api/time-entries/:id
```
**Path Parameters:** `id` (time entry ID)

### Update Time Entry
```
PATCH /api/time-entries/:id
```
**Path Parameters:** `id` (time entry ID)

### Get Active Time Entry
```
GET /api/time-entries/active/:userId
```
**Path Parameters:** `userId` (user ID)

### Clock Out
```
POST /api/time-entries/:id/clock-out
```
**Path Parameters:** `id` (time entry ID)

### Request Manual Edit
```
POST /api/time-entries/:id/request-edit
```
**Path Parameters:** `id` (time entry ID)

---

## GPS Logs Endpoints

### Create GPS Log
```
POST /api/gps-logs
```

### Batch Create GPS Logs
```
POST /api/gps-logs/batch
```

### Get GPS Logs
```
GET /api/gps-logs
```
**Query Parameters:** `page`, `limit`, `timeEntryId`, `startDate`, `endDate`

### Get GPS Logs by Time Entry
```
GET /api/gps-logs/time-entry/:timeEntryId
```
**Path Parameters:** `timeEntryId` (time entry ID)

**Query Parameters:** `page`, `limit`

---

## Geofence Events Endpoints

### Create Geofence Event
```
POST /api/geofence-events
```

### Get Geofence Events
```
GET /api/geofence-events
```
**Query Parameters:** `page`, `limit`, `jobId`, `eventType`, `startDate`, `endDate`, `targetUserId`

### Get Geofence Events by Job
```
GET /api/geofence-events/job/:jobId
```
**Path Parameters:** `jobId` (job ID)

**Query Parameters:** `page`, `limit`

### Get Geofence Events by User
```
GET /api/geofence-events/user/:userId
```
**Path Parameters:** `userId` (user ID)

**Query Parameters:** `page`, `limit`

---

## Summary

**Total Endpoints:** 15

- **Time Entries:** 7 endpoints
- **GPS Logs:** 4 endpoints
- **Geofence Events:** 4 endpoints

---

## Quick Reference

### Time Entries
- `POST /api/time-entries` - Create (Clock In)
- `GET /api/time-entries` - List all
- `GET /api/time-entries/:id` - Get one
- `PATCH /api/time-entries/:id` - Update
- `GET /api/time-entries/active/:userId` - Get active
- `POST /api/time-entries/:id/clock-out` - Clock out
- `POST /api/time-entries/:id/request-edit` - Request edit

### GPS Logs
- `POST /api/gps-logs` - Create one
- `POST /api/gps-logs/batch` - Create many
- `GET /api/gps-logs` - List all
- `GET /api/gps-logs/time-entry/:timeEntryId` - List by time entry

### Geofence Events
- `POST /api/geofence-events` - Create
- `GET /api/geofence-events` - List all
- `GET /api/geofence-events/job/:jobId` - List by job
- `GET /api/geofence-events/user/:userId` - List by user
