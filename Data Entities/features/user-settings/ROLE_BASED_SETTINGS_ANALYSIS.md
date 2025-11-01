# User Settings - Role-Based Analysis

## Overview

This document analyzes all user settings in the `UserSettings` model and categorizes them based on role applicability. Settings are classified as:
- **CLIENT_ONLY**: Primarily or exclusively used by clients
- **PROVIDER_ONLY**: Primarily or exclusively used by service providers
- **UNIVERSAL**: Applicable to all roles
- **CONTEXT_DEPENDENT**: Meaning varies by role

---

## Role Definitions

- **CLIENT**: Service consumers who book services, apply for jobs, and make purchases
- **PROVIDER**: Service providers who offer services, create jobs, manage bookings
- **OTHER ROLES**: ADMIN, SUPPLIER, INSTRUCTOR, AGENCY_OWNER, AGENCY_ADMIN, ADVERTISER

---

## 1. Privacy Settings (`privacy`)

| Setting | Category | CLIENT | PROVIDER | Other Roles | Notes |
|---------|----------|--------|----------|-------------|-------|
| `profileVisibility` | UNIVERSAL | ✅ | ✅ | ✅ | All users control profile visibility |
| `showPhoneNumber` | UNIVERSAL | ✅ | ✅ | ✅ | Privacy control for all users |
| `showEmail` | UNIVERSAL | ✅ | ✅ | ✅ | Privacy control for all users |
| `showLocation` | CONTEXT_DEPENDENT | ⚠️ | ✅ | ⚠️ | **Provider-focused**: Important for service area matching; less relevant for clients |
| `showRating` | CONTEXT_DEPENDENT | ⚠️ | ✅ | ⚠️ | **Provider-focused**: Critical for provider credibility; optional for clients |
| `showPortfolio` | PROVIDER_ONLY | ❌ | ✅ | ⚠️ | **Provider-focused**: Only providers have portfolios |
| `allowDirectMessages` | UNIVERSAL | ✅ | ✅ | ✅ | All users receive messages |
| `allowJobInvitations` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-focused**: Only providers receive job invitations |
| `allowReferralRequests` | UNIVERSAL | ✅ | ✅ | ✅ | All users can send/receive referrals |

**Summary**: 
- **UNIVERSAL**: `profileVisibility`, `showPhoneNumber`, `showEmail`, `allowDirectMessages`, `allowReferralRequests`
- **PROVIDER_ONLY**: `showPortfolio`, `allowJobInvitations`
- **CONTEXT_DEPENDENT**: `showLocation`, `showRating` (more important for providers)

---

## 2. Notification Settings (`notifications`)

| Setting | Category | CLIENT | PROVIDER | Other Roles | Notes |
|---------|----------|--------|----------|-------------|-------|
| `push.enabled` | UNIVERSAL | ✅ | ✅ | ✅ | Base toggle for all users |
| `push.newMessages` | UNIVERSAL | ✅ | ✅ | ✅ | All users receive messages |
| `push.jobMatches` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-focused**: Providers match with jobs, not clients |
| `push.bookingUpdates` | UNIVERSAL | ✅ | ✅ | ⚠️ | Both clients and providers track bookings |
| `push.paymentUpdates` | UNIVERSAL | ✅ | ✅ | ✅ | All users have payment transactions |
| `push.referralUpdates` | UNIVERSAL | ✅ | ✅ | ✅ | All users participate in referrals |
| `push.systemUpdates` | UNIVERSAL | ✅ | ✅ | ✅ | System notifications for all |
| `push.marketing` | UNIVERSAL | ✅ | ✅ | ✅ | Marketing opt-in/out for all |
| `email.enabled` | UNIVERSAL | ✅ | ✅ | ✅ | Base toggle for all users |
| `email.newMessages` | UNIVERSAL | ✅ | ✅ | ✅ | All users receive messages |
| `email.jobMatches` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-focused**: Only providers match with jobs |
| `email.bookingUpdates` | UNIVERSAL | ✅ | ✅ | ⚠️ | Both clients and providers track bookings |
| `email.paymentUpdates` | UNIVERSAL | ✅ | ✅ | ✅ | All users have payment transactions |
| `email.referralUpdates` | UNIVERSAL | ✅ | ✅ | ✅ | All users participate in referrals |
| `email.systemUpdates` | UNIVERSAL | ✅ | ✅ | ✅ | System notifications for all |
| `email.marketing` | UNIVERSAL | ✅ | ✅ | ✅ | Marketing opt-in/out for all |
| `email.weeklyDigest` | PROVIDER_ONLY | ❌ | ✅ | ⚠️ | **Provider-focused**: Weekly business summary (earnings, bookings, reviews) |
| `email.monthlyReport` | PROVIDER_ONLY | ❌ | ✅ | ⚠️ | **Provider-focused**: Monthly performance reports |
| `sms.enabled` | UNIVERSAL | ✅ | ✅ | ✅ | Base toggle for all users |
| `sms.urgentMessages` | UNIVERSAL | ✅ | ✅ | ✅ | Critical communications for all |
| `sms.bookingReminders` | UNIVERSAL | ✅ | ✅ | ⚠️ | Both clients and providers need reminders |
| `sms.paymentAlerts` | UNIVERSAL | ✅ | ✅ | ✅ | Payment notifications for all |
| `sms.securityAlerts` | UNIVERSAL | ✅ | ✅ | ✅ | Security notifications for all |

