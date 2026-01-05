# GPS & Time Tracking API Endpoints

Complete list of all API endpoints for the GPS & Time Tracking feature.

**Base URL:** `/api`

**Authentication:** All endpoints require Bearer token authentication.

---

## Authentication Endpoints

Before using the GPS & Time Tracking endpoints, you need to authenticate and obtain a JWT token.

### Register User
```
POST /api/auth/register
```

### Login
```
POST /api/auth/login
```
**Response includes:** `token` (access token), `refreshToken`, `user` object

### Login with Email
```
POST /api/auth/login-email
```
**Request Body:** `email`, `password`

### Verify Email OTP
```
POST /api/auth/verify-email-otp
```
**Request Body:** `email`, `otp`

### Get Current User Profile
```
GET /api/auth/me
```
**Headers:** `Authorization: Bearer <token>`

### Refresh Access Token
```
POST /api/auth/refresh
```
**Request Body:** `refreshToken`

### Logout
```
POST /api/auth/logout
```
**Headers:** `Authorization: Bearer <token>`

### Register with Email
```
POST /api/auth/register-email
```
**Request Body:** `email`, `password`, `firstName` (optional), `lastName` (optional)

### Send Verification Code (Phone)
```
POST /api/auth/send-code
```
**Request Body:** `phoneNumber`

### Verify Code (Phone)
```
POST /api/auth/verify-code
```
**Request Body:** `phoneNumber`, `code`

### Check Email
```
POST /api/auth/check-email
```
**Request Body:** `email`

### Set Password
```
POST /api/auth/set-password
```
**Request Body:** `email`, `otp`, `password`

---

## Time Entries Endpoints

### Create Time Entry (Clock In)
```
POST /api/time-entries
```

### Get All Time Entries
```
GET /api/time-entries
```
**Query Parameters:** `page`, `limit`, `startDate`, `endDate`, `jobId`, `status`

### Get Time Entry by ID
```
GET /api/time-entries/:id
```
**Path Parameters:** `id` (time entry ID)

### Update Time Entry
```
PATCH /api/time-entries/:id
```
**Path Parameters:** `id` (time entry ID)

### Get Active Time Entry
```
GET /api/time-entries/active/:userId
```
**Path Parameters:** `userId` (user ID)

### Clock Out
```
POST /api/time-entries/:id/clock-out
```
**Path Parameters:** `id` (time entry ID)

### Request Manual Edit
```
POST /api/time-entries/:id/request-edit
```
**Path Parameters:** `id` (time entry ID)

---

## GPS Logs Endpoints

### Create GPS Log
```
POST /api/gps-logs
```

### Batch Create GPS Logs
```
POST /api/gps-logs/batch
```

### Get GPS Logs
```
GET /api/gps-logs
```
**Query Parameters:** `page`, `limit`, `timeEntryId`, `startDate`, `endDate`

### Get GPS Logs by Time Entry
```
GET /api/gps-logs/time-entry/:timeEntryId
```
**Path Parameters:** `timeEntryId` (time entry ID)

**Query Parameters:** `page`, `limit`

---

## Geofence Events Endpoints

### Create Geofence Event
```
POST /api/geofence-events
```

### Get Geofence Events
```
GET /api/geofence-events
```
**Query Parameters:** `page`, `limit`, `jobId`, `eventType`, `startDate`, `endDate`, `targetUserId`

### Get Geofence Events by Job
```
GET /api/geofence-events/job/:jobId
```
**Path Parameters:** `jobId` (job ID)

**Query Parameters:** `page`, `limit`

### Get Geofence Events by User
```
GET /api/geofence-events/user/:userId
```
**Path Parameters:** `userId` (user ID)

**Query Parameters:** `page`, `limit`

---

## Calendar & Availability Endpoints

### Create Availability Block
```
POST /api/availability
```
**Request Body:** `startTime`, `endTime`, `title` (optional), `isRecurring` (optional), `recurrencePattern` (optional), `type` (optional), `notes` (optional)

### Get Availability
```
GET /api/availability
```
**Query Parameters:** `startDate`, `endDate`

### Get Calendar View
```
GET /api/availability/calendar
```
**Query Parameters:** `viewType` (day/week), `startDate`, `endDate`

### Update Availability
```
PUT /api/availability/:id
```
**Path Parameters:** `id` (availability ID)

### Delete Availability
```
DELETE /api/availability/:id
```
**Path Parameters:** `id` (availability ID)

### Get Job Schedules
```
GET /api/availability/schedules
```
**Query Parameters:** `startDate`, `endDate`, `status`

