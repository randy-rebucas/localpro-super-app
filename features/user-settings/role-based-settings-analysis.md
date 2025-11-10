# Role-Based User Settings Analysis

## Overview

This document categorizes user settings from `data-entities.md` based on their applicability to different user roles. Settings are categorized as:
- **Client-Only**: Settings only relevant for CLIENT role
- **Non-Client-Only**: Settings only relevant for business roles (PROVIDER, SUPPLIER, INSTRUCTOR, AGENCY_OWNER, AGENCY_ADMIN, ADMIN)
- **Both**: Settings applicable to all roles

---

## Role Definitions

### CLIENT
- **Role**: `client`
- **Description**: Regular users who can book services, purchase supplies, enroll in courses, and use basic platform features
- **Capabilities**: Browse services, book services, purchase supplies, enroll courses, rent equipment, apply for jobs

### Non-CLIENT (Business Roles)
- **PROVIDER**: Service providers offering marketplace services
- **SUPPLIER**: Materials and equipment suppliers
- **INSTRUCTOR**: Educational content creators
- **AGENCY_OWNER**: Agency owners managing agencies and providers
- **AGENCY_ADMIN**: Agency administrators with limited management capabilities
- **ADMIN**: Platform administrators with full system access

---

## Settings Categorization

### 1. Privacy Settings
**Category**: Both (with role-specific options)

| Setting | Client | Non-Client | Notes |
|---------|--------|-----------|-------|
| `profileVisibility` | ✅ | ✅ | All users can control profile visibility |
| `showPhoneNumber` | ✅ | ✅ | All users can control phone visibility |
| `showEmail` | ✅ | ✅ | All users can control email visibility |
| `showLocation` | ✅ | ✅ | All users can control location visibility |
| `showRating` | ✅ | ✅ | All users can control rating display |
| `showPortfolio` | ✅ | ✅ | All users can control portfolio visibility |
| `allowDirectMessages` | ✅ | ✅ | All users can control DM permissions |
| `allowJobInvitations` | ❌ | ✅ | **Non-Client Only** - Only service providers receive job invitations |
| `allowReferralRequests` | ❌ | ✅ | **Non-Client Only** - Only business roles receive referral requests |

**Analysis**:
- Most privacy settings are universal
- `allowJobInvitations` is **Non-Client Only** (applies to PROVIDER, AGENCY_OWNER, AGENCY_ADMIN)
- `allowReferralRequests` is **Non-Client Only** (applies to all business roles)

---

### 2. Notification Settings
**Category**: Both (with role-specific notifications)

#### Push Notifications
| Setting | Client | Non-Client | Notes |
|---------|--------|-----------|-------|
| `enabled` | ✅ | ✅ | Universal control |
| `newMessages` | ✅ | ✅ | All users receive messages |
| `jobMatches` | ❌ | ✅ | **Non-Client Only** - Only service providers have job matches |
| `bookingUpdates` | ❌ | ✅ | **Non-Client Only** - Service providers receive booking updates |
| `paymentUpdates` | ❌ | ✅ | **Non-Client Only** - Business roles receive payment notifications |
| `referralUpdates` | ❌ | ✅ | **Non-Client Only** - Business roles have referral programs |
| `systemUpdates` | ✅ | ✅ | Universal system notifications |
| `marketing` | ✅ | ✅ | Universal marketing opt-in/out |

#### Email Notifications
| Setting | Client | Non-Client | Notes |
|---------|--------|-----------|-------|
| `enabled` | ✅ | ✅ | Universal control |
| `newMessages` | ✅ | ✅ | All users receive messages |
| `jobMatches` | ❌ | ✅ | **Non-Client Only** |
| `bookingUpdates` | ❌ | ✅ | **Non-Client Only** |
| `paymentUpdates` | ❌ | ✅ | **Non-Client Only** |
| `referralUpdates` | ❌ | ✅ | **Non-Client Only** |
| `weeklyDigest` | ❌ | ✅ | **Non-Client Only** - Business performance summaries |
| `monthlyReport` | ❌ | ✅ | **Non-Client Only** - Business analytics reports |
| `systemUpdates` | ✅ | ✅ | Universal |
| `marketing` | ✅ | ✅ | Universal |

