# User Management Feature Reference

Admin and agency-level operations on user accounts: listing, CRUD, status management, role/badge management, ban/restore lifecycle, password reset, email dispatch, and GDPR data export.

---

## 1. Architecture Overview

```
features/users/
  controllers/
    userManagementController.js   — 20 handlers, all admin-gated
  routes/
    userManagement.js             — Express router, auth + userManagementLimiter on all routes
  models/
    UserManagement.js             — tracks status, deletedAt, lastLoginAt, notes
    UserActivity.js               — activity feed per user
    UserTrust.js                  — trust scores, badges, verification flags
    UserSettings.js               — user preferences

src/
  models/
    ApiKey.js                     — API keys per user
    AccessToken.js                — access tokens per user

features/
  finance/models/UserWallet.js    — wallet balance
  agencies/models/UserAgency.js   — agency membership
  provider/models/Provider.js     — provider profile (auto-joined when role = provider)
```

**Data-flow summary:** All routes pass through `auth` middleware (JWT validation) then `userManagementLimiter`. The controller reads from the `User` model and up to 6 satellite models per request. Write operations log an audit entry via `auditLogger` and may dispatch an email via `EmailService`.

---

## 2. Configuration

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Validates Bearer token on every request |
| `EMAIL_*` | No | EmailService credentials — status/ban/reset emails degrade gracefully if missing |

---

## 3. Rate Limiting

| Limiter | Window | Max | Applied to |
|---|---|---|---|
| `userManagementLimiter` | 1 min | 60 req | All `/api/users/*` routes |

---

## 4. Endpoints

### 4.1 List Users
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/users` |
| **Auth** | admin, agency_admin, agency_owner, partner |

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Results per page |
| `role` | string / string[] | — | Filter by role(s) |
| `isActive` | boolean | — | Filter active/inactive |
| `isVerified` | boolean | — | Filter verified |
| `search` | string | — | Name, email, or phone search |
| `sortBy` | string | `createdAt` | Sort field |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `includeDeleted` | boolean | `false` | Include soft-deleted |
| `registrationMethod` | string | — | `partner`, `direct`, or `admin` |
| `partnerId` | string | — | Filter by partner ID |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "users": [ { ...userObject, "lastLoginAt": "...", "isDeleted": false } ],
    "pagination": { "current": 1, "pages": 5, "total": 48, "limit": 10 }
  }
}
```

---

### 4.2 Get User Stats
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/users/stats` |
| **Auth** | admin, agency_admin, agency_owner, partner |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "activeUsers": 87,
    "verifiedUsers": 60,
    "usersByRole": [ { "_id": "provider", "count": 30 } ],
    "recentUsers": [ ... ],
    "topRatedUsers": [ ... ]
  }
}
```

---

### 4.3 Get User by ID
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/users/:id` |
| **Auth** | admin, agency_admin, agency_owner, provider, client, partner |

Joins: provider profile, wallet, trust, referral, settings, management, activity, agency, apiKeys, accessTokens (last 10).

**Error 400:** Invalid ObjectId format  
**Success 200:** Full user object with all populated sub-documents.

---

### 4.4 Create User
| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/users` |
| **Auth** | admin, partner |

**Request body:**
```json
{
  "phoneNumber": "+639171234567",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "gender": "male",
  "birthdate": "1990-01-15",
  "registrationMethod": "admin",
  "partnerId": "optional-partner-id"
}
```

**Success 201:** Created user object.  
**Error 400:** Missing required fields, duplicate phone/email, invalid gender.

---

### 4.5 Update User
| | |
|---|---|
| **Method** | `PUT` |
| **Path** | `/api/users/:id` |
| **Auth** | admin, agency_admin, agency_owner, provider, client |

Supports nested `profile` deep-merge, GeoJSON coordinate conversion, phone uniqueness check.  
**Error 400:** Invalid ObjectId, soft-deleted user, duplicate phone, invalid gender, validation fail.

---

### 4.6 Delete User (Soft)
| | |
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/users/:id` |
| **Auth** | admin |

Sets `UserManagement.deletedAt`. Cannot delete admin users.  
**Error 400:** Already deleted, ObjectId invalid.  
**Error 403:** Target is an admin.

---

### 4.7 Restore User
| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/users/:id/restore` |
| **Auth** | admin |

Clears `UserManagement.deletedAt`.  
**Error 400:** User is not deleted, ObjectId invalid.

---

### 4.8 Update User Status
| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/users/:id/status` |
| **Auth** | admin, agency_admin, partner |

**Request body:** `{ "isActive": false, "reason": "Inactive account" }`  
Sends activation/deactivation email. Agency admins can only act on users in their own agency.  
**Error 400:** ObjectId invalid, update fails.  
**Error 403:** Not in same agency.

---

### 4.9 Update User Verification
| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/users/:id/verification` |
| **Auth** | admin, agency_admin |

