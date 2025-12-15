# Database Architecture

## Overview

LocalPro Super App uses **MongoDB** as the primary database with **Mongoose** as the ODM (Object Document Mapper). The database is designed for scalability, performance, and flexibility.

## Database Connection

### Connection Configuration

```javascript
// Connection options
{
  maxPoolSize: 10,              // Maximum connections
  minPoolSize: 2,               // Minimum connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  writeConcern: {
    w: 'majority',
    j: true,
    wtimeout: 10000
  },
  readPreference: 'primaryPreferred',
  compressors: ['zlib']
}
```

### Connection String Format

```
mongodb://[username:password@]host[:port][/database][?options]
```

Example:
```
mongodb://localhost:27017/localpro-super-app
mongodb+srv://user:pass@cluster.mongodb.net/localpro?retryWrites=true&w=majority
```

## Database Collections

### Core Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **users** | User accounts and profiles | phoneNumber, email, roles, profile |
| **services** | Marketplace service listings | title, category, provider, pricing |
| **bookings** | Service bookings | service, client, provider, status |
| **supplies** | E-commerce products | name, price, supplier, inventory |
| **courses** | Academy courses | title, instructor, price, curriculum |
| **rentals** | Rental items | name, type, pricing, availability |
| **jobs** | Job postings | title, company, location, requirements |
| **agencies** | Agency organizations | name, owner, members, status |
| **ads** | Advertising listings | title, category, advertiser, status |
| **announcements** | Platform announcements | title, content, targetAudience |
| **activities** | User activity feed | user, type, content, timestamp |

### Financial Collections

| Collection | Purpose |
|------------|---------|
| **userwallets** | User wallet balances and transactions |
| **transactions** | Financial transaction history |
| **withdrawals** | Withdrawal requests |
| **topups** | Wallet top-up requests |
| **escrows** | Escrow transactions |

### System Collections

| Collection | Purpose |
|------------|---------|
| **appsettings** | Application configuration |
| **usersettings** | User preferences |
| **notifications** | User notifications |
| **auditlogs** | Audit trail |
| **logs** | System logs |

## Data Modeling Patterns

### 1. Embedded Documents

For closely related data that's always accessed together:

```javascript
// User with embedded profile
{
  _id: ObjectId,
  phoneNumber: String,
  profile: {
    firstName: String,
    lastName: String,
    avatar: {
      url: String,
      publicId: String
    },
    address: {
      street: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  }
}
```

### 2. References

For related data that may be large or accessed independently:

```javascript
// Booking with service reference
{
  _id: ObjectId,
  service: ObjectId,  // Reference to Service
  client: ObjectId,   // Reference to User
  provider: ObjectId, // Reference to User
  status: String
}
```

### 3. Hybrid Approach

Combine embedded and referenced data:

```javascript
// Service with embedded pricing, referenced provider
{
  _id: ObjectId,
  title: String,
  pricing: {          // Embedded
    basePrice: Number,
    hourlyRate: Number
  },
  provider: ObjectId, // Reference
  category: ObjectId  // Reference
}
```

## Indexing Strategy

### Primary Indexes

Every collection has an `_id` index (automatic).

### Common Indexes

```javascript
// Users
users.createIndex({ phoneNumber: 1 }, { unique: true });
users.createIndex({ email: 1 }, { unique: true, sparse: true });
users.createIndex({ 'profile.coordinates': '2dsphere' }); // Geospatial

// Services
services.createIndex({ provider: 1 });
services.createIndex({ category: 1 });
services.createIndex({ status: 1 });
services.createIndex({ location: '2dsphere' });
services.createIndex({ title: 'text', description: 'text' }); // Text search

// Bookings
bookings.createIndex({ client: 1, status: 1 });
bookings.createIndex({ provider: 1, status: 1 });
bookings.createIndex({ createdAt: -1 });

// Compound Indexes
bookings.createIndex({ client: 1, status: 1, createdAt: -1 });
services.createIndex({ provider: 1, status: 1, category: 1 });
```

### Geospatial Indexes

