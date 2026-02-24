# LocalPro Escrow Feature - Documentation

## Table of Contents
1. [Overview](#1-overview)
2. [Escrow Lifecycle](#2-escrow-lifecycle)
3. [API Endpoints](#3-api-endpoints)
   - [List Escrows](#31-get-apiescrows)
   - [Get Escrow Details](#32-get-apiescrowsid)
   - [Get Transactions](#33-get-apiescrowsidtransactions)
   - [Get Payout](#34-get-apiescrowsidpayout)
   - [Create Escrow](#35-post-apiescrowscreate)
   - [Capture Payment](#36-post-apiescrowsidcapture)
   - [Refund Payment](#37-post-apiescrowsidrefund)
   - [Upload Proof of Work](#38-post-apiescrowsidproof-of-work)
   - [Request Payout](#39-post-apiescrowsidpayout)
   - [Raise Dispute](#310-post-apiescrowsiddispute)
   - [Resolve Dispute](#311-post-apiescrowsiddisputeresolve)
   - [Admin: List All Escrows](#312-get-apiescrowsadminall)
   - [Admin: Statistics](#313-get-apiescrowsadminstats)
4. [Data Models](#4-data-models)
5. [Payment Gateway Integration](#5-payment-gateway-integration)
6. [Email Notifications](#6-email-notifications)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Error Reference](#8-error-reference)
9. [Key Design Notes](#9-key-design-notes)

---

## 1. Overview

The escrow system is LocalPro's payment protection layer for the marketplace. When a client books a service, funds are placed on hold at a payment gateway (PayMongo, Xendit, or Stripe) and are only released to the provider after the client approves the completed work.

If a dispute arises, an admin mediates and decides the outcome. Every financial event is written to an **immutable audit ledger** (`EscrowTransaction`) to ensure tamper-evident record-keeping.

**Base route:** `POST /api/escrows`
**Auth:** All routes require a valid JWT Bearer token.

---

## 2. Escrow Lifecycle

### State Machine

```
                ┌───────────────────────────────────────────────────────────┐
                │                    ESCROW STATE MACHINE                    │
                └───────────────────────────────────────────────────────────┘

  createEscrow()          capturePayment()         processPayout()
  ─────────────           ────────────────         ───────────────
  CREATED ──────> FUNDS_HELD ──────────> IN_PROGRESS ──────────> PAYOUT_INITIATED
                     │                      │                           │
                     │ refundPayment()       │ initiateDispute()         │ completePayout()
                     │                      │                           │  (webhook)
                     ▼                      ▼                           ▼
                  REFUNDED              DISPUTE               PAYOUT_COMPLETED
                                           │
                              admin resolves with:
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                          REFUNDED    PAYOUT_INITIATED  (SPLIT - partial)
                         (client)      (provider)
```

### Status Definitions

| Status | Description | Set By |
|---|---|---|
| `CREATED` | Record exists; hold not yet confirmed | `createEscrow()` (initial) |
| `FUNDS_HELD` | Payment authorization hold placed at gateway | `createEscrow()` (on success) |
| `IN_PROGRESS` | Client approved/captured funds; service underway | `capturePayment()` |
| `REFUNDED` | Funds returned to client; hold reversed | `refundPayment()` |
| `DISPUTE` | Either party raised a dispute; awaiting admin review | `initiateDispute()` |
| `PAYOUT_INITIATED` | Gateway disbursement to provider is in flight | `processPayout()` |
| `PAYOUT_COMPLETED` | Xendit confirmed the disbursement landed | `completePayout()` (webhook) |
| `COMPLETE` | Reserved in schema; not currently set by any code path | — |

### Refundable Window

A refund can only be requested when the escrow is in `CREATED` or `FUNDS_HELD` status. Once the escrow reaches `IN_PROGRESS`, the only path back to the client is via a dispute and an admin decision of `REFUND_CLIENT`.

---

## 3. API Endpoints

### 3.1 GET /api/escrows

List all escrows belonging to the authenticated user.

- **Auth:** Required (any role)
- **Behavior:** If the user's role is `provider`, filters by `providerId`. Otherwise filters by `clientId`.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Results per page |
| `status` | string | — | Filter by escrow status (see status enum) |

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a...",
      "clientId": { "_id": "...", "name": "Juan Dela Cruz", "email": "juan@example.com" },
      "providerId": { "_id": "...", "name": "Maria Santos", "email": "maria@example.com" },
      "amount": 500000,
      "currency": "PHP",
      "status": "FUNDS_HELD"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 3.2 GET /api/escrows/:id

Get full details of a single escrow, including its payout record and full audit log.

- **Auth:** Required (any role)
- **Path Params:** `id` — Escrow MongoDB ObjectId

**Response `200`**
```json
{
  "success": true,
  "data": {
    "escrow": { /* full Escrow document */ },
    "payout": { /* Payout document, or null */ },
    "transactions": [ /* EscrowTransaction records, newest first */ ]
  }
}
```

**Response `404`** — Escrow not found.

---

### 3.3 GET /api/escrows/:id/transactions

Get the paginated audit log of all financial events for an escrow.

- **Auth:** Required (any role)
- **Path Params:** `id` — Escrow ObjectId
- **Query Params:** `page` (default `1`), `limit` (default `50`)

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "transactionType": "HOLD",
      "amount": 500000,
      "currency": "PHP",
      "status": "SUCCESS",
      "gateway": { "provider": "paymongo", "transactionId": "pi_..." },
      "timestamp": "2025-01-15T08:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 4, "totalPages": 1 }
}
```

---

### 3.4 GET /api/escrows/:id/payout

Get the payout record associated with an escrow.

- **Auth:** Required (any role)
- **Path Params:** `id` — Escrow ObjectId

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "64b...",
    "escrowId": "64a...",
    "providerId": { "_id": "...", "name": "Maria Santos", "email": "maria@example.com" },
    "amount": 500000,
    "currency": "PHP",
    "payoutProvider": "xendit",
    "status": "COMPLETED",
    "initiatedAt": "2025-01-16T10:00:00.000Z",
    "completedAt": "2025-01-17T09:30:00.000Z"
  }
}
```

**Response `404`** — Payout not found for this escrow.

---

### 3.5 POST /api/escrows/create

Create a new escrow and place a payment hold at the gateway.

- **Auth:** Required — `clientId` is taken from `req.user.id`
- **Content-Type:** `application/json`

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `bookingId` | ObjectId | Yes | The booking this escrow secures |
| `providerId` | ObjectId | Yes | The service provider's user ID |
| `amount` | number | Yes | Amount **in cents** (must be > 0) |
| `currency` | string | Yes | `USD`, `PHP`, `EUR`, `GBP`, or `JPY` |
| `holdProvider` | string | Yes | Payment gateway: `paymongo`, `xendit`, or `stripe` |

**Example Request**
```bash
curl -X POST /api/escrows/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "64a...",
    "providerId": "64b...",
    "amount": 500000,
    "currency": "PHP",
    "holdProvider": "paymongo"
  }'
```

**Response `201`**
```json
{
  "success": true,
  "data": { /* Escrow document with status FUNDS_HELD */ },
  "message": "Escrow created successfully with funds held"
}
```

**Response `400`** — Missing required fields or invalid amount.
**Response `500`** — Gateway hold failed.

**Side Effects**
- Calls the gateway to place an authorization/hold.
- Sets escrow status to `FUNDS_HELD`.
- Writes a `HOLD` event to the audit log.
- Sends `escrow_created` email to the client.
- Sends `escrow_created_provider` email to the provider.

---

### 3.6 POST /api/escrows/:id/capture

Client approves completed work, capturing the held funds from the gateway.

- **Auth:** Required — must be the escrow's `clientId`
- **Path Params:** `id` — Escrow ObjectId
- **Request Body:** none

**Example Request**
```bash
curl -X POST /api/escrows/64a.../capture \
  -H "Authorization: Bearer <client_token>"
```

**Response `200`**
```json
{
  "success": true,
  "data": { /* Escrow document with status IN_PROGRESS */ },
  "message": "Payment captured successfully"
}
```

**Response `400`** — User is not the client, or escrow is not in `FUNDS_HELD` status.

**Side Effects**
- Calls the gateway to capture the authorized charge.
- Sets `escrow.status` to `IN_PROGRESS`.
- Sets `escrow.clientApproval.approved = true` and `approvedAt`.
- Writes a `CAPTURE` event to the audit log.
- Sends `payment_captured` email to the client.

---

### 3.7 POST /api/escrows/:id/refund

Refund the held payment before it has been captured.

- **Auth:** Required (client, provider, or admin)
- **Path Params:** `id` — Escrow ObjectId
- **Content-Type:** `application/json`

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `reason` | string | Yes | Human-readable reason for the refund |

**Example Request**
```bash
curl -X POST /api/escrows/64a.../refund \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Provider cancelled the booking" }'
```

**Response `200`**
```json
{
  "success": true,
  "data": { /* Escrow document with status REFUNDED */ },
  "message": "Payment refunded successfully"
}
```

**Response `400`** — Escrow is not in `CREATED` or `FUNDS_HELD` status, or `reason` is missing.

**Side Effects**
- Calls the gateway to reverse or release the hold.
- Sets escrow status to `REFUNDED`.
- Writes a `REFUND` event to the audit log.
- Sends `payment_refunded` email to the client (includes the reason).

---

### 3.8 POST /api/escrows/:id/proof-of-work

Provider uploads proof of completed work for client review.

- **Auth:** Required — must be the escrow's `providerId`
- **Path Params:** `id` — Escrow ObjectId
- **Content-Type:** `application/json`

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `documents` | array | Yes | Array of document objects (URLs + metadata) |
| `notes` | string | No | Provider notes about the completed work |

**Example Request**
```bash
curl -X POST /api/escrows/64a.../proof-of-work \
  -H "Authorization: Bearer <provider_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      { "url": "https://cdn.localpro.app/proof/img1.jpg", "type": "image" }
    ],
    "notes": "All tasks completed as per the agreed scope."
  }'
```

**Response `200`**
```json
{
  "success": true,
  "data": { /* Escrow document with proofOfWork populated */ },
  "message": "Proof of work uploaded successfully"
}
```

**Response `400`** — User is not the provider, or escrow is not in `FUNDS_HELD` or `IN_PROGRESS` status.

**Side Effects**
- Updates `escrow.proofOfWork` with `uploadedAt`, `documents`, and `notes`.
- Sends `proof_uploaded` email to the client, prompting them to review and approve.

---

### 3.9 POST /api/escrows/:id/payout

Provider requests a payout after the client has approved the work.

- **Auth:** Required — must be the escrow's `providerId`
- **Path Params:** `id` — Escrow ObjectId
- **Request Body:** none

**Example Request**
```bash
curl -X POST /api/escrows/64a.../payout \
  -H "Authorization: Bearer <provider_token>"
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "escrow": { /* Escrow document with status PAYOUT_INITIATED */ },
    "payout": { /* new Payout document with status PROCESSING */ }
  },
  "message": "Payout initiated successfully"
}
```

**Response `400`** — User is not the provider, escrow is not `IN_PROGRESS`, client has not approved, or provider has no configured payout method.

**Side Effects**
- Creates a `Payout` record (status `PROCESSING`) via Xendit.
- Sets escrow status to `PAYOUT_INITIATED`.
- Writes a `PAYOUT` event to the audit log.
- Sends `payout_initiated` email to the provider.

---

### 3.10 POST /api/escrows/:id/dispute

Client or provider raises a dispute to pause the escrow for admin review.

- **Auth:** Required — must be the escrow's `clientId` or `providerId`
- **Path Params:** `id` — Escrow ObjectId
- **Content-Type:** `application/json`

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `reason` | string | Yes | Description of the dispute |
| `evidence` | array | No | Array of evidence document URLs |

**Example Request**
```bash
curl -X POST /api/escrows/64a.../dispute \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Work was incomplete; only 2 of 5 items were delivered.",
    "evidence": ["https://cdn.localpro.app/evidence/screenshot.png"]
  }'
```

**Response `201`**
```json
{
  "success": true,
  "data": { /* Escrow document with status DISPUTE */ },
  "message": "Dispute raised successfully"
}
```

**Response `400`** — User is not a party to the escrow, or `reason` is missing.

**Side Effects**
- Sets `escrow.dispute.raised = true`, records `raisedAt`, `raisedBy`, `reason`, and `evidence`.
- Sets escrow status to `DISPUTE`.
- Writes a `DISPUTE_INITIATED` event to the audit log.
- Sends a dispute notification email to all users with `role === 'admin'`.

---

### 3.11 POST /api/escrows/:id/dispute/resolve

Admin resolves an active dispute.

- **Auth:** Required + `admin` role
- **Path Params:** `id` — Escrow ObjectId
- **Content-Type:** `application/json`

**Request Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `decision` | string | Yes | `REFUND_CLIENT`, `PAYOUT_PROVIDER`, or `SPLIT` |
| `notes` | string | No | Admin notes on the resolution |

**Example Request**
```bash
curl -X POST /api/escrows/64a.../dispute/resolve \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{ "decision": "REFUND_CLIENT", "notes": "Provider did not deliver." }'
```

**Response `200`**
```json
{
  "success": true,
  "data": { /* updated Escrow document */ },
  "message": "Dispute resolved: REFUND_CLIENT"
}
```

**Response `400`** — Escrow is not in `DISPUTE` status, or `decision` is invalid.

**Decision Outcomes**

| Decision | What Happens |
|---|---|
| `REFUND_CLIENT` | Calls `refundPayment()` — gateway hold released, status → `REFUNDED`, client emailed |
| `PAYOUT_PROVIDER` | Calls `processPayout()` — gateway disbursement, status → `PAYOUT_INITIATED`, provider emailed |
| `SPLIT` | Calculates 50/50 split; gateway partial-capture **not yet implemented** |

**Side Effects (all decisions)**
- Writes a `DISPUTE_RESOLVED` event to the audit log.

---

### 3.12 GET /api/escrows/admin/all

Admin: List all escrows in the system with optional filters.

- **Auth:** Required + `admin` role
- **Query Params:** `status`, `clientId`, `providerId`, `page` (default `1`), `limit` (default `20`)

**Response `200`** — Same shape as `GET /api/escrows`.

---

### 3.13 GET /api/escrows/admin/stats

Admin: Get aggregate statistics on all escrows.

- **Auth:** Required + `admin` role
- **Query Params:** `startDate` (ISO date string), `endDate` (ISO date string)

**Response `200`**
```json
{
  "success": true,
  "data": {
    "byStatus": [
      { "_id": "FUNDS_HELD", "count": 12, "totalAmount": 120000 },
      { "_id": "PAYOUT_COMPLETED", "count": 40, "totalAmount": 4000000 }
    ],
    "totalVolume": [
      { "_id": null, "total": 5200000, "count": 67 }
    ],
    "byProvider": [
      { "_id": "64b...", "count": 15, "totalAmount": 1500000 }
    ]
  }
}
```

---

## 4. Data Models

### 4.1 Escrow

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID v4) | Human-friendly unique reference |
| `bookingId` | ObjectId → Booking | The booking this escrow secures |
| `clientId` | ObjectId → User | Fund source (buyer) |
| `providerId` | ObjectId → User | Fund destination (seller) |
| `amount` | Number | Amount **in cents** |
| `currency` | enum | `USD`, `PHP`, `EUR`, `GBP`, `JPY` — default `USD` |
| `holdProvider` | enum | `paymongo`, `xendit`, `stripe`, `paypal`, `paymaya` |
| `providerHoldId` | String | Authorization / Payment Intent ID from the gateway |
| `status` | enum | Current lifecycle state (see Section 2) |
| `proofOfWork.uploadedAt` | Date | When provider submitted proof |
| `proofOfWork.documents` | Array | Document URLs + metadata |
| `proofOfWork.notes` | String | Provider notes |
| `clientApproval.approved` | Boolean | Whether client approved the work |
| `clientApproval.approvedAt` | Date | Timestamp of approval |
| `dispute.raised` | Boolean | Whether a dispute is active |
| `dispute.raisedBy` | ObjectId → User | Who raised the dispute |
| `dispute.reason` | String | Stated reason for the dispute |
| `dispute.evidence` | Array | Evidence document URLs |
| `dispute.adminResolution.decision` | enum | `REFUND_CLIENT`, `PAYOUT_PROVIDER`, `SPLIT` |
| `dispute.adminResolution.notes` | String | Admin notes on resolution |
| `dispute.adminResolution.resolvedAt` | Date | Timestamp of resolution |

**Indexes:** `(bookingId, status)`, `(clientId, status)`, `(providerId, status)`, `(createdAt DESC)`

---

### 4.2 EscrowTransaction (Immutable Audit Log)

> **Note:** This model is immutable by design. Pre-save hooks throw an error on any attempt to update an existing record.

| Field | Type | Description |
|---|---|---|
| `escrowId` | ObjectId → Escrow | Parent escrow |
| `transactionType` | enum | `HOLD`, `CAPTURE`, `REFUND`, `DISPUTE_INITIATED`, `DISPUTE_RESOLVED`, `PAYOUT` |
| `amount` | Number | Amount in cents at time of event |
| `currency` | String | Currency at time of event |
| `status` | enum | `PENDING`, `SUCCESS`, `FAILED` |
| `initiatedBy` | ObjectId → User | Who triggered the action |
| `gateway.provider` | String | Which gateway processed it |
| `gateway.transactionId` | String | Gateway's own reference ID |
| `metadata.reason` | String | Human-readable reason |
| `metadata.relatedPayoutId` | ObjectId → Payout | Set on `PAYOUT` events |
| `metadata.tags` | [String] | Freeform tags |
| `timestamp` | Date | When the event occurred |

---

### 4.3 Payout

| Field | Type | Description |
|---|---|---|
| `escrowId` | ObjectId → Escrow | Source escrow |
| `providerId` | ObjectId → User | Recipient |
| `amount` | Number | In cents |
| `currency` | String | Default `USD` |
| `payoutProvider` | enum | `xendit`, `stripe`, `paypal`, `paymaya`, `bank_transfer` |
| `gatewayPayoutId` | String | Gateway's payout reference ID |
| `providerPayoutMethod.type` | enum | `bank_account`, `wallet`, `crypto` |
| `providerPayoutMethod.accountDetails` | Object | `accountNumber`, `accountName`, `bankCode`, `walletAddress` |
| `status` | enum | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED` |
| `metadata.reference` | String | Human-readable reference |
| `initiatedAt` | Date | When payout was triggered |
| `completedAt` | Date | When gateway confirmed deposit |
| `failureReason` | String | Set when status is `FAILED` |

---

## 5. Payment Gateway Integration

### 5.1 PayMongo (Payment Collection)

Used for authorization holds and captures. Config via env vars:

| Variable | Description |
|---|---|
| `PAYMONGO_PUBLIC_KEY` | Public key for client-side tokenization |
| `PAYMONGO_SECRET_KEY` | Secret key for server-side API calls |
| `PAYMONGO_WEBHOOK_SECRET` | Used to verify incoming webhook signatures |

**Base URL:** `https://api.paymongo.com/v1`
**Auth:** HTTP Basic — `secretKey` as username, empty password.
**Supported Methods:** `card`, `gcash`, `paymaya`

**Service Methods**

| Method | PayMongo API Call | Purpose |
|---|---|---|
| `createAuthorization()` | `POST /payment_intents` (`capture: false`) | Places a hold without capturing |
| `capturePayment()` | `GET /payment_intents/:id` → `POST /charges/:id/capture` | Captures an authorized charge |
| `releaseAuthorization()` | `GET /payment_intents/:id` → `POST /charges/:id/reverse` | Releases a hold; falls back to refund if already captured |
| `refundPayment()` | `POST /refunds` | Creates a full or partial refund on a captured charge |
| `confirmPayment()` | `POST /payment_intents/:id/confirm` | Attaches a payment method to an intent |
| `verifyWebhookSignature()` | HMAC-SHA256 | Validates incoming webhook payloads |
| `getPaymentIntent()` | `GET /payment_intents/:id` | Retrieves intent state |
| `getCharge()` | `GET /charges/:id` | Retrieves charge details |
| `listPaymentIntents()` | `GET /payment_intents?limit=N` | Admin listing with cursor pagination |

**Currency Conversion**

If the escrow currency is not PHP, a static conversion is applied before sending to PayMongo:

| From | To (PHP) | Rate |
|---|---|---|
| USD | PHP | × 56 |
| EUR | PHP | × 60 |
| GBP | PHP | × 70 |

> **Warning:** These are static rates. A live FX API should be integrated for production.

---

### 5.2 Xendit (Provider Payouts)

Used exclusively for disbursements to providers. Config via:

| Variable | Description |
|---|---|
| `XENDIT_SECRET_KEY` | Secret key for the Xendit Node.js SDK |

Xendit is instantiated via the `xendit-node` SDK. Hold/capture methods exist as placeholders but the primary use is disbursement via `processPayout()`.

---

### 5.3 Stripe (Placeholder)

All Stripe methods (`stripeCreateHold`, `stripeCapture`, `stripeRelease`, `stripeInitiatePayout`) are **non-functional placeholders** that return fake IDs. Do not use in production.

---

## 6. Email Notifications

Notification failures are **non-fatal** — a failed email will not roll back the associated financial operation.

### Trigger Reference

| Event | Template | Recipient | Subject |
|---|---|---|---|
| Escrow created | `escrow_created` | Client | "Escrow Created - Funds Held" |
| Escrow created | `escrow_created_provider` | Provider | "Escrow Created for Your Booking" |
| Payment captured | `payment_captured` | Client | "Payment Captured" |
| Payment refunded | `payment_refunded` | Client | "Payment Refunded" |
| Proof of work uploaded | `proof_uploaded` | Client | "Proof of Work Uploaded" |
| Payout initiated | `payout_initiated` | Provider | "Payout Initiated" |
| Dispute raised | *(direct service call)* | All admins | *(defined in EmailService)* |

### Template Variables

All templates use Handlebars-style `{{variable}}` substitution with `{{#if variable}}...{{/if}}` for optional blocks.

**escrow_created** (to client)
- `{{client.name}}`, `{{escrow.currency}}`, `{{escrow.amount}}`, `{{escrow.bookingId}}`

**escrow_created_provider** (to provider)
- `{{provider.name}}`, `{{escrow.currency}}`, `{{escrow.amount}}`, `{{escrow.bookingId}}`

**payment_captured** (to client)
- `{{client.name}}`, `{{escrow.currency}}`, `{{escrow.amount}}`, `{{escrow.bookingId}}`

**payment_refunded** (to client)
- `{{client.name}}`, `{{escrow.currency}}`, `{{escrow.amount}}`, `{{escrow.bookingId}}`
- `{{reason}}` — conditionally shown in a highlighted warning box
- Processing time stated as **5–10 business days**

**proof_uploaded** (to client)
- `{{escrow.currency}}`, `{{escrow.amount}}`, `{{escrow.bookingId}}`
- `{{notes}}` — conditionally shown as "Provider Notes"

**payout_initiated** (to provider)
- `{{escrow.currency}}`, `{{escrow.amount}}`, `{{escrow.bookingId}}`
- Deposit time stated as **1–3 business days**

---

## 7. Authentication & Authorization

All escrow routes require a valid JWT Bearer token (`Authorization: Bearer <token>`).

**Route-Level Auth Summary**

| Route | Auth Required | Admin Only |
|---|---|---|
| `GET /api/escrows` | Yes | No |
| `GET /api/escrows/:id` | Yes | No |
| `GET /api/escrows/:id/transactions` | Yes | No |
| `GET /api/escrows/:id/payout` | Yes | No |
| `POST /api/escrows/create` | Yes | No |
| `POST /api/escrows/:id/capture` | Yes | No (enforced in service: must be `clientId`) |
| `POST /api/escrows/:id/refund` | Yes | No |
| `POST /api/escrows/:id/proof-of-work` | Yes | No (enforced in service: must be `providerId`) |
| `POST /api/escrows/:id/payout` | Yes | No (enforced in service: must be `providerId`) |
| `POST /api/escrows/:id/dispute` | Yes | No (enforced in service: must be `clientId` or `providerId`) |
| `POST /api/escrows/:id/dispute/resolve` | Yes | **Yes** |
| `GET /api/escrows/admin/all` | Yes | **Yes** |
| `GET /api/escrows/admin/stats` | Yes | **Yes** |

---

## 8. Error Reference

| HTTP Status | Scenario |
|---|---|
| `400` | Missing required fields, invalid amount, wrong escrow status for operation, unauthorized party |
| `401` | No token or invalid/expired JWT |
| `403` | Token valid but insufficient role (e.g., non-admin accessing admin routes) |
| `404` | Escrow or Payout not found |
| `500` | Gateway hold/capture/refund/payout failed; unhandled server error |

---

## 9. Key Design Notes

1. **Amounts are in cents.** All `amount` fields in models and gateway calls use the smallest currency unit (cents / centavos). The display layer must divide by 100 for presentation.

2. **Immutable audit log.** `EscrowTransaction` records can never be updated. Mongoose pre-hooks throw errors on any update attempt, making the ledger tamper-evident.

3. **Notification failures are non-fatal.** Email sending is wrapped in a try/catch and does not re-throw. A failed email will not roll back a financial operation.

4. **SPLIT dispute resolution is incomplete.** The `SPLIT` decision path calculates a 50/50 split but does not yet call any gateway API for partial operations. It requires additional implementation before production use.

5. **Gateway priority.** PayMongo is used for payment collection (holds and captures). Xendit is the default for provider disbursements. Stripe methods are non-functional placeholders.

6. **`COMPLETE` status is unreachable.** The Escrow schema enum includes `COMPLETE`, but no code path currently sets this value. `PAYOUT_COMPLETED` is the terminal successful state.

7. **Webhook handler.** `completePayout()` is designed to be called from an incoming Xendit webhook. Ensure your webhook endpoint validates the Xendit signature and maps `gatewayPayoutId` to the correct `Payout` record before calling this method.

8. **Marketplace integration.** Every booking created via `POST /api/marketplace/bookings` sets `payment.escrow = true` automatically. Bookings start at `pending_admin_review` status — admin approval is required before the escrow becomes active.
