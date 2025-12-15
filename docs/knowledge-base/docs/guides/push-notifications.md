# Push Notifications Guide

## Overview

This guide covers setting up push notifications using Firebase Cloud Messaging (FCM).

## Firebase Setup

### 1. Create Firebase Project

1. Go to Firebase Console
2. Create new project
3. Enable Cloud Messaging

### 2. Get Server Key

1. Go to Project Settings
2. Cloud Messaging tab
3. Copy Server Key

### 3. Configure Environment

```env
FCM_SERVER_KEY=your-server-key
```

## Client Setup

### iOS

1. Add Firebase SDK
2. Request notification permission
3. Get FCM token
4. Send token to backend

### Android

1. Add Firebase SDK
2. Get FCM token
3. Send token to backend

## Backend Integration

### Store FCM Tokens

```javascript
// User model includes fcmTokens array
{
  fcmTokens: [{
    token: 'fcm-token',
    deviceId: 'device-id',
    deviceType: 'ios' | 'android' | 'web'
  }]
}
```

### Send Notification

```javascript
POST /api/notifications/send
Body: {
  userId: 'user-id',
  title: 'Notification title',
  message: 'Notification message',
  data: { /* custom data */ }
}
```

## Notification Types

- `booking` - Booking notifications
- `payment` - Payment notifications
- `message` - Message notifications
- `system` - System notifications

## Implementation

### Send Push Notification

```javascript
const admin = require('firebase-admin');

const message = {
  notification: {
    title: 'New Booking',
    body: 'You have a new booking request'
  },
  data: {
    type: 'booking',
    bookingId: '123'
  },
  token: fcmToken
};

admin.messaging().send(message);
```

## User Preferences

Users can configure notification preferences:

```javascript
GET  /api/notifications/settings
PUT  /api/notifications/settings
Body: {
  pushEnabled: true,
  bookingNotifications: true,
  paymentNotifications: true
}
```

## Best Practices

1. **Request permission** - Ask user before sending
2. **Handle errors** - Invalid tokens, etc.
3. **Batch notifications** - Send multiple at once
4. **Personalize** - Use user's name, etc.
5. **Test thoroughly** - Test on real devices

## Troubleshooting

### Notifications Not Received

1. Check FCM token is valid
2. Verify notification permissions
3. Check device is online
4. Review FCM logs

### Token Expired

1. Refresh token periodically
2. Handle token refresh errors
3. Update token in database

## Next Steps

- Review [Notifications Feature](../features/notifications.md)
- Check [API Documentation](../api/endpoints.md#notifications)

