# Settings API Documentation

## Overview

The Settings API provides comprehensive user and application settings management for the LocalPro Super App. It includes both user-specific settings and global application settings that can be managed by administrators.

## Features

- **User Settings**: Personal preferences, privacy controls, notification settings, and app customization
- **App Settings**: Global application configuration, feature flags, and business settings
- **Category-based Updates**: Update specific setting categories without affecting others
- **Validation**: Comprehensive input validation for all settings
- **Admin Controls**: Administrative functions for managing global app settings
- **Public Endpoints**: Access to public app information without authentication

## API Endpoints

### User Settings

#### Get User Settings
```http
GET /api/settings/user
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "settings_id",
    "userId": "user_id",
    "privacy": {
      "profileVisibility": "public",
      "showPhoneNumber": false,
      "showEmail": false,
      "showLocation": true,
      "showRating": true,
      "showPortfolio": true,
      "allowDirectMessages": true,
      "allowJobInvitations": true,
      "allowReferralRequests": true
    },
    "notifications": {
      "push": {
        "enabled": true,
        "newMessages": true,
        "jobMatches": true,
        "bookingUpdates": true,
        "paymentUpdates": true,
        "referralUpdates": true,
        "systemUpdates": true,
        "marketing": false
      },
      "email": {
        "enabled": true,
        "newMessages": true,
        "jobMatches": true,
        "bookingUpdates": true,
        "paymentUpdates": true,
        "referralUpdates": true,
        "systemUpdates": true,
        "marketing": false,
        "weeklyDigest": true,
        "monthlyReport": true
      },
      "sms": {
        "enabled": true,
        "urgentMessages": true,
        "bookingReminders": true,
        "paymentAlerts": true,
        "securityAlerts": true
      }
    },
    "communication": {
      "preferredLanguage": "en",
      "timezone": "Asia/Manila",
      "dateFormat": "MM/DD/YYYY",
      "timeFormat": "12h",
      "currency": "PHP",
      "autoReply": {
        "enabled": false,
        "message": "Thank you for your message. I will get back to you soon."
      }
    },
    "service": {
      "defaultServiceRadius": 25,
      "autoAcceptJobs": false,
      "minimumJobValue": 0,
      "maximumJobValue": 100000,
      "preferredJobTypes": [],
      "workingHours": {
        "start": "08:00",
        "end": "17:00",
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
      },
      "emergencyService": {
        "enabled": false,
        "surcharge": 0
      }
    },
    "payment": {
      "preferredPaymentMethod": "paypal",
      "autoWithdraw": {
        "enabled": false,
        "threshold": 1000,
        "frequency": "weekly"
      },
      "invoiceSettings": {
        "includeTax": true,
        "taxRate": 12,
        "invoiceTemplate": "standard"
      }
    },
    "security": {
      "twoFactorAuth": {
        "enabled": false,
        "method": "sms"
      },
      "loginAlerts": {
        "enabled": true,
        "newDevice": true,
        "suspiciousActivity": true
      },
      "sessionTimeout": 24,
      "passwordChangeReminder": {
        "enabled": true,
        "frequency": 90
      }
    },
    "app": {
      "theme": "auto",
      "fontSize": "medium",
      "soundEffects": {
        "enabled": true,
        "volume": 50
      },
      "hapticFeedback": {
        "enabled": true
      },
      "autoSave": {
        "enabled": true,
        "interval": 30
      },
      "dataUsage": {
        "imageQuality": "medium",
        "videoQuality": "medium",
        "autoDownload": false
      }
    },
    "analytics": {
      "shareUsageData": true,
      "shareLocationData": true,
      "sharePerformanceData": true,
      "personalizedRecommendations": true
    }
  }
}
```

#### Update User Settings
```http
PUT /api/settings/user
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "privacy": {
    "profileVisibility": "contacts_only",
    "showPhoneNumber": false
  },
  "notifications": {
    "push": {
      "enabled": true,
      "marketing": false
    }
  }
}
```

#### Update Specific Category
```http
PUT /api/settings/user/{category}
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "profileVisibility": "private",
  "allowDirectMessages": false
}
```

**Available Categories:**
- `privacy`
- `notifications`
- `communication`
- `service`
- `payment`
- `security`
- `app`
- `analytics`

#### Reset User Settings
```http
POST /api/settings/user/reset
Authorization: Bearer <user_token>
```

#### Delete User Settings
```http
DELETE /api/settings/user
Authorization: Bearer <user_token>
```