#### SMS Notifications
| Setting | Client | Non-Client | Notes |
|---------|--------|-----------|-------|
| `enabled` | ✅ | ✅ | Universal control |
| `urgentMessages` | ✅ | ✅ | All users receive urgent messages |
| `bookingReminders` | ❌ | ✅ | **Non-Client Only** - Service providers need booking reminders |
| `paymentAlerts` | ❌ | ✅ | **Non-Client Only** - Business roles receive payment alerts |
| `securityAlerts` | ✅ | ✅ | Universal security notifications |

**Analysis**:
- Basic notifications (messages, system, marketing) are universal
- Job-related notifications are **Non-Client Only**
- Payment and referral notifications are **Non-Client Only**
- Business reports (weekly digest, monthly report) are **Non-Client Only**

---

### 3. Communication Preferences
**Category**: Both (with role-specific features)

| Setting | Client | Non-Client | Notes |
|---------|--------|-----------|-------|
| `preferredLanguage` | ✅ | ✅ | Universal setting |
| `timezone` | ✅ | ✅ | Universal setting |
| `dateFormat` | ✅ | ✅ | Universal setting |
| `timeFormat` | ✅ | ✅ | Universal setting |
| `currency` | ✅ | ✅ | Universal setting |
| `autoReply.enabled` | ❌ | ✅ | **Non-Client Only** - Business roles need auto-reply |
| `autoReply.message` | ❌ | ✅ | **Non-Client Only** - Only for business roles |

**Analysis**:
- All basic communication preferences are universal
- Auto-reply functionality is **Non-Client Only** (business roles need automated responses)

---

### 4. Service Preferences
**Category**: Non-Client Only (Service Providers)

| Setting | Client | Non-Client | Notes |
|---------|--------|-----------|-------|
| `defaultServiceRadius` | ❌ | ✅ | **Non-Client Only** - Service area definition |
| `autoAcceptJobs` | ❌ | ✅ | **Non-Client Only** - Job acceptance automation |
| `minimumJobValue` | ❌ | ✅ | **Non-Client Only** - Job value filtering |
| `maximumJobValue` | ❌ | ✅ | **Non-Client Only** - Job value filtering |
| `preferredJobTypes` | ❌ | ✅ | **Non-Client Only** - Job type preferences |
| `workingHours.start` | ❌ | ✅ | **Non-Client Only** - Availability management |
| `workingHours.end` | ❌ | ✅ | **Non-Client Only** - Availability management |
| `workingHours.days` | ❌ | ✅ | **Non-Client Only** - Availability management |
| `emergencyService.enabled` | ❌ | ✅ | **Non-Client Only** - Emergency service offering |
| `emergencyService.surcharge` | ❌ | ✅ | **Non-Client Only** - Emergency pricing |

**Analysis**:
- **Entire section is Non-Client Only**
- Specifically applies to PROVIDER, AGENCY_OWNER, AGENCY_ADMIN, ADMIN
- Clients do not offer services, so these settings are irrelevant

