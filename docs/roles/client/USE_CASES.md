# Client Use Cases

## Overview
This document describes the primary use cases for clients (end users) in the LocalPro Super App.

## Role Definition
**Client**: End users who book services, purchase supplies, enroll in courses, rent equipment, and use basic platform features.

## Use Cases

### UC-CL-001: User Registration and Onboarding
**Description**: New user registers and completes profile setup

**Actors**: Client

**Preconditions**: 
- User has valid phone number
- User has internet connection

**Main Flow**:
1. User requests verification code via `/api/auth/send-code`
2. System sends SMS verification code
3. User submits code via `/api/auth/verify-code`
4. System validates code and creates user account
5. User completes onboarding via `/api/auth/complete-onboarding`
6. User uploads profile photo via `/api/auth/upload-avatar`
7. System tracks profile completeness

**Postconditions**:
- User account created
- User authenticated
- Profile setup initiated

**Related Endpoints**:
- `POST /api/auth/send-code`
- `POST /api/auth/verify-code`
- `POST /api/auth/complete-onboarding`
- `POST /api/auth/upload-avatar`

---

### UC-CL-002: Browse and Search Services
**Description**: Client searches for services by category, location, or keywords

**Actors**: Client

**Preconditions**: 
- User is authenticated (optional for browsing)

**Main Flow**:
1. Client accesses marketplace via `/api/marketplace/services`
2. Client filters by category, location, price
3. Client views service details via `/api/marketplace/services/:id`
4. Client views provider profiles via `/api/marketplace/providers/:id`
5. Client searches nearby services via `/api/marketplace/services/nearby`

**Postconditions**:
- Client has list of relevant services
- Client can view service and provider details

**Related Endpoints**:
- `GET /api/marketplace/services`
- `GET /api/marketplace/services/:id`
- `GET /api/marketplace/providers/:id`
- `GET /api/marketplace/services/nearby`

---

### UC-CL-003: Book a Service
**Description**: Client books a service from a provider

**Actors**: Client

**Preconditions**: 
- User is authenticated
- Service exists and is available
- Provider is active

**Main Flow**:
1. Client selects service and provider
2. Client creates booking via `/api/marketplace/bookings`
3. System validates availability
4. Client provides booking details (date, address, notes)
5. Payment processed (PayPal/PayMaya)
6. Booking confirmed
7. Client receives confirmation notification

**Postconditions**:
- Booking created
- Payment processed
- Provider notified

**Related Endpoints**:
- `POST /api/marketplace/bookings`
- `GET /api/marketplace/bookings/:id`
- `POST /api/marketplace/bookings/paypal/approve`

---

### UC-CL-004: Manage Bookings
**Description**: Client views and manages their bookings

**Actors**: Client

**Preconditions**: 
- User is authenticated
- User has bookings

**Main Flow**:
1. Client views all bookings via `/api/marketplace/my-bookings`
2. Client views specific booking via `/api/marketplace/bookings/:id`
3. Client updates booking status (cancel if needed)
4. Client uploads photos during service via `/api/marketplace/bookings/:id/photos`
5. Client adds review after completion via `/api/marketplace/bookings/:id/review`

**Postconditions**:
- Client has updated booking information
- Review added if completed

**Related Endpoints**:
- `GET /api/marketplace/my-bookings`
- `GET /api/marketplace/bookings/:id`
- `PUT /api/marketplace/bookings/:id/status`
- `POST /api/marketplace/bookings/:id/photos`
- `POST /api/marketplace/bookings/:id/review`

---

### UC-CL-005: Search and Apply for Jobs
**Description**: Client searches for jobs and applies

**Actors**: Client

**Preconditions**: 
- User is authenticated

**Main Flow**:
1. Client searches jobs via `/api/jobs/search`
2. Client views job details via `/api/jobs/:id`
3. Client applies for job via `/api/jobs/:id/apply`
4. Client uploads resume
5. Client tracks applications via `/api/jobs/my-applications`

**Postconditions**:
- Job application submitted
- Application status tracked

**Related Endpoints**:
- `GET /api/jobs/search`
- `GET /api/jobs/:id`
- `POST /api/jobs/:id/apply`
- `GET /api/jobs/my-applications`

