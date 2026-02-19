# PayMongo Integration Documentation

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [BACKEND](#backend)
  - [Environment Variables](#backend-environment-variables)
  - [Checkout Session Endpoint](#checkout-session-endpoint)
  - [Webhook Handler](#webhook-handler)
  - [Confirm Payment Endpoint](#confirm-payment-endpoint)
  - [Subscription Status Endpoint](#subscription-status-endpoint)
  - [Billing Cycle Reset Logic](#billing-cycle-reset-logic)
  - [Data Model](#data-model)
  - [Error Handling](#backend-error-handling)
  - [PayMongo Dashboard Setup](#paymongo-dashboard-setup)
- [FRONTEND](#frontend)
  - [Environment Variables](#frontend-environment-variables)
  - [Triggering Checkout](#triggering-checkout)
  - [Post-Payment Pages](#post-payment-pages)
  - [Subscription State](#subscription-state)
  - [Handling Payment Errors](#handling-payment-errors)

---

## Overview

The subscription payment flow uses [PayMongo](https://paymongo.com) as the payment gateway. The backend creates a **hosted checkout session** and returns a URL; the frontend redirects the user to that URL. PayMongo handles the payment page and notifies the backend asynchronously via **webhooks** when payment is confirmed.

**Supported payment methods:** GCash, Maya, Grab Pay, Credit/Debit Card

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│                                                          │
│  SubscriptionPage ─── POST /localpro-plus/subscribe/:id  │
│                               │                          │
│              ◄── { checkoutUrl }                         │
│                               │                          │
│  window.location.href = checkoutUrl  (→ PayMongo)        │
└───────────────────────────────┼──────────────────────────┘
                                │
                  ┌─────────────▼──────────────┐
                  │   PayMongo Hosted           │
                  │   Checkout Page             │
                  │   (card / gcash / etc.)     │
                  └─────────────┬──────────────┘
                                │  user pays
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
  Redirect to /payment/success       Webhook POST /webhooks/paymongo
              │                                   │
              │                       Verify HMAC-SHA256 signature
              │                       Parse checkout_session.payment.paid
              │                       Update subscription in database
              ▼
     Frontend success page
     (plan activates async via webhook)
```

---

---

# BACKEND

> All backend work runs on the Express API server (`http://localhost:4000`). The PayMongo secret keys are **never** sent to the browser.

---

## Backend: Environment Variables

Add to the backend `.env` file:

```env
# PayMongo secret key (Developers → API Keys in PayMongo Dashboard)
# sk_test_... for development, sk_live_... for production
PAYMONGO_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx

# Signing secret for verifying webhook payloads (Developers → Webhooks)
PAYMONGO_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

# Base URL of the frontend app (used to build redirect URLs for PayMongo)
FRONTEND_URL=https://your-app.vercel.app
```

> **Never** use a `NEXT_PUBLIC_` prefix on these keys. Both must remain server-side only.

---

## Checkout Session Endpoint

**`POST /localpro-plus/subscribe/:planId`**

Authenticates the user, calls the PayMongo API to create a hosted checkout session, and returns the redirect URL.

**Auth:** Required (Bearer token)

**Request body:**
```json
{
  "paymentMethod": "paymongo",
  "billingCycle": "monthly" | "yearly"
}
```

**Response (200):**
```json
{
  "checkoutUrl": "https://checkout.paymongo.com/cs_xxxx"
}
```

**PayMongo API call made by the backend:**
```
POST https://api.paymongo.com/v1/checkout_sessions
Authorization: Basic <base64(PAYMONGO_SECRET_KEY:)>
Content-Type: application/json

{
  "data": {
    "attributes": {
      "line_items": [{
        "currency": "PHP",
        "amount": 49900,
        "name": "LocalPro Plus – Monthly",
        "quantity": 1
      }],
      "payment_method_types": ["card", "gcash", "paymaya", "grab_pay"],
      "metadata": {
        "userId": "<user._id>",
        "planId": "<planId>",
        "billingCycle": "monthly"
      },
      "success_url": "<FRONTEND_URL>/payment/success?plan=<planId>",
      "cancel_url":  "<FRONTEND_URL>/payment/cancel"
    }
  }
}
```

**Error responses:**

| Status | Cause |
|--------|-------|
| 401 | User not authenticated |
| 400 | Invalid planId or billingCycle |
| 500 | `PAYMONGO_SECRET_KEY` not configured |
| 502 | PayMongo API call failed or returned no URL |

---

## Webhook Handler

**`POST /webhooks/paymongo`**

Receives asynchronous payment confirmation from PayMongo. **Must be publicly accessible.**

**Auth:** HMAC-SHA256 signature verification (not session-based)

### Signature Verification

```
HMAC = SHA256(timestamp + "." + rawBody, PAYMONGO_WEBHOOK_SECRET)
```

The `Paymongo-Signature` header format:
```
t=<unix_timestamp>,te=<test_hmac>,li=<live_hmac>
```

- Use `te` when running with `sk_test_...` keys
- Use `li` when running with `sk_live_...` keys

Reject the request if:
- The computed HMAC does not match
- The event timestamp is older than **5 minutes** (replay protection)

### Handled Event: `checkout_session.payment.paid`

On receipt, extract `metadata.userId`, `metadata.planId`, and `metadata.billingCycle` from the session, then update the subscription in the database:

```typescript
await Subscription.findOneAndUpdate(
  { userId: metadata.userId },
  {
    $set: {
      planId: metadata.planId,
      billingCycle: metadata.billingCycle,
      status: 'active',
      currentPeriodStart: new Date(),
      paymentMethod: 'paymongo',
      paymongoSessionId: session.id,
    }
  },
  { upsert: true }
);
```

> Always respond `200 { received: true }` to PayMongo — even on database errors — to prevent infinite retries.

---

## Confirm Payment Endpoint

**`POST /localpro-plus/confirm-payment`**

Optional polling endpoint for the frontend success page to verify activation status after redirect (since webhook delivery can be slightly delayed).

**Auth:** Required (Bearer token)

**Request body:**
```json
{
  "sessionId": "cs_xxxx"
}
```

**Response (200):**
```json
{
  "activated": true,
  "plan": { "id": "...", "name": "LocalPro Plus" }
}
```

---

## Subscription Status Endpoint

**`GET /localpro-plus/my-subscription`**

Returns the current authenticated user's active subscription.

**Auth:** Required (Bearer token)

**Response (200):**
```json
{
  "planId": "plus",
  "planName": "LocalPro Plus",
  "status": "active" | "trialing" | "cancelled",
  "billingCycle": "monthly" | "yearly",
  "currentPeriodStart": "2026-02-01T00:00:00.000Z",
  "currentPeriodEnd": "2026-03-01T00:00:00.000Z"
}
```

---

## Billing Cycle Reset Logic

Billing resets are enforced at the API level (not by PayMongo recurring billing). On each protected API call:

```
1. Fetch user's subscription from DB
2. If status is "active" and currentPeriodStart is set:
     Check if the billing period has elapsed
     If yes → reset usage counters, set currentPeriodStart = now()
3. If usage >= limit:
     Return 403 { error: "limit_reached" }
4. Otherwise → proceed, increment usage
```

> Users must manually renew each cycle. There is no automatic recurring charge.

---

## Data Model

```typescript
// Subscription document
{
  userId:               ObjectId,          // ref: User
  planId:               string,            // e.g. "plus", "professional"
  billingCycle:         "monthly" | "yearly",
  status:               "trialing" | "active" | "cancelled",
  paymentMethod:        "paymongo" | "paypal",
  currentPeriodStart:   Date,
  currentPeriodEnd:     Date,
  paymongoSessionId:    string,            // PayMongo checkout_session id
  createdAt:            Date,
  updatedAt:            Date,
}
```

---

## Backend: Error Handling

| Scenario | Behavior |
|----------|----------|
| `PAYMONGO_SECRET_KEY` not set | `500` — "Payment gateway not configured" |
| `PAYMONGO_WEBHOOK_SECRET` not set | `500` — webhook endpoint returns error |
| PayMongo API call fails | `502` — "Failed to create checkout session" |
| No checkout URL in response | `502` — "PayMongo returned no checkout URL" |
| Invalid webhook signature | `401` — "Invalid signature" |
| Webhook event older than 5 min | `401` — rejected (replay protection) |
| Missing metadata in webhook | `200` — log error, avoid PayMongo retry |
| DB update fails in webhook | `200` — log error, avoid PayMongo retry |

---

## PayMongo Dashboard Setup

### 1. Get API keys

1. Log in to [dashboard.paymongo.com](https://dashboard.paymongo.com)
2. Go to **Developers → API Keys**
3. Copy the **Secret Key** (`sk_live_...` for production, `sk_test_...` for testing)
4. Set it as `PAYMONGO_SECRET_KEY` in the backend `.env`

### 2. Register the webhook

1. Go to **Developers → Webhooks → Add Endpoint**
2. URL: `https://your-api.com/webhooks/paymongo`
3. Subscribe to event: `checkout_session.payment.paid`
4. Copy the **Webhook Secret** → set as `PAYMONGO_WEBHOOK_SECRET`

> For local development, expose your server using [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) and register that temporary URL.

### 3. Test credentials

| Payment Method | Test Value |
|----------------|------------|
| Card (success) | `4343434343434345` |
| Card (fail)    | `4571736000000075` |
| GCash          | Use PayMongo's test GCash flow |

Use `sk_test_...` for development, `sk_live_...` for production.

---

---

# FRONTEND

> All frontend work lives in the Next.js app. It never touches `PAYMONGO_SECRET_KEY`. The only PayMongo interaction is receiving a URL from the backend and redirecting to it.

---

## Frontend: Environment Variables

```env
# Base URL of your backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

No PayMongo keys are needed on the frontend.

---

## Triggering Checkout

When the user selects a plan and clicks **Start Free Trial** in [src/app/(root)/subscription/page.tsx](src/app/(root)/subscription/page.tsx):

1. Call `POST /localpro-plus/subscribe/:planId` with `{ paymentMethod: "paymongo", billingCycle }`
2. Receive `{ checkoutUrl }` from the backend
3. Redirect the browser to `checkoutUrl`

```typescript
const response = await localproPlusApi.subscribe(planId, {
  paymentMethod: 'paymongo',
  billingCycle,
});
window.location.href = response.checkoutUrl;
```

The user is now on PayMongo's hosted page and completes payment there.

---

## Post-Payment Pages

PayMongo redirects back to these routes after checkout:

| Outcome | Route | Purpose |
|---------|-------|---------|
| Success | `/payment/success?plan=<planId>` | Inform user; poll `GET /localpro-plus/my-subscription` until `status === "active"` |
| Cancelled | `/payment/cancel` | Inform user; offer to return to `/subscription` |

> Plan activation is asynchronous (webhook-driven). The success page should poll or show a brief "activating…" state rather than assuming immediate activation.

---

## Subscription State

Fetch the user's current plan on mount using `localproPlusApi.getMySubscription()`:

```typescript
interface MySubscription {
  planId: string;
  planName: string;
  status: 'trialing' | 'active' | 'cancelled';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
}
```

Use this to:
- Show the current active plan badge in the UI
- Disable "Start Free Trial" for the already-active plan
- Show renewal date

---

## Handling Payment Errors

| Scenario | Frontend Behavior |
|----------|------------------|
| Backend returns no `checkoutUrl` | Show inline error in the dialog |
| User cancels on PayMongo page | Redirect to `/payment/cancel`; offer retry |
| Success page but webhook not yet fired | Show "Activating your plan…" spinner; poll subscription status |
| Network error calling subscribe API | Show error message in the trial dialog |
