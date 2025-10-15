# Audit Logging System

## Overview

The LocalPro Super App implements a comprehensive audit logging system designed for compliance, security, and operational monitoring. This system tracks all critical user actions, system changes, and business events to provide complete visibility into application usage and maintain regulatory compliance.

## Features

### 🔍 **Comprehensive Action Tracking**
- **Authentication Events**: Login, logout, registration, verification, password resets
- **User Management**: Profile updates, settings changes, account modifications
- **Business Operations**: Service creation, bookings, payments, job applications
- **Financial Transactions**: Payments, withdrawals, loans, salary advances
- **Content Management**: Course creation, supply orders, rental bookings
- **Communication**: Messages, emails, notifications
- **System Administration**: Configuration changes, feature toggles, maintenance

### 🛡️ **Security & Compliance**
- **Data Protection**: Automatic sanitization of sensitive information
- **Retention Policies**: Configurable retention periods by category
- **Access Control**: Admin-only access to audit logs
- **Export Capabilities**: CSV and JSON export for compliance reporting
- **Tamper-Proof**: Immutable audit trail with cryptographic integrity

### 📊 **Advanced Analytics**
- **Real-time Monitoring**: Live audit event tracking
- **Statistical Analysis**: Category and severity-based reporting
- **User Activity Summaries**: Individual user action tracking
- **Dashboard Views**: Comprehensive audit overview and trends
- **Performance Metrics**: Response time and operation duration tracking

## File Structure

```
src/
├── services/
│   └── auditService.js           # Core audit service with database operations
├── middleware/
│   └── auditLogger.js           # Audit middleware for automatic tracking
├── routes/
│   └── auditLogs.js             # Audit log API endpoints
└── utils/
    └── auditLogger.js           # Application audit logger utility
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Audit Logging Configuration
AUDIT_LOGGING_ENABLED=true                    # Enable/disable audit logging
AUDIT_RETENTION_DAYS=2555                     # Retention period in days (7 years)
AUDIT_LOG_SENSITIVE_DATA=false                # Log sensitive data (not recommended)
AUDIT_LOG_REQUEST_BODY=false                  # Log request bodies
AUDIT_LOG_RESPONSE_BODY=false                 # Log response bodies
AUDIT_AUTO_CLEANUP=true                       # Enable automatic cleanup
AUDIT_CLEANUP_SCHEDULE=0 2 * * *              # Cron schedule for cleanup (2 AM daily)
```

### Retention Policies

The system implements different retention periods based on data category:

- **Authentication**: 7 years (compliance requirement)
- **Financial**: 7 years (regulatory requirement)
- **Security**: 10 years (extended security monitoring)
- **Data**: 5 years (data protection compliance)
- **System**: 3 years (operational monitoring)
- **Default**: 7 years (general compliance)

## Usage

### Automatic Audit Logging

The system automatically tracks actions through middleware:

```javascript
// Automatic tracking is enabled by default
// No additional code required for basic operations
```

### Manual Audit Logging

For specific business events, use the audit logger utility:

```javascript
const { auditLogger } = require('./utils/auditLogger');

// Log authentication events
await auditLogger.logAuth('user_login', req, {
  loginMethod: 'sms',
  deviceType: 'mobile'
});

// Log financial events
await auditLogger.logPayment('payment_process', req, paymentId, 100, 'USD', {
  paymentMethod: 'paypal',
  orderId: 'order123'
});

// Log user management events
await auditLogger.logUser('profile_update', req, {
  type: 'user',
  id: userId,
  name: 'User Profile'
}, {
  fields: ['firstName', 'lastName', 'email']
});

// Log marketplace events
await auditLogger.logMarketplace('service_create', req, serviceId, 'House Cleaning', {
  category: 'cleaning',
  price: 50
});

// Log job board events
await auditLogger.logJobBoard('application_create', req, applicationId, 'Software Developer', {
  salary: 80000,
  experience: '3-5 years'
});
```

### Contextual Audit Logging

Create contextual audit loggers for specific modules:

```javascript
const { AuditLogger } = require('./utils/auditLogger');

// Create module-specific audit logger
const marketplaceAudit = new AuditLogger('Marketplace');

// Use in marketplace controller
await marketplaceAudit.logBooking('booking_create', req, bookingId, 'House Cleaning', {
  duration: 2,
  totalAmount: 100
});
```

## API Endpoints

### Audit Log Management

**GET** `/api/audit-logs`
- Get audit logs with filtering and pagination
- Requires admin authentication
- Query parameters: action, category, severity, actorId, targetType, targetId, startDate, endDate, page, limit

**GET** `/api/audit-logs/stats?timeframe=30d`
- Get audit statistics for specified timeframe
- Timeframes: 1d, 7d, 30d, 90d, 1y
- Requires admin authentication

