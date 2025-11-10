# Analytics Usage Examples

## Track Event (frontend)
```javascript
async function trackEvent(eventType, module, data = {}) {
  await fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ eventType, module, data })
  });
}

// Example: service view
trackEvent('service_view', 'marketplace', { serviceId, category });
```

## Get User Analytics (dashboard)
```javascript
async function getUserAnalytics(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/analytics/user?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

const data = await getUserAnalytics({ startDate: '2025-01-01', endDate: '2025-01-31' });
```

## Get Marketplace Analytics
```javascript
const res = await fetch('/api/analytics/marketplace?startDate=2025-01-01&endDate=2025-01-31', {
  headers: { Authorization: `Bearer ${token}` }
});
const { data } = await res.json();
// data.serviceAnalytics, data.bookingAnalytics, data.topServices, data.providerPerformance
```

## Get Platform Analytics via Events static
```javascript
import { AnalyticsEvent } from '@/models/Analytics';

const analytics = await AnalyticsEvent.getPlatformAnalytics(30);
// { totalEvents, uniqueUsers, eventTypes, dailyActivity, topEvents }
```

## Get Custom Analytics (admin)
```javascript
const qs = new URLSearchParams({ eventType: 'search_performed', startDate: '2025-01-01' });
const res = await fetch(`/api/analytics/custom?${qs}`, { headers: { Authorization: `Bearer ${adminToken}` } });
const { data } = await res.json();
```
