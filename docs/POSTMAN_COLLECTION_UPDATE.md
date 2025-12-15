# 📬 Postman Collection Update Summary

**Date**: December 15, 2025  
**Version**: 2025-12-15-enhanced

---

## ✅ Updates Completed

### 1. **FCM Token Management Endpoints** (NEW)
Added to **Communication** section:

- ✅ `POST /api/notifications/fcm-token` - Register/update FCM token
- ✅ `DELETE /api/notifications/fcm-token/:tokenOrDeviceId` - Remove FCM token
- ✅ `GET /api/notifications/fcm-tokens` - Get all registered FCM tokens

**Features Documented**:
- Multiple devices per user support
- Automatic invalid token cleanup
- Device type support (ios, android, web)

---

### 2. **Scheduled Jobs Section** (NEW)
Added complete new section with 5 endpoints:

- ✅ `GET /api/scheduled-jobs/status` - Get job status
- ✅ `POST /api/scheduled-jobs/historical-metrics/trigger` - Trigger metrics collection
- ✅ `POST /api/scheduled-jobs/webhook-cleanup/trigger` - Trigger webhook cleanup
- ✅ `POST /api/scheduled-jobs/start` - Start jobs service
- ✅ `POST /api/scheduled-jobs/stop` - Stop jobs service

**Features Documented**:
- Admin-only access
- Manual trigger capabilities
- Automatic scheduling (2 AM for metrics, 3 AM for cleanup)

---

### 3. **Referral Invitation Endpoint** (UPDATED)
Updated `POST /api/referrals/invite`:

**New Features**:
- ✅ SMS invitation support (`phoneNumbers` array)
- ✅ Method selection (`email` or `sms`)
- ✅ Rate limiting documentation (10 SMS/hour)
- ✅ Twilio configuration requirements
- ✅ User SMS preferences requirement

**Updated Request Body**:
```json
{
  "emails": ["friend1@example.com"],
  "phoneNumbers": ["+1234567890"],
  "method": "email",
  "message": "Join LocalPro and get rewarded!"
}
```

---

### 4. **Webhook Security Documentation** (UPDATED)
Enhanced descriptions for all webhook endpoints:

#### PayMongo Webhooks
- ✅ Signature verification (x-signature header)
- ✅ Replay attack protection (5-minute window)
- ✅ Duplicate event detection (idempotency)
- ✅ Complete audit trail

#### Generic Payment Webhooks
- ✅ Multi-provider support (PayMongo, Stripe, Xendit, PayPal, PayMaya)
- ✅ Provider-specific signature verification
- ✅ WebhookEvent collection logging

#### PayPal Webhook
- ✅ Signature verification (paypal-transmission-sig header)
- ✅ Security features documented

#### PayMaya Webhook
- ✅ Security features documented

---

## 📊 Collection Statistics

**Version**: 2025-12-15-enhanced  
**Total Sections**: Updated with new "Scheduled Jobs" section  
**New Endpoints Added**: 8  
**Updated Endpoints**: 4  
**Total Endpoints**: 200+ (estimated)

---

## 🔍 Endpoint Details

### FCM Token Management

#### Register FCM Token
```
POST /api/notifications/fcm-token
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "token": "fcm-device-token-here",
  "deviceId": "unique-device-id",
  "deviceType": "android"
}
```

#### Remove FCM Token
```
DELETE /api/notifications/fcm-token/:tokenOrDeviceId
Authorization: Bearer {{authToken}}
```

#### Get FCM Tokens
```
GET /api/notifications/fcm-tokens
Authorization: Bearer {{authToken}}
```

### Scheduled Jobs

#### Get Status
```
GET /api/scheduled-jobs/status
Authorization: Bearer {{adminToken}}
```

#### Trigger Historical Metrics Collection
```
POST /api/scheduled-jobs/historical-metrics/trigger
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "date": "2025-12-14",
  "providerId": "507f1f77bcf86cd799439011"
}
```

#### Trigger Webhook Cleanup
```
POST /api/scheduled-jobs/webhook-cleanup/trigger
Authorization: Bearer {{adminToken}}
```

#### Start/Stop Jobs
```
POST /api/scheduled-jobs/start
POST /api/scheduled-jobs/stop
Authorization: Bearer {{adminToken}}
```

### Referral Invitations (Updated)

#### Send Referral Invitation (Email or SMS)
```
POST /api/referrals/invite
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "emails": ["friend1@example.com"],
  "phoneNumbers": ["+1234567890"],
  "method": "email",
  "message": "Join LocalPro and get rewarded!"
}
```

**Method Options**:
- `email` - Send email invitations
- `sms` - Send SMS invitations (requires Twilio, rate limited)

---

## 🔐 Security Features Documented

### Webhook Security
- **Signature Verification**: All providers use HMAC-based verification
- **Replay Attack Protection**: 5-minute timestamp window
- **Idempotency**: Duplicate event detection via WebhookEvent model
- **Audit Trail**: All events logged with full details

### Rate Limiting
- **SMS Referrals**: 10 SMS per hour per user
- **Webhook Processing**: One-time processing per event ID

---

## 📝 Collection Metadata

**Description Updated**:
> Complete API collection for LocalPro Super App with all endpoints organized by module. Updated for multi-role support - users can have multiple roles (client, provider, supplier, instructor, agency_owner, agency_admin). Generated automatically from route files. PayMongo integration endpoints and webhook coverage added Dec 2025. Enhanced Dec 15, 2025 with: Push notifications (FCM), SMS referrals, Historical metrics, Scheduled jobs, Enhanced webhook security.

**Version**: 2025-12-15-enhanced

---

## ✅ Validation

- ✅ JSON syntax validated
- ✅ All endpoints properly formatted
- ✅ Request/response examples included
- ✅ Descriptions updated
- ✅ Authentication headers documented
- ✅ Query parameters documented

---

## 🚀 Next Steps

1. **Import Collection**: Import updated collection into Postman
2. **Set Variables**: Configure `{{baseUrl}}`, `{{authToken}}`, `{{adminToken}}`
3. **Test Endpoints**: Verify all new endpoints work correctly
4. **Update Environment**: Add any new environment variables needed

---

## 📚 Related Documentation

- `IMPLEMENTATION_IMPROVEMENTS.md` - Critical fixes
- `HIGH_PRIORITY_IMPROVEMENTS_COMPLETE.md` - High-priority items
- `NEXT_STEPS_IMPLEMENTATION.md` - Next steps completion

---

**Status**: ✅ **Complete** - All endpoints updated and documented

