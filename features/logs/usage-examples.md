# Logs Usage Examples

## Get log stats (admin)
```javascript
const qs = new URLSearchParams({ timeframe: '24h' });
const res = await fetch(`/api/logs/stats?${qs}`, { headers: { Authorization: `Bearer ${adminToken}` } });
const { data } = await res.json();
```

## List logs (admin)
```javascript
const qs = new URLSearchParams({ level: 'error', page: 1, limit: 50 });
const res = await fetch(`/api/logs?${qs}`, { headers: { Authorization: `Bearer ${adminToken}` } });
const { data, pagination } = await res.json();
```

## Export logs as CSV (admin)
```javascript
const qs = new URLSearchParams({ category: 'http', startDate: '2025-01-01', endDate: '2025-01-31', format: 'csv' });
const res = await fetch(`/api/logs/export/data?${qs}`, { headers: { Authorization: `Bearer ${adminToken}` } });
const csv = await res.text();
```
