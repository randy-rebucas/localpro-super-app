# User Settings Data Entities

## Overview

The User Settings feature uses two main data models: `UserSettings` for individual user preferences and `AppSettings` for global application configuration. These models provide comprehensive control over user experience and application behavior.

## UserSettings Model

### Schema Definition

```javascript
const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Privacy Settings
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'contacts_only', 'private'],
      default: 'public'
    },
    showPhoneNumber: {
      type: Boolean,
      default: false
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showLocation: {
      type: Boolean,
      default: true
    },
    showRating: {
      type: Boolean,
      default: true
    },
    showPortfolio: {
      type: Boolean,
      default: true
    },
    allowDirectMessages: {
      type: Boolean,
      default: true
    },
    allowJobInvitations: {
      type: Boolean,
      default: true
    },
    allowReferralRequests: {
      type: Boolean,
      default: true
    }
  },

  // Notification Settings
  notifications: {
    // Push Notifications
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      newMessages: {
        type: Boolean,
        default: true
      },
      jobMatches: {
        type: Boolean,
        default: true
      },
      bookingUpdates: {
        type: Boolean,
        default: true
      },
      paymentUpdates: {
        type: Boolean,
        default: true
      },
      referralUpdates: {
        type: Boolean,
        default: true
      },
      systemUpdates: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    
    // Email Notifications
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      newMessages: {
        type: Boolean,
        default: true
      },
      jobMatches: {
        type: Boolean,
        default: true
      },
      bookingUpdates: {
        type: Boolean,
        default: true
      },
      paymentUpdates: {
        type: Boolean,
        default: true
      },
      referralUpdates: {
        type: Boolean,
        default: true
      },
      systemUpdates: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      },
      weeklyDigest: {
        type: Boolean,
        default: true
      },
      monthlyReport: {
        type: Boolean,
        default: true
      }
    },
    
    // SMS Notifications
    sms: {
      enabled: {
        type: Boolean,
        default: true
      },
      urgentMessages: {
        type: Boolean,
        default: true
      },
      bookingReminders: {
        type: Boolean,
        default: true
      },
      paymentAlerts: {
        type: Boolean,
        default: true
      },
      securityAlerts: {
        type: Boolean,
        default: true
      }
    }
  },

  // Communication Preferences
  communication: {
    preferredLanguage: {
      type: String,
      default: 'en',
      enum: ['en', 'fil', 'es', 'zh', 'ja', 'ko']
    },
    timezone: {
      type: String,
      default: 'Asia/Manila'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
    },
    timeFormat: {
      type: String,
      default: '12h',
      enum: ['12h', '24h']
    },
    currency: {
      type: String,
      default: 'PHP',
      enum: ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY']
    },
    autoReply: {
      enabled: {
        type: Boolean,
        default: false
      },
      message: {
        type: String,
        default: 'Thank you for your message. I will get back to you soon.'
      }
    }
  },

  // Service Preferences
  service: {
    defaultServiceRadius: {
      type: Number,
      default: 25, // in kilometers
      min: 1,
      max: 100
    },
    autoAcceptJobs: {
      type: Boolean,
      default: false
    },
    minimumJobValue: {
      type: Number,
      default: 0,
      min: 0
    },
    maximumJobValue: {
      type: Number,
      default: 100000,
      min: 0
    },
    preferredJobTypes: [{
      type: String,
      enum: ['cleaning', 'maintenance', 'repair', 'installation', 'consultation', 'other']
    }],
    workingHours: {
      start: {
        type: String,
        default: '08:00'
      },
      end: {
        type: String,
        default: '17:00'
      },
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }]
    },
    emergencyService: {
      enabled: {
        type: Boolean,
        default: false
      },
      surcharge: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },

  // Payment Preferences
  payment: {
    preferredPaymentMethod: {
      type: String,
      enum: ['paypal', 'paymaya', 'gcash', 'bank_transfer', 'cash'],
      default: 'paypal'
    },
    autoWithdraw: {
      enabled: {
        type: Boolean,
        default: false
      },
      threshold: {
        type: Number,
        default: 1000,
        min: 0
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
      }
    },
    invoiceSettings: {
      includeTax: {
        type: Boolean,
        default: true
      },
      taxRate: {
        type: Number,
        default: 12,
        min: 0,
        max: 100
      },
      invoiceTemplate: {
        type: String,
        default: 'standard',
        enum: ['standard', 'detailed', 'minimal']
      }
    }
  },

  // Security Settings
  security: {
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false
      },
      method: {
        type: String,
        enum: ['sms', 'email', 'authenticator'],
        default: 'sms'
      }
    },
    loginAlerts: {
      enabled: {
        type: Boolean,
        default: true
      },
      newDevice: {
        type: Boolean,
        default: true
      },
      suspiciousActivity: {
        type: Boolean,
        default: true
      }
    },
    sessionTimeout: {
      type: Number,
      default: 24, // hours
      min: 1,
      max: 168
    },
    passwordChangeReminder: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: Number,
        default: 90, // days
        min: 30,
        max: 365
      }
    }
  },

  // App Preferences
  app: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    soundEffects: {
      enabled: {
        type: Boolean,
        default: true
      },
      volume: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
      }
    },
    hapticFeedback: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    autoSave: {
      enabled: {
        type: Boolean,
        default: true
      },
      interval: {
        type: Number,
        default: 30, // seconds
        min: 10,
        max: 300
      }
    },
    dataUsage: {
      imageQuality: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      videoQuality: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      autoDownload: {
        type: Boolean,
        default: false
      }
    }
  },

  // Analytics and Tracking
  analytics: {
    shareUsageData: {
      type: Boolean,
      default: true
    },
    shareLocationData: {
      type: Boolean,
      default: true
    },
    sharePerformanceData: {
      type: Boolean,
      default: true
    },
    personalizedRecommendations: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});
```

