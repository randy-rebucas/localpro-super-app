# User Settings by Role - LocalPro Super App

> **Documentation of User Settings Access and Relevance by User Role**  
> **Version:** 1.0.0  
> **Last Updated:** January 14, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Settings Categories](#settings-categories)
3. [Role-Based Settings Matrix](#role-based-settings-matrix)
4. [Role-Specific Defaults](#role-specific-defaults)
5. [Settings Access Control](#settings-access-control)
6. [Implementation Notes](#implementation-notes)

---

## 📖 Overview

This document outlines which user settings are available to each user role in the LocalPro Super App. While all users have access to the same settings categories, certain settings are more relevant or have different default values based on the user's role.

### Key Concepts

- **Universal Settings**: Available to all roles (privacy, notifications, communication, app, analytics)
- **Role-Relevant Settings**: Settings that have specific meaning or impact based on role
- **Role-Specific Defaults**: Different default values applied based on user role
- **Conditional Access**: Some settings may be hidden or disabled for certain roles

---

## ⚙️ Settings Categories

### 1. Privacy Settings
Controls what information is visible to others and who can contact the user.

| Setting | Description | Type |
|---------|-------------|------|
| `profileVisibility` | Who can see profile (public/contacts_only/private) | String |
| `showPhoneNumber` | Display phone number on profile | Boolean |
| `showEmail` | Display email on profile | Boolean |
| `showLocation` | Display location information | Boolean |
| `showRating` | Display rating and reviews | Boolean |
| `showPortfolio` | Display portfolio/gallery | Boolean |
| `allowDirectMessages` | Allow direct messages from other users | Boolean |
| `allowJobInvitations` | Allow job invitations | Boolean |
| `allowReferralRequests` | Allow referral requests | Boolean |

### 2. Notification Settings
Controls how and when users receive notifications.

| Setting | Description | Type |
|---------|-------------|------|
| **Push Notifications** |
| `push.enabled` | Enable push notifications | Boolean |
| `push.newMessages` | New messages | Boolean |
| `push.jobMatches` | Job matches (for job seekers) | Boolean |
| `push.bookingUpdates` | Booking status updates | Boolean |
| `push.paymentUpdates` | Payment notifications | Boolean |
| `push.referralUpdates` | Referral program updates | Boolean |
| `push.systemUpdates` | System announcements | Boolean |
| `push.marketing` | Marketing/promotional content | Boolean |
| **Email Notifications** |
| `email.enabled` | Enable email notifications | Boolean |
| `email.newMessages` | New messages | Boolean |
| `email.jobMatches` | Job matches | Boolean |
| `email.bookingUpdates` | Booking updates | Boolean |
| `email.paymentUpdates` | Payment notifications | Boolean |
| `email.referralUpdates` | Referral updates | Boolean |
| `email.systemUpdates` | System updates | Boolean |
| `email.marketing` | Marketing emails | Boolean |
| `email.weeklyDigest` | Weekly activity summary | Boolean |
| `email.monthlyReport` | Monthly performance report | Boolean |
| **SMS Notifications** |
| `sms.enabled` | Enable SMS notifications | Boolean |
| `sms.urgentMessages` | Urgent messages only | Boolean |
| `sms.bookingReminders` | Booking reminders | Boolean |
| `sms.paymentAlerts` | Payment alerts | Boolean |
| `sms.securityAlerts` | Security alerts | Boolean |

### 3. Communication Settings
Language and regional preferences.

| Setting | Description | Type | Options |
|---------|-------------|------|---------|
| `preferredLanguage` | Interface language | String | en, fil, es, zh, ja, ko |
| `timezone` | User's timezone | String | Valid timezone |
| `dateFormat` | Date display format | String | MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD |
| `timeFormat` | Time display format | String | 12h, 24h |
| `currency` | Preferred currency | String | PHP, USD, EUR, GBP, JPY, KRW, CNY |
| `autoReply.enabled` | Enable auto-reply | Boolean | - |
| `autoReply.message` | Auto-reply message | String | - |

### 4. Service Settings
Service-related preferences (primarily for providers).

| Setting | Description | Type |
|---------|-------------|------|
| `defaultServiceRadius` | Default service area radius (km) | Number |
| `autoAcceptJobs` | Automatically accept job bookings | Boolean |
| `minimumJobValue` | Minimum job value to accept | Number |
| `maximumJobValue` | Maximum job value to accept | Number |
| `preferredJobTypes` | Preferred job categories | Array |
| `workingHours.start` | Work day start time | String |
| `workingHours.end` | Work day end time | String |
| `workingHours.days` | Working days of week | Array |
| `emergencyService.enabled` | Offer emergency services | Boolean |
| `emergencyService.surcharge` | Emergency service surcharge (%) | Number |

### 5. Payment Settings
Financial preferences and payment methods.

| Setting | Description | Type |
|---------|-------------|------|
| `preferredPaymentMethod` | Default payment method | String |
| `autoWithdraw.enabled` | Enable automatic withdrawals | Boolean |
| `autoWithdraw.threshold` | Auto-withdraw threshold | Number |
| `autoWithdraw.frequency` | Withdrawal frequency | String |
| `invoiceSettings.includeTax` | Include tax in invoices | Boolean |
| `invoiceSettings.taxRate` | Tax rate percentage | Number |
| `invoiceSettings.invoiceTemplate` | Invoice template style | String |

### 6. Security Settings
Account security and authentication preferences.

| Setting | Description | Type |
|---------|-------------|------|
| `twoFactorAuth.enabled` | Enable 2FA | Boolean |
| `twoFactorAuth.method` | 2FA method | String |
| `loginAlerts.enabled` | Enable login alerts | Boolean |
| `loginAlerts.newDevice` | Alert on new device login | Boolean |
| `loginAlerts.suspiciousActivity` | Alert on suspicious activity | Boolean |
| `sessionTimeout` | Session timeout (hours) | Number |
| `passwordChangeReminder.enabled` | Password change reminders | Boolean |
| `passwordChangeReminder.frequency` | Reminder frequency (days) | Number || **MPIN Settings** | | |
| `mpinEnabled` | MPIN authentication enabled | Boolean |
| `mpinLocked` | MPIN currently locked | Boolean |
| `mpinAttempts` | Failed MPIN attempts count | Number |
### 7. App Settings
Application interface and behavior preferences.

| Setting | Description | Type |
|---------|-------------|------|
| `theme` | App theme | String |
| `fontSize` | Font size | String |
| `soundEffects.enabled` | Enable sound effects | Boolean |
| `soundEffects.volume` | Sound volume | Number |
| `hapticFeedback.enabled` | Enable haptic feedback | Boolean |
| `autoSave.enabled` | Enable auto-save | Boolean |
| `autoSave.interval` | Auto-save interval (seconds) | Number |
| `dataUsage.imageQuality` | Image quality setting | String |
| `dataUsage.videoQuality` | Video quality setting | String |
| `dataUsage.autoDownload` | Auto-download media | Boolean |

### 8. Analytics Settings
Data sharing and personalization preferences.

| Setting | Description | Type |
|---------|-------------|------|
| `shareUsageData` | Share app usage data | Boolean |
| `shareLocationData` | Share location data for analytics | Boolean |
| `sharePerformanceData` | Share performance metrics | Boolean |
| `personalizedRecommendations` | Enable personalized recommendations | Boolean |

---

## 👥 Role-Based Settings Matrix

### Legend
- ✅ **Full Access**: Setting is fully available and relevant
- ⚠️ **Limited Access**: Setting available but with limitations or different defaults
- ❌ **Not Applicable**: Setting hidden or disabled for this role
- 🔒 **Admin Only**: Only accessible by administrators

### Client Role
| Category | Setting | Access | Notes |
|----------|---------|--------|-------|
| **Privacy** | All privacy settings | ✅ | Full control over profile visibility |
| **Notifications** | All notification settings | ✅ | All notification types available |
| **Communication** | All communication settings | ✅ | Full language and regional preferences |
| **Service** | All service settings | ❌ | Not applicable - clients don't provide services |
| **Payment** | `preferredPaymentMethod` | ✅ | For purchases and payments |
| | `autoWithdraw.*` | ❌ | Not applicable - clients don't receive payments |
| | `invoiceSettings.*` | ❌ | Not applicable |
| **Security** | All security settings | ✅ | Full security controls |
| **App** | All app settings | ✅ | Full app customization |
| **Analytics** | All analytics settings | ✅ | Full data sharing controls |

### Provider Role
| Category | Setting | Access | Notes |
|----------|---------|--------|-------|
| **Privacy** | All privacy settings | ✅ | Important for professional reputation |
| **Notifications** | All notification settings | ✅ | Critical for booking management |
| | `jobMatches` | ⚠️ | May apply to job seeking as well |
| **Communication** | All communication settings | ✅ | Professional communication preferences |
| **Service** | All service settings | ✅ | Core service configuration |
| | `autoAcceptJobs` | ⚠️ | May be restricted based on verification level |
| **Payment** | All payment settings | ✅ | Essential for income management |
| | `autoWithdraw.*` | ✅ | Important for regular income |
| **Security** | All security settings | ✅ | Enhanced security for business accounts |
| **App** | All app settings | ✅ | Professional app customization |
| **Analytics** | All analytics settings | ✅ | Business performance insights |

### Admin Role
| Category | Setting | Access | Notes |
|----------|---------|--------|-------|
| **Privacy** | All privacy settings | ✅ | Administrative profile management |
| **Notifications** | All notification settings | ✅ | System and user notifications |
| | `marketing` | ⚠️ | May have different defaults |
| **Communication** | All communication settings | ✅ | Administrative preferences |
| **Service** | All service settings | ❌ | Not applicable |
| **Payment** | All payment settings | ❌ | Not applicable |
| **Security** | All security settings | ✅ | Enhanced security requirements |
| | `twoFactorAuth` | ⚠️ | May be mandatory |
| **App** | All app settings | ✅ | Administrative interface |
| **Analytics** | All analytics settings | ✅ | System analytics access |

### Agency Owner Role
| Category | Setting | Access | Notes |
|----------|---------|--------|-------|
| **Privacy** | All privacy settings | ✅ | Business profile visibility |
| **Notifications** | All notification settings | ✅ | Business and team notifications |
| | `jobMatches` | ⚠️ | May apply to hiring needs |
| **Communication** | All communication settings | ✅ | Business communication |
| **Service** | All service settings | ✅ | Agency service configuration |
| | `autoAcceptJobs` | ⚠️ | May delegate to agency admins |
| **Payment** | All payment settings | ✅ | Business financial management |
| | `autoWithdraw.*` | ✅ | Business income management |
| **Security** | All security settings | ✅ | Business account security |
| **App** | All app settings | ✅ | Business app preferences |
| **Analytics** | All analytics settings | ✅ | Business analytics |

### Agency Admin Role
| Category | Setting | Access | Notes |
|----------|---------|--------|-------|
| **Privacy** | All privacy settings | ✅ | Professional profile |
| **Notifications** | All notification settings | ✅ | Team and booking notifications |
| **Communication** | All communication settings | ✅ | Team communication |
| **Service** | All service settings | ⚠️ | Limited service configuration |
| | `autoAcceptJobs` | ⚠️ | May be restricted by agency owner |
| **Payment** | `preferredPaymentMethod` | ✅ | Personal payment preferences |
| | `autoWithdraw.*` | ⚠️ | May be managed by agency |
| | `invoiceSettings.*` | ⚠️ | May use agency templates |
| **Security** | All security settings | ✅ | Professional security |
| **App** | All app settings | ✅ | Work app preferences |
| **Analytics** | All analytics settings | ✅ | Team performance insights |

### Supplier Role
| Category | Setting | Access | Notes |
|----------|---------|--------|-------|
| **Privacy** | All privacy settings | ✅ | Business profile visibility |
| **Notifications** | All notification settings | ✅ | Sales and order notifications |
| | `jobMatches` | ❌ | Not applicable |
| **Communication** | All communication settings | ✅ | Business communication |
| **Service** | All service settings | ❌ | Not applicable |
| **Payment** | All payment settings | ✅ | Sales and payment management |
| | `autoWithdraw.*` | ✅ | Business income |
| **Security** | All security settings | ✅ | Business security |
| **App** | All app settings | ✅ | Business app interface |
| **Analytics** | All analytics settings | ✅ | Sales analytics |

### Instructor Role
| Category | Setting | Access | Notes |
|----------|---------|--------|-------|
| **Privacy** | All privacy settings | ✅ | Professional educator profile |
| **Notifications** | All notification settings | ✅ | Student and course notifications |
| | `jobMatches` | ❌ | Not applicable |
| **Communication** | All communication settings | ✅ | Educational communication |
| **Service** | `workingHours.*` | ⚠️ | Teaching schedule |
| | Other service settings | ❌ | Not applicable |
| **Payment** | All payment settings | ✅ | Course revenue management |
| | `autoWithdraw.*` | ✅ | Teaching income |
| **Security** | All security settings | ✅ | Professional security |
| **App** | All app settings | ✅ | Teaching app preferences |
| **Analytics** | All analytics settings | ✅ | Course performance analytics |

### Partner Role
| Category | Setting | Access | Notes |
|----------|---------|--------|-------|
| **Privacy** | All privacy settings | ✅ | Organizational profile |
| **Notifications** | All notification settings | ✅ | Organizational notifications |
| **Communication** | All communication settings | ✅ | Organizational preferences |
| **Service** | All service settings | ❌ | Not applicable |
| **Payment** | All payment settings | ❌ | Handled by organization |
| **Security** | All security settings | ✅ | Organizational security |
| **App** | All app settings | ✅ | Organizational interface |
| **Analytics** | All analytics settings | ✅ | Organizational analytics |

### Staff Role
| Category | Setting | Access | Notes |
|----------|---------|--------|-------|
| **Privacy** | All privacy settings | ✅ | Professional profile |
| **Notifications** | All notification settings | ✅ | Work-related notifications |
| | `marketing` | ⚠️ | May be restricted |
| **Communication** | All communication settings | ✅ | Work communication |
| **Service** | All service settings | ❌ | Not applicable |
| **Payment** | All payment settings | ❌ | Salary-based compensation |
| **Security** | All security settings | ✅ | Enhanced security requirements |
| | `twoFactorAuth` | ⚠️ | May be mandatory |
| **App** | All app settings | ✅ | Work interface preferences |
| **Analytics** | All analytics settings | ✅ | Performance monitoring |

---

## 🎯 Role-Specific Defaults

### Client Defaults
```json
{
  "privacy": {
    "profileVisibility": "public",
    "showPhoneNumber": false,
    "showEmail": false,
    "allowDirectMessages": true,
    "allowJobInvitations": true,
    "allowReferralRequests": true
  },
  "notifications": {
    "push": {
      "jobMatches": true,
      "bookingUpdates": true,
      "marketing": false
    },
    "email": {
      "weeklyDigest": true,
      "monthlyReport": false
    }
  },
  "service": {
    "defaultServiceRadius": 0
  }
}
```

### Provider Defaults
```json
{
  "privacy": {
    "profileVisibility": "public",
    "showPhoneNumber": true,
    "showEmail": true,
    "showPortfolio": true,
    "allowDirectMessages": true,
    "allowJobInvitations": false
  },
  "notifications": {
    "push": {
      "bookingUpdates": true,
      "paymentUpdates": true,
      "jobMatches": false
    },
    "email": {
      "bookingUpdates": true,
      "paymentUpdates": true,
      "weeklyDigest": true,
      "monthlyReport": true
    },
    "sms": {
      "bookingReminders": true,
      "paymentAlerts": true
    }
  },
  "service": {
    "defaultServiceRadius": 25,
    "autoAcceptJobs": false,
    "workingHours": {
      "start": "08:00",
      "end": "17:00",
      "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
    }
  },
  "payment": {
    "autoWithdraw": {
      "enabled": false,
      "threshold": 1000,
      "frequency": "weekly"
    }
  }
}
```

### Admin Defaults
```json
{
  "privacy": {
    "profileVisibility": "private",
    "showPhoneNumber": false,
    "allowDirectMessages": true
  },
  "notifications": {
    "push": {
      "systemUpdates": true,
      "marketing": false
    },
    "email": {
      "systemUpdates": true,
      "weeklyDigest": true,
      "monthlyReport": true
    }
  },
  "security": {
    "twoFactorAuth": {
      "enabled": true,
      "method": "authenticator"
    },
    "loginAlerts": {
      "enabled": true,
      "newDevice": true,
      "suspiciousActivity": true
    }
  }
}
```

---

## 🔐 Settings Access Control

### API Endpoints
- `GET /api/settings/user` - Get current user settings
- `PUT /api/settings/user` - Update all user settings
- `PUT /api/settings/user/:category` - Update specific category
- `POST /api/settings/user/reset` - Reset to role defaults

### Permission Checks
```javascript
// Example middleware for role-based settings validation
const validateSettingsByRole = (req, res, next) => {
  const userRoles = req.user.roles || [];
  const updates = req.body;
  
  // Check if user can modify service settings
  if (updates.service && !userRoles.includes('provider')) {
    return res.status(403).json({
      success: false,
      message: 'Service settings not available for this role'
    });
  }
  
  // Check if user can modify payment auto-withdraw
  if (updates.payment?.autoWithdraw && !['provider', 'supplier', 'instructor', 'agency_owner'].some(role => userRoles.includes(role))) {
    return res.status(403).json({
      success: false,
      message: 'Auto-withdraw settings not available for this role'
    });
  }
  
  next();
};
```

### Frontend Implementation
```javascript
// Example: Conditionally show settings based on role
const canAccessServiceSettings = (userRoles) => {
  return userRoles.includes('provider') || userRoles.includes('agency_owner');
};

const canAccessAutoWithdraw = (userRoles) => {
  return ['provider', 'supplier', 'instructor', 'agency_owner'].some(role => 
    userRoles.includes(role)
  );
};
```

---

## 📝 Implementation Notes

### Database Schema
Settings are stored in the `UserSettings` collection with the following structure:
```javascript
{
  userId: ObjectId, // Reference to User
  privacy: { /* privacy settings */ },
  notifications: { /* notification settings */ },
  communication: { /* communication settings */ },
  service: { /* service settings */ },
  payment: { /* payment settings */ },
  security: { /* security settings */ },
  app: { /* app settings */ },
  analytics: { /* analytics settings */ }
}
```

### Default Settings Generation
When a user is created, default settings are generated based on their primary role:
```javascript
const getDefaultSettingsForRole = (roles) => {
  const primaryRole = roles.find(role => role !== 'client') || 'client';
  
  switch (primaryRole) {
    case 'provider':
      return { ...baseDefaults, ...providerDefaults };
    case 'admin':
      return { ...baseDefaults, ...adminDefaults };
    // ... other roles
    default:
      return baseDefaults;
  }
};
```

### Settings Validation
- All settings are validated using express-validator middleware
- Role-specific validation rules are applied
- Invalid settings are rejected with appropriate error messages

### Performance Considerations
- Settings are cached in memory for public app settings
- User settings are indexed by userId for fast retrieval
- Bulk operations are supported for admin management

### Future Enhancements
- Role-specific setting templates
- Dynamic settings based on user verification level
- Settings inheritance for agency members
- Advanced permission matrices

---

*This document should be updated whenever new settings are added or role permissions change.*</content>
<parameter name="filePath">c:\Users\corew\localpro-super-app\USER_SETTINGS_BY_ROLE.md