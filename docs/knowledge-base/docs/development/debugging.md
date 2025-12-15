# Debugging Guide

## Overview

This guide covers debugging techniques and tools for the LocalPro Super App.

## Debugging Tools

### VS Code Debugger

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "program": "${workspaceFolder}/src/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### Node Inspector

```bash
node --inspect src/server.js
```

Then open Chrome DevTools at `chrome://inspect`.

## Logging

### Winston Logger

```javascript
const logger = require('./config/logger');

// Info
logger.info('User created', { userId: '123' });

// Error
logger.error('Error creating user', { error, userId: '123' });

// Debug
logger.debug('Processing request', { path: req.path });
```

### Log Levels

- `error` - Errors only
- `warn` - Warnings and errors
- `info` - Info, warnings, errors
- `debug` - All logs

### View Logs

```bash
# Application logs
tail -f logs/combined.log

# Error logs
tail -f logs/error.log

# HTTP logs
tail -f logs/http.log
```

## Common Issues

### Database Connection

```javascript
// Check connection
const mongoose = require('mongoose');
console.log('MongoDB state:', mongoose.connection.readyState);
// 0 = disconnected
// 1 = connected
// 2 = connecting
// 3 = disconnecting
```

### Authentication Issues

```javascript
// Verify token
const jwt = require('jsonwebtoken');
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token valid:', decoded);
} catch (error) {
  console.error('Token invalid:', error.message);
}
```

### API Errors

```javascript
// Add error logging middleware
app.use((err, req, res, next) => {
  logger.error('API Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  next(err);
});
```

## Debugging Techniques

### 1. Console Logging

```javascript
// Strategic logging
console.log('Before query:', { userId });
const user = await User.findById(userId);
console.log('After query:', { user });
```

### 2. Breakpoints

Set breakpoints in VS Code to pause execution.

### 3. Step Through Code

Use debugger to step through code line by line.

### 4. Inspect Variables

Check variable values at runtime.

## Performance Debugging

### Slow Queries

```javascript
// Enable query logging
mongoose.set('debug', true);

// Or use middleware
app.use(queryOptimizationMiddleware);
```

### Memory Leaks

```bash
# Check memory usage
node --inspect --expose-gc src/server.js
```

### Profiling

```bash
# CPU profiling
node --prof src/server.js
node --prof-process isolate-*.log
```

## Network Debugging

### API Requests

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

### External API Calls

```javascript
// Log external API calls
axios.interceptors.request.use(request => {
  console.log('Outgoing request:', request.url);
  return request;
});
```

## Database Debugging

### Query Logging

```javascript
// Log all queries
mongoose.set('debug', (collectionName, method, query, doc) => {
  console.log(`${collectionName}.${method}`, query);
});
```

### Explain Queries

```javascript
// Explain query execution
const explain = await User.find({ phoneNumber }).explain();
console.log('Query plan:', explain);
```

## Error Tracking

### Error Monitoring

Check error monitoring dashboard:
- Error frequency
- Error types
- Stack traces
- User impact

### Error Context

```javascript
try {
  // Code
} catch (error) {
  logger.error('Error with context', {
    error: error.message,
    stack: error.stack,
    userId: req.user?.id,
    path: req.path,
    body: req.body
  });
}
```

## Testing Debugging

### Debug Tests

```bash
# Run specific test with debugging
node --inspect-brk node_modules/.bin/jest --runInBand userController.test.js
```

### Test Logs

```javascript
// Enable verbose logging in tests
process.env.DEBUG = '*';
```

## Production Debugging

### Remote Debugging

```bash
# Enable remote debugging
node --inspect=0.0.0.0:9229 src/server.js
```

### Log Analysis

```bash
# Search logs
grep "ERROR" logs/combined.log

# Count errors
grep -c "ERROR" logs/error.log

# Recent errors
tail -n 100 logs/error.log
```

## Best Practices

1. **Use structured logging** - Include context
2. **Log at appropriate levels** - Don't log everything
3. **Remove debug logs** - Before production
4. **Use error tracking** - For production errors
5. **Document issues** - For future reference

## Tools

- **VS Code Debugger** - Step-through debugging
- **Chrome DevTools** - Node.js debugging
- **Winston** - Logging
- **MongoDB Compass** - Database inspection
- **Postman** - API testing

## Next Steps

- Review [Troubleshooting Guide](../troubleshooting/common-issues.md)
- Check [Error Handling](../api/error-handling.md)
- Read [Monitoring Guide](../deployment/monitoring.md)