**Summary**:
- **UNIVERSAL**: Most notification settings (messages, bookings, payments, security)
- **PROVIDER_ONLY**: `jobMatches`, `weeklyDigest`, `monthlyReport`

---

## 3. Communication Preferences (`communication`)

| Setting | Category | CLIENT | PROVIDER | Other Roles | Notes |
|---------|----------|--------|----------|-------------|-------|
| `preferredLanguage` | UNIVERSAL | ✅ | ✅ | ✅ | UI language preference for all |
| `timezone` | UNIVERSAL | ✅ | ✅ | ✅ | Timezone for scheduling for all |
| `dateFormat` | UNIVERSAL | ✅ | ✅ | ✅ | Display preference for all |
| `timeFormat` | UNIVERSAL | ✅ | ✅ | ✅ | Display preference for all |
| `currency` | UNIVERSAL | ✅ | ✅ | ✅ | Currency preference for all |
| `autoReply.enabled` | PROVIDER_ONLY | ❌ | ✅ | ⚠️ | **Provider-focused**: Business auto-responders |
| `autoReply.message` | PROVIDER_ONLY | ❌ | ✅ | ⚠️ | **Provider-focused**: Professional auto-reply messages |

**Summary**:
- **UNIVERSAL**: `preferredLanguage`, `timezone`, `dateFormat`, `timeFormat`, `currency`
- **PROVIDER_ONLY**: `autoReply.enabled`, `autoReply.message`

---

## 4. Service Preferences (`service`) - **PROVIDER_ONLY CATEGORY**

**⚠️ IMPORTANT**: The entire `service` category is **PROVIDER_ONLY**. Clients do not offer services, set service radii, accept jobs, or configure working hours.

| Setting | Category | CLIENT | PROVIDER | Other Roles | Notes |
|---------|----------|--------|----------|-------------|-------|
| `defaultServiceRadius` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-only**: Defines service coverage area |
| `autoAcceptJobs` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-only**: Automatic job acceptance |
| `minimumJobValue` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-only**: Minimum job price filter |
| `maximumJobValue` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-only**: Maximum job price filter |
| `preferredJobTypes` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-only**: Preferred service categories |
| `workingHours.start` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-only**: Work schedule start time |
| `workingHours.end` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-only**: Work schedule end time |
| `workingHours.days` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-only**: Available work days |
| `emergencyService.enabled` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-only**: Emergency service availability |
| `emergencyService.surcharge` | PROVIDER_ONLY | ❌ | ✅ | ❌ | **Provider-only**: Emergency service pricing |

**Summary**: **ENTIRE CATEGORY IS PROVIDER_ONLY**

---

## 5. Payment Preferences (`payment`)

