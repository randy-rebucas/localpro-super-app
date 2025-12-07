# Analytics Feature Documentation

## Overview
The Analytics feature provides comprehensive data analysis and reporting capabilities for the platform. It includes:
- Platform-wide dashboard analytics
- User analytics and engagement metrics
- Provider-specific analytics
- Financial analytics and revenue tracking
- Marketplace and job board analytics
- Real-time metrics
- Time-series data for charts
- Comparison and trend analysis
- Data export (JSON/CSV)

## Base Path
`/api/analytics`

## Endpoints

### Public Endpoints (Authenticated)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/metadata` | Get analytics metadata | AUTHENTICATED |
| POST | `/track` | Track custom event | AUTHENTICATED |

### Provider Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/provider` | Get own provider analytics | **provider** |
| GET | `/provider/:providerId` | Get specific provider analytics | **admin** or owner |

### Admin Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/dashboard` | Dashboard summary | **admin** |
| GET | `/realtime` | Real-time metrics | **admin** |
| GET | `/time-series` | Time series data | **admin** |
| GET | `/comparison` | Period comparison | **admin** |
| GET | `/export` | Export analytics | **admin** |
| GET | `/overview` | Platform overview | **admin** |
| GET | `/users` | User analytics | **admin** |
| GET | `/financial` | Financial analytics | **admin** |
| GET | `/marketplace` | Marketplace analytics | **admin** |
| GET | `/jobs` | Job board analytics | **admin** |
| GET | `/referrals` | Referral analytics | **admin** |
| GET | `/agencies` | Agency analytics | **admin** |
| GET | `/custom` | Custom event analytics | **admin** |

## Request/Response Examples

