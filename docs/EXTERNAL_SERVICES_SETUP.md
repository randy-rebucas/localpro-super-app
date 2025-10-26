# External Services Setup Guide

This guide explains how to configure all external services for the LocalPro Super App. The application integrates with multiple third-party services to provide comprehensive functionality.

## 🚀 Quick Setup

### Interactive Setup (Recommended)
```bash
# Configure all services interactively
npm run setup:services

# Or configure individual services
npm run setup:twilio
npm run setup:paypal
npm run setup:email
npm run setup:cloudinary
```

### Validation and Testing
```bash
# Validate all service configurations
npm run validate:services

# Test all service connections
npm run test:services
```

## 📋 Required Services

These services are essential for the application to function properly:

### 1. 🔐 JWT Authentication
- **Purpose**: User authentication and authorization
- **Setup**: Already configured with secure secrets
- **Script**: `node scripts/generate-jwt-secrets.js`

### 2. 📱 Twilio SMS Service
- **Purpose**: SMS verification and notifications
- **Required**: Yes
- **Setup Script**: `npm run setup:twilio`
- **Credentials Needed**:
  - Account SID
  - Auth Token
  - Verify Service SID
  - Phone Number

### 3. 💳 PayPal Payment Processing
- **Purpose**: Payment processing and subscriptions
- **Required**: Yes
- **Setup Script**: `npm run setup:paypal`
- **Credentials Needed**:
  - Client ID
  - Client Secret
  - Mode (sandbox/live)
  - Webhook ID

### 4. 📧 Email Service
- **Purpose**: Email notifications and communications
- **Required**: Yes
- **Setup Script**: `npm run setup:email`
- **Providers Supported**:
  - Resend (Recommended)
  - SendGrid
  - SMTP

### 5. ☁️ Cloudinary File Storage
- **Purpose**: Image and file uploads
- **Required**: Yes
- **Setup Script**: `npm run setup:cloudinary`
- **Credentials Needed**:
  - Cloud Name
  - API Key
  - API Secret

## 🔧 Optional Services

These services enhance functionality but are not required:

### 1. 🇵🇭 PayMaya Payment Processing
- **Purpose**: Philippines payment processing
- **Required**: No
- **Setup Script**: `npm run setup:paymaya`
- **Use Case**: Alternative payment method for Philippines market

### 2. 🗺️ Google Maps API
- **Purpose**: Location services and mapping
- **Required**: No
- **Setup Script**: `npm run setup:services --service googlemaps`
- **Use Case**: Location-based features, distance calculations

### 3. 💳 Stripe Payment Processing
- **Purpose**: Alternative payment processing
- **Required**: No
- **Setup Script**: `npm run setup:services --service stripe`
- **Use Case**: Additional payment method

### 4. ☁️ AWS S3 Storage
- **Purpose**: Alternative file storage
- **Required**: No
- **Setup Script**: `npm run setup:services --service aws`
- **Use Case**: Alternative to Cloudinary

## 🛠️ Service Configuration Details

### Twilio SMS Service

