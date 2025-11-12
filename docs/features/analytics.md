# Analytics Feature Documentation

## Overview
The Analytics feature provides data insights and analytics for users and administrators to track performance and make data-driven decisions.

## Base Path
`/api/analytics`

## Endpoints

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/overview` | Get analytics overview | AUTHENTICATED |
| GET | `/user` | Get user analytics | AUTHENTICATED |
| GET | `/marketplace` | Get marketplace analytics | AUTHENTICATED |
| GET | `/jobs` | Get job analytics | AUTHENTICATED |
| GET | `/referrals` | Get referral analytics | AUTHENTICATED |
| GET | `/agencies` | Get agency analytics | AUTHENTICATED |
| GET | `/custom` | Get custom analytics | **admin** |
| POST | `/track` | Track event | AUTHENTICATED |

## Request/Response Examples

### Get User Analytics
```http
GET /api/analytics/user?timeframe=30d
Authorization: Bearer <token>
```

### Track Event
```http
POST /api/analytics/track
Authorization: Bearer <token>
Content-Type: application/json

{
  "event": "service_viewed",
  "entityType": "service",
  "entityId": "service_id",
  "metadata": {
    "category": "cleaning",
    "source": "search"
  }
}
```

## Analytics Types

- **User Analytics**: Profile views, engagement, activity
- **Marketplace Analytics**: Service views, bookings, revenue
- **Job Analytics**: Applications, hires, job performance
- **Referral Analytics**: Referrals, conversions, rewards
- **Agency Analytics**: Provider performance, bookings, revenue

## Related Features
- Marketplace
- Jobs
- Providers
- Referrals
- Agencies

