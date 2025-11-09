# LocalPro Plus Data Entities Documentation

## Overview

This document provides comprehensive documentation for all data entities in the LocalPro Plus subscription system. These entities manage subscription plans, user subscriptions, payments, and feature usage tracking.

---

## Table of Contents

1. [SubscriptionPlan](#1-subscriptionplan)
2. [UserSubscription](#2-usersubscription)
3. [Payment](#3-payment)
4. [FeatureUsage](#4-featureusage)
5. [Entity Relationships](#entity-relationships)
6. [Database Indexes](#database-indexes)
7. [Usage Examples](#usage-examples)

---

## 1. SubscriptionPlan

The `SubscriptionPlan` entity defines the available subscription tiers and their features, pricing, and limits.

### Schema Definition

```javascript
{
  name: String,              // Required, Unique
  description: String,       // Required
  price: {
    monthly: Number,         // Required
    yearly: Number,         // Required
    currency: String        // Default: 'USD'
  },
  features: [{
    name: String,
    description: String,
    included: Boolean,      // Default: true
    limit: Number,          // null means unlimited
    unit: String            // e.g., 'per_month', 'per_booking', 'per_user'
  }],
  limits: {
    maxServices: Number,
    maxBookings: Number,
    maxProviders: Number,
    maxStorage: Number,      // in MB
    maxApiCalls: Number
  },
  benefits: [String],
  isActive: Boolean,        // Default: true
  isPopular: Boolean,       // Default: false
  sortOrder: Number,        // Default: 0
  createdAt: Date,
  updatedAt: Date
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | String | Yes | - | Unique plan name (e.g., "Basic", "Standard", "Premium") |
| `description` | String | Yes | - | Plan description |
| `price.monthly` | Number | Yes | - | Monthly subscription price |
| `price.yearly` | Number | Yes | - | Yearly subscription price |
| `price.currency` | String | No | 'USD' | Currency code |
| `features` | Array | No | [] | List of features included in the plan |
| `features[].name` | String | No | - | Feature identifier |
| `features[].description` | String | No | - | Feature description |
| `features[].included` | Boolean | No | true | Whether feature is included |
| `features[].limit` | Number | No | null | Usage limit (null = unlimited) |
| `features[].unit` | String | No | - | Unit of measurement |
| `limits.maxServices` | Number | No | - | Maximum services allowed |
| `limits.maxBookings` | Number | No | - | Maximum bookings per period |
| `limits.maxProviders` | Number | No | - | Maximum team members/providers |
| `limits.maxStorage` | Number | No | - | Maximum storage in MB |
| `limits.maxApiCalls` | Number | No | - | Maximum API calls per period |
| `benefits` | Array[String] | No | [] | List of plan benefits |
| `isActive` | Boolean | No | true | Whether plan is active |
| `isPopular` | Boolean | No | false | Whether to highlight as popular |
| `sortOrder` | Number | No | 0 | Display order |

### Example Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Standard",
  "description": "Perfect for growing businesses",
  "price": {
    "monthly": 19.99,
    "yearly": 199.99,
    "currency": "USD"
  },
  "features": [
    {
      "name": "advanced_analytics",
      "description": "Access to advanced analytics dashboard",
      "included": true,
      "limit": null,
      "unit": "per_month"
    },
    {
      "name": "priority_support",
      "description": "Priority customer support",
      "included": true,
      "limit": null,
      "unit": "per_month"
    }
  ],
  "limits": {
    "maxServices": 15,
    "maxBookings": 100,
    "maxProviders": 3,
    "maxStorage": 500,
    "maxApiCalls": 5000
  },
  "benefits": [
    "Advanced analytics",
    "Priority support",
    "Custom branding",
    "Team management (up to 3 providers)"
  ],
  "isActive": true,
  "isPopular": true,
  "sortOrder": 2,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

## 2. UserSubscription

The `UserSubscription` entity represents a user's active subscription to a plan, including usage tracking, payment details, and subscription history.

### Schema Definition

```javascript
{
  user: ObjectId,            // Required, ref: 'User'
  plan: ObjectId,           // Required, ref: 'SubscriptionPlan'
  status: String,           // Enum: ['active', 'cancelled', 'expired', 'suspended', 'pending']
  billingCycle: String,     // Enum: ['monthly', 'yearly']
  startDate: Date,         // Default: Date.now
  endDate: Date,
  nextBillingDate: Date,
  cancelledAt: Date,
  cancellationReason: String,
  paymentMethod: String,    // Enum: ['paypal', 'paymaya', 'stripe', 'bank_transfer', 'manual']
  isManual: Boolean,        // Default: false
  manualDetails: {
    createdBy: ObjectId,    // ref: 'User'
    reason: String,
    notes: String
  },
  paymentDetails: {
    paypalSubscriptionId: String,
    paymayaSubscriptionId: String,
    stripeSubscriptionId: String,
    lastPaymentId: String,
    lastPaymentDate: Date,
    nextPaymentAmount: Number
  },
  usage: {
    services: { current: Number, limit: Number },
    bookings: { current: Number, limit: Number },
    storage: { current: Number, limit: Number },
    apiCalls: { current: Number, limit: Number }
  },
  features: {
    prioritySupport: Boolean,
    advancedAnalytics: Boolean,
    customBranding: Boolean,
    apiAccess: Boolean,
    whiteLabel: Boolean
  },
  trial: {
    isTrial: Boolean,       // Default: false
    trialEndDate: Date,
    trialUsed: Boolean      // Default: false
  },
  history: [{
    action: String,         // Enum: ['subscribed', 'upgraded', 'downgraded', 'cancelled', 'renewed', 'suspended', 'reactivated']
    fromPlan: String,
    toPlan: String,
    timestamp: Date,
    reason: String,
    amount: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `user` | ObjectId | Yes | - | Reference to User model |
| `plan` | ObjectId | Yes | - | Reference to SubscriptionPlan model |
| `status` | String | No | 'pending' | Subscription status |
| `billingCycle` | String | No | 'monthly' | Billing frequency |
| `startDate` | Date | No | Date.now | Subscription start date |
| `endDate` | Date | No | - | Subscription end date |
| `nextBillingDate` | Date | No | - | Next billing date |
| `cancelledAt` | Date | No | - | Cancellation timestamp |
| `cancellationReason` | String | No | - | Reason for cancellation |
| `paymentMethod` | String | No | 'paypal' | Payment method used |
| `isManual` | Boolean | No | false | Whether subscription was manually created |
| `manualDetails.createdBy` | ObjectId | No | - | Admin who created manual subscription |
| `manualDetails.reason` | String | No | - | Reason for manual creation |
| `manualDetails.notes` | String | No | - | Additional notes |
| `paymentDetails.paypalSubscriptionId` | String | No | - | PayPal subscription ID |
| `paymentDetails.paymayaSubscriptionId` | String | No | - | PayMaya subscription ID |
| `paymentDetails.stripeSubscriptionId` | String | No | - | Stripe subscription ID |
| `paymentDetails.lastPaymentId` | String | No | - | Last payment transaction ID |
| `paymentDetails.lastPaymentDate` | Date | No | - | Last payment date |
| `paymentDetails.nextPaymentAmount` | Number | No | - | Next payment amount |
| `usage.services.current` | Number | No | 0 | Current services count |
| `usage.services.limit` | Number | No | - | Services limit from plan |
| `usage.bookings.current` | Number | No | 0 | Current bookings count |
| `usage.bookings.limit` | Number | No | - | Bookings limit from plan |
| `usage.storage.current` | Number | No | 0 | Current storage used (MB) |
| `usage.storage.limit` | Number | No | - | Storage limit from plan (MB) |
| `usage.apiCalls.current` | Number | No | 0 | Current API calls count |
| `usage.apiCalls.limit` | Number | No | - | API calls limit from plan |
| `features.prioritySupport` | Boolean | No | false | Priority support enabled |
| `features.advancedAnalytics` | Boolean | No | false | Advanced analytics enabled |
| `features.customBranding` | Boolean | No | false | Custom branding enabled |
| `features.apiAccess` | Boolean | No | false | API access enabled |
| `features.whiteLabel` | Boolean | No | false | White label enabled |
| `trial.isTrial` | Boolean | No | false | Whether this is a trial subscription |
| `trial.trialEndDate` | Date | No | - | Trial end date |
| `trial.trialUsed` | Boolean | No | false | Whether user has used trial before |
| `history` | Array | No | [] | Subscription change history |

### Status Values

- `active`: Subscription is active and valid
- `cancelled`: User cancelled the subscription
- `expired`: Subscription has expired
- `suspended`: Subscription is temporarily suspended
- `pending`: Subscription is pending activation

### Virtual Properties

#### `duration`
Returns the subscription duration in days.

```javascript
const subscription = await UserSubscription.findById(id);
console.log(subscription.duration); // e.g., 30
```

#### `daysUntilRenewal`
Returns the number of days until the next renewal.

```javascript
const subscription = await UserSubscription.findById(id);
console.log(subscription.daysUntilRenewal); // e.g., 15
```

### Instance Methods

#### `isActive()`
Checks if the subscription is currently active.

```javascript
const subscription = await UserSubscription.findById(id);
if (subscription.isActive()) {
  // Subscription is active
}
```

#### `hasFeatureAccess(featureName)`
Checks if the user has access to a specific feature.

```javascript
const subscription = await UserSubscription.findById(id).populate('plan');
if (subscription.hasFeatureAccess('advanced_analytics')) {
  // User has access to advanced analytics
}
```

#### `checkUsageLimit(featureName)`
Checks if the user is within their usage limit for a feature.

```javascript
const subscription = await UserSubscription.findById(id).populate('plan');
if (subscription.checkUsageLimit('service_creation')) {
  // User can create more services
}
```

#### `incrementUsage(featureName, amount)`
Increments the usage counter for a feature.

```javascript
const subscription = await UserSubscription.findById(id);
await subscription.incrementUsage('service_creation', 1);
```

#### `cancel(reason)`
Cancels the subscription.

```javascript
const subscription = await UserSubscription.findById(id);
await subscription.cancel('User requested cancellation');
```

#### `renew()`
Renews the subscription for another billing cycle.

```javascript
const subscription = await UserSubscription.findById(id);
await subscription.renew();
```

### Static Methods

#### `getActiveSubscriptions()`
Returns all active subscriptions with populated user and plan.

```javascript
const activeSubscriptions = await UserSubscription.getActiveSubscriptions();
```

#### `getSubscriptionsDueForRenewal()`
Returns subscriptions that are due for renewal.

```javascript
const dueSubscriptions = await UserSubscription.getSubscriptionsDueForRenewal();
```

### Example Document

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "user": "507f1f77bcf86cd799439010",
  "plan": "507f1f77bcf86cd799439011",
  "status": "active",
  "billingCycle": "monthly",
  "startDate": "2024-01-15T10:00:00.000Z",
  "endDate": "2024-02-15T10:00:00.000Z",
  "nextBillingDate": "2024-02-15T10:00:00.000Z",
  "paymentMethod": "paypal",
  "isManual": false,
  "paymentDetails": {
    "paypalSubscriptionId": "I-BW452GLLEP1G",
    "lastPaymentId": "PAYID-123456789",
    "lastPaymentDate": "2024-01-15T10:00:00.000Z",
    "nextPaymentAmount": 19.99
  },
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
  "trial": {
    "isTrial": false,
    "trialUsed": false
  },
  "history": [
    {
      "action": "subscribed",
      "toPlan": "Standard",
      "timestamp": "2024-01-15T10:00:00.000Z",
      "amount": 19.99
    }
  ],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

## 3. Payment

The `Payment` entity tracks all payment transactions related to subscriptions, including successful payments, failures, and refunds.

### Schema Definition

```javascript
{
  user: ObjectId,            // Required, ref: 'User'
  subscription: ObjectId,   // Required, ref: 'UserSubscription'
  amount: Number,           // Required
  currency: String,         // Default: 'USD'
  status: String,           // Enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled']
  paymentMethod: String,    // Enum: ['paypal', 'paymaya', 'stripe', 'bank_transfer']
  paymentDetails: {
    transactionId: String,
    paypalOrderId: String,
    paypalPaymentId: String,
    paymayaCheckoutId: String,
    paymayaPaymentId: String,
    stripePaymentIntentId: String,
    bankReference: String
  },
  billingPeriod: {
    startDate: Date,
    endDate: Date
  },
  description: String,
  metadata: Object,         // Default: {}
  processedAt: Date,
  failedAt: Date,
  failureReason: String,
  refundedAt: Date,
  refundAmount: Number,
  refundReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `user` | ObjectId | Yes | - | Reference to User model |
| `subscription` | ObjectId | Yes | - | Reference to UserSubscription model |
| `amount` | Number | Yes | - | Payment amount |
| `currency` | String | No | 'USD' | Currency code |
| `status` | String | No | 'pending' | Payment status |
| `paymentMethod` | String | Yes | - | Payment method used |
| `paymentDetails.transactionId` | String | No | - | Generic transaction ID |
| `paymentDetails.paypalOrderId` | String | No | - | PayPal order ID |
| `paymentDetails.paypalPaymentId` | String | No | - | PayPal payment ID |
| `paymentDetails.paymayaCheckoutId` | String | No | - | PayMaya checkout ID |
| `paymentDetails.paymayaPaymentId` | String | No | - | PayMaya payment ID |
| `paymentDetails.stripePaymentIntentId` | String | No | - | Stripe payment intent ID |
| `paymentDetails.bankReference` | String | No | - | Bank transfer reference |
| `billingPeriod.startDate` | Date | No | - | Billing period start |
| `billingPeriod.endDate` | Date | No | - | Billing period end |
| `description` | String | No | - | Payment description |
| `metadata` | Object | No | {} | Additional metadata |
| `processedAt` | Date | No | - | When payment was processed |
| `failedAt` | Date | No | - | When payment failed |
| `failureReason` | String | No | - | Reason for failure |
| `refundedAt` | Date | No | - | When payment was refunded |
| `refundAmount` | Number | No | - | Refund amount |
| `refundReason` | String | No | - | Reason for refund |

### Status Values

- `pending`: Payment is pending processing
- `completed`: Payment was successful
- `failed`: Payment failed
- `refunded`: Payment was refunded
- `cancelled`: Payment was cancelled

### Example Document

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "user": "507f1f77bcf86cd799439010",
  "subscription": "507f1f77bcf86cd799439012",
  "amount": 19.99,
  "currency": "USD",
  "status": "completed",
  "paymentMethod": "paypal",
  "paymentDetails": {
    "transactionId": "TXN-123456789",
    "paypalOrderId": "ORDER-123456789",
    "paypalPaymentId": "PAYID-123456789"
  },
  "billingPeriod": {
    "startDate": "2024-01-15T10:00:00.000Z",
    "endDate": "2024-02-15T10:00:00.000Z"
  },
  "description": "Monthly subscription payment - Standard Plan",
  "metadata": {},
  "processedAt": "2024-01-15T10:05:00.000Z",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:05:00.000Z"
}
```

---

## 4. FeatureUsage

The `FeatureUsage` entity tracks individual feature usage events for analytics and billing purposes.

### Schema Definition

```javascript
{
  user: ObjectId,           // Required, ref: 'User'
  subscription: ObjectId,   // Required, ref: 'UserSubscription'
  feature: String,         // Required, enum: [...]
  usage: {
    count: Number,          // Default: 1
    amount: Number,
    metadata: Object        // Default: {}
  },
  timestamp: Date,          // Default: Date.now
  createdAt: Date,
  updatedAt: Date
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `user` | ObjectId | Yes | - | Reference to User model |
| `subscription` | ObjectId | Yes | - | Reference to UserSubscription model |
| `feature` | String | Yes | - | Feature identifier (see enum below) |
| `usage.count` | Number | No | 1 | Usage count |
| `usage.amount` | Number | No | - | Monetary value if applicable |
| `usage.metadata` | Object | No | {} | Additional usage metadata |
| `timestamp` | Date | No | Date.now | When the usage occurred |

### Feature Enum Values

- `service_creation`: Service creation event
- `booking_management`: Booking management action
- `analytics_view`: Analytics dashboard view
- `api_call`: API call made
- `file_upload`: File upload action
- `email_notification`: Email notification sent
- `sms_notification`: SMS notification sent
- `custom_branding`: Custom branding feature used
- `priority_support`: Priority support request
- `advanced_search`: Advanced search feature used

### Example Document

```json
{
  "_id": "507f1f77bcf86cd799439014",
  "user": "507f1f77bcf86cd799439010",
  "subscription": "507f1f77bcf86cd799439012",
  "feature": "service_creation",
  "usage": {
    "count": 1,
    "amount": null,
    "metadata": {
      "serviceId": "507f1f77bcf86cd799439015",
      "category": "home_repair"
    }
  },
  "timestamp": "2024-01-20T14:30:00.000Z",
  "createdAt": "2024-01-20T14:30:00.000Z",
  "updatedAt": "2024-01-20T14:30:00.000Z"
}
```

---

## Entity Relationships

```
User
  └── UserSubscription (1:1 or 1:many)
      ├── SubscriptionPlan (many:1)
      ├── Payment (1:many)
      └── FeatureUsage (1:many)
```

### Relationship Details

1. **User → UserSubscription**: One user can have multiple subscriptions (historical), but typically one active subscription
2. **UserSubscription → SubscriptionPlan**: Many subscriptions reference one plan
3. **UserSubscription → Payment**: One subscription can have many payment records
4. **UserSubscription → FeatureUsage**: One subscription can have many feature usage records

---

## Database Indexes

### UserSubscription Indexes

```javascript
// Single field indexes
{ user: 1 }
{ status: 1 }
{ nextBillingDate: 1 }

// Nested field indexes
{ 'paymentDetails.paypalSubscriptionId': 1 }
{ 'paymentDetails.paymayaSubscriptionId': 1 }
```

### Payment Indexes

```javascript
// Single field indexes
{ user: 1 }
{ subscription: 1 }
{ status: 1 }
{ createdAt: -1 }  // Descending for recent payments first
```

### FeatureUsage Indexes

```javascript
// Compound indexes
{ user: 1, feature: 1 }
{ subscription: 1 }
{ timestamp: -1 }  // Descending for recent usage first
```

---

## Usage Examples

### Creating a Subscription Plan

```javascript
const { SubscriptionPlan } = require('../models/LocalProPlus');

const plan = await SubscriptionPlan.create({
  name: 'Premium',
  description: 'For established businesses',
  price: {
    monthly: 39.99,
    yearly: 399.99,
    currency: 'USD'
  },
  features: [
    {
      name: 'advanced_analytics',
      description: 'Advanced analytics dashboard',
      included: true,
      limit: null
    }
  ],
  limits: {
    maxServices: 50,
    maxBookings: 500,
    maxProviders: 10,
    maxStorage: 2048,
    maxApiCalls: 10000
  },
  benefits: ['Advanced analytics', 'Priority support', 'White label'],
  isActive: true,
  isPopular: false,
  sortOrder: 3
});
```

### Creating a User Subscription

```javascript
const { UserSubscription } = require('../models/LocalProPlus');

const subscription = await UserSubscription.create({
  user: userId,
  plan: planId,
  status: 'active',
  billingCycle: 'monthly',
  paymentMethod: 'paypal',
  paymentDetails: {
    paypalSubscriptionId: 'I-BW452GLLEP1G',
    nextPaymentAmount: 19.99
  },
  usage: {
    services: { current: 0, limit: 15 },
    bookings: { current: 0, limit: 100 },
    storage: { current: 0, limit: 500 },
    apiCalls: { current: 0, limit: 5000 }
  },
  features: {
    prioritySupport: true,
    advancedAnalytics: true,
    customBranding: true,
    apiAccess: true,
    whiteLabel: false
  }
});
```

### Recording a Payment

```javascript
const { Payment } = require('../models/LocalProPlus');

const payment = await Payment.create({
  user: userId,
  subscription: subscriptionId,
  amount: 19.99,
  currency: 'USD',
  status: 'completed',
  paymentMethod: 'paypal',
  paymentDetails: {
    paypalOrderId: 'ORDER-123456789',
    paypalPaymentId: 'PAYID-123456789',
    transactionId: 'TXN-123456789'
  },
  billingPeriod: {
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-02-15')
  },
  description: 'Monthly subscription payment - Standard Plan',
  processedAt: new Date()
});
```

### Tracking Feature Usage

```javascript
const { FeatureUsage } = require('../models/LocalProPlus');

const usage = await FeatureUsage.create({
  user: userId,
  subscription: subscriptionId,
  feature: 'service_creation',
  usage: {
    count: 1,
    metadata: {
      serviceId: serviceId,
      category: 'home_repair'
    }
  }
});
```

### Querying Active Subscriptions

```javascript
const { UserSubscription } = require('../models/LocalProPlus');

// Get all active subscriptions
const activeSubscriptions = await UserSubscription.getActiveSubscriptions();

// Get subscriptions due for renewal
const dueSubscriptions = await UserSubscription.getSubscriptionsDueForRenewal();

// Find user's subscription
const userSubscription = await UserSubscription.findOne({ user: userId })
  .populate('plan')
  .populate('user');
```

### Checking Feature Access

```javascript
const { UserSubscription } = require('../models/LocalProPlus');

const subscription = await UserSubscription.findOne({ user: userId })
  .populate('plan');

if (subscription && subscription.isActive()) {
  if (subscription.hasFeatureAccess('advanced_analytics')) {
    // User has access to advanced analytics
  }
  
  if (subscription.checkUsageLimit('service_creation')) {
    // User can create more services
    await subscription.incrementUsage('service_creation', 1);
  }
}
```

### Getting Payment History

```javascript
const { Payment } = require('../models/LocalProPlus');

// Get all payments for a user
const payments = await Payment.find({ user: userId })
  .sort({ createdAt: -1 })
  .populate('subscription');

// Get payments for a subscription
const subscriptionPayments = await Payment.find({ subscription: subscriptionId })
  .sort({ createdAt: -1 });

// Get completed payments
const completedPayments = await Payment.find({
  user: userId,
  status: 'completed'
}).sort({ createdAt: -1 });
```

### Getting Usage Statistics

```javascript
const { FeatureUsage } = require('../models/LocalProPlus');

// Get usage for a specific feature
const serviceCreations = await FeatureUsage.find({
  user: userId,
  feature: 'service_creation',
  timestamp: { $gte: new Date('2024-01-01') }
});

// Get all usage for a subscription
const allUsage = await FeatureUsage.find({ subscription: subscriptionId })
  .sort({ timestamp: -1 });
```

---

## Best Practices

1. **Always populate references**: When querying subscriptions, populate the `plan` and `user` references for complete data
2. **Check subscription status**: Always verify subscription is active before granting access
3. **Track usage incrementally**: Use `incrementUsage()` method to track feature usage
4. **Handle payment failures**: Monitor payment status and handle failures appropriately
5. **Use indexes**: Leverage the defined indexes for efficient queries
6. **Maintain history**: The subscription history array provides an audit trail of changes
7. **Validate limits**: Always check usage limits before allowing actions

---

## Model Export

All models are exported from `src/models/LocalProPlus.js`:

```javascript
const {
  SubscriptionPlan,
  UserSubscription,
  Payment,
  FeatureUsage
} = require('../models/LocalProPlus');
```

---

## Related Documentation

- [LocalPro Plus Subscription System](./LOCALPRO_PLUS_SUBSCRIPTION_SYSTEM.md)
- [LocalPro Plus Flow Documentation](./LOCALPRO_PLUS_FLOW_DOCUMENTATION.md)

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0

