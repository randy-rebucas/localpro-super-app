# Referrals Features Documentation

## Overview

The Referrals feature enables users to refer others to the LocalPro Super App platform and earn rewards for successful referrals. It provides a comprehensive referral program with code generation, tracking, reward management, leaderboards, and analytics. The system supports multiple referral types and reward structures, making it easy for users to share the platform and be rewarded for their referrals.

## Base Path
`/api/referrals`

---

## Core Features

### 1. Referral Code Management
- **Code Generation** - Automatic generation of unique referral codes
- **Code Validation** - Validate referral codes before use
- **Code Sharing** - Multiple sharing methods (email, SMS, social media, direct links)
- **Code Expiration** - Automatic expiration after specified period (default: 90 days)
- **Code Tracking** - Track code usage and performance

### 2. Referral Tracking
- **Click Tracking** - Track referral link clicks and visits
- **Source Tracking** - Track referral sources (email, SMS, social media, direct link, QR code, app share)
- **UTM Parameters** - Support for UTM tracking (source, medium, campaign)
- **Analytics** - Comprehensive tracking of referral performance
- **Conversion Tracking** - Track referral conversions and completion

### 3. Referral Types
- **Signup Referrals** - Rewards for new user signups
- **Service Booking** - Rewards for service bookings
- **Supplies Purchase** - Rewards for supply purchases
- **Course Enrollment** - Rewards for course enrollments
- **Loan Application** - Rewards for loan applications
- **Rental Booking** - Rewards for rental bookings
- **Subscription Upgrade** - Rewards for subscription upgrades

### 4. Reward Management
- **Reward Types** - Multiple reward types:
  - Credit (wallet credit)
  - Discount (percentage or fixed amount)
  - Cash (cash payment)
  - Points (loyalty points)
  - Subscription Days (free subscription days)
- **Reward Calculation** - Automatic reward calculation based on trigger action
- **Reward Distribution** - Separate rewards for referrer and referee
- **Reward Status** - Track reward status (pending, processed, paid, failed)
- **Reward History** - Complete reward history and tracking

### 5. Referral Invitations
- **Email Invitations** - Send referral invitations via email
- **SMS Invitations** - Send referral invitations via SMS
- **Custom Messages** - Include custom messages with invitations
- **Bulk Invitations** - Send invitations to multiple recipients
- **Invitation Tracking** - Track invitation delivery and response

### 6. Referral Links & Sharing
- **Referral Links** - Generate unique referral links
- **Share Options** - Multiple sharing options (email, SMS, social media)
- **QR Codes** - Generate QR codes for referrals
- **Social Media Integration** - Easy sharing to social platforms
- **App Share** - Native app sharing support

### 7. Leaderboard System
- **Top Referrers** - Display top referrers by time period
- **Ranking System** - Rank users by referral count or value
- **Time Range Filtering** - Filter leaderboard by time range
- **Public Leaderboard** - Public leaderboard for motivation

### 8. User Preferences
- **Auto-Share Settings** - Configure automatic sharing preferences
- **Social Media Sharing** - Enable/disable social media sharing
- **Email Notifications** - Configure email notification preferences
- **SMS Notifications** - Configure SMS notification preferences
- **Privacy Settings** - Control referral visibility and sharing

### 9. Analytics & Reporting
- **Referral Statistics** - Personal referral statistics for users
- **Admin Analytics** - Comprehensive analytics for administrators
- **Conversion Rates** - Track referral conversion rates
- **Trend Analysis** - Analyze referral trends over time
- **Revenue Tracking** - Track revenue generated from referrals
- **Performance Metrics** - Detailed performance metrics

### 10. Referral Processing
- **Automatic Processing** - Automatic referral completion detection
- **Manual Processing** - Admin manual processing option
- **Verification System** - Verify referral completion
- **Reward Processing** - Automatic reward distribution
- **Status Management** - Track referral status through lifecycle

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/validate` | Validate referral code | `{ code: string }` |
| POST | `/track` | Track referral click | `{ code: string, source: string, trackingData?: object }` |
| GET | `/leaderboard` | Get referral leaderboard | Query: `limit`, `timeRange` |

### Authenticated Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/me` | Get my referrals | `timeRange`, `page`, `limit` |
| GET | `/stats` | Get referral stats | `timeRange` |
| GET | `/links` | Get referral links | - |
| GET | `/rewards` | Get referral rewards | `page`, `limit`, `status` |
| POST | `/invite` | Send referral invitation | Body: `emails[]`, `phoneNumbers[]`, `message`, `method` |
| PUT | `/preferences` | Update referral preferences | Body: `autoShare`, `shareOnSocial`, `emailNotifications`, `smsNotifications` |