**GET** `/api/audit-logs/user/:userId/activity?timeframe=30d`
- Get user activity summary
- Users can view their own activity, admins can view any user's activity
- Requires authentication

**GET** `/api/audit-logs/:auditId`
- Get detailed audit log information
- Requires admin authentication

**GET** `/api/audit-logs/export/data?format=csv&startDate=2024-01-01`
- Export audit logs for compliance
- Formats: json, csv
- Requires admin authentication

**GET** `/api/audit-logs/dashboard/summary`
- Get audit dashboard summary with statistics
- Requires admin authentication

**POST** `/api/audit-logs/cleanup`
- Manually trigger audit log cleanup
- Requires admin authentication

**GET** `/api/audit-logs/metadata/categories`
- Get available audit categories, severities, and actions
- Requires admin authentication

## Audit Categories and Actions

### Authentication
- `user_login`, `user_logout`, `user_register`, `user_verify`
- `password_reset`, `token_refresh`, `account_locked`, `account_unlocked`

### User Management
- `user_create`, `user_update`, `user_delete`, `user_activate`, `user_deactivate`
- `profile_update`, `settings_update`, `preferences_update`

### Marketplace
- `service_create`, `service_update`, `service_delete`, `service_publish`, `service_unpublish`
- `booking_create`, `booking_update`, `booking_cancel`, `booking_complete`
- `review_create`, `review_update`, `review_delete`

### Job Board
- `job_create`, `job_update`, `job_delete`, `job_publish`, `job_close`
- `application_create`, `application_update`, `application_withdraw`
- `application_approve`, `application_reject`, `application_shortlist`

### Financial
- `payment_create`, `payment_process`, `payment_refund`, `payment_failed`
- `withdrawal_request`, `withdrawal_approve`, `withdrawal_reject`
- `loan_apply`, `loan_approve`, `loan_reject`, `loan_repay`
- `salary_advance_request`, `salary_advance_approve`, `salary_advance_reject`

### Agency
- `agency_create`, `agency_update`, `agency_delete`, `agency_join`, `agency_leave`
- `provider_add`, `provider_remove`, `provider_update`, `provider_activate`, `provider_deactivate`
- `commission_update`, `payout_process`

### Referral
- `referral_create`, `referral_complete`, `referral_reward`, `referral_invite`
- `referral_validate`, `referral_track`

### Content
- `course_create`, `course_update`, `course_delete`, `course_enroll`, `course_complete`
- `supply_create`, `supply_update`, `supply_delete`, `supply_order`
- `rental_create`, `rental_update`, `rental_delete`, `rental_book`
- `ad_create`, `ad_update`, `ad_delete`, `ad_promote`

### Communication
- `message_send`, `message_delete`, `conversation_create`, `conversation_delete`
- `email_send`, `sms_send`, `notification_send`

### Trust & Verification
- `verification_request`, `verification_approve`, `verification_reject`
- `document_upload`, `document_delete`, `document_verify`

### System
- `system_config_update`, `feature_toggle`, `maintenance_mode`
- `backup_create`, `backup_restore`, `data_export`, `data_import`
- `admin_action`, `bulk_operation`, `system_alert`

### Security
- `security_scan`, `vulnerability_detected`, `threat_blocked`
- `access_denied`, `permission_granted`, `permission_revoked`
- `role_assigned`, `role_removed`, `privilege_escalation`

### Data
- `data_create`, `data_read`, `data_update`, `data_delete`
- `data_export`, `data_import`, `data_backup`, `data_restore`
- `privacy_request`, `data_anonymize`, `gdpr_compliance`

## Severity Levels

- **Critical**: System-breaking actions (user deletion, data deletion, privilege escalation)
- **High**: Important business actions (user creation, payment processing, loan approval)
- **Medium**: Standard business operations (service creation, booking creation)
- **Low**: Routine operations (profile updates, settings changes)

## Data Protection

### Automatic Sanitization

The system automatically redacts sensitive information:

```javascript
// Sensitive fields are automatically redacted
const sensitiveFields = [
  'password', 'token', 'secret', 'key', 'creditCard', 'ssn', 'pin',
  'bankAccount', 'routingNumber', 'cvv', 'expiryDate', 'cardNumber'
];
```

### Example Before/After Sanitization

```javascript
// Before sanitization
{
  "password": "secret123",
  "creditCard": "4111111111111111",
  "cvv": "123"
}

// After sanitization
{
  "password": "[REDACTED]",
  "creditCard": "[REDACTED]",
  "cvv": "[REDACTED]"
}
```

## Compliance Features

