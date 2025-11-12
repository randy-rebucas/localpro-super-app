# Client Flow Documentation

## Overview
This document describes the detailed flows for client interactions in the LocalPro Super App.

## Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Request Verification Code
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 │
┌──────────────────┐                    │
│ Send SMS Code    │                    │
│ /send-code       │                    │
└──────┬───────────┘                    │
       │                                 │
       │ 2. SMS Code Sent                │
       │                                 │
       ▼                                 │
┌──────────────────┐                    │
│ Enter Code       │                    │
└──────┬───────────┘                    │
       │                                 │
       │ 3. Submit Code                 │
       ├─────────────────────────────────┘
       │
       ▼
┌──────────────────┐
│ Verify Code      │
│ /verify-code     │
└──────┬───────────┘
       │
       │ 4. Code Valid
       │
       ▼
┌──────────────────┐
│ JWT Token Issued │
└──────┬───────────┘
       │
       │ 5. Complete Onboarding
       │
       ▼
┌──────────────────┐
│ Onboarding      │
│ /complete-      │
│ onboarding      │
└──────────────────┘
```

## Service Booking Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Browse Services
       │
       ▼
┌──────────────────────┐
│ GET /services        │
│ (with filters)       │
└──────┬───────────────┘
       │
       │ 2. Select Service
       │
       ▼
┌──────────────────────┐
│ GET /services/:id    │
│ GET /providers/:id   │
└──────┬───────────────┘
       │
       │ 3. Create Booking
       │
       ▼
┌──────────────────────┐
│ POST /bookings       │
│ (serviceId, date,    │
│  address, notes)     │
└──────┬───────────────┘
       │
       │ 4. Payment Required
       │
       ▼
┌──────────────────────┐
│ PayPal/PayMaya      │
│ Payment Flow         │
└──────┬───────────────┘
       │
       │ 5. Payment Approved
       │
       ▼
┌──────────────────────┐
│ POST /bookings/      │
│ paypal/approve       │
└──────┬───────────────┘
       │
       │ 6. Booking Confirmed
       │
       ▼
┌──────────────────────┐
│ Notification Sent   │
│ Booking Status:      │
│ confirmed            │
└──────────────────────┘
```

## Booking Management Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. View My Bookings
       │
       ▼
┌──────────────────────┐
│ GET /my-bookings     │
└──────┬───────────────┘
       │
       │ 2. Select Booking
       │
       ▼
┌──────────────────────┐
│ GET /bookings/:id   │
└──────┬───────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Cancel       │  │ Update       │
│ Booking      │  │ Status       │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │                 │
       ▼                 ▼
┌──────────────────────┐
│ PUT /bookings/:id/   │
│ status               │
│ (status: cancelled) │
└──────────────────────┘
```

## Service Completion Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Service Completed
       │
       ▼
┌──────────────────────┐
│ Upload Photos        │
│ POST /bookings/:id/  │
│ photos               │
└──────┬───────────────┘
       │
       │ 2. Add Review
       │
       ▼
┌──────────────────────┐
│ POST /bookings/:id/  │
│ review               │
│ (rating, comment,    │
│  photos)             │
└──────┬───────────────┘
       │
       │ 3. Review Published
       │
       ▼
┌──────────────────────┐
│ Booking Status:      │
│ reviewed             │
│ Provider Rating      │
│ Updated              │
└──────────────────────┘
```

## Job Application Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Search Jobs
       │
       ▼
┌──────────────────────┐
│ GET /jobs/search     │
│ (query, filters)     │
└──────┬───────────────┘
       │
       │ 2. View Job Details
       │
       ▼
┌──────────────────────┐
│ GET /jobs/:id        │
└──────┬───────────────┘
       │
       │ 3. Apply for Job
       │
       ▼
┌──────────────────────┐
│ POST /jobs/:id/apply │
│ (resume, coverLetter)│
└──────┬───────────────┘
       │
       │ 4. Application Submitted
       │
       ▼
┌──────────────────────┐
│ Track Application    │
│ GET /my-applications │
│ Status: pending      │
└──────────────────────┘
```

## Course Enrollment Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Browse Courses
       │
       ▼
┌──────────────────────┐
│ GET /academy/courses │
└──────┬───────────────┘
       │
       │ 2. View Course Details
       │
       ▼
┌──────────────────────┐
│ GET /courses/:id     │
└──────┬───────────────┘
       │
       │ 3. Enroll in Course
       │
       ▼
┌──────────────────────┐
│ POST /courses/:id/   │
│ enroll                │
└──────┬───────────────┘
       │
       │ 4. Payment (if paid)
       │
       ▼
┌──────────────────────┐
│ Access Course        │
│ Content               │
└──────┬───────────────┘
       │
       │ 5. Track Progress
       │
       ▼
┌──────────────────────┐
│ PUT /courses/:id/    │
│ progress              │
│ (module, lesson,     │
│  completed)           │
└──────┬───────────────┘
       │
       │ 6. Complete Course
       │
       ▼
┌──────────────────────┐
│ Certificate Issued   │
│ Review Added          │
└──────────────────────┘
```

## Communication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. View Conversations
       │
       ▼
┌──────────────────────┐
│ GET /conversations   │
└──────┬───────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Create New   │  │ Open Existing│
│ Conversation │  │ Conversation │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │                 │
       ▼                 ▼
┌──────────────────────┐
│ POST /conversations  │
│ GET /conversations/:id│
└──────┬───────────────┘
       │
       │ 2. Send Message
       │
       ▼
┌──────────────────────┐
│ POST /conversations/ │
│ :id/messages         │
│ (content, attachments)│
└──────┬───────────────┘
       │
       │ 3. Mark as Read
       │
       ▼
┌──────────────────────┐
│ PUT /conversations/  │
│ :id/read             │
└──────────────────────┘
```

## Financial Management Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. View Overview
       │
       ▼
┌──────────────────────┐
│ GET /finance/overview│
└──────┬───────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ View         │  │ View         │
│ Transactions │  │ Earnings     │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │                 │
       ▼                 ▼
┌──────────────────────┐
│ GET /transactions    │
│ GET /earnings        │
│ GET /expenses        │
└──────┬───────────────┘
       │
       │ 2. Request Top-Up
       │
       ▼
┌──────────────────────┐
│ POST /top-up         │
│ (amount, receipt)    │
└──────┬───────────────┘
       │
       │ 3. Admin Processes
       │
       ▼
┌──────────────────────┐
│ Top-Up Approved      │
│ Balance Updated       │
└──────────────────────┘
```

## Error Handling Flow

```
┌─────────────┐
│   Client     │
└──────┬──────┘
       │
       │ Request
       │
       ▼
┌──────────────────────┐
│ API Endpoint         │
└──────┬───────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Success      │  │ Error        │
│ (200)        │  │ (4xx/5xx)    │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Return Data  │  │ Error Message│
│              │  │ Retry Logic  │
└──────────────┘  └──────────────┘
```

## Summary
Client flows follow standard patterns: discovery → selection → action → confirmation → review. All flows include error handling, payment processing where applicable, and notification systems to keep clients informed of status changes.

