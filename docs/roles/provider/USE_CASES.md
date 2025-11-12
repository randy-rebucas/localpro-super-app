# Provider Use Cases

## Overview
This document describes the primary use cases for providers (service providers) in the LocalPro Super App.

## Role Definition
**Provider**: Service providers who offer services, manage bookings, track earnings, and build their business on the platform.

## Use Cases

### UC-PR-001: Provider Profile Creation
**Description**: User upgrades to provider role and creates provider profile

**Actors**: Provider

**Preconditions**: 
- User has client account
- User is authenticated

**Main Flow**:
1. User initiates provider profile creation via `/api/providers/profile`
2. User selects provider type (individual/business)
3. User adds business information
4. User adds professional information
5. User sets service areas
6. System creates provider profile with status `pending`

**Postconditions**:
- Provider profile created
- Onboarding process initiated
- Status: pending verification

**Related Endpoints**:
- `POST /api/providers/profile`
- `PUT /api/providers/onboarding/step`

---

### UC-PR-002: Provider Onboarding
**Description**: Provider completes onboarding steps

**Actors**: Provider

**Preconditions**: 
- Provider profile exists
- Status is pending

**Main Flow**:
1. Provider completes profile setup step
2. Provider adds business information
3. Provider adds professional information
4. Provider submits verification documents via `/api/providers/documents/upload`
5. Provider uploads licenses and certifications
6. Provider adds portfolio images
7. Provider sets preferences
8. Admin reviews and approves
9. Status changes to `active`

**Postconditions**:
- Onboarding completed
- Profile verified
- Provider can create services

**Related Endpoints**:
- `PUT /api/providers/onboarding/step`
- `POST /api/providers/documents/upload`
- `GET /api/providers/profile/me`

---

### UC-PR-003: Create Service Listing
**Description**: Provider creates a service listing

**Actors**: Provider

**Preconditions**: 
- Provider is authenticated
- Provider status is active

**Main Flow**:
1. Provider creates service via `/api/marketplace/services`
2. Provider adds service details (title, description, category)
3. Provider sets pricing and duration
4. Provider defines service area
5. Provider uploads service images via `/api/marketplace/services/:id/images`
6. Service becomes visible to clients

**Postconditions**:
- Service listing created
- Service visible in marketplace
- Clients can book service

**Related Endpoints**:
- `POST /api/marketplace/services`
- `POST /api/marketplace/services/:id/images`
- `GET /api/marketplace/my-services`

---

### UC-PR-004: Manage Service Listings
**Description**: Provider updates and manages service listings

**Actors**: Provider

**Preconditions**: 
- Provider has active services
- Provider is authenticated

**Main Flow**:
1. Provider views services via `/api/marketplace/my-services`
2. Provider selects service to update
3. Provider updates service details via `/api/marketplace/services/:id`
4. Provider updates pricing or availability
5. Provider adds/removes images
6. Provider deletes service if needed via `/api/marketplace/services/:id`

**Postconditions**:
- Service updated
- Changes reflected in marketplace

**Related Endpoints**:
- `GET /api/marketplace/my-services`
- `PUT /api/marketplace/services/:id`
- `DELETE /api/marketplace/services/:id`

---

### UC-PR-005: Manage Bookings
**Description**: Provider manages incoming bookings

**Actors**: Provider

**Preconditions**: 
- Provider has active services
- Bookings exist

**Main Flow**:
1. Provider views bookings via `/api/marketplace/my-bookings`
2. Provider reviews booking details
3. Provider confirms booking via `/api/marketplace/bookings/:id/status`
4. Provider updates status as service progresses
5. Provider marks booking as completed
6. Provider responds to reviews

**Postconditions**:
- Booking status updated
- Client notified

**Related Endpoints**:
- `GET /api/marketplace/my-bookings`
- `GET /api/marketplace/bookings/:id`
- `PUT /api/marketplace/bookings/:id/status`

---

### UC-PR-006: View Dashboard & Analytics
**Description**: Provider views dashboard and performance analytics

