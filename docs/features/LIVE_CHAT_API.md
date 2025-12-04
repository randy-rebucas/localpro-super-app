# Live Chat API Documentation

## Overview

The LocalPro Live Chat system provides real-time customer support functionality through a REST API and WebSocket connection. It enables guest users to initiate chat sessions without authentication, while providing authenticated admin/support agents with tools to manage and respond to conversations.

### Key Features

- **Guest Chat Sessions** - Users can start chat sessions by providing name and email
- **Real-time Messaging** - WebSocket support for instant message delivery
- **File Attachments** - Support for images, PDFs, and documents (up to 10MB)
- **Agent Assignment** - Assign and transfer sessions between support agents
- **Session Management** - Track status, priority, and department
- **Analytics** - Chat metrics and performance tracking
- **Customer History** - View previous chat sessions by email

---

## Table of Contents

1. [API Endpoints](#api-endpoints)
   - [Public Endpoints](#public-endpoints-no-authentication)
   - [Admin Endpoints](#admin-endpoints-requires-authentication)
2. [WebSocket Integration](#websocket-integration)
3. [Data Models](#data-models)
4. [Usage Examples](#usage-examples)
5. [Error Handling](#error-handling)

---

## API Endpoints

### Base URLs

- **Public API:** `http://localhost:5000/api/live-chat`
- **Admin API:** `http://localhost:5000/api/admin/live-chat`
- **WebSocket:** `ws://localhost:5000/ws/live-chat`

---

### Public Endpoints (No Authentication)

#### Create Chat Session

Start a new chat session for a guest user.

```
POST /api/live-chat/sessions
```

**Request Body:**
```json
{
  "sessionId": "session-1701691234567-abc123",
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "pageUrl": "https://example.com/pricing"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat session created successfully",
  "data": {
    "session": {
      "sessionId": "session-1701691234567-abc123",
      "user": {
        "name": "John Doe",
        "email": "john@example.com",
        "metadata": {
          "userAgent": "Mozilla/5.0...",
          "ipAddress": "::1",
          "pageUrl": "https://example.com/pricing"
        }
      },
      "status": "pending",
      "priority": "medium",
      "department": "general",
      "messageCount": 1,
      "unreadCount": 0,
      "startedAt": "2024-12-04T12:00:00.000Z"
    },
    "welcomeMessage": {
      "sessionId": "session-1701691234567-abc123",
      "type": "system",
      "content": "Welcome John Doe! A support agent will be with you shortly.",
      "agentName": "System"
    }
  }
}
```

---

#### Get Session Details

Retrieve details of an existing chat session.

```
GET /api/live-chat/sessions/:sessionId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-1701691234567-abc123",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "status": "active",
    "assignedAgent": {
      "_id": "agent123",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "messageCount": 5,
    "startedAt": "2024-12-04T12:00:00.000Z"
  }
}
```

---

#### Send Message

Send a message in an existing chat session.

```
POST /api/live-chat/sessions/:sessionId/messages
```

**Request Body (JSON):**
```json
{
  "content": "Hello, I need help with my order"
}
```

**Request Body (Multipart Form Data with Attachments):**
```
Content-Type: multipart/form-data

content: "Please see the attached screenshot"
files: [file1.png, file2.pdf]
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "msg123",
    "sessionId": "session-1701691234567-abc123",
    "type": "user",
    "content": "Hello, I need help with my order",
    "attachments": [],
    "isRead": false,
    "createdAt": "2024-12-04T12:05:00.000Z"
  }
}
```

---

#### Get Messages

Retrieve messages for a chat session.

```
GET /api/live-chat/sessions/:sessionId/messages
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Messages per page |

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "msg1",
      "sessionId": "session-123",
      "type": "system",
      "content": "Welcome! A support agent will be with you shortly.",
      "createdAt": "2024-12-04T12:00:00.000Z"
    },
    {
      "_id": "msg2",
      "sessionId": "session-123",
      "type": "user",
      "content": "Hello, I need help",
      "createdAt": "2024-12-04T12:01:00.000Z"
    },
    {
      "_id": "msg3",
      "sessionId": "session-123",
      "type": "agent",
      "content": "Hi! How can I assist you today?",
      "agentName": "Jane Smith",
      "createdAt": "2024-12-04T12:02:00.000Z"
    }
  ]
}
```

---

#### Upload Attachments

Upload files before sending a message.

```
POST /api/live-chat/upload
```

**Request Body (Multipart Form Data):**
```
Content-Type: multipart/form-data

sessionId: "session-1701691234567-abc123"
files: [file1.png, file2.pdf]
```

**Supported File Types:**
- Images: `jpg`, `jpeg`, `png`, `gif`, `webp`
- Documents: `pdf`, `doc`, `docx`, `xls`, `xlsx`, `txt`

**File Size Limit:** 10MB per file, maximum 5 files

**Response:**
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "attachments": [
      {
        "id": "attachment123",
        "name": "screenshot.png",
        "type": "image/png",
        "size": 245678,
        "url": "https://res.cloudinary.com/...",
        "previewUrl": "https://res.cloudinary.com/..."
      }
    ]
  }
}
```

---

#### End Chat Session

End a chat session (user initiated).

```
PATCH /api/live-chat/sessions/:sessionId/end
```

**Request Body (Optional):**
```json
{
  "rating": 5,
  "feedback": "Great support, very helpful!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat session ended",
  "data": {
    "sessionId": "session-123",
    "status": "closed",
    "endedAt": "2024-12-04T12:30:00.000Z"
  }
}
```

---

#### Rate Chat Session

Submit a rating for a chat session.

```
POST /api/live-chat/sessions/:sessionId/rate
```

**Request Body:**
```json
{
  "score": 5,
  "feedback": "Excellent service!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your feedback!",
  "data": {
    "rating": {
      "score": 5,
      "feedback": "Excellent service!",
      "ratedAt": "2024-12-04T12:35:00.000Z"
    }
  }
}
```

---

#### Send Typing Indicator

Notify that user is typing.

```
POST /api/live-chat/sessions/:sessionId/typing
```

**Request Body:**
```json
{
  "isTyping": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Typing indicator sent"
}
```

---

### Admin Endpoints (Requires Authentication)

All admin endpoints require authentication via Bearer token with `admin`, `super_admin`, or `support` role.

**Headers:**
```
Authorization: Bearer <token>
```

---

#### List All Sessions

Get all chat sessions with filtering options.

```
GET /api/admin/live-chat/sessions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Sessions per page (default: 20) |
| status | string | Filter by status: `pending`, `active`, `closed`, `archived` |
| department | string | Filter by department: `general`, `sales`, `support`, `billing`, `technical` |
| priority | string | Filter by priority: `low`, `medium`, `high`, `urgent` |
| assignedAgent | string | Filter by agent ID or `unassigned` |
| search | string | Search by user name, email, or session ID |

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "pages": 5,
  "statusCounts": {
    "pending": 5,
    "active": 20,
    "closed": 18,
    "archived": 2
  },
  "data": [
    {
      "sessionId": "session-123",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "status": "pending",
      "priority": "medium",
      "lastMessage": {
        "content": "Hello, I need help",
        "type": "user",
        "timestamp": "2024-12-04T12:05:00.000Z"
      },
      "messageCount": 2,
      "unreadCount": 1,
      "createdAt": "2024-12-04T12:00:00.000Z"
    }
  ]
}
```

---

#### Get Session Details (Admin)

Get detailed session information with all messages.

```
GET /api/admin/live-chat/sessions/:sessionId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "sessionId": "session-123",
      "user": {
        "name": "John Doe",
        "email": "john@example.com",
        "metadata": {
          "userAgent": "Mozilla/5.0...",
          "ipAddress": "192.168.1.1",
          "pageUrl": "https://example.com"
        }
      },
      "status": "active",
      "priority": "medium",
      "department": "support",
      "assignedAgent": {
        "_id": "agent123",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@company.com"
      },
      "notes": [
        {
          "content": "Customer has premium subscription",
          "addedBy": { "firstName": "Jane", "lastName": "Smith" },
          "addedAt": "2024-12-04T12:10:00.000Z"
        }
      ],
      "rating": {
        "score": 5,
        "feedback": "Great help!",
        "ratedAt": "2024-12-04T12:30:00.000Z"
      }
    },
    "messages": [
      {
        "_id": "msg1",
        "type": "system",
        "content": "Welcome!",
        "createdAt": "2024-12-04T12:00:00.000Z"
      },
      {
        "_id": "msg2",
        "type": "user",
        "content": "I need help",
        "createdAt": "2024-12-04T12:01:00.000Z"
      }
    ]
  }
}
```

---

#### Send Agent Reply

Send a reply as a support agent.

```
POST /api/admin/live-chat/sessions/:sessionId/reply
```

**Request Body (JSON):**
```json
{
  "content": "Hello! I'd be happy to help you with that."
}
```

**Request Body (Multipart Form Data with Attachments):**
```
Content-Type: multipart/form-data

content: "Here's the document you requested"
files: [document.pdf]
```

**Response:**
```json
{
  "success": true,
  "message": "Reply sent successfully",
  "data": {
    "_id": "msg123",
    "sessionId": "session-123",
    "type": "agent",
    "content": "Hello! I'd be happy to help you with that.",
    "agentName": "Jane Smith",
    "agentId": "agent123",
    "createdAt": "2024-12-04T12:05:00.000Z"
  }
}
```

---

#### Assign Session to Agent

Assign a chat session to a specific agent.

```
PATCH /api/admin/live-chat/sessions/:sessionId/assign
```

**Request Body:**
```json
{
  "agentId": "agent123",
  "agentName": "Jane Smith"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session assigned successfully",
  "data": {
    "sessionId": "session-123",
    "assignedAgent": "agent123",
    "agentName": "Jane Smith",
    "status": "active"
  }
}
```

---

#### Update Session Status

Update session status, priority, department, or tags.

```
PATCH /api/admin/live-chat/sessions/:sessionId/status
```

**Request Body:**
```json
{
  "status": "closed",
  "priority": "high",
  "department": "billing",
  "tags": ["refund", "urgent"]
}
```

**Status Values:** `pending`, `active`, `closed`, `archived`
**Priority Values:** `low`, `medium`, `high`, `urgent`
**Department Values:** `general`, `sales`, `support`, `billing`, `technical`

**Response:**
```json
{
  "success": true,
  "message": "Session updated successfully",
  "data": {
    "sessionId": "session-123",
    "status": "closed",
    "priority": "high",
    "department": "billing",
    "tags": ["refund", "urgent"]
  }
}
```

---

#### Add Internal Note

Add an internal note to a session (not visible to user).

```
POST /api/admin/live-chat/sessions/:sessionId/notes
```

**Request Body:**
```json
{
  "content": "Customer mentioned they have a premium subscription"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note added successfully",
  "data": {
    "content": "Customer mentioned they have a premium subscription",
    "addedBy": "agent123",
    "addedAt": "2024-12-04T12:10:00.000Z"
  }
}
```

---

#### Transfer Session

Transfer a session to another agent.

```
POST /api/admin/live-chat/sessions/:sessionId/transfer
```

**Request Body:**
```json
{
  "toAgentId": "agent456",
  "toAgentName": "Bob Wilson",
  "reason": "Billing expertise needed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session transferred successfully",
  "data": {
    "sessionId": "session-123",
    "assignedAgent": "agent456",
    "agentName": "Bob Wilson"
  }
}
```

---

#### Get Chat Analytics

Get chat performance analytics for a date range.

```
GET /api/admin/live-chat/analytics
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Start date (ISO format) |
| endDate | string | End date (ISO format) |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-11-01T00:00:00.000Z",
      "end": "2024-12-01T00:00:00.000Z"
    },
    "overview": {
      "totalSessions": 150,
      "avgMessages": 8.5,
      "closedSessions": 120,
      "avgRating": 4.5
    },
    "responseTime": {
      "avgResponseTime": 45000,
      "minResponseTime": 15000,
      "maxResponseTime": 180000
    },
    "sessionsByDay": [
      { "_id": "2024-11-01", "count": 5 },
      { "_id": "2024-11-02", "count": 8 }
    ],
    "topAgents": [
      {
        "_id": "agent123",
        "sessionsHandled": 45,
        "avgRating": 4.8
      }
    ]
  }
}
```

---

#### Get Customer History

Get all previous chat sessions for a customer by email.

```
GET /api/admin/live-chat/customers/:email/history
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Sessions per page |

