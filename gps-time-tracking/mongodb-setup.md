# MongoDB Setup Guide

This guide explains how to set up MongoDB Atlas and configure it for the GPS & Time Tracking application.

## Prerequisites

- MongoDB Atlas account (free tier available)
- Node.js backend server
- MongoDB Realm SDK (already installed in the app)

---

## Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new cluster (Free tier M0 is sufficient for development)
4. Choose your preferred cloud provider and region
5. Wait for the cluster to be created (5-10 minutes)

---

## Step 2: Configure Database Access

1. Go to **Database Access** in the left sidebar
2. Click **Add New Database User**
3. Create a user with:
   - Username: `gps-tracking-app`
   - Password: (generate a strong password)
   - Database User Privileges: **Read and write to any database**
4. Save the credentials securely

---

## Step 3: Configure Network Access

1. Go to **Network Access** in the left sidebar
2. Click **Add IP Address**
3. For development: Click **Allow Access from Anywhere** (0.0.0.0/0)
4. For production: Add only your server IP addresses
5. Click **Confirm**

---

## Step 4: Get Connection String

1. Go to **Database** in the left sidebar
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string (it looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your database user credentials

---

## Step 5: Create Collections

Connect to your MongoDB cluster using MongoDB Compass or the MongoDB shell and create the collections:

### Using MongoDB Compass

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using your connection string
3. Create a new database: `gps_tracking`
4. Create the following collections:
   - `time_entries`
   - `gps_logs`
   - `geofence_events`

### Using MongoDB Shell

```bash
# Connect to your cluster
mongosh "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/"

# Create database and collections
use gps_tracking

# Collections will be created automatically on first insert
# But you can create them explicitly:
db.createCollection("time_entries")
db.createCollection("gps_logs")
db.createCollection("geofence_events")
```

---

## Step 6: Create Indexes

Run these commands in MongoDB shell or Compass to create indexes for better performance:

```javascript
// Time Entries indexes
db.time_entries.createIndex({ userId: 1, clockInTime: -1 });
db.time_entries.createIndex({ userId: 1, clockOutTime: 1 }, { partialFilterExpression: { clockOutTime: null } });
db.time_entries.createIndex({ jobId: 1 });
db.time_entries.createIndex({ createdAt: -1 });
db.time_entries.createIndex({ "location": "2dsphere" });

// GPS Logs indexes
db.gps_logs.createIndex({ userId: 1, timestamp: -1 });
db.gps_logs.createIndex({ timeEntryId: 1, timestamp: 1 });
db.gps_logs.createIndex({ timestamp: -1 });
db.gps_logs.createIndex({ location: "2dsphere" });

// Geofence Events indexes
db.geofence_events.createIndex({ userId: 1, timestamp: -1 });
db.geofence_events.createIndex({ jobId: 1, timestamp: -1 });
db.geofence_events.createIndex({ eventType: 1, timestamp: -1 });
db.geofence_events.createIndex({ location: "2dsphere" });
```

---

## Step 7: Update Backend Configuration

Update your Node.js backend to use the MongoDB connection string:

```javascript
// config/database.js
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/gps_tracking?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
```

---

## Step 8: Update App Configuration

Update the API base URL in your React Native app:

```typescript
// config/constants.ts
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api' // Your local backend
  : 'https://your-backend-domain.com/api'; // Your production backend
```

---

## Step 9: (Optional) Configure MongoDB Realm Sync

For automatic sync between the mobile app and MongoDB Atlas:

1. Go to [MongoDB Realm](https://realm.mongodb.com/)
2. Create a new Realm app
3. Link it to your MongoDB Atlas cluster
4. Enable Device Sync
5. Configure sync rules
6. Update `database/realm.ts` with your Realm app ID:

```typescript
// database/realm.ts
export async function initRealm(): Promise<Realm> {
  if (realmInstance && !realmInstance.isClosed) {
    return realmInstance;
  }

  realmInstance = await Realm.open({
    schema: RealmSchemas,
    schemaVersion: 1,
    // Add sync configuration if using Realm Sync
    // sync: {
    //   user: await Realm.App.Sync.currentUser,
    //   partitionValue: 'public',
    // },
  });

  return realmInstance;
}
```

---

## Environment Variables

Create a `.env` file in your backend:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/gps_tracking?retryWrites=true&w=majority
JWT_SECRET=your-jwt-secret-key
API_PORT=3000
```

---

## Testing the Connection

Test your MongoDB connection:

```javascript
// test-connection.js
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
  });
```

---

## Security Best Practices

1. **Never commit connection strings** to version control
2. **Use environment variables** for sensitive data
3. **Restrict network access** to only necessary IPs in production
4. **Use strong passwords** for database users
5. **Enable MongoDB Atlas encryption** at rest
6. **Regular backups** - MongoDB Atlas provides automatic backups
7. **Monitor access** - Use MongoDB Atlas monitoring and alerts

---

## Troubleshooting

### Connection Issues

- **Error: Authentication failed**
  - Check username and password
  - Ensure database user has correct privileges

- **Error: IP not whitelisted**
  - Add your IP address to Network Access list
  - For development, temporarily allow 0.0.0.0/0

- **Error: Timeout**
  - Check your internet connection
  - Verify cluster is running (not paused)
  - Check firewall settings

### Performance Issues

- **Slow queries**: Ensure indexes are created
- **High data usage**: Consider archiving old GPS logs
- **Connection limits**: Upgrade cluster tier if needed

---

## Next Steps

1. Set up your Node.js backend API
2. Implement authentication endpoints
3. Create API endpoints for time entries, GPS logs, and geofence events
4. Test the sync functionality
5. Deploy to production

For detailed API endpoint specifications, see `mongodb-collections.md`.