For location-based queries:

```javascript
// 2dsphere index for geospatial queries
services.createIndex({ location: '2dsphere' });

// Query nearby services
services.find({
  location: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      $maxDistance: 10000 // 10km
    }
  }
});
```

## Relationships

### One-to-One

```javascript
// User → UserWallet
User {
  wallet: ObjectId  // Reference
}
UserWallet {
  user: ObjectId    // Reference
}
```

### One-to-Many

```javascript
// User → Services
User {
  _id: ObjectId
}
Service {
  provider: ObjectId  // Reference to User
}
```

### Many-to-Many

```javascript
// Users ↔ Agencies
User {
  agency: ObjectId
}
Agency {
  members: [ObjectId]  // Array of User references
}
```

## Data Validation

### Schema-Level Validation

```javascript
const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['cleaning', 'plumbing', 'electrical'],
    required: true
  }
});
```

### Application-Level Validation

Using Joi for request validation:

```javascript
const serviceValidation = {
  title: Joi.string().required().max(200),
  price: Joi.number().required().min(0),
  category: Joi.string().valid('cleaning', 'plumbing', 'electrical')
};
```

## Transactions

For operations requiring atomicity:

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Multiple operations
  await User.updateOne({ _id: userId }, { $inc: { balance: -100 } }, { session });
  await Transaction.create([{ userId, amount: -100 }], { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## Aggregation Pipeline

For complex queries and analytics:

```javascript
// Example: Get service statistics by category
Service.aggregate([
  { $match: { status: 'active' } },
  { $group: {
      _id: '$category',
      count: { $sum: 1 },
      avgPrice: { $avg: '$pricing.basePrice' }
    }
  },
  { $sort: { count: -1 } }
]);
```

## Data Migration

### Schema Changes

1. **Add new field**: Add to schema with default value
2. **Remove field**: Use `$unset` in migration script
3. **Rename field**: Use `$rename` in migration script
4. **Change type**: Use aggregation pipeline to transform

### Migration Script Example

```javascript
// scripts/migrate-user-roles.js
const migrateUserRoles = async () => {
  const users = await User.find({ roles: { $exists: false } });
  
  for (const user of users) {
    await User.updateOne(
      { _id: user._id },
      { $set: { roles: ['client'] } }
    );
  }
};
```

## Backup & Recovery

### Backup Strategy

1. **Automated Backups**: Daily MongoDB backups
2. **Point-in-Time Recovery**: Oplog-based recovery
3. **Export Scripts**: JSON export for manual backups

### Backup Script

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/localpro-super-app" \
  --out=/backups/$(date +%Y%m%d)
```

## Performance Optimization

### Query Optimization

1. **Use Indexes**: Ensure queries use indexes
2. **Limit Results**: Always use pagination
3. **Project Fields**: Select only needed fields
4. **Avoid N+1 Queries**: Use populate() efficiently

### Example Optimized Query

```javascript
// Good: Uses index, limits results, projects fields
Service.find({ provider: userId, status: 'active' })
  .select('title price category')
  .limit(20)
  .sort({ createdAt: -1 });

// Bad: Full collection scan, returns all fields
Service.find({});
```

## Monitoring

### Slow Query Detection

Middleware automatically logs slow queries:

```javascript
// Queries taking > 1000ms are logged
{
  query: 'services.find({ provider: ... })',
  duration: 1250,
  timestamp: '2025-12-16T10:30:00Z'
}
```

### Database Metrics

- Connection pool usage
- Query execution times
- Index usage statistics
- Collection sizes

## Best Practices

1. **Always use indexes** for frequently queried fields
2. **Use transactions** for related operations
3. **Validate data** at schema and application level
4. **Use projections** to limit returned data
5. **Implement pagination** for list queries
6. **Monitor slow queries** and optimize
7. **Backup regularly** and test recovery
8. **Use connection pooling** for performance

## Next Steps

- Read [Authentication Architecture](./authentication.md)
- Read [Security Architecture](./security.md)
- Review [Database Schemas Reference](../reference/database-schemas.md)

