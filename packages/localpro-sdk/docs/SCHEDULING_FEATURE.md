# Scheduling Feature — Developer Reference

## Overview

The Scheduling feature covers two distinct domains mounted on separate routers:

1. **Scheduling / AI Suggestions** (`/api/scheduling`) — AI-driven job ranking and schedule generation for providers; learns from past outcomes to improve future suggestions.
2. **Availability / Calendar** (`/api/availability`) — Calendar block management, job schedule surfacing, time-off requests, and reschedule-request workflows between clients and providers.

All routes require a valid auth token and are covered by `schedulingLimiter` (60 req / min).

---

## Architecture

```
features/scheduling/
├── controllers/
│   ├── schedulingController.js     # 9 handlers — job ranking + AI suggestions
│   └── availabilityController.js   # 11 handlers — calendar, schedules, reschedule
├── models/
│   ├── CalendarAvailability.js     # Provider calendar blocks
│   ├── RescheduleRequest.js        # Reschedule request documents
│   └── SchedulingSuggestion.js     # AI-generated suggestion documents
├── routes/
│   ├── scheduling.js               # 9 routes — all auth-gated, schedulingLimiter
│   └── availability.js             # 11 routes — all auth-gated, schedulingLimiter
├── services/
│   ├── schedulingService.js        # Core AI ranking + suggestion logic
│   ├── availabilityService.js      # Calendar CRUD + reschedule orchestration
│   ├── automatedSchedulingService.js
│   ├── automatedAvailabilityService.js
│   ├── automatedBookingService.js
│   └── automatedMarketplaceBookingFollowUpService.js
└── index.js

packages/localpro-sdk/lib/scheduling.js  # SDK SchedulingAPI class (20 methods)
```

---

## Endpoints

### Scheduling — AI Suggestions (`/api/scheduling`, auth required)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `POST` | `/api/scheduling/rank-job/:jobId` | `calculateJobRanking` | Score a job for the provider |
| `GET` | `/api/scheduling/ranked-jobs` | `getRankedJobs` | Retrieve top-ranked jobs |
| `POST` | `/api/scheduling/suggestions/daily` | `generateDailySuggestion` | Generate today's schedule |
| `POST` | `/api/scheduling/suggestions/weekly` | `generateWeeklySuggestion` | Generate week schedule |
| `POST` | `/api/scheduling/suggestions/idle-time` | `detectIdleTimeAndSuggest` | Fill idle windows with jobs |
| `GET` | `/api/scheduling/suggestions` | `getSuggestions` | List active suggestions |
| `PUT` | `/api/scheduling/suggestions/:id/accept-job/:jobId` | `acceptSuggestedJob` | Accept a job from suggestion |
| `PUT` | `/api/scheduling/suggestions/:id/reject-job/:jobId` | `rejectSuggestedJob` | Reject a job from suggestion |
| `POST` | `/api/scheduling/learn-outcome` | `learnFromOutcome` | Feed outcome back to AI |

### Availability / Calendar (`/api/availability`, auth required)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `POST` | `/api/availability` | `createAvailability` | Create a calendar block |
| `GET` | `/api/availability` | `getAvailability` | List availability blocks (30-day default) |
| `GET` | `/api/availability/calendar` | `getCalendarView` | Day or week calendar view |
| `PUT` | `/api/availability/:id` | `updateAvailability` | Update a calendar block |
| `DELETE` | `/api/availability/:id` | `deleteAvailability` | Delete a calendar block |
| `GET` | `/api/availability/schedules` | `getSchedules` | List job schedules |
| `POST` | `/api/availability/reschedule` | `createRescheduleRequest` | Request a new time slot |
| `GET` | `/api/availability/reschedule` | `getRescheduleRequests` | List reschedule requests |
| `PUT` | `/api/availability/reschedule/:id/approve` | `approveRescheduleRequest` | Provider approves reschedule |
| `PUT` | `/api/availability/reschedule/:id/reject` | `rejectRescheduleRequest` | Reject reschedule request |
| `POST` | `/api/availability/time-off` | `addTimeOff` | Block out a time-off period |

---

## Rate Limiting

| Limiter | Window | Max | Header Code |
|---------|--------|-----|-------------|
| `schedulingLimiter` | 60 s | 60 req | `SCHEDULING_RATE_LIMIT` |

Applied via `router.use(schedulingLimiter)` at the top of both route files before any route definition.

---

## Error Handling

Both controllers were already clean at audit time — all catch blocks use `logger.error` + `sendServerError` from `src/utils/responseHelper`. No raw `error.message` leaks or `console.error` calls were present.

---

## SDK — `SchedulingAPI`