---

### UC-CL-006: Enroll in Academy Course
**Description**: Client enrolls in an academy course

**Actors**: Client

**Preconditions**: 
- User is authenticated
- Course exists and is available

**Main Flow**:
1. Client browses courses via `/api/academy/courses`
2. Client views course details via `/api/academy/courses/:id`
3. Client enrolls via `/api/academy/courses/:id/enroll`
4. Payment processed (if paid course)
5. Client accesses course content
6. Client tracks progress via `/api/academy/courses/:id/progress`
7. Client completes course and receives certificate

**Postconditions**:
- Course enrollment completed
- Access granted
- Progress tracked

**Related Endpoints**:
- `GET /api/academy/courses`
- `GET /api/academy/courses/:id`
- `POST /api/academy/courses/:id/enroll`
- `PUT /api/academy/courses/:id/progress`
- `GET /api/academy/my-courses`

---

### UC-CL-007: Purchase Supplies
**Description**: Client purchases supplies from suppliers

**Actors**: Client

**Preconditions**: 
- User is authenticated
- Supply exists and is in stock

**Main Flow**:
1. Client browses supplies via `/api/supplies`
2. Client views supply details via `/api/supplies/:id`
3. Client creates order via `/api/supplies/:id/order`
4. Payment processed
5. Client tracks order status
6. Client receives order
7. Client adds review via `/api/supplies/:id/reviews`

**Postconditions**:
- Order created
- Payment processed
- Order tracked

**Related Endpoints**:
- `GET /api/supplies`
- `GET /api/supplies/:id`
- `POST /api/supplies/:id/order`
- `GET /api/supplies/my-orders`
- `POST /api/supplies/:id/reviews`

---

### UC-CL-008: Rent Equipment
**Description**: Client rents equipment from providers

**Actors**: Client

**Preconditions**: 
- User is authenticated
- Rental item exists and is available

**Main Flow**:
1. Client browses rentals via `/api/rentals`
2. Client views rental details via `/api/rentals/:id`
3. Client books rental via `/api/rentals/:id/book`
4. Payment processed
5. Client receives equipment
6. Client returns equipment
7. Client adds review via `/api/rentals/:id/reviews`

**Postconditions**:
- Rental booking created
- Equipment rented

**Related Endpoints**:
- `GET /api/rentals`
- `GET /api/rentals/:id`
- `POST /api/rentals/:id/book`
- `GET /api/rentals/my-bookings`

---

### UC-CL-009: Manage Communication
**Description**: Client communicates with providers and other users

**Actors**: Client

**Preconditions**: 
- User is authenticated

**Main Flow**:
1. Client views conversations via `/api/communication/conversations`
2. Client creates conversation via `/api/communication/conversations`
3. Client sends messages via `/api/communication/conversations/:id/messages`
4. Client sends files/images as attachments
5. Client receives notifications via `/api/communication/notifications`
6. Client marks messages as read

**Postconditions**:
- Messages sent and received
- Notifications managed

**Related Endpoints**:
- `GET /api/communication/conversations`
- `POST /api/communication/conversations`
- `POST /api/communication/conversations/:id/messages`
- `GET /api/communication/notifications`

---

### UC-CL-010: View Financial Overview
**Description**: Client views financial transactions and balance

**Actors**: Client

**Preconditions**: 
- User is authenticated

**Main Flow**:
1. Client views financial overview via `/api/finance/overview`
2. Client views transactions via `/api/finance/transactions`
3. Client views earnings via `/api/finance/earnings`
4. Client views expenses via `/api/finance/expenses`
5. Client requests top-up via `/api/finance/top-up`
6. Client views tax documents via `/api/finance/tax-documents`

**Postconditions**:
- Financial information accessed

**Related Endpoints**:
- `GET /api/finance/overview`
- `GET /api/finance/transactions`
- `GET /api/finance/earnings`
- `GET /api/finance/expenses`
- `POST /api/finance/top-up`

---

## Summary
Clients have access to core platform features including service booking, job applications, course enrollment, supply purchases, equipment rentals, communication, and financial management. All client actions require authentication and follow standard workflows for booking, payment, and review processes.