### App Settings (Admin Only)

#### Get App Settings
```http
GET /api/settings/app
Authorization: Bearer <admin_token>
```

#### Update App Settings
```http
PUT /api/settings/app
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "general": {
    "maintenanceMode": {
      "enabled": true,
      "message": "Scheduled maintenance in progress"
    }
  },
  "features": {
    "marketplace": {
      "enabled": true,
      "allowNewProviders": true
    }
  }
}
```

#### Update Specific Category
```http
PUT /api/settings/app/{category}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "enabled": true,
  "allowNewProviders": true
}
```

**Available Categories:**
- `general`
- `business`
- `features`
- `security`
- `uploads`
- `payments`
- `rateLimiting`
- `notifications`
- `integrations`

#### Toggle Feature Flag
```http
POST /api/settings/app/features/toggle
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "feature": "marketplace",
  "enabled": false
}
```

### Public Endpoints

#### Get Public App Settings
```http
GET /api/settings/app/public
```

**Response:**
```json
{
  "success": true,
  "data": {
    "general": {
      "appName": "LocalPro Super App",
      "appVersion": "1.0.0",
      "maintenanceMode": {
        "enabled": false,
        "message": "The app is currently under maintenance. Please try again later."
      }
    },
    "business": {
      "companyName": "LocalPro Super App",
      "supportChannels": {
        "email": {
          "enabled": true,
          "address": "support@localpro.com"
        },
        "phone": {
          "enabled": true,
          "number": "+63-XXX-XXX-XXXX"
        },
        "chat": {
          "enabled": true,
          "hours": {
            "start": "09:00",
            "end": "18:00"
          }
        }
      }
    },
    "features": {
      "marketplace": {
        "enabled": true,
        "allowNewProviders": true,
        "requireVerification": true
      },
      "academy": {
        "enabled": true,
        "allowNewCourses": true,
        "requireInstructorVerification": true
      },
      "jobBoard": {
        "enabled": true,
        "allowNewJobs": true,
        "requireCompanyVerification": true
      },
      "referrals": {
        "enabled": true,
        "rewardAmount": 100,
        "maxReferralsPerUser": 50
      }
    },
    "uploads": {
      "maxFileSize": 10485760,
      "allowedImageTypes": ["image/jpeg", "image/png", "image/gif", "image/webp"],
      "allowedDocumentTypes": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      "maxImagesPerUpload": 10
    },
    "payments": {
      "defaultCurrency": "PHP",
      "supportedCurrencies": ["PHP", "USD", "EUR"],
      "minimumPayout": 100
    }
  }
}
```

