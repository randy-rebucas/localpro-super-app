# Analytics Data Entities

## Models

### AnalyticsEvent
- userId: ObjectId (User, required)
- eventType: enum ['page_view','service_view','booking_created','booking_completed','job_view','job_application','course_enrollment','product_purchase','referral_click','referral_completed','subscription_upgrade','payment_completed','search_performed','filter_applied','user_registration','user_login','profile_update']
- eventData: Mixed (flexible per event)
- metadata: { userAgent, ipAddress, referrer, sessionId, deviceType: enum['desktop','mobile','tablet'], browser, os, location{country,region,city,coordinates{lat,lng}} }
- timestamp: Date (default now)
- Indexes: { eventType, timestamp:-1 }, { timestamp:-1 }

Static helpers:
- getUserAnalytics(userId, timeRangeDays=30): returns { totalEvents, eventTypes{...}, dailyActivity{YYYY-MM-DD:count}, topEvents[{eventType,count}] }
- getPlatformAnalytics(timeRangeDays=30): same shape as above but across all users, includes uniqueUsers

### UserAnalytics (summary)
- userId: ObjectId (User, required, unique)
- profile: { totalViews, totalBookings, totalJobsApplied, totalCoursesEnrolled, totalPurchases, totalReferrals, lastActiveAt }
- engagement: { averageSessionDuration, totalSessions, bounceRate, conversionRate }
- revenue: { totalEarned, totalSpent, averageOrderValue }
- monthlyStats: [{ month, year, views, bookings, revenue, sessions }]
- lastUpdated: Date

### ServiceAnalytics
- serviceId: ObjectId (Service, required, unique)
- views: { total, unique, daily:[{ date, count }] }
- bookings: { total, completed, cancelled, conversionRate }
- revenue: { total, average, monthly:[{ month, year, amount }] }
- ratings: { average, count, distribution:{ five,four,three,two,one } }
- lastUpdated: Date

### PlatformAnalytics (daily snapshot)
- date: Date (unique, required)
- users: { total, new, active }
- services: { total, new, active }
- bookings: { total, completed, revenue }
- jobs: { total, applications }
- courses: { total, enrollments }
- referrals: { total, completed }
- Indexes: { date:-1 }

## Notes
- All schemas use timestamps.
- User/Service summaries can be materialized for fast dashboards; events act as source-of-truth stream.
- Geolocation stored as simple lat/lng for events; use upstream geo service if needed.
