# Announcements Usage Examples

## List announcements (public)
```javascript
const qs = new URLSearchParams({ status: 'published', page: 1, limit: 20, sortBy: 'publishedAt', sortOrder: 'desc' });
const res = await fetch(`/api/announcements?${qs}`);
const { data } = await res.json();
```

## Get my announcements
```javascript
const res = await fetch('/api/announcements/my/list?limit=20', {
  headers: { Authorization: `Bearer ${token}` }
});
const { data } = await res.json();
```

## Create announcement (admin)
```javascript
const payload = {
  title: 'Scheduled Maintenance',
  summary: 'Brief downtime this weekend',
  content: 'We will perform maintenance on Saturday 02:00-03:00 UTC.',
  type: 'maintenance',
  priority: 'high',
  status: 'scheduled',
  scheduledAt: '2025-11-01T02:00:00.000Z',
  expiresAt: '2025-11-01T04:00:00.000Z',
  isSticky: true,
  targetAudience: 'all',
  allowComments: false,
  requireAcknowledgment: true,
  tags: ['maintenance']
};

const res = await fetch('/api/announcements', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  body: JSON.stringify(payload)
});
```

## Acknowledge announcement
```javascript
await fetch(`/api/announcements/${id}/acknowledge`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
```

## Add comment
```javascript
await fetch(`/api/announcements/${id}/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ content: 'Thanks for the heads up!' })
});
```
