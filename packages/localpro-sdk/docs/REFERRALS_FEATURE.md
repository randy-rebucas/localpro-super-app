# Referrals Feature — Developer Reference

## Overview

The Referrals feature is part of the `features/finance` domain and provides a
full referral marketing system: public code validation and click tracking,
authenticated user referral management (invitations, stats, links, rewards,
preferences), and admin-only analytics and completion processing.

All routes are covered by `referralsLimiter` (60 req / min).  
Public routes (`/validate`, `/track`, `/leaderboard`) are unauthenticated;
all other routes require a valid auth token.

---

## Architecture

```
features/finance/
├── controllers/
│   └── referralController.js         # 11 handlers
├── models/
│   └── Referral.js                   # Referral document schema
├── routes/
│   └── referrals.js                  # 11 routes — referralsLimiter applied globally
├── services/
│   ├── referralService.js            # Core referral logic
│   └── referralProcessor.js         # Background completion processing
src/templates/email/
│   ├── referral-invitation.html
│   └── referral-reward-notification.html

packages/localpro-sdk/lib/referrals.js  # SDK ReferralsAPI class (11 methods)
```

---

## Endpoints

### Public (no auth required)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `POST` | `/api/referrals/validate` | `validateReferralCode` | Check if a referral code is valid |
| `POST` | `/api/referrals/track` | `trackReferralClick` | Record a referral link click |
| `GET` | `/api/referrals/leaderboard` | `getReferralLeaderboard` | Top referrers leaderboard |

### Authenticated — Any logged-in user

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/api/referrals/me` | `getMyReferrals` | Own referrals + stats + links |
| `GET` | `/api/referrals/stats` | `getReferralStats` | Own referral stats |
| `GET` | `/api/referrals/links` | `getReferralLinks` | Own shareable referral links |
| `GET` | `/api/referrals/rewards` | `getReferralRewards` | Own reward history |
| `POST` | `/api/referrals/invite` | `sendReferralInvitation` | Send email/SMS invitations |
| `PUT` | `/api/referrals/preferences` | `updateReferralPreferences` | Update notification preferences |

### Admin only

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `POST` | `/api/referrals/process` | `processReferralCompletion` | Trigger completion + reward distribution |
| `GET` | `/api/referrals/analytics` | `getReferralAnalytics` | Aggregate trends + conversion rates |

---

## Rate Limiting

| Limiter | Window | Max | Header Code |
|---------|--------|-----|-------------|
| `referralsLimiter` | 60 s | 60 req | `REFERRALS_RATE_LIMIT` |

Applied via `router.use(referralsLimiter)` before all route definitions.

---

## Error Handling

All handlers use `logger.error` (from `src/config/logger`) in catch blocks and
return a generic `{ success: false, message: 'Server error' }` 500 response —
no `error.message` is exposed to clients.

The inner per-recipient invitation failures (`sendReferralInvitation`) are also
sanitized — failed entries in the results array carry `'Failed to send invitation'`
rather than the raw error message.

---

## SDK Usage (`sdk.referrals`)

```js
const sdk = new LocalProSDK({ baseURL: 'https://api.localpro.ph', token });

// Public
const valid   = await sdk.referrals.validateCode({ code: 'ABC123' });
await sdk.referrals.trackClick({ code: 'ABC123' });
const leaders = await sdk.referrals.getLeaderboard({ limit: 10, timeRange: 7 });

// Authenticated user
const myRefs  = await sdk.referrals.getMyReferrals({ page: 1, limit: 10 });
const stats   = await sdk.referrals.getStats();
const links   = await sdk.referrals.getLinks();
const rewards = await sdk.referrals.getRewards({ status: 'paid', page: 1 });

await sdk.referrals.sendInvitation({
  emails: ['friend@example.com'],
  method: 'email',
  message: 'Join me on LocalPro!'
});
await sdk.referrals.updatePreferences({
  emailNotifications: true,
  smsNotifications: false
});

// Admin only
await sdk.referrals.processCompletion({
  referralId: '<referralId>',
  triggerAction: 'booking_completed'
});
const analytics = await sdk.referrals.getAnalytics({ timeRange: 30, groupBy: 'day' });
```

---

## Reward Flow

```
User registers with referral code
         │
         ▼
   Referral document created (status: pending)
         │
         ▼
   Referee completes trigger action (e.g. first booking)
         │
         ▼
   POST /api/referrals/process  ← admin/system call
         │
         ▼
   rewardDistribution.referrerReward + refereeReward credited
   Referral status → completed
```

---

## v2 Fix Log

| Change | Detail |
|--------|--------|
| Added `referralsLimiter` | 60 req/min to `rateLimiter.js`; applied to all routes |
| `console.error` → `logger.error` | All 11 controller handlers updated; structured `{ error, stack }` logging |
| Fixed error.message leak | `processReferralCompletion` was returning `error.message \|\| 'Server error'`; now always returns generic `'Server error'` |
| Fixed invitation inner leak | Per-recipient failure objects exposed raw `error.message`; replaced with `'Failed to send invitation'` |
| Fixed SDK `{ params }` bug | `getLeaderboard`, `getMyReferrals`, `getAnalytics`, `getStats`, `getRewards` were passing `{ params: {...} }` instead of the params object directly, causing query strings like `?params[page]=1` |
| Added SDK input guards | `validateCode`, `trackClick`, `sendInvitation`, `updatePreferences`, `processCompletion` now throw before making the network call when required fields are missing |
| Added SDK `@classdesc`/`@example` | Class-level JSDoc added to `ReferralsAPI` |