### Admin Endpoints

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/process` | Process referral completion | **admin** |
| GET | `/analytics` | Get referral analytics | **admin** |

---

## Request/Response Examples

### Validate Referral Code

```http
POST /api/referrals/validate
Content-Type: application/json

{
  "code": "REF123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "code": "REF123456",
    "referrer": {
      "_id": "64a1b2c3d4e5f6789012345",
      "firstName": "John",
      "lastName": "Doe"
    },
    "expiresAt": "2025-04-01T00:00:00.000Z"
  }
}
```

### Track Referral Click

```http
POST /api/referrals/track
Content-Type: application/json

{
  "code": "REF123456",
  "source": "social_media",
  "trackingData": {
    "utmSource": "twitter",
    "utmMedium": "social",
    "utmCampaign": "spring",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral click tracked successfully"
}
```

### Send Referral Invitation

```http
POST /api/referrals/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "emails": ["friend@example.com"],
  "phoneNumbers": ["+1234567890"],
  "message": "Join LocalPro and get rewards!",
  "method": "email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral invitations sent successfully",
  "data": {
    "emailsSent": 1,
    "smsSent": 0,
    "referralCode": "REF123456",
    "referralLink": "https://localpro.app/ref/REF123456"
  }
}
```

### Get My Referrals

```http
GET /api/referrals/me?timeRange=30&page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 25,
  "page": 1,
  "pages": 3,
  "data": {
    "stats": {
      "totalReferrals": 25,
      "completedReferrals": 15,
      "pendingReferrals": 8,
      "totalRewards": 500.00,
      "currency": "USD"
    },
    "referrals": [
      {
        "_id": "64a1b2c3d4e5f6789012346",
        "referee": {
          "_id": "64a1b2c3d4e5f6789012347",
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane@example.com"
        },
        "referralCode": "REF123456",
        "status": "completed",
        "referralType": "signup",
        "timeline": {
          "referredAt": "2025-01-01T10:00:00.000Z",
          "signupAt": "2025-01-02T14:30:00.000Z",
          "completedAt": "2025-01-05T09:00:00.000Z"
        },
        "reward": {
          "type": "credit",
          "amount": 25.00,
          "currency": "USD"
        }
      }
    ]
  }
}
```

### Get Referral Stats

```http
GET /api/referrals/stats?timeRange=30
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReferrals": 25,
    "completedReferrals": 15,
    "pendingReferrals": 8,
    "expiredReferrals": 2,
    "totalRewards": 500.00,
    "pendingRewards": 150.00,
    "currency": "USD",
    "conversionRate": 60.0,
    "averageReward": 33.33
  }
}
```

### Get Referral Links

```http
GET /api/referrals/links
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referralCode": "REF123456",
    "referralLink": "https://localpro.app/ref/REF123456",
    "qrCode": "https://api.qrserver.com/v1/create-qr-code/?data=https://localpro.app/ref/REF123456",
    "shareOptions": {
      "email": "mailto:?subject=Join%20LocalPro&body=https://localpro.app/ref/REF123456",
      "sms": "sms:?body=Join%20LocalPro:%20https://localpro.app/ref/REF123456",
      "facebook": "https://www.facebook.com/sharer/sharer.php?u=https://localpro.app/ref/REF123456",
      "twitter": "https://twitter.com/intent/tweet?url=https://localpro.app/ref/REF123456",
      "whatsapp": "https://wa.me/?text=Join%20LocalPro:%20https://localpro.app/ref/REF123456"
    }
  }
}
```

### Get Referral Rewards

```http
GET /api/referrals/rewards?page=1&limit=10&status=processed
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 15,
  "page": 1,
  "pages": 2,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012346",
      "referralCode": "REF123456",
      "reward": {
        "type": "credit",
        "amount": 25.00,
        "currency": "USD"
      },
      "rewardDistribution": {
        "referrerReward": {
          "amount": 25.00,
          "currency": "USD",
          "type": "credit",
          "status": "paid",
          "processedAt": "2025-01-05T10:00:00.000Z",
          "transactionId": "TXN123456"
        }
      },
      "timeline": {
        "completedAt": "2025-01-05T09:00:00.000Z",
        "rewardedAt": "2025-01-05T10:00:00.000Z"
      }
    }
  ]
}
```

### Update Referral Preferences

```http
PUT /api/referrals/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "autoShare": true,
  "shareOnSocial": true,
  "emailNotifications": true,
  "smsNotifications": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral preferences updated successfully",
  "data": {
    "autoShare": true,
    "shareOnSocial": true,
    "emailNotifications": true,
    "smsNotifications": false
  }
}
```

### Get Leaderboard

```http
GET /api/referrals/leaderboard?limit=10&timeRange=30
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "rank": 1,
      "user": {
        "_id": "64a1b2c3d4e5f6789012345",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": "https://example.com/avatar.jpg"
        }
      },
      "totalReferrals": 50,
      "completedReferrals": 35,
      "totalRewards": 1250.00,
      "currency": "USD"
    }
  ]
}
```

### Process Referral Completion (Admin)

```http
POST /api/referrals/process
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "referralId": "64a1b2c3d4e5f6789012346",
  "triggerAction": {
    "type": "booking",
    "referenceId": "64a1b2c3d4e5f6789012347",
    "referenceType": "Booking",
    "amount": 120,
    "currency": "USD",
    "completedAt": "2025-01-05T09:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral processed successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012346",
    "status": "completed",
    "reward": {
      "type": "credit",
      "amount": 25.00,
      "currency": "USD"
    },
    "rewardDistribution": {
      "referrerReward": {
        "status": "processed",
        "processedAt": "2025-01-05T10:00:00.000Z"
      }
    }
  }
}
```

### Get Referral Analytics (Admin)

```http
GET /api/referrals/analytics?timeRange=30&groupBy=day
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalReferrals": 1000,
      "completedReferrals": 650,
      "pendingReferrals": 300,
      "expiredReferrals": 50,
      "totalRewards": 15000.00,
      "conversionRate": 65.0
    },
    "trends": [
      {
        "date": "2025-01-01",
        "referrals": 25,
        "completed": 15,
        "rewards": 375.00
      }
    ],
    "referralTypes": [
      {
        "type": "signup",
        "count": 400,
        "completed": 280,
        "rewards": 7000.00
      },
      {
        "type": "service_booking",
        "count": 300,
        "completed": 200,
        "rewards": 5000.00
      }
    ],
    "topReferrers": [
      {
        "user": "64a1b2c3d4e5f6789012345",
        "totalReferrals": 50,
        "completedReferrals": 35,
        "totalRewards": 1250.00
      }
    ]
  }
}
```

---

## Referral Flow

### 1. Referral Generation
- User generates unique referral code
- System creates referral code and link
- User receives referral code and sharing options
- Referral code stored with user association

### 2. Referral Sharing
- User shares referral code/link via:
  - Email invitation
  - SMS invitation
  - Social media
  - Direct link
  - QR code
  - App share
- System tracks sharing source and method
- Click tracking records referral visits

### 3. Referral Conversion
- New user signs up with referral code
- Referral status: `pending`
- System tracks referral association
- User completes trigger action (booking, purchase, etc.)
- Referral marked as `completed`

### 4. Reward Distribution
- System calculates rewards based on:
  - Referral type
  - Trigger action amount
  - Reward configuration
- Rewards distributed to:
  - Referrer (person who referred)
  - Referee (person who was referred)
- Reward status: `pending` → `processed` → `paid`
- Rewards credited to user accounts

---

## Referral Status Flow

```
pending → completed → rewarded
```

**Status Details:**
- **pending** - Referral created, awaiting completion
- **completed** - Referral completed (trigger action fulfilled)
- **expired** - Referral expired (past expiration date)
- **cancelled** - Referral cancelled

---

## Referral Types

### Signup Referrals
- **Trigger**: New user signup with referral code
- **Reward**: Typically credit or discount for both referrer and referee
- **Completion**: Automatic on signup

### Service Booking Referrals
- **Trigger**: Service booking completed
- **Reward**: Percentage or fixed amount based on booking value
- **Completion**: Automatic on booking completion

### Supplies Purchase Referrals
- **Trigger**: Supply purchase completed
- **Reward**: Percentage or fixed amount based on purchase value
- **Completion**: Automatic on purchase completion

### Course Enrollment Referrals
- **Trigger**: Course enrollment completed
- **Reward**: Percentage or fixed amount based on course price
- **Completion**: Automatic on enrollment

### Loan Application Referrals
- **Trigger**: Loan application approved
- **Reward**: Fixed amount or percentage
- **Completion**: Automatic on loan approval

### Rental Booking Referrals
- **Trigger**: Rental booking completed
- **Reward**: Percentage or fixed amount based on rental value
- **Completion**: Automatic on rental completion

### Subscription Upgrade Referrals
- **Trigger**: Subscription upgrade completed
- **Reward**: Subscription days or credit
- **Completion**: Automatic on upgrade

---

## Data Models

### Referral Model

```javascript
{
  // Core Fields
  referrer: ObjectId,              // Required, User reference (person who referred)
  referee: ObjectId,               // Required, User reference (person referred)
  referralCode: String,            // Required, unique
  status: String,                  // enum: pending, completed, expired, cancelled
  referralType: String,            // Required, enum: signup, service_booking, supplies_purchase, course_enrollment, loan_application, rental_booking, subscription_upgrade
  
  // Trigger Action
  triggerAction: {
    type: String,                  // Required, enum: booking, purchase, enrollment, loan, rental, subscription
    referenceId: ObjectId,          // Required, reference to triggering entity
    referenceType: String,          // Required, entity type
    amount: Number,                 // Default: 0
    currency: String,              // Default: USD
    completedAt: Date               // Optional
  },
  
  // Reward Configuration
  reward: {
    type: String,                   // Required, enum: credit, discount, cash, points, subscription_days
    amount: Number,                 // Required
    currency: String,              // Default: USD
    description: String,
    isPercentage: Boolean,         // Default: false
    maxAmount: Number,             // Optional
    subscriptionDays: Number,      // For subscription_days type
    discountCode: String,          // For discount type
    discountType: String          // enum: percentage, fixed_amount
  },
  
  // Tracking
  tracking: {
    source: String,                // Default: direct_link, enum: email, sms, social_media, direct_link, qr_code, app_share
    campaign: String,
    medium: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    ipAddress: String,
    userAgent: String,
    referrerUrl: String
  },
  
  // Timeline
  timeline: {
    referredAt: Date,              // Default: now
    signupAt: Date,                // Optional
    firstActionAt: Date,           // Optional
    completedAt: Date,              // Optional
    rewardedAt: Date,               // Optional
    expiresAt: Date                // Default: +90 days
  },
  
  // Reward Distribution
  rewardDistribution: {
    referrerReward: {
      amount: Number,
      currency: String,
      type: String,
      status: String,              // enum: pending, processed, paid, failed
      processedAt: Date,
      paymentMethod: String,
      transactionId: String
    },
    refereeReward: {
      amount: Number,
      currency: String,
      type: String,
      status: String,              // enum: pending, processed, paid, failed
      processedAt: Date,
      paymentMethod: String,
      transactionId: String
    }
  },
  
  // Verification
  verification: {
    isVerified: Boolean,           // Default: false
    verifiedAt: Date,
    verificationMethod: String,    // enum: automatic, manual, admin
    verifiedBy: ObjectId           // User reference
  },
  
  // Analytics
  analytics: {
    clickCount: Number,            // Default: 0
    conversionRate: Number,        // Default: 0
    totalValue: Number,            // Default: 0
    lifetimeValue: Number          // Default: 0
  },
  
  // Metadata
  metadata: {
    notes: String,
    tags: [String],
    customFields: Mixed
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## Reward Types

### Credit
- **Type**: `credit`
- **Description**: Wallet credit added to user account
- **Processing**: Automatic credit to wallet
- **Use Case**: Most common reward type

### Discount
- **Type**: `discount`
- **Description**: Percentage or fixed amount discount
- **Processing**: Discount code generation or automatic application
- **Use Case**: First purchase discounts

### Cash
- **Type**: `cash`
- **Description**: Cash payment to user
- **Processing**: Payment processing required
- **Use Case**: High-value referrals

### Points
- **Type**: `points`
- **Description**: Loyalty points added to account
- **Processing**: Points system integration
- **Use Case**: Loyalty program integration

### Subscription Days
- **Type**: `subscription_days`
- **Description**: Free subscription days
- **Processing**: Subscription extension
- **Use Case**: Subscription-based rewards

---

## Key Metrics

- **Total Referrals** - Total number of referrals created
- **Completed Referrals** - Number of successful referrals
- **Conversion Rate** - Percentage of referrals that complete
- **Total Rewards** - Total value of rewards distributed
- **Average Reward** - Average reward per completed referral
- **Top Referrers** - Users with most successful referrals
- **Referral Types Distribution** - Breakdown by referral type
- **Source Performance** - Performance by referral source
- **Time Trends** - Referral trends over time

---

## Related Features

The Referrals feature integrates with several other features in the LocalPro Super App:

- **User Management** - User profiles and authentication
- **Finance** - Reward payments and wallet credits
- **Email Service** - Referral invitation emails
- **SMS Service** - Referral invitation SMS (Twilio)
- **Analytics** - Referral performance analytics
- **Authentication** - User registration with referral codes
- **Marketplace** - Service booking referrals
- **Supplies** - Purchase referrals
- **Academy** - Course enrollment referrals
- **Rentals** - Rental booking referrals
- **Subscriptions** - Subscription upgrade referrals

---

## Common Use Cases

1. **Referral Code Generation** - Users generate unique referral codes
2. **Referral Sharing** - Users share referral links via multiple channels
3. **Referral Tracking** - System tracks referral clicks and conversions
4. **Referral Completion** - Automatic detection of referral completion
5. **Reward Distribution** - Automatic reward calculation and distribution
6. **Leaderboard Display** - Public leaderboard for top referrers
7. **Analytics Review** - Users and admins review referral performance
8. **Preference Management** - Users configure referral preferences

---

## Error Handling

**Common Error Codes:**
- `400` - Validation errors (invalid code, missing fields)
- `401` - Unauthorized (no token provided)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (referral doesn't exist)
- `409` - Conflict (code already used, duplicate referral)
- `500` - Server error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "code",
      "message": "Invalid referral code"
    }
  ]
}
```

---

## Best Practices

### For Users
1. **Share Widely** - Share referral links across multiple channels
2. **Personal Messages** - Include personal messages in invitations
3. **Follow Up** - Follow up with referred users
4. **Track Performance** - Monitor referral statistics regularly
5. **Use Social Media** - Leverage social media for sharing

### For Developers
1. **Code Validation** - Always validate referral codes before use
2. **Expiration Checks** - Check expiration dates before processing
3. **Reward Calculation** - Ensure accurate reward calculations
4. **Status Management** - Properly manage referral status transitions
5. **Analytics Tracking** - Track all referral events for analytics

### For Admins
1. **Monitor Performance** - Regularly review referral analytics
2. **Optimize Rewards** - Adjust reward structures based on performance
3. **Fraud Prevention** - Monitor for fraudulent referral activity
4. **User Support** - Support users with referral questions
5. **Campaign Management** - Manage referral campaigns effectively

---

## Referral Code Generation

### Code Format
- **Length**: 8 characters
- **Type**: Alphanumeric (letters and numbers)
- **Uniqueness**: Guaranteed unique across system
- **Example**: `REF123456`, `ABC789XY`

### Code Validation
- Check code exists
- Check code is active (not expired)
- Check code status is valid
- Check code hasn't been used (for one-time codes)

---

## Referral Expiration

### Default Expiration
- **Default Period**: 90 days from referral creation
- **Configurable**: Can be adjusted per referral type
- **Expiration Check**: Automatic expiration on status check
- **Expired Status**: Referrals marked as `expired` cannot be completed

### Expiration Handling
- Expired referrals cannot be completed
- Expired referrals removed from active lists
- Expiration date visible to users
- Automatic cleanup of expired referrals

---

*For detailed implementation guidance, see the individual documentation files in the `features/referrals/` and `docs/features/` directories.*