**Request body:** `{ "verification": { "phoneVerified": true, "emailVerified": true } }`  
Updates `UserTrust` flags and recalculates trust score.  
**Error 400:** ObjectId invalid.  
**Error 403:** Not in same agency.

---

### 4.10 Bulk Update Users
| | |
|---|---|
| **Method** | `PATCH` |
| **Path** | `/api/users/bulk` |
| **Auth** | admin |

**Request body:** `{ "userIds": ["id1", "id2"], "updateData": { "isActive": true } }`  
Strips sensitive fields (`_id`, `createdAt`, `verificationCode`) from `updateData`.  
**Error 400:** Empty `userIds` or `updateData`.

---

### 4.11 Ban User
| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/users/:id/ban` |
| **Auth** | admin |

Sets `UserManagement.status = 'banned'`, `isActive = false`. Sends ban notification email.  
**Error 400:** ObjectId invalid.

---

### 4.12 Get User Roles
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/users/:id/roles` |
| **Auth** | admin, agency_admin, agency_owner, partner |

**Success 200:** `{ "userId": "...", "roles": ["provider", "client"] }`

---

### 4.13 Update User Roles
| | |
|---|---|
| **Method** | `PUT` |
| **Path** | `/api/users/:id/roles` |
| **Auth** | admin |

**Request body:** `{ "roles": ["client", "provider"] }`  
Valid roles: `client`, `provider`, `admin`, `supplier`, `instructor`, `agency_owner`, `agency_admin`, `partner`, `staff`.  
**Error 400:** ObjectId invalid, invalid role values, not an array.

---

### 4.14 Add Badge
| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/users/:id/badges` |
| **Auth** | admin, agency_admin |

**Request body:** `{ "type": "top_rated", "description": "Optional description" }`  
Valid types: `verified_provider`, `top_rated`, `fast_response`, `reliable`, `expert`, `newcomer`, `trusted`.  
**Error 400:** ObjectId invalid, invalid badge type.

---

### 4.15 Get Badges
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/users/:id/badges` |
| **Auth** | admin, agency_admin, agency_owner, partner |

---

### 4.16 Delete Badge
| | |
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/users/:id/badges/:badgeId` |
| **Auth** | admin, agency_admin, partner |

**Error 400:** Invalid ObjectId for `id` or `badgeId`.  
**Error 404:** Badge not found.

---

### 4.17 Reset Password
| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/users/:id/reset-password` |
| **Auth** | admin, partner |

**Request body:** `{ "sendEmail": true }`  
Generates a 12-char random password, hashes it via the pre-save hook, optionally emails it.  
If `sendEmail = false`, returns `temporaryPassword` in the response.

---

### 4.18 Send Email to User
| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/users/:id/send-email` |
| **Auth** | admin, agency_admin, agency_owner, partner |

**Request body:** `{ "subject": "Hello", "message": "Plain or HTML body", "template": "optional-template", "templateData": {} }`  
**Error 400:** Missing subject/message, user has no email.

---

### 4.19 Export User Data
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/users/:id/export` |
| **Auth** | admin, partner |
| **Query** | `?format=json` or `?format=csv` (default: json) |

Returns full export: user, provider, management, wallet, last 100 activities.  
Response is file attachment (`Content-Disposition`).

---

