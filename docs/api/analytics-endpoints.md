# Analytics API Endpoints Reference

## Overview

The Analytics API provides comprehensive data analysis and reporting capabilities for the LocalPro platform. It includes platform-wide metrics, user analytics, provider-specific data, financial reports, and real-time monitoring.

**Base Path:** `/api/analytics`

**Authentication:** All endpoints require Bearer token authentication.

---

## Complete Endpoints Summary

| # | Method | Endpoint | Description | Access | Query Parameters |
|---|--------|----------|-------------|--------|------------------|
| 1 | GET | `/metadata` | Get available metrics, timeframes, options | Authenticated | - |
| 2 | GET | `/dashboard` | Dashboard analytics summary with growth | **Admin** | `timeframe` |
| 3 | GET | `/realtime` | Real-time metrics (active users, recent bookings) | **Admin** | - |
| 4 | GET | `/time-series` | Time series data for charts | **Admin** | `metric`, `timeframe`, `granularity` |
| 5 | GET | `/comparison` | Period comparison (current vs previous) | **Admin** | `timeframe` |
| 6 | GET | `/export` | Export analytics data (JSON/CSV) | **Admin** | `type`, `timeframe`, `format` |
| 7 | GET | `/overview` | Platform overview analytics | **Admin** | `startDate`, `endDate` |
| 8 | GET | `/users` | User analytics & engagement | **Admin** | `startDate`, `endDate` |
| 9 | GET | `/financial` | Financial analytics & revenue | **Admin** | `timeframe` |
| 10 | GET | `/marketplace` | Marketplace analytics | **Admin** | `startDate`, `endDate` |
| 11 | GET | `/jobs` | Job board analytics | **Admin** | `startDate`, `endDate` |
| 12 | GET | `/referrals` | Referral analytics | **Admin** | `startDate`, `endDate` |
| 13 | GET | `/agencies` | Agency analytics | **Admin** | `startDate`, `endDate` |
| 14 | GET | `/provider` | Current user's provider analytics | **Provider/Admin** | `timeframe` |
| 15 | GET | `/provider/:providerId` | Specific provider's analytics | **Admin/Owner** | `timeframe` |
| 16 | GET | `/custom` | Custom event-based analytics | **Admin** | `eventType`, `module`, `startDate`, `endDate` |
| 17 | POST | `/track` | Track custom analytics event | Authenticated | - |

---

## Endpoint Categories

### Dashboard & Real-time (New)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/dashboard` | Comprehensive dashboard summary with growth metrics | **Admin** |
| GET | `/realtime` | Real-time metrics (last hour/15 min activity) | **Admin** |
| GET | `/time-series` | Time series data for chart visualization | **Admin** |
| GET | `/comparison` | Compare current period vs previous period | **Admin** |
| GET | `/export` | Export analytics data (JSON or CSV download) | **Admin** |
| GET | `/metadata` | Get available options (metrics, timeframes, etc.) | Authenticated |

### Financial Analytics (New)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/financial` | Financial/revenue analytics with trends | **Admin** |

### Provider Analytics (New)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/provider` | Provider-specific analytics dashboard | **Provider/Admin** |
| GET | `/provider/:providerId` | View specific provider's analytics | **Admin/Owner** |

### Platform Analytics (Original)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/overview` | Platform overview (users, services, bookings) | **Admin** |
| GET | `/users` | User registration & engagement analytics | **Admin** |
| GET | `/marketplace` | Service & booking analytics | **Admin** |
| GET | `/jobs` | Job posting & application analytics | **Admin** |
| GET | `/referrals` | Referral program analytics | **Admin** |
| GET | `/agencies` | Agency performance analytics | **Admin** |

### Custom Analytics (Original)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/custom` | Custom event-based analytics | **Admin** |
| POST | `/track` | Track custom analytics event | Authenticated |

---

## Detailed Endpoint Documentation

### 1. GET `/metadata`

Get available analytics options including metrics, timeframes, and export formats.

**Access:** Authenticated

