# Data Models Documentation

## Overview
This document describes all data models (MongoDB schemas) used in the LocalPro Super App.

## Core Models

### User Model
**Collection**: `users`

**Key Fields**:
- `phoneNumber` (String, unique, required)
- `email` (String, unique, sparse)
- `firstName`, `lastName` (String)
- `roles` (Array: client, provider, admin, supplier, instructor, agency_owner, agency_admin)
- `isVerified` (Boolean)
- `profile` (Object: avatar, bio, address, skills, rating, certifications, insurance)
- `trustScore` (Number)
- `wallet` (Object: balance, currency)
- `preferences` (Object: notifications, privacy, language)
- `metadata` (Object: profileViews, lastLogin, deviceInfo)

**Indexes**:
- `phoneNumber` (unique)
- `email` (unique, sparse)
- `roles`
- `isVerified`
- `profile.address.coordinates` (2dsphere)

**Relationships**:
- One-to-one with Provider
- Many-to-many with Agencies
- One-to-many with Bookings
- One-to-many with Orders

---

### Marketplace Model
**Collection**: `marketplaces`

**Key Fields**:
- `title`, `description` (String, required)
- `category`, `subcategory` (String, enum)
- `provider` (ObjectId, ref: User, required)
- `pricing` (Object: type, basePrice, currency)
- `availability` (Object: schedule, timezone)
- `serviceArea` (Array of Strings)
- `images` (Array: url, publicId, thumbnail)
- `serviceType` (Enum: one_time, recurring, emergency, maintenance, installation)
- `status` (Enum: active, inactive, pending, suspended)
- `rating` (Object: average, count)
- `metadata` (Object: views, bookings, earnings)

**Indexes**:
- `provider`
- `category`
- `status`
- `serviceArea`
- `pricing.basePrice`
- `rating.average`
- `provider + status` (compound)

**Relationships**:
- Many-to-one with User (provider)
- One-to-many with Bookings

---

### Booking Model
**Collection**: `bookings`

**Key Fields**:
- `service` (ObjectId, ref: Marketplace, required)
- `provider` (ObjectId, ref: User, required)
- `client` (ObjectId, ref: User, required)
- `scheduledDate` (Date, required)
- `address` (Object: street, city, coordinates)
- `status` (Enum: pending, confirmed, in_progress, completed, cancelled, reviewed)
- `payment` (Object: method, amount, status, transactionId)
- `review` (Object: rating, comment, photos)
- `photos` (Array: before, during, after)
- `notes` (String)
- `metadata` (Object: createdAt, updatedAt, timeline)

**Indexes**:
- `service`
- `provider`
- `client`
- `status`
- `scheduledDate`
- `client + status` (compound)
- `provider + status` (compound)

**Relationships**:
- Many-to-one with Marketplace (service)
- Many-to-one with User (provider)
- Many-to-one with User (client)

---

### Provider Model
**Collection**: `providers`

**Key Fields**:
- `user` (ObjectId, ref: User, unique, required)
- `providerType` (Enum: individual, small_business, enterprise)
- `businessInfo` (Object: businessName, businessType, yearsInBusiness, taxId)
- `professionalInfo` (Object: specialties, certifications, experience, licenses)
- `serviceArea` (Object: cities, radius, coordinates)
- `verification` (Object: status, documents, verifiedAt)
- `onboarding` (Object: step, progress, completed)
- `status` (Enum: pending, active, suspended, inactive)
- `analytics` (Object: totalBookings, totalEarnings, averageRating)

**Indexes**:
- `user` (unique)
- `status`
- `providerType`
- `verification.status`
- `serviceArea.coordinates` (2dsphere)

**Relationships**:
- One-to-one with User
- One-to-many with Services
- Many-to-many with Agencies

---

### Finance Model
**Collection**: `finances`

**Key Fields**:
- `user` (ObjectId, ref: User, required)
- `type` (Enum: earning, withdrawal, top_up, expense, refund, commission)
- `amount` (Number, required)
- `currency` (String, default: PHP)
- `status` (Enum: pending, processing, completed, failed, cancelled)
- `paymentMethod` (String)
- `transactionId` (String)
- `description` (String)
- `metadata` (Object: bookingId, serviceId, relatedTransactionId)
- `processedAt` (Date)
- `wallet` (Object: balanceBefore, balanceAfter)

