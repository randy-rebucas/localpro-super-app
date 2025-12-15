# Monitoring Guide

## Overview

This guide covers monitoring and observability for the LocalPro Super App.

## Monitoring Stack

### Application Monitoring

- **Winston** - Logging
- **Prometheus** - Metrics
- **Health Checks** - Application health

### Infrastructure Monitoring

- **Server Metrics** - CPU, Memory, Disk
- **Database Metrics** - Connection pool, queries
- **Network Metrics** - Request rates, latency

## Health Checks

### Health Endpoint

```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-16T10:30:00Z",
  "uptime": 3600,
  "database": "connected",
  "memory": {
    "used": "150MB",
    "total": "512MB"
  }
}
```

### Readiness Check

```
GET /health/ready
```

### Liveness Check

```
GET /health/live
```

## Logging

### Log Levels

- **error** - Errors only
- **warn** - Warnings and errors
- **info** - Info, warnings, errors
- **debug** - All logs

### Log Structure

```javascript
logger.info('User created', {
  userId: '123',
  phoneNumber: '+1234567890',
  timestamp: new Date().toISOString()
});
```

### Log Files

- `logs/combined.log` - All logs
- `logs/error.log` - Errors only
- `logs/http.log` - HTTP requests

## Metrics

### Prometheus Metrics

Available at `/metrics`:

```
http_requests_total{method="GET",status="200"} 1500
http_request_duration_seconds{method="GET"} 0.05
database_queries_total{collection="users"} 500
```

### Custom Metrics

```javascript
const promClient = require('prom-client');

const bookingCounter = new promClient.Counter({
  name: 'bookings_total',
  help: 'Total number of bookings'
});

bookingCounter.inc();
```

## Error Monitoring

### Error Tracking

- Log all errors
- Track error frequency
- Monitor error trends
- Alert on critical errors

### Error Dashboard

Monitor:
- Error rate
- Error types
- Affected endpoints
- User impact

## Performance Monitoring

### Slow Query Detection

```javascript
// Automatically logs queries > 1000ms
queryOptimizationMiddleware
```

### Request Monitoring

- Response times
- Request rates
- Error rates
- Throughput

## Database Monitoring

### Connection Pool

```javascript
// Monitor connection pool
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected', {
    poolSize: mongoose.connection.poolSize
  });
});
```

### Query Performance

- Slow query logging
- Query execution time
- Index usage
- Collection sizes

## Alerting

### Alert Conditions

- High error rate (> 5%)
- Slow response times (> 2s)
- Database connection issues
- High memory usage (> 90%)
- Disk space low (< 10%)

### Alert Channels

- Email
- SMS
- Slack
- PagerDuty

## Dashboards

### Application Dashboard

- Request rate
- Error rate
- Response time
- Active users

### Infrastructure Dashboard

- CPU usage
- Memory usage
- Disk usage
- Network traffic

## Best Practices

1. **Monitor key metrics** - Focus on important metrics
2. **Set appropriate alerts** - Avoid alert fatigue
3. **Log structured data** - Include context
4. **Track trends** - Monitor over time
5. **Review regularly** - Weekly reviews

## Tools

- **Winston** - Logging
- **Prometheus** - Metrics
- **Grafana** - Dashboards
- **Sentry** - Error tracking
- **New Relic** - APM

## Next Steps

- Review [Production Deployment](./production.md)
- Check [Backup Strategy](./backup.md)
- Read [Troubleshooting Guide](../troubleshooting/common-issues.md)