**Response:**
```json
{
  "success": true,
  "data": {
    "timeframes": ["1h", "24h", "7d", "30d", "90d", "1y"],
    "metrics": ["users", "bookings", "revenue", "services", "jobs", "referrals"],
    "granularities": ["hourly", "daily", "weekly", "monthly"],
    "exportTypes": ["overview", "users", "revenue", "bookings"],
    "exportFormats": ["json", "csv"],
    "categories": {
      "services": ["cleaning", "plumbing", "electrical", "carpentry", "painting", "gardening", "other"],
      "jobs": ["full-time", "part-time", "contract", "freelance"]
    }
  }
}
```

---

### 2. GET `/dashboard`

Get comprehensive dashboard analytics summary with growth metrics.

**Access:** Admin only

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeframe` | string | `30d` | Time period (1h, 24h, 7d, 30d, 90d, 1y) |

**Example Request:**
```http
GET /api/analytics/dashboard?timeframe=30d
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "users": { "total": 5000, "new": 250 },
      "services": { "total": 1200, "new": 80 },
      "bookings": { "total": 800, "completed": 720, "completionRate": "90.0" },
      "revenue": { "total": 1500000, "currency": "PHP" },
      "jobs": { "total": 150, "applications": 450 },
      "referrals": { "total": 100 },
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

---

### 3. GET `/realtime`

Get real-time metrics for the last hour.

**Access:** Admin only

**Example Request:**
```http
GET /api/analytics/realtime
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeUsers": {
      "lastHour": 150,
      "last15Minutes": 45
    },
    "bookings": { "lastHour": 12 },
    "revenue": { "lastHour": 25000 },
    "newUsers": { "lastHour": 5 },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### 4. GET `/time-series`

Get time series data for chart visualization.

**Access:** Admin only

**Query Parameters:**
| Parameter | Type | Default | Options |
|-----------|------|---------|---------|
| `metric` | string | `bookings` | users, bookings, revenue, services, jobs |
| `timeframe` | string | `30d` | 1h, 24h, 7d, 30d, 90d, 1y |
| `granularity` | string | `daily` | hourly, daily, weekly, monthly |

**Example Request:**
```http
GET /api/analytics/time-series?metric=revenue&timeframe=30d&granularity=daily
Authorization: Bearer <token>
```

**Response:**
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

---

### 5. GET `/comparison`

Get comparison analytics between current and previous period.

**Access:** Admin only

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeframe` | string | `30d` | Time period for comparison |

**Example Request:**
```http
GET /api/analytics/comparison?timeframe=30d
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current": { ... },
    "growth": {
      "users": "12.5",
      "services": "8.3",
      "bookings": "15.2",
      "revenue": "22.1"
    },
    "timeframe": "30d",
    "comparisonPeriod": "Previous 30d"
  }
}
```

---

### 6. GET `/export`

Export analytics data in JSON or CSV format.

**Access:** Admin only

**Query Parameters:**
| Parameter | Type | Default | Options |
|-----------|------|---------|---------|
| `type` | string | `overview` | overview, users, revenue, bookings |
| `timeframe` | string | `30d` | 1h, 24h, 7d, 30d, 90d, 1y |
| `format` | string | `json` | json, csv |

**Example Request (CSV):**
```http
GET /api/analytics/export?type=users&timeframe=30d&format=csv
Authorization: Bearer <token>
```

**Response (CSV):**
```csv
First Name,Last Name,Email,Roles,City,Verified,Created At
John,Doe,john@example.com,provider,Manila,Yes,2024-01-15T08:00:00Z
```

---

### 7. GET `/overview`

Get platform overview analytics.

**Access:** Admin only

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | ISO8601 | Start of date range |
| `endDate` | ISO8601 | End of date range |

**Example Request:**
```http
GET /api/analytics/overview?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 5000,
      "totalServices": 1200,
      "totalJobs": 300,
      "totalAgencies": 50,
      "totalReferrals": 500
    },
    "userRegistrations": [...],
    "serviceCategories": [...],
    "jobCategories": [...],
    "topProviders": [...],
    "revenueAnalytics": [...],
    "referralAnalytics": [...]
  }
}
```

---

### 8. GET `/users`

Get user analytics and engagement metrics.

**Access:** Admin only

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | ISO8601 | Start of date range |
| `endDate` | ISO8601 | End of date range |

**Response:**
```json
{
  "success": true,
  "data": {
    "userRegistrations": [...],
    "usersByRole": [...],
    "usersByLocation": [...],
    "userEngagement": [...]
  }
}
```

