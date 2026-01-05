# GPS & Time Tracking API Endpoints

Complete list of all API endpoints for the GPS & Time Tracking feature.

**Base URL:** `/api`

**Authentication:** All endpoints require Bearer token authentication.

---

## Authentication Endpoints

Before using the GPS & Time Tracking endpoints, you need to authenticate and obtain a JWT token.

### Register User
```
POST /api/auth/register
```

### Login
```
POST /api/auth/login
```
**Response includes:** `token` (access token), `refreshToken`, `user` object

### Login with Email
```
POST /api/auth/login-email
```
**Request Body:** `email`, `password`

### Verify Email OTP
```
POST /api/auth/verify-email-otp
```
**Request Body:** `email`, `otp`

### Get Current User Profile
```
GET /api/auth/me
```
**Headers:** `Authorization: Bearer <token>`

### Refresh Access Token
```
POST /api/auth/refresh
```
**Request Body:** `refreshToken`

### Logout
```
POST /api/auth/logout
```
**Headers:** `Authorization: Bearer <token>`

### Register with Email
```
POST /api/auth/register-email
```
**Request Body:** `email`, `password`, `firstName` (optional), `lastName` (optional)

### Send Verification Code (Phone)
```
POST /api/auth/send-code
```
**Request Body:** `phoneNumber`

### Verify Code (Phone)
```
POST /api/auth/verify-code
```
**Request Body:** `phoneNumber`, `code`

### Check Email
```
POST /api/auth/check-email
```
**Request Body:** `email`

### Set Password
```
POST /api/auth/set-password
```
**Request Body:** `email`, `otp`, `password`

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

**Total Endpoints:** 27

- **Authentication:** 12 endpoints
- **Time Entries:** 7 endpoints
- **GPS Logs:** 4 endpoints
- **Geofence Events:** 4 endpoints

---

## Quick Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns token)
- `POST /api/auth/login-email` - Login with email
- `POST /api/auth/verify-email-otp` - Verify email OTP
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/register-email` - Register with email
- `POST /api/auth/send-code` - Send phone verification code
- `POST /api/auth/verify-code` - Verify phone code
- `POST /api/auth/check-email` - Check if email exists
- `POST /api/auth/set-password` - Set password

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
