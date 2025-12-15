# Analytics Feature

## Overview

The Analytics feature provides comprehensive analytics and reporting for the platform, including user analytics, revenue analytics, service analytics, and more.

## Key Features

- **Dashboard Analytics** - Overview metrics
- **User Analytics** - User growth and engagement
- **Revenue Analytics** - Financial metrics
- **Service Analytics** - Service performance
- **Real-Time Metrics** - Live activity tracking
- **Custom Analytics** - Event-based analytics
- **Export** - Export data in JSON/CSV

## API Endpoints

### Dashboard Analytics

```
GET /api/analytics/dashboard
Query Parameters:
  - timeframe?: '1h' | '24h' | '7d' | '30d' | '90d' | '1y'
```

### User Analytics

```
GET /api/analytics/users
Query Parameters:
  - startDate?: string (ISO 8601)
  - endDate?: string (ISO 8601)
```

### Revenue Analytics

```
GET /api/analytics/financial
Query Parameters:
  - timeframe?: string
```

### Real-Time Metrics

```
GET /api/analytics/realtime
```

### Export Analytics

```
GET /api/analytics/export
Query Parameters:
  - type: 'overview' | 'users' | 'revenue' | 'bookings'
  - timeframe?: string
  - format: 'json' | 'csv'
```

## Analytics Types

- **Overview** - Platform-wide metrics
- **Users** - User growth and activity
- **Revenue** - Financial performance
- **Marketplace** - Service metrics
- **Jobs** - Job board metrics
- **Referrals** - Referral program metrics
- **Agencies** - Agency performance

## Access

Most analytics endpoints require `admin` role.

Provider analytics available to providers for their own data.

## Related Features

- [Admin Dashboard](../frontend/admin-routes.md#analytics--reporting) - Admin analytics
- [Monitoring](../deployment/monitoring.md) - System monitoring