| Setting | Category | CLIENT | PROVIDER | Other Roles | Notes |
|---------|----------|--------|----------|-------------|-------|
| `preferredPaymentMethod` | UNIVERSAL | ✅ | ✅ | ✅ | Payment method for receiving/sending payments |
| `autoWithdraw.enabled` | PROVIDER_ONLY | ❌ | ✅ | ⚠️ | **Provider-focused**: Automatic earnings withdrawal |
| `autoWithdraw.threshold` | PROVIDER_ONLY | ❌ | ✅ | ⚠️ | **Provider-focused**: Minimum balance before withdrawal |
| `autoWithdraw.frequency` | PROVIDER_ONLY | ❌ | ✅ | ⚠️ | **Provider-focused**: Withdrawal schedule |
| `invoiceSettings.includeTax` | PROVIDER_ONLY | ❌ | ✅ | ⚠️ | **Provider-focused**: Invoice generation settings |
| `invoiceSettings.taxRate` | PROVIDER_ONLY | ❌ | ✅ | ⚠️ | **Provider-focused**: Tax calculation for invoices |
| `invoiceSettings.invoiceTemplate` | PROVIDER_ONLY | ❌ | ✅ | ⚠️ | **Provider-focused**: Invoice formatting |

**Summary**:
- **UNIVERSAL**: `preferredPaymentMethod`
- **PROVIDER_ONLY**: `autoWithdraw.*`, `invoiceSettings.*`

---

## 6. Security Settings (`security`)

| Setting | Category | CLIENT | PROVIDER | Other Roles | Notes |
|---------|----------|--------|----------|-------------|-------|
| `twoFactorAuth.enabled` | UNIVERSAL | ✅ | ✅ | ✅ | Security feature for all users |
| `twoFactorAuth.method` | UNIVERSAL | ✅ | ✅ | ✅ | 2FA method preference for all |
| `loginAlerts.enabled` | UNIVERSAL | ✅ | ✅ | ✅ | Security monitoring for all |
| `loginAlerts.newDevice` | UNIVERSAL | ✅ | ✅ | ✅ | Device monitoring for all |
| `loginAlerts.suspiciousActivity` | UNIVERSAL | ✅ | ✅ | ✅ | Threat detection for all |
| `sessionTimeout` | UNIVERSAL | ✅ | ✅ | ✅ | Session management for all |
| `passwordChangeReminder.enabled` | UNIVERSAL | ✅ | ✅ | ✅ | Security hygiene for all |
| `passwordChangeReminder.frequency` | UNIVERSAL | ✅ | ✅ | ✅ | Reminder schedule for all |

**Summary**: **ENTIRE CATEGORY IS UNIVERSAL**

---

## 7. App Preferences (`app`)

| Setting | Category | CLIENT | PROVIDER | Other Roles | Notes |
|---------|----------|--------|----------|-------------|-------|
| `theme` | UNIVERSAL | ✅ | ✅ | ✅ | UI theme for all users |
| `fontSize` | UNIVERSAL | ✅ | ✅ | ✅ | Accessibility setting for all |
| `soundEffects.enabled` | UNIVERSAL | ✅ | ✅ | ✅ | Audio preferences for all |
| `soundEffects.volume` | UNIVERSAL | ✅ | ✅ | ✅ | Volume control for all |
| `hapticFeedback.enabled` | UNIVERSAL | ✅ | ✅ | ✅ | Tactile feedback for all |
| `autoSave.enabled` | UNIVERSAL | ✅ | ✅ | ✅ | Form auto-save for all |
| `autoSave.interval` | UNIVERSAL | ✅ | ✅ | ✅ | Auto-save frequency for all |
| `dataUsage.imageQuality` | UNIVERSAL | ✅ | ✅ | ✅ | Data optimization for all |
| `dataUsage.videoQuality` | UNIVERSAL | ✅ | ✅ | ✅ | Data optimization for all |
| `dataUsage.autoDownload` | UNIVERSAL | ✅ | ✅ | ✅ | Download preferences for all |

**Summary**: **ENTIRE CATEGORY IS UNIVERSAL**

---

## 8. Analytics Settings (`analytics`)

| Setting | Category | CLIENT | PROVIDER | Other Roles | Notes |
|---------|----------|--------|----------|-------------|-------|
| `shareUsageData` | UNIVERSAL | ✅ | ✅ | ✅ | Usage analytics for all |
| `shareLocationData` | CONTEXT_DEPENDENT | ⚠️ | ✅ | ⚠️ | **Provider-focused**: More critical for service matching |
| `sharePerformanceData` | PROVIDER_ONLY | ❌ | ✅ | ⚠️ | **Provider-focused**: Business performance metrics |
| `personalizedRecommendations` | UNIVERSAL | ✅ | ✅ | ✅ | Recommendation engine for all |

