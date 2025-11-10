# Analytics API Endpoints

Base path: `/api/analytics`

## Overview
- GET `/overview` — high-level KPIs (users, services, jobs, agencies, referrals, revenue, top providers)
- GET `/user` — user analytics (registrations, roles, location, engagement)
- GET `/marketplace` — service/booking/provider analytics
- GET `/jobs` — job board analytics
- GET `/referrals` — referral analytics
- GET `/agencies` — agency analytics
- GET `/custom` — admin-only custom event query
- POST `/track` — track analytics event

All routes require auth; `/custom` also requires admin.

## GET /overview
Query: `startDate?`, `endDate?` (ISO strings)
Response: `{ success, data: { overview{ totalUsers,totalServices,totalJobs,totalAgencies,totalReferrals }, userRegistrations[], serviceCategories[], jobCategories[], topProviders[], revenueAnalytics[], referralAnalytics[] } }`

## GET /user
Query: `startDate?`, `endDate?`
Response: `{ success, data: { userRegistrations[], usersByRole[], usersByLocation[], userEngagement[] } }`

## GET /marketplace
Query: `startDate?`, `endDate?`
Response: `{ success, data: { serviceAnalytics[], bookingAnalytics[], topServices[], providerPerformance[] } }`

## GET /jobs
Query: `startDate?`, `endDate?`
Response: `{ success, data: { jobAnalytics[], jobStatusAnalytics[], topEmployers[], applicationAnalytics[] } }`

## GET /referrals
Query: `startDate?`, `endDate?`
Response: `{ success, data: { referralStatusAnalytics[], referralTypeAnalytics[], topReferrers[], referralConversion[] } }`

## GET /agencies
Query: `startDate?`, `endDate?`
Response: `{ success, data: { agencyAnalytics[], agencyPerformance[] } }`

## GET /custom (Admin)
Query: `eventType?`, `module?`, `startDate?`, `endDate?`
Response: `{ success, count, data: [AnalyticsEvent(populated userId)] }`

## POST /track
Body: `{ eventType: string, module: string, data?: object }`
Response: `{ success, message: 'Event tracked successfully', data: AnalyticsEvent }`

## Pagination/limits
- `/custom` returns up to 100 events sorted by `timestamp` desc.

## Error examples
- 400 `{ success:false, message:'Event type and module are required' }`
- 500 `{ success:false, message:'Server error' }`
