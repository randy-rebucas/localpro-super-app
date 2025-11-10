# User Settings API Endpoints

## Overview

The User Settings API provides comprehensive endpoints for managing user preferences and application settings. The API supports both user-specific settings and global application configuration managed by administrators.

## Base URL

```
/api/settings
```

## Authentication

Most endpoints require authentication via Bearer token:

```http
Authorization: Bearer <jwt_token>
```

Admin-only endpoints require admin role in addition to authentication.

## User Settings Endpoints

### Get User Settings

Retrieve the current user's settings.

```http
GET /api/settings/user
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
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
    },
    "createdAt": "2023-07-20T10:30:00.000Z",
    "updatedAt": "2023-07-20T10:30:00.000Z"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Failed to get user settings",
  "error": "Error message"
}
```

### Update User Settings

Update the current user's settings.

```http
PUT /api/settings/user
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "privacy": {
    "profileVisibility": "public",
    "showPhoneNumber": false,
    "allowDirectMessages": true
  },
  "notifications": {
    "push": {
      "enabled": true,
      "marketing": false
    },
    "email": {
      "weeklyDigest": true
    }
  },
  "communication": {
    "preferredLanguage": "en",
    "timezone": "Asia/Manila"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User settings updated successfully",
  "data": {
    // Updated settings object
  }
}
```

**Validation Errors:**
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "privacy.profileVisibility",
      "message": "Profile visibility must be one of: public, contacts_only, private"
    }
  ]
}
```

### Update Specific Setting Category

Update a specific category of user settings.

```http
PUT /api/settings/user/:category
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters:**
- `category` (string): Category name (privacy, notifications, communication, service, payment, security, app, analytics)

**Request Body:**
```json
{
  "profileVisibility": "public",
  "showPhoneNumber": false,
  "allowDirectMessages": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "privacy settings updated successfully",
  "data": {
    "profileVisibility": "public",
    "showPhoneNumber": false,
    "showEmail": false,
    "showLocation": true,
    "showRating": true,
    "showPortfolio": true,
    "allowDirectMessages": true,
    "allowJobInvitations": true,
    "allowReferralRequests": true
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Invalid category: invalid_category"
}
```

### Reset User Settings

Reset user settings to default values.

```http
POST /api/settings/user/reset
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User settings reset to defaults successfully",
  "data": {
    // Default settings object
  }
}
```

### Delete User Settings

Delete the current user's settings.

```http
DELETE /api/settings/user
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User settings deleted successfully"
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "User settings not found"
}
```

## App Settings Endpoints (Admin Only)

### Get App Settings

Retrieve global application settings (admin only).