### Key Features

#### Privacy Settings
- **Profile Visibility**: Control who can see your profile (public, contacts only, private)
- **Contact Information**: Toggle visibility of phone number and email
- **Location Sharing**: Control whether location is visible to others
- **Rating Display**: Show or hide your rating and reviews
- **Portfolio Access**: Control access to your work portfolio
- **Communication Controls**: Manage who can send direct messages, job invitations, and referral requests

#### Notification Management
- **Multi-Channel Support**: Separate controls for push, email, and SMS notifications
- **Granular Control**: Individual toggles for different notification types
- **Marketing Control**: Separate setting for marketing communications
- **Digest Options**: Weekly and monthly summary notifications

#### Communication Preferences
- **Language Support**: Multiple language options including Filipino, Spanish, Chinese, Japanese, and Korean
- **Timezone Management**: Automatic timezone detection and manual override
- **Date/Time Formatting**: Customizable date and time display formats
- **Currency Support**: Multiple currency options for international users
- **Auto-Reply**: Automated response messages for incoming communications

#### Service Configuration
- **Service Radius**: Configurable service area radius (1-100 km)
- **Job Preferences**: Auto-accept jobs, minimum/maximum job values
- **Job Type Filtering**: Preferred job categories and types
- **Working Hours**: Customizable work schedule and availability
- **Emergency Services**: Emergency service availability and surcharge settings

#### Payment Settings
- **Payment Methods**: Multiple payment options including PayPal, PayMaya, GCash, bank transfer, and cash
- **Auto-Withdrawal**: Automated earnings withdrawal with configurable thresholds
- **Invoice Management**: Tax inclusion, tax rates, and invoice templates
- **Payout Frequency**: Daily, weekly, or monthly payout schedules

#### Security Features
- **Two-Factor Authentication**: SMS, email, or authenticator app support
- **Login Alerts**: Notifications for new device logins and suspicious activity
- **Session Management**: Configurable session timeout (1-168 hours)
- **Password Reminders**: Automated password change reminders

