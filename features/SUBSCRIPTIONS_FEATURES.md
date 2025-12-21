# Subscriptions Features Documentation (LocalPro Plus)

## Overview

The Subscriptions feature (LocalPro Plus) provides a comprehensive subscription management system with tiered pricing plans, user subscriptions, payment processing, feature access control, and usage tracking. It enables users to subscribe to premium plans that unlock enhanced features and benefits in the LocalPro Super App.

## Base Path
`/api/localpro-plus`

---

## Core Features

### 1. Subscription Plans Management
- **Plan Creation** - Create tiered subscription plans with pricing and features
- **Plan Tiers** - Multiple subscription tiers:
  - `Basic` - Entry-level plan for individual providers
  - `Standard` - Growing service businesses
  - `Premium` - Established service businesses
  - `Enterprise` - Large organizations and agencies
- **Pricing Models** - Flexible pricing options:
  - Monthly pricing
  - Yearly pricing (with discounts)
  - Currency support (USD default)
- **Feature Configuration** - Define features per plan:
  - Feature name and description
  - Included status
  - Usage limits
  - Unit of measurement
- **Plan Benefits** - List of benefits per plan
- **Plan Status** - Active/inactive plan management
- **Popular Plans** - Mark plans as popular/recommended

### 2. User Subscription Management
- **Subscription Creation** - Users subscribe to plans
- **Subscription Status** - Manage subscription lifecycle:
  - `pending` - Awaiting payment
  - `active` - Subscription active
  - `cancelled` - User cancelled
  - `expired` - Subscription expired
  - `suspended` - Temporarily suspended
- **Billing Cycles** - Support for different billing cycles:
  - `monthly` - Monthly billing
  - `yearly` - Yearly billing
- **Subscription Dates** - Track subscription dates:
  - Start date
  - End date
  - Next billing date
- **Cancellation** - Handle subscription cancellations:
  - Cancellation date
  - Cancellation reason
- **Subscription History** - Track subscription changes:
  - Subscribed
  - Upgraded
  - Downgraded
  - Cancelled
  - Renewed
  - Suspended
  - Reactivated

### 3. Payment Processing
- **Payment Methods** - Multiple payment gateway support:
  - `paypal` - PayPal payments
  - `paymaya` - PayMaya payments
  - `stripe` - Stripe payments
  - `paymongo` - PayMongo payments
  - `bank_transfer` - Bank transfer
  - `manual` - Manual payment processing
- **Payment Status** - Track payment status:
  - `pending` - Payment pending
  - `completed` - Payment completed
  - `failed` - Payment failed
  - `refunded` - Payment refunded
  - `cancelled` - Payment cancelled
- **Payment Details** - Store payment gateway references:
  - Subscription IDs
  - Transaction IDs
  - Payment intent IDs
  - Customer IDs
- **Billing Period** - Track billing periods
- **Payment History** - Complete payment history

### 4. Feature Access Control
- **Feature Flags** - Control feature access:
  - `prioritySupport` - Priority customer support
  - `advancedAnalytics` - Advanced analytics
  - `customBranding` - Custom branding options
  - `apiAccess` - API access
  - `whiteLabel` - White-label options
- **Feature Access Methods** - Check feature access:
  - `hasFeatureAccess(featureName)` - Check if feature is included
  - `checkUsageLimit(featureName)` - Check usage limits
  - `incrementUsage(featureName, amount)` - Track usage
- **Feature Usage Tracking** - Track feature usage:
  - Service creation
  - Booking management
  - Analytics views
  - API calls
  - File uploads
  - Email notifications
  - SMS notifications
  - Custom branding
  - Priority support
  - Advanced search

### 5. Usage Limits & Tracking
- **Usage Limits** - Define limits per plan:
  - Max services
  - Max bookings
  - Max providers
  - Max storage (MB)
  - Max API calls
- **Usage Tracking** - Track current usage:
  - Services created
  - Bookings managed
  - Storage used
  - API calls made
- **Usage Monitoring** - Monitor usage against limits
- **Usage Reset** - Reset usage counters monthly/yearly

### 6. Trial Management
- **Trial Support** - Support for trial subscriptions:
  - Trial status
  - Trial end date
  - Trial used flag
- **Trial Enforcement** - Prevent multiple trials per user
- **Trial Conversion** - Convert trials to paid subscriptions

### 7. Subscription Settings
- **User Preferences** - Manage subscription preferences:
  - Auto-renew settings
  - Notification preferences
  - Billing preferences