**Setup Steps:**
1. Sign up at [Twilio Console](https://console.twilio.com/)
2. Get Account SID and Auth Token from Dashboard
3. Create Verify Service at [Verify Services](https://console.twilio.com/us1/develop/verify/services)
4. Purchase phone number at [Phone Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)

**Environment Variables:**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

**Testing:**
```bash
npm run setup:twilio --test
```

### PayPal Payment Processing

**Setup Steps:**
1. Sign up at [PayPal Developer](https://developer.paypal.com/)
2. Create new application in Developer Dashboard
3. Get Client ID and Client Secret
4. Set up webhooks for payment notifications

**Environment Variables:**
```env
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id
```

**Testing:**
```bash
npm run setup:paypal --test
```

**Sandbox Test Cards:**
- Visa: 4111 1111 1111 1111
- Mastercard: 5555 5555 5555 4444
- CVV: Any 3 digits
- Expiry: Any future date

### Email Service (Resend)

**Setup Steps:**
1. Sign up at [Resend](https://resend.com/)
2. Get API key from dashboard
3. Verify your domain (optional but recommended)

**Environment Variables:**
```env
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
```

**Testing:**
```bash
npm run setup:email --test
```

### Cloudinary File Storage

**Setup Steps:**
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get credentials from Dashboard
3. Configure upload presets (optional)
4. Set up transformations (optional)

**Environment Variables:**
```env
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

**Testing:**
```bash
npm run setup:cloudinary --test
```

## 🔍 Service Validation

### Check Configuration Status
```bash
# Validate all service configurations
npm run validate:services

# Check specific service
npm run validate:services --service twilio
```

### Test Service Connections
```bash
# Test all service connections
npm run test:services

# Test specific service
npm run test:services --service paypal
```

## 🚨 Troubleshooting

### Common Issues

1. **"Service not configured"**
   - Solution: Run the appropriate setup script
   - Example: `npm run setup:twilio`

2. **"Connection failed"**
   - Solution: Check credentials and network connectivity
   - Verify API keys are correct and active

3. **"Invalid credentials"**
   - Solution: Regenerate API keys from service provider
   - Ensure credentials match the correct environment (sandbox/production)

4. **"Service not available"**
   - Solution: Check service provider status
   - Verify account is active and not suspended

### Service-Specific Issues

#### Twilio
- **Issue**: "Account not found"
- **Solution**: Verify Account SID is correct
- **Issue**: "Invalid phone number"
- **Solution**: Use international format (+1234567890)

#### PayPal
- **Issue**: "Invalid client credentials"
- **Solution**: Check Client ID and Secret match
- **Issue**: "Sandbox mode required"
- **Solution**: Use sandbox credentials for testing

#### Cloudinary
- **Issue**: "Invalid cloud name"
- **Solution**: Verify cloud name in dashboard
- **Issue**: "API key not found"
- **Solution**: Check API key permissions

#### Email Services
- **Issue**: "Invalid API key"
- **Solution**: Regenerate API key from provider
- **Issue**: "Domain not verified"
- **Solution**: Verify domain in provider dashboard

## 📊 Service Monitoring

### Health Checks
The application includes built-in health checks for all configured services:

```bash
# Check service health
curl http://localhost:5000/api/health/services
```

### Logging
All service interactions are logged with:
- Request/response details
- Error messages
- Performance metrics
- Usage statistics

### Alerts
Configure alerts for:
- Service failures
- High error rates
- Usage limits
- Billing thresholds

## 🔐 Security Best Practices

### Credential Management
- ✅ Store credentials in environment variables
- ✅ Use different credentials for development/production
- ✅ Rotate credentials regularly
- ✅ Never commit credentials to version control
- ✅ Use secure credential management services

### API Security
- ✅ Use HTTPS for all API calls
- ✅ Implement rate limiting
- ✅ Monitor for suspicious activity
- ✅ Use webhook signatures for verification

### Data Protection
- ✅ Encrypt sensitive data
- ✅ Implement proper access controls
- ✅ Regular security audits
- ✅ Follow GDPR/privacy regulations

## 📈 Performance Optimization

### Service Optimization
- **Twilio**: Use message templates for better deliverability
- **PayPal**: Implement webhook retry logic
- **Email**: Use templates and batch sending
- **Cloudinary**: Optimize images and use CDN

### Monitoring
- Track API response times
- Monitor error rates
- Set up alerts for failures
- Regular performance reviews

## 🆘 Support

### Service Provider Support
- **Twilio**: [Support Center](https://support.twilio.com/)
- **PayPal**: [Developer Support](https://developer.paypal.com/support/)
- **Resend**: [Help Center](https://resend.com/help)
- **Cloudinary**: [Support](https://support.cloudinary.com/)

### Application Support
- Check application logs
- Review service configuration
- Test individual services
- Contact development team

## 📚 Additional Resources

### Documentation
- [Twilio Documentation](https://www.twilio.com/docs)
- [PayPal API Reference](https://developer.paypal.com/docs/api/overview/)
- [Resend Documentation](https://resend.com/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

### Integration Guides
- [Twilio Verify Quickstart](https://www.twilio.com/docs/verify/quickstarts/node)
- [PayPal Integration Guide](https://developer.paypal.com/docs/checkout/)
- [Resend Integration](https://resend.com/docs/send-with-node)
- [Cloudinary Upload Guide](https://cloudinary.com/documentation/upload_images)

### Testing
- [Twilio Test Credentials](https://www.twilio.com/docs/iam/test-credentials)
- [PayPal Sandbox](https://developer.paypal.com/docs/api-basics/sandbox/)
- [Resend Testing](https://resend.com/docs/testing)
- [Cloudinary Testing](https://cloudinary.com/documentation/testing)

---

For additional help or questions, please refer to the main application documentation or contact the development team.
