# Performance Monitoring Dashboard

## Overview

The LocalPro Super App now includes a comprehensive performance monitoring system that provides real-time insights into application performance, database metrics, and system health. This system helps identify bottlenecks, track performance trends, and alert on critical issues.

## Features

### 🚀 **Real-time Metrics Collection**
- HTTP request tracking with response times
- Database query performance monitoring
- Memory and CPU usage tracking
- Active connection monitoring
- Error rate tracking
- Business event metrics

### 📊 **Interactive Dashboard**
- Beautiful, responsive web interface
- Real-time charts and graphs
- System status indicators
- Performance trend analysis
- Mobile-friendly design

### 🚨 **Intelligent Alerting**
- Configurable alert thresholds
- Multiple severity levels (info, warning, critical)
- Real-time alert notifications
- Alert history tracking
- Manual alert triggering

### 🔍 **Database Performance Monitoring**
- Query execution time tracking
- Slow query detection and logging
- Connection pool monitoring
- Collection statistics
- Database health checks

### 📡 **Real-time Streaming**
- Server-Sent Events (SSE) for live updates
- WebSocket-like bidirectional communication
- Real-time metrics broadcasting
- Live alert streaming

## Quick Start

### 1. Access the Dashboard

Navigate to the monitoring dashboard:
```
http://localhost:5000/monitoring
```

### 2. API Endpoints

#### Metrics Endpoints
- `GET /api/monitoring/metrics` - Prometheus format metrics
- `GET /api/monitoring/metrics/json` - JSON format metrics
- `GET /api/monitoring/health` - Health check with metrics
- `GET /api/monitoring/system` - System information
- `GET /api/monitoring/performance` - Performance summary

#### Alert Endpoints
- `GET /api/monitoring/alerts` - Current alerts
- `GET /api/monitoring/alerts/history` - Alert history
- `POST /api/monitoring/alerts/thresholds` - Update thresholds
- `GET /api/monitoring/alerts/thresholds` - Get thresholds
- `POST /api/monitoring/alerts/trigger` - Manual alert trigger

#### Database Monitoring
- `GET /api/monitoring/database/stats` - Database statistics
- `GET /api/monitoring/database/collections` - Collection stats
- `GET /api/monitoring/database/queries` - Query performance
- `GET /api/monitoring/database/connections` - Connection stats
- `GET /api/monitoring/database/slow-queries` - Slow queries
- `POST /api/monitoring/database/reset` - Reset stats

#### Real-time Streaming
- `GET /api/monitoring/stream/stream` - Metrics stream (SSE)
- `GET /api/monitoring/stream/alerts/stream` - Alerts stream (SSE)
- `GET /api/monitoring/stream/ws` - WebSocket-like stream
- `GET /api/monitoring/stream/connections/count` - Active connections

## Configuration

### Alert Thresholds

Default alert thresholds can be configured:

```javascript
const alertThresholds = {
  responseTime: 5000,        // 5 seconds
  errorRate: 10,             // 10 errors per minute
  memoryUsage: 0.9,          // 90% memory usage
  cpuUsage: 80,              // 80% CPU usage
  activeConnections: 1000    // 1000 active connections
};
```

### Environment Variables

Add these to your `.env` file for monitoring configuration:

```env
# Monitoring Configuration
MONITORING_ENABLED=true
METRICS_COLLECTION_INTERVAL=30000
ALERT_CHECK_INTERVAL=60000
SLOW_QUERY_THRESHOLD=1000
```

## Architecture

### Components

1. **Metrics Middleware** (`src/middleware/metricsMiddleware.js`)
   - Prometheus metrics collection
   - HTTP request tracking
   - System metrics gathering

2. **Database Performance Monitor** (`src/services/databasePerformanceMonitor.js`)
   - Query performance tracking
   - Slow query detection
   - Connection monitoring

3. **Alert System** (`src/routes/alerts.js`)
   - Threshold-based alerting
   - Alert history management
   - Real-time notifications

4. **Real-time Streaming** (`src/routes/metricsStream.js`)
   - Server-Sent Events implementation
   - Live metrics broadcasting
   - Client connection management

5. **Dashboard UI** (`src/templates/monitoring-dashboard.html`)
   - Interactive web interface
   - Real-time charts
   - Responsive design

### Data Flow

```
Application Requests → Metrics Middleware → Prometheus Metrics
                                    ↓
Database Queries → Database Monitor → Performance Stats
                                    ↓
System Metrics → Alert System → Real-time Alerts
                                    ↓
All Metrics → Stream Service → Dashboard UI
```

