# Communication Features Documentation

## Overview

The Communication feature enables messaging, notifications, and real-time communication between users in the LocalPro Super App. It provides comprehensive conversation management, rich messaging capabilities, multi-channel notifications, and seamless communication tied to bookings, jobs, agencies, and general interactions.

## Base Path
`/api/communication`

---

## Core Features

### 1. Conversation Management
- **Conversation Creation** - Create conversations with multiple participants
- **Conversation Types** - Support for different conversation types:
  - `booking` - Booking-related conversations
  - `job_application` - Job application conversations
  - `support` - Support conversations
  - `general` - General conversations
  - `agency` - Agency-related conversations
- **Participant Management** - Add and remove participants with roles
- **Conversation Status** - Manage conversation status (active, resolved, closed, archived)
- **Priority Levels** - Set conversation priority (low, medium, high, urgent)
- **Context Linking** - Link conversations to bookings, jobs, agencies, orders
- **Conversation Search** - Search conversations by message content

### 2. Messaging System
- **Rich Messages** - Support for multiple message types:
  - `text` - Text messages
  - `image` - Image attachments
  - `file` - File attachments
  - `system` - System messages
  - `booking_update` - Booking update messages
  - `payment_update` - Payment update messages
- **Message Attachments** - Upload and share files and images
- **Message Editing** - Edit sent messages
- **Message Deletion** - Soft delete messages
- **Read Receipts** - Track message read status
- **Message Reactions** - Add emoji reactions to messages
- **Message Replies** - Reply to specific messages
- **Message Search** - Search messages within conversations

### 3. Notification System
- **Multi-Channel Notifications** - Support for multiple notification channels:
  - In-app notifications
  - Email notifications
  - SMS notifications
  - Push notifications
- **Notification Types** - Comprehensive notification types:
  - Booking notifications (created, confirmed, cancelled, completed)
  - Job application notifications
  - Message notifications
  - Payment notifications
  - Referral notifications
  - Course enrollment notifications
  - Order confirmations
  - Subscription notifications
  - System announcements
- **Priority Management** - Set notification priority levels
- **Scheduled Notifications** - Schedule notifications for future delivery
- **Notification Expiration** - Set expiration dates for notifications
- **Read Status Tracking** - Track notification read status

### 4. Real-Time Communication
- **Live Messaging** - Real-time message delivery
- **Typing Indicators** - Show when users are typing
- **Online Status** - Track user online/offline status
- **Presence Updates** - Real-time presence updates
- **Message Delivery** - Instant message delivery

### 5. File & Media Sharing
- **Image Sharing** - Share images in conversations
- **File Sharing** - Share files and documents
- **Media Preview** - Preview images and files
- **Cloud Storage** - Secure cloud storage for attachments (Cloudinary)
- **File Size Limits** - Configurable file size limits
- **Supported Formats** - Support for various file formats

### 6. Conversation Context
- **Booking Context** - Link conversations to bookings
- **Job Context** - Link conversations to job applications
- **Agency Context** - Link conversations to agencies
- **Order Context** - Link conversations to orders
- **Context Navigation** - Easy navigation to related entities

### 7. Participant Roles
- **Role Management** - Assign roles to participants:
  - `client` - Client role
  - `provider` - Provider role
  - `admin` - Admin role
  - `support` - Support role
- **Role-Based Permissions** - Control access based on roles
- **Role Updates** - Update participant roles

### 8. Notification Preferences
- **Channel Preferences** - Configure notification channel preferences
- **Type Preferences** - Configure preferences per notification type
- **Frequency Control** - Control notification frequency
- **Quiet Hours** - Set quiet hours for notifications

### 9. Search & Discovery
- **Conversation Search** - Search conversations by content
- **Message Search** - Search messages across conversations
- **User Search** - Find conversations with specific users
- **Filter Options** - Filter by type, status, priority

### 10. Analytics & Insights
- **Message Statistics** - Track message counts and trends
- **Response Times** - Monitor response times
- **Notification Delivery** - Track notification delivery rates
- **Engagement Metrics** - Measure user engagement

---

## API Endpoints

