# LocalPro Super App - Backend Features Specification

> **Version:** 1.0.0  
> **Last Updated:** December 7, 2025  
> **Purpose:** Complete specification of all features requiring backend implementation

---

## Table of Contents

1. [Overview](#overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Core Features](#core-features)
   - [Authentication & Authorization](#1-authentication--authorization)
   - [User Management](#2-user-management)
   - [Marketplace (Services)](#3-marketplace-services)
   - [Supplies (E-Commerce)](#4-supplies-e-commerce)
   - [Academy (Education)](#5-academy-education)
   - [Rentals](#6-rentals-equipment--vehicles)
   - [Jobs (Job Board)](#7-jobs-job-board)
   - [Agencies](#8-agencies-multi-provider-organizations)
   - [Facility Care](#9-facility-care-recurring-services)
   - [Finance](#10-finance-wallet--payments)
   - [LocalPro Plus (Subscriptions)](#11-localpro-plus-subscriptions)
   - [Ads (Advertising)](#12-ads-advertising-platform)
   - [Communication](#13-communication-messaging)
   - [Announcements](#14-announcements)
   - [Activity Feed](#15-activity-feed-social)
   - [Referrals](#16-referrals)
   - [Trust Verification](#17-trust-verification)
   - [Settings](#18-settings)
   - [Maps & Location](#19-maps--location)
   - [Payment Integrations](#20-payment-integrations)
   - [Search](#21-search)
   - [AI Features](#22-ai-features)
   - [Analytics & Monitoring](#23-analytics--monitoring)
   - [Logging & Audit](#24-logging--audit)
   - [Real-Time Features](#25-real-time-features)
   - [Admin Dashboard](#26-admin-dashboard)
4. [API Summary](#api-summary)
5. [Database Collections](#database-collections)
6. [Integration Points](#integration-points)

---

## Overview

LocalPro is a comprehensive **Super App** platform that integrates multiple professional services including:

- **Marketplace** - On-demand services (Cleaning, Plumbing, Electrical, Moving)
- **Supplies & Materials** - E-commerce for resources and goods
- **Academy** - Educational and certification services
- **Rentals** - Equipment and vehicle rentals
- **LocalPro Plus** - Premium subscription service
- **Facility Care** - Recurring facility services
- **Ads** - Advertising platform
- **Finance** - Wallet, payments, and financial services
- **Jobs** - Job board for the service industry

### Tech Stack Requirements

| Component | Technology |
|-----------|------------|
| API Style | RESTful API |
| Authentication | JWT (JSON Web Tokens) |
| Database | MongoDB (recommended) |
| File Storage | Cloud Storage (S3/GCS/Azure Blob) |
| Real-time | WebSocket / Server-Sent Events |
| Payment | PayPal, PayMaya |
| Maps | Google Maps API |
| SMS | Twilio or similar |
| AI | OpenAI / Custom ML models |

---

## User Roles & Permissions

### Role Definitions

| Role | Code | Description | Access Level |
|------|------|-------------|--------------|
| Client | `client` | Regular users who book services and purchase products | Basic |
| Provider | `provider` | Service providers offering marketplace services | Extended |
| Supplier | `supplier` | Users who sell supplies and products | Extended |
| Instructor | `instructor` | Academy course instructors | Extended |
| Agency Admin | `agency_admin` | Agency administrator | Agency-level |
| Agency Owner | `agency_owner` | Agency owner with full agency control | Agency-level |
| Admin | `admin` | Platform administrators with full access | Full |

### Permission Matrix

```
Feature                 | Client | Provider | Supplier | Instructor | Agency Admin | Admin
------------------------|--------|----------|----------|------------|--------------|------
View Marketplace        | ✓      | ✓        | ✓        | ✓          | ✓            | ✓
Create Services         | ✗      | ✓        | ✗        | ✗          | ✓            | ✓
Create Supplies         | ✗      | ✗        | ✓        | ✗          | ✗            | ✓
Create Courses          | ✗      | ✗        | ✗        | ✓          | ✗            | ✓
Manage Agency           | ✗      | ✗        | ✗        | ✗          | ✓            | ✓
Admin Dashboard         | ✗      | ✗        | ✗        | ✗          | ✗            | ✓
Financial Management    | ✗      | ✗        | ✗        | ✗          | ✗            | ✓
User Management         | ✗      | ✗        | ✗        | ✗          | Partial      | ✓
```

---

## Core Features

### 1. Authentication & Authorization

#### Description
Phone-based authentication system using SMS verification codes. No traditional email/password authentication.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Send Verification Code | Send SMS code to phone number | P0 |
| Verify Code | Validate code and issue JWT | P0 |
| User Registration | Create new user after verification | P0 |
| Get Current User | Return authenticated user profile | P0 |
| Update Profile | Update user profile information | P0 |
| Profile Completion Status | Track onboarding progress | P1 |
| Avatar Upload | Upload and store profile images | P1 |
| Portfolio Upload | Multiple portfolio images for providers | P1 |
| Logout | Invalidate user session | P0 |
| Complete Onboarding | Mark onboarding as complete | P1 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/auth/send-code` | PUBLIC | Send verification code |
| POST | `/api/auth/verify-code` | PUBLIC | Verify code and login |
| POST | `/api/auth/register` | AUTHENTICATED | Complete registration |
| GET | `/api/auth/me` | AUTHENTICATED | Get current user |
| GET | `/api/auth/profile` | AUTHENTICATED | Get profile (minimal) |
| PUT | `/api/auth/profile` | AUTHENTICATED | Update profile |
| POST | `/api/auth/upload-avatar` | AUTHENTICATED | Upload avatar |
| POST | `/api/auth/upload-portfolio` | AUTHENTICATED | Upload portfolio images |
| POST | `/api/auth/complete-onboarding` | AUTHENTICATED | Complete onboarding |
| GET | `/api/auth/profile-completion-status` | AUTHENTICATED | Get completion status |
| GET | `/api/auth/profile-completeness` | AUTHENTICATED | Get completeness percentage |
| POST | `/api/auth/logout` | AUTHENTICATED | Logout |

#### Data Model: User

```typescript
interface User {
  _id: string;
  phone: string;
  phoneVerified: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  portfolio?: string[];
  roles: UserRole[];
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  isVerified: boolean;
  verificationLevel?: 'basic' | 'standard' | 'premium';
  badges?: Badge[];
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  preferences?: UserPreferences;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
  profileCompleteness?: number;
  referralCode?: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

---

### 2. User Management

#### Description
Administrative user management system for platform administrators.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| List Users | Paginated user listing with filters | P0 |
| Get User by ID | Retrieve single user details | P0 |
| Create User | Admin-created users | P1 |
| Update User | Modify user information | P0 |
| Update User Status | Activate/suspend/ban users | P0 |
| Update Verification | Verify/unverify users | P1 |
| Add Badge | Award badges to users | P2 |
| Bulk Update | Bulk status updates | P2 |
| Delete User | Soft/hard delete users | P1 |
| User Statistics | Aggregate user metrics | P1 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/users` | admin, agency_admin, agency_owner | Get all users |
| GET | `/api/users/stats` | admin, agency_admin, agency_owner | Get user statistics |
| GET | `/api/users/:id` | admin, agency_admin, agency_owner, provider, client | Get user by ID |
| POST | `/api/users` | admin | Create user |
| PUT | `/api/users/:id` | admin, agency_admin, agency_owner, provider, client | Update user |
| PATCH | `/api/users/:id/status` | admin, agency_admin | Update user status |
| PATCH | `/api/users/:id/verification` | admin, agency_admin | Update verification |
| POST | `/api/users/:id/badges` | admin, agency_admin | Add badge to user |
| PATCH | `/api/users/bulk` | admin | Bulk update users |
| DELETE | `/api/users/:id` | admin | Delete user |

---

### 3. Marketplace (Services)

#### Description
Core service marketplace where providers offer and clients book on-demand services.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| List Services | Browse all services with filters | P0 |
| Service Categories | Organize by category (Cleaning, Plumbing, etc.) | P0 |
| Nearby Services | Location-based discovery | P0 |
| Service Details | Detailed service information | P0 |
| Create Service | Providers create offerings | P0 |
| Update Service | Modify service details | P0 |
| Delete Service | Remove service listings | P0 |
| Service Images | Upload multiple images | P0 |
| Service Reviews | Ratings and reviews | P1 |
| Create Booking | Book a service | P0 |
| Booking Management | View and manage bookings | P0 |
| Booking Status | Status workflow management | P0 |
| Booking Photos | Before/after photos | P1 |
| PayPal Integration | Process payments | P0 |
| My Services | Provider's service list | P0 |
| My Bookings | User's booking history | P0 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/marketplace/services` | PUBLIC | Get services |
| GET | `/api/marketplace/services/categories` | PUBLIC | Get categories |
| GET | `/api/marketplace/services/categories/:category` | PUBLIC | Get category details |
| GET | `/api/marketplace/services/nearby` | PUBLIC | Get nearby services |
| GET | `/api/marketplace/services/:id` | PUBLIC | Get service details |
| GET | `/api/marketplace/services/:id/providers` | PUBLIC | Get providers for service |
| GET | `/api/marketplace/providers/:id` | PUBLIC | Get provider details |
| GET | `/api/marketplace/my-services` | AUTHENTICATED | Get my services |
| GET | `/api/marketplace/my-bookings` | AUTHENTICATED | Get my bookings |
| POST | `/api/marketplace/bookings` | AUTHENTICATED | Create booking |
| GET | `/api/marketplace/bookings` | AUTHENTICATED | Get bookings |
| GET | `/api/marketplace/bookings/:id` | AUTHENTICATED | Get booking details |
| PUT | `/api/marketplace/bookings/:id/status` | AUTHENTICATED | Update booking status |
| POST | `/api/marketplace/bookings/:id/photos` | AUTHENTICATED | Upload booking photos |
| POST | `/api/marketplace/bookings/:id/review` | AUTHENTICATED | Add review |
| POST | `/api/marketplace/bookings/paypal/approve` | AUTHENTICATED | Approve PayPal booking |
| GET | `/api/marketplace/bookings/paypal/order/:orderId` | AUTHENTICATED | Get PayPal order |

#### Data Model: Service

```typescript
interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  provider: string; // User ID
  price: {
    amount: number;
    currency: string;
    type: 'fixed' | 'hourly' | 'starting_at';
  };
  images: string[];
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  serviceArea?: {
    radius: number;
    unit: 'km' | 'miles';
  };
  availability?: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
  rating: {
    average: number;
    count: number;
  };
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  featured: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Data Model: Booking

```typescript
interface Booking {
  _id: string;
  service: string; // Service ID
  provider: string; // User ID
  client: string; // User ID
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  scheduledDate: Date;
  scheduledTime: string;
  duration?: number;
  location: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  price: {
    amount: number;
    currency: string;
  };
  payment: {
    method: 'paypal' | 'paymaya' | 'wallet' | 'cash';
    status: 'pending' | 'paid' | 'refunded' | 'failed';
    transactionId?: string;
  };
  photos?: {
    before?: string[];
    after?: string[];
  };
  notes?: string;
  review?: {
    rating: number;
    comment: string;
    createdAt: Date;
  };
  cancellation?: {
    reason: string;
    cancelledBy: string;
    cancelledAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 4. Supplies (E-Commerce)

#### Description
E-commerce platform for selling supplies, tools, and materials to service providers and clients.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| List Supplies | Browse all products | P0 |
| Supply Categories | Organize by category | P0 |
| Featured Supplies | Highlighted products | P1 |
| Nearby Supplies | Location-based discovery | P1 |
| Supply Details | Product information | P0 |
| Create Supply | Suppliers create listings | P0 |
| Update Supply | Modify products | P0 |
| Delete Supply | Remove listings | P0 |
| Supply Images | Product images | P0 |
| Order Supply | Place orders | P0 |
| Order Status | Track order status | P0 |
| Supply Reviews | Product reviews | P1 |
| My Supplies | Supplier's products | P0 |
| My Orders | User's order history | P0 |
| Statistics | Admin analytics | P2 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/supplies` | PUBLIC | Get supplies |
| GET | `/api/supplies/products` | PUBLIC | Get supplies (alias) |
| GET | `/api/supplies/products/:id` | PUBLIC | Get supply (alias) |
| GET | `/api/supplies/categories` | PUBLIC | Get categories |
| GET | `/api/supplies/featured` | PUBLIC | Get featured |
| GET | `/api/supplies/nearby` | PUBLIC | Get nearby |
| GET | `/api/supplies/:id` | PUBLIC | Get supply details |
| POST | `/api/supplies/:id/order` | AUTHENTICATED | Order supply |
| PUT | `/api/supplies/:id/orders/:orderId/status` | AUTHENTICATED | Update order status |
| POST | `/api/supplies/:id/reviews` | AUTHENTICATED | Add review |
| GET | `/api/supplies/my-supplies` | AUTHENTICATED | Get my supplies |
| GET | `/api/supplies/my-orders` | AUTHENTICATED | Get my orders |

#### Data Model: Supply

```typescript
interface Supply {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  supplier: string; // User ID
  price: {
    amount: number;
    currency: string;
    compareAt?: number; // Original price for discounts
  };
  images: string[];
  inventory: {
    quantity: number;
    sku?: string;
    trackQuantity: boolean;
  };
  shipping: {
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    freeShipping: boolean;
    shippingCost?: number;
  };
  location?: {
    address: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  rating: {
    average: number;
    count: number;
  };
  status: 'active' | 'inactive' | 'out_of_stock';
  featured: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 5. Academy (Education)

#### Description
Educational platform offering courses, certifications, and skill training for service professionals.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| List Courses | Browse all courses | P0 |
| Course Categories | Organize by topic | P0 |
| Featured Courses | Highlighted courses | P1 |
| Course Details | Full course information | P0 |
| Create Course | Instructors create courses | P0 |
| Update Course | Modify course content | P0 |
| Delete Course | Remove courses | P0 |
| Course Thumbnail | Cover image | P0 |
| Course Videos | Video content upload | P0 |
| Enroll in Course | User enrollment | P0 |
| Progress Tracking | Track completion | P0 |
| Course Reviews | Ratings and feedback | P1 |
| My Courses | Enrolled courses | P0 |
| My Created Courses | Instructor's courses | P0 |
| Statistics | Admin analytics | P2 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/academy/courses` | PUBLIC | Get courses |
| GET | `/api/academy/courses/:id` | PUBLIC | Get course details |
| GET | `/api/academy/categories` | PUBLIC | Get categories |
| GET | `/api/academy/featured` | PUBLIC | Get featured |
| POST | `/api/academy/courses/:id/enroll` | AUTHENTICATED | Enroll in course |
| PUT | `/api/academy/courses/:id/progress` | AUTHENTICATED | Update progress |
| POST | `/api/academy/courses/:id/reviews` | AUTHENTICATED | Add review |
| GET | `/api/academy/my-courses` | AUTHENTICATED | Get enrolled courses |
| GET | `/api/academy/my-created-courses` | AUTHENTICATED | Get created courses |

#### Data Model: Course

```typescript
interface Course {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  instructor: string; // User ID
  category: string;
  subcategory?: string;
  thumbnail?: string;
  price: {
    amount: number;
    currency: string;
    isFree: boolean;
  };
  duration: {
    total: number; // in minutes
    lessons: number;
  };
  curriculum: {
    sections: {
      title: string;
      lessons: {
        title: string;
        type: 'video' | 'text' | 'quiz';
        duration?: number;
        videoUrl?: string;
        content?: string;
      }[];
    }[];
  };
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  requirements?: string[];
  objectives?: string[];
  rating: {
    average: number;
    count: number;
  };
  enrollmentCount: number;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  certification: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}
```

---

### 6. Rentals (Equipment & Vehicles)

#### Description
Platform for renting tools, equipment, and vehicles to service providers and clients.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| List Rentals | Browse rental items | P0 |
| Rental Categories | Tools, vehicles, equipment | P0 |
| Featured Rentals | Highlighted items | P1 |
| Nearby Rentals | Location-based | P1 |
| Rental Details | Item information | P0 |
| Create Rental | Providers create listings | P0 |
| Update Rental | Modify listings | P0 |
| Delete Rental | Remove listings | P0 |
| Rental Images | Item photos | P0 |
| Book Rental | Reserve items | P0 |
| Booking Status | Manage rentals | P0 |
| Rental Reviews | Ratings | P1 |
| My Rentals | Provider's items | P0 |
| My Bookings | User's rentals | P0 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/rentals` | PUBLIC | Get rentals |
| GET | `/api/rentals/items` | PUBLIC | Get rentals (alias) |
| GET | `/api/rentals/items/:id` | PUBLIC | Get rental (alias) |
| GET | `/api/rentals/categories` | PUBLIC | Get categories |
| GET | `/api/rentals/featured` | PUBLIC | Get featured |
| GET | `/api/rentals/nearby` | PUBLIC | Get nearby |
| GET | `/api/rentals/:id` | PUBLIC | Get rental details |
| POST | `/api/rentals/:id/book` | AUTHENTICATED | Book rental |
| PUT | `/api/rentals/:id/bookings/:bookingId/status` | AUTHENTICATED | Update booking |
| POST | `/api/rentals/:id/reviews` | AUTHENTICATED | Add review |
| GET | `/api/rentals/my-rentals` | AUTHENTICATED | Get my rentals |
| GET | `/api/rentals/my-bookings` | AUTHENTICATED | Get my bookings |

#### Data Model: Rental

```typescript
interface Rental {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  owner: string; // User ID
  price: {
    hourly?: number;
    daily: number;
    weekly?: number;
    monthly?: number;
    currency: string;
    deposit?: number;
  };
  images: string[];
  specifications?: {
    brand?: string;
    model?: string;
    year?: number;
    condition: 'new' | 'excellent' | 'good' | 'fair';
    features?: string[];
  };
  location: {
    address: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  availability: {
    isAvailable: boolean;
    blockedDates?: Date[];
    minRentalPeriod?: number; // in days
    maxRentalPeriod?: number;
  };
  rating: {
    average: number;
    count: number;
  };
  status: 'active' | 'inactive' | 'rented';
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 7. Jobs (Job Board)

#### Description
Job board for the service industry, allowing companies to post jobs and users to apply.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| List Jobs | Browse job listings | P0 |
| Search Jobs | Advanced search | P0 |
| Job Details | Full job information | P0 |
| Create Job | Post job listings | P0 |
| Update Job | Modify listings | P0 |
| Delete Job | Remove listings | P0 |
| Company Logo | Upload branding | P1 |
| Apply for Job | Submit application | P0 |
| Application Management | Review applications | P0 |
| Application Status | Track applications | P0 |
| My Jobs | Posted jobs | P0 |
| My Applications | Applied jobs | P0 |
| Job Statistics | Views, applications | P1 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/jobs` | PUBLIC | Get jobs |
| GET | `/api/jobs/search` | PUBLIC | Search jobs |
| GET | `/api/jobs/:id` | PUBLIC | Get job details |
| POST | `/api/jobs` | provider, admin | Create job |
| PUT | `/api/jobs/:id` | provider, admin | Update job |
| DELETE | `/api/jobs/:id` | provider, admin | Delete job |
| POST | `/api/jobs/:id/logo` | provider, admin | Upload logo |
| GET | `/api/jobs/:id/stats` | provider, admin | Get statistics |
| GET | `/api/jobs/my-jobs` | provider, admin | Get my jobs |
| GET | `/api/jobs/:id/applications` | provider, admin | Get applications |
| PUT | `/api/jobs/:id/applications/:applicationId/status` | provider, admin | Update application |
| POST | `/api/jobs/:id/apply` | AUTHENTICATED | Apply for job |
| GET | `/api/jobs/my-applications` | AUTHENTICATED | Get my applications |

#### Data Model: Job

```typescript
interface Job {
  _id: string;
  title: string;
  description: string;
  company: {
    name: string;
    logo?: string;
    website?: string;
    about?: string;
  };
  postedBy: string; // User ID
  category: string;
  type: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  experience: 'entry' | 'mid' | 'senior' | 'executive';
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
    isNegotiable: boolean;
  };
  location: {
    address?: string;
    city: string;
    state?: string;
    country: string;
    isRemote: boolean;
  };
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  skills?: string[];
  applicationDeadline?: Date;
  status: 'open' | 'closed' | 'draft' | 'expired';
  featured: boolean;
  views: number;
  applicationsCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 8. Agencies (Multi-Provider Organizations)

#### Description
System for managing provider agencies/companies with multiple service providers.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| List Agencies | Browse all agencies | P0 |
| Agency Details | Full information | P0 |
| Create Agency | Create new agency | P0 |
| Update Agency | Modify agency | P0 |
| Delete Agency | Remove agency | P0 |
| Agency Logo | Upload branding | P1 |
| Add Provider | Add to agency | P0 |
| Remove Provider | Remove from agency | P0 |
| Provider Status | Active/inactive | P0 |
| Add Admin | Add agency admin | P1 |
| Remove Admin | Remove admin | P1 |
| Agency Analytics | Performance metrics | P1 |
| My Agencies | User's agencies | P0 |
| Join Agency | Request to join | P0 |
| Leave Agency | Leave agency | P0 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/agencies` | PUBLIC | Get all agencies |
| GET | `/api/agencies/:id` | PUBLIC | Get agency |
| POST | `/api/agencies` | AUTHENTICATED | Create agency |
| PUT | `/api/agencies/:id` | AUTHENTICATED | Update agency |
| DELETE | `/api/agencies/:id` | AUTHENTICATED | Delete agency |
| POST | `/api/agencies/:id/logo` | AUTHENTICATED | Upload logo |
| POST | `/api/agencies/:id/providers` | AUTHENTICATED | Add provider |
| DELETE | `/api/agencies/:id/providers/:providerId` | AUTHENTICATED | Remove provider |
| PUT | `/api/agencies/:id/providers/:providerId/status` | AUTHENTICATED | Update provider status |
| POST | `/api/agencies/:id/admins` | AUTHENTICATED | Add admin |
| DELETE | `/api/agencies/:id/admins/:adminId` | AUTHENTICATED | Remove admin |
| GET | `/api/agencies/:id/analytics` | AUTHENTICATED | Get analytics |
| GET | `/api/agencies/my/agencies` | AUTHENTICATED | Get my agencies |
| POST | `/api/agencies/join` | AUTHENTICATED | Join agency |
| POST | `/api/agencies/leave` | AUTHENTICATED | Leave agency |

#### Data Model: Agency

```typescript
interface Agency {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  owner: string; // User ID
  admins: string[]; // User IDs
  providers: {
    user: string; // User ID
    status: 'active' | 'inactive' | 'pending';
    joinedAt: Date;
  }[];
  contact: {
    email?: string;
    phone?: string;
    website?: string;
  };
  location?: {
    address: string;
    city: string;
    state?: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  services?: string[]; // Service categories
  rating: {
    average: number;
    count: number;
  };
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 9. Facility Care (Recurring Services)

#### Description
Platform for recurring facility management services like janitorial, landscaping, and pest control.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| List Services | Browse facility services | P0 |
| Nearby Services | Location-based | P1 |
| Service Details | Full information | P0 |
| Create Service | Providers create | P0 |
| Update Service | Modify service | P0 |
| Delete Service | Remove service | P0 |
| Service Images | Upload images | P0 |
| Book Service | Create booking/contract | P0 |
| Booking Status | Manage bookings | P0 |
| Service Reviews | Ratings | P1 |
| My Services | Provider's services | P0 |
| My Bookings | User's contracts | P0 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/facility-care` | PUBLIC | Get services |
| GET | `/api/facility-care/nearby` | PUBLIC | Get nearby |
| GET | `/api/facility-care/:id` | PUBLIC | Get details |
| POST | `/api/facility-care` | provider, admin | Create service |
| PUT | `/api/facility-care/:id` | provider, admin | Update service |
| DELETE | `/api/facility-care/:id` | provider, admin | Delete service |
| POST | `/api/facility-care/:id/images` | provider, admin | Upload images |
| DELETE | `/api/facility-care/:id/images/:imageId` | provider, admin | Delete image |
| POST | `/api/facility-care/:id/book` | AUTHENTICATED | Book service |
| PUT | `/api/facility-care/:id/bookings/:bookingId/status` | AUTHENTICATED | Update booking |
| POST | `/api/facility-care/:id/reviews` | AUTHENTICATED | Add review |
| GET | `/api/facility-care/my-services` | AUTHENTICATED | Get my services |
| GET | `/api/facility-care/my-bookings` | AUTHENTICATED | Get my bookings |

---

### 10. Finance (Wallet & Payments)

#### Description
Complete financial system including wallet, top-ups, withdrawals, transactions, and reporting.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Financial Overview | Dashboard summary | P0 |
| Transaction History | All movements | P0 |
| Earnings Tracking | Provider/supplier income | P0 |
| Expense Tracking | Log expenses | P1 |
| Withdrawal Request | Cash out earnings | P0 |
| Withdrawal Processing | Admin approval | P0 |
| Top-Up Request | Add funds | P0 |
| Top-Up Processing | Admin approval | P0 |
| Financial Reports | Revenue reports | P1 |
| Tax Documents | Generate tax summaries | P2 |
| Wallet Settings | Payment preferences | P1 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/finance/overview` | AUTHENTICATED | Financial overview |
| GET | `/api/finance/transactions` | AUTHENTICATED | Get transactions |
| GET | `/api/finance/earnings` | AUTHENTICATED | Get earnings |
| GET | `/api/finance/expenses` | AUTHENTICATED | Get expenses |
| GET | `/api/finance/reports` | AUTHENTICATED | Get reports |
| POST | `/api/finance/expenses` | AUTHENTICATED | Add expense |
| POST | `/api/finance/withdraw` | AUTHENTICATED | Request withdrawal |
| PUT | `/api/finance/withdrawals/:withdrawalId/process` | admin | Process withdrawal |
| GET | `/api/finance/tax-documents` | AUTHENTICATED | Get tax documents |
| PUT | `/api/finance/wallet/settings` | AUTHENTICATED | Update wallet settings |
| POST | `/api/finance/top-up` | AUTHENTICATED | Request top-up |
| PUT | `/api/finance/top-ups/:topUpId/process` | admin | Process top-up |

#### Data Model: Transaction

```typescript
interface Transaction {
  _id: string;
  user: string; // User ID
  type: 'credit' | 'debit';
  category: 'booking_payment' | 'booking_earning' | 'withdrawal' | 'top_up' | 'refund' | 'subscription' | 'supply_order' | 'rental' | 'referral_bonus' | 'expense';
  amount: number;
  currency: string;
  balance: {
    before: number;
    after: number;
  };
  reference?: {
    type: 'booking' | 'order' | 'withdrawal' | 'top_up' | 'subscription' | 'rental';
    id: string;
  };
  description?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

---

### 11. LocalPro Plus (Subscriptions)

#### Description
Premium subscription service offering enhanced features and benefits to users.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| List Plans | Available subscription plans | P0 |
| Plan Details | Full plan information | P0 |
| Create Plan | Admin creates plans | P0 |
| Update Plan | Modify plans | P0 |
| Delete Plan | Remove plans | P0 |
| Subscribe | User subscribes to plan | P0 |
| Confirm Payment | Verify subscription payment | P0 |
| Cancel Subscription | User cancels | P0 |
| Renew Subscription | Manual/auto renewal | P0 |
| My Subscription | Current subscription | P0 |
| Subscription Settings | User preferences | P1 |
| Usage Tracking | Feature usage | P1 |
| Analytics | Admin metrics | P1 |
| Manual Subscription | Admin creates for user | P1 |
| Get All Subscriptions | Admin view all | P0 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/localpro-plus/plans` | PUBLIC | Get plans |
| GET | `/api/localpro-plus/plans/:id` | PUBLIC | Get plan details |
| POST | `/api/localpro-plus/plans` | admin | Create plan |
| PUT | `/api/localpro-plus/plans/:id` | admin | Update plan |
| DELETE | `/api/localpro-plus/plans/:id` | admin | Delete plan |
| POST | `/api/localpro-plus/subscribe/:planId` | AUTHENTICATED | Subscribe |
| POST | `/api/localpro-plus/confirm-payment` | AUTHENTICATED | Confirm payment |
| POST | `/api/localpro-plus/cancel` | AUTHENTICATED | Cancel subscription |
| POST | `/api/localpro-plus/renew` | AUTHENTICATED | Renew subscription |
| GET | `/api/localpro-plus/my-subscription` | AUTHENTICATED | Get my subscription |
| PUT | `/api/localpro-plus/settings` | AUTHENTICATED | Update settings |
| GET | `/api/localpro-plus/usage` | AUTHENTICATED | Get usage |
| GET | `/api/localpro-plus/analytics` | admin | Get analytics |
| POST | `/api/localpro-plus/admin/subscriptions` | admin | Create manual |
| GET | `/api/localpro-plus/admin/subscriptions` | admin | Get all |
| GET | `/api/localpro-plus/admin/subscriptions/user/:userId` | admin | Get by user |
| PUT | `/api/localpro-plus/admin/subscriptions/:subscriptionId` | admin | Update |
| DELETE | `/api/localpro-plus/admin/subscriptions/:subscriptionId` | admin | Delete |

#### Data Model: Subscription

```typescript
interface Subscription {
  _id: string;
  user: string; // User ID
  plan: string; // Plan ID
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing';
  currentPeriod: {
    start: Date;
    end: Date;
  };
  billing: {
    amount: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    nextBillingDate: Date;
  };
  payment: {
    method: string;
    lastPaymentDate?: Date;
    lastPaymentAmount?: number;
  };
  features: {
    name: string;
    limit?: number;
    used?: number;
  }[];
  autoRenew: boolean;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 12. Ads (Advertising Platform)

#### Description
Advertising platform for promoting services, supplies, and businesses.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| List Ads | Browse advertisements | P0 |
| Ad Categories | Organize by type | P0 |
| Featured Ads | Highlighted ads | P1 |
| Ad Details | Full ad information | P0 |
| Create Ad | Create advertisement | P0 |
| Update Ad | Modify ad | P0 |
| Delete Ad | Remove ad | P0 |
| Ad Images | Upload creatives | P0 |
| Promote Ad | Boost visibility | P1 |
| Click Tracking | Track clicks | P0 |
| Ad Analytics | Performance metrics | P0 |
| My Ads | Advertiser's ads | P0 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/ads` | PUBLIC | Get ads |
| GET | `/api/ads/categories` | PUBLIC | Get categories |
| GET | `/api/ads/enum-values` | PUBLIC | Get enum values |
| GET | `/api/ads/featured` | PUBLIC | Get featured |
| GET | `/api/ads/:id` | PUBLIC | Get ad details |
| POST | `/api/ads/:id/click` | PUBLIC | Track click |
| POST | `/api/ads` | AUTHENTICATED | Create ad |
| PUT | `/api/ads/:id` | AUTHENTICATED | Update ad |
| DELETE | `/api/ads/:id` | AUTHENTICATED | Delete ad |
| POST | `/api/ads/:id/images` | AUTHENTICATED | Upload images |
| DELETE | `/api/ads/:id/images/:imageId` | AUTHENTICATED | Delete image |
| POST | `/api/ads/:id/promote` | AUTHENTICATED | Promote ad |
| GET | `/api/ads/:id/analytics` | AUTHENTICATED | Get analytics |
| GET | `/api/ads/my-ads` | AUTHENTICATED | Get my ads |

---

### 13. Communication (Messaging)

#### Description
In-app messaging system for user-to-user and support communication.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| List Conversations | User's conversations | P0 |
| Get Conversation | Specific conversation | P0 |
| Create Conversation | Start new chat | P0 |
| Delete Conversation | Remove conversation | P0 |
| Get Messages | Conversation messages | P0 |
| Send Message | Text messages | P0 |
| File Attachments | Images, PDFs, docs | P1 |
| Update Message | Edit message | P1 |
| Delete Message | Remove message | P1 |
| Mark as Read | Read receipts | P0 |
| Notifications | System notifications | P0 |
| Notification Count | Unread badges | P0 |
| Mark All Read | Bulk mark read | P1 |
| Email Notification | Send via email | P1 |
| SMS Notification | Send via SMS | P1 |
| Search | Search conversations | P1 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/communication/conversations` | AUTHENTICATED | Get conversations |
| GET | `/api/communication/conversations/:id` | AUTHENTICATED | Get conversation |
| POST | `/api/communication/conversations` | AUTHENTICATED | Create conversation |
| DELETE | `/api/communication/conversations/:id` | AUTHENTICATED | Delete conversation |
| GET | `/api/communication/conversations/:id/messages` | AUTHENTICATED | Get messages |
| POST | `/api/communication/conversations/:id/messages` | AUTHENTICATED | Send message |
| PUT | `/api/communication/conversations/:id/messages/:messageId` | AUTHENTICATED | Update message |
| DELETE | `/api/communication/conversations/:id/messages/:messageId` | AUTHENTICATED | Delete message |
| PUT | `/api/communication/conversations/:id/read` | AUTHENTICATED | Mark as read |
| GET | `/api/communication/notifications` | AUTHENTICATED | Get notifications |
| GET | `/api/communication/notifications/count` | AUTHENTICATED | Get count |
| PUT | `/api/communication/notifications/:notificationId/read` | AUTHENTICATED | Mark read |
| PUT | `/api/communication/notifications/read-all` | AUTHENTICATED | Mark all read |
| DELETE | `/api/communication/notifications/:notificationId` | AUTHENTICATED | Delete |
| POST | `/api/communication/notifications/email` | AUTHENTICATED | Send email |
| POST | `/api/communication/notifications/sms` | AUTHENTICATED | Send SMS |
| GET | `/api/communication/unread-count` | AUTHENTICATED | Get unread |
| GET | `/api/communication/search` | AUTHENTICATED | Search |
| GET | `/api/communication/conversation-with/:userId` | AUTHENTICATED | Get with user |

---

### 14. Announcements

#### Description
Platform-wide announcement system for communicating with users.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| List Announcements | Public announcements | P0 |
| Get Announcement | Specific announcement | P0 |
| Create Announcement | Admin creates | P0 |
| Update Announcement | Modify announcement | P0 |
| Delete Announcement | Remove announcement | P0 |
| My Announcements | Targeted to user | P0 |
| Acknowledge | Mark as read | P0 |
| Add Comment | User comments | P1 |
| Statistics | Admin metrics | P1 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/announcements` | PUBLIC | Get announcements |
| GET | `/api/announcements/:id` | PUBLIC | Get announcement |
| GET | `/api/announcements/my/list` | AUTHENTICATED | Get my announcements |
| POST | `/api/announcements` | admin, agency_admin, agency_owner | Create |
| PUT | `/api/announcements/:id` | AUTHENTICATED | Update |
| DELETE | `/api/announcements/:id` | AUTHENTICATED | Delete |
| POST | `/api/announcements/:id/acknowledge` | AUTHENTICATED | Acknowledge |
| POST | `/api/announcements/:id/comments` | AUTHENTICATED | Add comment |
| GET | `/api/announcements/admin/statistics` | admin | Get statistics |

---

### 15. Activity Feed (Social)

#### Description
Social feed feature allowing users to post and interact with activities.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Activity Feed | Follow-based feed | P0 |
| My Activities | User's posts | P0 |
| User Activities | View other user's | P0 |
| Get Activity | Specific activity | P0 |
| Create Activity | Post content | P0 |
| Update Activity | Edit post | P0 |
| Delete Activity | Remove post | P0 |
| Add Interaction | Like, comment, share | P0 |
| Remove Interaction | Unlike, etc. | P0 |
| My Stats | Activity statistics | P1 |
| Global Stats | Admin analytics | P1 |
| Metadata | Activity types | P1 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/activities/feed` | AUTHENTICATED | Get feed |
| GET | `/api/activities/my` | AUTHENTICATED | Get my activities |
| GET | `/api/activities/user/:userId` | AUTHENTICATED | Get user activities |
| GET | `/api/activities/:id` | AUTHENTICATED | Get activity |
| POST | `/api/activities` | AUTHENTICATED | Create activity |
| PUT | `/api/activities/:id` | AUTHENTICATED | Update activity |
| DELETE | `/api/activities/:id` | AUTHENTICATED | Delete activity |
| POST | `/api/activities/:id/interactions` | AUTHENTICATED | Add interaction |
| DELETE | `/api/activities/:id/interactions` | AUTHENTICATED | Remove interaction |
| GET | `/api/activities/stats/my` | AUTHENTICATED | Get my stats |
| GET | `/api/activities/stats/global` | admin | Get global stats |
| GET | `/api/activities/metadata` | AUTHENTICATED | Get metadata |

---

### 16. Referrals

#### Description
Referral program for user acquisition and rewards.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Validate Code | Check referral code | P0 |
| Track Click | Track referral visits | P0 |
| Leaderboard | Top referrers | P1 |
| My Referrals | User's referrals | P0 |
| Referral Stats | User statistics | P0 |
| Referral Links | Generate links | P0 |
| Referral Rewards | View rewards | P0 |
| Send Invite | Email/SMS invites | P1 |
| Preferences | Referral settings | P1 |
| Process Referral | Admin completes | P0 |
| Analytics | Admin metrics | P1 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/referrals/validate` | PUBLIC | Validate code |
| POST | `/api/referrals/track` | PUBLIC | Track click |
| GET | `/api/referrals/leaderboard` | PUBLIC | Get leaderboard |
| GET | `/api/referrals/me` | AUTHENTICATED | Get my referrals |
| GET | `/api/referrals/stats` | AUTHENTICATED | Get stats |
| GET | `/api/referrals/links` | AUTHENTICATED | Get links |
| GET | `/api/referrals/rewards` | AUTHENTICATED | Get rewards |
| POST | `/api/referrals/invite` | AUTHENTICATED | Send invite |
| PUT | `/api/referrals/preferences` | AUTHENTICATED | Update preferences |
| POST | `/api/referrals/process` | admin | Process referral |
| GET | `/api/referrals/analytics` | admin | Get analytics |

---

### 17. Trust Verification

#### Description
Identity and credential verification system for building trust.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Verified Users | List verified users | P1 |
| List Requests | Pending verifications | P0 |
| Get Request | Specific request | P0 |
| Create Request | Submit for verification | P0 |
| Update Request | Modify request | P0 |
| Delete Request | Cancel request | P0 |
| Upload Documents | ID, certificates | P0 |
| Delete Document | Remove document | P0 |
| My Requests | User's requests | P0 |
| Review Request | Admin approval | P0 |
| Statistics | Admin metrics | P1 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/trust-verification/verified-users` | PUBLIC | Get verified users |
| GET | `/api/trust-verification/requests` | AUTHENTICATED | Get requests |
| GET | `/api/trust-verification/requests/:id` | AUTHENTICATED | Get request |
| POST | `/api/trust-verification/requests` | AUTHENTICATED | Create request |
| PUT | `/api/trust-verification/requests/:id` | AUTHENTICATED | Update request |
| DELETE | `/api/trust-verification/requests/:id` | AUTHENTICATED | Delete request |
| POST | `/api/trust-verification/requests/:id/documents` | AUTHENTICATED | Upload documents |
| DELETE | `/api/trust-verification/requests/:id/documents/:documentId` | AUTHENTICATED | Delete document |
| GET | `/api/trust-verification/my-requests` | AUTHENTICATED | Get my requests |
| PUT | `/api/trust-verification/requests/:id/review` | admin | Review request |
| GET | `/api/trust-verification/statistics` | admin | Get statistics |

---

### 18. Settings

#### Description
User and application settings management.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Get User Settings | User preferences | P0 |
| Update User Settings | Modify settings | P0 |
| Update Category | Update specific category | P0 |
| Reset Settings | Reset to defaults | P1 |
| Delete Settings | Remove all settings | P1 |
| Get App Settings | Global configuration | P0 |
| Update App Settings | Admin modifies | P0 |
| Toggle Features | Feature flags | P1 |
| Public Settings | Public configuration | P0 |
| App Health | System status | P0 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/settings` | PUBLIC | Get public settings |
| GET | `/api/settings/app/public` | PUBLIC | Get public app settings |
| GET | `/api/settings/app/health` | PUBLIC | Get app health |
| GET | `/api/settings/user` | AUTHENTICATED | Get user settings |
| PUT | `/api/settings/user` | AUTHENTICATED | Update user settings |
| PUT | `/api/settings/user/:category` | AUTHENTICATED | Update category |
| POST | `/api/settings/user/reset` | AUTHENTICATED | Reset settings |
| DELETE | `/api/settings/user` | AUTHENTICATED | Delete settings |
| GET | `/api/settings/app` | AUTHENTICATED | Get app settings |
| PUT | `/api/settings/app` | admin | Update app settings |
| PUT | `/api/settings/app/:category` | admin | Update category |
| POST | `/api/settings/app/features/toggle` | admin | Toggle feature |

---

### 19. Maps & Location

#### Description
Location services for geocoding, distance calculation, and nearby searches.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Geocode | Address to coordinates | P0 |
| Reverse Geocode | Coordinates to address | P0 |
| Place Search | Find places | P0 |
| Place Details | Get place info | P0 |
| Distance Calculation | Between points | P0 |
| Nearby Search | Find nearby items | P0 |
| Service Area Validation | Check coverage | P1 |
| Coverage Analysis | Map availability | P1 |
| Test Connection | Admin testing | P2 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/maps` | PUBLIC | Get maps info |
| POST | `/api/maps/geocode` | PUBLIC | Geocode address |
| POST | `/api/maps/reverse-geocode` | PUBLIC | Reverse geocode |
| POST | `/api/maps/places/search` | PUBLIC | Search places |
| GET | `/api/maps/places/:placeId` | PUBLIC | Get place details |
| POST | `/api/maps/distance` | PUBLIC | Calculate distance |
| POST | `/api/maps/nearby` | PUBLIC | Find nearby |
| POST | `/api/maps/validate-service-area` | PUBLIC | Validate area |
| POST | `/api/maps/analyze-coverage` | AUTHENTICATED | Analyze coverage |
| GET | `/api/maps/test` | admin | Test connection |

---

### 20. Payment Integrations

#### Description
Integration with payment providers for processing transactions.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| PayPal Webhook | Handle PayPal events | P0 |
| PayPal Events | View webhook events | P1 |
| PayMaya Webhook | Handle PayMaya events | P0 |
| PayMaya Checkout | Create checkout | P0 |
| PayMaya Payment | Create payment | P0 |
| PayMaya Invoice | Create invoice | P1 |
| Config Validation | Validate settings | P1 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/paypal/webhook` | PUBLIC | PayPal webhook |
| GET | `/api/paypal/webhook/events` | admin | Get events |
| POST | `/api/paymaya/webhook` | PUBLIC | PayMaya webhook |
| POST | `/api/paymaya/checkout` | AUTHENTICATED | Create checkout |
| GET | `/api/paymaya/checkout/:checkoutId` | AUTHENTICATED | Get checkout |
| POST | `/api/paymaya/payment` | AUTHENTICATED | Create payment |
| GET | `/api/paymaya/payment/:paymentId` | AUTHENTICATED | Get payment |
| POST | `/api/paymaya/invoice` | AUTHENTICATED | Create invoice |
| GET | `/api/paymaya/invoice/:invoiceId` | AUTHENTICATED | Get invoice |
| GET | `/api/paymaya/config/validate` | admin | Validate config |
| GET | `/api/paymaya/webhook/events` | admin | Get events |

---

### 21. Search

#### Description
Global search functionality across all platform entities.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Global Search | Search all entities | P0 |
| Suggestions | Autocomplete | P1 |
| Popular Searches | Trending | P1 |
| Advanced Search | Filters, sorting | P1 |
| Entity Search | Search by type | P0 |
| Categories | Search categories | P0 |
| Locations | Popular locations | P1 |
| Trending | Trending searches | P1 |
| Analytics | Track behavior | P2 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/search` | PUBLIC | Global search |
| GET | `/api/search/suggestions` | PUBLIC | Get suggestions |
| GET | `/api/search/popular` | PUBLIC | Get popular |
| GET | `/api/search/advanced` | PUBLIC | Advanced search |
| GET | `/api/search/entities/:type` | PUBLIC | Search by type |
| GET | `/api/search/categories` | PUBLIC | Get categories |
| GET | `/api/search/locations` | PUBLIC | Get locations |
| GET | `/api/search/trending` | PUBLIC | Get trending |
| POST | `/api/search/analytics` | admin | Track analytics |

---

### 22. AI Features

#### Description
AI-powered features for enhanced user experience and automation.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Natural Language Search | AI-powered search | P1 |
| Price Estimator | AI price suggestions | P1 |
| Service Matcher | Match to services | P1 |
| Review Sentiment | Analyze sentiment | P2 |
| Booking Assistant | AI booking help | P1 |
| Scheduling Assistant | Smart scheduling | P2 |
| Description Generator | Generate descriptions | P1 |
| Pricing Optimizer | Dynamic pricing | P2 |
| Demand Forecast | Predict demand | P2 |
| Review Insights | Aggregate analysis | P2 |
| Response Assistant | Generate responses | P2 |
| Listing Optimizer | Improve listings | P2 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/api/ai/marketplace/recommendations` | AUTHENTICATED | NL search |
| POST | `/api/ai/marketplace/price-estimator` | AUTHENTICATED | Price estimation |
| POST | `/api/ai/marketplace/service-matcher` | AUTHENTICATED | Service matching |
| POST | `/api/ai/marketplace/review-sentiment` | AUTHENTICATED | Sentiment analysis |
| POST | `/api/ai/marketplace/booking-assistant` | AUTHENTICATED | Booking assistant |
| POST | `/api/ai/marketplace/scheduling-assistant` | AUTHENTICATED | Scheduling |
| POST | `/api/ai/marketplace/description-generator` | provider, admin | Generate description |
| POST | `/api/ai/marketplace/pricing-optimizer` | provider, admin | Pricing optimization |
| POST | `/api/ai/marketplace/demand-forecast` | provider, admin | Demand forecast |
| POST | `/api/ai/marketplace/review-insights` | provider, admin | Review insights |
| POST | `/api/ai/marketplace/response-assistant` | provider, admin | Response assistant |
| POST | `/api/ai/marketplace/listing-optimizer` | provider, admin | Listing optimizer |

---

### 23. Analytics & Monitoring

#### Description
Platform analytics and system monitoring capabilities.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Overview Analytics | Platform metrics | P0 |
| User Analytics | User behavior | P1 |
| Marketplace Analytics | Sales metrics | P1 |
| Job Analytics | Job board metrics | P1 |
| Referral Analytics | Referral metrics | P1 |
| Agency Analytics | Agency metrics | P1 |
| Custom Analytics | Admin queries | P2 |
| Event Tracking | Track actions | P0 |
| Prometheus Metrics | System export | P1 |
| System Health | Health checks | P0 |
| Database Stats | DB performance | P1 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/analytics/overview` | AUTHENTICATED | Overview |
| GET | `/api/analytics/user` | AUTHENTICATED | User analytics |
| GET | `/api/analytics/marketplace` | AUTHENTICATED | Marketplace |
| GET | `/api/analytics/jobs` | AUTHENTICATED | Jobs |
| GET | `/api/analytics/referrals` | AUTHENTICATED | Referrals |
| GET | `/api/analytics/agencies` | AUTHENTICATED | Agencies |
| GET | `/api/analytics/custom` | admin | Custom |
| POST | `/api/analytics/track` | AUTHENTICATED | Track event |
| GET | `/api/monitoring/metrics` | PUBLIC | Prometheus |
| GET | `/api/monitoring/health` | PUBLIC | Health check |
| GET | `/api/monitoring/system-health` | PUBLIC | System health |
| GET | `/api/monitoring/database/stats` | PUBLIC | DB stats |

---

### 24. Logging & Audit

#### Description
System logging and audit trail for compliance and debugging.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Audit Logs | Admin action trail | P0 |
| Audit Stats | Log statistics | P1 |
| User Activity | User action logs | P1 |
| Export Logs | Download logs | P1 |
| Cleanup Logs | Retention management | P2 |
| System Logs | Application logs | P1 |
| Log Search | Global log search | P1 |
| Error Monitoring | Track errors | P0 |
| Error Details | Error information | P1 |
| Resolve Errors | Mark resolved | P1 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/audit-logs` | admin | Get audit logs |
| GET | `/api/audit-logs/stats` | admin | Get stats |
| GET | `/api/audit-logs/user/:userId/activity` | admin | User activity |
| GET | `/api/audit-logs/:auditId` | admin | Get details |
| GET | `/api/audit-logs/export/data` | admin | Export |
| POST | `/api/audit-logs/cleanup` | admin | Cleanup |
| GET | `/api/logs` | admin | Get system logs |
| GET | `/api/logs/stats` | admin | Log stats |
| GET | `/api/logs/search/global` | admin | Search logs |
| GET | `/api/error-monitoring/stats` | admin | Error stats |
| GET | `/api/error-monitoring/unresolved` | admin | Unresolved errors |
| GET | `/api/error-monitoring/:errorId` | admin | Error details |
| PATCH | `/api/error-monitoring/:errorId/resolve` | admin | Resolve error |

---

### 25. Real-Time Features

#### Description
Real-time communication and streaming capabilities.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Metrics Streaming | Live metrics (SSE) | P1 |
| Alert Streaming | Live alerts (SSE) | P1 |
| WebSocket Support | Real-time connection | P1 |
| Broadcaster | Mass notifications | P1 |
| Live Chat | Support chat | P2 |

#### API Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/monitoring/stream/stream` | PUBLIC | Metrics SSE |
| GET | `/api/monitoring/stream/alerts/stream` | PUBLIC | Alerts SSE |
| GET | `/api/monitoring/stream/ws` | PUBLIC | WebSocket |
| POST | `/api/monitoring/stream/broadcast` | PUBLIC | Broadcast |

---

### 26. Admin Dashboard

#### Description
Administrative interface for platform management.

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Dashboard Overview | Key metrics | P0 |
| User Management | All user operations | P0 |
| Content Moderation | Review content | P1 |
| Financial Management | Process transactions | P0 |
| System Configuration | App settings | P0 |
| Health Monitoring | System status | P0 |
| Activity Logs | Monitor actions | P1 |
| Error Tracking | Monitor errors | P1 |

---

## API Summary

| Category | Endpoint Count |
|----------|----------------|
| **Total Endpoints** | ~420+ |
| **Public Endpoints** | ~90 |
| **Authenticated Endpoints** | ~260+ |
| **Admin-Only Endpoints** | ~70 |

### Response Format

All API responses should follow this standard format:

```typescript
// Success Response
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Error Response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

### Authentication Header

```
Authorization: Bearer <jwt_token>
```

---

## Database Collections

| Collection | Description |
|------------|-------------|
| users | User accounts and profiles |
| providers | Provider-specific profiles |
| services | Marketplace service listings |
| bookings | Service bookings |
| supplies | Product listings |
| orders | Supply orders |
| courses | Academy courses |
| enrollments | Course enrollments |
| rentals | Rental item listings |
| rental_bookings | Rental reservations |
| jobs | Job listings |
| applications | Job applications |
| agencies | Agency profiles |
| transactions | Financial transactions |
| subscriptions | User subscriptions |
| plans | Subscription plans |
| ads | Advertisement listings |
| conversations | Chat conversations |
| messages | Chat messages |
| notifications | User notifications |
| announcements | Platform announcements |
| activities | Activity feed posts |
| referrals | Referral records |
| verification_requests | Trust verification requests |
| user_settings | User preferences |
| app_settings | Application configuration |
| audit_logs | Audit trail |
| system_logs | Application logs |
| errors | Error records |

---

## Integration Points

### External Services

| Service | Purpose |
|---------|---------|
| SMS Provider (Twilio) | Phone verification, notifications |
| Email Provider (SendGrid) | Email notifications |
| PayPal | Payment processing |
| PayMaya | Payment processing (Philippines) |
| Google Maps | Geocoding, place search |
| Cloud Storage (S3/GCS) | File storage |
| OpenAI | AI features |

### Webhook Endpoints

| Provider | Endpoint | Purpose |
|----------|----------|---------|
| PayPal | `/api/paypal/webhook` | Payment events |
| PayMaya | `/api/paymaya/webhook` | Payment events |

---

## Priority Legend

| Priority | Description |
|----------|-------------|
| P0 | Critical - Must have for MVP |
| P1 | High - Important for launch |
| P2 | Medium - Nice to have |
| P3 | Low - Future enhancement |

---

## Appendix

### Feature Documentation

Detailed documentation for each feature is available in the `features/` directory:

```
features/
├── academy/           # Academy feature docs
├── activity/          # Activity tracking docs
├── ads/               # Advertising docs
├── agencies/          # Agency management docs
├── analytics/         # Analytics docs
├── announcements/     # Announcements docs
├── bookings/          # Bookings docs
├── communication/     # Messaging docs
├── facility-care/     # Facility care docs
├── finance/           # Finance docs
├── jobs/              # Jobs docs
├── providers/         # Provider docs
├── referrals/         # Referral docs
├── rentals/           # Rentals docs
├── services/          # Services docs
├── subscriptions/     # Subscription docs
├── supplies/          # Supplies docs
├── trust-verification/# Verification docs
├── user-settings/     # User settings docs
└── users/             # User management docs
```

Each feature folder contains:
- `api-endpoints.md` - API endpoint documentation
- `data-entities.md` - Data model documentation
- `best-practices.md` - Implementation guidelines
- `usage-examples.md` - Code examples
- `README.md` - Feature overview

---

*This document serves as the complete specification for backend implementation of the LocalPro Super App.*