```http
GET /api/settings/app
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "general": {
      "appName": "LocalPro Super App",
      "appVersion": "1.0.0",
      "environment": "production",
      "maintenanceMode": {
        "enabled": false,
        "message": "The app is currently under maintenance. Please try again later.",
        "estimatedEndTime": null
      },
      "forceUpdate": {
        "enabled": false,
        "minVersion": "1.0.0",
        "message": "Please update to the latest version to continue using the app."
      }
    },
    "business": {
      "companyName": "LocalPro Super App",
      "companyEmail": "support@localpro.com",
      "companyPhone": "+63-XXX-XXX-XXXX",
      "companyAddress": {
        "street": "123 Business Street",
        "city": "Manila",
        "state": "Metro Manila",
        "zipCode": "1000",
        "country": "Philippines"
      },
      "businessHours": {
        "timezone": "Asia/Manila",
        "schedule": [
          {
            "day": "monday",
            "startTime": "09:00",
            "endTime": "17:00",
            "isOpen": true
          }
        ]
      },
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
            "end": "17:00"
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
      },
      "payments": {
        "paypal": {
          "enabled": true
        },
        "paymaya": {
          "enabled": true
        },
        "gcash": {
          "enabled": true
        },
        "bankTransfer": {
          "enabled": true
        }
      },
      "analytics": {
        "enabled": true,
        "trackUserBehavior": true,
        "trackPerformance": true
      }
    },
    "security": {
      "passwordPolicy": {
        "minLength": 8,
        "requireUppercase": true,
        "requireLowercase": true,
        "requireNumbers": true,
        "requireSpecialChars": true,
        "maxLoginAttempts": 5,
        "lockoutDuration": 15
      },
      "sessionSettings": {
        "maxSessionDuration": 24,
        "allowMultipleSessions": true,
        "maxConcurrentSessions": 3
      },
      "dataProtection": {
        "encryptSensitiveData": true,
        "dataRetentionPeriod": 365,
        "allowDataExport": true,
        "allowDataDeletion": true
      }
    },
    "uploads": {
      "maxFileSize": 10485760,
      "allowedImageTypes": ["image/jpeg", "image/png", "image/gif", "image/webp"],
      "allowedDocumentTypes": ["application/pdf", "application/msword"],
      "maxImagesPerUpload": 10,
      "imageCompression": {
        "enabled": true,
        "quality": 80
      }
    },
    "notifications": {
      "email": {
        "enabled": true,
        "provider": "nodemailer",
        "fromEmail": "noreply@localpro.com",
        "fromName": "LocalPro Super App"
      },
      "sms": {
        "enabled": true,
        "provider": "twilio",
        "fromNumber": "+1234567890"
      },
      "push": {
        "enabled": true,
        "provider": "firebase"
      }
    },
    "payments": {
      "defaultCurrency": "PHP",
      "supportedCurrencies": ["PHP", "USD", "EUR"],
      "transactionFees": {
        "percentage": 2.9,
        "fixed": 0.30
      },
      "minimumPayout": 100,
      "payoutSchedule": {
        "frequency": "weekly",
        "dayOfWeek": 1,
        "dayOfMonth": 1
      }
    },
    "analytics": {
      "googleAnalytics": {
        "enabled": false,
        "trackingId": null
      },
      "mixpanel": {
        "enabled": false,
        "projectToken": null
      },
      "customAnalytics": {
        "enabled": true,
        "retentionPeriod": 365
      }
    },
    "integrations": {
      "googleMaps": {
        "enabled": true,
        "apiKey": "AIzaSyB...",
        "defaultZoom": 13
      },
      "cloudinary": {
        "enabled": true,
        "cloudName": "localpro",
        "apiKey": "123456789012345",
        "apiSecret": "abcdefghijklmnop"
      },
      "socialLogin": {
        "google": {
          "enabled": false,
          "clientId": null
        },
        "facebook": {
          "enabled": false,
          "appId": null
        }
      }
    },
    "createdAt": "2023-07-20T10:30:00.000Z",
    "updatedAt": "2023-07-20T10:30:00.000Z"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### Update App Settings

Update global application settings (admin only).

```http
PUT /api/settings/app
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "general": {
    "appName": "LocalPro Super App",
    "maintenanceMode": {
      "enabled": false,
      "message": "The app is currently under maintenance. Please try again later."
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

**Response:**
```json
{
  "success": true,
  "message": "App settings updated successfully",
  "data": {
    // Updated settings object
  }
}
```

### Update Specific App Setting Category

Update a specific category of app settings (admin only).

```http
PUT /api/settings/app/:category
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Path Parameters:**
- `category` (string): Category name (general, business, features, security, uploads, notifications, payments, analytics, integrations)

**Request Body:**
```json
{
  "enabled": true,
  "allowNewProviders": true,
  "requireVerification": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "features settings updated successfully",
  "data": {
    "marketplace": {
      "enabled": true,
      "allowNewProviders": true,
      "requireVerification": true
    },
    "academy": {
      "enabled": true,
      "allowNewCourses": true,
      "requireInstructorVerification": true
    }
  }
}
```

### Toggle Feature Flag

Toggle a specific feature flag (admin only).

```http
POST /api/settings/app/features/toggle
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "feature": "marketplace.enabled",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feature marketplace.enabled enabled successfully",
  "data": {
    "feature": "marketplace.enabled",
    "enabled": true
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Enabled must be a boolean value"
}
```

## Public Endpoints

### Get Public App Settings

Retrieve public application settings (no authentication required).

```http
GET /api/settings
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
      }
    },
    "uploads": {
      "maxFileSize": 10485760,
      "allowedImageTypes": ["image/jpeg", "image/png", "image/gif", "image/webp"],
      "allowedDocumentTypes": ["application/pdf", "application/msword"],
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

### Get App Health Status

Retrieve application health status (no authentication required).

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
    "environment": "production",
    "maintenanceMode": {
      "enabled": false,
      "message": "The app is currently under maintenance. Please try again later."
    },
    "features": {
      "marketplace": true,
      "academy": true,
      "jobBoard": true,
      "referrals": true,
      "payments": true,
      "analytics": true
    },
    "timestamp": "2023-07-20T10:30:00.000Z"
  }
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "privacy.profileVisibility",
      "message": "Profile visibility must be one of: public, contacts_only, private"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "User settings not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to update user settings",
  "error": "Database connection error"
}
```

## Rate Limiting

- **User Settings**: 100 requests per hour per user
- **App Settings**: 50 requests per hour per admin
- **Public Endpoints**: 1000 requests per hour per IP

## Validation Rules

### User Settings Validation

- **Privacy Settings**: Profile visibility must be one of the allowed values
- **Notification Settings**: All boolean fields for notification preferences
- **Communication Settings**: Language must be supported, timezone must be valid
- **Service Settings**: Radius must be between 1-100, job values must be non-negative
- **Payment Settings**: Payment method must be supported, frequency must be valid
- **Security Settings**: Session timeout must be between 1-168 hours
- **App Settings**: Theme and font size must be valid options

### App Settings Validation

- **General Settings**: Environment must be valid, version must be string
- **Business Settings**: Email must be valid format, phone must be string
- **Feature Flags**: All feature toggles must be boolean
- **Security Settings**: Password policy limits must be within allowed ranges
- **Upload Settings**: File sizes must be within limits, types must be supported
- **Payment Settings**: Currencies must be supported, fees must be non-negative

## Pagination

Not applicable for settings endpoints as they return single objects.

## Filtering and Sorting

Not applicable for settings endpoints as they return single objects.

## Examples

### Complete User Settings Update

```javascript
const updateUserSettings = async (settings) => {
  const response = await fetch('/api/settings/user', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settings)
  });
  
  return await response.json();
};

// Example usage
const settings = {
  privacy: {
    profileVisibility: 'public',
    showPhoneNumber: false,
    allowDirectMessages: true
  },
  notifications: {
    push: {
      enabled: true,
      marketing: false
    },
    email: {
      weeklyDigest: true
    }
  },
  communication: {
    preferredLanguage: 'en',
    timezone: 'Asia/Manila'
  }
};

const result = await updateUserSettings(settings);
```

### Category-Specific Update

```javascript
const updateNotificationSettings = async (notifications) => {
  const response = await fetch('/api/settings/user/notifications', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(notifications)
  });
  
  return await response.json();
};

// Example usage
const notifications = {
  push: {
    enabled: true,
    newMessages: true,
    marketing: false
  },
  email: {
    enabled: true,
    weeklyDigest: true
  },
  sms: {
    enabled: false
  }
};

const result = await updateNotificationSettings(notifications);
```

### Admin Feature Toggle

```javascript
const toggleFeature = async (feature, enabled) => {
  const response = await fetch('/api/settings/app/features/toggle', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ feature, enabled })
  });
  
  return await response.json();
};

// Example usage
const result = await toggleFeature('marketplace.enabled', true);
```