### Create Reschedule Request
```
POST /api/availability/reschedule
```
**Request Body:** `jobSchedule`, `requestedStartTime`, `requestedEndTime`, `reason`

### Get Reschedule Requests
```
GET /api/availability/reschedule
```
**Query Parameters:** `status`

### Approve Reschedule Request
```
PUT /api/availability/reschedule/:id/approve
```
**Path Parameters:** `id` (reschedule request ID)

### Reject Reschedule Request
```
PUT /api/availability/reschedule/:id/reject
```
**Path Parameters:** `id` (reschedule request ID)
**Request Body:** `rejectionReason` (optional)

---

## AI-Powered Smart Scheduling Endpoints

### Calculate Job Ranking
```
POST /api/scheduling/rank-job/:jobId
```
**Path Parameters:** `jobId` (job ID)

### Get Ranked Jobs
```
GET /api/scheduling/ranked-jobs
```
**Query Parameters:** `limit` (default: 50), `minScore` (default: 0)

### Generate Daily Schedule Suggestion
```
POST /api/scheduling/suggestions/daily
```
**Request Body:** `date` (optional, defaults to today)

### Generate Weekly Schedule Suggestion
```
POST /api/scheduling/suggestions/weekly
```
**Request Body:** `weekStartDate` (optional, defaults to today)

### Detect Idle Time and Suggest Jobs
```
POST /api/scheduling/suggestions/idle-time
```
**Request Body:** `startDate`, `endDate`

### Get Scheduling Suggestions
```
GET /api/scheduling/suggestions
```
**Query Parameters:** `type` (daily/weekly/fill_in/idle_time), `status`

### Accept Suggested Job
```
PUT /api/scheduling/suggestions/:id/accept-job/:jobId
```
**Path Parameters:** `id` (suggestion ID), `jobId` (job ID)

### Reject Suggested Job
```
PUT /api/scheduling/suggestions/:id/reject-job/:jobId
```
**Path Parameters:** `id` (suggestion ID), `jobId` (job ID)

### Learn from Job Outcome
```
POST /api/scheduling/learn-outcome
```
**Request Body:** `jobId`, `outcome`

---

## Job Workflow & Task Execution Endpoints

### Initialize Job Progress
```
POST /api/job-workflow/progress/:jobId/initialize
```
**Path Parameters:** `jobId` (job ID)
**Request Body:** `jobScheduleId` (optional), `serviceType` (optional)

### Get Job Progress
```
GET /api/job-workflow/progress/:jobId
```
**Path Parameters:** `jobId` (job ID)

### Start Job
```
POST /api/job-workflow/progress/:jobId/start
```
**Path Parameters:** `jobId` (job ID)

### Pause Job
```
POST /api/job-workflow/progress/:jobId/pause
```
**Path Parameters:** `jobId` (job ID)

### Complete Job
```
POST /api/job-workflow/progress/:jobId/complete
```
**Path Parameters:** `jobId` (job ID)

### Complete Task
```
POST /api/job-workflow/progress/:jobId/tasks/:taskIndex/complete
```
**Path Parameters:** `jobId` (job ID), `taskIndex` (task index)
**Request Body:** `notes` (optional)
**File Upload:** `proofFiles` (array of files, optional)

### Upload Proof of Work
```
POST /api/job-workflow/proof/:jobId/upload
```
**Path Parameters:** `jobId` (job ID)
**Request Body:** `description` (optional), `location` (optional, JSON string)
**File Upload:** `file` (single file, required)

### Get Proofs for Job
```
GET /api/job-workflow/proof/:jobId
```
**Path Parameters:** `jobId` (job ID)

### Report Issue
```
POST /api/job-workflow/issues/:jobId
```
**Path Parameters:** `jobId` (job ID)
**Request Body:** `type`, `severity` (optional), `title`, `description`, `jobProgressId` (optional), `location` (optional, JSON string)
**File Upload:** `attachments` (array of files, optional)

### Get Issues for Job
```
GET /api/job-workflow/issues/:jobId
```
**Path Parameters:** `jobId` (job ID)
**Query Parameters:** `status`

### Escalate Issue
```
PUT /api/job-workflow/issues/:issueId/escalate
```
**Path Parameters:** `issueId` (issue ID)
**Request Body:** `escalatedTo`, `reason`

### Resolve Issue
```
PUT /api/job-workflow/issues/:issueId/resolve
```
**Path Parameters:** `issueId` (issue ID)
**Request Body:** `resolutionNotes`, `actionTaken`

### Get Task Checklists
```
GET /api/job-workflow/checklists
```
**Query Parameters:** `serviceType`, `categoryId`