**Indexes**:
- `user`
- `type`
- `status`
- `createdAt`
- `user + type` (compound)
- `user + status` (compound)

**Relationships**:
- Many-to-one with User
- Optional reference to Booking

---

### Job Model
**Collection**: `jobs`

**Key Fields**:
- `title`, `description` (String, required)
- `category` (String, enum)
- `employer` (ObjectId, ref: User, required)
- `employmentType` (Enum: full-time, part-time, contract, freelance)
- `salary` (Object: min, max, currency)
- `location` (Object: city, address, coordinates)
- `requirements` (Array of Strings)
- `benefits` (Array of Strings)
- `status` (Enum: active, closed, draft)
- `applications` (Array: applicant, status, appliedAt)
- `metadata` (Object: views, applications, hires)

**Indexes**:
- `employer`
- `category`
- `status`
- `location.coordinates` (2dsphere)
- `salary.min`, `salary.max`

**Relationships**:
- Many-to-one with User (employer)
- One-to-many with Applications

---

### Academy Model
**Collection**: `academies`

**Key Fields**:
- `title`, `description` (String, required)
- `instructor` (ObjectId, ref: User, required)
- `category` (String, enum)
- `level` (Enum: beginner, intermediate, advanced)
- `price` (Number)
- `duration` (Number, minutes)
- `syllabus` (Array: modules with lessons)
- `videos` (Array: url, publicId, duration)
- `thumbnail` (Object: url, publicId)
- `enrollments` (Array: student, progress, completedAt)
- `status` (Enum: draft, published, archived)
- `rating` (Object: average, count)

**Indexes**:
- `instructor`
- `category`
- `level`
- `status`
- `price`
- `rating.average`

**Relationships**:
- Many-to-one with User (instructor)
- One-to-many with Enrollments

---

### Agency Model
**Collection**: `agencies`

**Key Fields**:
- `name`, `description` (String, required)
- `owner` (ObjectId, ref: User, required)
- `businessInfo` (Object: industry, businessType, foundedYear, taxId)
- `contactInfo` (Object: email, phone, address)
- `providers` (Array: providerId, role, permissions, status)
- `admins` (Array: adminId, role, permissions)
- `status` (Enum: pending, active, suspended, inactive)
- `analytics` (Object: totalProviders, totalBookings, totalRevenue)

**Indexes**:
- `owner`
- `status`
- `businessInfo.industry`
- `providers.providerId`

**Relationships**:
- Many-to-one with User (owner)
- Many-to-many with Users (providers, admins)

---

### Communication Model
**Collection**: `communications`

**Key Fields**:
- `type` (Enum: direct, group, support)
- `participants` (Array of ObjectIds, ref: User)
- `messages` (Array: sender, content, attachments, readBy, timestamp)
- `lastMessage` (Object: content, sender, timestamp)
- `unreadCount` (Object: per participant)
- `metadata` (Object: createdAt, updatedAt)

**Indexes**:
- `participants`
- `type`
- `lastMessage.timestamp`
- `participants + lastMessage.timestamp` (compound)

**Relationships**:
- Many-to-many with Users (participants)

---

### Supplies Model
**Collection**: `supplies`

**Key Fields**:
- `name`, `description` (String, required)
- `supplier` (ObjectId, ref: User, required)
- `category` (String, enum)
- `price` (Number, required)
- `stock` (Number)
- `unit` (String)
- `images` (Array: url, publicId)
- `specifications` (Object)
- `status` (Enum: active, out_of_stock, discontinued)

**Indexes**:
- `supplier`
- `category`
- `status`
- `price`

**Relationships**:
- Many-to-one with User (supplier)
- One-to-many with Orders

---

### Rentals Model
**Collection**: `rentals`

**Key Fields**:
- `name`, `description` (String, required)
- `provider` (ObjectId, ref: User, required)
- `category` (String, enum)
- `dailyRate` (Number, required)
- `availability` (Object: startDate, endDate, bookedDates)
- `location` (Object: city, address, coordinates)
- `images` (Array: url, publicId)
- `specifications` (Object)
- `status` (Enum: available, rented, maintenance, unavailable)