- **Settings Updates** - Update subscription settings

### 8. Manual Subscription Management (Admin)
- **Manual Creation** - Admins can create subscriptions manually
- **Manual Updates** - Update manual subscriptions
- **Manual Deletion** - Delete manual subscriptions
- **Manual Details** - Track manual subscription details:
  - Created by
  - Reason
  - Notes

### 9. Analytics & Reporting
- **Subscription Analytics** - Track subscription metrics:
  - Total subscriptions
  - Active subscriptions
  - Revenue metrics
  - Churn rate
  - Conversion rate
- **Usage Analytics** - Track feature usage analytics
- **Payment Analytics** - Track payment metrics

### 10. Subscription Lifecycle
- **Subscription Flow** - Complete subscription lifecycle:
  - Plan selection
  - Payment processing
  - Subscription activation
  - Usage tracking
  - Renewal processing
  - Cancellation handling

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans` | Get all active subscription plans |
| GET | `/plans/:id` | Get plan details |

### Authenticated Endpoints - User

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/subscribe/:planId` | Subscribe to a plan | AUTHENTICATED |
| POST | `/confirm-payment` | Confirm subscription payment | AUTHENTICATED |
| POST | `/cancel` | Cancel subscription | AUTHENTICATED |
| POST | `/renew` | Renew subscription | AUTHENTICATED |
| GET | `/my-subscription` | Get my subscription | AUTHENTICATED |
| PUT | `/settings` | Update subscription settings | AUTHENTICATED |
| GET | `/usage` | Get subscription usage | AUTHENTICATED |

### Authenticated Endpoints - Admin

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/plans` | Create subscription plan | **admin** |
| PUT | `/plans/:id` | Update subscription plan | **admin** |
| DELETE | `/plans/:id` | Delete subscription plan | **admin** |
| GET | `/analytics` | Get subscription analytics | **admin** |
| POST | `/admin/subscriptions` | Create manual subscription | **admin** |
| GET | `/admin/subscriptions` | Get all subscriptions | **admin** |
| GET | `/admin/subscriptions/user/:userId` | Get subscription by user | **admin** |
| PUT | `/admin/subscriptions/:subscriptionId` | Update subscription | **admin** |
| DELETE | `/admin/subscriptions/:subscriptionId` | Delete subscription | **admin** |

---

## Request/Response Examples

### Get Subscription Plans

```http
GET /api/localpro-plus/plans
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Basic",
      "description": "Perfect for individual service providers getting started",
      "price": {
        "monthly": 9.99,
        "yearly": 99.99,
        "currency": "USD"
      },
      "features": [
        {
          "name": "service_creation",
          "description": "Create and manage services",
          "included": true,
          "limit": 5,
          "unit": "per_month"
        },
        {
          "name": "booking_management",
          "description": "Manage bookings and appointments",
          "included": true,
          "limit": 20,
          "unit": "per_month"
        }
      ],
      "limits": {
        "maxServices": 5,
        "maxBookings": 20,
        "maxProviders": 1,
        "maxStorage": 100,
        "maxApiCalls": 1000
      },
      "benefits": [
        "Up to 5 services",
        "20 bookings per month",
        "Basic analytics",
        "Email support",
        "Mobile app access"
      ],
      "isActive": true,
      "isPopular": false,
      "sortOrder": 1
    }
  ]
}
```

### Subscribe to Plan

```http
POST /api/localpro-plus/subscribe/:planId
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "paypal",
  "billingCycle": "monthly"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012346",
    "user": "64a1b2c3d4e5f6789012347",
    "plan": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Basic",
      "price": {
        "monthly": 9.99,
        "yearly": 99.99,
        "currency": "USD"
      }
    },
    "status": "pending",
    "billingCycle": "monthly",
    "startDate": "2025-01-15T10:00:00.000Z",
    "nextBillingDate": "2025-02-15T10:00:00.000Z",
    "paymentMethod": "paypal",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Confirm Payment

```http
POST /api/localpro-plus/confirm-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentId": "payment_id_here",
  "provider": "paypal",
  "transactionId": "transaction_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012346",
    "status": "active",
    "paymentDetails": {
      "lastPaymentId": "payment_id_here",
      "lastPaymentDate": "2025-01-15T10:00:00.000Z"
    }
  }
}
```

### Get My Subscription