**Response:**
```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "sessionId": "session-123",
      "status": "closed",
      "messageCount": 12,
      "rating": { "score": 5 },
      "createdAt": "2024-12-04T12:00:00.000Z",
      "endedAt": "2024-12-04T12:30:00.000Z"
    },
    {
      "sessionId": "session-100",
      "status": "closed",
      "messageCount": 8,
      "rating": { "score": 4 },
      "createdAt": "2024-11-15T10:00:00.000Z",
      "endedAt": "2024-11-15T10:45:00.000Z"
    }
  ]
}
```

---

#### Delete Session

Permanently delete a session and all its messages.

```
DELETE /api/admin/live-chat/sessions/:sessionId
```

**Required Role:** `admin` or `super_admin`

**Response:**
```json
{
  "success": true,
  "message": "Session and all messages deleted successfully"
}
```

---

## WebSocket Integration

### Connection URL

```
ws://localhost:5000/ws/live-chat
```

### Connection Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| sessionId | string | Chat session ID (for users) |
| admin | boolean | Set to `true` for admin connections |
| userId | string | User/Agent ID (for admins) |

### User Connection

```javascript
const ws = new WebSocket('ws://localhost:5000/ws/live-chat?sessionId=session-123');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'connection_established':
      console.log('Connected to chat');
      break;
    case 'agent_message':
      console.log('New message from agent:', data.message);
      break;
    case 'agent_typing':
      console.log('Agent is typing:', data.isTyping);
      break;
    case 'agent_assigned':
      console.log('Agent joined:', data.agent.name);
      break;
    case 'session_status_changed':
      console.log('Session status:', data.status);
      break;
  }
};
```