### Get Dashboard Analytics
```http
GET /api/analytics/dashboard?timeframe=30d
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "summary": {
      "users": {
        "total": 5000,
        "new": 250
      },
      "services": {
        "total": 1200,
        "new": 80
      },
      "bookings": {
        "total": 800,
        "completed": 720,
        "completionRate": "90.0"
      },
      "revenue": {
        "total": 1500000,
        "currency": "PHP"
      },
      "jobs": {
        "total": 150,
        "applications": 450
      },
      "referrals": {
        "total": 100
      },
      "growth": {
        "users": "12.5",
        "services": "8.3",
        "bookings": "15.2",
        "revenue": "22.1",
        "jobs": "5.0",
        "referrals": "18.7"
      }
    },
    "recentActivity": [...],
    "topMetrics": {
      "topProviders": [...],
      "topServices": [...],
      "topCategories": [...]
    },
    "timeframe": "30d",
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Provider Analytics
```http
GET /api/analytics/provider?timeframe=30d
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalServices": 5,
      "activeServices": 4,
      "totalBookings": 50,
      "completedBookings": 45,
      "completionRate": "90.0",
      "totalRevenue": 125000,
      "averageOrderValue": "2777.78"
    },
    "growth": {
      "bookings": "15.5",
      "revenue": "22.3",
      "completedBookings": "12.0"
    },
    "reviews": {
      "averageRating": 4.8,
      "totalReviews": 38,
      "distribution": {
        "5": 30,
        "4": 6,
        "3": 2,
        "2": 0,
        "1": 0
      }
    },
    "revenue": [
      { "month": "2024-01", "revenue": 45000, "bookings": 18 }
    ],
    "bookingTrends": [
      { "date": "2024-01-15", "total": 3, "completed": 3, "cancelled": 0 }
    ],
    "services": [...],
    "timeframe": "30d"
  }
}
```

### Get Financial Analytics
```http
GET /api/analytics/financial?timeframe=30d
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 1500000,
      "transactionCount": 720,
      "averageOrderValue": "2083.33",
      "growth": "22.1"
    },
    "revenueByCategory": [
      { "_id": "cleaning", "revenue": 500000, "bookings": 250 },
      { "_id": "plumbing", "revenue": 300000, "bookings": 120 }
    ],
    "revenueByMonth": [
      { "month": "2024-01", "revenue": 500000, "bookings": 240 }
    ],
    "topEarners": [
      {
        "revenue": 150000,
        "bookings": 60,
        "provider": {
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://..."
        }
      }
    ],
    "paymentMethods": [
      { "_id": "gcash", "count": 400, "total": 800000 },
      { "_id": "card", "count": 200, "total": 500000 }
    ],
    "timeframe": "30d",
    "currency": "PHP"
  }
}
```

### Get Time Series Data
```http
GET /api/analytics/time-series?metric=revenue&timeframe=30d&granularity=daily
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "metric": "revenue",
    "timeframe": "30d",
    "granularity": "daily",
    "series": [
      { "date": "2024-01-01", "count": 24, "revenue": 50000 },
      { "date": "2024-01-02", "count": 28, "revenue": 62000 }
    ]
  }
}
```

### Get Real-Time Metrics
```http
GET /api/analytics/realtime
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "activeUsers": {
      "lastHour": 150,
      "last15Minutes": 45
    },
    "bookings": {
      "lastHour": 12
    },
    "revenue": {
      "lastHour": 25000
    },
    "newUsers": {
      "lastHour": 5
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Export Analytics
```http
GET /api/analytics/export?type=users&timeframe=30d&format=csv
Authorization: Bearer <token>
```

Response (CSV):
```csv
First Name,Last Name,Email,Roles,City,Verified,Created At
John,Doe,john@example.com,provider,Manila,Yes,2024-01-15T08:00:00Z
```

### Track Custom Event
```http
POST /api/analytics/track
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventType": "page_view",
  "module": "marketplace",
  "data": {
    "page": "/services",
    "serviceId": "abc123"
  }
}
```

## Query Parameters

### Timeframes
- `1h` - Last hour
- `24h` - Last 24 hours
- `7d` - Last 7 days
- `30d` - Last 30 days (default)
- `90d` - Last 90 days
- `1y` - Last year

### Date Range
- `startDate` - ISO 8601 date string
- `endDate` - ISO 8601 date string

### Granularities (for time-series)
- `hourly` - Data points per hour
- `daily` - Data points per day
- `weekly` - Data points per week
- `monthly` - Data points per month

### Metrics (for time-series)
- `users` - User registrations
- `bookings` - Booking counts
- `revenue` - Revenue with amounts
- `services` - Service creations
- `jobs` - Job postings

### Export Types
- `overview` - Platform overview data
- `users` - User data export
- `revenue` - Revenue data
- `bookings` - Booking data

### Export Formats
- `json` - JSON format
- `csv` - CSV format (downloadable)

## Event Types

For custom event tracking:
- `page_view` - Page view event
- `service_view` - Service page viewed
- `booking_created` - Booking created
- `booking_completed` - Booking completed
- `job_view` - Job posting viewed
- `job_application` - Job application submitted
- `course_enrollment` - Course enrollment
- `product_purchase` - Product purchased
- `referral_click` - Referral link clicked
- `referral_completed` - Referral completed
- `subscription_upgrade` - Subscription upgraded
- `payment_completed` - Payment completed
- `search_performed` - Search performed
- `filter_applied` - Filter applied
- `user_registration` - User registered
- `user_login` - User logged in
- `profile_update` - Profile updated

## Analytics Models

### AnalyticsEvent
Stores individual analytics events:
```javascript
{
  userId: ObjectId,
  eventType: String,
  eventData: Object,
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    sessionId: String,
    deviceType: String,
    browser: String,
    os: String,
    location: Object
  },
  timestamp: Date
}
```

### UserAnalytics
Aggregated user analytics:
```javascript
{
  userId: ObjectId,
  profile: {
    totalViews: Number,
    totalBookings: Number,
    totalJobsApplied: Number,
    totalCoursesEnrolled: Number,
    totalPurchases: Number,
    totalReferrals: Number,
    lastActiveAt: Date
  },
  engagement: {
    averageSessionDuration: Number,
    totalSessions: Number,
    bounceRate: Number,
    conversionRate: Number
  },
  revenue: {
    totalEarned: Number,
    totalSpent: Number,
    averageOrderValue: Number
  },
  monthlyStats: Array
}
```

### ServiceAnalytics
Service-specific analytics:
```javascript
{
  serviceId: ObjectId,
  views: { total: Number, unique: Number, daily: Array },
  bookings: { total: Number, completed: Number, cancelled: Number, conversionRate: Number },
  revenue: { total: Number, average: Number, monthly: Array },
  ratings: { average: Number, count: Number, distribution: Object }
}
```

### PlatformAnalytics
Daily platform-wide analytics:
```javascript
{
  date: Date,
  users: { total: Number, new: Number, active: Number },
  services: { total: Number, new: Number, active: Number },
  bookings: { total: Number, completed: Number, revenue: Number },
  jobs: { total: Number, applications: Number },
  courses: { total: Number, enrollments: Number },
  referrals: { total: Number, completed: Number }
}
```

## Service Methods

The `analyticsService` provides these methods:

```javascript
// Dashboard
analyticsService.getDashboardSummary(timeframe)

// Provider analytics
analyticsService.getProviderAnalytics(providerId, timeframe)

// Financial analytics
analyticsService.getFinancialAnalytics(timeframe)

// Time series
analyticsService.getTimeSeriesData(metric, timeframe, granularity)

// Real-time
analyticsService.getRealTimeMetrics()

// Export
analyticsService.exportAnalytics(type, timeframe, format)

// Event tracking
analyticsService.trackEvent(userId, eventType, eventData, metadata)

// Top metrics
analyticsService.getTopProviders(dateFilter, limit)
analyticsService.getTopServices(dateFilter, limit)
analyticsService.getTopCategories(dateFilter, limit)
```

## Growth Calculations

Growth percentages are calculated by comparing the current period with the previous period of equal length:

```javascript
growth = ((current - previous) / previous) * 100
```

For example, with `timeframe=30d`:
- Current period: Last 30 days
- Previous period: 31-60 days ago

## Best Practices

1. **Caching**: Consider caching dashboard data for frequently accessed analytics
2. **Rate Limiting**: Implement rate limiting for real-time endpoints
3. **Data Retention**: Archive old analytics data to maintain performance
4. **Privacy**: Ensure GDPR compliance when exporting user data
5. **Indexing**: Ensure proper MongoDB indexes for analytics queries

## Related Features
- [Activities](/api/activities)
- [Logs](/api/logs)
- [Monitoring](/api/monitoring)
- [Reports](/api/reports)