#### Get App Health
```http
GET /api/settings/app/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "environment": "development",
    "maintenanceMode": {
      "enabled": false,
      "message": "The app is currently under maintenance. Please try again later."
    },
    "features": {
      "marketplace": true,
      "academy": true,
      "jobBoard": true,
      "referrals": true
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Setting Categories

### User Settings Categories

#### Privacy Settings
- `profileVisibility`: Profile visibility level (public, contacts_only, private)
- `showPhoneNumber`: Whether to show phone number publicly
- `showEmail`: Whether to show email publicly
- `showLocation`: Whether to show location publicly
- `showRating`: Whether to show rating publicly
- `showPortfolio`: Whether to show portfolio publicly
- `allowDirectMessages`: Whether to allow direct messages
- `allowJobInvitations`: Whether to allow job invitations
- `allowReferralRequests`: Whether to allow referral requests

#### Notification Settings
- **Push Notifications**: Control push notification preferences
- **Email Notifications**: Control email notification preferences
- **SMS Notifications**: Control SMS notification preferences

#### Communication Settings
- `preferredLanguage`: User's preferred language
- `timezone`: User's timezone
- `dateFormat`: Preferred date format
- `timeFormat`: Preferred time format (12h/24h)
- `currency`: Preferred currency
- `autoReply`: Auto-reply settings for messages

#### Service Settings
- `defaultServiceRadius`: Default service radius in kilometers
- `autoAcceptJobs`: Whether to automatically accept jobs
- `minimumJobValue`: Minimum job value to accept
- `maximumJobValue`: Maximum job value to accept
- `preferredJobTypes`: Array of preferred job types
- `workingHours`: Working hours configuration
- `emergencyService`: Emergency service settings

#### Payment Settings
- `preferredPaymentMethod`: Preferred payment method
- `autoWithdraw`: Auto-withdrawal settings
- `invoiceSettings`: Invoice generation settings

#### Security Settings
- `twoFactorAuth`: Two-factor authentication settings
- `loginAlerts`: Login alert preferences
- `sessionTimeout`: Session timeout duration
- `passwordChangeReminder`: Password change reminder settings

#### App Settings
- `theme`: App theme preference (light, dark, auto)
- `fontSize`: Font size preference
- `soundEffects`: Sound effects settings
- `hapticFeedback`: Haptic feedback settings
- `autoSave`: Auto-save settings
- `dataUsage`: Data usage preferences

#### Analytics Settings
- `shareUsageData`: Whether to share usage data
- `shareLocationData`: Whether to share location data
- `sharePerformanceData`: Whether to share performance data
- `personalizedRecommendations`: Whether to enable personalized recommendations

### App Settings Categories

#### General Settings
- `appName`: Application name
- `appVersion`: Application version
- `environment`: Environment (development, staging, production)
- `maintenanceMode`: Maintenance mode settings
- `forceUpdate`: Force update settings

#### Business Settings
- `companyName`: Company name
- `companyEmail`: Company email
- `companyPhone`: Company phone
- `companyAddress`: Company address
- `businessHours`: Business hours configuration
- `supportChannels`: Support channel settings

#### Feature Flags
- `marketplace`: Marketplace feature settings
- `academy`: Academy feature settings
- `jobBoard`: Job board feature settings
- `referrals`: Referral system settings
- `payments`: Payment method settings
- `analytics`: Analytics feature settings

#### Security Settings
- `passwordPolicy`: Password policy configuration
- `sessionSettings`: Session management settings
- `dataProtection`: Data protection settings

#### Rate Limiting Settings
- `api`: API rate limiting settings
- `auth`: Authentication rate limiting settings
- `upload`: Upload rate limiting settings

#### Upload Settings
- `maxFileSize`: Maximum file size allowed
- `allowedImageTypes`: Allowed image file types
- `allowedDocumentTypes`: Allowed document file types
- `maxImagesPerUpload`: Maximum images per upload
- `imageCompression`: Image compression settings

#### Payment Settings
- `defaultCurrency`: Default currency
- `supportedCurrencies`: Supported currencies
- `transactionFees`: Transaction fee settings
- `minimumPayout`: Minimum payout amount
- `payoutSchedule`: Payout schedule settings

#### Analytics Settings
- `googleAnalytics`: Google Analytics integration
- `mixpanel`: Mixpanel integration
- `customAnalytics`: Custom analytics settings

#### Integration Settings
- `googleMaps`: Google Maps integration
- `cloudinary`: Cloudinary integration
- `socialLogin`: Social login integrations

## Validation Rules

### User Settings Validation
- `profileVisibility`: Must be one of ['public', 'contacts_only', 'private']
- `preferredLanguage`: Must be one of ['en', 'fil', 'es', 'zh', 'ja', 'ko']
- `dateFormat`: Must be one of ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
- `timeFormat`: Must be one of ['12h', '24h']
- `currency`: Must be one of ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY']
- `defaultServiceRadius`: Must be between 1 and 100
- `minimumJobValue`: Must be >= 0
- `maximumJobValue`: Must be >= 0
- `preferredJobTypes`: Array of valid job types
- `workingHours.start/end`: Must match HH:MM format
- `workingHours.days`: Array of valid day names
- `theme`: Must be one of ['light', 'dark', 'auto']
- `fontSize`: Must be one of ['small', 'medium', 'large']
- `soundEffects.volume`: Must be between 0 and 100
- `autoSave.interval`: Must be between 10 and 300 seconds
- `imageQuality`: Must be one of ['low', 'medium', 'high']
- `videoQuality`: Must be one of ['low', 'medium', 'high']

### App Settings Validation
- `environment`: Must be one of ['development', 'staging', 'production']
- `passwordPolicy.minLength`: Must be between 6 and 20
- `passwordPolicy.maxLoginAttempts`: Must be between 3 and 10
- `passwordPolicy.lockoutDuration`: Must be between 5 and 60 minutes
- `maxFileSize`: Must be between 1MB and 100MB
- `maxImagesPerUpload`: Must be between 1 and 50
- `imageCompression.quality`: Must be between 10 and 100
- `transactionFees.percentage`: Must be between 0 and 10
- `transactionFees.fixed`: Must be between 0 and 10
- `minimumPayout`: Must be >= 0
- `payoutSchedule.frequency`: Must be one of ['daily', 'weekly', 'monthly']
- `payoutSchedule.dayOfWeek`: Must be between 0 and 6
- `payoutSchedule.dayOfMonth`: Must be between 1 and 31

## Error Responses

### Validation Errors
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "msg": "Invalid value",
      "param": "privacy.profileVisibility",
      "value": "invalid_value",
      "location": "body"
    }
  ]
}
```

