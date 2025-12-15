# App Settings Complete Payload Documentation

## API Endpoints

- **GET** `/api/settings` - Get current app settings
- **PUT** `/api/settings` - Update all app settings (Admin only)
- **PUT** `/api/settings/category/:category` - Update specific category (Admin only)
- **PUT** `/api/settings/feature/:featureName/toggle` - Toggle a feature flag (Admin only)

---

## Complete Payload Structure

### Full Update Payload (PUT /api/settings)

```json
{
  "general": {
    "appName": "LocalPro Super App",
    "appVersion": "1.0.0",
    "environment": "development",
    "maintenanceMode": {
      "enabled": false,
      "message": "The app is currently under maintenance. Please try again later.",
      "estimatedEndTime": "2025-12-01T00:00:00.000Z"
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
      "street": "123 Main Street",
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
          "endTime": "18:00",
          "isOpen": true
        },
        {
          "day": "tuesday",
          "startTime": "09:00",
          "endTime": "18:00",
          "isOpen": true
        },
        {
          "day": "wednesday",
          "startTime": "09:00",
          "endTime": "18:00",
          "isOpen": true
        },
        {
          "day": "thursday",
          "startTime": "09:00",
          "endTime": "18:00",
          "isOpen": true
        },
        {
          "day": "friday",
          "startTime": "09:00",
          "endTime": "18:00",
          "isOpen": true
        },
        {
          "day": "saturday",
          "startTime": "09:00",
          "endTime": "17:00",
          "isOpen": true
        },
        {
          "day": "sunday",
          "startTime": "10:00",
          "endTime": "16:00",
          "isOpen": false
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
          "end": "18:00"
        }
      }
    }
  },
  "features": {
    "marketplace": {
      "enabled": true,
      "allowNewProviders": true,
      "requireVerification": true,
      "description": "Connect with service providers and customers",
      "icon": "Shield",
      "color": "bg-gray-100 text-gray-700",
      "services": ["Cleaning", "Plumbing", "Electrical", "Moving"],
      "route": "/marketplace",
      "category": "Services",
      "users": 1250,
      "lastUpdated": "2 hours ago",
      "featured": true
    },
    "academy": {
      "enabled": true,
      "allowNewCourses": true,
      "requireInstructorVerification": true,
      "description": null,
      "icon": null,
      "color": null,
      "services": null,
      "route": null,
      "category": null,
      "users": null,
      "lastUpdated": null,
      "featured": false
    },
    "jobBoard": {
      "enabled": true,
      "allowNewJobs": true,
      "requireCompanyVerification": true,
      "description": null,
      "icon": null,
      "color": null,
      "services": null,
      "route": null,
      "category": null,
      "users": null,
      "lastUpdated": null,
      "featured": false
    },
    "referrals": {
      "enabled": true,
      "rewardAmount": 100,
      "maxReferralsPerUser": 50,
      "description": null,
      "icon": null,
      "color": null,
      "services": null,
      "route": null,
      "category": null,
      "users": null,
      "lastUpdated": null,
      "featured": false
    },
    "ads": {
      "enabled": true,
      "allowNewAds": true,
      "requireApproval": true,
      "allowPromotion": true,
      "description": null,
      "icon": null,
      "color": null,
      "services": null,
      "route": null,
      "category": null,
      "users": null,
      "lastUpdated": null,
      "featured": false
    },
    "facilityCare": {
      "enabled": true,
      "allowNewServices": true,
      "allowContracts": true,
      "allowSubscriptions": true,
      "description": null,
      "icon": null,
      "color": null,
      "services": null,
      "route": null,
      "category": null,
      "users": null,
      "lastUpdated": null,
      "featured": false
    },
    "finance": {
      "enabled": true,
      "allowWithdrawals": true,
      "allowLoans": true,
      "allowSalaryAdvance": true,
      "minimumWithdrawal": 100,
      "description": null,
      "icon": null,
      "color": null,
      "services": null,
      "route": null,
      "category": null,
      "users": null,
      "lastUpdated": null,
      "featured": false
    },
    "supplies": {
      "enabled": true,
      "allowNewProducts": true,
      "allowOrders": true,
      "allowSubscriptions": true,
      "requireSupplierVerification": true,
      "description": null,
      "icon": null,
      "color": null,
      "services": null,
      "route": null,
      "category": null,
      "users": null,
      "lastUpdated": null,
      "featured": false
    },
    "localProPlus": {
      "enabled": true,
      "allowSubscriptions": true,
      "allowUpgrades": true,
      "plans": {
        "basic": {
          "enabled": true,
          "price": 0
        },
        "premium": {
          "enabled": true,
          "price": 299
        },
        "enterprise": {
          "enabled": true,
          "price": 999
        }
      },
      "description": null,
      "icon": null,
      "color": null,
      "services": null,
      "route": null,
      "category": null,
      "users": null,
      "lastUpdated": null,
      "featured": false
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
      },
      "description": null,
      "icon": null,
      "color": null,
      "services": null,
      "route": null,
      "category": null,
      "users": null,
      "lastUpdated": null,
      "featured": false
    },
    "analytics": {
      "enabled": true,
      "trackUserBehavior": true,
      "trackPerformance": true,
      "description": null,
      "icon": null,
      "color": null,
      "services": null,
      "route": null,
      "category": null,
      "users": null,
      "lastUpdated": null,
      "featured": false
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
    "allowedImageTypes": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp"
    ],
    "allowedDocumentTypes": [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
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
      "trackingId": "UA-XXXXXXXXX-X"
    },
    "mixpanel": {
      "enabled": false,
      "projectToken": "your-mixpanel-token"
    },
    "customAnalytics": {
      "enabled": true,
      "retentionPeriod": 365
    }
  },
  "integrations": {
    "googleMaps": {
      "enabled": true,
      "apiKey": "your-google-maps-api-key",
      "defaultZoom": 13
    },
    "cloudinary": {
      "enabled": true,
      "cloudName": "your-cloud-name",
      "apiKey": "your-api-key",
      "apiSecret": "your-api-secret"
    },
    "socialLogin": {
      "google": {
        "enabled": false,
        "clientId": "your-google-client-id"
      },
      "facebook": {
        "enabled": false,
        "appId": "your-facebook-app-id"
      }
    }
  }
}
```