```js
const sdk = new LocalProSDK({ baseURL: '...', token: 'JWT' });

// ── Scheduling / AI ──────────────────────────────────────────────────────────

await sdk.scheduling.calculateJobRanking('job-id');
await sdk.scheduling.getRankedJobs({ limit: 20, minScore: 50 });
await sdk.scheduling.generateDailySuggestion({ date: '2026-03-01' });
await sdk.scheduling.generateWeeklySuggestion({ weekStartDate: '2026-03-02' });
await sdk.scheduling.detectIdleTimeAndSuggest({ startDate: '2026-03-01', endDate: '2026-03-08' });
await sdk.scheduling.getSuggestions({ type: 'daily' });
await sdk.scheduling.acceptSuggestedJob('suggestion-id', 'job-id');
await sdk.scheduling.rejectSuggestedJob('suggestion-id', 'job-id');
await sdk.scheduling.learnFromOutcome({ jobId: 'job-id', outcome: 'completed' });

// ── Availability / Calendar ───────────────────────────────────────────────────

await sdk.scheduling.createAvailability({
  startTime: '2026-03-01T09:00:00Z',
  endTime:   '2026-03-01T17:00:00Z',
  type: 'available'
});
await sdk.scheduling.getAvailability({ startDate: '2026-03-01', endDate: '2026-03-31' });
await sdk.scheduling.getCalendarView({ viewType: 'week', startDate: '2026-03-02' });
await sdk.scheduling.updateAvailability('avail-id', { title: 'Updated block' });
await sdk.scheduling.deleteAvailability('avail-id');
await sdk.scheduling.getSchedules({ status: 'scheduled' });
await sdk.scheduling.createRescheduleRequest({
  jobSchedule: 'schedule-id',
  requestedStartTime: '2026-03-05T08:00:00Z',
  requestedEndTime:   '2026-03-05T10:00:00Z',
  reason: 'Equipment delay'
});
await sdk.scheduling.getRescheduleRequests({ status: 'pending' });
await sdk.scheduling.approveRescheduleRequest('request-id');
await sdk.scheduling.rejectRescheduleRequest('request-id', { rejectionReason: 'Already booked' });
await sdk.scheduling.addTimeOff({ startDate: '2026-03-10T00:00:00Z', endDate: '2026-03-12T23:59:59Z', reason: 'Holiday' });
```

### SDK Method Reference

| Method | Parameters | Description |
|--------|-----------|-------------|
| `calculateJobRanking(jobId, data?)` | `jobId: string` | Score a job for the provider |
| `getRankedJobs(params?)` | `{ limit?, minScore? }` | Top-ranked job list |
| `generateDailySuggestion(data?)` | `{ date? }` | Today's AI schedule suggestion |
| `generateWeeklySuggestion(data?)` | `{ weekStartDate? }` | Weekly AI schedule suggestion |
| `detectIdleTimeAndSuggest(data?)` | `{ startDate?, endDate? }` | Fill idle slots with jobs |
| `getSuggestions(params?)` | `{ type? }` | List active AI suggestions |
| `acceptSuggestedJob(suggestionId, jobId, data?)` | both IDs required | Accept job from suggestion |
| `rejectSuggestedJob(suggestionId, jobId, data?)` | both IDs required | Reject job from suggestion |
| `learnFromOutcome(data)` | `{ jobId, outcome }` both required | Feed outcome to AI |
| `createAvailability(data)` | `{ startTime, endTime }` required | Create calendar block |
| `getAvailability(params?)` | `{ startDate?, endDate? }` | List calendar blocks |
| `getCalendarView(params?)` | `{ viewType?, startDate?, endDate? }` | Day/week calendar view |
| `updateAvailability(id, data)` | `id` required | Patch a calendar block |
| `deleteAvailability(id)` | `id` required | Remove a calendar block |
| `getSchedules(params?)` | `{ startDate?, endDate?, status? }` | List job schedules |
| `createRescheduleRequest(data)` | `{ jobSchedule, requestedStartTime, requestedEndTime, reason }` all required | Request reschedule |
| `getRescheduleRequests(params?)` | `{ status? }` | List reschedule requests |
| `approveRescheduleRequest(id)` | `id` required | Provider approves reschedule |
| `rejectRescheduleRequest(id, data?)` | `id` required; `{ rejectionReason? }` | Reject reschedule |
| `addTimeOff(data)` | `{ startDate, endDate }` required | Block time-off period |

### Input Validation Guards

The SDK throws synchronously before any network call:

| Method | Guard |
|--------|-------|
| `calculateJobRanking(jobId)` | `jobId` non-empty string |
| `acceptSuggestedJob(suggestionId, jobId)` | both non-empty strings |
| `rejectSuggestedJob(suggestionId, jobId)` | both non-empty strings |
| `learnFromOutcome(data)` | `data.jobId` and `data.outcome` present |
| `createAvailability(data)` | `data.startTime` and `data.endTime` present |
| `updateAvailability(id, data)` | `id` non-empty string |
| `deleteAvailability(id)` | `id` non-empty string |
| `createRescheduleRequest(data)` | all 4 required fields present |
| `approveRescheduleRequest(id)` | `id` non-empty string |
| `rejectRescheduleRequest(id)` | `id` non-empty string |
| `addTimeOff(data)` | `data.startDate` and `data.endDate` present |

---

## Hardening Changelog

| Version | Change |
|---------|--------|
| v2 | Added `schedulingLimiter` (60 req/min) to `rateLimiter.js` |
| v2 | Applied `router.use(schedulingLimiter)` to both `scheduling.js` and `availability.js` route files (previously zero rate limiting) |
| v2 | SDK: fixed critical double-client bug — all 9 original methods used `this.client.client.*` (axios instance directly, bypassing error interception and response unwrapping); corrected to `this.client.*` |
| v2 | SDK: added `@classdesc` + `@example` block to `SchedulingAPI`; added full `@param`/`@returns`/`@throws` JSDoc to all methods |
| v2 | SDK: added 11 availability methods covering all `availabilityController` handlers (previously had 0 SDK coverage) |
| v2 | SDK: added synchronous input guards to 11 methods |