```http
GET /api/localpro-plus/my-subscription
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6789012346",
    "user": "64a1b2c3d4e5f6789012347",
    "plan": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Standard",
      "description": "Ideal for growing service businesses",
      "price": {
        "monthly": 19.99,
        "yearly": 199.99,
        "currency": "USD"
      }
    },
    "status": "active",
    "billingCycle": "monthly",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-02-01T00:00:00.000Z",
    "nextBillingDate": "2025-02-01T00:00:00.000Z",
    "paymentMethod": "paypal",
    "usage": {
      "services": {
        "current": 8,
        "limit": 15
      },
      "bookings": {
        "current": 45,
        "limit": 100
      },
      "storage": {
        "current": 250,
        "limit": 500
      },
      "apiCalls": {
        "current": 1200,
        "limit": 5000
      }
    },
    "features": {
      "prioritySupport": true,
      "advancedAnalytics": true,
      "customBranding": true,
      "apiAccess": true,
      "whiteLabel": false
    },
    "duration": 15,
    "daysUntilRenewal": 17
  }
}
```

### Get Usage

```http
GET /api/localpro-plus/usage
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "_id": "64a1b2c3d4e5f6789012346",
      "plan": {
        "name": "Standard"
      },
      "status": "active",
      "billingCycle": "monthly",
      "daysUntilRenewal": 17
    },
    "usage": {
      "services": {
        "current": 8,
        "limit": 15,
        "percentage": 53.33
      },
      "bookings": {
        "current": 45,
        "limit": 100,
        "percentage": 45
      },
      "storage": {
        "current": 250,
        "limit": 500,
        "percentage": 50
      },
      "apiCalls": {
        "current": 1200,
        "limit": 5000,
        "percentage": 24
      }
    },
    "features": {
      "prioritySupport": true,
      "advancedAnalytics": true,
      "customBranding": true,
      "apiAccess": true,
      "whiteLabel": false
    }
  }
}
```

### Cancel Subscription

```http
POST /api/localpro-plus/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "No longer needed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012346",
    "status": "cancelled",
    "cancelledAt": "2025-01-15T10:00:00.000Z",
    "cancellationReason": "No longer needed"
  }
}
```

### Renew Subscription