---

## Category-Specific Updates

### Update General Settings (PUT /api/settings/category/general)

```json
{
  "appName": "LocalPro Super App",
  "appVersion": "1.0.0",
  "environment": "production",
  "maintenanceMode": {
    "enabled": false,
    "message": "The app is currently under maintenance.",
    "estimatedEndTime": "2025-12-01T00:00:00.000Z"
  },
  "forceUpdate": {
    "enabled": false,
    "minVersion": "1.0.0",
    "message": "Please update to the latest version."
  }
}
```

### Update Business Settings (PUT /api/settings/category/business)

```json
{
  "companyName": "LocalPro Super App",
  "companyEmail": "support@localpro.com",
  "companyPhone": "+63-XXX-XXX-XXXX",
  "companyAddress": {
    "street": "123 Main Street",
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
        "endTime": "18:00",
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
        "end": "18:00"
      }
    }
  }
}
```

### Update Features (PUT /api/settings/category/features)

```json
{
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
  "ads": {
    "enabled": true,
    "allowNewAds": true,
    "requireApproval": true,
    "allowPromotion": true
  },
  "facilityCare": {
    "enabled": true,
    "allowNewServices": true,
    "allowContracts": true,
    "allowSubscriptions": true
  },
  "finance": {
    "enabled": true,
    "allowWithdrawals": true,
    "allowLoans": true,
    "allowSalaryAdvance": true,
    "minimumWithdrawal": 100
  },
  "supplies": {
    "enabled": true,
    "allowNewProducts": true,
    "allowOrders": true,
    "allowSubscriptions": true,
    "requireSupplierVerification": true
  },
  "localProPlus": {
    "enabled": true,
    "allowSubscriptions": true,
    "allowUpgrades": true,
    "plans": {
      "basic": {
        "enabled": true,
        "price": 0
      },
      "premium": {
        "enabled": true,
        "price": 299
      },
      "enterprise": {
        "enabled": true,
        "price": 999
      }
    }
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
}
```

### Update Security Settings (PUT /api/settings/category/security)

```json
{
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
}
```

### Update Upload Settings (PUT /api/settings/category/uploads)

```json
{
  "maxFileSize": 10485760,
  "allowedImageTypes": [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
  ],
  "allowedDocumentTypes": [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  "maxImagesPerUpload": 10,
  "imageCompression": {
    "enabled": true,
    "quality": 80
  }
}
```

### Update Notification Settings (PUT /api/settings/category/notifications)

```json
{
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
}
```

### Update Payment Settings (PUT /api/settings/category/payments)

```json
{
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
}
```

### Update Analytics Settings (PUT /api/settings/category/analytics)

```json
{
  "googleAnalytics": {
    "enabled": false,
    "trackingId": "UA-XXXXXXXXX-X"
  },
  "mixpanel": {
    "enabled": false,
    "projectToken": "your-mixpanel-token"
  },
  "customAnalytics": {
    "enabled": true,
    "retentionPeriod": 365
  }
}
```

### Update Integration Settings (PUT /api/settings/category/integrations)