#### App Customization
- **Theme Support**: Light, dark, or automatic theme selection
- **Accessibility**: Font size options and haptic feedback controls
- **Data Usage**: Image and video quality settings for data optimization
- **Auto-Save**: Configurable auto-save intervals for form data

#### Analytics Controls
- **Data Sharing**: Control over usage data, location data, and performance data sharing
- **Personalization**: Toggle for personalized recommendations and content

### Methods

#### Static Methods
```javascript
// Get default settings
UserSettings.getDefaultSettings()
// Returns: Complete default settings object
```

#### Instance Methods
```javascript
// Update specific category
userSettings.updateCategory(category, updates)
// Parameters:
//   category: String - Category name (privacy, notifications, etc.)
//   updates: Object - Updates to apply to the category
// Returns: Promise<Document>

// Reset to defaults
userSettings.resetToDefaults()
// Returns: Promise<Document>
```

## AppSettings Model

### Schema Definition

```javascript
const appSettingsSchema = new mongoose.Schema({
  // General App Settings
  general: {
    appName: {
      type: String,
      default: 'LocalPro Super App'
    },
    appVersion: {
      type: String,
      default: '1.0.0'
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development'
    },
    maintenanceMode: {
      enabled: {
        type: Boolean,
        default: false
      },
      message: {
        type: String,
        default: 'The app is currently under maintenance. Please try again later.'
      },
      estimatedEndTime: Date
    },
    forceUpdate: {
      enabled: {
        type: Boolean,
        default: false
      },
      minVersion: {
        type: String,
        default: '1.0.0'
      },
      message: {
        type: String,
        default: 'Please update to the latest version to continue using the app.'
      }
    }
  },

  // Business Settings
  business: {
    companyName: {
      type: String,
      default: 'LocalPro Super App'
    },
    companyEmail: {
      type: String,
      default: 'support@localpro.com'
    },
    companyPhone: {
      type: String,
      default: '+63-XXX-XXX-XXXX'
    },
    companyAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'Philippines'
      }
    },
    businessHours: {
      timezone: {
        type: String,
        default: 'Asia/Manila'
      },
      schedule: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startTime: String,
        endTime: String,
        isOpen: {
          type: Boolean,
          default: true
        }
      }]
    },
    supportChannels: {
      email: {
        enabled: {
          type: Boolean,
          default: true
        },
        address: {
          type: String,
          default: 'support@localpro.com'
        }
      },
      phone: {
        enabled: {
          type: Boolean,
          default: true
        },
        number: {
          type: String,
          default: '+63-XXX-XXX-XXXX'
        }
      },
      chat: {
        enabled: {
          type: Boolean,
          default: true
        },
        hours: {
          start: String,
          end: String
        }
      }
    }
  },

  // Feature Flags
  features: {
    marketplace: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowNewProviders: {
        type: Boolean,
        default: true
      },
      requireVerification: {
        type: Boolean,
        default: true
      }
    },
    academy: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowNewCourses: {
        type: Boolean,
        default: true
      },
      requireInstructorVerification: {
        type: Boolean,
        default: true
      }
    },
    jobBoard: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowNewJobs: {
        type: Boolean,
        default: true
      },
      requireCompanyVerification: {
        type: Boolean,
        default: true
      }
    },
    referrals: {
      enabled: {
        type: Boolean,
        default: true
      },
      rewardAmount: {
        type: Number,
        default: 100
      },
      maxReferralsPerUser: {
        type: Number,
        default: 50
      }
    },
    payments: {
      paypal: {
        enabled: {
          type: Boolean,
          default: true
        }
      },
      paymaya: {
        enabled: {
          type: Boolean,
          default: true
        }
      },
      gcash: {
        enabled: {
          type: Boolean,
          default: true
        }
      },
      bankTransfer: {
        enabled: {
          type: Boolean,
          default: true
        }
      }
    },
    analytics: {
      enabled: {
        type: Boolean,
        default: true
      },
      trackUserBehavior: {
        type: Boolean,
        default: true
      },
      trackPerformance: {
        type: Boolean,
        default: true
      }
    }
  },

  // Security Settings
  security: {
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8,
        min: 6,
        max: 20
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireLowercase: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSpecialChars: {
        type: Boolean,
        default: true
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
        min: 3,
        max: 10
      },
      lockoutDuration: {
        type: Number,
        default: 15, // minutes
        min: 5,
        max: 60
      }
    },
    sessionSettings: {
      maxSessionDuration: {
        type: Number,
        default: 24, // hours
        min: 1,
        max: 168
      },
      allowMultipleSessions: {
        type: Boolean,
        default: true
      },
      maxConcurrentSessions: {
        type: Number,
        default: 3,
        min: 1,
        max: 10
      }
    },
    dataProtection: {
      encryptSensitiveData: {
        type: Boolean,
        default: true
      },
      dataRetentionPeriod: {
        type: Number,
        default: 365, // days
        min: 30,
        max: 2555 // 7 years
      },
      allowDataExport: {
        type: Boolean,
        default: true
      },
      allowDataDeletion: {
        type: Boolean,
        default: true
      }
    }
  },

  // File Upload Settings
  uploads: {
    maxFileSize: {
      type: Number,
      default: 10485760, // 10MB in bytes
      min: 1048576, // 1MB
      max: 104857600 // 100MB
    },
    allowedImageTypes: [{
      type: String,
      enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    }],
    allowedDocumentTypes: [{
      type: String,
      enum: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }],
    maxImagesPerUpload: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    },
    imageCompression: {
      enabled: {
        type: Boolean,
        default: true
      },
      quality: {
        type: Number,
        default: 80,
        min: 10,
        max: 100
      }
    }
  },

  // Notification Settings
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      provider: {
        type: String,
        enum: ['nodemailer', 'sendgrid', 'mailgun', 'ses'],
        default: 'nodemailer'
      },
      fromEmail: {
        type: String,
        default: 'noreply@localpro.com'
      },
      fromName: {
        type: String,
        default: 'LocalPro Super App'
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: true
      },
      provider: {
        type: String,
        enum: ['twilio', 'vonage', 'aws_sns'],
        default: 'twilio'
      },
      fromNumber: {
        type: String,
        default: '+1234567890'
      }
    },
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      provider: {
        type: String,
        enum: ['firebase', 'onesignal', 'pusher'],
        default: 'firebase'
      }
    }
  },

  // Payment Settings
  payments: {
    defaultCurrency: {
      type: String,
      default: 'PHP',
      enum: ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY']
    },
    supportedCurrencies: [{
      type: String,
      enum: ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY']
    }],
    transactionFees: {
      percentage: {
        type: Number,
        default: 2.9,
        min: 0,
        max: 10
      },
      fixed: {
        type: Number,
        default: 0.30,
        min: 0,
        max: 10
      }
    },
    minimumPayout: {
      type: Number,
      default: 100,
      min: 0
    },
    payoutSchedule: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
      },
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6, // 0 = Sunday
        default: 1 // Monday
      },
      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
        default: 1
      }
    }
  },

  // Analytics Settings
  analytics: {
    googleAnalytics: {
      enabled: {
        type: Boolean,
        default: false
      },
      trackingId: String
    },
    mixpanel: {
      enabled: {
        type: Boolean,
        default: false
      },
      projectToken: String
    },
    customAnalytics: {
      enabled: {
        type: Boolean,
        default: true
      },
      retentionPeriod: {
        type: Number,
        default: 365, // days
        min: 30,
        max: 2555
      }
    }
  },

  // Integration Settings
  integrations: {
    googleMaps: {
      enabled: {
        type: Boolean,
        default: true
      },
      apiKey: String,
      defaultZoom: {
        type: Number,
        default: 13,
        min: 1,
        max: 20
      }
    },
    cloudinary: {
      enabled: {
        type: Boolean,
        default: true
      },
      cloudName: String,
      apiKey: String,
      apiSecret: String
    },
    socialLogin: {
      google: {
        enabled: {
          type: Boolean,
          default: false
        },
        clientId: String
      },
      facebook: {
        enabled: {
          type: Boolean,
          default: false
        },
        appId: String
      }
    }
  }
}, {
  timestamps: true
});
```