### 4.20 Get User Notes
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/users/:id/notes` |
| **Auth** | admin, agency_admin, agency_owner, partner |
| **Query** | `limit`, `skip`, `sortBy`, `sortOrder` |

Returns admin notes from `UserManagement.notes` (only where `addedBy != null`).

---

## 5. v2 Fix Log

| # | Issue | Root Cause | Fix Applied |
|---|---|---|---|
| 1 | `this.client.client.get/post/etc` in SDK | Old wrong pattern — double `.client` | Replaced all 18 SDK methods with `this.client.get/post/etc` |
| 2 | No JSDoc on any SDK method | Never written | Added full JSDoc (`@param`, `@returns`, `@throws`) to all 18 methods |
| 3 | No input validation in SDK | Stubs had no guards | Added required-field guards with `throw new Error` before every request |
| 4 | `list()` used `.then(r => r.data)` pattern | Inconsistent with rest of SDK | Changed to `return this.client.get(...)` — interceptor unwraps automatically |
| 5 | No rate limiting on any route | Route file missing limiter | Added `userManagementLimiter` (60 req/min) and `router.use(userManagementLimiter)` |
| 6 | `console.log('Get all users query params:', req.query)` — PII leak | Debug log left in production code | Replaced with `debugLog` (no-op in production) |
| 7 | `console.log(req.body)` in `createUser` — PII leak | Debug log left in production code | Replaced with `debugLog('createUser body received')` |
| 8 | `console.log('Fetched notes:', notes)` — logs note content | Debug log left in production code | Replaced with `debugLog('Fetched notes count:', notes.length)` |
| 9 | 28 `console.error(...)` calls | No logger wired in controller | All replaced with `logger.error(...)` |
| 10 | 18 raw `res.status(500).json({...})` blocks | No `sendServerError` import | All replaced with `return sendServerError(res, error, msg, code)` |
| 11 | 10+ inline `require()` calls inside functions | Lazy deferred requires | Moved all to top of file as proper module-level imports |
| 12 | `require('../../features/agencies/models/UserAgency')` — wrong path | Extra `features/` segment in path | Corrected to `require('../../agencies/models/UserAgency')` |
| 13 | `require('../../features/provider/models/Provider')` in `exportUserData` — wrong path | Extra `features/` segment; duplicate of static import | Removed inline require; uses top-level static import instead |
| 14 | `require('../models/ApiKey')` and `require('../models/AccessToken')` — wrong paths | Paths resolved to non-existent `features/users/models/` | Fixed to `require('../../../src/models/ApiKey')` and `../../../src/models/AccessToken` |
| 15 | `require('../models/UserWallet')` — wrong path | `UserWallet` is in `features/finance/models/` not `features/users/models/` | Fixed to `require('../../finance/models/UserWallet')` |
| 16 | Missing `isValidObjectId` check in 13 handlers | Only `getUserById` had it | Added ObjectId validation to all handlers that accept `:id` param; added both `id` and `badgeId` checks to `deleteUserBadge` |
| 17 | `userManagementLimiter` missing from `copilot-instructions.md` rate limits table | New limiter not documented | Added row to Rate Limits table in copilot-instructions |

---

## 6. SDK Method Reference

All methods are on `client.userManagement`.

### 6.1 Listing & Stats

| Method | Params | Returns |
|---|---|---|
| `list(params?)` | `{ page, limit, role, isActive, isVerified, search, sortBy, sortOrder, includeDeleted, registrationMethod, partnerId }` | Paginated users + pagination meta |
| `getStats(params?)` | `{ agencyId? }` | `{ totalUsers, activeUsers, verifiedUsers, usersByRole, recentUsers, topRatedUsers }` |

### 6.2 Single User CRUD

| Method | Params | Returns |
|---|---|---|
| `getById(id, params?)` | id required; `{ includeDeleted? }` | Full user object with all joins |
| `create(data)` | `phoneNumber`, `firstName`, `lastName` required | Created user |
| `update(id, data)` | id required | Updated user |
| `delete(id)` | id required | `{ message }` |

### 6.3 Status & Verification

| Method | Params | Returns |
|---|---|---|
| `updateStatus(id, data)` | `isActive` required | `{ isActive }` |
| `updateVerification(id, data)` | `verification` object | Updated trust summary + trust score |

### 6.4 Roles

| Method | Params | Returns |
|---|---|---|
| `getRoles(id)` | id required | `{ userId, roles }` |
| `updateRoles(id, data)` | `roles` array required | `{ userId, roles }` |

### 6.5 Badges

| Method | Params | Returns |
|---|---|---|
| `getBadges(id)` | id required | `{ userId, badges }` |
| `addBadge(id, data)` | `type` required | Updated badges + trust score |
| `deleteBadge(id, badgeId)` | both id and badgeId required | Remaining badges |

### 6.6 Bulk & Lifecycle

| Method | Params | Returns |
|---|---|---|
| `bulkUpdate(data)` | `userIds` array + `updateData` required | `{ matchedCount, modifiedCount }` |
| `restore(id)` | id required | Restored user |
| `ban(id, data?)` | id required; `{ reason? }` | `{ isActive: false, status: 'banned' }` |

### 6.7 Admin Actions

| Method | Params | Returns |
|---|---|---|
| `resetPassword(id, data?)` | id required; `{ sendEmail? }` | Confirmation; `temporaryPassword` if sendEmail=false |
| `sendEmail(id, data)` | `subject` + `message` required | `{ recipient, subject }` |
| `exportData(id, params?)` | id required; `{ format? }` | File attachment (json or csv) |
| `getNotes(id, params?)` | id required; `{ limit?, skip?, sortBy?, sortOrder? }` | Array of note objects |

---

## 7. Usage Examples

```javascript
const client = new LocalPro({ apiKey, apiSecret });

// List active providers on page 2
const { data } = await client.userManagement.list({
  role: 'provider',
  isActive: true,
  page: 2,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

// Get full user profile
const user = await client.userManagement.getById('user-id');

// Ban a user
await client.userManagement.ban('user-id', { reason: 'Violated terms of service' });

// Reset password without emailing
const result = await client.userManagement.resetPassword('user-id', { sendEmail: false });
console.log(result.data.temporaryPassword);

// Export user data (GDPR)
const export_ = await client.userManagement.exportData('user-id', { format: 'json' });

// Assign roles
await client.userManagement.updateRoles('user-id', { roles: ['client', 'provider'] });

// Add a badge
await client.userManagement.addBadge('user-id', { type: 'top_rated', description: 'Top 5% rating' });
```
