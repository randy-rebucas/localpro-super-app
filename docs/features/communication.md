# Communication Feature Documentation

## Overview
The Communication feature enables messaging, notifications, and real-time communication between users in the LocalPro Super App.

## Base Path
`/api/communication`

## Endpoints

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/conversations` | Get conversations | AUTHENTICATED |
| GET | `/conversations/:id` | Get conversation | AUTHENTICATED |
| POST | `/conversations` | Create conversation | AUTHENTICATED |
| DELETE | `/conversations/:id` | Delete conversation | AUTHENTICATED |
| GET | `/conversations/:id/messages` | Get messages | AUTHENTICATED |
| POST | `/conversations/:id/messages` | Send message (with attachments) | AUTHENTICATED |
| PUT | `/conversations/:id/messages/:messageId` | Update message | AUTHENTICATED |
| DELETE | `/conversations/:id/messages/:messageId` | Delete message | AUTHENTICATED |
| PUT | `/conversations/:id/read` | Mark as read | AUTHENTICATED |
| GET | `/notifications` | Get notifications | AUTHENTICATED |
| GET | `/notifications/count` | Get notification count | AUTHENTICATED |
| PUT | `/notifications/:notificationId/read` | Mark notification as read | AUTHENTICATED |
| PUT | `/notifications/read-all` | Mark all as read | AUTHENTICATED |
| DELETE | `/notifications/:notificationId` | Delete notification | AUTHENTICATED |
| POST | `/notifications/email` | Send email notification | AUTHENTICATED |
| POST | `/notifications/sms` | Send SMS notification | AUTHENTICATED |
| GET | `/unread-count` | Get unread count | AUTHENTICATED |
| GET | `/search` | Search conversations | AUTHENTICATED |
| GET | `/conversation-with/:userId` | Get conversation with user | AUTHENTICATED |

## Request/Response Examples

### Create Conversation
```http
POST /api/communication/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "participants": ["user_id_1", "user_id_2"],
  "type": "direct",
  "subject": "Service Inquiry"
}
```

### Send Message with Attachments
```http
POST /api/communication/conversations/:id/messages
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "content": "Here are the photos from the service",
  "attachments": [<file1>, <file2>]
}
```

### Send Notification
```http
POST /api/communication/notifications/email
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientId": "user_id",
  "subject": "Booking Confirmed",
  "body": "Your booking has been confirmed",
  "type": "booking"
}
```

## Communication Flow

1. **Conversation Creation**:
   - User initiates conversation
   - System creates conversation with participants
   - First message sent

2. **Messaging**:
   - Users exchange messages
   - Files/images can be attached
   - Messages marked as read/unread

3. **Notifications**:
   - System sends notifications for events
   - User receives notifications
   - User marks as read

## Message Types

- `text` - Text message
- `image` - Image attachment
- `file` - File attachment
- `system` - System message

## Notification Types

- `booking` - Booking updates
- `message` - New message
- `review` - New review
- `payment` - Payment updates
- `system` - System notifications

## Related Features
- Marketplace (Booking communication)
- User Management
- Activities