### Admin Connection

```javascript
const ws = new WebSocket('ws://localhost:5000/ws/live-chat?admin=true&userId=agent123');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'new_session':
      console.log('New chat session:', data.session);
      break;
    case 'user_message':
      console.log('New message from user:', data.message);
      break;
    case 'user_typing':
      console.log('User is typing:', data.isTyping);
      break;
  }
};

// Subscribe to a specific session
ws.send(JSON.stringify({
  type: 'subscribe_session',
  sessionId: 'session-123'
}));
```

### WebSocket Events

#### Incoming Events (Server → Client)

| Event Type | Description | Data |
|------------|-------------|------|
| `connection_established` | Connection successful | `{ timestamp }` |
| `new_session` | New chat session started (admin only) | `{ session }` |
| `user_message` | Message from user | `{ sessionId, message }` |
| `agent_message` | Message from agent | `{ sessionId, message }` |
| `user_typing` | User typing indicator | `{ sessionId, isTyping }` |
| `agent_typing` | Agent typing indicator | `{ sessionId, isTyping }` |
| `agent_assigned` | Agent joined chat | `{ sessionId, agent }` |
| `session_status_changed` | Status changed | `{ sessionId, status }` |
| `read_receipt` | Message read | `{ sessionId, messageId, readBy }` |