### Key Features

#### General Settings
- **App Information**: Name, version, and environment configuration
- **Maintenance Mode**: Enable maintenance mode with custom messages
- **Force Update**: Require users to update to specific app versions

#### Business Settings
- **Company Information**: Name, contact details, and address
- **Business Hours**: Configurable operating hours and timezone
- **Support Channels**: Email, phone, and chat support configuration

#### Feature Flags
- **Module Control**: Enable/disable entire app modules
- **Access Control**: Control who can create new content
- **Verification Requirements**: Set verification requirements for different user types

#### Security Settings
- **Password Policy**: Configurable password requirements
- **Session Management**: Session duration and concurrent session limits
- **Data Protection**: Encryption, retention, and data export controls

#### Upload Settings
- **File Limits**: Maximum file sizes and upload counts
- **File Types**: Allowed image and document types
- **Compression**: Image compression settings for optimization

#### Payment Settings
- **Currency Support**: Multiple currency options
- **Transaction Fees**: Configurable percentage and fixed fees
- **Payout Management**: Minimum payout amounts and schedules

#### Integration Settings
- **Third-Party Services**: Google Maps, Cloudinary, social login configuration
- **API Keys**: Secure storage of integration credentials
- **Service Configuration**: Provider-specific settings

### Methods

#### Static Methods
```javascript
// Get current app settings
AppSettings.getCurrentSettings()
// Returns: Promise<Document> - Current app settings document

// Update app settings
AppSettings.updateAppSettings(updates)
// Parameters:
//   updates: Object - Settings updates to apply
// Returns: Promise<Document> - Updated settings document
```