### Conversation Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/conversations` | Get conversations | `page`, `limit` |
| GET | `/conversations/:id` | Get conversation | - |
| POST | `/conversations` | Create conversation | Body: `participants`, `type`, `subject`, `context` |
| DELETE | `/conversations/:id` | Delete conversation | - |
| GET | `/conversations/:id/messages` | Get messages | `page`, `limit` |
| POST | `/conversations/:id/messages` | Send message | Body: `content`, `type`, `attachments`, `metadata` |
| PUT | `/conversations/:id/messages/:messageId` | Update message | Body: `content` |
| DELETE | `/conversations/:id/messages/:messageId` | Delete message | - |
| PUT | `/conversations/:id/read` | Mark as read | - |
| GET | `/conversation-with/:userId` | Get conversation with user | - |

### Notification Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/notifications` | Get notifications | `page`, `limit`, `isRead`, `type` |
| GET | `/notifications/count` | Get notification count | `isRead` |
| PUT | `/notifications/:notificationId/read` | Mark notification as read | - |
| PUT | `/notifications/read-all` | Mark all as read | - |
| DELETE | `/notifications/:notificationId` | Delete notification | - |
| POST | `/notifications/email` | Send email notification | Body: `to`, `subject`, `template`, `data` |
| POST | `/notifications/sms` | Send SMS notification | Body: `to`, `message` |

### Utility Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/unread-count` | Get unread count | - |
| GET | `/search` | Search conversations | `query`, `page`, `limit` |

---

## Request/Response Examples

### Create Conversation

```http
POST /api/communication/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "participants": ["user_id_1", "user_id_2"],
  "type": "booking",
  "subject": "Service Inquiry",
  "context": {
    "bookingId": "booking_id_here"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "participants": [
      {
        "user": "user_id_1",
        "role": "client",
        "joinedAt": "2025-01-15T10:00:00.000Z",
        "lastReadAt": null
      },
      {
        "user": "user_id_2",
        "role": "provider",
        "joinedAt": "2025-01-15T10:00:00.000Z",
        "lastReadAt": null
      }
    ],
    "type": "booking",
    "subject": "Service Inquiry",
    "context": {
      "bookingId": "booking_id_here"
    },
    "status": "active",
    "priority": "medium",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### Send Message

```http
POST /api/communication/conversations/:id/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello! I'm interested in your cleaning service.",
  "type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012346",
    "conversation": "64a1b2c3d4e5f6789012345",
    "sender": "user_id_1",
    "content": "Hello! I'm interested in your cleaning service.",
    "type": "text",
    "attachments": [],
    "readBy": [],
    "reactions": [],
    "createdAt": "2025-01-15T10:05:00.000Z"
  }
}
```

### Send Message with Attachments

```http
POST /api/communication/conversations/:id/messages
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "content": "Here are the photos from the service",
  "type": "image",
  "attachments": [<file1>, <file2>]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012347",
    "conversation": "64a1b2c3d4e5f6789012345",
    "sender": "user_id_2",
    "content": "Here are the photos from the service",
    "type": "image",
    "attachments": [
      {
        "filename": "photo1.jpg",
        "url": "https://res.cloudinary.com/example/image/upload/v1234567890/photo1.jpg",
        "publicId": "photo1_1234567890",
        "mimeType": "image/jpeg",
        "size": 245678
      },
      {
        "filename": "photo2.jpg",
        "url": "https://res.cloudinary.com/example/image/upload/v1234567890/photo2.jpg",
        "publicId": "photo2_1234567890",
        "mimeType": "image/jpeg",
        "size": 198765
      }
    ],
    "readBy": [],
    "reactions": [],
    "createdAt": "2025-01-15T10:10:00.000Z"
  }
}
```

### Get Conversations

```http
GET /api/communication/conversations?page=1&limit=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "pages": 2,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "participants": [
        {
          "user": {
            "_id": "user_id_1",
            "firstName": "John",
            "lastName": "Doe",
            "profile": {
              "avatar": {
                "url": "https://example.com/avatar1.jpg"
              }
            }
          },
          "role": "client",
          "lastReadAt": "2025-01-15T10:05:00.000Z"
        },
        {
          "user": {
            "_id": "user_id_2",
            "firstName": "Jane",
            "lastName": "Smith",
            "profile": {
              "avatar": {
                "url": "https://example.com/avatar2.jpg"
              }
            }
          },
          "role": "provider",
          "lastReadAt": null
        }
      ],
      "type": "booking",
      "subject": "Service Inquiry",
      "lastMessage": {
        "content": "Here are the photos from the service",
        "sender": "user_id_2",
        "timestamp": "2025-01-15T10:10:00.000Z"
      },
      "status": "active",
      "updatedAt": "2025-01-15T10:10:00.000Z"
    }
  ]
}
```

### Get Messages

```http
GET /api/communication/conversations/:id/messages?page=1&limit=50
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "total": 15,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012346",
      "conversation": "64a1b2c3d4e5f6789012345",
      "sender": {
        "_id": "user_id_1",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": {
            "url": "https://example.com/avatar1.jpg"
          }
        }
      },
      "content": "Hello! I'm interested in your cleaning service.",
      "type": "text",
      "attachments": [],
      "readBy": [
        {
          "user": "user_id_2",
          "readAt": "2025-01-15T10:06:00.000Z"
        }
      ],
      "reactions": [],
      "metadata": {
        "isEdited": false,
        "isDeleted": false
      },
      "createdAt": "2025-01-15T10:05:00.000Z"
    }
  ]
}
```

### Mark Conversation as Read

```http
PUT /api/communication/conversations/:id/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation marked as read"
}
```

### Get Notifications

```http
GET /api/communication/notifications?page=1&limit=20&isRead=false
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 12,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012348",
      "user": "user_id_1",
      "type": "booking_confirmed",
      "title": "Booking Confirmed",
      "message": "Your booking has been confirmed",
      "data": {
        "bookingId": "booking_id_here",
        "bookingDate": "2025-01-20T10:00:00.000Z"
      },
      "isRead": false,
      "priority": "medium",
      "channels": {
        "inApp": true,
        "email": true,
        "sms": false,
        "push": true
      },
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### Get Notification Count

