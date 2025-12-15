# Historical Metrics Guide

## Overview

This guide covers collecting and analyzing historical metrics for the LocalPro Super App.

## Metrics Collection

### Automated Collection

Metrics are automatically collected:
- User registrations
- Bookings created
- Payments processed
- Service views
- And more

### Manual Collection

```javascript
POST /api/analytics/track
Body: {
  eventType: 'custom_event',
  module: 'marketplace',
  data: { /* event data */ }
}
```

## Available Metrics

### User Metrics

- New registrations
- Active users
- User growth
- User retention

### Booking Metrics

- Bookings created
- Booking completion rate
- Average booking value
- Booking trends

### Revenue Metrics

- Total revenue
- Revenue by source
- Revenue trends
- Payment method distribution

### Service Metrics

- Services created
- Service views
- Service bookings
- Popular categories

## Querying Metrics

### Time Ranges

```
GET /api/analytics/dashboard?timeframe=7d
GET /api/analytics/users?startDate=2025-01-01&endDate=2025-12-31
```

### Timeframes

- `1h` - Last hour
- `24h` - Last 24 hours
- `7d` - Last 7 days
- `30d` - Last 30 days
- `90d` - Last 90 days
- `1y` - Last year

## Exporting Metrics

### Export Data

```
GET /api/analytics/export?type=users&format=csv&timeframe=30d
```

### Formats

- `json` - JSON format
- `csv` - CSV format

## Historical Data

### Data Retention

- Real-time: Last 24 hours
- Historical: Last 90 days
- Archive: Older data archived

### Data Aggregation

Metrics are aggregated:
- Hourly aggregations
- Daily aggregations
- Weekly aggregations
- Monthly aggregations

## Custom Metrics

### Track Custom Events

```javascript
await trackEvent({
  eventType: 'service_viewed',
  module: 'marketplace',
  data: {
    serviceId: '123',
    category: 'cleaning'
  }
});
```

### Query Custom Metrics

```
GET /api/analytics/custom?eventType=service_viewed&startDate=2025-01-01
```

## Analytics Dashboard

### Dashboard Metrics

- Overview statistics
- Trend charts
- Top performers
- Recent activity

### Real-Time Metrics

```
GET /api/analytics/realtime
```

## Best Practices

1. **Track important events** - Focus on key metrics
2. **Use consistent naming** - Standardize event names
3. **Include context** - Add relevant data
4. **Monitor trends** - Track over time
5. **Export regularly** - Keep historical data

## Tools

- **Analytics API** - Query metrics
- **Export API** - Export data
- **Dashboard** - Visual analytics

## Next Steps

- Review [Analytics Feature](../features/analytics.md)
- Check [Monitoring Guide](../deployment/monitoring.md)