### Authorization Errors
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### Not Found Errors
```json
{
  "success": false,
  "message": "User settings not found"
}
```

### Server Errors
```json
{
  "success": false,
  "message": "Failed to update user settings",
  "error": "Database connection error"
}
```

## Usage Examples

### Frontend Integration

#### React Hook Example
```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const useUserSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates) => {
    try {
      const response = await axios.put('/api/settings/user', updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
      throw err;
    }
  };

  const updateCategory = async (category, updates) => {
    try {
      const response = await axios.put(`/api/settings/user/${category}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(prev => ({ ...prev, [category]: response.data.data }));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update category');
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, error, updateSettings, updateCategory, refetch: fetchSettings };
};
```

#### Settings Component Example
```javascript
import React from 'react';
import { useUserSettings } from './hooks/useUserSettings';

const SettingsPage = () => {
  const { settings, loading, error, updateCategory } = useUserSettings();

  const handleNotificationChange = async (updates) => {
    try {
      await updateCategory('notifications', updates);
    } catch (err) {
      console.error('Failed to update notifications:', err);
    }
  };

  const handlePrivacyChange = async (updates) => {
    try {
      await updateCategory('privacy', updates);
    } catch (err) {
      console.error('Failed to update privacy:', err);
    }
  };

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      <section className="privacy-settings">
        <h2>Privacy</h2>
        <label>
          <input
            type="checkbox"
            checked={settings.privacy.showPhoneNumber}
            onChange={(e) => handlePrivacyChange({ showPhoneNumber: e.target.checked })}
          />
          Show phone number
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.privacy.allowDirectMessages}
            onChange={(e) => handlePrivacyChange({ allowDirectMessages: e.target.checked })}
          />
          Allow direct messages
        </label>
      </section>

      <section className="notification-settings">
        <h2>Notifications</h2>
        <label>
          <input
            type="checkbox"
            checked={settings.notifications.push.enabled}
            onChange={(e) => handleNotificationChange({ 
              push: { ...settings.notifications.push, enabled: e.target.checked }
            })}
          />
          Enable push notifications
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.notifications.email.weeklyDigest}
            onChange={(e) => handleNotificationChange({ 
              email: { ...settings.notifications.email, weeklyDigest: e.target.checked }
            })}
          />
          Weekly digest email
        </label>
      </section>
    </div>
  );
};
```

## Testing

Use the provided test file `test-settings-api.js` to test the API endpoints:

```bash
node test-settings-api.js
```

Make sure to:
1. Replace the test tokens with actual JWT tokens
2. Ensure the server is running on the correct port
3. Have proper database connection

## Security Considerations

1. **Authentication**: All user settings endpoints require valid JWT tokens
2. **Authorization**: App settings endpoints require admin privileges
3. **Validation**: All inputs are validated before processing
4. **Rate Limiting**: API endpoints are protected by rate limiting
5. **Data Privacy**: Sensitive settings are properly encrypted
6. **Access Control**: Users can only access their own settings

## Performance Considerations

1. **Indexing**: Database indexes are created for optimal query performance
2. **Caching**: Consider implementing Redis caching for frequently accessed settings
3. **Batch Updates**: Use category-based updates to minimize database operations
4. **Lazy Loading**: Load settings only when needed
5. **Compression**: Compress large setting objects when transmitting

## Future Enhancements

1. **Settings Templates**: Pre-defined setting templates for different user types
2. **Settings Import/Export**: Allow users to backup and restore settings
3. **Settings History**: Track changes to settings over time
4. **Bulk Operations**: Update multiple users' settings simultaneously
5. **Settings Analytics**: Track which settings are most commonly changed
6. **Conditional Settings**: Settings that depend on other settings or user roles
7. **Settings Migration**: Automatic migration of settings when app updates
8. **Settings Validation**: More sophisticated validation rules
9. **Settings Documentation**: In-app help for each setting
10. **Settings Search**: Search functionality for settings