```http
GET /api/communication/notifications/count?isRead=false
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### Mark Notification as Read

```http
PUT /api/communication/notifications/:notificationId/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "_id": "64a1b2c3d4e5f6789012348",
    "isRead": true,
    "readAt": "2025-01-15T11:00:00.000Z"
  }
}
```

### Send Email Notification

```http
POST /api/communication/notifications/email
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Booking Confirmed",
  "template": "booking-confirmation",
  "data": {
    "bookingId": "booking_id_here",
    "bookingDate": "2025-01-20T10:00:00.000Z",
    "serviceName": "Home Cleaning"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email notification sent successfully"
}
```

### Send SMS Notification

```http
POST /api/communication/notifications/sms
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "Your booking has been confirmed for January 20, 2025 at 10:00 AM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS notification sent successfully"
}
```

### Search Conversations

```http
GET /api/communication/search?query=cleaning&page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "subject": "Service Inquiry",
      "type": "booking",
      "lastMessage": {
        "content": "I need cleaning service",
        "timestamp": "2025-01-15T10:05:00.000Z"
      }
    }
  ]
}
```

### Get Conversation with User

```http
GET /api/communication/conversation-with/:userId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "participants": [
      {
        "user": "current_user_id",
        "role": "client"
      },
      {
        "user": "user_id_2",
        "role": "provider"
      }
    ],
    "type": "general",
    "subject": "General Conversation",
    "messages": [
      // Last 50 messages
    ]
  }
}
```

---

## Communication Flow

### 1. Conversation Creation
- User initiates conversation via `POST /conversations`
- System creates conversation with participants
- Conversation linked to context (booking, job, etc.) if provided
- First message can be sent immediately

### 2. Messaging
- Users exchange messages via `POST /conversations/:id/messages`
- Messages can include text, images, or files
- System tracks read status
- Real-time delivery to participants

### 3. Message Management
- Users can edit messages via `PUT /conversations/:id/messages/:messageId`
- Users can delete messages via `DELETE /conversations/:id/messages/:messageId`
- Users can add reactions to messages
- Users can reply to specific messages

### 4. Read Status
- Users mark conversations as read via `PUT /conversations/:id/read`
- System tracks last read timestamp per participant
- Unread count tracked for notifications

### 5. Notifications
- System sends notifications for events
- Notifications delivered via multiple channels
- Users receive and view notifications
- Users mark notifications as read

---

## Conversation Types

### Booking Conversations
- **Type**: `booking`
- **Context**: Linked to booking ID
- **Use Case**: Communication about service bookings
- **Participants**: Client and Provider

### Job Application Conversations
- **Type**: `job_application`
- **Context**: Linked to job ID
- **Use Case**: Communication about job applications
- **Participants**: Job seeker and Employer

### Support Conversations
- **Type**: `support`
- **Context**: General support
- **Use Case**: Customer support interactions
- **Participants**: User and Support team

### General Conversations
- **Type**: `general`
- **Context**: None
- **Use Case**: General user-to-user communication
- **Participants**: Any users

### Agency Conversations
- **Type**: `agency`
- **Context**: Linked to agency ID
- **Use Case**: Agency-related communication
- **Participants**: Agency members

---

## Message Types

### Text Messages
- **Type**: `text`
- **Description**: Standard text messages
- **Content**: Plain text or formatted text
- **Use Case**: General messaging

### Image Messages
- **Type**: `image`
- **Description**: Messages with image attachments
- **Content**: Image files (JPG, PNG, GIF, etc.)
- **Use Case**: Sharing photos, screenshots

### File Messages
- **Type**: `file`
- **Description**: Messages with file attachments
- **Content**: Documents, PDFs, etc.
- **Use Case**: Sharing documents, contracts

### System Messages
- **Type**: `system`
- **Description**: Automated system messages
- **Content**: System-generated content
- **Use Case**: Booking updates, status changes

### Booking Update Messages
- **Type**: `booking_update`
- **Description**: Booking status updates
- **Content**: Booking information
- **Use Case**: Booking confirmations, cancellations

### Payment Update Messages
- **Type**: `payment_update`
- **Description**: Payment status updates
- **Content**: Payment information
- **Use Case**: Payment confirmations, receipts

---

## Notification Types

### Booking Notifications
- `booking_created` - New booking created
- `booking_confirmed` - Booking confirmed
- `booking_cancelled` - Booking cancelled
- `booking_completed` - Booking completed

### Job Application Notifications
- `job_application` - New job application
- `application_status_update` - Application status changed
- `job_posted` - New job posted

### Message Notifications
- `message_received` - New message received

### Payment Notifications
- `payment_received` - Payment received
- `payment_failed` - Payment failed

### Other Notifications
- `referral_reward` - Referral reward earned
- `course_enrollment` - Course enrollment
- `order_confirmation` - Order confirmation
- `subscription_renewal` - Subscription renewed
- `subscription_cancelled` - Subscription cancelled
- `system_announcement` - System announcement

---

## Data Models

### Conversation Model

```javascript
{
  // Participants
  participants: [{
    user: ObjectId,                // User reference
    role: String,                  // enum: client, provider, admin, support
    joinedAt: Date,
    lastReadAt: Date               // Last read timestamp
  }],
  
  // Conversation Details
  type: String,                    // enum: booking, job_application, support, general, agency
  subject: String,                 // Required
  context: {
    bookingId: ObjectId,           // Optional
    jobId: ObjectId,               // Optional
    agencyId: ObjectId,            // Optional
    orderId: ObjectId              // Optional
  },
  
  // Status
  status: String,                  // enum: active, resolved, closed, archived
  priority: String,                // enum: low, medium, high, urgent
  tags: [String],
  
  // Last Message
  lastMessage: {
    content: String,
    sender: ObjectId,              // User reference
    timestamp: Date
  },
  
  // Status
  isActive: Boolean,               // Default: true
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model

```javascript
{
  // Core Fields
  conversation: ObjectId,          // Conversation reference
  sender: ObjectId,                // User reference
  content: String,                 // Required
  type: String,                    // enum: text, image, file, system, booking_update, payment_update
  
  // Attachments
  attachments: [{
    filename: String,
    url: String,
    publicId: String,
    mimeType: String,
    size: Number
  }],
  
  // Metadata
  metadata: {
    isEdited: Boolean,            // Default: false
    editedAt: Date,
    isDeleted: Boolean,            // Default: false
    deletedAt: Date,
    replyTo: ObjectId              // Message reference (for replies)
  },
  
  // Read Status
  readBy: [{
    user: ObjectId,                 // User reference
    readAt: Date
  }],
  
  // Reactions
  reactions: [{
    user: ObjectId,                 // User reference
    emoji: String,
    timestamp: Date
  }],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model

```javascript
{
  // Core Fields
  user: ObjectId,                  // User reference
  type: String,                    // Required, enum: booking_created, booking_confirmed, etc.
  title: String,                   // Required
  message: String,                 // Required
  data: Mixed,                     // Context payload
  
  // Status
  isRead: Boolean,                 // Default: false
  readAt: Date,
  priority: String,                // enum: low, medium, high, urgent
  
  // Channels
  channels: {
    inApp: Boolean,                // Default: true
    email: Boolean,                // Default: false
    sms: Boolean,                   // Default: false
    push: Boolean                  // Default: false
  },
  
  // Scheduling
  scheduledFor: Date,              // Optional
  sentAt: Date,                    // Optional
  expiresAt: Date,                 // Optional
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## Search & Filtering

### Conversation Search

**Query Parameters:**
- `query` - Search query (searches message content)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Notification Filtering

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `isRead` - Filter by read status (true/false)
- `type` - Filter by notification type

### Response Format

**List Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [...]
}
```

---

## Key Metrics

- **Total Conversations** - Total number of conversations
- **Active Conversations** - Number of active conversations
- **Total Messages** - Total message count
- **Unread Messages** - Unread message count
- **Notification Delivery Rate** - Percentage of notifications delivered
- **Response Times** - Average response times
- **Message Volume** - Messages per day/week/month
- **User Engagement** - User engagement metrics

---

## Related Features

The Communication feature integrates with several other features in the LocalPro Super App:

- **User Management** - User profiles and authentication
- **Marketplace** - Booking-related conversations
- **Job Board** - Job application conversations
- **Agencies** - Agency-related conversations
- **Finance** - Payment notification integration
- **Email Service** - Email notification delivery
- **SMS Service** - SMS notification delivery (Twilio)
- **File Storage** - Attachment storage (Cloudinary)
- **Analytics** - Communication analytics

---

## Common Use Cases

1. **Booking Communication** - Clients and providers communicate about bookings
2. **Job Application Communication** - Employers and job seekers communicate
3. **Support Communication** - Users contact support team
4. **General Messaging** - Users send general messages to each other
5. **File Sharing** - Users share files and images in conversations
6. **Notification Delivery** - System sends notifications for events
7. **Real-Time Updates** - Real-time message and notification delivery
8. **Conversation Management** - Users manage their conversations

---

## Error Handling

**Common Error Codes:**
- `400` - Validation errors (invalid data, missing fields)
- `401` - Unauthorized (no token provided)
- `403` - Forbidden (not a participant, not sender)
- `404` - Not found (conversation or message doesn't exist)
- `500` - Server error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "content",
      "message": "Message content is required"
    }
  ]
}
```

---

## Best Practices

### For Users
1. **Clear Communication** - Use clear and concise messages
2. **Timely Responses** - Respond to messages promptly
3. **File Management** - Keep file sizes reasonable
4. **Notification Settings** - Configure notification preferences
5. **Privacy** - Be mindful of sharing sensitive information

### For Developers
1. **Real-Time Updates** - Implement WebSocket for real-time updates
2. **Message Validation** - Validate message content and attachments
3. **File Size Limits** - Enforce file size limits
4. **Rate Limiting** - Implement rate limiting for message sending
5. **Error Handling** - Handle all error cases gracefully
6. **Notification Delivery** - Ensure reliable notification delivery
7. **Read Status** - Update read status accurately
8. **Search Performance** - Optimize search queries

---

## Notification Channels

### In-App Notifications
- **Delivery**: Instant
- **Visibility**: In-app notification center
- **Persistence**: Stored until read or expired
- **Use Case**: All notification types

### Email Notifications
- **Delivery**: Via email service
- **Visibility**: User's email inbox
- **Persistence**: Permanent
- **Use Case**: Important updates, summaries

### SMS Notifications
- **Delivery**: Via Twilio
- **Visibility**: User's phone
- **Persistence**: Temporary
- **Use Case**: Urgent updates, time-sensitive

### Push Notifications
- **Delivery**: Via push service
- **Visibility**: Device notifications
- **Persistence**: Temporary
- **Use Case**: Mobile app notifications

---

*For detailed implementation guidance, see the individual documentation files in the `features/communication/` and `docs/features/` directories.*

