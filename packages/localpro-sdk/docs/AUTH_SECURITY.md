# Auth Security Hardening — Developer Reference

> **Applies to:** LocalPro API v2 · SDK `lib/auth.js` · SDK `lib/oauthTokens.js`  
> **Last updated:** 2026-02-24

This document describes every security improvement applied to the auth feature in the v2 hardening pass. It is the canonical reference for backend engineers, SDK consumers, and support staff.

---

## Table of Contents

1. [Password Strength Rules](#1-password-strength-rules)
2. [Cryptographically Secure OTP](#2-cryptographically-secure-otp)
3. [JWT Claims: `sub` + `jti`](#3-jwt-claims-sub--jti)
4. [JWT Blocklist on Logout](#4-jwt-blocklist-on-logout)
5. [Multi-Device Refresh Tokens](#5-multi-device-refresh-tokens)
6. [Brute-Force Lockout on Email Login](#6-brute-force-lockout-on-email-login)
7. [TOTP: speakeasy → otplib](#7-totp-speakeasy--otplib)
8. [Rate Limiting (Activated)](#8-rate-limiting-activated)
9. [Magic Link (Passwordless Login)](#9-magic-link-passwordless-login)
10. [PKCE OAuth2 Authorization Code Flow](#10-pkce-oauth2-authorization-code-flow)
11. [Security Audit Log](#11-security-audit-log)
12. [Extracted Services](#12-extracted-services)
13. [New Mongoose Models](#13-new-mongoose-models)
14. [SDK Methods](#14-sdk-methods)

---

## 1. Password Strength Rules

**File:** `features/auth/controllers/authController.js` → `validatePassword()`

Passwords must now satisfy **all** of the following:

| Rule | Detail |
|---|---|
| Minimum length | 8 characters |
| Uppercase letter | At least one `A-Z` |
| Lowercase letter | At least one `a-z` |
| Digit | At least one `0-9` |
| Special character | At least one of `@ $ ! % * ? & ^ # - _ + =` |
| Not all-repeat | Must not be a single character repeated (e.g. `aaaaaaaa`) |

**HTTP response on failure:** `400 Bad Request`

```json
{
  "success": false,
  "message": "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
}
```

---

## 2. Cryptographically Secure OTP

**File:** `features/auth/controllers/authController.js` → `generateOTP()`

OTPs (6-digit numeric) are now generated with Node.js `crypto.randomInt(100000, 1000000)` instead of `Math.random()`. This produces statistically uniform, cryptographically random values suitable for security tokens.

---

## 3. JWT Claims: `sub` + `jti`

**File:** `features/auth/services/tokenService.js` → `generateToken()`

Every access token now includes:

| Claim | Value | Purpose |
|---|---|---|
| `sub` | `user._id.toString()` | RFC 7519 standard subject identifier |
| `jti` | `crypto.randomUUID()` | Unique token ID used for revocation |
| `id` | `user._id` | Backward-compatible field (kept) |

The `jti` claim enables per-token revocation without invalidating the signing secret.

---

## 4. JWT Blocklist on Logout

**Files:**
- `src/models/TokenBlocklist.js` — MongoDB collection with TTL
- `src/middleware/accessTokenAuth.js` — blocklist check on every authenticated request

### How it works

1. On `POST /api/auth/logout`, the server reads `req.jwtPayload.jti` (attached by auth middleware) and `req.jwtPayload.exp`.
2. It calls `TokenBlocklist.block(jti, userId, expiresAt)` to store the revoked token ID.
3. The TTL index on `expiresAt` automatically purges expired entries — no manual cleanup needed.
4. On every subsequent request, `accessTokenAuth` middleware checks `TokenBlocklist.isBlocked(jti)` **before** passing control to the route handler.

### Logout body (optional)

```json
{
  "refreshToken": "<opaque refresh token string>"
}
```

Providing `refreshToken` also revokes the refresh token from the `RefreshToken` collection (all devices, or just the one).

---

## 5. Multi-Device Refresh Tokens

**Files:**
- `src/models/RefreshToken.js` — per-session refresh token documents
- `features/auth/services/tokenService.js` — `issueRefreshToken`, `rotateRefreshToken`, `revokeRefreshToken`, `revokeAllRefreshTokens`

Previously a single `user.refreshToken` field was stored on the User document, allowing only one active session. Now each session has its own `RefreshToken` document.

### RefreshToken document shape

```js
{
  token: String,       // opaque 64-byte hex
  userId: ObjectId,
  deviceId: String,    // optional client-supplied ID
  deviceType: String,  // "mobile" | "web" | "desktop" | ...
  userAgent: String,
  ipAddress: String,
  revokedAt: Date,     // set on revocation
  lastUsedAt: Date,
  expiresAt: Date      // TTL — auto-purged after expiry
}
```

### Service API

```js
const tokenService = require('features/auth/services/tokenService');

// Issue a new refresh token for a user/device
const { token } = await tokenService.issueRefreshToken(userId, {
  deviceId, deviceType, userAgent, ipAddress
});

// Rotate (invalidate old, issue new)
const { token: newToken } = await tokenService.rotateRefreshToken(oldToken, deviceInfo);

// Revoke one refresh token
await tokenService.revokeRefreshToken(token);

// Revoke all tokens except optionally one (logout everywhere)
await tokenService.revokeAllRefreshTokens(userId, exceptToken);
```

---

## 6. Brute-Force Lockout on Email Login

**File:** `features/auth/controllers/authController.js` → `loginWithEmail()`

The `loginWithEmail` handler now calls the User model methods that were already implemented but never wired:

- `user.isAccountLocked()` — returns `true` if the account is currently locked; checked **before** password verification.
- `user.recordLoginAttempt(false, ipAddress)` — increments failed attempt counter on wrong password.
- `user.recordLoginAttempt(true)` — resets counter on successful login.

### HTTP response when locked

**`423 Locked`**

```json
{
  "success": false,
  "message": "Account is temporarily locked. Please try again later.",
  "lockedUntil": "2026-02-24T12:30:00.000Z"
}
```

A `SecurityAuditLog` entry with event `login_locked` is written each time a locked account is attempted.

---

## 7. TOTP: speakeasy → otplib

**File:** `features/auth/controllers/accountSecurityController.js`

`speakeasy` (unmaintained since 2018) has been replaced with `otplib` 13.x.

| Action | Before | After |
|---|---|---|
| Generate secret | `speakeasy.generateSecret({ length: 32 })` | `authenticator.generateSecret(20)` |
| Generate QR URI | `speakeasy.otpauthURL(...)` | `authenticator.keyuri(account, 'LocalPro', secret)` |
| Verify token | `speakeasy.totp.verify({ token, secret, window: 1 })` | `authenticator.verify({ token, secret })` (window: 1 set globally) |

The TOTP secret format is compatible — existing user secrets do **not** need to be re-enrolled.

The `install` command used:

```bash
pnpm add otplib
```

---

## 8. Rate Limiting (Activated)

**File:** `src/middleware/rateLimiter.js`

All limiters were previously no-op pass-throughs (`(req, res, next) => next()`). They are now real `express-rate-limit` instances.

| Limiter export | Window | Max requests | Applied to |
|---|---|---|---|
| `authLimiter` | 15 min | 20 | Login, register, magic link |
| `smsLimiter` | 10 min | 5 | Send SMS OTP |
| `uploadLimiter` | 10 min | 10 | Avatar + portfolio upload |
| `generalLimiter` | 15 min | 200 | General API |
| `searchLimiter` | 1 min | 60 | Search endpoints |
| `paymentLimiter` | 15 min | 15 | Payment endpoints |
| `marketplaceLimiter` | 1 min | 120 | Marketplace |

### Disabling in development / CI

Set `DISABLE_RATE_LIMIT=true` in your `.env` to bypass all limiters. **Never set this in production.**

```env
DISABLE_RATE_LIMIT=true
```

---

## 9. Magic Link (Passwordless Login)

**Files:**
- `features/auth/controllers/authController.js` — `sendMagicLink`, `verifyMagicLink`
- `features/auth/routes/auth.js` — `POST /api/auth/magic-link`, `GET /api/auth/magic-link/verify`
- `features/auth/services/tokenService.js` — `generateMagicLinkToken`, `verifyMagicLinkToken`

### Flow

```
Client                          Server
  |                                |
  |-- POST /api/auth/magic-link -->|  (body: { email })
  |                                |  1. Look up user by email
  |                                |  2. Generate 15-min JWT (type: "magic_link", jti: uuid)
  |                                |  3. Send email with link containing ?token=<jwt>
  |<-- 200 OK (always) -----------|  Anti-enumeration: same response whether email exists or not
  |                                |
  |-- GET /api/auth/magic-link/   |
  |       verify?token=<jwt> ---->|  4. Verify JWT signature + type
  |                                |  5. Check TokenBlocklist (one-time use enforcement)
  |                                |  6. Block the JTI immediately
  |                                |  7. Issue access token + refresh token
  |<-- 200 { accessToken, ... }---|
```

### Request — Send magic link

```
POST /api/auth/magic-link
Content-Type: application/json

{ "email": "user@example.com" }
```

**Response (always 200)**

```json
{
  "success": true,
  "message": "If that email is registered, a magic link has been sent."
}
```

### Request — Verify magic link

```
GET /api/auth/magic-link/verify?token=<jwt>
```

**Success response**

```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJ...",
  "refreshToken": "a3f...",
  "user": { ... }
}
```

**Failure (expired or already used)**

```json
{
  "success": false,
  "message": "Magic link is invalid or has expired"
}
```

### SDK usage

```js
// Step 1 – send the link
await client.auth.sendMagicLink({ email: 'user@example.com' });

// Step 2 – verify (called by your redirect handler)
const result = await client.auth.verifyMagicLink(token);
client.setToken(result.accessToken);
```

---

## 10. PKCE OAuth2 Authorization Code Flow

**Files:**
- `src/models/AuthorizationCode.js` — short-lived code documents (10 min TTL)
- `features/auth/controllers/accessTokenController.js` — `authorize`, updated `exchangeToken`
- `features/auth/routes/oauth.js` — `POST /api/oauth/authorize`, updated `/api/oauth/token`

### Full PKCE flow (RFC 7636)

```
Client                           Server
  |                                 |
  |  Generate code_verifier         |
  |  code_challenge =               |
  |    BASE64URL(SHA256(verifier))   |
  |                                 |
  |-- POST /api/oauth/authorize -->-|  Requires bearer auth (logged-in user)
  |   { client_id,                  |  1. Validates client_id (API key)
  |     redirect_uri,               |  2. Stores code + code_challenge (S256)
  |     code_challenge,             |  3. Returns { code, state }
  |     code_challenge_method: S256 |
  |     state }                     |
  |<-- { code, state } ------------|
  |                                 |
  |-- POST /api/oauth/token ------->|  4. SHA256(code_verifier) must equal stored code_challenge
  |   { grant_type:                 |  5. Marks code as used (single use)
  |       "authorization_code",     |  6. Issues access + refresh tokens
  |     code, redirect_uri,         |
  |     code_verifier,              |
  |     client_id }                 |
  |<-- { access_token, ... } ------|
```

### `POST /api/oauth/authorize` — Create authorization code

**Headers:** `Authorization: Bearer <user_access_token>`

```json
{
  "client_id": "lp_key_abc123",
  "redirect_uri": "https://yourapp.com/callback",
  "scope": "read:profile write:jobs",
  "state": "random_csrf_state",
  "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  "code_challenge_method": "S256"
}
```

**Response**

```json
{
  "success": true,
  "code": "lp_code_...",
  "state": "random_csrf_state",
  "expiresIn": 600
}
```

### `POST /api/oauth/token` — Exchange code for tokens (PKCE)

```json
{
  "grant_type": "authorization_code",
  "code": "lp_code_...",
  "redirect_uri": "https://yourapp.com/callback",
  "client_id": "lp_key_abc123",
  "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
}
```

**Response**

```json
{
  "success": true,
  "access_token": "eyJ...",
  "refresh_token": "b7e...",
  "token_type": "Bearer",
  "expires_in": 900,
  "scope": "read:profile write:jobs"
}
```

Only `code_challenge_method: S256` is accepted. Plain PKCE (`plain`) is rejected.

### SDK usage

```js
// Step 1 – start the PKCE flow (client generates verifier/challenge)
const result = await client.oauth.authorize({
  client_id: 'lp_key_abc123',
  redirect_uri: 'https://yourapp.com/callback',
  code_challenge: challenge,
  code_challenge_method: 'S256',
  state: csrfState
});

// Step 2 – exchange code for tokens
const tokens = await client.oauth.exchangeToken({
  grant_type: 'authorization_code',
  code: result.code,
  redirect_uri: 'https://yourapp.com/callback',
  client_id: 'lp_key_abc123',
  code_verifier: verifier
});
```

---

## 11. Security Audit Log

**File:** `src/models/SecurityAuditLog.js`

An immutable, append-only audit trail stored in MongoDB with a **90-day TTL** (auto-purged).

### Logged events

| Event | Trigger |
|---|---|
| `login_success` | Successful email/phone/MPIN login |
| `login_failed` | Wrong password |
| `login_locked` | Login attempt on a locked account |
| `logout` | `POST /api/auth/logout` |
| `magic_link_sent` | `POST /api/auth/magic-link` |
| `magic_link_used` | `GET /api/auth/magic-link/verify` success |
| `password_changed` | `changePassword` |
| `2fa_enabled` | `verify2FA` success |
| `2fa_disabled` | `disable2FA` |
| `2fa_backup_codes_regenerated` | `regenerateBackupCodes` |
| `session_revoked` | Refresh token revoked |
| `gdpr_consent_given` | GDPR consent granted |
| `gdpr_consent_withdrawn` | GDPR consent withdrawn |
| `deletion_requested` | Account deletion requested |
| `deletion_cancelled` | Account deletion cancelled |
| `data_export_requested` | Data export triggered |

### Logging API (server-side only)

```js
const SecurityAuditLog = require('src/models/SecurityAuditLog');

// Fire-and-forget — errors are silently swallowed to never block request handling
SecurityAuditLog.log(userId, 'login_success', {
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  metadata: { email: user.email }
});
```

### Document shape

```js
{
  userId: ObjectId,
  event: String,       // one of the 38 event types
  ipAddress: String,
  userAgent: String,
  metadata: Mixed,     // freeform context
  createdAt: Date      // TTL field — purged after 90 days
}
```

---

## 12. Extracted Services

### `features/auth/services/tokenService.js`

Centralizes all token operations that were previously scattered across controllers.

| Export | Description |
|---|---|
| `generateToken(user)` | Creates a signed JWT with `sub`, `jti`, `id`, `role` |
| `issueRefreshToken(userId, deviceInfo)` | Creates a `RefreshToken` document |
| `rotateRefreshToken(token, deviceInfo)` | Revokes old, issues new refresh token |
| `revokeRefreshToken(token)` | Marks one refresh token as revoked |
| `revokeAllRefreshTokens(userId, exceptToken)` | Revokes all refresh tokens for a user |
| `isTokenBlocked(jti)` | Checks `TokenBlocklist` for a JTI |
| `blockToken(jti, userId, expiresAt)` | Adds a JTI to the blocklist |
| `generateMagicLinkToken(userId)` | Issues a 15-min JWT with `type: "magic_link"` |
| `verifyMagicLinkToken(token)` | Verifies signature, type, and blocklist status |

### `features/auth/services/privacyService.js`

Extracted from `privacyController.js`. All methods throw errors with a `.status` property for the HTTP layer.

| Export | Description |
|---|---|
| `getConsentStatus(userId)` | Returns full GDPR consent state |
| `giveGdprConsent(userId, data)` | Records GDPR consent |
| `withdrawGdprConsent(userId, data)` | Withdraws GDPR consent |
| `updateMarketingConsent(userId, data)` | Updates marketing preferences |
| `setDoNotSell(userId, value)` | CCPA do-not-sell flag |
| `setDoNotTrack(userId, value)` | DNT flag |
| `requestAccountDeletion(userId, data)` | Schedules account deletion |
| `cancelAccountDeletion(userId)` | Cancels pending deletion |
| `getDeletionStatus(userId)` | Returns deletion request status |
| `exportUserData(userId)` | Triggers GDPR data export |
| `acceptAgreement(userId, data)` | Records agreement acceptance |
| `getAcceptedAgreements(userId)` | Lists accepted agreements |
| `checkAgreement(userId, type)` | Checks a specific agreement |
| `getPrivacySettings(userId)` | Returns all privacy settings |

---

## 13. New Mongoose Models

### `TokenBlocklist`
- **Collection:** `tokenblocklists`
- **TTL:** automatic (mirrors token `expiresAt`)
- **Purpose:** JWT revocation store (logout + magic link one-time-use)
- **Statics:** `isBlocked(jti)` → `boolean`, `block(jti, userId, expiresAt)`

### `RefreshToken`
- **Collection:** `refreshtokens`
- **TTL:** 30 days (configurable via `expiresAt`)
- **Purpose:** Multi-device session management
- **Statics:** `issue(userId, deviceInfo)`, `findActive(token)`, `revoke(token)`, `revokeAll(userId, exceptToken)`, `rotate(oldToken, deviceInfo)`

### `SecurityAuditLog`
- **Collection:** `securityauditlogs`
- **TTL:** 90 days
- **Purpose:** Immutable security event trail
- **Statics:** `log(userId, event, context)` — fire-and-forget

### `AuthorizationCode`
- **Collection:** `authorizationcodes`
- **TTL:** 10 minutes
- **Purpose:** PKCE OAuth2 authorization codes (single-use)
- **Statics:** `issue(params)`, `findValid(code, clientId)`, `verifyPKCE(codeVerifier, codeChallenge)`

---

## 14. SDK Methods

### `client.auth` — new methods

| Method | Endpoint | Description |
|---|---|---|
| `sendMagicLink({ email })` | `POST /api/auth/magic-link` | Send passwordless login link |
| `verifyMagicLink(token)` | `GET /api/auth/magic-link/verify?token=` | Verify magic link and get tokens |
| `logout(refreshToken?)` | `POST /api/auth/logout` | Logout + revoke tokens |

### `client.oauth` — new methods

| Method | Endpoint | Description |
|---|---|---|
| `authorize(data)` | `POST /api/oauth/authorize` | Create PKCE authorization code |
| `exchangeToken(data)` | `POST /api/oauth/token` | Exchange code or credentials for tokens (now supports `authorization_code`) |

See [SDK Methods](#14-sdk-methods) for full signatures and [lib/auth.js](../lib/auth.js) / [lib/oauthTokens.js](../lib/oauthTokens.js) for the implementation.
