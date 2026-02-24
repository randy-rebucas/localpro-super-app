# LocalPro Super App - Complete Business Flows Documentation

## Table of Contents
1. [Booking Flow](#1-booking-flow)
2. [Payment Flows](#2-payment-flows)
3. [Escrow Flow](#3-escrow-flow)
4. [Job Application Flow](#4-job-application-flow)
5. [Provider Onboarding Flow](#5-provider-onboarding-flow)
6. [Agency Management Flow](#6-agency-management-flow)
7. [Trust Verification Flow](#7-trust-verification-flow)
8. [Referral Flow](#8-referral-flow)
9. [Subscription Flow](#9-subscription-flow-localpro-plus)
10. [Academy/Learning Flow](#10-academylearning-flow)
11. [Communication Flow](#11-communication-flow)
12. [Live Chat Support Flow](#12-live-chat-support-flow)
13. [Supplies/Inventory Flow](#13-suppliesinventory-flow)
14. [Rentals Flow](#14-rentals-flow)
15. [Notification Flow](#15-notification-flow)
16. [Search & Discovery Flow](#16-search--discovery-flow)
17. [Availability & Scheduling Flow](#17-availability--scheduling-flow)
18. [Finance & Wallet Flow](#18-finance--wallet-flow)
19. [Webhook Flow](#19-webhook-flow)
20. [Background Automation Flows](#20-background-automation-flows)

---

## 1. Booking Flow

### Overview
The marketplace booking flow handles service bookings between clients and providers, from discovery to completion and review. All new bookings go through an **admin review step** before being dispatched to the provider.

### Flow Diagram
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MARKETPLACE BOOKING FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

CLIENT                    ADMIN                 SYSTEM                  PROVIDER
   │                        │                     │                        │
   │  1. Browse/Search       │                     │                        │
   │────────────────────────────────────────────>│                        │
   │  GET /marketplace/services[?location=lat,lng]│                        │
   │  GET /marketplace/services/nearby            │                        │
   │  GET /marketplace/services/featured          │                        │
   │                        │                     │                        │
   │  2. View Service        │                     │                        │
   │────────────────────────────────────────────>│                        │
   │  GET /marketplace/services/:id               │                        │
   │  GET /marketplace/services/slug/:slug        │                        │
   │                        │                     │                        │
   │  3. Create Booking      │                     │                        │
   │────────────────────────────────────────────>│                        │
   │  POST /marketplace/bookings                  │                        │
   │  { serviceId, bookingDate, bookingTime,      │                        │
   │    duration, paymentMethod, address }        │                        │
   │                        │                     │                        │
   │                        │                     │  4. Validate & Create   │
   │                        │                     │  - Joi schema validate  │
   │                        │                     │  - Check availability   │
   │                        │                     │  - Calculate pricing    │
   │                        │                     │  - Create Escrow        │
   │                        │                     │  status: pending_admin_review
   │                        │                     │                        │
   │                        │  5. Notify Admins   │                        │
   │                        │<────────────────────│                        │
   │                        │  "New booking       │                        │
   │                        │   pending review"   │                        │
   │                        │                     │                        │
   │                        │  6. Review & Dispatch                        │
   │                        │─────────────────────>                        │
   │                        │  POST /bookings/:id/admin-review             │
   │                        │                     │  status: pending       │
   │                        │                     │                        │
   │                        │                     │  7. Notify Provider    │
   │                        │                     │───────────────────────>│
   │                        │                     │  Push + Email          │
   │                        │                     │                        │
   │                        │                     │  8. Provider Confirms  │
   │                        │                     │<───────────────────────│
   │                        │                     │  POST /bookings/:id/confirm
   │                        │                     │  status: confirmed     │
   │                        │                     │                        │
   │  9. Client Notified     │                     │                        │
   │<────────────────────────────────────────────│                        │
   │                        │                     │                        │
   │  [SERVICE DAY]          │                     │                        │
   │                        │                     │                        │
   │                        │                     │  10. Provider Starts   │
   │                        │                     │<───────────────────────│
   │                        │                     │  POST /bookings/:id/start
   │                        │                     │  status: in_progress   │
   │                        │                     │                        │
   │                        │                     │  11. GPS Tracking Active│
   │                        │                     │<───────────────────────│
   │                        │                     │  POST /bookings/:id/location
   │                        │                     │  POST /bookings/:id/arrived
   │                        │                     │                        │
   │                        │                     │  12. Upload Before Photos
   │                        │                     │<───────────────────────│
   │                        │                     │  POST /bookings/:id/photos
   │                        │                     │                        │
   │                        │                     │  [SERVICE COMPLETED]   │
   │                        │                     │                        │
   │                        │                     │  13. Provider Completes│
   │                        │                     │<───────────────────────│
   │                        │                     │  POST /bookings/:id/complete
   │                        │                     │  - Upload after photos │
   │                        │                     │  - Add completion notes│
   │                        │                     │  - Submit proof of work│
   │                        │                     │  status: completed     │
   │                        │                     │                        │
   │  14. Client Sign-Off    │                     │                        │
   │────────────────────────────────────────────>│                        │
   │  POST /bookings/:id/signoff                  │                        │
   │  { signature }         │                     │                        │
   │                        │                     │                        │
   │  15. Leave Reviews      │                     │                        │
   │────────────────────────────────────────────>│                        │
   │  POST /bookings/:id/reviews/client           │                        │
   │  POST /bookings/:id/tip (optional)           │                        │
   │                        │                     │                        │
   │                        │                     │  16. Release Escrow    │
   │                        │                     │  - Pay provider        │
   │                        │                     │  - Update ratings      │
   │                        │                     │───────────────────────>│
   │                        │                     │                        │
   └────────────────────────┴─────────────────────┴────────────────────────┘
```

### State Transitions
```
┌─────────────────────┐   admin_review   ┌─────────┐   confirm   ┌───────────┐
│ PENDING_ADMIN_REVIEW │─────────────────>│ PENDING │────────────>│ CONFIRMED │
└─────────────────────┘                  └─────────┘             └───────────┘
         │                                    │                        │
         │ admin_reject                       │ cancel                 │ start
         │                                    │                        │
         v                                    v                        v
  ┌───────────┐                        ┌───────────┐         ┌─────────────┐
  │ CANCELLED │                        │ CANCELLED │         │ IN_PROGRESS │
  └───────────┘                        └───────────┘         └─────────────┘
                                                                      │
                                                                      │ complete
                                                                      │
                                                                      v
                                                              ┌───────────┐
                                                              │ COMPLETED │
                                                              └───────────┘
```

### API Endpoints

#### Public Service Routes
| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| GET | `/api/marketplace/services` | Browse services (supports filters + geospatial) | Public |
| GET | `/api/marketplace/services/categories` | List service categories | Public |
| GET | `/api/marketplace/services/categories/:category` | Category details | Public |
| GET | `/api/marketplace/services/featured` | Featured services | Public |
| GET | `/api/marketplace/services/nearby` | Geospatial nearby search (`?lat=&lng=&radius=`) | Public |
| GET | `/api/marketplace/services/slug/:slug` | Get service by URL slug | Public |
| GET | `/api/marketplace/services/:id` | View service details | Public |
| GET | `/api/marketplace/services/:id/reviews` | Service reviews | Public |
| GET | `/api/marketplace/services/:id/providers` | Providers for a service | Public |
| GET | `/api/marketplace/providers/:id` | Provider profile | Public |
| GET | `/api/marketplace/providers/:providerId/services` | Provider's services | Public |

#### Authenticated Routes
| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| GET | `/api/marketplace/my-services` | My listed services | Provider |
| GET | `/api/marketplace/my-bookings` | My bookings | Auth User |

#### Service Management (Provider/Admin)
| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| POST | `/api/marketplace/services` | Create service | Provider/Admin |
| PUT | `/api/marketplace/services/:id` | Update service | Provider/Admin |
| DELETE | `/api/marketplace/services/:id` | Delete service | Provider/Admin |
| PATCH | `/api/marketplace/services/:id/deactivate` | Deactivate service | Provider/Admin |
| PATCH | `/api/marketplace/services/:id/activate` | Activate service | Provider/Admin |
| POST | `/api/marketplace/services/:id/images` | Upload service images | Provider/Admin |
| POST | `/api/marketplace/services/:id/submit` | Submit for admin review | Provider |
| POST | `/api/marketplace/services/:id/archive` | Archive service | Provider/Admin |
| PUT | `/api/marketplace/services/:id/seo` | Update SEO metadata | Provider/Admin |
| POST | `/api/marketplace/services/:id/promotions` | Create promotion | Provider/Admin |
| DELETE | `/api/marketplace/services/:id/promotions` | End promotion | Provider/Admin |
| PUT | `/api/marketplace/services/:id/availability` | Update availability | Provider/Admin |
| GET | `/api/marketplace/services/:id/analytics` | Service analytics | Provider/Admin |
| POST | `/api/marketplace/services/:id/packages` | Add service package | Provider/Admin |
| PUT | `/api/marketplace/services/:id/packages/:packageId` | Update package | Provider/Admin |
| DELETE | `/api/marketplace/services/:id/packages/:packageId` | Delete package | Provider/Admin |
| POST | `/api/marketplace/services/:id/addons` | Add add-on | Provider/Admin |
| PUT | `/api/marketplace/services/:id/addons/:addonId` | Update add-on | Provider/Admin |
| DELETE | `/api/marketplace/services/:id/addons/:addonId` | Delete add-on | Provider/Admin |
| POST | `/api/marketplace/services/:id/external-ids` | Link external system ID | Provider/Admin |

#### Service Approval Workflow (Admin)
| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| GET | `/api/marketplace/services/pending-review` | Services pending review | Admin |
| POST | `/api/marketplace/services/:id/approve` | Approve service listing | Admin |
| POST | `/api/marketplace/services/:id/reject` | Reject service listing | Admin |
| POST | `/api/marketplace/services/:id/feature` | Feature a service | Admin |
| DELETE | `/api/marketplace/services/:id/feature` | Unfeature a service | Admin |

#### Category Management (Admin)
| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| GET | `/api/marketplace/services/categories/manage` | Admin category list | Admin |
| POST | `/api/marketplace/services/categories` | Create category | Admin |
| PUT | `/api/marketplace/services/categories/:id` | Update category | Admin |
| DELETE | `/api/marketplace/services/categories/:id` | Delete category | Admin |

#### Booking - Core Workflow
| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| POST | `/api/marketplace/bookings` | Create booking | Client |
| GET | `/api/marketplace/bookings` | List bookings | Auth User |
| GET | `/api/marketplace/bookings/stats` | Booking statistics | Auth User |
| GET | `/api/marketplace/bookings/number/:bookingNumber` | Get by booking number | Auth User |
| GET | `/api/marketplace/bookings/:id` | View booking details | Participant |
| PUT | `/api/marketplace/bookings/:id/status` | Update booking status | Auth User |
| POST | `/api/marketplace/bookings/:id/photos` | Upload before/after photos | Provider |
| POST | `/api/marketplace/bookings/:id/admin-review` | Review & dispatch booking | Admin |
| POST | `/api/marketplace/bookings/:id/confirm` | Confirm booking | Provider |
| POST | `/api/marketplace/bookings/:id/start` | Start service | Provider |
| POST | `/api/marketplace/bookings/:id/complete` | Mark service complete | Provider |
| POST | `/api/marketplace/bookings/:id/cancel` | Cancel booking | Client/Provider |
| POST | `/api/marketplace/bookings/:id/reschedule` | Reschedule booking | Client/Provider |
| POST | `/api/marketplace/bookings/:id/signoff` | Client digital sign-off | Client |

#### Booking - GPS Tracking
| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| POST | `/api/marketplace/bookings/:id/location` | Update provider GPS location | Provider |
| POST | `/api/marketplace/bookings/:id/arrived` | Mark provider as arrived | Provider |
| GET | `/api/marketplace/bookings/:id/location-history` | Get location history | Participant |

#### Booking - Disputes
| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| POST | `/api/marketplace/bookings/:id/dispute` | Open a dispute | Client/Provider |
| POST | `/api/marketplace/bookings/:id/dispute/evidence` | Add dispute evidence | Client/Provider |
| POST | `/api/marketplace/bookings/:id/dispute/messages` | Add dispute message | Client/Provider |
| GET | `/api/marketplace/bookings/disputes` | List all disputed bookings | Admin |
| POST | `/api/marketplace/bookings/:id/dispute/resolve` | Resolve dispute | Admin |

#### Booking - Reviews & Tips
| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| POST | `/api/marketplace/bookings/:id/review` | Leave review (with photos) | Client |
| POST | `/api/marketplace/bookings/:id/reviews/client` | Structured client review | Client |
| POST | `/api/marketplace/bookings/:id/reviews/provider` | Provider rates client | Provider |
| POST | `/api/marketplace/bookings/:id/reviews/respond` | Respond to a review | Provider |
| POST | `/api/marketplace/bookings/:id/tip` | Add tip to completed booking | Client |

#### Booking - Payments
| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| POST | `/api/marketplace/bookings/paypal/approve` | Approve PayPal booking payment | Client |
| GET | `/api/marketplace/bookings/paypal/order/:orderId` | Get PayPal order details | Client |
| POST | `/api/marketplace/bookings/:id/external-ids` | Link external system ID | Admin |

### Booking Object Structure
```javascript
{
  _id: ObjectId,
  bookingNumber: String,       // Human-readable unique number
  service: ObjectId,           // Reference to Service
  client: ObjectId,            // Reference to User (client)
  provider: ObjectId,          // Reference to User (provider)
  bookingDate: Date,
  bookingTime: String,         // "HH:MM" 24-hour format
  duration: Number,            // in hours
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: { lat, lng }
  },
  specialInstructions: String,
  status: "pending_admin_review" | "pending" | "confirmed" | "in_progress" | "completed" | "cancelled",
  pricing: {
    basePrice: Number,
    additionalFees: [{ description, amount }],
    totalAmount: Number,
    currency: "USD" | "PHP"
  },
  payment: {
    status: "pending" | "paid" | "refunded" | "failed",
    method: "paypal" | "paymongo" | "bpi" | "cash",
    transactionId: String,
    escrowProvider: String,
    paidAt: Date
  },
  tracking: {
    providerLocation: { type: "Point", coordinates: [lng, lat] },
    locationHistory: [{ coordinates, timestamp, accuracy }],
    arrivedAt: Date
  },
  review: {
    rating: Number,            // 1-5
    comment: String,
    categories: { quality, timeliness, communication, value },
    photos: []
  },
  providerReview: {
    rating: Number,
    comment: String
  },
  dispute: {
    isDisputed: Boolean,
    reason: String,
    reasonCode: String,
    description: String,
    raisedBy: ObjectId,
    raisedAt: Date,
    evidence: [{ type, url, description, uploadedBy, uploadedAt }],
    messages: [{ sender, message, timestamp }],
    resolution: { outcome, notes, resolvedBy, resolvedAt }
  },
  signoff: {
    signed: Boolean,
    signedAt: Date,
    signedBy: ObjectId,
    signature: String
  },
  timeline: [{ status, timestamp, note, updatedBy }],
  beforePhotos: [],
  afterPhotos: [],
  completionNotes: String,
  tip: { amount: Number, currency: String, paidAt: Date }
}
```

### Service Listing Lifecycle
```
┌──────────┐  submit   ┌─────────────────┐  approve  ┌────────┐
│  DRAFT   │──────────>│ PENDING_REVIEW  │──────────>│ ACTIVE │
└──────────┘           └─────────────────┘           └────────┘
                              │                           │
                              │ reject                    │ archive / deactivate
                              │                           │
                              v                           v
                        ┌──────────┐               ┌──────────┐
                        │ REJECTED │               │ ARCHIVED │
                        └──────────┘               └──────────┘
```

### GPS Tracking Flow
```
Provider starts service
   │
   v
POST /bookings/:id/location  (every ~30 sec from provider app)
   { lat, lng, accuracy }
   │
   v
Location stored in tracking.locationHistory
Client can see real-time provider location
   │
   v
POST /bookings/:id/arrived
   │
   v
booking.tracking.arrivedAt = now
Client notified: "Provider has arrived"
```

### Inline Booking Dispute Flow
```
Client or Provider opens dispute
POST /bookings/:id/dispute
{ reason, reasonCode, description }
   │
   v
booking.dispute.isDisputed = true
Escrow status → DISPUTE
Admins notified
   │
Both parties add evidence & messages
POST /bookings/:id/dispute/evidence
POST /bookings/:id/dispute/messages
   │
   v
Admin resolves
POST /bookings/:id/dispute/resolve
{ outcome: "refund_client" | "pay_provider" | "split", notes }
   │
   v
Escrow released accordingly
```

### Automated Processes
| Service | Schedule | Action |
|---------|----------|--------|
| `automatedBookingService` | Every 30 min | Send reminders (24h, 2h before) |
| `automatedMarketplaceNoShowService` | Hourly | Detect and handle no-shows |
| `automatedMarketplaceBookingFollowUpService` | Daily 9 AM | Request reviews for completed bookings |

### Rescheduling Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                     RESCHEDULE FLOW                              │
└─────────────────────────────────────────────────────────────────┘

1. Client/Provider requests reschedule
   POST /api/marketplace/bookings/:id/reschedule
   Body: { newDate, reason }

2. System validates:
   - Booking is confirmed (not completed/cancelled)
   - New date is available
   - Within reschedule policy window

3. If other party approval needed:
   - Create RescheduleRequest
   - Notify other party
   - Wait for approval

4. On approval:
   - Update booking date
   - Update timeline
   - Notify both parties
   - Update availability calendar

5. If rejected:
   - Keep original date
   - Notify requester
```

---

## 2. Payment Flows

### 2.1 PayPal Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      PAYPAL PAYMENT FLOW                         │
└─────────────────────────────────────────────────────────────────┘

CLIENT                          SERVER                         PAYPAL
   │                              │                               │
   │  1. Initiate Payment         │                               │
   │─────────────────────────────>│                               │
   │  POST /api/paypal/create-order                               │
   │  { bookingId, amount }       │                               │
   │                              │                               │
   │                              │  2. Create PayPal Order       │
   │                              │──────────────────────────────>│
   │                              │  PayPal API: /v2/checkout/orders
   │                              │                               │
   │                              │  3. Order Created             │
   │                              │<──────────────────────────────│
   │                              │  { orderId, approveUrl }      │
   │                              │                               │
   │  4. Redirect to PayPal       │                               │
   │<─────────────────────────────│                               │
   │  { approvalUrl }             │                               │
   │                              │                               │
   │  5. User Approves            │                               │
   │─────────────────────────────────────────────────────────────>│
   │  (PayPal checkout page)      │                               │
   │                              │                               │
   │  6. PayPal Redirects Back    │                               │
   │<─────────────────────────────────────────────────────────────│
   │  /success?token=xxx          │                               │
   │                              │                               │
   │  7. Capture Payment          │                               │
   │─────────────────────────────>│                               │
   │  POST /api/paypal/capture    │                               │
   │  { orderId }                 │                               │
   │                              │                               │
   │                              │  8. Capture Funds             │
   │                              │──────────────────────────────>│
   │                              │  /v2/checkout/orders/:id/capture
   │                              │                               │
   │                              │  9. Payment Captured          │
   │                              │<──────────────────────────────│
   │                              │                               │
   │                              │  10. Update Records           │
   │                              │  - Booking payment status     │
   │                              │  - Escrow status              │
   │                              │  - Finance transaction        │
   │                              │                               │
   │  11. Success Response        │                               │
   │<─────────────────────────────│                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### PayPal Webhook Events
```javascript
// Webhook: POST /api/webhooks/paypal
{
  event_type: "PAYMENT.CAPTURE.COMPLETED",
  resource: {
    id: "capture_id",
    status: "COMPLETED",
    amount: { currency_code: "USD", value: "100.00" }
  }
}

// Handled Events:
"PAYMENT.CAPTURE.COMPLETED"     -> Mark payment successful
"PAYMENT.CAPTURE.DENIED"        -> Mark payment failed
"PAYMENT.CAPTURE.REFUNDED"      -> Process refund
"BILLING.SUBSCRIPTION.ACTIVATED"-> Activate subscription
"BILLING.SUBSCRIPTION.CANCELLED"-> Cancel subscription
"BILLING.SUBSCRIPTION.PAYMENT.FAILED" -> Trigger dunning
```

### 2.2 PayMongo Payment Flow (Escrow & Subscriptions)

PayMongo uses the **hosted checkout session** flow for both booking escrow payments and LocalPro Plus subscriptions.

```
┌─────────────────────────────────────────────────────────────────┐
│                PAYMONGO CHECKOUT SESSION FLOW                    │
└─────────────────────────────────────────────────────────────────┘

CLIENT                          SERVER                       PAYMONGO
   │                              │                               │
   │  1. Initiate Payment         │                               │
   │─────────────────────────────>│                               │
   │  (e.g. create booking or     │                               │
   │   subscribe to LP+ plan)     │                               │
   │                              │                               │
   │                              │  2. Create Checkout Session   │
   │                              │──────────────────────────────>│
   │                              │  POST /v1/checkout_sessions   │
   │                              │  { line_items, metadata,      │
   │                              │    payment_method_types,      │
   │                              │    success_url, cancel_url }  │
   │                              │                               │
   │                              │  3. Session Created           │
   │                              │<──────────────────────────────│
   │                              │  { id, checkout_url }         │
   │                              │                               │
   │  4. Redirect to PayMongo     │                               │
   │<─────────────────────────────│                               │
   │  { checkoutUrl, sessionId }  │                               │
   │                              │                               │
   │  5. User Completes Payment   │                               │
   │─────────────────────────────────────────────────────────────>│
   │  (PayMongo hosted page)      │                               │
   │                              │                               │
   │                              │  6. Webhook: Payment Paid     │
   │                              │<──────────────────────────────│
   │                              │  POST /webhooks/paymongo      │
   │                              │  event: checkout_session      │
   │                              │        .payment.paid          │
   │                              │                               │
   │                              │  7. Verify HMAC Signature     │
   │                              │  (Paymongo-Signature header)  │
   │                              │  reject if >5 minutes old     │
   │                              │                               │
   │                              │  8. Update Records            │
   │                              │  - Subscription/Booking status│
   │                              │  - Escrow status              │
   │                              │  - Create Payment audit record│
   │                              │                               │
   │  9. Frontend Polls           │                               │
   │─────────────────────────────>│                               │
   │  GET/POST confirm-payment    │                               │
   │  { sessionId }               │                               │
   │<─────────────────────────────│                               │
   │  { activated: true, ... }    │                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### PayMongo Webhook
| Setting | Value |
|---------|-------|
| Endpoint | `POST /webhooks/paymongo` |
| Event to subscribe | `checkout_session.payment.paid` |
| Signature header | `Paymongo-Signature` (`t=<ts>,te=<hmac>,li=<hmac>`) |
| Algorithm | HMAC-SHA256 over `timestamp + "." + rawBody` |
| Replay protection | Reject events older than 5 minutes |

```javascript
// Webhook payload shape
{
  data: {
    attributes: {
      type: "checkout_session.payment.paid",
      data: {
        attributes: {
          id: "cs_xxx",           // checkout session id
          status: "paid",
          metadata: {
            userId: "...",        // matched to subscription/booking
            planId: "...",
            billingCycle: "monthly"
          }
        }
      }
    }
  }
}
```

### Payment Status Tracking
```
┌─────────┐     ┌──────────┐     ┌───────────┐     ┌───────────┐
│ PENDING │────>│PROCESSING│────>│ COMPLETED │ OR  │  FAILED   │
└─────────┘     └──────────┘     └───────────┘     └───────────┘
                                       │
                                       v
                                ┌───────────┐
                                │ REFUNDED  │
                                └───────────┘
```

---

## 3. Escrow Flow

### Overview
The escrow system provides secure payment holding, ensuring both client and provider protection during service transactions.

### Complete Escrow Flow Diagram
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ESCROW LIFECYCLE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

CLIENT                          SYSTEM                         PROVIDER
   │                              │                               │
   │  1. Book Service             │                               │
   │─────────────────────────────>│                               │
   │                              │                               │
   │                              │  2. Create Escrow             │
   │                              │  status: CREATED              │
   │                              │                               │
   │  3. Make Payment             │                               │
   │─────────────────────────────>│                               │
   │                              │                               │
   │                              │  4. Hold Funds                │
   │                              │  status: FUNDS_HELD           │
   │                              │  - Authorization created      │
   │                              │  - Funds reserved             │
   │                              │                               │
   │                              │  [SERVICE BEGINS]             │
   │                              │                               │
   │                              │  5. Service In Progress       │
   │                              │<──────────────────────────────│
   │                              │  status: IN_PROGRESS          │
   │                              │                               │
   │                              │  6. Submit Proof of Work      │
   │                              │<──────────────────────────────│
   │                              │  POST /escrows/:id/proof      │
   │                              │  - Before/after photos        │
   │                              │  - Completion notes           │
   │                              │  - Documents                  │
   │                              │                               │
   │  7. Review Work              │                               │
   │<─────────────────────────────│                               │
   │  Notification: Review needed │                               │
   │                              │                               │
   ├──────────────────────────────┼───────────────────────────────┤
   │         HAPPY PATH           │        DISPUTE PATH           │
   ├──────────────────────────────┼───────────────────────────────┤
   │                              │                               │
   │  8a. Approve Work            │  8b. Raise Dispute            │
   │─────────────────────────────>│─────────────────────────────> │
   │  POST /escrows/:id/approve   │  POST /escrows/:id/dispute    │
   │                              │  { reason, evidence }         │
   │                              │                               │
   │                              │  9a. Release Funds            │
   │                              │  status: COMPLETE             │
   │                              │                               │
   │                              │  10a. Payout Provider         │
   │                              │──────────────────────────────>│
   │                              │  status: PAYOUT_COMPLETED     │
   │                              │                               │
   │                              │  9b. Dispute Created          │
   │                              │  status: DISPUTE              │
   │                              │  - Admin notified             │
   │                              │                               │
   │                              │  10b. Provider Response       │
   │                              │<──────────────────────────────│
   │                              │  Submit evidence              │
   │                              │                               │
   │                              │  11b. Admin Reviews           │
   │                              │  - Review all evidence        │
   │                              │  - Make decision              │
   │                              │                               │
   │                              │  12b. Resolution              │
   │                              │  REFUND_CLIENT                │
   │<─────────────────────────────│  OR PAYOUT_PROVIDER           │
   │                              │──────────────────────────────>│
   │                              │  OR SPLIT (partial)           │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Escrow State Machine
```
                                    ┌─────────┐
                                    │ CREATED │
                                    └────┬────┘
                                         │ payment_captured
                                         v
                                  ┌─────────────┐
                                  │ FUNDS_HELD  │
                                  └──────┬──────┘
                                         │ service_started
                                         v
                                  ┌─────────────┐
                                  │ IN_PROGRESS │
                                  └──────┬──────┘
                              ┌──────────┴──────────┐
                              │                     │
                        client_approves        client_disputes
                              │                     │
                              v                     v
                       ┌──────────┐           ┌─────────┐
                       │ COMPLETE │           │ DISPUTE │
                       └────┬─────┘           └────┬────┘
                            │                      │
                    payout_initiated          admin_resolves
                            │                      │
                            v              ┌───────┴───────┐
                  ┌─────────────────┐      │       │       │
                  │PAYOUT_INITIATED │      v       v       v
                  └────────┬────────┘  REFUND  PAYOUT   SPLIT
                           │           CLIENT  PROVIDER
                    payout_completed       │       │       │
                           │               v       v       v
                           v           ┌──────────────────────┐
                  ┌─────────────────┐  │      REFUNDED /      │
                  │PAYOUT_COMPLETED │  │  PAYOUT_COMPLETED    │
                  └─────────────────┘  └──────────────────────┘
```

### API Endpoints
| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| POST | `/api/escrows/create` | Create escrow for booking | System |
| GET | `/api/escrows` | List my escrows | Auth User |
| GET | `/api/escrows/:id` | View escrow details | Participant |
| POST | `/api/escrows/:id/capture` | Capture payment | System |
| POST | `/api/escrows/:id/proof-of-work` | Submit work proof | Provider |
| POST | `/api/escrows/:id/approve` | Approve work | Client |
| POST | `/api/escrows/:id/dispute` | Raise dispute | Client/Provider |
| POST | `/api/escrows/:id/dispute/respond` | Respond to dispute | Provider |
| POST | `/api/escrows/:id/dispute/resolve` | Resolve dispute | Admin |
| POST | `/api/escrows/:id/refund` | Process refund | Admin |
| POST | `/api/escrows/:id/payout` | Process payout | System |
| GET | `/api/escrows/:id/transactions` | Audit log | Admin |

### Escrow Object Structure
```javascript
{
  id: UUID,
  bookingId: ObjectId,
  clientId: ObjectId,
  providerId: ObjectId,
  amount: Number,              // Amount in cents
  currency: "USD" | "PHP" | "EUR" | "GBP" | "JPY",
  holdProvider: "paymongo" | "xendit" | "stripe" | "paypal",
  providerHoldId: String,      // Payment authorization ID
  status: "CREATED" | "FUNDS_HELD" | "IN_PROGRESS" | "COMPLETE" |
          "DISPUTE" | "REFUNDED" | "PAYOUT_INITIATED" | "PAYOUT_COMPLETED",
  proofOfWork: {
    uploadedAt: Date,
    documents: [{
      type: String,
      url: String,
      uploadedAt: Date,
      metadata: { fileSize, mimeType }
    }],
    notes: String
  },
  clientApproval: {
    approved: Boolean,
    approvedAt: Date,
    notes: String
  },
  dispute: {
    raised: Boolean,
    raisedAt: Date,
    raisedBy: ObjectId,
    reason: String,
    evidence: [{ type, url, uploadedAt }],
    adminResolution: {
      decidedAt: Date,
      decidedBy: ObjectId,
      decision: "REFUND_CLIENT" | "PAYOUT_PROVIDER" | "SPLIT",
      notes: String
    }
  }
}
```

### Dispute Resolution Options
| Decision | Client Receives | Provider Receives |
|----------|-----------------|-------------------|
| `REFUND_CLIENT` | 100% refund | 0% |
| `PAYOUT_PROVIDER` | 0% | 100% payout |
| `SPLIT` | Partial refund | Partial payout |

### Automated Processes
| Service | Schedule | Action |
|---------|----------|--------|
| `automatedEscrowService` | Hourly | Auto-release after approval window |
| `automatedEscrowDisputeEscalationService` | Hourly | Escalate stale disputes |

---

## 4. Job Application Flow

### Flow Diagram
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         JOB APPLICATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

EMPLOYER                        SYSTEM                        APPLICANT
   │                              │                               │
   │  1. Post Job                 │                               │
   │─────────────────────────────>│                               │
   │  POST /api/jobs              │                               │
   │  { title, description,       │                               │
   │    requirements, salary }    │                               │
   │                              │                               │
   │                              │  2. Job Active                │
   │                              │  - Indexed for search         │
   │                              │  - Visible on job board       │
   │                              │                               │
   │                              │                               │  3. Browse Jobs
   │                              │<──────────────────────────────│
   │                              │  GET /api/jobs?filters        │
   │                              │                               │
   │                              │                               │  4. View Job
   │                              │<──────────────────────────────│
   │                              │  GET /api/jobs/:id            │
   │                              │                               │
   │                              │                               │  5. Apply
   │                              │<──────────────────────────────│
   │                              │  POST /api/jobs/:id/apply     │
   │                              │  { coverLetter, resume,       │
   │                              │    expectedSalary }           │
   │                              │                               │
   │  6. Notification             │                               │
   │<─────────────────────────────│                               │
   │  New application received    │                               │
   │                              │                               │
   │  7. Review Applications      │                               │
   │─────────────────────────────>│                               │
   │  GET /api/jobs/:id/applications                              │
   │                              │                               │
   │  8. Update Status            │                               │
   │─────────────────────────────>│                               │
   │  PUT /applications/:id/status│                               │
   │  { status: "shortlisted" }   │                               │
   │                              │                               │
   │                              │  9. Notify Applicant          │
   │                              │──────────────────────────────>│
   │                              │  "You've been shortlisted!"   │
   │                              │                               │
   │  10. Schedule Interview      │                               │
   │─────────────────────────────>│                               │
   │  POST /applications/:id/interview                            │
   │  { date, time, type }        │                               │
   │                              │                               │
   │                              │  11. Interview Invite         │
   │                              │──────────────────────────────>│
   │                              │                               │
   │  [INTERVIEW CONDUCTED]       │                               │
   │                              │                               │
   │  12. Submit Feedback         │                               │
   │─────────────────────────────>│                               │
   │  PUT /interviews/:id/feedback│                               │
   │  { rating, comments,         │                               │
   │    recommendation }          │                               │
   │                              │                               │
   │  13. Final Decision          │                               │
   │─────────────────────────────>│                               │
   │  PUT /applications/:id/status│                               │
   │  { status: "hired" }         │                               │
   │                              │                               │
   │                              │  14. Offer Sent               │
   │                              │──────────────────────────────>│
   │                              │  Congratulations!             │
   │                              │                               │
   │  15. Close Job               │                               │
   │─────────────────────────────>│                               │
   │  PUT /api/jobs/:id           │                               │
   │  { status: "filled" }        │                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Application States
```
┌─────────┐   review   ┌───────────┐  shortlist  ┌─────────────┐
│ PENDING │───────────>│ REVIEWING │────────────>│ SHORTLISTED │
└─────────┘            └───────────┘             └──────┬──────┘
                                                        │
                                                  interview
                                                        │
                                                        v
                                                ┌─────────────┐
                                                │ INTERVIEWED │
                                                └──────┬──────┘
                                         ┌─────────────┴─────────────┐
                                         │                           │
                                       hired                      rejected
                                         │                           │
                                         v                           v
                                    ┌────────┐                 ┌──────────┐
                                    │ HIRED  │                 │ REJECTED │
                                    └────────┘                 └──────────┘
```

### Job Statuses
```
┌───────┐   publish   ┌────────┐   pause    ┌────────┐
│ DRAFT │────────────>│ ACTIVE │───────────>│ PAUSED │
└───────┘             └───┬────┘            └───┬────┘
                          │                     │
                    ┌─────┴─────┐               │
                    │           │         resume│
                 filled       close             │
                    │           │               │
                    v           v               │
               ┌────────┐  ┌────────┐          │
               │ FILLED │  │ CLOSED │<─────────┘
               └────────┘  └────────┘
```

---

## 5. Provider Onboarding Flow

### Complete Onboarding Journey
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROVIDER ONBOARDING FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

NEW USER                        SYSTEM                         ADMIN
   │                              │                               │
   │  1. Register as Client       │                               │
   │─────────────────────────────>│                               │
   │  (Standard registration)     │                               │
   │                              │                               │
   │  2. Request Provider Role    │                               │
   │─────────────────────────────>│                               │
   │  POST /api/auth/roles/request│                               │
   │  { role: "provider",         │                               │
   │    providerType: "individual"}                               │
   │                              │                               │
   │                              │  3. Create Provider Profile   │
   │                              │  - status: "pending"          │
   │                              │  - onboarding.progress: 10%   │
   │                              │                               │
   │  ═══════════════════════════════════════════════════════════ │
   │                     STEP 1: PROFILE SETUP (20%)              │
   │  ═══════════════════════════════════════════════════════════ │
   │                              │                               │
   │  4. Basic Profile            │                               │
   │─────────────────────────────>│                               │
   │  PUT /api/providers/onboarding/profile                       │
   │  { bio, profilePhoto,        │                               │
   │    contactPreferences }      │                               │
   │                              │                               │
   │  ═══════════════════════════════════════════════════════════ │
   │                    STEP 2: PROFESSIONAL INFO (40%)           │
   │  ═══════════════════════════════════════════════════════════ │
   │                              │                               │
   │  5. Skills & Experience      │                               │
   │─────────────────────────────>│                               │
   │  PUT /api/providers/onboarding/professional                  │
   │  { skills: [], experience,   │                               │
   │    certifications,           │                               │
   │    serviceAreas: [] }        │                               │
   │                              │                               │
   │  ═══════════════════════════════════════════════════════════ │
   │                     STEP 3: SERVICES (60%)                   │
   │  ═══════════════════════════════════════════════════════════ │
   │                              │                               │
   │  6. Create First Service     │                               │
   │─────────────────────────────>│                               │
   │  POST /api/marketplace/services                              │
   │  { title, description,       │                               │
   │    category, pricing,        │                               │
   │    availability }            │                               │
   │                              │                               │
   │  ═══════════════════════════════════════════════════════════ │
   │                   STEP 4: VERIFICATION (80%)                 │
   │  ═══════════════════════════════════════════════════════════ │
   │                              │                               │
   │  7. Identity Verification    │                               │
   │─────────────────────────────>│                               │
   │  PUT /api/providers/verification                             │
   │  { governmentId: { front, back },                            │
   │    selfie, proofOfAddress }  │                               │
   │                              │                               │
   │                              │  8. Submit for Review         │
   │                              │──────────────────────────────>│
   │                              │  Verification request created │
   │                              │                               │
   │  ═══════════════════════════════════════════════════════════ │
   │                   STEP 5: FINANCIAL (100%)                   │
   │  ═══════════════════════════════════════════════════════════ │
   │                              │                               │
   │  9. Payment Setup            │                               │
   │─────────────────────────────>│                               │
   │  PUT /api/providers/onboarding/financial                     │
   │  { bankAccount, taxId,       │                               │
   │    payoutPreferences }       │                               │
   │                              │                               │
   │                              │  10. Onboarding Complete      │
   │                              │  onboarding.completed: true   │
   │                              │  progress: 100%               │
   │                              │                               │
   │                              │                               │  11. Review
   │                              │<──────────────────────────────│
   │                              │  Admin reviews documents      │
   │                              │                               │
   │                              │                               │  12. Approve
   │                              │<──────────────────────────────│
   │                              │  PUT /admin/providers/:id     │
   │                              │  { status: "active" }         │
   │                              │                               │
   │  13. Activation Notice       │                               │
   │<─────────────────────────────│                               │
   │  "Your provider account      │                               │
   │   is now active!"            │                               │
   │                              │                               │
   │  14. Start Accepting Jobs    │                               │
   │  Provider dashboard active   │                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Onboarding Progress Tracking
```javascript
onboarding: {
  completed: false,
  currentStep: "profile_setup",
  progress: 20,  // percentage
  steps: [
    { step: "profile_setup", completed: true, completedAt: Date },
    { step: "professional_info", completed: false },
    { step: "services", completed: false },
    { step: "verification", completed: false },
    { step: "financial", completed: false }
  ]
}
```

### Provider Types & Requirements
| Type | Business Info Required | Verification Level |
|------|------------------------|-------------------|
| Individual | No | Identity only |
| Business | Yes (business name, registration) | Identity + Business |
| Agency | Yes (full business details) | Identity + Business + Insurance |

---

## 6. Agency Management Flow

### Agency Creation & Setup
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AGENCY MANAGEMENT FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

OWNER                           SYSTEM                         PROVIDERS
   │                              │                               │
   │  1. Create Agency            │                               │
   │─────────────────────────────>│                               │
   │  POST /api/agencies          │                               │
   │  { name, description,        │                               │
   │    contact, business,        │                               │
   │    services, serviceAreas }  │                               │
   │                              │                               │
   │                              │  2. Agency Created            │
   │                              │  - Owner auto-added as admin  │
   │                              │  - Geocode address            │
   │                              │                               │
   │  3. Upload Verification Docs │                               │
   │─────────────────────────────>│                               │
   │  PUT /api/agencies/:id/verification                          │
   │  { businessLicense,          │                               │
   │    insurance, taxCert }      │                               │
   │                              │                               │
   │  4. Add Admin/Manager        │                               │
   │─────────────────────────────>│                               │
   │  POST /api/agencies/:id/admins                               │
   │  { userId, role: "manager",  │                               │
   │    permissions: [...] }      │                               │
   │                              │                               │
   │  5. Invite Providers         │                               │
   │─────────────────────────────>│                               │
   │  POST /api/agencies/:id/providers/invite                     │
   │  { email, commissionRate }   │                               │
   │                              │                               │
   │                              │  6. Invitation Sent           │
   │                              │──────────────────────────────>│
   │                              │  Email with invitation link   │
   │                              │                               │
   │                              │                               │  7. Accept
   │                              │<──────────────────────────────│
   │                              │  POST /agencies/:id/providers/accept
   │                              │                               │
   │                              │  8. Provider Added            │
   │                              │  status: "pending"            │
   │                              │                               │
   │  9. Approve Provider         │                               │
   │─────────────────────────────>│                               │
   │  PUT /agencies/:id/providers/:id                             │
   │  { status: "active" }        │                               │
   │                              │                               │
   │                              │  10. Provider Active          │
   │                              │──────────────────────────────>│
   │                              │  Can now work under agency    │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Agency Booking Flow (Commission)
```
┌─────────────────────────────────────────────────────────────────┐
│              AGENCY BOOKING WITH COMMISSION                      │
└─────────────────────────────────────────────────────────────────┘

1. Client books agency provider's service
   - Service linked to agency

2. Payment processed ($100)

3. Commission calculated:
   - Agency commission: 15% ($15)
   - Provider earnings: 85% ($85)

4. Escrow completion:
   - Agency wallet credited: $15
   - Provider wallet credited: $85

5. Analytics updated:
   - Agency totalRevenue += $100
   - Provider performance updated
```

### Agency Roles & Permissions
| Role | Permissions |
|------|-------------|
| Owner | Full access (all permissions) |
| Admin | Manage providers, view analytics, edit settings |
| Manager | Manage providers, view analytics |
| Supervisor | View providers, view analytics |

---

## 7. Trust Verification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TRUST VERIFICATION FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

USER                            SYSTEM                         ADMIN
   │                              │                               │
   │  1. Submit Verification      │                               │
   │─────────────────────────────>│                               │
   │  POST /api/trust-verification│                               │
   │  { type: "identity",         │                               │
   │    documents: [...],         │                               │
   │    personalInfo: {...} }     │                               │
   │                              │                               │
   │                              │  2. Request Created           │
   │                              │  status: "pending"            │
   │                              │                               │
   │                              │  3. Admin Notified            │
   │                              │──────────────────────────────>│
   │                              │  New verification request     │
   │                              │                               │
   │                              │                               │  4. Review
   │                              │<──────────────────────────────│
   │                              │  GET /trust-verification/:id  │
   │                              │                               │
   │                              │                               │  5. Decision
   │                              │<──────────────────────────────│
   │                              │  POST /:id/approve            │
   │                              │  OR POST /:id/reject          │
   │                              │  OR POST /:id/revision        │
   │                              │                               │
   │  6a. Approved               │                               │
   │<─────────────────────────────│                               │
   │  User trust score updated   │                               │
   │  Badge added to profile     │                               │
   │                              │                               │
   │  6b. Needs Revision         │                               │
   │<─────────────────────────────│                               │
   │  "Please resubmit documents"│                               │
   │                              │                               │
   │  7. Resubmit                 │                               │
   │─────────────────────────────>│                               │
   │  PUT /api/trust-verification/:id                             │
   │  { documents: [...] }        │                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Verification Types
| Type | Documents Required | Badge Awarded |
|------|-------------------|---------------|
| `identity` | Government ID, Selfie | ID Verified |
| `background` | Background check consent | Background Cleared |
| `license` | Professional license | Licensed Professional |
| `business` | Business registration | Registered Business |
| `insurance` | Insurance certificate | Insured |
| `address` | Utility bill, Bank statement | Address Verified |

### Trust Score Calculation
```javascript
trustScore = (
  identityVerified * 20 +
  backgroundCheck * 20 +
  professionalLicense * 15 +
  businessRegistration * 15 +
  insuranceVerified * 15 +
  addressVerified * 10 +
  responseTimeScore * 5
) / 100 * 100  // Normalized to 0-100
```

---

## 8. Referral Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REFERRAL FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

REFERRER                        SYSTEM                         NEW USER
   │                              │                               │
   │  1. Get Referral Link        │                               │
   │─────────────────────────────>│                               │
   │  GET /api/referrals/links    │                               │
   │                              │                               │
   │  2. Link Generated           │                               │
   │<─────────────────────────────│                               │
   │  https://app.com/r/ABC123    │                               │
   │                              │                               │
   │  3. Share Link               │                               │
   │═══════════════════════════════════════════════════════════> │
   │  (Email, SMS, Social Media)  │                               │
   │                              │                               │
   │                              │                               │  4. Click Link
   │                              │<──────────────────────────────│
   │                              │  Track: source, campaign,     │
   │                              │  IP, user agent               │
   │                              │                               │
   │                              │                               │  5. Register
   │                              │<──────────────────────────────│
   │                              │  POST /api/auth/register      │
   │                              │  { referralCode: "ABC123" }   │
   │                              │                               │
   │                              │  6. Referral Linked           │
   │                              │  status: "pending"            │
   │                              │  - Referee gets welcome bonus │
   │                              │                               │
   │                              │  [QUALIFYING ACTION]          │
   │                              │  (First booking completed OR  │
   │                              │   First payout received)      │
   │                              │                               │
   │                              │  7. Referral Completed        │
   │                              │  status: "completed"          │
   │                              │                               │
   │  8. Reward Credited          │                               │
   │<─────────────────────────────│                               │
   │  $10 added to wallet         │                               │
   │                              │                               │
   │  9. Tier Progress            │                               │
   │  totalReferrals++            │                               │
   │  successfulReferrals++       │                               │
   │  Check tier milestone        │                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Referral Types & Rewards
| Referral Type | Referrer Reward | Referee Reward |
|---------------|-----------------|----------------|
| `signup` | $10 credit | $5 credit |
| `service_booking` | 10% of booking | 15% discount |
| `supplies_purchase` | 5% of purchase | 10% discount |
| `course_enrollment` | $20 credit | 20% discount |
| `rental_booking` | 8% of rental | 12% discount |
| `subscription_upgrade` | 30 days free | 15 days free |

### Referral Tiers
| Tier | Referrals Required | Bonus Multiplier |
|------|-------------------|------------------|
| Bronze | 0-4 | 1.0x |
| Silver | 5-14 | 1.25x |
| Gold | 15-29 | 1.5x |
| Platinum | 30+ | 2.0x |

---

## 9. Subscription Flow (LocalPro Plus)

### Supported Payment Methods
- **PayPal** — recurring subscription via PayPal Billing Agreements
- **PayMongo** — hosted checkout session (one-time per cycle, async webhook activation)

> PayMaya has been removed from the LocalPro Plus subscription flow.

### PayPal Subscription Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   LOCALPRO PLUS - PAYPAL SUBSCRIPTION FLOW                   │
└─────────────────────────────────────────────────────────────────────────────┘

USER                            SYSTEM                         PAYPAL
   │                              │                               │
   │  1. View Plans               │                               │
   │─────────────────────────────>│                               │
   │  GET /api/localpro-plus/plans│                               │
   │                              │                               │
   │  2. Subscribe (PayPal)       │                               │
   │─────────────────────────────>│                               │
   │  POST /api/localpro-plus/subscribe                           │
   │  { planId, billingCycle: "monthly"|"yearly",                 │
   │    paymentMethod: "paypal" } │                               │
   │                              │                               │
   │                              │  3. Create PayPal Subscription│
   │                              │──────────────────────────────>│
   │                              │  POST /v1/billing/subscriptions
   │                              │                               │
   │                              │  4. Approval URL              │
   │                              │<──────────────────────────────│
   │                              │  { subscriptionId, approveUrl}│
   │                              │                               │
   │  5. Redirect to PayPal       │                               │
   │<─────────────────────────────│                               │
   │                              │                               │
   │  6. User Approves            │                               │
   │─────────────────────────────────────────────────────────────>│
   │                              │                               │
   │                              │  7. Webhook: Activated        │
   │                              │<──────────────────────────────│
   │                              │  BILLING.SUBSCRIPTION.ACTIVATED│
   │                              │                               │
   │                              │  8. Activate Subscription     │
   │                              │  - status → active            │
   │                              │  - user.localProPlusSubscription linked
   │                              │  - Send welcome email         │
   │                              │                               │
   │  ════════════════════════════════════════════════════════════│
   │                    MONTHLY RENEWAL                           │
   │  ════════════════════════════════════════════════════════════│
   │                              │                               │
   │                              │  9. Webhook: Renewal          │
   │                              │<──────────────────────────────│
   │                              │  BILLING.SUBSCRIPTION.PAYMENT │
   │                              │  .COMPLETED                   │
   │                              │                               │
   │                              │  10. Extend Subscription      │
   │                              │  endDate += 30 days           │
   │                              │                               │
   │  ════════════════════════════════════════════════════════════│
   │                    PAYMENT FAILURE                           │
   │  ════════════════════════════════════════════════════════════│
   │                              │                               │
   │                              │  11. Webhook: Failed          │
   │                              │<──────────────────────────────│
   │                              │  BILLING.SUBSCRIPTION.PAYMENT │
   │                              │  .FAILED                      │
   │                              │                               │
   │                              │  12. Dunning Process          │
   │                              │  - Retry payment (3x)         │
   │                              │  - Send reminder emails       │
   │                              │  - Grace period (7 days)      │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### PayMongo Subscription Flow (Hosted Checkout)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  LOCALPRO PLUS - PAYMONGO SUBSCRIPTION FLOW                  │
└─────────────────────────────────────────────────────────────────────────────┘

USER                            SYSTEM                       PAYMONGO
   │                              │                               │
   │  1. Subscribe (PayMongo)     │                               │
   │─────────────────────────────>│                               │
   │  POST /api/localpro-plus/subscribe                           │
   │  { planId, billingCycle,     │                               │
   │    paymentMethod: "paymongo"}│                               │
   │                              │                               │
   │                              │  2. Create Checkout Session   │
   │                              │──────────────────────────────>│
   │                              │  POST /v1/checkout_sessions   │
   │                              │  metadata: { userId, planId,  │
   │                              │    billingCycle }             │
   │                              │                               │
   │                              │  3. Session Created           │
   │                              │<──────────────────────────────│
   │                              │  { id: "cs_xxx", checkout_url}│
   │                              │                               │
   │                              │  4. Save Pending Subscription  │
   │                              │  status: "pending"            │
   │                              │  paymentDetails.paymongoSessionId: "cs_xxx"
   │                              │                               │
   │  5. Redirect to PayMongo     │                               │
   │<─────────────────────────────│                               │
   │  { checkoutUrl, sessionId }  │                               │
   │                              │                               │
   │  6. User Pays on PayMongo    │                               │
   │─────────────────────────────────────────────────────────────>│
   │  (Hosted checkout page)      │                               │
   │                              │                               │
   │                              │  7. Webhook: Payment Paid     │
   │                              │<──────────────────────────────│
   │                              │  POST /webhooks/paymongo      │
   │                              │  event: checkout_session      │
   │                              │        .payment.paid          │
   │                              │                               │
   │                              │  8. Verify HMAC signature     │
   │                              │  9. Match subscription by     │
   │                              │     paymongoSessionId         │
   │                              │  10. Activate subscription    │
   │                              │   - status → active           │
   │                              │   - startDate, endDate set    │
   │                              │   - nextBillingDate set       │
   │                              │                               │
   │  11. Frontend Polls          │                               │
   │─────────────────────────────>│                               │
   │  POST /api/localpro-plus/confirm-payment                     │
   │  { sessionId, paymentMethod: "paymongo" }                    │
   │                              │                               │
   │                              │  12. Fresh DB fetch by sessionId
   │                              │  If active: create Payment    │
   │                              │  record, update user link,    │
   │                              │  send welcome email (once)    │
   │                              │                               │
   │  13. Activation Confirmed    │                               │
   │<─────────────────────────────│                               │
   │  { activated: true, plan }   │                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Webhook Configuration
| Gateway | Endpoint | Event | Notes |
|---------|----------|-------|-------|
| PayPal | `POST /webhooks/paypal` | `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.PAYMENT.COMPLETED`, `BILLING.SUBSCRIPTION.PAYMENT.FAILED`, `BILLING.SUBSCRIPTION.CANCELLED` | Verified via PayPal cert |
| PayMongo | `POST /webhooks/paymongo` | `checkout_session.payment.paid` | HMAC-SHA256, replay protection |

### Confirm-Payment Polling (PayMongo)
The frontend polls after redirecting back from PayMongo's hosted page:
```
POST /api/localpro-plus/confirm-payment
Body: { sessionId: "cs_xxx", paymentMethod: "paymongo" }

Response (pending):  { activated: false, plan: null }
Response (active):   { success: true, activated: true, plan: {...}, data: {...} }
```
The endpoint is **idempotent** — calling it multiple times will not create duplicate Payment records or send duplicate emails.

### Cancellation Flow
```
USER                            SYSTEM
   │                              │
   │  Cancel Subscription         │
   │─────────────────────────────>│
   │  POST /api/localpro-plus/cancel                              │
   │                              │
   │                              │  - Cancel at gateway (PayPal)
   │                              │  - status → cancelled
   │                              │  - cancelledAt, cancellationReason saved
   │                              │  - Access remains until endDate
   │                              │
   │  Cancellation Confirmed      │
   │<─────────────────────────────│
   │  "Access until MM/DD/YYYY"   │
```

### Subscription States
```
┌─────────┐   payment   ┌────────┐
│ PENDING │────────────>│ ACTIVE │<─────────────┐
└─────────┘             └───┬────┘              │
                            │                   │
              ┌─────────────┼─────────────┐     │
              │             │             │     │
          cancel      payment_fail    renew     │
              │             │             │     │
              v             v             └─────┘
        ┌───────────┐ ┌──────────────┐
        │ CANCELLED │ │PAYMENT_FAILED│
        └─────┬─────┘ └──────┬───────┘
              │              │
        expires        grace_period_ends
              │              │
              v              v
        ┌─────────┐    ┌───────────┐
        │ EXPIRED │    │ SUSPENDED │
        └─────────┘    └───────────┘
```

### Plan Features
| Feature | Basic | Professional | Enterprise |
|---------|-------|--------------|------------|
| Featured Listings | 1/month | 5/month | Unlimited |
| Priority Support | No | Yes | Dedicated |
| Analytics | Basic | Advanced | Custom |
| Commission Rate | 15% | 12% | 10% |
| API Access | No | Limited | Full |
| White Label | No | No | Yes |

---

## 10. Academy/Learning Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ACADEMY LEARNING FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

STUDENT                         SYSTEM                        INSTRUCTOR
   │                              │                               │
   │  1. Browse Courses           │                               │
   │─────────────────────────────>│                               │
   │  GET /api/academy/courses    │                               │
   │                              │                               │
   │  2. View Course Details      │                               │
   │─────────────────────────────>│                               │
   │  GET /api/academy/courses/:id│                               │
   │                              │                               │
   │  3. Enroll in Course         │                               │
   │─────────────────────────────>│                               │
   │  POST /api/academy/courses/:id/enroll                        │
   │  { paymentMethod }           │                               │
   │                              │                               │
   │                              │  4. Process Payment           │
   │                              │  (if paid course)             │
   │                              │                               │
   │                              │  5. Create Enrollment         │
   │                              │  status: "enrolled"           │
   │                              │  progress: 0%                 │
   │                              │                               │
   │  6. Access Course Content    │                               │
   │─────────────────────────────>│                               │
   │  GET /api/academy/courses/:id/lessons                        │
   │                              │                               │
   │  7. Watch/Read Lesson        │                               │
   │─────────────────────────────>│                               │
   │  GET /api/academy/lessons/:id│                               │
   │                              │                               │
   │  8. Complete Lesson          │                               │
   │─────────────────────────────>│                               │
   │  POST /api/academy/lessons/:id/complete                      │
   │                              │                               │
   │                              │  9. Update Progress           │
   │                              │  progress += lessonWeight     │
   │                              │  status: "in_progress"        │
   │                              │                               │
   │  [REPEAT FOR ALL LESSONS]    │                               │
   │                              │                               │
   │  10. Take Quiz               │                               │
   │─────────────────────────────>│                               │
   │  POST /api/academy/courses/:id/quiz                          │
   │  { answers: [...] }          │                               │
   │                              │                               │
   │                              │  11. Grade Quiz               │
   │                              │  score: 85%                   │
   │                              │  passed: true (>70%)          │
   │                              │                               │
   │  12. Quiz Results            │                               │
   │<─────────────────────────────│                               │
   │                              │                               │
   │                              │  13. All Complete?            │
   │                              │  If progress=100% && passed   │
   │                              │                               │
   │                              │  14. Generate Certificate     │
   │                              │  status: "certified"          │
   │                              │                               │
   │  15. Certificate Issued      │                               │
   │<─────────────────────────────│                               │
   │  Download/share certificate  │                               │
   │                              │                               │
   │  16. Leave Review            │                               │
   │─────────────────────────────>│                               │
   │  POST /api/academy/courses/:id/review                        │
   │                              │                               │
   │                              │  17. Update Course Rating     │
   │                              │──────────────────────────────>│
   │                              │  Instructor notified          │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Enrollment States
```
┌──────────┐   start    ┌─────────────┐   complete   ┌───────────┐
│ ENROLLED │───────────>│ IN_PROGRESS │─────────────>│ COMPLETED │
└──────────┘            └─────────────┘              └─────┬─────┘
                                                           │
                                                      pass_quiz
                                                           │
                                                           v
                                                     ┌───────────┐
                                                     │ CERTIFIED │
                                                     └───────────┘
```

---

## 11. Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MESSAGING/COMMUNICATION FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

USER A                          SYSTEM                         USER B
   │                              │                               │
   │  1. Start Conversation       │                               │
   │─────────────────────────────>│                               │
   │  POST /api/communication/conversations                       │
   │  { participants: [userB],    │                               │
   │    subject, initialMessage } │                               │
   │                              │                               │
   │                              │  2. Conversation Created      │
   │                              │                               │
   │                              │  3. Notify User B             │
   │                              │──────────────────────────────>│
   │                              │  Push + in-app notification   │
   │                              │                               │
   │  4. Send Message             │                               │
   │─────────────────────────────>│                               │
   │  POST /conversations/:id/messages                            │
   │  { content, type: "text" }   │                               │
   │                              │                               │
   │                              │  5. Message Stored            │
   │                              │  - Timestamp recorded         │
   │                              │  - Moderation check           │
   │                              │                               │
   │                              │  6. Real-time Delivery        │
   │                              │  (WebSocket if connected)     │
   │                              │──────────────────────────────>│
   │                              │                               │
   │                              │                               │  7. Read Message
   │                              │<──────────────────────────────│
   │                              │  GET /conversations/:id/messages
   │                              │                               │
   │                              │  8. Mark as Read              │
   │                              │<──────────────────────────────│
   │                              │  PUT /messages/:id/read       │
   │                              │                               │
   │  9. Read Receipt             │                               │
   │<─────────────────────────────│                               │
   │  (via WebSocket)             │                               │
   │                              │                               │
   │  10. Send Attachment         │                               │
   │─────────────────────────────>│                               │
   │  POST /conversations/:id/messages                            │
   │  { type: "image",            │                               │
   │    file: <upload> }          │                               │
   │                              │                               │
   │                              │  11. Upload to Cloudinary     │
   │                              │  - Generate thumbnail         │
   │                              │  - Store URL                  │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Message Types
| Type | Description | Max Size |
|------|-------------|----------|
| `text` | Plain text message | 5000 chars |
| `image` | Image attachment | 10 MB |
| `file` | Document attachment | 25 MB |
| `audio` | Voice message | 5 MB |
| `video` | Video attachment | 50 MB |

---

## 12. Live Chat Support Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LIVE CHAT SUPPORT FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

GUEST/USER                      SYSTEM                         AGENT
   │                              │                               │
   │  1. Start Chat Session       │                               │
   │─────────────────────────────>│                               │
   │  POST /api/live-chat/sessions│                               │
   │  { name, email, issue }      │                               │
   │                              │                               │
   │                              │  2. Session Created           │
   │                              │  status: "pending"            │
   │                              │  - Track: IP, UA, referrer    │
   │                              │                               │
   │                              │  3. Queue for Assignment      │
   │                              │  - Check agent availability   │
   │                              │  - Round-robin assignment     │
   │                              │                               │
   │                              │  4. Agent Notified            │
   │                              │──────────────────────────────>│
   │                              │  New chat request             │
   │                              │                               │
   │                              │                               │  5. Accept Chat
   │                              │<──────────────────────────────│
   │                              │  POST /sessions/:id/accept    │
   │                              │                               │
   │                              │  6. Session Assigned          │
   │                              │  status: "assigned"           │
   │                              │                               │
   │  7. Connection Established   │                               │
   │<═══════════════════════════════════════════════════════════>│
   │  (WebSocket connected)       │                               │
   │                              │                               │
   │  8. Chat Exchange            │                               │
   │<─────────────────────────────┼──────────────────────────────>│
   │  Real-time messages          │                               │
   │                              │                               │
   │                              │                               │  9. Transfer
   │                              │<──────────────────────────────│
   │                              │  POST /sessions/:id/transfer  │
   │                              │  { toAgentId }                │
   │                              │                               │
   │                              │  10. Reassign Session         │
   │                              │  status: "transferred"        │
   │                              │                               │
   │  11. Resolution              │                               │
   │<─────────────────────────────┼──────────────────────────────>│
   │                              │                               │
   │                              │                               │  12. Close
   │                              │<──────────────────────────────│
   │                              │  POST /sessions/:id/close     │
   │                              │  { resolution, tags }         │
   │                              │                               │
   │                              │  13. Session Closed           │
   │                              │  status: "closed"             │
   │                              │  - Save transcript            │
   │                              │  - Calculate metrics          │
   │                              │                               │
   │  14. Satisfaction Survey     │                               │
   │<─────────────────────────────│                               │
   │  "Rate your experience"      │                               │
   │                              │                               │
   │  15. Submit Rating           │                               │
   │─────────────────────────────>│                               │
   │  POST /sessions/:id/rating   │                               │
   │  { score, feedback }         │                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Chat Session States
```
┌─────────┐   assign   ┌──────────┐   start   ┌─────────────┐
│ PENDING │───────────>│ ASSIGNED │──────────>│ IN_PROGRESS │
└─────────┘            └──────────┘           └──────┬──────┘
                                                     │
                                    ┌────────────────┼────────────────┐
                                    │                │                │
                                 close          transfer          timeout
                                    │                │                │
                                    v                v                v
                              ┌────────┐      ┌─────────────┐   ┌─────────┐
                              │ CLOSED │      │ TRANSFERRED │   │ TIMEOUT │
                              └────────┘      └─────────────┘   └─────────┘
```

---

## 13. Supplies/Inventory Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SUPPLIES ORDER FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

CUSTOMER                        SYSTEM                         SUPPLIER
   │                              │                               │
   │  1. Browse Supplies          │                               │
   │─────────────────────────────>│                               │
   │  GET /api/supplies           │                               │
   │                              │                               │
   │  2. Add to Cart              │                               │
   │─────────────────────────────>│                               │
   │  POST /api/cart/items        │                               │
   │                              │                               │
   │  3. Checkout                 │                               │
   │─────────────────────────────>│                               │
   │  POST /api/supplies/orders   │                               │
   │  { items, shippingAddress,   │                               │
   │    paymentMethod }           │                               │
   │                              │                               │
   │                              │  4. Validate Stock            │
   │                              │  - Check inventory levels     │
   │                              │  - Reserve stock              │
   │                              │                               │
   │                              │  5. Process Payment           │
   │                              │                               │
   │                              │  6. Order Created             │
   │                              │  status: "pending"            │
   │                              │                               │
   │                              │  7. Notify Supplier           │
   │                              │──────────────────────────────>│
   │                              │  New order received           │
   │                              │                               │
   │                              │                               │  8. Confirm
   │                              │<──────────────────────────────│
   │                              │  PUT /orders/:id/confirm      │
   │                              │                               │
   │                              │  9. Order Confirmed           │
   │                              │  status: "confirmed"          │
   │                              │                               │
   │  10. Confirmation Email      │                               │
   │<─────────────────────────────│                               │
   │                              │                               │
   │                              │                               │  11. Ship
   │                              │<──────────────────────────────│
   │                              │  PUT /orders/:id/ship         │
   │                              │  { trackingNumber }           │
   │                              │                               │
   │                              │  12. Order Shipped            │
   │                              │  status: "shipped"            │
   │                              │  - Deduct from inventory      │
   │                              │                               │
   │  13. Shipping Notification   │                               │
   │<─────────────────────────────│                               │
   │  "Your order is on the way"  │                               │
   │                              │                               │
   │  14. Confirm Delivery        │                               │
   │─────────────────────────────>│                               │
   │  PUT /orders/:id/deliver     │                               │
   │                              │                               │
   │                              │  15. Order Delivered          │
   │                              │  status: "delivered"          │
   │                              │                               │
   │  16. Leave Review            │                               │
   │─────────────────────────────>│                               │
   │  POST /orders/:id/review     │                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Order States
```
┌─────────┐  confirm  ┌───────────┐   ship    ┌─────────┐  deliver  ┌───────────┐
│ PENDING │──────────>│ CONFIRMED │──────────>│ SHIPPED │──────────>│ DELIVERED │
└─────────┘           └───────────┘           └─────────┘           └───────────┘
     │
   cancel
     │
     v
┌───────────┐
│ CANCELLED │
└───────────┘
```

### Low Stock Alert Flow
```
1. Inventory updated (sale, adjustment)
2. System checks: currentStock < reorderPoint
3. If low:
   - Create reorder alert
   - Notify supplier
   - Add to reorder queue
4. automatedSuppliesReorderReminderService sends daily digest
```

---

## 14. Rentals Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RENTAL BOOKING FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

RENTER                          SYSTEM                         OWNER
   │                              │                               │
   │  1. Browse Rentals           │                               │
   │─────────────────────────────>│                               │
   │  GET /api/rentals            │                               │
   │                              │                               │
   │  2. Check Availability       │                               │
   │─────────────────────────────>│                               │
   │  GET /api/rentals/:id/availability                           │
   │  { startDate, endDate }      │                               │
   │                              │                               │
   │  3. Book Rental              │                               │
   │─────────────────────────────>│                               │
   │  POST /api/rentals/:id/book  │                               │
   │  { startDate, endDate,       │                               │
   │    addOns, insurance }       │                               │
   │                              │                               │
   │                              │  4. Calculate Total           │
   │                              │  - Base rate × days           │
   │                              │  - Add-ons                    │
   │                              │  - Insurance                  │
   │                              │  - Deposit                    │
   │                              │                               │
   │                              │  5. Process Payment           │
   │                              │  - Rental fee                 │
   │                              │  - Hold deposit               │
   │                              │                               │
   │                              │  6. Booking Created           │
   │                              │  status: "pending"            │
   │                              │                               │
   │                              │  7. Notify Owner              │
   │                              │──────────────────────────────>│
   │                              │                               │
   │                              │                               │  8. Confirm
   │                              │<──────────────────────────────│
   │                              │  PUT /bookings/:id/confirm    │
   │                              │                               │
   │  9. Pickup Instructions      │                               │
   │<─────────────────────────────│                               │
   │                              │                               │
   │  [RENTAL PERIOD STARTS]      │                               │
   │                              │                               │
   │  10. Mark as Picked Up       │                               │
   │─────────────────────────────>│                               │
   │  PUT /bookings/:id/pickup    │                               │
   │  { condition: "excellent",   │                               │
   │    photos: [...] }           │                               │
   │                              │                               │
   │                              │  11. Rental In Use            │
   │                              │  status: "in_use"             │
   │                              │                               │
   │  [RENTAL PERIOD ENDS]        │                               │
   │                              │                               │
   │                              │  12. Return Reminder          │
   │<─────────────────────────────│                               │
   │  24 hours before due         │                               │
   │                              │                               │
   │  13. Return Item             │                               │
   │─────────────────────────────>│                               │
   │  PUT /bookings/:id/return    │                               │
   │                              │                               │
   │                              │                               │  14. Inspect
   │                              │<──────────────────────────────│
   │                              │  PUT /bookings/:id/inspect    │
   │                              │  { condition, damages: [] }   │
   │                              │                               │
   │                              │  15. Calculate Final          │
   │                              │  - Late fees (if any)         │
   │                              │  - Damage deductions          │
   │                              │  - Refund deposit remainder   │
   │                              │                               │
   │  16. Deposit Refund          │                               │
   │<─────────────────────────────│                               │
   │  status: "returned"          │                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Rental Booking States
```
┌─────────┐  confirm  ┌───────────┐  pickup  ┌────────┐  return  ┌──────────┐
│ PENDING │──────────>│ CONFIRMED │─────────>│ IN_USE │─────────>│ RETURNED │
└─────────┘           └───────────┘          └────────┘          └──────────┘
     │                                            │
   cancel                                    overdue
     │                                            │
     v                                            v
┌───────────┐                               ┌─────────┐
│ CANCELLED │                               │ OVERDUE │
└───────────┘                               └─────────┘
```

---

## 15. Notification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NOTIFICATION FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

TRIGGER EVENT                   NOTIFICATION SERVICE               CHANNELS
      │                              │                               │
      │  1. Event Occurs             │                               │
      │  (booking, payment, etc.)    │                               │
      │─────────────────────────────>│                               │
      │                              │                               │
      │                              │  2. Determine Recipients      │
      │                              │  - Primary user               │
      │                              │  - Related users              │
      │                              │  - Admin (if needed)          │
      │                              │                               │
      │                              │  3. Check Preferences         │
      │                              │  - User notification settings │
      │                              │  - Channel preferences        │
      │                              │  - Quiet hours                │
      │                              │                               │
      │                              │  4. Create Notification       │
      │                              │  - Title, body, data          │
      │                              │  - Priority level             │
      │                              │  - Action URL                 │
      │                              │                               │
      │                              │  5. Dispatch to Channels      │
      │                              │──────────────────────────────>│
      │                              │                               │
      │                              │  5a. In-App                   │
      │                              │  - Store in DB                │
      │                              │  - WebSocket push             │
      │                              │                               │
      │                              │  5b. Push (FCM)               │
      │                              │  - Send to device tokens      │
      │                              │                               │
      │                              │  5c. Email                    │
      │                              │  - Render template            │
      │                              │  - Send via Resend            │
      │                              │                               │
      │                              │  5d. SMS (Twilio)             │
      │                              │  - Format message             │
      │                              │  - Send SMS                   │
      │                              │                               │
      │                              │  6. Track Delivery            │
      │                              │  - Delivery status            │
      │                              │  - Open/read tracking         │
      │                              │                               │
      └──────────────────────────────┴───────────────────────────────┘
```

### Notification Types & Channels
| Event Type | Default Channels | Priority |
|------------|-----------------|----------|
| Booking created | In-app, Push, Email | High |
| Payment received | In-app, Push, Email | High |
| Payment failed | In-app, Push, Email, SMS | Critical |
| Message received | In-app, Push | Medium |
| Review posted | In-app, Email | Low |
| Reminder (24h) | In-app, Push | Medium |
| Reminder (2h) | In-app, Push, SMS | High |
| Dispute opened | In-app, Push, Email | Critical |
| Subscription renewal | In-app, Email | Medium |

---

## 16. Search & Discovery Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SEARCH & DISCOVERY FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

USER                            SYSTEM                          RESULTS
   │                              │                               │
   │  1. Search Query             │                               │
   │─────────────────────────────>│                               │
   │  GET /api/search             │                               │
   │  { query, type, filters }    │                               │
   │                              │                               │
   │                              │  2. Parse Query               │
   │                              │  - Extract keywords           │
   │                              │  - Identify intent            │
   │                              │  - Apply filters              │
   │                              │                               │
   │                              │  3. Multi-Index Search        │
   │                              │  - Services (text + geo)      │
   │                              │  - Jobs (text)                │
   │                              │  - Providers (text + geo)     │
   │                              │  - Courses (text)             │
   │                              │  - Supplies (text)            │
   │                              │                               │
   │                              │  4. Rank Results              │
   │                              │  - Relevance score            │
   │                              │  - Distance (if geo)          │
   │                              │  - Rating                     │
   │                              │  - Featured/promoted          │
   │                              │                               │
   │                              │  5. Apply Filters             │
   │                              │  - Category                   │
   │                              │  - Price range                │
   │                              │  - Rating minimum             │
   │                              │  - Availability               │
   │                              │                               │
   │                              │  6. Paginate Results          │
   │                              │──────────────────────────────>│
   │                              │                               │
   │  7. Results Returned         │                               │
   │<─────────────────────────────│                               │
   │  { results, facets,          │                               │
   │    pagination, suggestions } │                               │
   │                              │                               │
   │  8. Refine Search            │                               │
   │─────────────────────────────>│                               │
   │  (Apply facet filter)        │                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Search Types
| Type | Indexes | Geo Support |
|------|---------|-------------|
| `services` | title, description, features | Yes (2dsphere) |
| `jobs` | title, description, skills, tags | Yes |
| `providers` | name, bio, skills | Yes |
| `courses` | title, description | No |
| `supplies` | name, description, SKU | No |
| `rentals` | name, description | Yes |

---

## 17. Availability & Scheduling Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AVAILABILITY & SCHEDULING FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

PROVIDER                        SYSTEM                         CLIENT
   │                              │                               │
   │  1. Set Availability         │                               │
   │─────────────────────────────>│                               │
   │  PUT /api/availability       │                               │
   │  { schedule: [...],          │                               │
   │    exceptions: [...] }       │                               │
   │                              │                               │
   │                              │  2. Store Schedule            │
   │                              │  - Recurring patterns         │
   │                              │  - One-time exceptions        │
   │                              │  - Blocked dates              │
   │                              │                               │
   │                              │                               │  3. Check Slots
   │                              │<──────────────────────────────│
   │                              │  GET /availability/:providerId│
   │                              │  { date, serviceId }          │
   │                              │                               │
   │                              │  4. Calculate Available Slots │
   │                              │  - Apply schedule pattern     │
   │                              │  - Remove booked slots        │
   │                              │  - Apply buffer time          │
   │                              │  - Apply service duration     │
   │                              │                               │
   │                              │  5. Return Slots              │
   │                              │──────────────────────────────>│
   │                              │  [{ start, end, available }]  │
   │                              │                               │
   │                              │                               │  6. Select Slot
   │                              │<──────────────────────────────│
   │                              │  POST /bookings               │
   │                              │  { slot, serviceId }          │
   │                              │                               │
   │                              │  7. Block Slot                │
   │                              │  - Mark as booked             │
   │                              │  - Update availability        │
   │                              │                               │
   │  8. New Booking Notification │                               │
   │<─────────────────────────────│                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Schedule Patterns
```javascript
schedule: [
  {
    day: "monday",
    slots: [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "18:00" }
    ]
  },
  {
    day: "tuesday",
    slots: [
      { start: "09:00", end: "17:00" }
    ]
  }
  // ...
],
exceptions: [
  {
    date: "2024-12-25",
    available: false,
    reason: "Holiday"
  }
],
bufferTime: 30  // minutes between appointments
```

---

## 18. Finance & Wallet Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FINANCE & WALLET FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

USER                            SYSTEM                      PAYMENT GATEWAY
   │                              │                               │
   │  1. Check Balance            │                               │
   │─────────────────────────────>│                               │
   │  GET /api/finance/wallet     │                               │
   │                              │                               │
   │  2. Balance Returned         │                               │
   │<─────────────────────────────│                               │
   │  { balance, pending,         │                               │
   │    currency, transactions }  │                               │
   │                              │                               │
   │  ════════════════════════════════════════════════════════════│
   │                      CREDIT (Earnings)                       │
   │  ════════════════════════════════════════════════════════════│
   │                              │                               │
   │                              │  3. Booking Completed         │
   │                              │  Escrow releases funds        │
   │                              │                               │
   │                              │  4. Credit Wallet             │
   │                              │  - Calculate net (minus fees) │
   │                              │  - Add transaction record     │
   │                              │  - Update balance             │
   │                              │                               │
   │  5. Earnings Notification    │                               │
   │<─────────────────────────────│                               │
   │  "$85 added to wallet"       │                               │
   │                              │                               │
   │  ════════════════════════════════════════════════════════════│
   │                      WITHDRAWAL (Payout)                     │
   │  ════════════════════════════════════════════════════════════│
   │                              │                               │
   │  6. Request Withdrawal       │                               │
   │─────────────────────────────>│                               │
   │  POST /api/finance/withdraw  │                               │
   │  { amount, method, account } │                               │
   │                              │                               │
   │                              │  7. Validate Request          │
   │                              │  - Check balance              │
   │                              │  - Check min withdrawal       │
   │                              │  - Verify account             │
   │                              │                               │
   │                              │  8. Create Payout             │
   │                              │  status: "pending"            │
   │                              │                               │
   │                              │  9. Process Payout            │
   │                              │──────────────────────────────>│
   │                              │  (Bank transfer/PayPal)       │
   │                              │                               │
   │                              │  10. Payout Complete          │
   │                              │<──────────────────────────────│
   │                              │                               │
   │                              │  11. Update Records           │
   │                              │  - Deduct from wallet         │
   │                              │  - Mark payout complete       │
   │                              │                               │
   │  12. Payout Confirmation     │                               │
   │<─────────────────────────────│                               │
   │  "Payout of $200 processed"  │                               │
   │                              │                               │
   └──────────────────────────────┴───────────────────────────────┘
```

### Transaction Types
| Type | Direction | Description |
|------|-----------|-------------|
| `booking_earning` | Credit | Earnings from completed booking |
| `referral_reward` | Credit | Referral bonus |
| `refund` | Credit | Refund from cancelled booking |
| `withdrawal` | Debit | Payout to bank/PayPal |
| `fee` | Debit | Platform fees |
| `subscription` | Debit | Subscription payment |
| `adjustment` | Either | Admin adjustment |

---

## 19. Webhook Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WEBHOOK SYSTEM FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

INTERNAL EVENT                  WEBHOOK SERVICE               SUBSCRIBER
      │                              │                               │
      │  1. Event Triggered          │                               │
      │  (booking.created)           │                               │
      │─────────────────────────────>│                               │
      │                              │                               │
      │                              │  2. Find Subscribers          │
      │                              │  - Match event type           │
      │                              │  - Check active status        │
      │                              │                               │
      │                              │  3. Prepare Payload           │
      │                              │  { event, data, timestamp,    │
      │                              │    signature }                │
      │                              │                               │
      │                              │  4. Send Webhook              │
      │                              │──────────────────────────────>│
      │                              │  POST subscriber.endpoint     │
      │                              │                               │
      │                              │  5. Verify Response           │
      │                              │<──────────────────────────────│
      │                              │  200 OK                       │
      │                              │                               │
      │                              │  6. Log Event                 │
      │                              │  - Status: delivered          │
      │                              │  - Response time              │
      │                              │                               │
      │                              │  [IF FAILED]                  │
      │                              │                               │
      │                              │  7. Retry Logic               │
      │                              │  - Exponential backoff        │
      │                              │  - Max 5 retries              │
      │                              │  - Alert on failure           │
      │                              │                               │
      └──────────────────────────────┴───────────────────────────────┘
```

### Webhook Events
| Event | Payload |
|-------|---------|
| `booking.created` | Booking details |
| `booking.confirmed` | Booking + provider |
| `booking.completed` | Booking + review |
| `booking.cancelled` | Booking + reason |
| `payment.successful` | Transaction details |
| `payment.failed` | Transaction + error |
| `escrow.created` | Escrow details |
| `escrow.disputed` | Escrow + dispute |
| `escrow.released` | Escrow + payout |
| `subscription.renewed` | Subscription details |
| `subscription.cancelled` | Subscription + reason |

---

## 20. Background Automation Flows

### Automated Service Summary

| Service | Schedule | Description |
|---------|----------|-------------|
| **Booking Automation** |||
| `automatedBookingService` | Every 30 min | Send 24h and 2h reminders |
| `automatedMarketplaceNoShowService` | Hourly | Detect and handle no-shows |
| `automatedMarketplaceBookingFollowUpService` | Daily 9 AM | Request reviews |
| **Payment Automation** |||
| `automatedPaymentSyncService` | Every 15 min | Sync payment statuses |
| `automatedEscrowService` | Hourly | Auto-release approved escrows |
| `automatedEscrowDisputeEscalationService` | Hourly | Escalate stale disputes |
| `automatedLocalProPlusDunningService` | Daily | Retry failed subscriptions |
| **Communication** |||
| `automatedMessagingNudgeService` | Hourly | Nudge unread messages |
| `automatedMessagingModerationService` | Every 5 min | Content filtering |
| `automatedLiveChatSlaService` | Every 5 min | SLA monitoring |
| **Inventory** |||
| `automatedSuppliesFulfillmentService` | Every 30 min | Process orders |
| `automatedSuppliesReorderReminderService` | Daily | Low stock alerts |
| **Rentals** |||
| `automatedRentalReminderService` | Daily | Return reminders |
| **Learning** |||
| `automatedAcademyEngagementService` | Daily | Course engagement |
| `automatedAcademyCertificateService` | Daily | Certificate expiry alerts |
| **Jobs** |||
| `automatedJobBoardDigestService` | Weekly | Job digest emails |
| `automatedJobApplicationFollowUpService` | Daily | Application follow-ups |
| **Referrals** |||
| `automatedReferralTierMilestoneService` | Daily | Milestone achievements |
| **Finance** |||
| `automatedFinanceReminderService` | Daily | Payment reminders |
| **System** |||
| `automatedBackupService` | Daily 2 AM | Database backups |
| `automatedLogCleanupService` | Daily 3 AM | Log rotation |
| `automatedIndexManagementService` | Weekly | Database optimization |
| `automatedSchedulingService` | Every 30 min | Schedule confirmations |
| `automatedAvailabilityService` | Hourly | Calendar sync |

---

*Last Updated: January 2026*
*Version: 1.0.0*
