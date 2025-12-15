# SMS Integration Guide

## Overview

This guide covers SMS integration using Twilio for verification codes and notifications.

## Twilio Setup

### 1. Create Twilio Account

1. Sign up at Twilio
2. Verify phone number
3. Get account credentials

### 2. Get Credentials

- Account SID
- Auth Token
- Phone Number

### 3. Configure Environment

```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## SMS Features

### Verification Codes

Used for phone-based authentication:

```javascript
POST /api/auth/send-code
Body: {
  phoneNumber: '+1234567890'
}
```

### Notifications

Send SMS notifications:

```javascript
POST /api/notifications/sms
Body: {
  phoneNumber: '+1234567890',
  message: 'Your booking is confirmed'
}
```

## Implementation

### Send SMS

```javascript
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

await client.messages.create({
  body: 'Your verification code is: 123456',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+1234567890'
});
```

## SMS Templates

### Verification Code

```
Your LocalPro verification code is: {code}
Valid for 5 minutes.
```

### Booking Confirmation

```
Your booking is confirmed for {date} at {time}.
Service: {serviceName}
```

### Payment Notification

```
Payment of {amount} {currency} received.
Transaction ID: {transactionId}
```

## Rate Limiting

### Verification Codes

- 1 code per phone per minute
- Code expires in 5 minutes
- Maximum 5 attempts per code

### Notifications

- Respect user preferences
- Batch when possible
- Avoid spam

## Best Practices

1. **Format phone numbers** - Use E.164 format
2. **Handle errors** - Invalid numbers, etc.
3. **Rate limiting** - Prevent abuse
4. **Cost management** - Monitor usage
5. **User consent** - Get permission for notifications

## Testing

### Twilio Test Credentials

Use test credentials for development:
- Test Account SID
- Test Auth Token

### Test Phone Numbers

Twilio provides test numbers for testing.

## Troubleshooting

### SMS Not Received

1. Check phone number format
2. Verify Twilio credentials
3. Check account balance
4. Review Twilio logs

### Invalid Phone Number

1. Validate format (E.164)
2. Check country code
3. Verify number exists

## Cost Management

- Monitor SMS usage
- Set usage limits
- Use templates efficiently
- Consider alternatives for high volume

## Next Steps

- Review [Authentication Architecture](../architecture/authentication.md)
- Check [Notifications Feature](../features/notifications.md)

