# MongoDB Collections Documentation

This document describes the MongoDB collections used in the GPS & Time Tracking application.

## Overview

The application uses three main collections:
1. **time_entries** - Time tracking records (clock in/out, breaks)
2. **gps_logs** - GPS location tracking data
3. **geofence_events** - Geofence entry/exit events

All collections support offline-first architecture with local MongoDB Realm storage that syncs to MongoDB Atlas.

---

## Collection: `time_entries`

Stores time tracking entries for workers including clock in/out times, breaks, and location data.

### Schema

```typescript
{
  _id: ObjectId,                    // MongoDB document ID
  userId: string,                   // Reference to user._id
  clockInTime: Date,                // ISO 8601 timestamp
  clockOutTime: Date | null,        // ISO 8601 timestamp (null if active)
  breakStartTime: Date | null,       // ISO 8601 timestamp
  breakEndTime: Date | null,         // ISO 8601 timestamp
  totalWorkTime: number | null,      // Total work time in seconds
  source: 'mobile' | 'admin',        // Entry source
  jobId: string | null,              // Reference to job._id (optional)
  location: {                        // Clock-in location
    latitude: number,
    longitude: number,
    accuracy: number | null           // GPS accuracy in meters
  } | null,
  manualEdit: {                      // Manual edit request (if applicable)
    requestedBy: string,             // User ID who requested
    approvedBy: string | null,       // Manager/admin who approved
    reason: string | null,            // Reason for edit
    status: 'pending' | 'approved' | 'rejected'
  } | null,
  createdAt: Date,                   // Document creation timestamp
  updatedAt: Date                    // Last update timestamp
}
```

### Indexes

```javascript
// Recommended indexes for performance
db.time_entries.createIndex({ userId: 1, clockInTime: -1 });
db.time_entries.createIndex({ userId: 1, clockOutTime: null }); // For active entries
db.time_entries.createIndex({ jobId: 1 });
db.time_entries.createIndex({ createdAt: -1 });
db.time_entries.createIndex({ "location": "2dsphere" }); // For geospatial queries
```

### Example Documents

#### Active Time Entry (Clocked In)
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "userId": "507f191e810c19729de860ea",
  "clockInTime": ISODate("2024-01-15T08:00:00Z"),
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
  "createdAt": ISODate("2024-01-15T08:00:00Z"),
  "updatedAt": ISODate("2024-01-15T08:00:00Z")
}
```

#### Completed Time Entry
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "userId": "507f191e810c19729de860ea",
  "clockInTime": ISODate("2024-01-15T08:00:00Z"),
  "clockOutTime": ISODate("2024-01-15T17:00:00Z"),
  "breakStartTime": ISODate("2024-01-15T12:00:00Z"),
  "breakEndTime": ISODate("2024-01-15T12:30:00Z"),
  "totalWorkTime": 30600,
  "source": "mobile",
  "jobId": "507f191e810c19729de860eb",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10.5
  },
  "manualEdit": null,
  "createdAt": ISODate("2024-01-15T08:00:00Z"),
  "updatedAt": ISODate("2024-01-15T17:00:00Z")
}
```

#### Time Entry with Manual Edit Request
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "userId": "507f191e810c19729de860ea",
  "clockInTime": ISODate("2024-01-15T08:00:00Z"),
  "clockOutTime": ISODate("2024-01-15T17:00:00Z"),
  "breakStartTime": null,
  "breakEndTime": null,
  "totalWorkTime": 32400,
  "source": "mobile",
  "jobId": "507f191e810c19729de860eb",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10.5
  },
  "manualEdit": {
    "requestedBy": "507f191e810c19729de860ea",
    "approvedBy": null,
    "reason": "Forgot to clock out, actual time was 5:30 PM",
    "status": "pending"
  },
  "createdAt": ISODate("2024-01-15T08:00:00Z"),
  "updatedAt": ISODate("2024-01-15T17:30:00Z")
}
```

### Common Queries

#### Get active time entry for a user
```javascript
db.time_entries.findOne({
  userId: "507f191e810c19729de860ea",
  clockOutTime: null
});
```

#### Get all time entries for a user in date range
```javascript
db.time_entries.find({
  userId: "507f191e810c19729de860ea",
  clockInTime: {
    $gte: ISODate("2024-01-01T00:00:00Z"),
    $lte: ISODate("2024-01-31T23:59:59Z")
  }
}).sort({ clockInTime: -1 });
```

#### Get time entries for a specific job
```javascript
db.time_entries.find({
  jobId: "507f191e810c19729de860eb"
}).sort({ clockInTime: -1 });
```

#### Get pending manual edit requests
```javascript
db.time_entries.find({
  "manualEdit.status": "pending"
});
```

---

## Collection: `gps_logs`

Stores GPS location tracking data captured during active time entries.

### Schema

```typescript
{
  _id: ObjectId,                    // MongoDB document ID
  userId: string,                   // Reference to user._id
  timeEntryId: string | null,       // Reference to time_entries._id
  latitude: number,                 // GPS latitude
  longitude: number,                // GPS longitude
  accuracy: number | null,          // GPS accuracy in meters
  altitude: number | null,          // Altitude in meters
  speed: number | null,              // Speed in km/h
  heading: number | null,            // Heading in degrees (0-360)
  timestamp: Date                    // ISO 8601 timestamp
}
```

### Indexes

```javascript
// Recommended indexes
db.gps_logs.createIndex({ userId: 1, timestamp: -1 });
db.gps_logs.createIndex({ timeEntryId: 1, timestamp: 1 });
db.gps_logs.createIndex({ timestamp: -1 });
db.gps_logs.createIndex({ location: "2dsphere" }); // For geospatial queries
```

### Example Document

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439020"),
  "userId": "507f191e810c19729de860ea",
  "timeEntryId": "507f1f77bcf86cd799439011",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10.5,
  "altitude": 15.2,
  "speed": 0.0,
  "heading": 90.0,
  "timestamp": ISODate("2024-01-15T08:00:15Z")
}
```

