# Troubleshooting Guide

## Overview
This guide helps diagnose and resolve common issues in the LocalPro Super App.

## Common Issues

### Authentication Issues

#### Problem: Cannot receive SMS verification code
**Symptoms**: No SMS received after requesting code

**Solutions**:
1. Check Twilio configuration:
   ```bash
   # Verify environment variables
   echo $TWILIO_ACCOUNT_SID
   echo $TWILIO_AUTH_TOKEN
   ```

2. Check Twilio account balance
3. Verify phone number format (E.164 format: +1234567890)
4. Check rate limiting (1 SMS per minute)
5. Review Twilio logs in dashboard

#### Problem: Invalid token errors
**Symptoms**: 401 Unauthorized errors

**Solutions**:
1. Verify token is included in Authorization header:
   ```
   Authorization: Bearer <token>
   ```

2. Check token expiration:
   - Tokens expire after configured time
   - Implement token refresh

3. Verify JWT_SECRET matches:
   - Secret must be same across instances
   - Check environment variable

### Database Issues

#### Problem: Database connection failed
**Symptoms**: Application cannot connect to MongoDB

**Solutions**:
1. Verify MongoDB is running:
   ```bash
   # Local MongoDB
   sudo systemctl status mongod
   
   # MongoDB Atlas - check cluster status
   ```

2. Check connection string:
   ```bash
   echo $MONGODB_URI
   # Should be: mongodb://localhost:27017/localpro-super-app
   # Or: mongodb+srv://user:pass@cluster.mongodb.net/dbname
   ```

3. Check network/firewall:
   - MongoDB port 27017 open
   - Atlas IP whitelist configured

4. Verify credentials:
   - Username/password correct
   - Database user has permissions

#### Problem: Slow queries
**Symptoms**: API responses are slow

**Solutions**:
1. Check database indexes:
   ```bash
   node scripts/create-database-indexes.js
   ```

2. Review slow query logs:
   ```bash
   GET /api/monitoring/database/slow-queries
   ```

3. Optimize queries:
   - Use pagination
   - Limit fields returned
   - Use proper indexes

### Payment Issues

#### Problem: PayPal payment fails
**Symptoms**: Payment processing errors

**Solutions**:
1. Verify PayPal credentials:
   ```bash
   echo $PAYPAL_CLIENT_ID
   echo $PAYPAL_CLIENT_SECRET
   echo $PAYPAL_MODE
   ```

2. Check PayPal mode:
   - Use `sandbox` for testing
   - Use `live` for production

3. Verify webhook configuration:
   - Webhook URL accessible
   - Webhook ID matches

4. Check PayPal logs:
   ```bash
   GET /api/paypal/webhook/events
   ```

#### Problem: PayMaya payment fails
**Symptoms**: Payment processing errors

**Solutions**:
1. Verify PayMaya credentials
2. Check PayMaya mode (sandbox/live)
3. Verify webhook secret
4. Review PayMaya dashboard logs

### File Upload Issues

#### Problem: File upload fails
**Symptoms**: 400/500 errors on upload

**Solutions**:
1. Check file size limits:
   - Avatar: 2MB max
   - Portfolio: 5MB max
   - Documents: 10MB max

2. Verify file types:
   - Images: jpeg, png, gif
   - Documents: pdf, doc, docx

3. Check Cloudinary configuration:
   ```bash
   echo $CLOUDINARY_CLOUD_NAME
   echo $CLOUDINARY_API_KEY
   ```

4. Verify Cloudinary account limits

### Performance Issues

#### Problem: Slow API responses
**Symptoms**: High response times

**Solutions**:
1. Check database performance:
   ```bash
   GET /api/monitoring/database/stats
   ```

2. Review application logs:
   ```bash
   GET /api/logs/analytics/performance
   ```

3. Check for N+1 queries
4. Implement caching
5. Optimize database indexes

#### Problem: High memory usage
**Symptoms**: Application crashes or slow

**Solutions**:
1. Check memory usage:
   ```bash
   GET /api/monitoring/system-health
   ```

2. Review log file sizes
3. Implement log rotation
4. Check for memory leaks
5. Increase server resources

### Rate Limiting Issues

#### Problem: Too many requests errors
**Symptoms**: 429 Rate Limit Exceeded

**Solutions**:
1. Check rate limit settings:
   ```bash
   RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
   RATE_LIMIT_MAX_REQUESTS=100
   ```

2. Implement request batching
3. Cache responses
4. Use exponential backoff

### Email Issues

#### Problem: Emails not sending
**Symptoms**: No emails received

**Solutions**:
1. Verify email service configuration:
   ```bash
   echo $EMAIL_SERVICE
   echo $RESEND_API_KEY  # or SENDGRID_API_KEY
   ```

2. Check email service status
3. Verify FROM_EMAIL address
4. Check spam folder
5. Review email service logs

### Search Issues

#### Problem: Search returns no results
**Symptoms**: Empty search results

**Solutions**:
1. Verify search query format
2. Check search indexes
3. Review search filters
4. Test with simpler queries

## Debugging Steps

### 1. Check Application Logs

```bash
# PM2 logs
pm2 logs localpro-api

# File logs
tail -f logs/combined-*.log
tail -f logs/error-*.log

# Database logs
GET /api/logs?level=error
```

### 2. Check System Health

```bash
# Comprehensive health check
GET /api/monitoring/system-health

# Database health
GET /api/monitoring/database/health

# Application metrics
GET /api/monitoring/metrics/json
```

### 3. Verify Configuration

```bash
# Check environment variables
node -e "require('dotenv').config(); console.log(process.env)"

# Verify setup
npm run verify
```

### 4. Test Endpoints

```bash
# Health check
curl http://localhost:5000/health

# API test
curl http://localhost:5000/api/marketplace/services
```

## Error Codes Reference

### 400 Bad Request
- Invalid input data
- Validation errors
- Missing required fields

### 401 Unauthorized
- Missing or invalid token
- Token expired
- Authentication required

### 403 Forbidden
- Insufficient permissions
- Role not authorized
- Resource access denied

### 404 Not Found
- Resource doesn't exist
- Invalid ID format
- Endpoint not found

### 429 Too Many Requests
- Rate limit exceeded
- Too many requests in time window

### 500 Internal Server Error
- Server error
- Database error
- External API failure

## Diagnostic Commands

### Check Database Connection
```javascript
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected'))
  .catch(err => console.error('Error:', err));
```

### Test External APIs
```bash
# Test Twilio
curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN

# Test Cloudinary
curl https://api.cloudinary.com/v1_1/$CLOUDINARY_CLOUD_NAME/resources/image
```

### Check Logs
```bash
# Recent errors
GET /api/logs?level=error&limit=10

# User activity
GET /api/logs/user/:userId/activity

# Error trends
GET /api/logs/analytics/error-trends
```

## Getting Help

### Log Collection
When reporting issues, include:
1. Error logs
2. Request/response examples
3. Environment (dev/staging/prod)
4. Steps to reproduce
5. System health status

### Support Channels
- Check application logs
- Review error monitoring dashboard
- Check audit logs for user actions
- Review system health metrics

## Related Documentation
- [Configuration Guide](CONFIGURATION.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Best Practices](BEST_PRACTICES.md)