```json
{
  "googleMaps": {
    "enabled": true,
    "apiKey": "your-google-maps-api-key",
    "defaultZoom": 13
  },
  "cloudinary": {
    "enabled": true,
    "cloudName": "your-cloud-name",
    "apiKey": "your-api-key",
    "apiSecret": "your-api-secret"
  },
  "socialLogin": {
    "google": {
      "enabled": false,
      "clientId": "your-google-client-id"
    },
    "facebook": {
      "enabled": false,
      "appId": "your-facebook-app-id"
    }
  }
}
```

---

## Feature Toggle Examples

### Toggle a Feature (PUT /api/settings/feature/:featureName/toggle)

**Enable/Disable Marketplace:**
```
PUT /api/settings/feature/marketplace/toggle
```

**Enable/Disable Ads:**
```
PUT /api/settings/feature/ads/toggle
```

**Enable/Disable Facility Care:**
```
PUT /api/settings/feature/facilityCare/toggle
```

**Enable/Disable Finance:**
```
PUT /api/settings/feature/finance/toggle
```

**Enable/Disable Supplies:**
```
PUT /api/settings/feature/supplies/toggle
```

**Enable/Disable LocalPro Plus:**
```
PUT /api/settings/feature/localProPlus/toggle
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "App settings updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "general": { ... },
    "business": { ... },
    "features": { ... },
    "security": { ... },
    "uploads": { ... },
    "notifications": { ... },
    "payments": { ... },
    "analytics": { ... },
    "integrations": { ... },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "general.environment",
      "message": "Invalid environment value"
    }
  ]
}
```

---

## Field Descriptions

### New Features Added

#### Ads (`features.ads`)
- **enabled**: Enable/disable the ads feature
- **allowNewAds**: Allow users to create new ads
- **requireApproval**: Require admin approval before ads go live
- **allowPromotion**: Allow promotional/advertising content

#### Facility Care (`features.facilityCare`)
- **enabled**: Enable/disable facility care services
- **allowNewServices**: Allow creation of new facility care services
- **allowContracts**: Allow contract-based services
- **allowSubscriptions**: Allow subscription-based services

#### Finance (`features.finance`)
- **enabled**: Enable/disable finance features
- **allowWithdrawals**: Allow users to withdraw funds
- **allowLoans**: Allow loan applications
- **allowSalaryAdvance**: Allow salary advance requests
- **minimumWithdrawal**: Minimum amount for withdrawals (default: 100)

#### Supplies (`features.supplies`)
- **enabled**: Enable/disable supplies marketplace
- **allowNewProducts**: Allow creation of new products
- **allowOrders**: Allow order placement
- **allowSubscriptions**: Allow subscription orders
- **requireSupplierVerification**: Require supplier verification before listing

#### LocalPro Plus (`features.localProPlus`)
- **enabled**: Enable/disable LocalPro Plus subscription service
- **allowSubscriptions**: Allow users to subscribe to plans
- **allowUpgrades**: Allow users to upgrade their plan
- **plans**: Subscription plan configurations
  - **basic**: Basic plan (free tier)
    - **enabled**: Enable/disable basic plan
    - **price**: Plan price (default: 0)
  - **premium**: Premium plan
    - **enabled**: Enable/disable premium plan
    - **price**: Plan price (default: 299)
  - **enterprise**: Enterprise plan
    - **enabled**: Enable/disable enterprise plan
    - **price**: Plan price (default: 999)

---

## Optional Feature Metadata

Each feature can optionally include the following metadata fields (all optional, not required):

- **description** (String): Description of the feature
- **icon** (String): Icon component name (e.g., "Shield", "Book", "Briefcase")
- **color** (String): CSS color classes (e.g., "bg-gray-100 text-gray-700")
- **services** (Array of Strings): List of services offered
- **route** (String): Frontend route path (e.g., "/marketplace")
- **category** (String): Feature category
- **users** (Number): Number of active users
- **lastUpdated** (String): Last update timestamp or relative time (e.g., "2 hours ago")
- **featured** (Boolean): Whether the feature is featured (default: false)

### Example: Marketplace Feature with Metadata

```json
{
  "marketplace": {
    "enabled": true,
    "allowNewProviders": true,
    "requireVerification": true,
    "description": "Connect with service providers and customers",
    "icon": "Shield",
    "color": "bg-gray-100 text-gray-700",
    "services": ["Cleaning", "Plumbing", "Electrical", "Moving"],
    "route": "/marketplace",
    "category": "Services",
    "users": 1250,
    "lastUpdated": "2 hours ago",
    "featured": true
  }
}
```

## Notes

1. All feature flags default to `enabled: true` when first created
2. Partial updates are supported - you only need to send the fields you want to update
3. All routes require admin authentication except GET endpoints
4. The settings document is a singleton - there's only one instance in the database
5. Validation is performed on all updates according to the schema constraints
6. **Feature metadata fields are optional** - they can be added/updated when a feature is enabled, but are not required

