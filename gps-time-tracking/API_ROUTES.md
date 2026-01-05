# GPS & Time Tracking API Routes Documentation

This document describes all API endpoints for the GPS & Time Tracking feature.

## Base URL

All endpoints are prefixed with the API base URL. For example:
- Development: `http://localhost:5000/api`
- Production: `https://api.yourdomain.com/api`

## Authentication

All endpoints require authentication. Include the Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "pagination": { ... } // Only for paginated responses
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "errors": [ ... ] // For validation errors
}
```

---

## Time Entries API

### 1. Create Time Entry (Clock In)

**Endpoint:** `POST /api/time-entries`

**Description:** Create a new time entry to clock in for work.

**Request Body:**
```json
{
  "clockInTime": "2024-01-15T08:00:00Z", // Optional, defaults to now
  "jobId": "507f191e810c19729de860eb", // Optional
  "source": "mobile", // Optional: "mobile" | "admin", defaults to "mobile"
  "location": { // Optional
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10.5
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Time entry created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea",
    "clockInTime": "2024-01-15T08:00:00.000Z",
    "clockOutTime": null,
    "breakStartTime": null,
    "breakEndTime": null,
    "totalWorkTime": null,
    "source": "mobile",
    "jobId": "507f191e810c19729de860eb",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10.5
    },
    "manualEdit": null,
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
}
```

**Errors:**
- `400` - User already has an active time entry
- `400` - Validation error
- `404` - Job not found (if jobId provided)

---

### 2. Get All Time Entries

**Endpoint:** `GET /api/time-entries`

**Description:** Get all time entries for the authenticated user with optional filters.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)
- `startDate` (optional) - Start date (ISO 8601 format)
- `endDate` (optional) - End date (ISO 8601 format)
- `jobId` (optional) - Filter by job ID
- `status` (optional) - Filter by status: "active" | "completed"

**Example Request:**
```
GET /api/time-entries?page=1&limit=20&startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z&status=completed
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Time entries retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 95,
    "limit": 20,
    "count": 20
  }
}
```

---

### 3. Get Time Entry by ID

**Endpoint:** `GET /api/time-entries/:id`

**Description:** Get a specific time entry by ID.

**Path Parameters:**
- `id` - Time entry ID (MongoDB ObjectId)

**Example Request:**
```
GET /api/time-entries/507f1f77bcf86cd799439011
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Time entry retrieved successfully",
  "data": { ... }
}
```

**Errors:**
- `400` - Invalid time entry ID format
- `403` - Not authorized to view this time entry
- `404` - Time entry not found

---

### 4. Update Time Entry

**Endpoint:** `PATCH /api/time-entries/:id`

**Description:** Update a time entry (clock out time, breaks, location, etc.).

**Path Parameters:**
- `id` - Time entry ID (MongoDB ObjectId)

**Request Body:** (All fields optional)
```json
{
  "clockOutTime": "2024-01-15T17:00:00Z",
  "breakStartTime": "2024-01-15T12:00:00Z",
  "breakEndTime": "2024-01-15T12:30:00Z",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10.5
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Time entry updated successfully",
  "data": { ... }
}
```

**Errors:**
- `400` - Validation error (e.g., clockOutTime before clockInTime)
- `403` - Not authorized to update this time entry
- `404` - Time entry not found

---

### 5. Get Active Time Entry

**Endpoint:** `GET /api/time-entries/active/:userId`

**Description:** Get the active (clocked in) time entry for a user.

**Path Parameters:**
- `userId` - User ID (MongoDB ObjectId)

**Example Request:**
```
GET /api/time-entries/active/507f191e810c19729de860ea
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Active time entry retrieved successfully",
  "data": { ... }
}
```

**Errors:**
- `400` - Invalid user ID format
- `403` - Not authorized to view this user's active time entry
- `404` - No active time entry found

---

### 6. Clock Out

**Endpoint:** `POST /api/time-entries/:id/clock-out`

**Description:** Clock out from an active time entry.

**Path Parameters:**
- `id` - Time entry ID (MongoDB ObjectId)

**Request Body:** (Optional)
```json
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10.5
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Clocked out successfully",
  "data": { ... }
}
```

**Errors:**
- `400` - Time entry is already clocked out
- `403` - Not authorized to clock out this time entry
- `404` - Time entry not found

---

### 7. Request Manual Edit

**Endpoint:** `POST /api/time-entries/:id/request-edit`

**Description:** Request a manual edit for a time entry (requires admin approval).

**Path Parameters:**
- `id` - Time entry ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "reason": "Forgot to clock out, actual time was 5:30 PM"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Manual edit request submitted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "manualEdit": {
      "requestedBy": "507f191e810c19729de860ea",
      "approvedBy": null,
      "reason": "Forgot to clock out, actual time was 5:30 PM",
      "status": "pending"
    },
    ...
  }
}
```