#### Outgoing Events (Client → Server)

| Event Type | Description | Data |
|------------|-------------|------|
| `typing` | Send typing indicator | `{ isTyping, sessionId? }` |
| `read_receipt` | Mark message as read | `{ messageId, sessionId? }` |
| `ping` | Keep connection alive | `{}` |
| `subscribe_session` | Subscribe to session (admin) | `{ sessionId }` |
| `unsubscribe_session` | Unsubscribe from session | `{ sessionId }` |

---

## Data Models

### LiveChatSession

```javascript
{
  sessionId: String,           // Unique session identifier
  user: {
    name: String,              // User's name
    email: String,             // User's email
    phone: String,             // Optional phone number
    metadata: {
      userAgent: String,       // Browser user agent
      ipAddress: String,       // Client IP address
      referrer: String,        // Referrer URL
      pageUrl: String          // Page where chat started
    }
  },
  status: String,              // pending | active | closed | archived
  priority: String,            // low | medium | high | urgent
  department: String,          // general | sales | support | billing | technical
  assignedAgent: ObjectId,     // Reference to User (agent)
  agentName: String,           // Agent's display name
  tags: [String],              // Custom tags
  lastMessage: {
    content: String,
    type: String,
    timestamp: Date
  },
  messageCount: Number,
  unreadCount: Number,
  startedAt: Date,
  endedAt: Date,
  firstResponseAt: Date,
  rating: {
    score: Number,             // 1-5
    feedback: String,
    ratedAt: Date
  },
  notes: [{
    content: String,
    addedBy: ObjectId,
    addedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### LiveChatMessage

```javascript
{
  sessionId: String,           // Reference to session
  type: String,                // user | agent | system
  content: String,             // Message content
  agentName: String,           // Agent name (for agent messages)
  agentAvatar: String,         // Agent avatar
  agentId: ObjectId,           // Reference to User (agent)
  attachments: [{
    id: String,
    name: String,
    type: String,              // MIME type
    size: Number,              // File size in bytes
    url: String,               // File URL
    publicId: String,          // Cloudinary public ID
    previewUrl: String         // Preview URL for images
  }],
  metadata: {
    isEdited: Boolean,
    editedAt: Date,
    isDeleted: Boolean,
    deletedAt: Date
  },
  isRead: Boolean,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Usage Examples

### Frontend Integration (React)

```jsx
import { useState, useEffect, useCallback } from 'react';

const useLiveChat = () => {
  const [sessionId] = useState(() => 
    `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);

  // Start session
  const startSession = async (user) => {
    const response = await fetch('/api/live-chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, user })
    });
    
    const data = await response.json();
    if (data.success) {
      setMessages([data.data.welcomeMessage]);
      connectWebSocket();
    }
    return data;
  };

  // Connect WebSocket
  const connectWebSocket = () => {
    const socket = new WebSocket(
      `ws://localhost:5000/ws/live-chat?sessionId=${sessionId}`
    );

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'agent_message') {
        setMessages(prev => [...prev, data.message]);
      }
    };

    setWs(socket);
  };

  // Send message
  const sendMessage = async (content) => {
    const response = await fetch(
      `/api/live-chat/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      }
    );
    
    const data = await response.json();
    if (data.success) {
      setMessages(prev => [...prev, data.data]);
    }
    return data;
  };

  // Send typing indicator
  const sendTyping = (isTyping) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'typing', isTyping }));
    }
  };

  return {
    sessionId,
    messages,
    isConnected,
    startSession,
    sendMessage,
    sendTyping
  };
};
```

### Admin Dashboard Integration

```jsx
const useAdminChat = (token) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [ws, setWs] = useState(null);

  // Fetch sessions
  const fetchSessions = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `/api/admin/live-chat/sessions?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    if (data.success) setSessions(data.data);
  };

  // Connect as admin
  const connectAdmin = (agentId) => {
    const socket = new WebSocket(
      `ws://localhost:5000/ws/live-chat?admin=true&userId=${agentId}`
    );

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_session') {
        setSessions(prev => [data.session, ...prev]);
      }
      
      if (data.type === 'user_message' && 
          currentSession?.sessionId === data.sessionId) {
        setCurrentSession(prev => ({
          ...prev,
          messages: [...prev.messages, data.message]
        }));
      }
    };

    setWs(socket);
  };

  // Send reply
  const sendReply = async (sessionId, content) => {
    const response = await fetch(
      `/api/admin/live-chat/sessions/${sessionId}/reply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      }
    );
    return response.json();
  };

  return {
    sessions,
    currentSession,
    fetchSessions,
    connectAdmin,
    sendReply,
    setCurrentSession
  };
};
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Missing required fields |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Session not found |
| 500 | Server Error - Internal error |

### Example Error Responses

**Session Not Found:**
```json
{
  "success": false,
  "message": "Session not found"
}
```

**Unauthorized:**
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "User name and email are required"
}
```

---

## Rate Limiting

In production mode, API endpoints are subject to rate limiting:
- **General Limit:** 100 requests per 15 minutes per IP

---

## Support

For questions or issues with the Live Chat API, contact the development team.

**Last Updated:** December 2024

