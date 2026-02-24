# LocalPro Super App - Database Schema (ERD)

## Overview

LocalPro uses MongoDB with Mongoose ODM. The database consists of **72 collections** organized into logical domains. This document provides entity-relationship diagrams, field definitions, and index specifications.

---

## Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [User Domain](#user-domain)
3. [Provider Domain](#provider-domain)
4. [Job Domain](#job-domain)
5. [Marketplace Domain](#marketplace-domain)
6. [Financial Domain](#financial-domain)
7. [Agency Domain](#agency-domain)
8. [Communication Domain](#communication-domain)
9. [Content Domain](#content-domain)
10. [Academy Domain](#academy-domain)
11. [Supplies Domain](#supplies-domain)
12. [Rentals Domain](#rentals-domain)
13. [System Domain](#system-domain)
14. [Indexes Reference](#indexes-reference)

---

## Entity Relationship Diagram

### High-Level Domain Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER DOMAIN (Central Hub)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌──────────┐     1:1      ┌─────────────┐                                │
│    │   User   │─────────────►│  UserWallet │                                │
│    └────┬─────┘              └─────────────┘                                │
│         │                                                                    │
│         ├── 1:1 ──► UserTrust                                               │
│         ├── 1:1 ──► UserReferral                                            │
│         ├── 1:1 ──► UserActivity                                            │
│         ├── 1:1 ──► UserManagement                                          │
│         ├── 1:1 ──► UserAgency                                              │
│         ├── 1:1 ──► UserSettings                                            │
│         ├── 1:N ──► Address                                                 │
│         └── 1:N ──► FCMToken (embedded)                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   PROVIDER    │          │   EMPLOYER    │          │    CLIENT     │
│   DOMAIN      │          │   (Job)       │          │   DOMAIN      │
└───────┬───────┘          └───────┬───────┘          └───────┬───────┘
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   Provider    │          │     Job       │          │   Booking     │
│   + 7 refs    │          │ + Applications│          │   Service     │
└───────────────┘          └───────────────┘          └───────────────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   ▼
                          ┌───────────────┐
                          │   FINANCIAL   │
                          │   DOMAIN      │
                          ├───────────────┤
                          │ Escrow        │
                          │ Payout        │
                          │ WalletTxn     │
                          │ Invoice       │
                          └───────────────┘
```

### Provider Domain Detail

```
┌─────────────────────────────────────────────────────────────────┐
│                      PROVIDER ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌──────────────┐                             │
│                    │   Provider   │                             │
│                    │   (Main)     │                             │
│                    └──────┬───────┘                             │
│                           │                                      │
│     ┌─────────────────────┼─────────────────────┐               │
│     │         │           │           │         │               │
│     ▼         ▼           ▼           ▼         ▼               │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│ │Verifi- │ │Business│ │Profess-│ │Finance │ │Perform-│         │
│ │cation  │ │Info    │ │ional   │ │Info    │ │ance    │         │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘         │
│                           │                                      │
│                           ▼                                      │
│                    ┌──────────────┐                             │
│                    │   Provider   │                             │
│                    │   Skill      │                             │
│                    └──────────────┘                             │
│                           │                                      │
│                    ┌──────────────┐                             │
│                    │  Provider    │                             │
│                    │  Preferences │                             │
│                    └──────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Financial Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      FINANCIAL ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Client                    Provider                    Admin   │
│     │                          │                          │     │
│     ▼                          │                          │     │
│ ┌────────┐                     │                          │     │
│ │Payment │                     │                          │     │
│ │Gateway │                     │                          │     │
│ └───┬────┘                     │                          │     │
│     │                          │                          │     │
│     ▼                          │                          │     │
│ ┌────────┐    Work Done    ┌───┴────┐                    │     │
│ │ Escrow │────────────────►│ Escrow │                    │     │
│ │(HELD)  │                 │(COMPLETE)                   │     │
│ └───┬────┘                 └───┬────┘                    │     │
│     │                          │                          │     │
│     │ Dispute                  │ Release                  │     │
│     ▼                          ▼                          │     │
│ ┌────────┐              ┌──────────┐              ┌──────┴───┐ │
│ │Dispute │──────────────│  Payout  │◄─────────────│ Resolve  │ │
│ │Review  │              └────┬─────┘              └──────────┘ │
│ └────────┘                   │                                  │
│                              ▼                                  │
│                    ┌──────────────┐                             │
│                    │Provider      │                             │
│                    │Wallet        │                             │
│                    └──────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Domain

### User

The central entity for all authenticated users in the system.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `phoneNumber` | String | Yes | Unique, primary identifier |
| `email` | String | No | Unique, lowercase, trimmed |
| `password` | String | Yes | Bcrypt hashed |
| `mpin` | String | No | 4-digit PIN, hashed |
| `firstName` | String | Yes | User's first name |
| `lastName` | String | Yes | User's last name |
| `roles` | [String] | Yes | Array of roles (see enum below) |
| `isActive` | Boolean | Yes | Account active status (default: true) |
| `isVerified` | Boolean | Yes | Account verification status |
| `profile.avatar` | Object | No | Cloudinary image {url, publicId} |
| `profile.bio` | String | No | User biography |
| `profile.dateOfBirth` | Date | No | Birth date |
| `profile.gender` | String | No | Enum: male, female, other, prefer_not_to_say |
| `fcmTokens` | [Object] | No | Firebase Cloud Messaging tokens |
| `wallet` | ObjectId | No | Reference to UserWallet |
| `trust` | ObjectId | No | Reference to UserTrust |
| `referral` | ObjectId | No | Reference to UserReferral |
| `activity` | ObjectId | No | Reference to UserActivity |
| `management` | ObjectId | No | Reference to UserManagement |
| `agency` | ObjectId | No | Reference to UserAgency |
| `settings` | ObjectId | No | Reference to UserSettings |
| `lastLogin` | Date | No | Last login timestamp |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

**Roles Enum:**
```
client, provider, admin, supplier, instructor, agency_owner, agency_admin, partner, staff
```

**Indexes:**
- `{ phoneNumber: 1 }` - Unique
- `{ email: 1 }` - Unique, sparse
- `{ roles: 1 }`
- `{ isActive: 1 }`
- `{ createdAt: -1 }`

**Methods:**
- `hasRole(role)` - Check if user has specific role
- `addRole(role)` - Add role to user
- `removeRole(role)` - Remove role from user
- `setMpin(mpin)` - Set hashed MPIN
- `verifyMpin(mpin)` - Verify MPIN
- `ensureWallet()` - Get or create wallet
- `ensureTrust()` - Get or create trust record

---

### UserWallet

Manages user's financial balance and transactions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `balance` | Number | Yes | Current balance (default: 0) |
| `currency` | String | Yes | Default: 'USD' |
| `pendingBalance` | Number | No | Funds on hold |
| `totalEarnings` | Number | No | Lifetime earnings |
| `totalWithdrawals` | Number | No | Lifetime withdrawals |
| `lastTransaction` | Date | No | Last transaction timestamp |
| `isLocked` | Boolean | No | Wallet lock status |
| `lockReason` | String | No | Reason for lock |

**Indexes:**
- `{ user: 1 }` - Unique

---

### UserTrust

Trust score and verification status tracking.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `trustScore` | Number | Yes | Score 0-100 (default: 50) |
| `verificationLevel` | String | Yes | Enum: none, basic, verified, premium |
| `emailVerified` | Boolean | No | Email verification status |
| `phoneVerified` | Boolean | No | Phone verification status |
| `identityVerified` | Boolean | No | ID verification status |
| `addressVerified` | Boolean | No | Address verification status |
| `documents` | [Object] | No | Uploaded verification documents |
| `badges` | [Object] | No | Earned trust badges |
| `reviews` | Object | No | Review statistics |
| `lastUpdated` | Date | Auto | Last update timestamp |

**Indexes:**
- `{ user: 1 }` - Unique
- `{ trustScore: -1 }`
- `{ verificationLevel: 1 }`

---

### UserReferral

Referral program tracking.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `referralCode` | String | Yes | Unique referral code |
| `referredBy` | ObjectId | No | User who referred this user |
| `referrals` | [Object] | No | Users referred by this user |
| `totalReferrals` | Number | No | Count of referrals |
| `totalEarnings` | Number | No | Earnings from referrals |
| `tier` | String | No | Referral tier level |

**Indexes:**
- `{ user: 1 }` - Unique
- `{ referralCode: 1 }` - Unique
- `{ referredBy: 1 }`

---

### UserActivity

Activity and engagement tracking.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `lastActive` | Date | No | Last activity timestamp |
| `loginHistory` | [Object] | No | Login records with IP, device |
| `activityLog` | [Object] | No | User actions log |
| `sessionCount` | Number | No | Total sessions |
| `totalTimeSpent` | Number | No | Time in minutes |

**Indexes:**
- `{ user: 1 }` - Unique
- `{ lastActive: -1 }`

---

### UserManagement

Administrative management data.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `notes` | [Object] | No | Admin notes |
| `flags` | [Object] | No | Account flags |
| `restrictions` | [Object] | No | Account restrictions |
| `verificationStatus` | String | No | Admin verification status |
| `reviewedBy` | ObjectId | No | Admin who reviewed |
| `reviewedAt` | Date | No | Review timestamp |

**Indexes:**
- `{ user: 1 }` - Unique

---

### UserAgency

Agency membership tracking.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `ownedAgencies` | [ObjectId] | No | Agencies user owns |
| `adminOf` | [Object] | No | Agencies user is admin of |
| `memberOf` | [Object] | No | Agencies user is member of |
| `invitations` | [Object] | No | Pending invitations |

**Indexes:**
- `{ user: 1 }` - Unique
- `{ ownedAgencies: 1 }`

---

### UserSettings

User preferences and settings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `notifications` | Object | No | Notification preferences |
| `privacy` | Object | No | Privacy settings |
| `language` | String | No | Preferred language |
| `timezone` | String | No | User timezone |
| `currency` | String | No | Preferred currency |
| `theme` | String | No | UI theme preference |

**Indexes:**
- `{ user: 1 }` - Unique

---

### Address

User addresses for service delivery.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `label` | String | No | Address label (Home, Work, etc.) |
| `street` | String | Yes | Street address |
| `city` | String | Yes | City |
| `state` | String | Yes | State/Province |
| `zipCode` | String | Yes | ZIP/Postal code |
| `country` | String | Yes | Country |
| `coordinates` | Object | No | { lat, lng } |
| `isDefault` | Boolean | No | Default address flag |

**Indexes:**
- `{ user: 1 }`
- `{ user: 1, isDefault: 1 }`

---

## Provider Domain

### Provider

Main provider profile entity.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `userId` | ObjectId | Yes | Reference to User (unique) |
| `status` | String | Yes | Enum: pending, active, suspended, inactive, rejected |
| `providerType` | String | Yes | Enum: individual, business, agency |
| `businessInfo` | ObjectId | No | Reference to ProviderBusinessInfo |
| `professionalInfo` | ObjectId | No | Reference to ProviderProfessionalInfo |
| `verification` | ObjectId | No | Reference to ProviderVerification |
| `financialInfo` | ObjectId | No | Reference to ProviderFinancialInfo |
| `performance` | ObjectId | No | Reference to ProviderPerformance |
| `preferences` | ObjectId | No | Reference to ProviderPreferences |
| `onboarding.completed` | Boolean | No | Onboarding completion status |
| `onboarding.steps` | [Object] | No | Onboarding step tracking |
| `onboarding.currentStep` | String | No | Current onboarding step |
| `onboarding.progress` | Number | No | Progress percentage |
| `settings` | Object | No | Provider-specific settings |
| `metadata` | Object | No | Analytics and flags |
| `deleted` | Boolean | No | Soft delete flag |
| `deletedOn` | Date | No | Deletion timestamp |

**Indexes:**
- `{ userId: 1 }` - Unique
- `{ status: 1 }`
- `{ providerType: 1 }`
- `{ 'metadata.featured': 1 }`
- `{ 'metadata.promoted': 1 }`
- `{ deleted: 1 }`

**Methods:**
- `ensureVerification()` - Get or create verification record
- `ensurePerformance()` - Get or create performance record
- `ensureBusinessInfo()` - Get or create business info
- `ensureProfessionalInfo()` - Get or create professional info
- `ensureFinancialInfo()` - Get or create financial info
- `ensurePreferences()` - Get or create preferences
- `updateRating(newRating)` - Update provider rating
- `addJob(status)` - Track job completion
- `isVerified()` - Check verification status
- `canAcceptJobs()` - Check if can accept new jobs

**Statics:**
- `findByLocation(city, state)` - Find providers by location
- `findTopRated(limit)` - Get top-rated providers
- `findFeatured()` - Get featured providers

---

### ProviderVerification

Provider verification and documentation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `provider` | ObjectId | Yes | Reference to Provider |
| `identityVerified` | Boolean | No | ID verification status |
| `businessVerified` | Boolean | No | Business verification status |
| `backgroundCheckStatus` | String | No | Enum: pending, passed, failed, not_required |
| `backgroundCheckDate` | Date | No | Background check date |
| `documents` | [Object] | No | Uploaded documents |
| `verificationHistory` | [Object] | No | Verification audit trail |

**Indexes:**
- `{ provider: 1 }` - Unique
- `{ identityVerified: 1 }`
- `{ backgroundCheckStatus: 1 }`

---

### ProviderBusinessInfo

Business details for business/agency providers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `provider` | ObjectId | Yes | Reference to Provider |
| `businessName` | String | Conditional | Required for business/agency |
| `businessType` | String | No | Enum: sole_proprietorship, llc, corporation, partnership |
| `registrationNumber` | String | No | Business registration number |
| `taxId` | String | No | Tax identification number |
| `yearEstablished` | Number | No | Year business started |
| `employeeCount` | Number | No | Number of employees |
| `website` | String | No | Business website |
| `socialMedia` | Object | No | Social media links |

**Indexes:**
- `{ provider: 1 }` - Unique
- `{ businessName: 1 }`

---

### ProviderProfessionalInfo

Professional qualifications and service areas.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `provider` | ObjectId | Yes | Reference to Provider |
| `specialties` | [Object] | No | Service categories and skills |
| `serviceAreas` | [Object] | No | Geographic service areas |
| `experience` | Object | No | Years of experience, certifications |
| `education` | [Object] | No | Educational background |
| `languages` | [String] | No | Languages spoken |
| `portfolio` | [Object] | No | Work samples |

**Indexes:**
- `{ provider: 1 }` - Unique
- `{ 'specialties.category': 1 }`
- `{ 'serviceAreas.city': 1, 'serviceAreas.state': 1 }`

---

### ProviderFinancialInfo

Financial and payout information.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `provider` | ObjectId | Yes | Reference to Provider |
| `commissionRate` | Number | No | Platform commission percentage |
| `payoutMethod` | String | No | Preferred payout method |
| `bankAccount` | Object | No | Bank account details (encrypted) |
| `paypalEmail` | String | No | PayPal email |
| `billingAddress` | Object | No | Billing address |
| `taxInfo` | Object | No | Tax information |

**Indexes:**
- `{ provider: 1 }` - Unique

---

### ProviderPerformance

Performance metrics and statistics.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `provider` | ObjectId | Yes | Reference to Provider |
| `rating` | Number | No | Average rating (0-5) |
| `totalReviews` | Number | No | Total review count |
| `totalJobs` | Number | No | Total jobs taken |
| `completedJobs` | Number | No | Successfully completed jobs |
| `cancelledJobs` | Number | No | Cancelled jobs |
| `completionRate` | Number | No | Completion percentage |
| `responseTime` | Number | No | Average response time (minutes) |
| `totalEarnings` | Number | No | Lifetime earnings |
| `monthlyStats` | [Object] | No | Monthly performance data |
| `badges` | [Object] | No | Achievement badges |

**Indexes:**
- `{ provider: 1 }` - Unique
- `{ rating: -1 }`
- `{ completionRate: -1 }`

**Methods:**
- `updateRating(newRating)` - Recalculate average rating
- `addJob(status)` - Record new job
- `updateEarnings(amount)` - Update earnings

---

### ProviderPreferences

Provider notification and availability preferences.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `provider` | ObjectId | Yes | Reference to Provider |
| `notificationSettings` | Object | No | Notification preferences |
| `availability` | Object | No | Working hours, days off |
| `bookingPreferences` | Object | No | Booking rules |
| `autoAccept` | Boolean | No | Auto-accept bookings |
| `maxActiveJobs` | Number | No | Maximum concurrent jobs |

**Indexes:**
- `{ provider: 1 }` - Unique

---

### ProviderSkill

Skills catalog for providers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `name` | String | Yes | Skill name |
| `description` | String | No | Skill description |
| `category` | String | Yes | Skill category |
| `metadata` | Object | No | Additional metadata |
| `isActive` | Boolean | No | Active status |

**Indexes:**
- `{ name: 1 }` - Unique
- `{ category: 1 }`
- `{ isActive: 1 }`

---

## Job Domain

### Job

Job posting entity.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `title` | String | Yes | Job title (max 100 chars) |
| `description` | String | Yes | Job description (max 2000 chars) |
| `company` | Object | Yes | Company details (nested) |
| `employer` | ObjectId | Yes | Reference to User |
| `category` | ObjectId | Yes | Reference to JobCategory |
| `subcategory` | String | No | Subcategory name |
| `jobType` | String | Yes | Enum: full_time, part_time, contract, freelance, internship, temporary |
| `experienceLevel` | String | Yes | Enum: entry, junior, mid, senior, lead, executive |
| `salary` | Object | No | Salary range and currency |
| `benefits` | [String] | No | Benefits offered |
| `requirements` | Object | No | Skills, education, experience |
| `responsibilities` | [String] | No | Job responsibilities |
| `qualifications` | [String] | No | Required qualifications |
| `applicationProcess` | Object | No | Application details and deadline |
| `status` | String | Yes | Enum: draft, active, paused, closed, filled |
| `visibility` | String | No | Enum: public, private, featured |
| `applications` | [Object] | No | Job applications (embedded) |
| `views` | Object | No | View statistics |
| `analytics` | Object | No | Application analytics |
| `tags` | [String] | No | Search tags |
| `isActive` | Boolean | Yes | Active status |
| `featured` | Object | No | Featured promotion details |
| `promoted` | Object | No | Paid promotion details |

**Application Subdocument:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `applicant` | ObjectId | Yes | Reference to User |
| `appliedAt` | Date | Auto | Application timestamp |
| `status` | String | Yes | Enum: pending, reviewing, shortlisted, interviewed, rejected, hired |
| `coverLetter` | String | No | Cover letter text |
| `resume` | Object | No | Resume file details |
| `expectedSalary` | Number | No | Expected salary |
| `interviewSchedule` | [Object] | No | Interview appointments |
| `feedback` | Object | No | Recruiter feedback |

**Indexes:**
- `{ status: 1, isActive: 1 }`
- `{ category: 1, subcategory: 1 }`
- `{ employer: 1, status: 1 }`
- `{ 'company.location.city': 1, 'company.location.state': 1 }`
- `{ jobType: 1, experienceLevel: 1 }`
- `{ 'salary.min': 1, 'salary.max': 1 }`
- `{ 'applications.applicant': 1, 'applications.status': 1 }`
- `{ 'featured.isFeatured': 1 }`
- `{ createdAt: -1 }`
- Text index: `{ title: 'text', description: 'text', 'company.name': 'text', 'requirements.skills': 'text', tags: 'text' }`

**Methods:**
- `addApplication(data)` - Add new application
- `removeApplication(applicationId, userId)` - Withdraw application
- `updateApplicationStatus(applicationId, status)` - Update application
- `incrementViews(isUnique)` - Track views
- `isJobActive()` - Check if accepting applications
- `getSalaryDisplay()` - Format salary string

**Statics:**
- `searchJobs(query, filters)` - Search jobs with filters

---

### JobCategory

Job categories for classification.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `name` | String | Yes | Category name |
| `slug` | String | Yes | URL-friendly slug |
| `description` | String | No | Category description |
| `icon` | String | No | Icon identifier |
| `subcategories` | [Object] | No | Subcategory list |
| `isActive` | Boolean | No | Active status |
| `order` | Number | No | Display order |

**Indexes:**
- `{ slug: 1 }` - Unique
- `{ isActive: 1, order: 1 }`

---

## Marketplace Domain

### Service

Service listings for the marketplace.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `title` | String | Yes | Service title |
| `description` | String | Yes | Service description |
| `category` | String | Yes | Service category (enum) |
| `subcategory` | String | Yes | Subcategory |
| `provider` | ObjectId | Yes | Reference to User |
| `pricing` | Object | Yes | Pricing details |
| `pricing.type` | String | Yes | Enum: hourly, fixed, per_sqft, per_item |
| `pricing.basePrice` | Number | Yes | Base price amount |
| `pricing.currency` | String | No | Currency (default: USD) |
| `availability` | Object | No | Schedule and timezone |
| `serviceArea` | Object | Yes | Geographic coverage |
| `serviceArea.coordinates` | Object | Yes | GeoJSON Point |
| `serviceArea.radius` | Number | Yes | Service radius (km) |
| `images` | [Object] | No | Service images |
| `features` | [String] | No | Service features |
| `requirements` | [String] | No | Service requirements |
| `serviceType` | String | No | Enum: one_time, recurring, emergency, maintenance, installation |
| `estimatedDuration` | Object | No | Min/max duration |
| `teamSize` | Number | No | Team size needed |
| `equipmentProvided` | Boolean | No | Equipment included |
| `materialsIncluded` | Boolean | No | Materials included |
| `warranty` | Object | No | Warranty details |
| `insurance` | Object | No | Insurance coverage |
| `emergencyService` | Object | No | Emergency service options |
| `servicePackages` | [Object] | No | Service packages |
| `addOns` | [Object] | No | Additional services |
| `isActive` | Boolean | Yes | Active status |
| `rating` | Object | No | Average rating and count |

**Category Enum:**
```
cleaning, plumbing, electrical, moving, landscaping, painting, carpentry,
flooring, roofing, hvac, appliance_repair, locksmith, handyman, home_security,
pool_maintenance, pest_control, carpet_cleaning, window_cleaning,
gutter_cleaning, power_washing, snow_removal, other
```

**Indexes:**
- `{ category: 1, subcategory: 1 }`
- `{ provider: 1, isActive: 1 }`
- `{ 'serviceArea.coordinates': '2dsphere' }` - Geospatial
- `{ 'rating.average': -1, 'rating.count': -1 }`
- Text index: `{ title: 'text', description: 'text', features: 'text', requirements: 'text' }`

---

### Booking

Service booking transactions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `service` | ObjectId | Yes | Reference to Service |
| `client` | ObjectId | Yes | Reference to User |
| `provider` | ObjectId | Yes | Reference to User |
| `bookingDate` | Date | Yes | Scheduled date |
| `duration` | Number | Yes | Duration in hours |
| `address` | Object | Yes | Service location |
| `specialInstructions` | String | No | Client instructions |
| `status` | String | Yes | Enum: pending, confirmed, in_progress, completed, cancelled |
| `pricing` | Object | Yes | Pricing breakdown |
| `payment` | Object | Yes | Payment details |
| `payment.status` | String | Yes | Enum: pending, paid, refunded, failed |
| `payment.method` | String | No | Payment method used |
| `payment.transactionId` | String | No | Gateway transaction ID |
| `review` | Object | No | Client review |
| `communication` | Object | No | Messages and history |
| `timeline` | [Object] | No | Status change history |
| `documents` | [Object] | No | Uploaded documents |
| `beforePhotos` | [Object] | No | Before service photos |
| `afterPhotos` | [Object] | No | After service photos |
| `completionNotes` | String | No | Provider completion notes |
| `clientSatisfaction` | Object | No | Satisfaction feedback |

**Indexes:**
- `{ client: 1, status: 1 }`
- `{ provider: 1, status: 1 }`
- `{ service: 1, status: 1 }`
- `{ bookingDate: 1 }`
- `{ status: 1 }`

---

## Financial Domain

### Escrow

Secure payment holding for transactions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `id` | String | Yes | UUID, unique identifier |
| `bookingId` | ObjectId | Yes | Reference to Booking |
| `clientId` | ObjectId | Yes | Reference to User (client) |
| `providerId` | ObjectId | Yes | Reference to User (provider) |
| `currency` | String | Yes | Enum: USD, PHP, EUR, GBP, JPY |
| `amount` | Number | Yes | Amount in cents |
| `holdProvider` | String | Yes | Enum: paymongo, xendit, stripe, paypal, paymaya |
| `providerHoldId` | String | Yes | Gateway authorization ID |
| `status` | String | Yes | Escrow status (see enum) |
| `proofOfWork` | Object | No | Work completion proof |
| `clientApproval` | Object | No | Client approval details |
| `dispute` | Object | No | Dispute information |

**Status Enum:**
```
CREATED, FUNDS_HELD, IN_PROGRESS, COMPLETE, DISPUTE, REFUNDED, PAYOUT_INITIATED, PAYOUT_COMPLETED
```

**Indexes:**
- `{ id: 1 }` - Unique
- `{ bookingId: 1, status: 1 }`
- `{ clientId: 1, status: 1 }`
- `{ providerId: 1, status: 1 }`
- `{ createdAt: -1 }`

---

### EscrowTransaction

Escrow transaction history.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `escrow` | ObjectId | Yes | Reference to Escrow |
| `type` | String | Yes | Transaction type |
| `amount` | Number | Yes | Transaction amount |
| `status` | String | Yes | Transaction status |
| `gatewayResponse` | Object | No | Payment gateway response |
| `initiatedBy` | ObjectId | No | User who initiated |
| `notes` | String | No | Transaction notes |

**Indexes:**
- `{ escrow: 1 }`
- `{ type: 1, status: 1 }`

---

### Payout

Provider payout records.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `provider` | ObjectId | Yes | Reference to User |
| `amount` | Number | Yes | Payout amount |
| `currency` | String | Yes | Currency code |
| `status` | String | Yes | Enum: pending, processing, completed, failed |
| `method` | String | Yes | Payout method |
| `reference` | String | No | External reference |
| `escrows` | [ObjectId] | No | Related escrows |
| `fees` | Number | No | Payout fees |
| `netAmount` | Number | No | Amount after fees |
| `processedAt` | Date | No | Processing timestamp |
| `failureReason` | String | No | Failure reason if failed |

**Indexes:**
- `{ provider: 1, status: 1 }`
- `{ status: 1 }`
- `{ processedAt: -1 }`

---

### WalletTransaction

Wallet transaction history.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `wallet` | ObjectId | Yes | Reference to UserWallet |
| `type` | String | Yes | Enum: credit, debit, hold, release |
| `amount` | Number | Yes | Transaction amount |
| `balance` | Number | Yes | Balance after transaction |
| `description` | String | No | Transaction description |
| `reference` | Object | No | Reference to related entity |
| `metadata` | Object | No | Additional data |

**Indexes:**
- `{ wallet: 1 }`
- `{ type: 1 }`
- `{ createdAt: -1 }`

---

### Invoice

Invoice generation for services.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `invoiceNumber` | String | Yes | Unique invoice number |
| `booking` | ObjectId | No | Reference to Booking |
| `client` | ObjectId | Yes | Reference to User |
| `provider` | ObjectId | Yes | Reference to User |
| `items` | [Object] | Yes | Line items |
| `subtotal` | Number | Yes | Subtotal amount |
| `tax` | Number | No | Tax amount |
| `discount` | Number | No | Discount amount |
| `total` | Number | Yes | Total amount |
| `status` | String | Yes | Enum: draft, sent, paid, overdue, cancelled |
| `dueDate` | Date | No | Payment due date |
| `paidAt` | Date | No | Payment timestamp |
| `notes` | String | No | Invoice notes |

**Indexes:**
- `{ invoiceNumber: 1 }` - Unique
- `{ client: 1, status: 1 }`
- `{ provider: 1, status: 1 }`
- `{ dueDate: 1, status: 1 }`

---

### Quote

Service quotes and estimates.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `quoteNumber` | String | Yes | Unique quote number |
| `client` | ObjectId | Yes | Reference to User |
| `provider` | ObjectId | Yes | Reference to User |
| `service` | ObjectId | No | Reference to Service |
| `items` | [Object] | Yes | Quote line items |
| `subtotal` | Number | Yes | Subtotal |
| `tax` | Number | No | Estimated tax |
| `total` | Number | Yes | Total estimate |
| `status` | String | Yes | Enum: draft, sent, accepted, rejected, expired |
| `validUntil` | Date | No | Quote expiration |
| `notes` | String | No | Quote notes |
| `acceptedAt` | Date | No | Acceptance timestamp |

**Indexes:**
- `{ quoteNumber: 1 }` - Unique
- `{ client: 1, status: 1 }`
- `{ provider: 1, status: 1 }`

---

### Finance

Platform financial records.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `type` | String | Yes | Record type |
| `amount` | Number | Yes | Amount |
| `currency` | String | Yes | Currency code |
| `category` | String | Yes | Financial category |
| `reference` | Object | No | Related entity reference |
| `description` | String | No | Description |
| `date` | Date | Yes | Transaction date |
| `metadata` | Object | No | Additional data |

**Indexes:**
- `{ type: 1, date: -1 }`
- `{ category: 1 }`

---

### Loan

Loan/financing records.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `amount` | Number | Yes | Loan amount |
| `interestRate` | Number | Yes | Interest rate |
| `term` | Number | Yes | Loan term (months) |
| `status` | String | Yes | Enum: pending, approved, active, paid, defaulted |
| `payments` | [Object] | No | Payment history |
| `remainingBalance` | Number | No | Outstanding balance |
| `nextPaymentDate` | Date | No | Next payment due |

**Indexes:**
- `{ user: 1, status: 1 }`
- `{ status: 1 }`
- `{ nextPaymentDate: 1 }`

---

## Agency Domain

### Agency

Agency organization entity.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `name` | String | Yes | Agency name |
| `description` | String | Yes | Agency description |
| `owner` | ObjectId | Yes | Reference to User |
| `admins` | [Object] | No | Admin users with roles |
| `providers` | [Object] | No | Member providers |
| `contact` | Object | Yes | Contact information |
| `contact.email` | String | Yes | Contact email |
| `contact.phone` | String | Yes | Contact phone |
| `contact.website` | String | No | Website URL |
| `contact.address` | Object | No | Physical address |
| `business` | Object | No | Business registration details |
| `serviceAreas` | [Object] | No | Geographic coverage |
| `services` | [Object] | No | Service categories offered |
| `subscription` | Object | No | Subscription plan details |
| `verification` | Object | No | Verification status |
| `analytics` | Object | No | Agency statistics |
| `settings` | Object | No | Agency settings |
| `isActive` | Boolean | Yes | Active status |

**Admin Subdocument:**
| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId | Reference to User |
| `role` | String | Enum: admin, manager, supervisor |
| `addedAt` | Date | Date added |
| `permissions` | [String] | Permission list |

**Provider Subdocument:**
| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId | Reference to User |
| `status` | String | Enum: active, inactive, suspended, pending |
| `commissionRate` | Number | Commission percentage (0-100) |
| `joinedAt` | Date | Join date |
| `performance` | Object | Performance metrics |

**Indexes:**
- `{ owner: 1 }`
- `{ 'providers.user': 1 }`
- `{ isActive: 1 }`

**Methods:**
- `addProvider(userId, commissionRate)` - Add provider to agency
- `updateProviderStatus(userId, status)` - Update provider status
- `updateProviderPerformance(userId, data)` - Update performance
- `addAdmin(userId, role, permissions)` - Add admin
- `removeAdmin(userId)` - Remove admin
- `isAdmin(userId)` - Check admin status
- `isProvider(userId)` - Check provider membership
- `hasAccess(userId)` - Check any access

---

## Communication Domain

### Notification

User notifications.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `type` | String | Yes | Notification type |
| `title` | String | Yes | Notification title |
| `message` | String | Yes | Notification body |
| `data` | Object | No | Additional data |
| `isRead` | Boolean | No | Read status |
| `readAt` | Date | No | Read timestamp |
| `channels` | [String] | No | Delivery channels |
| `deliveryStatus` | Object | No | Per-channel delivery status |

**Indexes:**
- `{ user: 1, isRead: 1 }`
- `{ user: 1, type: 1 }`
- `{ createdAt: -1 }`

---

### Message

Direct messaging between users.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `conversation` | ObjectId | Yes | Reference to Conversation |
| `sender` | ObjectId | Yes | Reference to User |
| `content` | String | Yes | Message content |
| `type` | String | No | Enum: text, image, file, system |
| `attachments` | [Object] | No | File attachments |
| `isRead` | Boolean | No | Read status |
| `readAt` | Date | No | Read timestamp |
| `metadata` | Object | No | Additional data |

**Indexes:**
- `{ conversation: 1, createdAt: -1 }`
- `{ sender: 1 }`

---

### Conversation

Message conversation threads.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `participants` | [ObjectId] | Yes | User references |
| `type` | String | No | Enum: direct, group, support |
| `lastMessage` | Object | No | Last message preview |
| `lastMessageAt` | Date | No | Last activity timestamp |
| `metadata` | Object | No | Booking or job reference |
| `isActive` | Boolean | No | Active status |

**Indexes:**
- `{ participants: 1 }`
- `{ lastMessageAt: -1 }`
- `{ type: 1 }`

---

### SupportTicket

Customer support tickets.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `ticketNumber` | String | Yes | Unique ticket ID |
| `user` | ObjectId | Yes | Reference to User |
| `subject` | String | Yes | Ticket subject |
| `description` | String | Yes | Issue description |
| `category` | String | Yes | Ticket category |
| `priority` | String | Yes | Enum: low, medium, high, urgent |
| `status` | String | Yes | Enum: open, in_progress, waiting, resolved, closed |
| `assignedTo` | ObjectId | No | Reference to admin User |
| `messages` | [Object] | No | Ticket messages |
| `attachments` | [Object] | No | File attachments |
| `resolution` | Object | No | Resolution details |
| `rating` | Object | No | Customer satisfaction |

**Indexes:**
- `{ ticketNumber: 1 }` - Unique
- `{ user: 1, status: 1 }`
- `{ assignedTo: 1, status: 1 }`
- `{ priority: 1, status: 1 }`
- `{ createdAt: -1 }`

---

### LiveChat

Live chat sessions for support.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `sessionId` | String | Yes | Unique session ID |
| `user` | ObjectId | Yes | Reference to User |
| `agent` | ObjectId | No | Reference to support agent |
| `status` | String | Yes | Enum: waiting, active, ended |
| `messages` | [Object] | No | Chat messages |
| `startedAt` | Date | Yes | Session start |
| `endedAt` | Date | No | Session end |
| `rating` | Object | No | Session rating |
| `metadata` | Object | No | Additional context |

**Indexes:**
- `{ sessionId: 1 }` - Unique
- `{ user: 1, status: 1 }`
- `{ agent: 1, status: 1 }`
- `{ status: 1 }`

---

## Content Domain

### Announcement

System announcements.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `title` | String | Yes | Announcement title |
| `content` | String | Yes | Announcement body |
| `type` | String | Yes | Enum: info, warning, alert, promotion |
| `targetAudience` | [String] | No | Target user roles |
| `startDate` | Date | No | Display start date |
| `endDate` | Date | No | Display end date |
| `isActive` | Boolean | Yes | Active status |
| `priority` | Number | No | Display priority |
| `dismissible` | Boolean | No | Can be dismissed |

**Indexes:**
- `{ isActive: 1, startDate: 1, endDate: 1 }`
- `{ type: 1 }`
- `{ targetAudience: 1 }`

---

### Alert

System alerts and notifications.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `type` | String | Yes | Alert type |
| `severity` | String | Yes | Enum: info, warning, error, critical |
| `message` | String | Yes | Alert message |
| `source` | String | No | Alert source |
| `data` | Object | No | Alert data |
| `acknowledged` | Boolean | No | Acknowledgement status |
| `acknowledgedBy` | ObjectId | No | Admin who acknowledged |
| `resolvedAt` | Date | No | Resolution timestamp |

**Indexes:**
- `{ type: 1, severity: 1 }`
- `{ acknowledged: 1 }`
- `{ createdAt: -1 }`

---

### Ad

Advertisement placements.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `title` | String | Yes | Ad title |
| `content` | Object | Yes | Ad content (text, image, video) |
| `advertiser` | ObjectId | Yes | Reference to User |
| `placement` | String | Yes | Ad placement location |
| `targetAudience` | Object | No | Targeting criteria |
| `budget` | Object | No | Budget and spending |
| `schedule` | Object | No | Display schedule |
| `status` | String | Yes | Enum: draft, pending, active, paused, ended |
| `analytics` | Object | No | Performance metrics |

**Indexes:**
- `{ advertiser: 1, status: 1 }`
- `{ placement: 1, status: 1 }`
- `{ status: 1 }`

---

## Academy Domain

### Course

Educational courses.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `title` | String | Yes | Course title |
| `description` | String | Yes | Course description |
| `instructor` | ObjectId | Yes | Reference to User |
| `category` | String | Yes | Course category |
| `level` | String | Yes | Enum: beginner, intermediate, advanced |
| `duration` | Number | No | Total duration (minutes) |
| `modules` | [Object] | No | Course modules |
| `pricing` | Object | No | Pricing details |
| `thumbnail` | Object | No | Course image |
| `status` | String | Yes | Enum: draft, published, archived |
| `enrollmentCount` | Number | No | Student count |
| `rating` | Object | No | Average rating |
| `requirements` | [String] | No | Prerequisites |
| `objectives` | [String] | No | Learning objectives |
| `tags` | [String] | No | Search tags |

**Indexes:**
- `{ instructor: 1, status: 1 }`
- `{ category: 1, status: 1 }`
- `{ status: 1 }`
- `{ 'rating.average': -1 }`
- Text index on title, description

---

### Enrollment

Course enrollments.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `course` | ObjectId | Yes | Reference to Course |
| `student` | ObjectId | Yes | Reference to User |
| `status` | String | Yes | Enum: active, completed, dropped |
| `progress` | Number | No | Completion percentage |
| `completedModules` | [ObjectId] | No | Completed module IDs |
| `startedAt` | Date | Yes | Enrollment date |
| `completedAt` | Date | No | Completion date |
| `certificate` | Object | No | Certificate details |
| `payment` | Object | No | Payment information |

**Indexes:**
- `{ course: 1, student: 1 }` - Unique compound
- `{ student: 1, status: 1 }`
- `{ course: 1, status: 1 }`

---

### Activity

Learning activities and quizzes.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `course` | ObjectId | Yes | Reference to Course |
| `module` | ObjectId | No | Reference to module |
| `title` | String | Yes | Activity title |
| `type` | String | Yes | Enum: quiz, assignment, video, reading |
| `content` | Object | Yes | Activity content |
| `duration` | Number | No | Estimated duration |
| `points` | Number | No | Points value |
| `order` | Number | No | Display order |

**Indexes:**
- `{ course: 1, order: 1 }`
- `{ type: 1 }`

---

## Supplies Domain

### Supply

Product inventory for supplies marketplace.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `name` | String | Yes | Product name |
| `description` | String | Yes | Product description |
| `supplier` | ObjectId | Yes | Reference to User |
| `category` | String | Yes | Product category |
| `sku` | String | No | Stock keeping unit |
| `price` | Object | Yes | Pricing details |
| `inventory` | Object | Yes | Stock levels |
| `images` | [Object] | No | Product images |
| `specifications` | Object | No | Technical specs |
| `status` | String | Yes | Enum: draft, active, out_of_stock, discontinued |
| `rating` | Object | No | Average rating |

**Indexes:**
- `{ supplier: 1, status: 1 }`
- `{ category: 1, status: 1 }`
- `{ sku: 1 }` - Unique, sparse
- `{ status: 1 }`

---

### SupplyOrder

Supply purchase orders.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `orderNumber` | String | Yes | Unique order number |
| `buyer` | ObjectId | Yes | Reference to User |
| `supplier` | ObjectId | Yes | Reference to User |
| `items` | [Object] | Yes | Order items |
| `subtotal` | Number | Yes | Subtotal amount |
| `shipping` | Object | No | Shipping details |
| `tax` | Number | No | Tax amount |
| `total` | Number | Yes | Total amount |
| `status` | String | Yes | Order status |
| `payment` | Object | No | Payment information |
| `tracking` | Object | No | Shipping tracking |
| `deliveredAt` | Date | No | Delivery timestamp |

**Indexes:**
- `{ orderNumber: 1 }` - Unique
- `{ buyer: 1, status: 1 }`
- `{ supplier: 1, status: 1 }`
- `{ status: 1 }`

---

## Rentals Domain

### Rental

Equipment rental listings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `title` | String | Yes | Rental item title |
| `description` | String | Yes | Item description |
| `owner` | ObjectId | Yes | Reference to User |
| `category` | String | Yes | Rental category |
| `pricing` | Object | Yes | Rental pricing |
| `pricing.hourly` | Number | No | Hourly rate |
| `pricing.daily` | Number | No | Daily rate |
| `pricing.weekly` | Number | No | Weekly rate |
| `pricing.deposit` | Number | No | Security deposit |
| `availability` | Object | No | Availability schedule |
| `location` | Object | Yes | Pickup location |
| `images` | [Object] | No | Item images |
| `specifications` | Object | No | Item specifications |
| `condition` | String | No | Item condition |
| `status` | String | Yes | Enum: available, rented, maintenance, retired |
| `rating` | Object | No | Average rating |

**Indexes:**
- `{ owner: 1, status: 1 }`
- `{ category: 1, status: 1 }`
- `{ status: 1 }`
- `{ 'location.coordinates': '2dsphere' }`

---

### RentalBooking

Rental reservations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `rental` | ObjectId | Yes | Reference to Rental |
| `renter` | ObjectId | Yes | Reference to User |
| `owner` | ObjectId | Yes | Reference to User |
| `startDate` | Date | Yes | Rental start |
| `endDate` | Date | Yes | Rental end |
| `pricing` | Object | Yes | Pricing breakdown |
| `deposit` | Object | No | Deposit status |
| `status` | String | Yes | Booking status |
| `pickupDetails` | Object | No | Pickup information |
| `returnDetails` | Object | No | Return information |
| `damageReport` | Object | No | Damage assessment |

**Indexes:**
- `{ rental: 1, startDate: 1, endDate: 1 }`
- `{ renter: 1, status: 1 }`
- `{ owner: 1, status: 1 }`

---

## System Domain

### ApiKey

API key management for partners.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `name` | String | Yes | Key name/label |
| `key` | String | Yes | API key (hashed) |
| `prefix` | String | Yes | Key prefix for identification |
| `permissions` | [String] | No | Allowed permissions |
| `rateLimit` | Object | No | Rate limiting config |
| `expiresAt` | Date | No | Expiration date |
| `lastUsedAt` | Date | No | Last usage timestamp |
| `isActive` | Boolean | Yes | Active status |

**Indexes:**
- `{ user: 1 }`
- `{ prefix: 1 }` - Unique
- `{ isActive: 1 }`

---

### GpsLog

GPS tracking logs.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `booking` | ObjectId | No | Reference to Booking |
| `coordinates` | Object | Yes | GeoJSON Point |
| `accuracy` | Number | No | GPS accuracy (meters) |
| `speed` | Number | No | Speed (m/s) |
| `heading` | Number | No | Heading (degrees) |
| `timestamp` | Date | Yes | Log timestamp |
| `metadata` | Object | No | Additional data |

**Indexes:**
- `{ user: 1, timestamp: -1 }`
- `{ booking: 1, timestamp: -1 }`
- `{ coordinates: '2dsphere' }`
- `{ timestamp: -1 }` - TTL index for cleanup

---

### Webhook

Webhook endpoint management.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | Yes | Reference to User |
| `url` | String | Yes | Webhook endpoint URL |
| `events` | [String] | Yes | Subscribed events |
| `secret` | String | Yes | Signing secret |
| `isActive` | Boolean | Yes | Active status |
| `failureCount` | Number | No | Consecutive failures |
| `lastTriggered` | Date | No | Last trigger timestamp |
| `metadata` | Object | No | Additional config |

**Indexes:**
- `{ user: 1 }`
- `{ events: 1 }`
- `{ isActive: 1 }`

---

### WebhookLog

Webhook delivery logs.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `webhook` | ObjectId | Yes | Reference to Webhook |
| `event` | String | Yes | Event type |
| `payload` | Object | Yes | Sent payload |
| `response` | Object | No | Endpoint response |
| `statusCode` | Number | No | HTTP status code |
| `success` | Boolean | Yes | Delivery success |
| `duration` | Number | No | Request duration (ms) |
| `retryCount` | Number | No | Retry attempts |

**Indexes:**
- `{ webhook: 1, createdAt: -1 }`
- `{ event: 1 }`
- `{ success: 1 }`
- `{ createdAt: -1 }` - TTL for cleanup

---

### SystemConfig

System configuration storage.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `key` | String | Yes | Configuration key |
| `value` | Mixed | Yes | Configuration value |
| `category` | String | No | Config category |
| `description` | String | No | Description |
| `isPublic` | Boolean | No | Publicly accessible |
| `updatedBy` | ObjectId | No | Last updated by |

**Indexes:**
- `{ key: 1 }` - Unique
- `{ category: 1 }`

---

### AuditLog

System audit trail.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | Primary key |
| `user` | ObjectId | No | Reference to User |
| `action` | String | Yes | Action performed |
| `resource` | String | Yes | Resource type |
| `resourceId` | ObjectId | No | Resource ID |
| `changes` | Object | No | Before/after values |
| `ipAddress` | String | No | Client IP |
| `userAgent` | String | No | Client user agent |
| `metadata` | Object | No | Additional context |

**Indexes:**
- `{ user: 1, createdAt: -1 }`
- `{ action: 1 }`
- `{ resource: 1, resourceId: 1 }`
- `{ createdAt: -1 }` - TTL for cleanup

---

## Indexes Reference

### Performance-Critical Indexes

| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| User | `{ phoneNumber: 1 }` | Unique | Primary login |
| User | `{ email: 1 }` | Unique, Sparse | Email login |
| Provider | `{ userId: 1 }` | Unique | User-Provider link |
| Service | `{ 'serviceArea.coordinates': '2dsphere' }` | Geospatial | Location search |
| Booking | `{ client: 1, status: 1 }` | Compound | Client bookings |
| Booking | `{ provider: 1, status: 1 }` | Compound | Provider bookings |
| Job | `{ status: 1, isActive: 1 }` | Compound | Active jobs |
| Escrow | `{ bookingId: 1, status: 1 }` | Compound | Booking escrow |
| Notification | `{ user: 1, isRead: 1 }` | Compound | User notifications |

### Text Search Indexes

| Collection | Fields | Purpose |
|------------|--------|---------|
| Job | title, description, company.name, requirements.skills, tags | Job search |
| Service | title, description, features, requirements | Service search |
| Course | title, description | Course search |

### TTL Indexes (Automatic Cleanup)

| Collection | Field | TTL | Purpose |
|------------|-------|-----|---------|
| GpsLog | timestamp | 30 days | Location privacy |
| WebhookLog | createdAt | 90 days | Log retention |
| AuditLog | createdAt | 365 days | Compliance |

---

## Schema Validation Rules

### Required Field Validation

Most models use Mongoose's built-in validation:

```javascript
// Example: User model
phoneNumber: {
  type: String,
  required: [true, 'Phone number is required'],
  unique: true,
  validate: {
    validator: function(v) {
      return /^\+?[1-9]\d{1,14}$/.test(v);
    },
    message: 'Invalid phone number format'
  }
}
```

### Enum Validation

All status and type fields use enum validation:

```javascript
status: {
  type: String,
  enum: ['pending', 'active', 'suspended', 'inactive', 'rejected'],
  default: 'pending'
}
```

### Reference Validation

Foreign key references use ObjectId with ref:

```javascript
user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
  index: true
}
```

---

## Data Migration Notes

### Soft Delete Pattern

Several models implement soft delete:

```javascript
deleted: { type: Boolean, default: false },
deletedOn: { type: Date, default: null }
```

### Timestamp Pattern

All models include Mongoose timestamps:

```javascript
{ timestamps: true }
// Creates: createdAt, updatedAt
```

### Embedded vs Referenced

- **Embedded**: Small, frequently accessed data (fcmTokens in User, applications in Job)
- **Referenced**: Large or independently queryable data (Provider sub-documents, Bookings)

---

*Last Updated: January 2026*
*Document Version: 1.0*
