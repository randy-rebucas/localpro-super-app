# Debugging Guide

## Overview

This guide covers debugging techniques for troubleshooting issues in the LocalPro Super App.

## Debugging Tools

### VS Code Debugger

See [Development Debugging Guide](../development/debugging.md) for VS Code setup.

### Node Inspector

```bash
node --inspect src/server.js
```

### Console Logging

```javascript
console.log('Debug info:', { data });
console.error('Error:', error);
```

## Common Debugging Scenarios

### Database Issues

#### Connection Problems

```javascript
// Check connection status
const mongoose = require('mongoose');
console.log('MongoDB state:', mongoose.connection.readyState);
```

#### Query Issues

```javascript
// Log queries
mongoose.set('debug', true);

// Explain query
const explain = await User.find({}).explain();
console.log('Query plan:', explain);
```

### Authentication Issues

#### Token Problems

```javascript
// Verify token
const jwt = require('jsonwebtoken');
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token valid:', decoded);
} catch (error) {
  console.error('Token error:', error.message);
}
```

#### User Not Found

```javascript
// Check user exists
const user = await User.findById(userId);
console.log('User found:', !!user);
```

### API Issues

#### Request Not Received

```javascript
// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.body
  });
  next();
});
```

#### Response Issues

```javascript
// Log responses
res.on('finish', () => {
  console.log('Response:', {
    status: res.statusCode,
    headers: res.getHeaders()
  });
});
```

## Performance Debugging

### Slow Queries

```javascript
// Enable slow query logging
// Automatically logs queries > 1000ms
```

### Memory Issues

```bash
# Check memory usage
node --inspect --expose-gc src/server.js
```

### CPU Issues

```bash
# Profile CPU
node --prof src/server.js
node --prof-process isolate-*.log
```

## Error Debugging

### Error Logs

```bash
# View error logs
tail -f logs/error.log

# Search errors
grep "ERROR" logs/error.log
```

### Error Context

```javascript
try {
  // Code
} catch (error) {
  logger.error('Error with context', {
    error: error.message,
    stack: error.stack,
    userId: req.user?.id,
    path: req.path
  });
}
```

## Network Debugging

### API Calls

```javascript
// Log external API calls
axios.interceptors.request.use(request => {
  console.log('API Request:', request.url);
  return request;
});
```

### Webhooks

```javascript
// Log webhook events
app.post('/webhook', (req, res) => {
  console.log('Webhook received:', {
    headers: req.headers,
    body: req.body
  });
});
```

## Database Debugging

### Query Performance

```javascript
// Check index usage
const explain = await User.find({ phoneNumber }).explain();
console.log('Index used:', explain.executionStats.executionStages.indexName);
```

### Connection Pool

```javascript
// Monitor connection pool
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected', {
    poolSize: mongoose.connection.poolSize
  });
});
```

## Best Practices

1. **Use structured logging** - Include context
2. **Log at appropriate levels** - Don't log everything
3. **Remove debug logs** - Before production
4. **Use error tracking** - For production
5. **Document issues** - For future reference

## Tools

- **VS Code Debugger** - Step-through debugging
- **Chrome DevTools** - Node.js debugging
- **Winston** - Logging
- **MongoDB Compass** - Database inspection
- **Postman** - API testing

## Next Steps

- Review [Common Issues](./common-issues.md)
- Check [Development Debugging](../development/debugging.md)
- Read [Monitoring Guide](../deployment/monitoring.md)