**Role-Specific Breakdown**:
- **PROVIDER**: Full access to all service preferences
- **AGENCY_OWNER**: Full access (manages agency services)
- **AGENCY_ADMIN**: Full access (manages agency services)
- **ADMIN**: Full access (platform administration)
- **SUPPLIER**: Not applicable (suppliers don't provide services)
- **INSTRUCTOR**: Not applicable (instructors don't provide services)

---

### 5. Payment Preferences
**Category**: Both (with role-specific features)

| Setting | Client | Non-Client | Notes |
|---------|--------|-----------|-------|
| `preferredPaymentMethod` | ✅ | ✅ | Universal - all users can receive/pay |
| `autoWithdraw.enabled` | ❌ | ✅ | **Non-Client Only** - Business roles withdraw earnings |
| `autoWithdraw.threshold` | ❌ | ✅ | **Non-Client Only** - Withdrawal automation |
| `autoWithdraw.frequency` | ❌ | ✅ | **Non-Client Only** - Withdrawal schedule |
| `invoiceSettings.includeTax` | ❌ | ✅ | **Non-Client Only** - Business invoicing |
| `invoiceSettings.taxRate` | ❌ | ✅ | **Non-Client Only** - Business invoicing |
| `invoiceSettings.invoiceTemplate` | ❌ | ✅ | **Non-Client Only** - Business invoicing |

**Analysis**:
- Payment method selection is universal
- Auto-withdrawal is **Non-Client Only** (business roles earn money)
- Invoice settings are **Non-Client Only** (only business roles issue invoices)

---

### 6. Security Settings
**Category**: Both

| Setting | Client | Non-Client | Notes |
|---------|--------|-----------|-------|
| `twoFactorAuth.enabled` | ✅ | ✅ | Universal security feature |
| `twoFactorAuth.method` | ✅ | ✅ | Universal security feature |
| `loginAlerts.enabled` | ✅ | ✅ | Universal security feature |
| `loginAlerts.newDevice` | ✅ | ✅ | Universal security feature |
| `loginAlerts.suspiciousActivity` | ✅ | ✅ | Universal security feature |
| `sessionTimeout` | ✅ | ✅ | Universal security feature |
| `passwordChangeReminder.enabled` | ✅ | ✅ | Universal security feature |
| `passwordChangeReminder.frequency` | ✅ | ✅ | Universal security feature |

**Analysis**:
- **All security settings are universal** - security applies to all users regardless of role

---

### 7. App Preferences
**Category**: Both

| Setting | Client | Non-Client | Notes |
|---------|--------|-----------|-------|
| `theme` | ✅ | ✅ | Universal UI preference |
| `fontSize` | ✅ | ✅ | Universal accessibility setting |
| `soundEffects.enabled` | ✅ | ✅ | Universal UI preference |
| `soundEffects.volume` | ✅ | ✅ | Universal UI preference |
| `hapticFeedback.enabled` | ✅ | ✅ | Universal UI preference |
| `autoSave.enabled` | ✅ | ✅ | Universal UX feature |
| `autoSave.interval` | ✅ | ✅ | Universal UX feature |
| `dataUsage.imageQuality` | ✅ | ✅ | Universal data optimization |
| `dataUsage.videoQuality` | ✅ | ✅ | Universal data optimization |
| `dataUsage.autoDownload` | ✅ | ✅ | Universal data optimization |

**Analysis**:
- **All app preferences are universal** - UI/UX preferences apply to all users

---

### 8. Analytics & Tracking
**Category**: Both

| Setting | Client | Non-Client | Notes |
|---------|--------|-----------|-------|
| `shareUsageData` | ✅ | ✅ | Universal data sharing preference |
| `shareLocationData` | ✅ | ✅ | Universal data sharing preference |
| `sharePerformanceData` | ✅ | ✅ | Universal data sharing preference |
| `personalizedRecommendations` | ✅ | ✅ | Universal personalization preference |

**Analysis**:
- **All analytics settings are universal** - data sharing preferences apply to all users

---

## Summary by Category

### Client-Only Settings
**None** - There are no settings that are exclusive to clients. Clients have access to a subset of universal settings plus basic privacy/notification settings.

### Non-Client-Only Settings

#### Complete Sections (100% Non-Client):
1. **Service Preferences** (entire section)
   - Service radius, job preferences, working hours, emergency services
   - Applies to: PROVIDER, AGENCY_OWNER, AGENCY_ADMIN, ADMIN

#### Partial Sections (Some settings Non-Client):
1. **Privacy Settings**:
   - `allowJobInvitations` → PROVIDER, AGENCY_OWNER, AGENCY_ADMIN
   - `allowReferralRequests` → All business roles

2. **Notification Settings**:
   - Job-related: `jobMatches`, `bookingUpdates` → Service providers
   - Business-related: `paymentUpdates`, `referralUpdates` → All business roles
   - Reports: `weeklyDigest`, `monthlyReport` → All business roles

3. **Communication Preferences**:
   - `autoReply` (entire subsection) → All business roles

4. **Payment Preferences**:
   - `autoWithdraw` (entire subsection) → All business roles
   - `invoiceSettings` (entire subsection) → All business roles

### Universal Settings (Both Client and Non-Client)

1. **Privacy Settings** (partial):
   - Profile visibility, contact info visibility, location, rating, portfolio, direct messages

2. **Notification Settings** (partial):
   - Basic notifications: new messages, system updates, marketing
   - SMS: urgent messages, security alerts

3. **Communication Preferences** (partial):
   - Language, timezone, date/time format, currency

4. **Payment Preferences** (partial):
   - Preferred payment method

5. **Security Settings** (complete):
   - All security settings are universal

6. **App Preferences** (complete):
   - All app customization settings are universal

7. **Analytics & Tracking** (complete):
   - All analytics settings are universal

---

## Implementation Recommendations

### For Settings UI (page.tsx)

#### Current Implementation Analysis:
The current settings page correctly implements role-based visibility:
- Service Preferences section is conditionally rendered: `{isServiceProvider && ...}`
- Auto-reply section is conditionally rendered: `{isBusinessRole && ...}`
- Auto-withdrawal and invoice settings are conditionally rendered: `{isBusinessRole && ...}`
- Job invitations and referral requests are conditionally shown in privacy settings
- Role-specific notifications are conditionally shown

#### Recommendations:
1. ✅ **Already Implemented**: Service Preferences section hidden for clients
2. ✅ **Already Implemented**: Auto-reply hidden for clients
3. ✅ **Already Implemented**: Auto-withdrawal hidden for clients
4. ✅ **Already Implemented**: Invoice settings hidden for clients
5. ✅ **Already Implemented**: Role-specific notification toggles

### For Data Model (Schema)

#### Recommendations:
1. **Validation Rules**: Add role-based validation to prevent clients from setting non-client-only fields
2. **Default Values**: Ensure non-client-only fields default to `null` or `undefined` for client users
3. **API Validation**: Backend should validate that clients cannot set service preferences, auto-withdraw, invoice settings, etc.
4. **Field Removal**: Consider omitting non-applicable fields from API responses for cleaner client payloads

### For Documentation

#### Recommendations:
1. Add JSDoc comments to schema indicating role restrictions
2. Add validation documentation explaining role-based constraints
3. Update API documentation to specify which endpoints/fields are role-restricted

---

## Role-Specific Settings Summary

### CLIENT Role
**Available Settings**:
- Privacy: All except job invitations and referral requests
- Notifications: Basic notifications only (messages, system, marketing, urgent SMS, security alerts)
- Communication: Basic preferences only (language, timezone, formats, currency)
- Payment: Preferred payment method only
- Security: All security settings
- App: All app preferences
- Analytics: All analytics settings

**Restricted Settings**:
- Service Preferences: None available
- Auto-reply: Not available
- Auto-withdrawal: Not available
- Invoice Settings: Not available
- Job/Booking notifications: Not available
- Payment/Referral notifications: Not available
- Weekly/Monthly reports: Not available

### PROVIDER Role
**Available Settings**: All settings except:
- N/A - Providers have access to all settings

**Special Access**:
- Service Preferences: Full access
- Job invitations: Available
- Booking notifications: Available

### SUPPLIER Role
**Available Settings**: All except Service Preferences (suppliers don't provide services)

**Special Access**:
- Auto-withdrawal: Available
- Invoice settings: Available
- Referral requests: Available

### INSTRUCTOR Role
**Available Settings**: All except Service Preferences (instructors don't provide services)

**Special Access**:
- Auto-withdrawal: Available
- Invoice settings: Available
- Referral requests: Available

### AGENCY_OWNER Role
**Available Settings**: All settings

**Special Access**:
- Service Preferences: Full access (agency services)
- All business role settings: Available

### AGENCY_ADMIN Role
**Available Settings**: All settings

**Special Access**:
- Service Preferences: Full access (agency services)
- All business role settings: Available

### ADMIN Role
**Available Settings**: All settings

**Special Access**:
- Full platform access to all settings
- May override role restrictions for testing/admin purposes

---

## Conclusion

The user settings model is well-designed with clear separation between universal and role-specific settings. The main differentiation is:

1. **Clients** have access to basic privacy, communication, security, and app preferences
2. **Business Roles** have all client settings PLUS business-specific settings (service preferences, auto-withdrawal, invoicing, auto-reply)
3. **Service Providers** additionally have service-specific settings (service area, job preferences, working hours, emergency services)

The current implementation in `page.tsx` correctly handles role-based visibility and should be maintained as the reference implementation.