**Summary**:
- **UNIVERSAL**: `shareUsageData`, `personalizedRecommendations`
- **PROVIDER_ONLY**: `sharePerformanceData`
- **CONTEXT_DEPENDENT**: `shareLocationData` (more important for providers)

---

## Summary by Category

### UNIVERSAL Settings (All Roles)
- **Privacy**: `profileVisibility`, `showPhoneNumber`, `showEmail`, `allowDirectMessages`, `allowReferralRequests`
- **Notifications**: Most settings except `jobMatches`, `weeklyDigest`, `monthlyReport`
- **Communication**: `preferredLanguage`, `timezone`, `dateFormat`, `timeFormat`, `currency`
- **Payment**: `preferredPaymentMethod`
- **Security**: All settings
- **App**: All settings
- **Analytics**: `shareUsageData`, `personalizedRecommendations`

### PROVIDER_ONLY Settings
- **Privacy**: `showPortfolio`, `allowJobInvitations`
- **Notifications**: `jobMatches` (push/email), `weeklyDigest`, `monthlyReport`
- **Communication**: `autoReply.enabled`, `autoReply.message`
- **Service**: **ENTIRE CATEGORY** (10 settings)
- **Payment**: `autoWithdraw.*`, `invoiceSettings.*`
- **Analytics**: `sharePerformanceData`

### CONTEXT_DEPENDENT Settings
- **Privacy**: `showLocation`, `showRating` (more important for providers)
- **Analytics**: `shareLocationData` (more important for providers)

---

## Recommendations for Implementation

### 1. Role-Based Settings Visibility
- **Hide provider-only settings** from CLIENT role users in the UI
- **Show provider settings** only when user has PROVIDER, AGENCY_OWNER, or AGENCY_ADMIN roles
- **Conditionally show** context-dependent settings based on user's primary role

### 2. Validation Rules
- Add role-based validation to prevent clients from setting `service.*` preferences
- Validate `allowJobInvitations` only applies to providers
- Validate `autoWithdraw` settings only for users with earning capabilities

### 3. Default Settings by Role
- **CLIENT defaults**: Disable provider-only settings or set to null
- **PROVIDER defaults**: Enable relevant provider features with sensible defaults
- **MULTI-ROLE users**: Show settings relevant to their active roles

### 4. API Endpoints
- Consider role-based filtering in GET `/api/settings/user` to return only relevant settings
- Add validation in PUT `/api/settings/user` to reject provider-only settings from clients

### 5. UI/UX Considerations
- Group settings by role applicability in settings UI
- Show tooltips explaining why certain settings are unavailable
- Provide upgrade prompts for clients who might benefit from provider features

---

## Settings Count Summary

| Category | Total Settings | UNIVERSAL | PROVIDER_ONLY | CONTEXT_DEPENDENT |
|----------|---------------|-----------|----------------|-------------------|
| Privacy | 9 | 5 | 2 | 2 |
| Notifications | 21 | 18 | 3 | 0 |
| Communication | 6 | 5 | 1 | 0 |
| Service | 10 | 0 | 10 | 0 |
| Payment | 7 | 1 | 6 | 0 |
| Security | 7 | 7 | 0 | 0 |
| App | 9 | 9 | 0 | 0 |
| Analytics | 4 | 2 | 1 | 1 |
| **TOTAL** | **73** | **47** | **23** | **4** |

**Percentage Distribution**:
- **UNIVERSAL**: 64.4% (47/73)
- **PROVIDER_ONLY**: 31.5% (23/73)
- **CONTEXT_DEPENDENT**: 5.5% (4/73)

---

## Conclusion

While most settings (64.4%) are universal, a significant portion (31.5%) are provider-only. This suggests:
1. The settings system is designed with service providers in mind
2. Clients have a simpler, more focused settings experience
3. Role-based filtering would improve UX and reduce confusion
4. Multi-role users need careful consideration for settings visibility

Implementation of role-based settings filtering would significantly improve the user experience and reduce support burden.