## Usage Examples

### 1. View Current Metrics

```bash
curl http://localhost:5000/api/monitoring/metrics/json
```

### 2. Check System Health

```bash
curl http://localhost:5000/api/monitoring/health
```

### 3. Get Database Performance

```bash
curl http://localhost:5000/api/monitoring/database/queries
```

### 4. Update Alert Thresholds

```bash
curl -X POST http://localhost:5000/api/monitoring/alerts/thresholds \
  -H "Content-Type: application/json" \
  -d '{"thresholds": {"responseTime": 3000, "errorRate": 5}}'
```

### 5. Trigger Manual Alert

```bash
curl -X POST http://localhost:5000/api/monitoring/alerts/trigger \
  -H "Content-Type: application/json" \
  -d '{"type": "custom", "severity": "warning", "message": "Test alert"}'
```

## Dashboard Features

### Real-time Charts
- **Request Metrics**: Total requests over time
- **Response Time**: Average response time trends
- **Memory Usage**: Heap memory consumption
- **Active Connections**: Current connection count
- **Error Rate**: Error frequency tracking
- **CPU Usage**: System CPU utilization

### Status Indicators
- **System Status**: Overall application health
- **Database Status**: MongoDB connection status
- **API Health**: API endpoint availability
- **Last Updated**: Timestamp of last data refresh

### Alert Management
- **Active Alerts**: Current critical issues
- **Alert History**: Past alert occurrences
- **Severity Levels**: Color-coded alert types
- **Threshold Configuration**: Customizable limits

## Monitoring Best Practices

### 1. Regular Monitoring
- Check the dashboard daily for performance trends
- Review alert history weekly
- Monitor slow queries regularly

### 2. Alert Configuration
- Set appropriate thresholds for your environment
- Use different thresholds for development vs production
- Configure alerts for critical business metrics

### 3. Performance Optimization
- Identify and optimize slow database queries
- Monitor memory usage patterns
- Track response time trends

### 4. Capacity Planning
- Monitor connection growth trends
- Track resource utilization patterns
- Plan scaling based on metrics

## Troubleshooting

### Common Issues

1. **Dashboard not loading**
   - Check if monitoring routes are properly registered
   - Verify server is running on correct port
   - Check browser console for errors

2. **Metrics not updating**
   - Verify metrics middleware is enabled
   - Check if system metrics collection is running
   - Review server logs for errors

3. **Alerts not triggering**
   - Verify alert thresholds are configured
   - Check if alert monitoring is active
   - Review alert history for patterns

4. **Database monitoring issues**
   - Ensure MongoDB connection is active
   - Check database performance monitor initialization
   - Verify query tracking is enabled

### Debug Commands

```bash
# Check metrics collection
curl http://localhost:5000/api/monitoring/metrics/json | jq

# Test alert system
curl -X POST http://localhost:5000/api/monitoring/alerts/trigger \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "severity": "info", "message": "Debug test"}'

# Check database health
curl http://localhost:5000/api/monitoring/database/health

# View slow queries
curl http://localhost:5000/api/monitoring/database/slow-queries
```

## Security Considerations

### Access Control
- Consider adding authentication to monitoring endpoints
- Restrict access to sensitive metrics
- Use HTTPS in production

### Data Privacy
- Be mindful of logging sensitive data
- Sanitize metrics that may contain PII
- Implement data retention policies

### Performance Impact
- Monitor the monitoring system itself
- Balance metrics collection frequency with performance
- Use appropriate sampling rates

## Future Enhancements

### Planned Features
- **Custom Dashboards**: User-configurable dashboard layouts
- **Advanced Analytics**: Machine learning-based anomaly detection
- **Integration**: Prometheus/Grafana integration
- **Mobile App**: Native mobile monitoring app
- **API Documentation**: Interactive API documentation
- **Export Features**: Metrics export to various formats

### Integration Options
- **Prometheus**: Direct Prometheus metrics export
- **Grafana**: Dashboard integration
- **Slack/Discord**: Alert notifications
- **Email**: Email alert notifications
- **Webhooks**: Custom webhook integrations

## Support

For issues or questions about the monitoring system:

1. Check the troubleshooting section above
2. Review server logs for error messages
3. Test individual API endpoints
4. Verify configuration settings
5. Contact the development team

## Changelog

### Version 1.0.0
- Initial implementation of performance monitoring
- Real-time dashboard with charts and metrics
- Alert system with configurable thresholds
- Database performance monitoring
- Real-time streaming with Server-Sent Events
- Comprehensive API endpoints
- Mobile-responsive dashboard design
