# Activities Feature Documentation

## Overview
The Activities feature provides comprehensive tracking and display of user activities across the platform. It includes:
- Activity feed generation
- Activity timeline grouped by date
- Gamification with points system
- Leaderboard functionality
- Social interactions (likes, shares, comments, bookmarks)
- Automatic activity tracking via middleware

## Base Path
`/api/activities`

## Endpoints

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/feed` | Get activity feed | AUTHENTICATED |
| GET | `/my` | Get my activities | AUTHENTICATED |
| GET | `/user/:userId` | Get user activities | AUTHENTICATED |
| GET | `/:id` | Get activity | AUTHENTICATED |
| POST | `/` | Create activity | AUTHENTICATED |
| PUT | `/:id` | Update activity | AUTHENTICATED |
| DELETE | `/:id` | Delete activity | AUTHENTICATED |
| POST | `/:id/interactions` | Add interaction | AUTHENTICATED |
| DELETE | `/:id/interactions` | Remove interaction | AUTHENTICATED |
| GET | `/stats/my` | Get my activity stats | AUTHENTICATED |
| GET | `/stats/global` | Get global activity stats | **admin** |
| GET | `/metadata` | Get activity metadata | AUTHENTICATED |
| GET | `/timeline` | Get activity timeline | AUTHENTICATED |
| GET | `/points` | Get user's total points | AUTHENTICATED |
| GET | `/leaderboard` | Get activity leaderboard | AUTHENTICATED |

## Request/Response Examples

### Get Activity Feed
```http
GET /api/activities/feed?page=1&limit=20&timeframe=7d&visibility=public
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "_id": "...",
        "user": {
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://..."
        },
        "type": "service_created",
        "category": "marketplace",
        "action": "Created a service",
        "description": "Created new service: Home Cleaning",
        "impact": "high",
        "points": 50,
        "visibility": "public",
        "analytics": {
          "views": 15,
          "likes": 5,
          "shares": 2,
          "comments": 3
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Activity Timeline
```http
GET /api/activities/timeline?timeframe=30d&limit=100
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "timeframe": "30d",
    "timeline": [
      {
        "_id": "2024-01-15",
        "activities": [
          {
            "_id": "...",
            "type": "service_created",
            "action": "Created a service",
            "createdAt": "2024-01-15T10:30:00Z",
            "points": 50
          }
        ],
        "totalPoints": 75,
        "count": 3
      }
    ]
  }
}
```

### Get User Points
```http
GET /api/activities/points
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "totalPoints": 1250,
    "rank": 42,
    "totalUsers": 500
  }
}
```

### Get Leaderboard
```http
GET /api/activities/leaderboard?timeframe=30d&limit=10
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "timeframe": "30d",
    "leaderboard": [
      {
        "rank": 1,
        "userId": "...",
        "user": {
          "firstName": "Top",
          "lastName": "User",
          "avatar": "https://..."
        },
        "totalPoints": 5000,
        "activityCount": 150
      }
    ],
    "totalEntries": 10
  }
}
```

### Create Activity
```http
POST /api/activities
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "service_created",
  "action": "Created a service",
  "description": "Created new service: Home Cleaning",
  "targetEntity": {
    "type": "service",
    "id": "service_id",
    "name": "Home Cleaning",
    "url": "/services/service_id"
  },
  "visibility": "public",
  "tags": ["service", "cleaning"]
}
```

### Add Interaction
```http
POST /api/activities/:id/interactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "like",
  "metadata": {
    "source": "feed"
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Interaction added successfully",
  "data": {
    "interactionType": "like",
    "analytics": {
      "views": 15,
      "likes": 6,
      "shares": 2,
      "comments": 3
    }
  }
}
```

## Activity Types

### Authentication & Profile
- `user_login` - User logged in
- `user_logout` - User logged out
- `user_register` - User registered
- `profile_update` - Profile updated
- `avatar_upload` - Avatar uploaded
- `password_change` - Password changed
- `email_verification` - Email verified
- `phone_verification` - Phone verified

### Marketplace
- `service_created` - Service created
- `service_updated` - Service updated
- `service_deleted` - Service deleted
- `service_published` - Service published
- `service_viewed` - Service viewed
- `service_favorited` - Service favorited
- `service_shared` - Service shared
- `booking_created` - Booking created
- `booking_accepted` - Booking accepted
- `booking_rejected` - Booking rejected
- `booking_completed` - Booking completed
- `booking_cancelled` - Booking cancelled
- `booking_rescheduled` - Booking rescheduled
- `review_created` - Review created
- `review_updated` - Review updated
- `review_deleted` - Review deleted

### Job Board
- `job_created` - Job posted
- `job_updated` - Job updated
- `job_deleted` - Job deleted
- `job_published` - Job published
- `job_closed` - Job closed
- `job_applied` - Applied for job
- `job_application_withdrawn` - Application withdrawn
- `job_application_approved` - Application approved
- `job_application_rejected` - Application rejected
- `job_application_shortlisted` - Application shortlisted

### Academy
- `course_created` - Course created
- `course_updated` - Course updated
- `course_published` - Course published
- `course_enrolled` - Enrolled in course
- `course_completed` - Course completed
- `course_progress_updated` - Course progress updated
- `course_review_created` - Course review created
- `certificate_earned` - Certificate earned

### Financial
- `payment_made` - Payment made
- `payment_received` - Payment received
- `payment_failed` - Payment failed
- `payment_refunded` - Payment refunded
- `withdrawal_requested` - Withdrawal requested
- `withdrawal_approved` - Withdrawal approved
- `withdrawal_rejected` - Withdrawal rejected
- `invoice_created` - Invoice created
- `invoice_paid` - Invoice paid

### Communication
- `message_sent` - Message sent
- `message_received` - Message received
- `conversation_started` - Conversation started
- `notification_sent` - Notification sent
- `notification_read` - Notification read

### Agency
- `agency_joined` - Joined agency
- `agency_left` - Left agency
- `agency_created` - Agency created
- `agency_updated` - Agency updated
- `provider_added` - Provider added to agency
- `provider_removed` - Provider removed from agency

### Referral
- `referral_sent` - Referral sent
- `referral_accepted` - Referral accepted
- `referral_completed` - Referral completed
- `referral_reward_earned` - Referral reward earned

### Verification
- `verification_requested` - Verification requested
- `verification_approved` - Verification approved
- `verification_rejected` - Verification rejected
- `document_uploaded` - Document uploaded
- `document_verified` - Document verified
- `badge_earned` - Badge earned

### Social
- `connection_made` - Connection made
- `connection_removed` - Connection removed
- `follow_started` - Started following
- `follow_stopped` - Stopped following
- `content_liked` - Content liked
- `content_shared` - Content shared
- `content_commented` - Content commented

## Activity Categories

- `authentication` - Login, logout, registration
- `profile` - Profile updates
- `marketplace` - Services and bookings
- `job_board` - Jobs and applications
- `academy` - Courses and certifications
- `financial` - Payments and transactions
- `communication` - Messages and notifications
- `agency` - Agency management
- `referral` - Referral activities
- `verification` - Trust and verification
- `supplies` - Supply orders
- `rentals` - Rental bookings
- `advertising` - Ad management
- `system` - Settings and preferences
- `social` - Social interactions
- `other` - Miscellaneous

## Interaction Types

- `view` - Viewed activity
- `like` - Liked activity
- `share` - Shared activity
- `comment` - Commented on activity
- `bookmark` - Bookmarked activity

## Impact Levels

- `low` - Minor actions (views, settings changes)
- `medium` - Regular actions (messages, updates)
- `high` - Important actions (service creation, payments)
- `critical` - Critical actions (large payments, verification)

## Points System

Activities earn points based on type and impact:

| Activity | Points |
|----------|--------|
| User registration | 100 |
| Email verification | 50 |
| Phone verification | 50 |
| Service created | 50 |
| Service published | 30 |
| Booking completed | 40 |
| Review created | 25 |
| Job created | 40 |
| Job applied | 15 |
| Course enrolled | 20 |
| Course completed | 100 |
| Certificate earned | 150 |
| Referral completed | 200 |
| Verification approved | 100 |
| Badge earned | 50 |

## Visibility Levels

- `public` - Visible to all users
- `private` - Visible only to the activity owner
- `connections` - Visible to connected users
- `followers` - Visible to followers

## Query Parameters

### Common Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `timeframe` - Time range: `1h`, `1d`, `7d`, `30d`, `90d`
- `types` - Comma-separated activity types to filter
- `categories` - Comma-separated categories to filter
- `visibility` - Visibility level filter

### Feed-specific
- `includeOwn` - Include user's own activities (default: true)

## Automatic Activity Tracking

The system automatically tracks activities through:

1. **Activity Tracker Middleware** - Intercepts successful API calls and creates activity records
2. **Activity Service** - Provides programmatic tracking for controllers

### Middleware Configuration

```javascript
app.use(activityTracker({
  excludePaths: ['/api/activities', '/api/logs', '/api/audit-logs', '/health'],
  onlySuccessful: true,
  minStatusCode: 200,
  maxStatusCode: 299
}));
```

### Manual Tracking in Controllers

```javascript
const activityService = require('../services/activityService');

// Track a service creation
await activityService.trackServiceCreated(userId, service);

// Track a booking
await activityService.trackBookingCreated(userId, booking, service);

// Track a payment
await activityService.trackPayment(userId, payment, 'made');
```

## Related Features
- Marketplace
- Job Board
- Academy
- Finance
- Referrals
- Trust Verification
- Communication
