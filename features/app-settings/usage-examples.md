# App Settings Usage Examples

## Get public settings (client bootstrap)
```javascript
const res = await fetch('/api/settings/app/public');
const { data } = await res.json();
// Use data.general.maintenanceMode, data.features, data.uploads, etc.
```

## Get app health
```javascript
const res = await fetch('/api/settings/app/health');
const { data } = await res.json();
```

## Admin: get full settings
```javascript
const res = await fetch('/api/settings/app', { headers: { Authorization: `Bearer ${adminToken}` } });
const { data } = await res.json();
```

## Admin: update settings category
```javascript
await fetch('/api/settings/app/general', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({
    appName: 'LocalPro',
    maintenanceMode: { enabled: true, message: 'Upgrading...', estimatedEndTime: '2025-11-01T03:00:00Z' }
  })
});
```

## Admin: toggle feature flag
```javascript
await fetch('/api/settings/app/features/toggle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  body: JSON.stringify({ feature: 'marketplace', enabled: false })
});
```
