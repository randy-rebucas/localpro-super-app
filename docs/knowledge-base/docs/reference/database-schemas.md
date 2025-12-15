# Database Schemas Reference

## Overview

This document provides reference for all database schemas in the LocalPro Super App.

## Core Schemas

### User

```javascript
{
  _id: ObjectId,
  phoneNumber: String (unique, required),
  email: String (unique, sparse),
  firstName: String,
  lastName: String,
  roles: [String], // client, provider, admin, etc.
  isVerified: Boolean,
  profile: {
    avatar: { url, publicId, thumbnail },
    bio: String,
    address: { street, city, coordinates: { lat, lng } }
  },
  wallet: ObjectId (ref: UserWallet),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Service

```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  category: String,
  provider: ObjectId (ref: User),
  pricing: {
    basePrice: Number,
    hourlyRate: Number,
    currency: String
  },
  location: {
    address: String,
    coordinates: { lat: Number, lng: Number }
  },
  images: [{ url, publicId, thumbnail }],
  rating: { average: Number, count: Number },
  status: String, // active, inactive, pending
  createdAt: Date,
  updatedAt: Date
}
```

### Booking

```javascript
{
  _id: ObjectId,
  service: ObjectId (ref: Service),
  client: ObjectId (ref: User),
  provider: ObjectId (ref: User),
  status: String, // pending, confirmed, in_progress, completed, cancelled
  scheduledDate: Date,
  scheduledTime: String,
  address: { street, city, coordinates },
  payment: {
    method: String,
    amount: Number,
    status: String
  },
  review: ObjectId (ref: Review),
  createdAt: Date,
  updatedAt: Date
}
```

## Financial Schemas

### UserWallet

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  balance: Number,
  currency: String,
  transactions: [ObjectId] (ref: Transaction),
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  type: String, // credit, debit
  amount: Number,
  currency: String,
  description: String,
  reference: String,
  status: String,
  createdAt: Date
}
```

## Academy Schemas

### Course

```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  category: String,
  instructor: ObjectId (ref: User),
  curriculum: {
    modules: [{
      title: String,
      lessons: [{
        title: String,
        type: String, // video, text, quiz
        content: String
      }]
    }]
  },
  pricing: {
    regularPrice: Number,
    discountedPrice: Number,
    currency: String
  },
  enrollment: {
    current: Number,
    maxCapacity: Number
  },
  rating: { average: Number, count: Number },
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

### User Indexes

```javascript
users.createIndex({ phoneNumber: 1 }, { unique: true });
users.createIndex({ email: 1 }, { unique: true, sparse: true });
users.createIndex({ 'profile.coordinates': '2dsphere' });
```

### Service Indexes

```javascript
services.createIndex({ provider: 1 });
services.createIndex({ category: 1 });
services.createIndex({ location: '2dsphere' });
services.createIndex({ title: 'text', description: 'text' });
```

### Booking Indexes

```javascript
bookings.createIndex({ client: 1, status: 1 });
bookings.createIndex({ provider: 1, status: 1 });
bookings.createIndex({ createdAt: -1 });
```

## Relationships

### One-to-One

- User → UserWallet
- User → UserSettings

### One-to-Many

- User → Services
- User → Bookings (as client)
- User → Bookings (as provider)

### Many-to-Many

- Users ↔ Agencies
- Courses ↔ Enrollments

## Schema Validation

All schemas include:
- Required fields
- Type validation
- Enum validation
- Custom validators

## Related Documentation

- [Database Architecture](../architecture/database.md)
- [Models Directory](../../../src/models/)

