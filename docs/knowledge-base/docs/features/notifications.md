# Notifications Feature

## Overview

The Notifications feature provides comprehensive notification management including push notifications, in-app notifications, email notifications, and SMS notifications.

## Key Features

- **Push Notifications** - Real-time push notifications via FCM
- **In-App Notifications** - Notification center
- **Email Notifications** - Email alerts
- **SMS Notifications** - SMS alerts
- **Notification Preferences** - User-configurable settings
- **Notification History** - Complete notification log

## API Endpoints

### Get Notifications

```
GET /api/notifications
Query Parameters:
  - type?: string
  - read?: boolean
  - page?: number
  - limit?: number
```

### Mark as Read

```
PUT /api/notifications/:id/read
PUT /api/notifications/read-all
```

### Notification Settings

```
GET  /api/notifications/settings
PUT  /api/notifications/settings
```

### Admin: Send Broadcast

```
POST /api/notifications/broadcast
Body: {
  title: string;
  message: string;
  type: string;
  targetAudience: string;
}
```

## Notification Types

- `booking` - Booking-related notifications
- `payment` - Payment notifications
- `message` - Message notifications
- `system` - System notifications
- `promotion` - Promotional notifications

## Implementation

See [Push Notifications Guide](../guides/push-notifications.md) for setup.

## Related Features

- [Settings](./settings.md) - User preferences
- [Communication](../api/endpoints.md#communication) - Messaging

