# User Settings Feature

## Overview

The User Settings feature provides comprehensive personalization and configuration management for users of the LocalPro Super App. This feature allows users to customize their experience, manage privacy preferences, configure notifications, and set up their service preferences.

## Quick Links

- Data Entities: [data-entities.md](./data-entities.md) - Detailed schema documentation
- API Endpoints: [api-endpoints.md](./api-endpoints.md) - Complete API reference
- Usage Examples: [usage-examples.md](./usage-examples.md) - Practical implementation examples
- Best Practices: [best-practices.md](./best-practices.md) - Development guidelines

## Key Features

- **Privacy Controls**: Manage profile visibility and data sharing preferences
- **Notification Management**: Configure push, email, and SMS notifications
- **Communication Preferences**: Set language, timezone, and formatting options
- **Service Configuration**: Customize service radius, job preferences, and working hours
- **Payment Settings**: Configure payment methods and auto-withdrawal preferences
- **Security Settings**: Manage two-factor authentication and login alerts
- **App Customization**: Theme, accessibility, and data usage preferences
- **Analytics Controls**: Manage data sharing and personalization settings

## Documentation Structure

This feature documentation is organized into the following sections:

- **[Data Entities](data-entities.md)** - Detailed schema documentation for UserSettings and AppSettings models
- **[API Endpoints](api-endpoints.md)** - Complete API reference with request/response examples
- **[Usage Examples](usage-examples.md)** - Practical implementation examples and code snippets
- **[Best Practices](best-practices.md)** - Development guidelines and recommended patterns

## Quick Start

### Get User Settings
```javascript
const response = await fetch('/api/settings/user', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const settings = await response.json();
```

### Update Privacy Settings
```javascript
const response = await fetch('/api/settings/user/privacy', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    profileVisibility: 'public',
    showPhoneNumber: false,
    allowDirectMessages: true
  })
});
```

### Update Notification Preferences
```javascript
const response = await fetch('/api/settings/user/notifications', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    push: {
      enabled: true,
      newMessages: true,
      marketing: false
    },
    email: {
      enabled: true,
      weeklyDigest: true
    }
  })
});
```

## Data Models

### UserSettings
The main user settings model containing all personalization preferences:

- **Privacy Settings**: Profile visibility, contact information display
- **Notification Settings**: Push, email, and SMS notification preferences
- **Communication Settings**: Language, timezone, currency, auto-reply
- **Service Settings**: Service radius, job preferences, working hours
- **Payment Settings**: Payment methods, auto-withdrawal, invoice settings
- **Security Settings**: Two-factor auth, login alerts, session timeout
- **App Settings**: Theme, accessibility, data usage preferences
- **Analytics Settings**: Data sharing and personalization controls

### AppSettings
Global application settings managed by administrators:

- **General Settings**: App name, version, maintenance mode
- **Business Settings**: Company information, support channels
- **Feature Flags**: Enable/disable app features
- **Security Settings**: Password policies, session management
- **Upload Settings**: File size limits, allowed types
- **Payment Settings**: Transaction fees, payout schedules
- **Integration Settings**: Third-party service configurations

## API Endpoints

### User Settings
- `GET /api/settings/user` - Get user settings
- `PUT /api/settings/user` - Update user settings
- `PUT /api/settings/user/:category` - Update specific category
- `POST /api/settings/user/reset` - Reset to defaults
- `DELETE /api/settings/user` - Delete user settings

### App Settings (Admin Only)
- `GET /api/settings/app` - Get app settings
- `PUT /api/settings/app` - Update app settings
- `PUT /api/settings/app/:category` - Update specific category
- `POST /api/settings/app/features/toggle` - Toggle feature flag

### Public Endpoints
- `GET /api/settings` - Get public app settings
- `GET /api/settings/app/public` - Get public app settings
- `GET /api/settings/app/health` - Get app health status

## Key Benefits

1. **Personalization**: Users can customize their experience to match their preferences
2. **Privacy Control**: Granular control over what information is shared
3. **Notification Management**: Users control how and when they receive notifications
4. **Service Optimization**: Configure service preferences for better job matching
5. **Security**: Enhanced security settings and authentication options
6. **Accessibility**: Customizable app appearance and behavior
7. **Admin Control**: Comprehensive app configuration management

## Integration Points

- **User Management**: Settings are linked to user accounts
- **Notification System**: Settings control notification delivery
- **Service Matching**: Service preferences affect job recommendations
- **Payment Processing**: Payment settings control transaction handling
- **Analytics**: Settings control data collection and personalization

## Getting Started

1. Review the [Data Entities](data-entities.md) documentation to understand the data structure
2. Check the [API Endpoints](api-endpoints.md) for available operations
3. Use the [Usage Examples](usage-examples.md) for implementation guidance
4. Follow the [Best Practices](best-practices.md) for optimal implementation

For more detailed information, explore the individual documentation files in this directory.
