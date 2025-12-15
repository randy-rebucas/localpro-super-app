# Settings Feature

## Overview

The Settings feature provides comprehensive configuration management for both application-wide settings and user-specific preferences.

## Key Features

- **App Settings** - Platform-wide configuration
- **User Settings** - Individual user preferences
- **Feature Toggles** - Enable/disable features
- **Notification Settings** - Notification preferences
- **Privacy Settings** - Privacy controls

## API Endpoints

### App Settings (Admin)

```
GET    /api/settings/app                 # Get app settings
PUT    /api/settings/app                 # Update app settings
PUT    /api/settings/app/:category       # Update category
POST   /api/settings/app/features/toggle # Toggle feature
GET    /api/settings/app/public          # Get public settings
```

### User Settings

```
GET    /api/settings/user                # Get user settings
PUT    /api/settings/user                # Update user settings
```

## Settings Categories

### App Settings

- `general` - General app settings
- `business` - Business information
- `features` - Feature toggles
- `payments` - Payment configuration
- `security` - Security settings
- `notifications` - Notification settings

### User Settings

- `privacy` - Privacy preferences
- `notifications` - Notification preferences
- `preferences` - User preferences
- `security` - Security settings

## Feature Toggles

```javascript
POST /api/settings/app/features/toggle
Body: {
  feature: 'marketplace',
  enabled: true
}
```

## Related Features

- [Notifications](./notifications.md) - Notification system
- [Admin Dashboard](../frontend/admin-routes.md#system-settings)