#### Instance Methods
```javascript
// Get setting by path
appSettings.getSetting(path)
// Parameters:
//   path: String - Dot notation path to setting (e.g., 'features.marketplace.enabled')
// Returns: Any - Setting value

// Set setting by path
appSettings.setSetting(path, value)
// Parameters:
//   path: String - Dot notation path to setting
//   value: Any - Value to set
// Returns: Promise<Document>

// Update multiple settings
appSettings.updateSettings(updates)
// Parameters:
//   updates: Object - Settings updates to apply
// Returns: Promise<Document>
```

## Database Indexes

### UserSettings Indexes
```javascript
// Unique index on userId (automatically created)
{ userId: 1 }
```

### AppSettings Indexes
```javascript
// Index on environment for performance
{ 'general.environment': 1 }
```

## Data Relationships

### UserSettings Relationships
- **User**: One-to-one relationship with User model via `userId` field
- **Population**: User data can be populated when retrieving settings

### AppSettings Relationships
- **Singleton Pattern**: Only one AppSettings document should exist
- **No Direct Relationships**: AppSettings is a global configuration

## Validation Rules

### UserSettings Validation
- **Privacy Settings**: Profile visibility must be one of the allowed values
- **Notification Settings**: All boolean fields for notification preferences
- **Communication Settings**: Language, timezone, and format validation
- **Service Settings**: Numeric validation for radius and job values
- **Payment Settings**: Payment method and frequency validation
- **Security Settings**: Session timeout and frequency limits
- **App Settings**: Theme, font size, and quality validation

### AppSettings Validation
- **General Settings**: Environment and version validation
- **Business Settings**: Email format and phone number validation
- **Feature Flags**: Boolean validation for all feature toggles
- **Security Settings**: Password policy and session limits
- **Upload Settings**: File size and type validation
- **Payment Settings**: Currency and fee validation
- **Integration Settings**: API key format validation

## Default Values

Both models include comprehensive default values that provide sensible defaults for all settings. These defaults ensure that users have a functional experience even if they haven't customized their settings.

The default values are designed to:
- Prioritize user privacy and security
- Provide a good user experience out of the box
- Support the most common use cases
- Be easily customizable by users and administrators
