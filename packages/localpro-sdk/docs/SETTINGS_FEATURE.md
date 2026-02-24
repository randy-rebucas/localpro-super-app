# Settings Feature — Developer Reference

## Overview

The Settings feature manages two distinct domains:

1. **User Settings** — per-user preferences for privacy, notifications, communication, service, payment, security, and analytics.
2. **App Settings** — global platform configuration administered exclusively by admin roles; governs feature flags, upload constraints, payment defaults, and maintenance mode.

A lightweight **in-memory cache** (60-second TTL) protects the `/app/public` endpoint from repeated database reads during high-traffic periods, with automatic fallback to defaults when the database is unavailable or times out (2 s threshold).

---

## Architecture

```
features/settings/
├── controllers/settingsController.js   # 11 handlers, in-memory cache for public settings
├── models/AppSettings.js               # Mongoose model with getCurrentSettings() static
├── routes/settings.js                  # Express router; public routes exempt from rate limit
└── index.js

features/users/models/UserSettings.js   # Mongoose model for per-user preferences

packages/localpro-sdk/lib/settings.js   # SDK SettingsAPI class (11 methods)
```

---

## Endpoints

### User Settings (auth required)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/api/settings/user` | `getUserSettings` | Fetch current user's settings |
| `PUT` | `/api/settings/user` | `updateUserSettings` | Merge-update all user settings |
| `PUT` | `/api/settings/user/:category` | `updateUserSettingsCategory` | Update one category only |
| `POST` | `/api/settings/user/reset` | `resetUserSettings` | Restore defaults |
| `DELETE` | `/api/settings/user` | `deleteUserSettings` | Remove user settings document |
| `GET` | `/api/settings` | `getUserSettings` | Documented alias |
| `PUT` | `/api/settings` | `updateUserSettings` | Documented alias |

**Valid `:category` values (user):** `privacy`, `notifications`, `communication`, `service`, `payment`, `security`, `app`, `analytics`

### App Settings (auth + admin role required)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/api/settings/app` | `getAppSettings` | Full admin app settings |
| `PUT` | `/api/settings/app` | `updateAppSettings` | Merge-update all app settings |
| `PUT` | `/api/settings/app/:category` | `updateAppSettingsCategory` | Update one category only |
| `POST` | `/api/settings/app/features/toggle` | `toggleFeatureFlag` | Enable/disable a feature flag |

**Valid `:category` values (app):** `general`, `business`, `features`, `uploads`, `payments`, `notifications`, `integrations`, `security`

### Public / No-Auth

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/api/settings/app/public` | `getPublicAppSettings` | Cached public settings snapshot |
| `GET` | `/api/settings/app/health` | `getAppHealth` | Platform health + feature-flag summary |

> **Note:** Public routes are defined before `router.use(settingsLimiter)` and are therefore **exempt** from the rate limiter.

---

## Rate Limiting

| Limiter | Window | Max | Header Code |
|---------|--------|-----|-------------|
| `settingsLimiter` | 60 s | 60 req | `SETTINGS_RATE_LIMIT` |

Applied via `router.use(settingsLimiter)` after the public routes in [features/settings/routes/settings.js](../../../features/settings/routes/settings.js).

---

## Error Handling

All catch blocks in the controller use `sendServerError(res, error, message, code)` from `src/utils/responseHelper`. This prevents raw `error.message` from leaking to API consumers in production while logging full stack traces server-side via `logger.error`.

**Error codes:**

| Code | Handler |
|------|---------|
| `GET_USER_SETTINGS_ERROR` | `getUserSettings` |
| `UPDATE_USER_SETTINGS_ERROR` | `updateUserSettings` |
| `UPDATE_USER_SETTINGS_CATEGORY_ERROR` | `updateUserSettingsCategory` |
| `RESET_USER_SETTINGS_ERROR` | `resetUserSettings` |
| `DELETE_USER_SETTINGS_ERROR` | `deleteUserSettings` |
| `GET_APP_SETTINGS_ERROR` | `getAppSettings` |
| `UPDATE_APP_SETTINGS_ERROR` | `updateAppSettings` |
| `UPDATE_APP_SETTINGS_CATEGORY_ERROR` | `updateAppSettingsCategory` |
| `TOGGLE_FEATURE_FLAG_ERROR` | `toggleFeatureFlag` |
| `GET_APP_HEALTH_ERROR` | `getAppHealth` |

> `getPublicAppSettings` handles its own errors inline and always returns HTTP 200 with a fallback payload — it never returns a 500.

---

## Public Settings Cache

```
publicSettingsCache = { data, timestamp, TTL: 60_000 }
```

- **Read order:** cache → database (with 2 s timeout) → defaults
- **Invalidation:** explicit call to `invalidatePublicSettingsCache()` after any admin write (`updateAppSettings`, `updateAppSettingsCategory`, `toggleFeatureFlag`)
- **Fallback priority:** stale cache → `getDefaultPublicSettings()`

---

## SDK — `SettingsAPI`

```js
const sdk = new LocalProSDK({ baseURL: '...', token: 'JWT' });

// User
await sdk.settings.getUserSettings();
await sdk.settings.updateUserSettings({ privacy: { showEmail: false } });
await sdk.settings.updateUserSettingsCategory('notifications', { push: { enabled: false } });
await sdk.settings.resetUserSettings();
await sdk.settings.deleteUserSettings();

// App (admin)
await sdk.settings.getAppSettings();
await sdk.settings.updateAppSettings({ general: { maintenanceMode: { enabled: false } } });
await sdk.settings.updateAppSettingsCategory('payments', { defaultCurrency: 'PHP' });
await sdk.settings.toggleFeatureFlag({ feature: 'referrals', enabled: false });

// Public / no-auth
await sdk.settings.getPublicAppSettings();
await sdk.settings.getAppHealth();
```

### Input Validation Guards

The SDK throws synchronously (before any network call) for invalid arguments:

| Method | Guard |
|--------|-------|
| `updateUserSettings(data)` | `data` must be a non-null, non-array object |
| `updateUserSettingsCategory(category, data)` | `category` non-empty string; `data` non-null object |
| `updateAppSettings(data)` | `data` must be a non-null, non-array object |
| `updateAppSettingsCategory(category, data)` | `category` non-empty string; `data` non-null object |
| `toggleFeatureFlag(data)` | `data.feature` non-empty string; `data.enabled` boolean |

---

## Hardening Changelog

| Version | Change |
|---------|--------|
| v2 | Added `settingsLimiter` (60 req/min); applied via `router.use()` after public routes |
| v2 | Replaced all `console.error` + `res.status(500).json({ error: error.message })` (10 handlers) with `logger.error` + `sendServerError` — eliminates `error.message` information leak in production |
| v2 | SDK: added class-level `@classdesc` + `@example`; added synchronous input validation guards to 5 mutating methods |
| v2 | SDK: improved `@param` JSDoc on `updateAppSettingsCategory` with full category list |