---

## Quotes, Estimates & Invoicing Endpoints

### Create Quote from Template
```
POST /api/quotes/from-template/:templateId
```
**Path Parameters:** `templateId` (template ID)
**Request Body:** `jobId`, `title` (optional), `description` (optional), `items` (optional), `labor` (optional), `materials` (optional), `tax` (optional), `discount` (optional), `notes` (optional), `terms` (optional), `validityDays` (optional)

### Create Custom Quote
```
POST /api/quotes
```
**Request Body:** `job`, `client`, `title`, `description` (optional), `items`, `labor` (optional), `materials` (optional), `tax` (optional), `discount` (optional), `currency` (optional), `notes` (optional), `terms` (optional), `validityDays` (optional)

### Get Quotes for Job
```
GET /api/quotes/job/:jobId
```
**Path Parameters:** `jobId` (job ID)

### Get Quote by ID
```
GET /api/quotes/:id
```
**Path Parameters:** `id` (quote ID)

### Send Quote
```
POST /api/quotes/:id/send
```
**Path Parameters:** `id` (quote ID)

### Approve Quote
```
POST /api/quotes/:id/approve
```
**Path Parameters:** `id` (quote ID)
**Request Body:** `digitalSignature` (optional)

### Reject Quote
```
POST /api/quotes/:id/reject
```
**Path Parameters:** `id` (quote ID)
**Request Body:** `rejectionReason`

### Create Quote Template
```
POST /api/quotes/templates
```
**Request Body:** `name`, `description` (optional), `category` (optional), `jobCategory` (optional), `serviceType` (optional), `items`, `labor` (optional), `materials` (optional), `tax` (optional), `discount` (optional), `currency` (optional), `notes` (optional), `terms` (optional), `validityDays` (optional), `isDefault` (optional)

### Get Quote Templates
```
GET /api/quotes/templates
```
**Query Parameters:** `serviceType`

### Generate Invoice from Quote
```
POST /api/invoices/from-quote/:quoteId
```
**Path Parameters:** `quoteId` (quote ID)
**Request Body:** `actualHours` (optional), `dueDate` (optional)

### Generate Invoice from Job
```
POST /api/invoices/from-job/:jobId
```
**Path Parameters:** `jobId` (job ID)
**Request Body:** `items`, `labor` (optional), `materials` (optional), `tax` (optional), `discount` (optional), `currency` (optional), `dueDate`, `notes` (optional), `terms` (optional)

### Get Invoices for Job
```
GET /api/invoices/job/:jobId
```
**Path Parameters:** `jobId` (job ID)

### Get Invoice by ID
```
GET /api/invoices/:id
```
**Path Parameters:** `id` (invoice ID)

### Send Invoice
```
POST /api/invoices/:id/send
```
**Path Parameters:** `id` (invoice ID)

### Mark Invoice as Paid
```
PUT /api/invoices/:id/mark-paid
```
**Path Parameters:** `id` (invoice ID)
**Request Body:** `paymentMethod`, `transactionId` (optional), `reference` (optional)

---

## Masked Calls Endpoints

### Create Masked Call Session
```
POST /api/masked-calls
```
**Request Body:** `clientId`, `jobId` (optional), `conversationId` (optional)

### Get Masked Call Session
```
GET /api/masked-calls/:id
```
**Path Parameters:** `id` (masked call session ID)

### Initiate Call
```
POST /api/masked-calls/:id/initiate
```
**Path Parameters:** `id` (masked call session ID)
**Request Body:** `toUserId`

### End Call
```
POST /api/masked-calls/:id/calls/:callId/end
```
**Path Parameters:** `id` (masked call session ID), `callId` (call ID)
**Request Body:** `duration` (in seconds)

---

## Summary

**Total Endpoints:** 95

- **Authentication:** 12 endpoints
- **Time Entries:** 7 endpoints
- **GPS Logs:** 4 endpoints
- **Geofence Events:** 4 endpoints
- **Calendar & Availability:** 10 endpoints
- **AI-Powered Smart Scheduling:** 9 endpoints
- **Job Workflow & Task Execution:** 12 endpoints
- **Quotes, Estimates & Invoicing:** 16 endpoints
- **Masked Calls:** 4 endpoints

---