```http
POST /api/localpro-plus/renew
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "paypal",
  "paymentDetails": {
    "transactionId": "transaction_id_here"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription renewed successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012346",
    "status": "active",
    "nextBillingDate": "2025-03-01T00:00:00.000Z",
    "endDate": "2025-03-01T00:00:00.000Z",
    "history": [
      {
        "action": "renewed",
        "timestamp": "2025-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

### Update Subscription Settings

```http
PUT /api/localpro-plus/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "autoRenew": true,
  "notifications": {
    "email": true,
    "sms": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

### Create Subscription Plan (Admin)

```http
POST /api/localpro-plus/plans
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Professional",
  "description": "For professional service providers",
  "price": {
    "monthly": 29.99,
    "yearly": 299.99,
    "currency": "USD"
  },
  "features": [
    {
      "name": "service_creation",
      "description": "Create and manage services",
      "included": true,
      "limit": 25,
      "unit": "per_month"
    }
  ],
  "limits": {
    "maxServices": 25,
    "maxBookings": 200,
    "maxProviders": 5,
    "maxStorage": 1000,
    "maxApiCalls": 10000
  },
  "benefits": [
    "Up to 25 services",
    "200 bookings per month",
    "Advanced analytics"
  ],
  "isActive": true,
  "isPopular": false,
  "sortOrder": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012348",
    "name": "Professional",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Get Analytics (Admin)

```http
GET /api/localpro-plus/analytics
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSubscriptions": 150,
    "activeSubscriptions": 120,
    "cancelledSubscriptions": 20,
    "expiredSubscriptions": 10,
    "subscriptionsByPlan": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "Basic",
        "count": 50
      },
      {
        "_id": "64a1b2c3d4e5f6789012346",
        "name": "Standard",
        "count": 60
      }
    ],
    "revenue": {
      "monthly": 2500.00,
      "yearly": 30000.00,
      "total": 32500.00
    },
    "churnRate": 5.5,
    "conversionRate": 12.3
  }
}
```

---

## Subscription Flow

### 1. Plan Selection
- User browses available plans via `GET /plans`
- User selects a plan
- User chooses billing cycle (monthly/yearly)

### 2. Subscription Creation
- User subscribes via `POST /subscribe/:planId`
- Subscription created with status `pending`
- Payment details configured

### 3. Payment Processing
- Payment processed via selected payment method
- Payment confirmed via `POST /confirm-payment`
- Subscription status changes to `active`

### 4. Subscription Activation
- Subscription becomes active
- Feature access enabled
- Usage limits applied
- Next billing date set

### 5. Usage Tracking
- System tracks feature usage
- Usage limits enforced
- Usage data available via `GET /usage`

### 6. Renewal Processing
- Subscription renews automatically or manually
- Payment processed for renewal
- Subscription extended
- Next billing date updated

### 7. Cancellation
- User cancels via `POST /cancel`
- Subscription status changes to `cancelled`
- Access continues until end date
- Cancellation reason recorded

---

## Subscription Status Flow

```
pending → active → cancelled/expired
```

**Status Details:**
- **pending** - Awaiting payment confirmation
- **active** - Subscription active and running
- **cancelled** - User cancelled subscription
- **expired** - Subscription expired
- **suspended** - Temporarily suspended

---

## Subscription Plans

### Basic Plan
- **Price**: $9.99/month, $99.99/year
- **Features**:
  - Up to 5 services per month
  - 20 bookings per month
  - Basic analytics
  - Email support
  - Mobile app access
- **Limits**:
  - Max services: 5
  - Max bookings: 20
  - Max providers: 1
  - Max storage: 100MB
  - Max API calls: 1000

### Standard Plan
- **Price**: $19.99/month, $199.99/year
- **Features**:
  - Up to 15 services per month
  - 100 bookings per month
  - Advanced analytics
  - Priority support
  - Custom branding
  - Team management (up to 3 providers)
  - API access
- **Limits**:
  - Max services: 15
  - Max bookings: 100
  - Max providers: 3
  - Max storage: 500MB
  - Max API calls: 5000

### Premium Plan
- **Price**: $39.99/month, $399.99/year
- **Features**:
  - Up to 50 services per month
  - 500 bookings per month
  - Advanced analytics
  - Priority support
  - Custom branding
  - Team management (up to 10 providers)
  - Full API access
  - White-label options
  - Advanced integrations
- **Limits**:
  - Max services: 50
  - Max bookings: 500
  - Max providers: 10
  - Max storage: 2GB
  - Max API calls: 20000

### Enterprise Plan
- **Price**: $99.99/month, $999.99/year
- **Features**:
  - Unlimited services
  - Unlimited bookings
  - Advanced analytics
  - Dedicated support
  - Custom branding
  - Unlimited team members
  - Full API access
  - White-label options
  - Advanced integrations
  - Custom integrations
  - SLA guarantee
- **Limits**:
  - Max services: Unlimited
  - Max bookings: Unlimited
  - Max providers: Unlimited
  - Max storage: 10GB
  - Max API calls: Unlimited

---

## Payment Methods

- **paypal** - PayPal payments
- **paymaya** - PayMaya payments
- **stripe** - Stripe payments
- **paymongo** - PayMongo payments
- **bank_transfer** - Bank transfer
- **manual** - Manual payment processing

---

## Data Models

### SubscriptionPlan Model

```javascript
{
  // Core Fields
  name: String,                      // Required, unique
  description: String,              // Required
  
  // Pricing
  price: {
    monthly: Number,                 // Required
    yearly: Number,                  // Required
    currency: String                  // Default: USD
  },
  
  // Features
  features: [{
    name: String,                    // Required
    description: String,
    included: Boolean,               // Default: true
    limit: Number,                   // null = unlimited
    unit: String                     // 'per_month', 'per_booking', etc.
  }],
  
  // Limits
  limits: {
    maxServices: Number,             // null = unlimited
    maxBookings: Number,             // null = unlimited
    maxProviders: Number,            // null = unlimited
    maxStorage: Number,              // in MB, null = unlimited
    maxApiCalls: Number              // null = unlimited
  },
  
  // Benefits
  benefits: [String],
  
  // Status
  isActive: Boolean,                 // Default: true
  isPopular: Boolean,                // Default: false
  sortOrder: Number,                 // Default: 0
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### UserSubscription Model

```javascript
{
  // Core Fields
  user: ObjectId,                    // Required, User reference
  plan: ObjectId,                    // Required, SubscriptionPlan reference
  status: String,                    // enum: active, cancelled, expired, suspended, pending
  
  // Billing
  billingCycle: String,              // enum: monthly, yearly
  startDate: Date,                   // Default: Date.now
  endDate: Date,
  nextBillingDate: Date,
  
  // Cancellation
  cancelledAt: Date,
  cancellationReason: String,
  
  // Payment
  paymentMethod: String,            // enum: paypal, paymaya, stripe, bank_transfer, manual, paymongo
  isManual: Boolean,                 // Default: false
  manualDetails: {
    createdBy: ObjectId,             // User reference
    reason: String,
    notes: String
  },
  paymentDetails: {
    paypalSubscriptionId: String,
    paymayaSubscriptionId: String,
    stripeSubscriptionId: String,
    paymongoCustomerId: String,
    paymongoIntentId: String,
    lastPaymentId: String,
    lastPaymentDate: Date,
    nextPaymentAmount: Number
  },
  
  // Usage
  usage: {
    services: {
      current: Number,               // Default: 0
      limit: Number
    },
    bookings: {
      current: Number,               // Default: 0
      limit: Number
    },
    storage: {
      current: Number,               // Default: 0
      limit: Number
    },
    apiCalls: {
      current: Number,               // Default: 0
      limit: Number
    }
  },
  
  // Features
  features: {
    prioritySupport: Boolean,        // Default: false
    advancedAnalytics: Boolean,      // Default: false
    customBranding: Boolean,         // Default: false
    apiAccess: Boolean,              // Default: false
    whiteLabel: Boolean               // Default: false
  },
  
  // Trial
  trial: {
    isTrial: Boolean,                // Default: false
    trialEndDate: Date,
    trialUsed: Boolean                // Default: false
  },
  
  // History
  history: [{
    action: String,                  // enum: subscribed, upgraded, downgraded, cancelled, renewed, suspended, reactivated
    fromPlan: String,
    toPlan: String,
    timestamp: Date,                  // Default: Date.now
    reason: String,
    amount: Number
  }],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Model

```javascript
{
  // Core Fields
  user: ObjectId,                    // Required, User reference
  subscription: ObjectId,            // Required, UserSubscription reference
  amount: Number,                     // Required
  currency: String,                   // Default: USD
  status: String,                    // enum: pending, completed, failed, refunded, cancelled
  
  // Payment Method
  paymentMethod: String,             // Required, enum: paypal, paymaya, stripe, bank_transfer, paymongo
  
  // Payment Details
  paymentDetails: {
    transactionId: String,
    paypalOrderId: String,
    paypalPaymentId: String,
    paymayaCheckoutId: String,
    paymayaPaymentId: String,
    stripePaymentIntentId: String,
    bankReference: String,
    paymongoIntentId: String,
    paymongoChargeId: String,
    paymongoPaymentId: String
  },
  
  // Billing Period
  billingPeriod: {
    startDate: Date,
    endDate: Date
  },
  
  // Metadata
  description: String,
  metadata: Mixed,
  
  // Processing
  processedAt: Date,
  failedAt: Date,
  failureReason: String,
  refundedAt: Date,
  refundAmount: Number,
  refundReason: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### FeatureUsage Model

```javascript
{
  // Core Fields
  user: ObjectId,                    // Required, User reference
  subscription: ObjectId,            // Required, UserSubscription reference
  feature: String,                   // Required, enum: service_creation, booking_management, analytics_view, api_call, file_upload, email_notification, sms_notification, custom_branding, priority_support, advanced_search
  
  // Usage
  usage: {
    count: Number,                    // Default: 1
    amount: Number,                   // Optional, for features with monetary value
    metadata: Mixed                   // Optional metadata
  },
  
  // Timestamp
  timestamp: Date,                    // Default: Date.now
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## Subscription Methods

### isActive()
Check if subscription is currently active.

```javascript
subscription.isActive() // Returns boolean
```

### hasFeatureAccess(featureName)
Check if user has access to a specific feature.

```javascript
subscription.hasFeatureAccess('advanced_analytics') // Returns boolean
```

### checkUsageLimit(featureName)
Check if usage is within limits for a feature.

```javascript
subscription.checkUsageLimit('service_creation') // Returns boolean
```

### incrementUsage(featureName, amount)
Increment usage counter for a feature.

```javascript
subscription.incrementUsage('service_creation', 1)
```

### cancel(reason)
Cancel the subscription.

```javascript
subscription.cancel('No longer needed')
```

### renew()
Renew the subscription.

```javascript
subscription.renew()
```

---

## Subscription Virtuals

### duration
Get subscription duration in days.

```javascript
subscription.duration // Returns number of days
```

### daysUntilRenewal
Get days until next renewal.

```javascript
subscription.daysUntilRenewal // Returns number of days
```

---

## Key Metrics

- **Total Subscriptions** - Total number of subscriptions
- **Active Subscriptions** - Number of active subscriptions
- **Cancelled Subscriptions** - Number of cancelled subscriptions
- **Expired Subscriptions** - Number of expired subscriptions
- **Monthly Revenue** - Monthly subscription revenue
- **Yearly Revenue** - Yearly subscription revenue
- **Churn Rate** - Subscription churn rate
- **Conversion Rate** - Trial to paid conversion rate
- **Average Revenue Per User (ARPU)** - Average revenue per subscriber
- **Customer Lifetime Value (CLV)** - Customer lifetime value

---

## Related Features

The Subscriptions feature integrates with several other features in the LocalPro Super App:

- **User Management** - User accounts and authentication
- **Finance** - Payment processing and billing
- **Marketplace** - Service creation limits
- **Job Board** - Job posting limits
- **Academy** - Course creation limits
- **Analytics** - Usage analytics and reporting
- **Email Service** - Subscription notifications
- **SMS Service** - Subscription notifications

---

## Common Use Cases

1. **Plan Selection** - Users browse and select subscription plans
2. **Subscription Creation** - Users subscribe to plans
3. **Payment Processing** - Process subscription payments
4. **Feature Access** - Control access to premium features
5. **Usage Tracking** - Track feature usage and limits
6. **Subscription Renewal** - Renew subscriptions automatically or manually
7. **Subscription Cancellation** - Handle subscription cancellations
8. **Usage Monitoring** - Monitor usage against limits
9. **Trial Management** - Manage trial subscriptions
10. **Analytics & Reporting** - Generate subscription analytics

---

## Error Handling

**Common Error Codes:**
- `400` - Validation errors (invalid data, missing fields)
- `401` - Unauthorized (no token provided)
- `403` - Forbidden (insufficient permissions, subscription required, feature not included)
- `404` - Not found (plan or subscription doesn't exist)
- `409` - Conflict (duplicate subscription, trial already used)
- `429` - Too many requests (usage limit exceeded)
- `500` - Server error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "errors": [
    {
      "field": "billingCycle",
      "message": "Billing cycle is required"
    }
  ]
}
```

---

## Best Practices

### For Users
1. **Plan Selection** - Choose plan based on needs
2. **Usage Monitoring** - Monitor usage regularly
3. **Payment Management** - Keep payment methods updated
4. **Renewal Settings** - Configure auto-renew preferences
5. **Feature Utilization** - Make use of included features

### For Admins
1. **Plan Management** - Keep plans up to date
2. **Pricing Strategy** - Set competitive pricing
3. **Feature Configuration** - Configure features appropriately
4. **Analytics Monitoring** - Monitor subscription metrics
5. **Support Management** - Provide timely support

### For Developers
1. **Feature Gating** - Use middleware for feature access control
2. **Usage Tracking** - Track usage accurately
3. **Payment Processing** - Handle payments securely
4. **Error Handling** - Handle all error cases gracefully
5. **Performance** - Optimize subscription queries
6. **Security** - Protect payment and subscription data

---

## Middleware

### requireActiveSubscription
Require active subscription for route access.

```javascript
const { requireActiveSubscription } = require('../middleware/subscriptionAccess');

router.get('/premium-feature', requireActiveSubscription, controller.premiumFeature);
```

### requireFeatureAccess(featureName)
Require access to specific feature.

```javascript
const { requireFeatureAccess } = require('../middleware/subscriptionAccess');

router.get('/analytics', requireFeatureAccess('advanced_analytics'), controller.analytics);
```

### checkUsageLimit(featureName)
Check usage limit before operation.

```javascript
const { checkUsageLimit } = require('../middleware/subscriptionAccess');

router.post('/services', checkUsageLimit('service_creation'), controller.createService);
```

### incrementUsage(featureName, amount)
Increment usage after operation.

```javascript
const { incrementUsage } = require('../middleware/subscriptionAccess');

router.post('/services', incrementUsage('service_creation', 1), controller.createService);
```

### requirePlanLevel(level)
Require specific plan level.

```javascript
const { requirePlanLevel } = require('../middleware/subscriptionAccess');

router.get('/white-label', requirePlanLevel('premium'), controller.whiteLabel);
```

---

*For detailed implementation guidance, see the individual documentation files in the `features/subscriptions/` and `docs/features/` directories.*