**Errors:**
- `400` - A pending edit request already exists
- `403` - Not authorized to request edit for this time entry
- `404` - Time entry not found

---

## GPS Logs API

### 1. Create GPS Log

**Endpoint:** `POST /api/gps-logs`

**Description:** Create a new GPS log entry.

**Request Body:**
```json
{
  "timeEntryId": "507f1f77bcf86cd799439011", // Optional
  "latitude": 40.7128, // Required
  "longitude": -74.0060, // Required
  "accuracy": 10.5, // Optional - GPS accuracy in meters
  "altitude": 15.2, // Optional - Altitude in meters
  "speed": 0.0, // Optional - Speed in km/h
  "heading": 90.0, // Optional - Heading in degrees (0-360)
  "timestamp": "2024-01-15T08:00:15Z" // Optional, defaults to now
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "GPS log created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "507f191e810c19729de860ea",
    "timeEntryId": "507f1f77bcf86cd799439011",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10.5,
    "altitude": 15.2,
    "speed": 0.0,
    "heading": 90.0,
    "timestamp": "2024-01-15T08:00:15.000Z",
    "createdAt": "2024-01-15T08:00:15.000Z",
    "updatedAt": "2024-01-15T08:00:15.000Z"
  }
}
```

**Errors:**
- `400` - Validation error (invalid coordinates, etc.)
- `404` - Time entry not found (if timeEntryId provided)

---

### 2. Batch Create GPS Logs

**Endpoint:** `POST /api/gps-logs/batch`

**Description:** Create multiple GPS logs in a single request (useful for offline sync).

**Request Body:**
```json
{
  "logs": [
    {
      "timeEntryId": "507f1f77bcf86cd799439011",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 10.5,
      "timestamp": "2024-01-15T08:00:15Z"
    },
    {
      "timeEntryId": "507f1f77bcf86cd799439011",
      "latitude": 40.7130,
      "longitude": -74.0062,
      "accuracy": 10.5,
      "timestamp": "2024-01-15T08:01:15Z"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "2 GPS logs created successfully",
  "data": {
    "count": 2,
    "logs": [ ... ]
  }
}
```

**Errors:**
- `400` - Validation error
- `400` - Batch size exceeds 100 logs
- `404` - Time entry not found (if timeEntryId provided)

**Note:** Maximum batch size is 100 logs per request.

---

### 3. Get GPS Logs

**Endpoint:** `GET /api/gps-logs`

**Description:** Get GPS logs for the authenticated user with optional filters.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 100, max: 100)
- `timeEntryId` (optional) - Filter by time entry ID
- `startDate` (optional) - Start date (ISO 8601 format)
- `endDate` (optional) - End date (ISO 8601 format)

**Example Request:**
```
GET /api/gps-logs?timeEntryId=507f1f77bcf86cd799439011&startDate=2024-01-15T08:00:00Z&endDate=2024-01-15T17:00:00Z
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "GPS logs retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "current": 1,
    "pages": 10,
    "total": 1000,
    "limit": 100,
    "count": 100
  }
}
```

---

### 4. Get GPS Logs by Time Entry

**Endpoint:** `GET /api/gps-logs/time-entry/:timeEntryId`

**Description:** Get all GPS logs for a specific time entry.

**Path Parameters:**
- `timeEntryId` - Time entry ID (MongoDB ObjectId)

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 100, max: 100)

**Example Request:**
```
GET /api/gps-logs/time-entry/507f1f77bcf86cd799439011?page=1&limit=100
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "GPS logs retrieved successfully",
  "data": [ ... ],
  "pagination": { ... }
}
```

**Errors:**
- `400` - Invalid time entry ID format
- `400` - Not authorized to view GPS logs for this time entry
- `404` - Time entry not found

---

## Geofence Events API

### 1. Create Geofence Event

**Endpoint:** `POST /api/geofence-events`

**Description:** Create a new geofence entry or exit event.