## Quick Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns token)
- `POST /api/auth/login-email` - Login with email
- `POST /api/auth/verify-email-otp` - Verify email OTP
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/register-email` - Register with email
- `POST /api/auth/send-code` - Send phone verification code
- `POST /api/auth/verify-code` - Verify phone code
- `POST /api/auth/check-email` - Check if email exists
- `POST /api/auth/set-password` - Set password

### Time Entries
- `POST /api/time-entries` - Create (Clock In)
- `GET /api/time-entries` - List all
- `GET /api/time-entries/:id` - Get one
- `PATCH /api/time-entries/:id` - Update
- `GET /api/time-entries/active/:userId` - Get active
- `POST /api/time-entries/:id/clock-out` - Clock out
- `POST /api/time-entries/:id/request-edit` - Request edit

### GPS Logs
- `POST /api/gps-logs` - Create one
- `POST /api/gps-logs/batch` - Create many
- `GET /api/gps-logs` - List all
- `GET /api/gps-logs/time-entry/:timeEntryId` - List by time entry

### Geofence Events
- `POST /api/geofence-events` - Create
- `GET /api/geofence-events` - List all
- `GET /api/geofence-events/job/:jobId` - List by job
- `GET /api/geofence-events/user/:userId` - List by user

### Calendar & Availability
- `POST /api/availability` - Create availability block
- `GET /api/availability` - Get availability
- `GET /api/availability/calendar` - Get calendar view
- `PUT /api/availability/:id` - Update availability
- `DELETE /api/availability/:id` - Delete availability
- `GET /api/availability/schedules` - Get job schedules
- `POST /api/availability/reschedule` - Create reschedule request
- `GET /api/availability/reschedule` - Get reschedule requests
- `PUT /api/availability/reschedule/:id/approve` - Approve reschedule
- `PUT /api/availability/reschedule/:id/reject` - Reject reschedule

### AI-Powered Smart Scheduling
- `POST /api/scheduling/rank-job/:jobId` - Calculate job ranking
- `GET /api/scheduling/ranked-jobs` - Get ranked jobs
- `POST /api/scheduling/suggestions/daily` - Generate daily suggestion
- `POST /api/scheduling/suggestions/weekly` - Generate weekly suggestion
- `POST /api/scheduling/suggestions/idle-time` - Detect idle time
- `GET /api/scheduling/suggestions` - Get suggestions
- `PUT /api/scheduling/suggestions/:id/accept-job/:jobId` - Accept suggested job
- `PUT /api/scheduling/suggestions/:id/reject-job/:jobId` - Reject suggested job
- `POST /api/scheduling/learn-outcome` - Learn from job outcome

### Job Workflow & Task Execution
- `POST /api/job-workflow/progress/:jobId/initialize` - Initialize progress
- `GET /api/job-workflow/progress/:jobId` - Get progress
- `POST /api/job-workflow/progress/:jobId/start` - Start job
- `POST /api/job-workflow/progress/:jobId/pause` - Pause job
- `POST /api/job-workflow/progress/:jobId/complete` - Complete job
- `POST /api/job-workflow/progress/:jobId/tasks/:taskIndex/complete` - Complete task
- `POST /api/job-workflow/proof/:jobId/upload` - Upload proof
- `GET /api/job-workflow/proof/:jobId` - Get proofs
- `POST /api/job-workflow/issues/:jobId` - Report issue
- `GET /api/job-workflow/issues/:jobId` - Get issues
- `PUT /api/job-workflow/issues/:issueId/escalate` - Escalate issue
- `PUT /api/job-workflow/issues/:issueId/resolve` - Resolve issue
- `GET /api/job-workflow/checklists` - Get task checklists

### Quotes, Estimates & Invoicing
- `POST /api/quotes/from-template/:templateId` - Create quote from template
- `POST /api/quotes` - Create custom quote
- `GET /api/quotes/job/:jobId` - Get quotes for job
- `GET /api/quotes/:id` - Get quote by ID
- `POST /api/quotes/:id/send` - Send quote
- `POST /api/quotes/:id/approve` - Approve quote
- `POST /api/quotes/:id/reject` - Reject quote
- `POST /api/quotes/templates` - Create template
- `GET /api/quotes/templates` - Get templates
- `POST /api/invoices/from-quote/:quoteId` - Generate invoice from quote
- `POST /api/invoices/from-job/:jobId` - Generate invoice from job
- `GET /api/invoices/job/:jobId` - Get invoices for job
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices/:id/send` - Send invoice
- `PUT /api/invoices/:id/mark-paid` - Mark invoice as paid

### Masked Calls
- `POST /api/masked-calls` - Create masked call session
- `GET /api/masked-calls/:id` - Get masked call session
- `POST /api/masked-calls/:id/initiate` - Initiate call
- `POST /api/masked-calls/:id/calls/:callId/end` - End call