**Actors**: Provider

**Preconditions**: 
- Provider is authenticated
- Provider has activity

**Main Flow**:
1. Provider accesses dashboard via `/api/providers/dashboard/overview`
2. Provider views earnings summary
3. Provider views booking statistics
4. Provider views performance analytics via `/api/providers/analytics/performance`
5. Provider reviews recent activity
6. Provider checks notifications

**Postconditions**:
- Provider has insights into performance
- Provider can make data-driven decisions

**Related Endpoints**:
- `GET /api/providers/dashboard/overview`
- `GET /api/providers/analytics/performance`
- `GET /api/finance/overview`

---

### UC-PR-007: Manage Earnings & Withdrawals
**Description**: Provider manages earnings and requests withdrawals

**Actors**: Provider

**Preconditions**: 
- Provider has earnings
- Provider is authenticated

**Main Flow**:
1. Provider views earnings via `/api/finance/earnings`
2. Provider views financial overview via `/api/finance/overview`
3. Provider views transactions via `/api/finance/transactions`
4. Provider requests withdrawal via `/api/finance/withdraw`
5. Provider provides bank details
6. Admin processes withdrawal
7. Provider receives funds

**Postconditions**:
- Withdrawal requested
- Funds transferred

**Related Endpoints**:
- `GET /api/finance/overview`
- `GET /api/finance/earnings`
- `POST /api/finance/withdraw`

---

### UC-PR-008: Post Job Listing
**Description**: Provider posts job listing to hire workers

**Actors**: Provider

**Preconditions**: 
- Provider is authenticated
- Provider has business

**Main Flow**:
1. Provider creates job posting via `/api/jobs`
2. Provider adds job details (title, description, requirements)
3. Provider sets salary and benefits
4. Provider uploads company logo via `/api/jobs/:id/logo`
5. Job becomes visible to job seekers
6. Provider reviews applications via `/api/jobs/:id/applications`
7. Provider updates application status

**Postconditions**:
- Job listing created
- Applications received

**Related Endpoints**:
- `POST /api/jobs`
- `POST /api/jobs/:id/logo`
- `GET /api/jobs/:id/applications`
- `PUT /api/jobs/:id/applications/:applicationId/status`

---

### UC-PR-009: Use AI Tools
**Description**: Provider uses AI-powered tools for business optimization

**Actors**: Provider

**Preconditions**: 
- Provider is authenticated
- Provider has active services

**Main Flow**:
1. Provider uses price estimator via `/api/ai/marketplace/price-estimator`
2. Provider optimizes pricing via `/api/ai/marketplace/pricing-optimizer`
3. Provider generates service descriptions via `/api/ai/marketplace/description-generator`
4. Provider analyzes review insights via `/api/ai/marketplace/review-insights`
5. Provider optimizes listings via `/api/ai/marketplace/listing-optimizer`
6. Provider forecasts demand via `/api/ai/marketplace/demand-forecast`

**Postconditions**:
- Business optimized
- Better performance

**Related Endpoints**:
- `POST /api/ai/marketplace/price-estimator`
- `POST /api/ai/marketplace/pricing-optimizer`
- `POST /api/ai/marketplace/description-generator`
- `POST /api/ai/marketplace/review-insights`

---

### UC-PR-010: Manage Communication
**Description**: Provider communicates with clients

**Actors**: Provider

**Preconditions**: 
- Provider is authenticated

**Main Flow**:
1. Provider views conversations via `/api/communication/conversations`
2. Provider responds to client messages
3. Provider sends files/images
4. Provider receives notifications
5. Provider manages notification preferences

**Postconditions**:
- Communication maintained
- Client relationships strengthened

**Related Endpoints**:
- `GET /api/communication/conversations`
- `POST /api/communication/conversations/:id/messages`
- `GET /api/communication/notifications`

---

## Summary
Providers have comprehensive tools to manage their business including profile management, service listings, booking management, analytics, financial management, job postings, and AI-powered optimization tools. All provider actions require authentication and active provider status.