**Request Body:**
```json
{
  "jobId": "507f191e810c19729de860eb", // Required
  "eventType": "entered", // Required: "entered" | "exited"
  "location": { // Required
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "timestamp": "2024-01-15T08:00:00Z" // Optional, defaults to now
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Geofence event created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "userId": "507f191e810c19729de860ea",
    "jobId": "507f191e810c19729de860eb",
    "eventType": "entered",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "timestamp": "2024-01-15T08:00:00.000Z",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Validation error
- `404` - Job not found

---

### 2. Get Geofence Events

**Endpoint:** `GET /api/geofence-events`

**Description:** Get all geofence events for the authenticated user with optional filters.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)
- `jobId` (optional) - Filter by job ID
- `eventType` (optional) - Filter by event type: "entered" | "exited"
- `startDate` (optional) - Start date (ISO 8601 format)
- `endDate` (optional) - End date (ISO 8601 format)
- `targetUserId` (optional) - Filter by user ID (admin only)

**Example Request:**
```
GET /api/geofence-events?jobId=507f191e810c19729de860eb&eventType=entered&startDate=2024-01-15T00:00:00Z
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Geofence events retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 95,
    "limit": 20,
    "count": 20
  }
}
```

---

### 3. Get Geofence Events by Job

**Endpoint:** `GET /api/geofence-events/job/:jobId`

**Description:** Get all geofence events for a specific job (job employer or admin only).

**Path Parameters:**
- `jobId` - Job ID (MongoDB ObjectId)

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)

**Example Request:**
```
GET /api/geofence-events/job/507f191e810c19729de860eb?page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Geofence events retrieved successfully",
  "data": [ ... ],
  "pagination": { ... }
}
```

**Errors:**
- `400` - Invalid job ID format
- `400` - Not authorized to view geofence events for this job
- `404` - Job not found

---

### 4. Get Geofence Events by User

**Endpoint:** `GET /api/geofence-events/user/:userId`

**Description:** Get all geofence events for a specific user (user themselves or admin only).

**Path Parameters:**
- `userId` - User ID (MongoDB ObjectId)

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)

**Example Request:**
```
GET /api/geofence-events/user/507f191e810c19729de860ea?page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Geofence events retrieved successfully",
  "data": [ ... ],
  "pagination": { ... }
}
```

**Errors:**
- `400` - Invalid user ID format
- `400` - Not authorized to view geofence events for this user

---

## Error Codes

Common error codes you may encounter:

- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Not authenticated or invalid token
- `FORBIDDEN` - Not authorized to perform this action
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (e.g., active entry already exists)
- `SERVER_ERROR` - Internal server error

---

## Usage Examples

### Complete Workflow Example

1. **Clock In:**
```bash
POST /api/time-entries
{
  "jobId": "507f191e810c19729de860eb",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10.5
  }
}
```

2. **Record GPS Logs (while working):**
```bash
POST /api/gps-logs/batch
{
  "logs": [
    {
      "timeEntryId": "<time_entry_id_from_step_1>",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2024-01-15T08:00:15Z"
    },
    {
      "timeEntryId": "<time_entry_id_from_step_1>",
      "latitude": 40.7130,
      "longitude": -74.0062,
      "timestamp": "2024-01-15T08:01:15Z"
    }
  ]
}
```

3. **Record Geofence Entry:**
```bash
POST /api/geofence-events
{
  "jobId": "507f191e810c19729de860eb",
  "eventType": "entered",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

4. **Clock Out:**
```bash
POST /api/time-entries/<time_entry_id>/clock-out
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10.5
  }
}
```

5. **Record Geofence Exit:**
```bash
POST /api/geofence-events
{
  "jobId": "507f191e810c19729de860eb",
  "eventType": "exited",
  "location": {
    "latitude": 40.7150,
    "longitude": -74.0080
  }
}
```

---

## Notes

1. **Offline Support:** The API supports offline-first architecture. Data can be stored locally and synced when online.

2. **Batch Operations:** Use batch endpoints for efficient data synchronization after periods of offline operation.

3. **Active Time Entries:** Only one active time entry (where `clockOutTime` is null) is allowed per user at a time.

4. **Location Data:** All location coordinates must be valid:
   - Latitude: -90 to 90
   - Longitude: -180 to 180

5. **Time Zones:** All timestamps are in ISO 8601 format (UTC). Convert to local time on the client side.

6. **Pagination:** All list endpoints support pagination. Use `page` and `limit` query parameters.

7. **Admin Access:** Users with the "admin" role have additional access to view other users' data.

---

## Related Documentation

- [MongoDB Collections Documentation](./mongodb-collections.md)
- [MongoDB Setup Guide](./mongodb-setup.md)
- [API Documentation Summary](../API_DOCUMENTATION_SUMMARY.md)