---

### 9. GET `/financial`

Get financial analytics including revenue trends.

**Access:** Admin only

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeframe` | string | `30d` | Time period |

**Example Request:**
```http
GET /api/analytics/financial?timeframe=30d
Authorization: Bearer <token>
```

**Response:**
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
      { "_id": "cleaning", "revenue": 500000, "bookings": 250 }
    ],
    "revenueByMonth": [
      { "month": "2024-01", "revenue": 500000, "bookings": 240 }
    ],
    "topEarners": [...],
    "paymentMethods": [...],
    "currency": "PHP"
  }
}
```

---

### 10. GET `/marketplace`

Get marketplace analytics (services and bookings).

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "serviceAnalytics": [...],
    "bookingAnalytics": [...],
    "topServices": [...],
    "providerPerformance": [...]
  }
}
```

---

### 11. GET `/jobs`

Get job board analytics.

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "jobAnalytics": [...],
    "jobStatusAnalytics": [...],
    "topEmployers": [...],
    "applicationAnalytics": [...]
  }
}
```

---

### 12. GET `/referrals`

Get referral program analytics.

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "referralStatusAnalytics": [...],
    "referralTypeAnalytics": [...],
    "topReferrers": [...],
    "referralConversion": [...]
  }
}
```

---

### 13. GET `/agencies`

Get agency performance analytics.

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "agencyAnalytics": [...],
    "agencyPerformance": [...]
  }
}
```

---

### 14. GET `/provider`

Get current user's provider analytics.

**Access:** Provider or Admin

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeframe` | string | `30d` | Time period |

**Example Request:**
```http
GET /api/analytics/provider?timeframe=30d
Authorization: Bearer <token>
```

**Response:**
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
      "distribution": { "5": 30, "4": 6, "3": 2, "2": 0, "1": 0 }
    },
    "revenue": [...],
    "bookingTrends": [...],
    "services": [...]
  }
}
```

---

### 15. GET `/provider/:providerId`

Get specific provider's analytics.

**Access:** Admin or the provider themselves

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `providerId` | ObjectId | Provider's user ID |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeframe` | string | `30d` | Time period |

---

### 16. GET `/custom`

Get custom event-based analytics.

**Access:** Admin only

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `eventType` | string | Filter by event type |
| `module` | string | Filter by module |
| `startDate` | ISO8601 | Start of date range |
| `endDate` | ISO8601 | End of date range |

---

### 17. POST `/track`

Track a custom analytics event.

**Access:** Authenticated

**Request Body:**
```json
{
  "eventType": "page_view",
  "module": "marketplace",
  "data": {
    "page": "/services",
    "serviceId": "abc123"
  }
}
```

**Event Types:**
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

---

## Query Parameter Reference

### Timeframes

| Value | Description |
|-------|-------------|
| `1h` | Last hour |
| `24h` | Last 24 hours |
| `7d` | Last 7 days |
| `30d` | Last 30 days (default) |
| `90d` | Last 90 days |
| `1y` | Last year |

### Metrics (for time-series)

| Value | Description |
|-------|-------------|
| `users` | User registrations |
| `bookings` | Booking counts |
| `revenue` | Revenue with amounts |
| `services` | Service creations |
| `jobs` | Job postings |

### Granularities (for time-series)

| Value | Description |
|-------|-------------|
| `hourly` | Per hour data points |
| `daily` | Per day data points |
| `weekly` | Per week data points |
| `monthly` | Per month data points |

### Export Types

| Value | Description |
|-------|-------------|
| `overview` | Platform overview data |
| `users` | User data export |
| `revenue` | Revenue data |
| `bookings` | Booking data |

### Export Formats

| Value | Description |
|-------|-------------|
| `json` | JSON response |
| `csv` | CSV file download |

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid timeframe. Must be one of: 1h, 24h, 7d, 30d, 90d, 1y"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Failed to retrieve analytics"
}
```

---

## Statistics Summary

| Category | Count |
|----------|-------|
| **Total Endpoints** | 17 |
| Admin-only | 14 |
| Provider | 2 |
| Authenticated | 2 |

---

## Related Documentation

- [Activities API](/docs/features/activities.md)
- [Logs API](/docs/features/logs.md)
- [Monitoring API](/docs/features/monitoring.md)