### Common Queries

#### Get all GPS logs for a time entry
```javascript
db.gps_logs.find({
  timeEntryId: "507f1f77bcf86cd799439011"
}).sort({ timestamp: 1 });
```

#### Get GPS logs for a user in time range
```javascript
db.gps_logs.find({
  userId: "507f191e810c19729de860ea",
  timestamp: {
    $gte: ISODate("2024-01-15T08:00:00Z"),
    $lte: ISODate("2024-01-15T17:00:00Z")
  }
}).sort({ timestamp: 1 });
```

#### Find GPS logs within a geographic area (geospatial query)
```javascript
db.gps_logs.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [-74.0060, 40.7128]
      },
      $maxDistance: 1000 // 1km radius
    }
  }
});
```

---

## Collection: `geofence_events`

Stores geofence entry and exit events for job sites.

### Schema

```typescript
{
  _id: ObjectId,                    // MongoDB document ID
  userId: string,                   // Reference to user._id
  jobId: string,                    // Reference to job._id
  eventType: 'entered' | 'exited',  // Event type
  location: {                        // Location where event occurred
    latitude: number,
    longitude: number
  },
  timestamp: Date                   // ISO 8601 timestamp
}
```

### Indexes

```javascript
// Recommended indexes
db.geofence_events.createIndex({ userId: 1, timestamp: -1 });
db.geofence_events.createIndex({ jobId: 1, timestamp: -1 });
db.geofence_events.createIndex({ eventType: 1, timestamp: -1 });
db.geofence_events.createIndex({ location: "2dsphere" });
```

### Example Documents

#### Geofence Entry Event
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439030"),
  "userId": "507f191e810c19729de860ea",
  "jobId": "507f191e810c19729de860eb",
  "eventType": "entered",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "timestamp": ISODate("2024-01-15T08:00:00Z")
}
```

#### Geofence Exit Event
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439031"),
  "userId": "507f191e810c19729de860ea",
  "jobId": "507f191e810c19729de860eb",
  "eventType": "exited",
  "location": {
    "latitude": 40.7150,
    "longitude": -74.0080
  },
  "timestamp": ISODate("2024-01-15T17:00:00Z")
}
```

### Common Queries

#### Get all geofence events for a job
```javascript
db.geofence_events.find({
  jobId: "507f191e810c19729de860eb"
}).sort({ timestamp: -1 });
```

#### Get geofence events for a user
```javascript
db.geofence_events.find({
  userId: "507f191e810c19729de860ea"
}).sort({ timestamp: -1 });
```

---

## Collection Relationships

```
users (not in this app, but referenced)
  └── _id
      ├── time_entries.userId
      ├── gps_logs.userId
      └── geofence_events.userId

jobs (not in this app, but referenced)
  └── _id
      ├── time_entries.jobId
      └── geofence_events.jobId

time_entries
  └── _id
      └── gps_logs.timeEntryId
```

---

## Data Validation Rules

### Time Entries
- `clockInTime` is required
- `clockOutTime` must be after `clockInTime` if provided
- `breakStartTime` must be after `clockInTime` if provided
- `breakEndTime` must be after `breakStartTime` if provided
- `totalWorkTime` should be calculated as: `(clockOutTime - clockInTime) - (breakDuration)`
- Only one active entry per user (where `clockOutTime` is null)

### GPS Logs
- `latitude` must be between -90 and 90
- `longitude` must be between -180 and 180
- `timestamp` should be within the time entry's time range if `timeEntryId` is provided

### Geofence Events
- `eventType` must be either 'entered' or 'exited'
- Events should alternate (entered → exited → entered)

---

## API Endpoints (Expected Backend)

### Time Entries
- `POST /api/time-entries` - Create time entry
- `GET /api/time-entries` - List time entries (with filters)
- `GET /api/time-entries/:id` - Get specific time entry
- `PATCH /api/time-entries/:id` - Update time entry
- `GET /api/time-entries/active/:userId` - Get active time entry for user

### GPS Logs
- `POST /api/gps-logs` - Create GPS log
- `POST /api/gps-logs/batch` - Batch create GPS logs
- `GET /api/gps-logs/time-entry/:timeEntryId` - Get GPS logs for time entry

### Geofence Events
- `POST /api/geofence-events` - Create geofence event
- `GET /api/geofence-events` - List geofence events (with filters)

---

## Notes

1. **Offline Support**: All collections support offline-first architecture. Data is stored locally in MongoDB Realm and synced to MongoDB Atlas when online.

2. **Deduplication**: The sync service handles deduplication using the `_id` field. Local entries without `_id` are created, entries with `_id` are updated.

3. **Geospatial Queries**: Use MongoDB's geospatial indexes and queries for location-based operations.

4. **Performance**: Consider implementing data archival for old GPS logs and time entries to maintain performance.

5. **Privacy**: GPS logs may contain sensitive location data. Ensure proper access controls and data retention policies.
