# Communication Usage Examples

## List conversations
```javascript
const res = await fetch('/api/communication/conversations?page=1&limit=20', {
  headers: { Authorization: `Bearer ${token}` }
});
const { data } = await res.json();
```

## Create conversation
```javascript
await fetch('/api/communication/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ participants: [otherUserId], subject: 'Hello' })
});
```

## Send message
```javascript
await fetch(`/api/communication/conversations/${conversationId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ content: 'Hi there!', type: 'text' })
});
```

## Mark as read
```javascript
await fetch(`/api/communication/conversations/${conversationId}/read`, {
  method: 'PUT', headers: { Authorization: `Bearer ${token}` }
});
```

## Notifications
```javascript
// List
const list = await fetch('/api/communication/notifications?isRead=false', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json());

// Count
const count = await fetch('/api/communication/notifications/count', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json());

// Mark one as read
await fetch(`/api/communication/notifications/${notificationId}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });

// Mark all as read
await fetch('/api/communication/notifications/read-all', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
```