**Indexes**:
- `provider`
- `category`
- `status`
- `location.coordinates` (2dsphere)
- `dailyRate`

**Relationships**:
- Many-to-one with User (provider)
- One-to-many with Bookings

---

### Trust Verification Model
**Collection**: `trustverifications`

**Key Fields**:
- `user` (ObjectId, ref: User, required)
- `type` (Enum: identity, business, professional)
- `status` (Enum: pending, approved, rejected, needs_more_info)
- `documents` (Array: type, url, publicId, uploadedAt)
- `adminNotes` (String)
- `trustScore` (Number)
- `verifiedAt` (Date)
- `verifiedBy` (ObjectId, ref: User)

**Indexes**:
- `user`
- `type`
- `status`
- `user + type` (compound)

**Relationships**:
- Many-to-one with User
- Optional reference to Admin (verifiedBy)

---

### AppSettings Model
**Collection**: `appsettings`

**Key Fields**:
- `general` (Object: appVersion, environment, maintenanceMode)
- `features` (Object: feature flags)
- `payments` (Object: payment gateways configuration)
- `notifications` (Object: email, SMS settings)
- `analytics` (Object: tracking configuration)
- `version` (Number, for migration tracking)

**Indexes**:
- Single document collection (no indexes needed)

---

### Log Model
**Collection**: `logs`

**Key Fields**:
- `level` (Enum: error, warn, info, debug, http)
- `message` (String, required)
- `timestamp` (Date, default: now)
- `user` (ObjectId, ref: User, optional)
- `requestId` (String)
- `metadata` (Object: endpoint, method, statusCode, duration)
- `error` (Object: stack, code, details)

**Indexes**:
- `level`
- `timestamp`
- `user`
- `requestId`
- `level + timestamp` (compound, TTL)

**Retention**: Configurable (default: 30 days)

---

### AuditLog Model
**Collection**: `auditlogs`

**Key Fields**:
- `action` (String, required)
- `entityType` (String)
- `entityId` (ObjectId)
- `actor` (Object: userId, role, ipAddress)
- `changes` (Object: before, after)
- `timestamp` (Date, default: now)
- `metadata` (Object: requestId, userAgent)

**Indexes**:
- `action`
- `entityType`
- `actor.userId`
- `timestamp`
- `action + timestamp` (compound, TTL)

**Retention**: Configurable (default: 7 years)

---

## Common Patterns

### Timestamps
All models include:
- `createdAt` (Date, default: now)
- `updatedAt` (Date, default: now, updated automatically)

### Soft Deletes
Some models support soft deletes:
- `deletedAt` (Date, optional)
- `isDeleted` (Boolean, default: false)

### Status Fields
Most models have status fields:
- `status` (Enum with model-specific values)
- Common: active, inactive, pending, suspended

### Metadata Fields
Many models include metadata:
- `metadata` (Object: views, counts, analytics)
- Used for tracking and analytics

## Indexing Strategy

### Single Field Indexes
- Unique fields (phoneNumber, email)
- Frequently queried fields (status, category)
- Foreign keys (user, provider, service)

### Compound Indexes
- User + Status (for filtering)
- Category + Status (for filtering)
- Location coordinates (2dsphere for geospatial)

### Text Indexes
- Searchable text fields (title, description)
- Full-text search support

## Data Relationships Summary

```
User
├── Provider (1:1)
├── Agency Owner (1:many)
├── Agency Member (many:many)
├── Bookings (1:many as client/provider)
├── Finance Transactions (1:many)
├── Job Applications (1:many)
├── Course Enrollments (1:many)
└── Orders (1:many)

Marketplace (Service)
├── Provider (many:1)
└── Bookings (1:many)

Booking
├── Service (many:1)
├── Provider (many:1)
└── Client (many:1)

Agency
├── Owner (many:1)
├── Providers (many:many)
└── Admins (many:many)
```

## Related Documentation
- [Architecture](ARCHITECTURE.md)
- [API Response Formats](API_RESPONSE_FORMATS.md)
- Feature-specific data models in `docs/features/`

