# Common Issues & Solutions

## Database Connection Issues

### Issue: Cannot connect to MongoDB

**Symptoms**:
- `MongoNetworkError: connect ECONNREFUSED`
- `MongoServerSelectionError`

**Solutions**:

1. **Check MongoDB is running**:
   ```bash
   # Local MongoDB
   mongod
   
   # Check status
   mongosh --eval "db.adminCommand('ping')"
   ```

2. **Verify connection string**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/localpro-super-app
   ```

3. **Check MongoDB Atlas** (if using):
   - Verify IP whitelist
   - Check credentials
   - Verify network access

### Issue: Authentication failed

**Solutions**:
- Verify username/password in connection string
- Check `authSource` parameter
- Verify user has proper permissions

## Authentication Issues

### Issue: Token invalid or expired

**Symptoms**:
- `401 Unauthorized`
- `Token is not valid`

**Solutions**:

1. **Check token format**:
   ```javascript
   Authorization: Bearer <token>
   ```

2. **Verify JWT_SECRET**:
   ```env
   JWT_SECRET=your-secret-key
   ```

3. **Check token expiration**:
   - Tokens expire after 24 hours
   - User must re-authenticate

### Issue: Verification code not received

**Solutions**:

1. **Check Twilio configuration**:
   ```env
   TWILIO_ACCOUNT_SID=your-sid
   TWILIO_AUTH_TOKEN=your-token
   TWILIO_PHONE_NUMBER=your-number
   ```

2. **Verify phone number format**:
   - Use E.164 format: `+1234567890`

3. **Check rate limiting**:
   - 1 code per phone per minute

## File Upload Issues

### Issue: File upload fails

**Symptoms**:
- `413 Request Entity Too Large`
- `Invalid file type`

**Solutions**:

1. **Check file size**:
   - Maximum: 5MB per file
   - Maximum: 5 files per request

2. **Verify file type**:
   - Allowed: `image/jpeg`, `image/png`, `image/webp`

3. **Check Cloudinary config**:
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

## API Issues

### Issue: CORS errors

**Symptoms**:
- `Access-Control-Allow-Origin` errors
- Requests blocked by browser

**Solutions**:

1. **Add origin to CORS config**:
   ```javascript
   // In server.js or config
   const allowedOrigins = [
     'http://localhost:3000',
     'https://yourdomain.com'
   ];
   ```

2. **Check CORS middleware**:
   - Ensure CORS is enabled
   - Verify credentials setting

### Issue: Rate limit exceeded

**Symptoms**:
- `429 Too Many Requests`
- `X-RateLimit-Remaining: 0`

**Solutions**:

1. **Wait for reset**:
   - Check `X-RateLimit-Reset` header
   - Wait until reset time

2. **Reduce request frequency**:
   - Implement request batching
   - Use caching

3. **Adjust rate limits** (development only):
   ```javascript
   // Temporarily increase limits for testing
   max: 1000
   ```

## Performance Issues

### Issue: Slow queries

**Symptoms**:
- Requests taking > 1 second
- Database timeouts

**Solutions**:

1. **Add indexes**:
   ```javascript
   // Add indexes for frequently queried fields
   Model.createIndex({ field: 1 });
   ```

2. **Optimize queries**:
   - Use projections to limit fields
   - Implement pagination
   - Add query filters

3. **Check slow query logs**:
   - Review logs for slow queries
   - Optimize based on logs

### Issue: Memory leaks

**Symptoms**:
- Increasing memory usage
- Server crashes

**Solutions**:

1. **Check for unclosed connections**:
   - Ensure database connections are closed
   - Close file streams

2. **Monitor memory usage**:
   ```bash
   node --inspect src/server.js
   ```

3. **Review middleware**:
   - Check for memory-intensive operations
   - Optimize data processing

## Environment Issues

### Issue: Environment variables not loading

**Symptoms**:
- `undefined` values
- Configuration errors

**Solutions**:

1. **Check .env file**:
   - Ensure file exists
   - Verify variable names

2. **Restart server**:
   ```bash
   # Stop and restart
   npm run dev
   ```

3. **Verify dotenv**:
   ```javascript
   require('dotenv').config();
   ```

## Payment Issues

### Issue: PayPal integration fails

**Solutions**:

1. **Check credentials**:
   ```env
   PAYPAL_CLIENT_ID=your-client-id
   PAYPAL_CLIENT_SECRET=your-secret
   PAYPAL_MODE=sandbox  # or live
   ```

2. **Verify webhook URL**:
   - Check webhook endpoint
   - Verify signature validation

### Issue: PayMaya integration fails

**Solutions**:

1. **Check API keys**:
   ```env
   PAYMONGO_SECRET_KEY=your-secret-key
   PAYMONGO_PUBLIC_KEY=your-public-key
   ```

2. **Verify webhook configuration**:
   - Check webhook URL
   - Verify event handling

## Getting Help

### Check Logs

```bash
# Application logs
tail -f logs/combined.log

# Error logs
tail -f logs/error.log
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev
```

### Support

- Check [FAQ](./faq.md)
- Review [Debugging Guide](./debugging.md)
- Open an issue on GitHub

