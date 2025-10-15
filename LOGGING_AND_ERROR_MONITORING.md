# Logging and Error Monitoring System

## Overview

The LocalPro Super App implements a comprehensive logging and error monitoring system using Winston for logging and a custom error monitoring service for tracking and analyzing errors.

## Features

### 🚀 **Winston Logging System**
- **Multi-level logging**: error, warn, info, http, debug
- **Multiple transports**: Console, rotating file logs
- **Structured logging**: JSON format with timestamps
- **Log rotation**: Daily rotation with size limits
- **Environment-based configuration**: Different log levels for dev/prod

### 🔍 **Error Monitoring Service**
- **Automatic error tracking**: Captures all application errors
- **Error categorization**: Groups errors by type and severity
- **Occurrence tracking**: Counts error frequency
- **Alert system**: Notifications when thresholds are exceeded
- **Error resolution**: Mark errors as resolved with notes
- **Dashboard**: View error statistics and trends

### 📊 **Request Monitoring**
- **HTTP request logging**: All API requests logged
- **Performance tracking**: Response time monitoring
- **Slow request detection**: Alerts for requests > 2 seconds
- **User activity tracking**: Log user actions and events

## File Structure

```
src/
├── config/
│   └── logger.js                 # Winston logger configuration
├── services/
│   └── errorMonitoringService.js # Error tracking and monitoring
├── middleware/
│   ├── errorHandler.js          # Enhanced error handling
│   └── requestLogger.js         # Request logging middleware
├── routes/
│   └── errorMonitoring.js       # Error monitoring API endpoints
└── utils/
    └── logger.js                # Application logger utility
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Logging Configuration
LOG_LEVEL=info                    # Log level: error, warn, info, http, debug
LOG_FILE_MAX_SIZE=20m            # Max size per log file
LOG_FILE_MAX_FILES=14d           # How long to keep log files
LOG_HTTP_REQUESTS=true           # Enable HTTP request logging
LOG_SLOW_REQUESTS_THRESHOLD=2000 # Slow request threshold in ms

# Error Monitoring
ERROR_MONITORING_ENABLED=true    # Enable error monitoring
ERROR_ALERT_THRESHOLDS_CRITICAL=1  # Critical error alert threshold
ERROR_ALERT_THRESHOLDS_HIGH=5    # High severity alert threshold
ERROR_ALERT_THRESHOLDS_MEDIUM=10 # Medium severity alert threshold
ERROR_ALERT_THRESHOLDS_LOW=20    # Low severity alert threshold
```

### Log Files

Logs are stored in the `logs/` directory:

- `error-YYYY-MM-DD.log` - Error level logs only
- `combined-YYYY-MM-DD.log` - All log levels
- `http-YYYY-MM-DD.log` - HTTP request logs

## Usage

### Basic Logging

```javascript
const { logger } = require('./utils/logger');

// Simple logging
logger.info('User logged in', { userId: '123' });
logger.error('Database connection failed', error);
logger.warn('Rate limit exceeded', { ip: '192.168.1.1' });

// Business events
logger.businessEvent('Payment Completed', {
  amount: 100,
  currency: 'USD',
  userId: '123'
});

// Security events
logger.securityEvent('Failed Login Attempt', {
  email: 'user@example.com',
  ip: '192.168.1.1'
});
```

### Contextual Logging

```javascript
const { AppLogger } = require('./utils/logger');

// Create logger with context
const authLogger = new AppLogger('Auth');
const paymentLogger = new AppLogger('Payment');

// Use contextual loggers
authLogger.info('User authenticated', { userId: '123' });
paymentLogger.paymentEvent('Payment Processed', 100, 'USD', { orderId: '456' });
```

### Error Monitoring

Errors are automatically tracked when they occur. You can also manually track errors:

```javascript
const errorMonitoringService = require('./services/errorMonitoringService');

try {
  // Some operation that might fail
  await riskyOperation();
} catch (error) {
  // Error is automatically tracked by error handler
  // But you can also manually track with additional context
  await errorMonitoringService.trackError(error, req, {
    operation: 'riskyOperation',
    additionalContext: 'custom data'
  });
}
```

## API Endpoints

### Error Monitoring Dashboard

**GET** `/api/error-monitoring/dashboard/summary`
- Get error statistics and dashboard data
- Requires admin authentication

**GET** `/api/error-monitoring/stats?timeframe=24h`
- Get error statistics for specified timeframe
- Timeframes: 1h, 24h, 7d, 30d
- Requires admin authentication

**GET** `/api/error-monitoring/unresolved?limit=50`
- Get unresolved errors
- Requires admin authentication

**GET** `/api/error-monitoring/:errorId`
- Get detailed error information
- Requires admin authentication

**PATCH** `/api/error-monitoring/:errorId/resolve`
- Mark error as resolved
- Body: `{ "resolution": "Description of resolution" }`
- Requires admin authentication