### GDPR Compliance
- **Data Subject Rights**: Export user audit data
- **Data Minimization**: Only log necessary information
- **Retention Limits**: Automatic data deletion after retention period
- **Consent Tracking**: Log consent changes and withdrawals

### SOX Compliance
- **Financial Controls**: Complete audit trail for financial operations
- **Access Controls**: Track all administrative actions
- **Data Integrity**: Immutable audit records
- **Regular Reporting**: Automated compliance reports

### HIPAA Compliance
- **Access Logging**: Track all data access
- **User Authentication**: Complete authentication audit trail
- **Data Protection**: Automatic PII redaction
- **Breach Detection**: Monitor for unauthorized access

## Performance Considerations

### Database Optimization
- **Indexed Queries**: Optimized indexes for common queries
- **Pagination**: Efficient pagination for large datasets
- **Archival**: Automatic cleanup of expired records
- **Partitioning**: Time-based partitioning for large datasets

### Memory Management
- **Streaming**: Stream large audit exports
- **Batch Processing**: Batch operations for bulk data
- **Caching**: Cache frequently accessed metadata
- **Compression**: Compress archived audit data

## Monitoring and Alerts

### Real-time Monitoring
```javascript
// Monitor critical audit events
const criticalActions = [
  'user_delete', 'data_delete', 'privilege_escalation',
  'payment_failed', 'security_scan'
];

// Set up alerts for critical events
auditService.on('critical_event', (auditLog) => {
  // Send alert to security team
  sendSecurityAlert(auditLog);
});
```

### Dashboard Metrics
- **Event Volume**: Total events per time period
- **Category Distribution**: Events by category
- **Severity Breakdown**: Events by severity level
- **User Activity**: Most active users
- **Error Rates**: Failed operations tracking

## Best Practices

### 1. Consistent Naming
```javascript
// Good: Consistent action naming
await auditLogger.logUser('user_update', req, target, changes);

// Bad: Inconsistent naming
await auditLogger.logUser('updateUser', req, target, changes);
```

### 2. Meaningful Metadata
```javascript
// Good: Include relevant context
await auditLogger.logPayment('payment_process', req, paymentId, 100, 'USD', {
  paymentMethod: 'paypal',
  orderId: 'order123',
  customerId: 'customer456'
});

// Bad: Missing context
await auditLogger.logPayment('payment_process', req, paymentId, 100, 'USD');
```

### 3. Appropriate Severity
```javascript
// Critical: System-breaking actions
await auditLogger.logSystem('user_delete', req, target, { reason: 'account_closure' });

// High: Important business actions
await auditLogger.logFinancial('payment_process', req, target, amount, currency);

// Medium: Standard operations
await auditLogger.logMarketplace('service_create', req, serviceId, serviceName);

// Low: Routine operations
await auditLogger.logUser('profile_update', req, target, changes);
```

### 4. Error Handling
```javascript
try {
  // Business logic
  const result = await performBusinessOperation();
  
  // Log success
  await auditLogger.logCustom('operation_success', 'business', req, target, {}, {
    resultId: result.id,
    duration: Date.now() - startTime
  });
  
} catch (error) {
  // Log failure
  await auditLogger.logCustom('operation_failed', 'business', req, target, {}, {
    error: error.message,
    duration: Date.now() - startTime
  });
  
  throw error;
}
```

## Troubleshooting

### Common Issues

1. **Audit logs not appearing**
   - Check `AUDIT_LOGGING_ENABLED=true`
   - Verify MongoDB connection
   - Check audit middleware is properly configured

2. **Performance issues**
   - Monitor database indexes
   - Check retention policy settings
   - Consider archiving old data

3. **Missing audit events**
   - Verify middleware is applied to correct routes
   - Check action mapping in middleware
   - Ensure manual logging is implemented

### Debug Mode
Enable debug logging for troubleshooting:

```env
LOG_LEVEL=debug
AUDIT_LOGGING_ENABLED=true
```

## Security Considerations

1. **Access Control**: Only admin users can view audit logs
2. **Data Encryption**: Audit data encrypted at rest
3. **Network Security**: Secure API endpoints
4. **Audit Integrity**: Tamper-proof audit records
5. **Regular Monitoring**: Monitor audit system itself

## Future Enhancements

1. **Real-time Dashboards**: WebSocket-based live monitoring
2. **Machine Learning**: Anomaly detection for audit patterns
3. **Integration**: SIEM system integration
4. **Advanced Analytics**: Predictive analytics for security
5. **Blockchain**: Immutable audit trail using blockchain
6. **Compliance Automation**: Automated compliance reporting
7. **Risk Scoring**: Risk-based audit prioritization
8. **Multi-tenant**: Tenant-specific audit isolation
