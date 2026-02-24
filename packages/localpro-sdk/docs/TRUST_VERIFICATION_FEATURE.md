# Trust Verification Feature Reference

Identity, business, professional, and bank-account verification flows. Users submit document-backed verification requests; admins review and update trust scores stored in the `TrustScore` model. A public endpoint lists verified users for consumer-facing trust signals.

---

## 1. Architecture Overview

```
features/trustVerification/
  controllers/
    trustVerificationController.js  — 11 handlers; auth-gated except getVerifiedUsers
  routes/
    trustVerification.js            — Express router; auth + trustVerificationLimiter on all protected routes
  models/
    TrustVerification.js            — 3 models: VerificationRequest, Dispute, TrustScore
      VerificationRequest           — core request lifecycle (pending → approved/rejected)
      Dispute                       — dispute records (service, payment, verification, other)
      TrustScore                    — weighted component scores + badge badges + history

src/
  services/cloudinaryService.js     — uploads verification documents to Cloudinary
  services/emailService.js          — status-update emails to users, notification to ADMIN_EMAIL
```

**Data-flow summary:** The public `GET /verified-users` route bypasses auth. All other routes pass through JWT `auth` then `trustVerificationLimiter`. On `POST /requests` the controller:
1. Validates phone number consistency (request must match the user's registered phone)
2. Checks for an existing pending request of the same type
3. Creates the `VerificationRequest` and emails `ADMIN_EMAIL` if configured

On `PUT /requests/:id/review` (admin only):
1. Updates the nested `review` subdocument (reviewedBy, reviewedAt, notes, score)
2. If `status = approved` → looks up `TrustScore` via `user.ensureTrust()` and calls `calculateScore()` (or sets `overallScore` directly if an admin override is provided)
3. Sends a status-update email to the user if they have an email address

---

## 2. Configuration

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Validates Bearer token |
| `ADMIN_EMAIL` | No | Receives new-request notification emails |
| `CLOUDINARY_*` | No | Required for document upload; missing credentials will cause upload failures |

---

## 3. Rate Limiting

| Limiter | Window | Max | Applied to |
|---|---|---|---|
| `trustVerificationLimiter` | 1 min | 30 req | All protected `/api/trust-verification/*` routes |

The public `GET /verified-users` route is not behind `auth` and therefore not behind the limiter.

---

## 4. Endpoints

### 4.1 Get Verified Users (Public)
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/trust-verification/verified-users` |
| **Auth** | None |

**Query params:** `page`, `limit`, `minTrustScore`

**Success 200:**
```json
{
  "success": true,
  "count": 5,
  "total": 23,
  "page": 1,
  "pages": 5,
  "data": [ { "firstName": "Jane", "lastName": "Doe", "profile": { "avatar": "..." } } ]
}
```

---

### 4.2 Get All Verification Requests
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/trust-verification/requests` |
| **Auth** | Any authenticated user (admin sees all; others see own via population) |

**Query params:** `page`, `limit`, `status` (pending \| under_review \| approved \| rejected \| expired), `type`

**Success 200:** Paginated list with `user` and `review.reviewedBy` populated.

---

### 4.3 Get Verification Request by ID
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/trust-verification/requests/:id` |
| **Auth** | Owner or admin |

**Error 400:** Invalid ObjectId format  
**Error 403:** Not owner and not admin  
**Error 404:** Request not found

---

### 4.4 Create Verification Request
| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/trust-verification/requests` |
| **Auth** | Any authenticated user |

**Request body:**
```json
{
  "type": "identity",
  "documents": [
    { "type": "government_id", "url": "https://...", "publicId": "localpro/..." }
  ],
  "personalInfo": {
    "firstName": "Jane",
    "lastName": "Doe",
    "phoneNumber": "+639171234567"
  },
  "additionalInfo": "Optional notes"
}
```

Valid `type` values: `identity`, `identity_verification`, `business`, `address`, `bank_account`, `insurance`, `certification`  
Valid `documents[].type` values: `government_id`, `passport`, `driver_license`, `drivers_license`, `business_license`, `tax_certificate`, `insurance_certificate`, `bank_statement`, `utility_bill`, `certification_document`, `other`

**Error 400:** Missing type or empty documents, duplicate pending request, phone mismatch  
**Error 403:** Phone number in request doesn't match registered phone (`PHONE_NUMBER_MISMATCH`)  
**Success 201:** Created VerificationRequest with `user` populated.

---

### 4.5 Update Verification Request
| | |
|---|---|
| **Method** | `PUT` |
| **Path** | `/api/trust-verification/requests/:id` |
| **Auth** | Owner (pending status only) |

**Request body:** `{ "documents"?, "additionalInfo"?, "personalInfo"? }`

**Error 400:** Not pending, ObjectId invalid  
**Error 403:** Not owner, phone mismatch

---

### 4.6 Delete Verification Request
| | |
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/trust-verification/requests/:id` |
| **Auth** | Owner or admin |

**Error 400:** Approved request cannot be deleted (non-admin), ObjectId invalid  
**Error 403:** Not owner and not admin

---

### 4.7 Upload Documents
| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/trust-verification/requests/:id/documents` |
| **Auth** | Owner (pending status only) |
| **Content-Type** | `multipart/form-data` |

Uploads files to Cloudinary under `localpro/verification-documents`.  
**Error 400:** No files attached, request not pending, ObjectId invalid  
**Error 500 (`UPLOAD_ALL_FAILED`):** All Cloudinary uploads failed

**Success 200:**
```json
{
  "success": true,
  "message": "2 document(s) uploaded successfully",
  "data": [ { "url": "...", "publicId": "...", "filename": "..." } ]
}
```

---

### 4.8 Delete Document
| | |
|---|---|
| **Method** | `DELETE` |
| **Path** | `/api/trust-verification/requests/:id/documents/:documentId` |
| **Auth** | Owner (pending status only) |

Deletes from Cloudinary then removes the subdocument.  
**Error 400:** ObjectId invalid (either `id` or `documentId`), request not pending  
**Error 404:** Document not found in request

---

### 4.9 Get My Requests
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/trust-verification/my-requests` |
| **Auth** | Any authenticated user |

**Query params:** `page`, `limit`, `status`, `type`  
Returns only the current user's requests.

---

### 4.10 Review Request (Admin only)
| | |
|---|---|
| **Method** | `PUT` |
| **Path** | `/api/trust-verification/requests/:id/review` |
| **Auth** | admin |

**Request body:**
```json
{
  "status": "approved",
  "adminNotes": "Identity confirmed via passport.",
  "trustScore": 85
}
```

Valid `status` values: `approved` \| `rejected` \| `needs_more_info`

- On `approved`: updates `TrustScore.overallScore` via `user.ensureTrust()` and `calculateScore()`
- Sends email to user (`user.email`) if present
- On any status: writes to `request.review.{reviewedBy, reviewedAt, notes, score}`

**Error 400:** Missing status, invalid status value, already reviewed, ObjectId invalid  
**Success 200:** Updated VerificationRequest.

---

### 4.11 Get Statistics (Admin only)
| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/trust-verification/statistics` |
| **Auth** | admin |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 120,
    "requestsByStatus": [ { "_id": "pending", "count": 12 } ],
    "requestsByType": [ { "_id": "identity", "count": 55 } ],
    "monthlyTrends": [ { "_id": { "year": 2026, "month": 2 }, "count": 18 } ],
    "averageProcessingTime": 172800000
  }
}
```

`averageProcessingTime` is in milliseconds (divide by 86400000 for days).

---

## 5. v2 Fix Log

| # | Issue | Root Cause | Fix Applied |
|---|---|---|---|
| 1 | `this.client.client.get/post/etc` on all 11 SDK methods | Wrong double `.client` pattern | All methods changed to `this.client.get/post/etc` |
| 2 | `.then(r => r.data)` on all SDK methods | Inconsistent with SDK interceptor pattern | Removed; interceptor unwraps automatically |
| 3 | No JSDoc on any SDK method | Stubs never documented | Full JSDoc (`@param`, `@returns`, `@throws`) added to all 11 methods |
| 4 | No input validation in SDK | No guards before requests | Required-field guards with `throw new Error` added to all methods |
| 5 | SDK method names inconsistent with controller (`createVerificationRequest` vs `Create`) | Copy-paste naming | Renamed to `createRequest`, `updateRequest`, `deleteRequest` for consistency |
| 6 | No rate limiting on any route | Missing limiter | Added `trustVerificationLimiter` (30 req/min) and `router.use(trustVerificationLimiter)` |
| 7 | `console.error` × 11 | No logger wired | All replaced with `logger.error` |
| 8 | `res.status(500).json({...})` × 12 (11 catch + 1 upload-fail) | No `sendServerError` import | All replaced with `sendServerError(res, error, msg, code)` |
| 9 | **Schema bug**: `request.adminNotes`, `request.reviewedBy`, `request.reviewedAt`, `request.trustScore` set at top-level | Fields exist under `request.review.*` in schema | Fixed to `request.review.notes`, `request.review.reviewedBy`, `request.review.reviewedAt`, `request.review.score` |
| 10 | **Wrong method**: `currentTrust.calculateTrustScore()` | Method is `calculateScore()` in `TrustScore` model | Fixed to `currentTrust.calculateScore()` |
| 11 | **Wrong field**: `currentTrust.trustScore = trustScore` | Field is `overallScore` in `TrustScore` model | Fixed to `currentTrust.overallScore = trustScore` |
| 12 | `await user.save()` after approval with no changed user fields | Stale comment said `verificationStatus` should be set but field doesn't exist on User | Removed redundant `user.save()` call |
| 13 | `await EmailService.sendEmail({ to: user.email })` with no null check | `user.email` could be undefined/null | Wrapped in `if (user && user.email)` guard |
| 14 | **Deprecated**: `document.remove()` in `deleteVerificationDocument` | Mongoose 7 removed subdocument `.remove()` | Changed to `request.documents.pull(documentId)` |
| 15 | Missing `isValidObjectId` on 6 handlers | No ObjectId guards | Added to `getRequestById`, `updateRequest`, `reviewRequest`, `deleteRequest`, `uploadDocuments`, `deleteDocument`; `deleteDocument` also validates `documentId` |
| 16 | No `logger`, `sendServerError`, `isValidObjectId` imports | Not imported at all | Added to controller header |

---

## 6. SDK Method Reference

All methods are on `client.trustVerification`.

### 6.1 Public

| Method | Params | Returns |
|---|---|---|
| `getVerifiedUsers(params?)` | `{ page?, limit?, minTrustScore? }` | Paginated verified users |

### 6.2 Listing & My Requests

| Method | Params | Returns |
|---|---|---|
| `getRequests(params?)` | `{ page?, limit?, status?, type? }` | Paginated requests (admin view) |
| `getMyRequests(params?)` | `{ page?, limit?, status?, type? }` | Authenticated user's own requests |

### 6.3 Single Request CRUD

| Method | Params | Returns |
|---|---|---|
| `getRequestById(id)` | id required | VerificationRequest with joins |
| `createRequest(data)` | `type` + `documents` required | Created request |
| `updateRequest(id, data)` | id + data required | Updated request |
| `deleteRequest(id)` | id required | `{ message }` |

### 6.4 Documents

| Method | Params | Returns |
|---|---|---|
| `uploadDocuments(id, formData)` | id + FormData required | Array of uploaded document records |
| `deleteDocument(id, documentId)` | both required | `{ message }` |

### 6.5 Admin

| Method | Params | Returns |
|---|---|---|
| `reviewRequest(id, data)` | id + `data.status` required | Updated request |
| `getStatistics(params?)` | optional filters | Aggregated stats |

---

## 7. Usage Examples

```javascript
const client = new LocalPro({ apiKey, apiSecret });

// Submit an identity verification request
const req = await client.trustVerification.createRequest({
  type: 'identity',
  documents: [
    { type: 'government_id', url: 'https://res.cloudinary.com/...', publicId: 'localpro/...' }
  ],
  personalInfo: { firstName: 'Jane', lastName: 'Doe', phoneNumber: '+639171234567' }
});

// Check own requests
const mine = await client.trustVerification.getMyRequests({ status: 'pending' });

// Admin: list pendeing requests
const pending = await client.trustVerification.getRequests({ status: 'pending', limit: 50 });

// Admin: approve with a trust-score override
await client.trustVerification.reviewRequest(req.data._id, {
  status: 'approved',
  adminNotes: 'Passport verified in person.',
  trustScore: 90
});

// Browse publicly verified users
const verified = await client.trustVerification.getVerifiedUsers({ minTrustScore: 70, limit: 20 });
```