## Error Types and Severity

### Error Types
- `application` - General application errors
- `database` - Database-related errors
- `external_api` - Third-party API errors
- `validation` - Input validation errors
- `authentication` - Authentication failures
- `authorization` - Authorization failures
- `rate_limit` - Rate limiting errors
- `payment` - Payment processing errors
- `other` - Uncategorized errors

### Severity Levels
- `critical` - System-breaking errors (1 occurrence triggers alert)
- `high` - Important errors (5 occurrences trigger alert)
- `medium` - Moderate errors (10 occurrences trigger alert)
- `low` - Minor errors (20 occurrences trigger alert)

## Log Levels

### Development Environment
- **debug**: All log levels including debug
- **Console**: Colored output for easy reading
- **Files**: JSON format for structured logging

### Production Environment
- **warn**: Only warnings and errors
- **Console**: Minimal output
- **Files**: Structured JSON logs for analysis

## Monitoring and Alerts

### Automatic Alerts
The system automatically sends alerts when error thresholds are exceeded:

```javascript
// Alert thresholds (configurable via environment)
const alertThresholds = {
  critical: 1,    // 1 occurrence
  high: 5,        // 5 occurrences
  medium: 10,     // 10 occurrences
  low: 20         // 20 occurrences
};
```

### Performance Monitoring
- **Slow requests**: Automatically logged when > 2 seconds
- **Database operations**: Tracked with duration
- **API calls**: External API performance monitoring

## Best Practices

### 1. Use Appropriate Log Levels
```javascript
logger.error('System error', error);           // For errors
logger.warn('Deprecated API used', data);      // For warnings
logger.info('User action completed', data);    // For info
logger.debug('Debug information', data);       // For debugging
```

### 2. Include Context
```javascript
// Good
logger.info('Payment processed', {
  userId: '123',
  amount: 100,
  currency: 'USD',
  paymentMethod: 'credit_card'
});

// Bad
logger.info('Payment processed');
```

### 3. Use Business Event Logging
```javascript
// Track important business events
logger.businessEvent('User Registration', {
  userId: '123',
  email: 'user@example.com',
  source: 'web'
});

logger.paymentEvent('Payment Completed', 100, 'USD', {
  orderId: '456',
  userId: '123'
});
```

### 4. Security Event Logging
```javascript
// Track security-related events
logger.securityEvent('Failed Login', {
  email: 'user@example.com',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

logger.authEvent('Token Expired', '123', {
  tokenType: 'refresh'
});
```

## Integration with External Services

### Sentry Integration (Optional)
```javascript
// Add to logger.js for Sentry integration
const Sentry = require('@sentry/node');

// In error logging
logger.error = (message, error, data) => {
  if (error) {
    Sentry.captureException(error, {
      tags: { context: this.context },
      extra: data
    });
  }
  // ... existing logging code
};
```

### Slack/Discord Notifications (Optional)
```javascript
// Add webhook notifications for critical errors
const axios = require('axios');

const sendSlackAlert = async (errorData) => {
  if (process.env.SLACK_WEBHOOK_URL) {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: `🚨 Critical Error Alert`,
      attachments: [{
        color: 'danger',
        fields: [
          { title: 'Error', value: errorData.message, short: false },
          { title: 'Severity', value: errorData.severity, short: true },
          { title: 'Occurrences', value: errorData.occurrences, short: true }
        ]
      }]
    });
  }
};
```

## Troubleshooting

### Common Issues

1. **Logs not appearing**
   - Check `LOG_LEVEL` environment variable
   - Ensure `logs/` directory exists and is writable
   - Verify Winston configuration

2. **Error monitoring not working**
   - Check `ERROR_MONITORING_ENABLED=true`
   - Verify MongoDB connection
   - Check error handler middleware is properly configured

3. **Performance issues**
   - Monitor log file sizes
   - Adjust log rotation settings
   - Consider log level in production

### Debug Mode
Enable debug logging for troubleshooting:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## Security Considerations

1. **Sensitive Data**: The system automatically redacts sensitive information in logs
2. **Access Control**: Error monitoring endpoints require admin authentication
3. **Log Retention**: Configure appropriate log retention periods
4. **File Permissions**: Ensure log files have proper permissions

## Performance Impact

- **Minimal overhead**: Logging adds < 1ms per request
- **Asynchronous**: Non-blocking logging operations
- **Configurable**: Adjust log levels for performance vs. detail
- **File rotation**: Prevents disk space issues

## Future Enhancements

1. **Real-time dashboards**: WebSocket-based live error monitoring
2. **Machine learning**: Anomaly detection for error patterns
3. **Integration**: Slack, Discord, email notifications
4. **Analytics**: Error trend analysis and reporting
5. **Distributed tracing**: Request tracing across services
