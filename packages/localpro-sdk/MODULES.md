# LocalPro SDK Modules

This document provides an overview of all available modules in the LocalPro SDK.

## Available Modules


### Activities API (`client.activities`)

Provides access to Activities endpoints for activity feed, user activities, stats, and interactions.

**Key Methods:**
- `getFeed(params)` - Get activity feed
- `getMyActivities(params)` - Get my activities
- `getUserActivities(userId, params)` - Get activities for a user
- `getActivity(id)` - Get activity by ID
- `createActivity(data)` - Create a new activity
- `updateActivity(id, data)` - Update an activity
- `deleteActivity(id)` - Delete an activity
- `addInteraction(id, data)` - Add interaction to activity
- `removeInteraction(id, data)` - Remove interaction from activity
- `getStatsMy(params)` - Get my activity stats
- `getStatsGlobal(params)` - Get global activity stats
- `getMetadata()` - Get activity metadata
- `getTimeline(params)` - Get activity timeline
- `getTotalPoints()` - Get total points
- `getLeaderboard(params)` - Get leaderboard

### Ads API (`client.ads`)

Provides access to Ads endpoints for managing ads, categories, images, and analytics.

**Key Methods:**
- `list(params)` - List ads
- `getById(id)` - Get ad by ID
- `getCategories()` - Get ad categories
- `getEnumValues()` - Get ad enum values
- `getFeatured()` - Get featured ads
- `getStatistics()` - Get ad statistics
- `create(data)` - Create ad
- `update(id, data)` - Update ad
- `delete(id)` - Delete ad
- `uploadImages(id, formData)` - Upload ad images
- `deleteImage(id, imageId)` - Delete ad image
- `promote(id)` - Promote ad
- `trackClick(id)` - Track ad click
- `getAnalytics(id)` - Get ad analytics
- `getPending()` - Get pending ads
- `approve(id)` - Approve ad
- `reject(id)` - Reject ad
- `getMyAds()` - Get my ads

### Agencies API (`client.agencies`)

Provides access to Agencies endpoints for managing agencies, providers, admins, and analytics.

**Key Methods:**
- `list(params)` - List agencies
- `getById(id)` - Get agency by ID
- `create(data)` - Create agency
- `update(id, data)` - Update agency
- `patch(id, data)` - Patch agency
- `delete(id)` - Delete agency
- `uploadLogo(id, formData)` - Upload agency logo
- `addProvider(id, data)` - Add provider to agency
- `removeProvider(id, providerId)` - Remove provider from agency
- `updateProviderStatus(id, providerId, data)` - Update provider status
- `addAdmin(id, data)` - Add admin to agency
- `removeAdmin(id, adminId)` - Remove admin from agency
- `getAnalytics(id)` - Get agency analytics
- `getMyAgencies()` - Get my agencies
- `joinAgency(data)` - Join agency
- `leaveAgency(data)` - Leave agency

### Partners API (`client.partners`)

Provides access to Partners endpoints for managing partners and analytics.

**Key Methods:**
- `list(params)` - List partners
- `getById(id)` - Get partner by ID
- `create(data)` - Create partner
- `update(id, data)` - Update partner
- `delete(id)` - Delete partner
- `getAnalytics(id)` - Get partner analytics

### Academy API (`client.academy`)

Provides access to the Academy endpoints for courses, categories, certifications, enrollments, reviews, favorites, and statistics.

**Key Methods:**
- `getCourses(params)` - List courses
- `getCourse(id)` - Get course by ID
- `createCourse(data)` - Create a new course
- `updateCourse(id, data)` - Update a course
- `patchCourse(id, data)` - Partially update a course
- `deleteCourse(id)` - Delete a course
- `uploadCourseThumbnail(id, formData)` - Upload course thumbnail
- `uploadCourseVideo(id, formData)` - Upload course video
- `deleteCourseVideo(id, videoId)` - Delete course video
- `listCategories()` - List course categories
- `createCategory(data)` - Create a category
- `updateCategory(id, data)` - Update a category
- `deleteCategory(id)` - Delete a category
- `listCertifications()` - List certifications
- `createCertification(data)` - Create a certification
- `updateCertification(id, data)` - Update a certification
- `deleteCertification(id)` - Delete a certification
- `enrollInCourse(id)` - Enroll in a course
- `listEnrollments()` - List enrollments
- `updateEnrollmentStatus(id, data)` - Update enrollment status
- `deleteEnrollment(id)` - Delete enrollment
- `updateCourseProgress(id, data)` - Update course progress
- `addCourseReview(id, data)` - Add a review to a course
- `favoriteCourse(id)` - Favorite a course
- `unfavoriteCourse(id)` - Unfavorite a course
- `getMyCourses()` - Get my enrolled courses
- `getMyCreatedCourses()` - Get my created courses
- `getMyFavoriteCourses()` - Get my favorite courses
- `getFeaturedCourses()` - Get featured courses
- `getCourseStatistics()` - Get course statistics

### 1. Escrow API (`client.escrow`)

Handles escrow transactions, payment holds, captures, refunds, and disputes.

**Key Methods:**
- `create()` - Create escrow with payment hold
- `getById()` - Get escrow details
- `list()` - List escrows with filters
- `capture()` - Capture held payment
- `refund()` - Refund payment
- `uploadProofOfWork()` - Upload proof of work
- `initiateDispute()` - Initiate dispute
- `requestPayout()` - Request payout
- `getTransactions()` - Get transaction history
- `getPayoutDetails()` - Get payout details

### 2. Providers API (`client.providers`)

Manages provider profiles, onboarding, documents, and analytics.

**Key Methods:**
- `list()` - List providers with filters
- `getById()` - Get provider by ID
- `getSkills()` - Get provider skills
- `getMyProfile()` - Get current user's provider profile
- `createProfile()` - Create provider profile
- `updateProfile()` - Update provider profile
- `patchProfile()` - Partially update profile
- `updateOnboardingStep()` - Update onboarding step
- `uploadDocuments()` - Upload provider documents
- `getDashboard()` - Get provider dashboard
- `getAnalytics()` - Get provider analytics

### 3. Marketplace API (`client.marketplace`)

Manages services, bookings, categories, and reviews.

**Key Methods:**
- `getServices()` - List services
- `getService()` - Get service by ID
- `getNearbyServices()` - Get nearby services
- `createService()` - Create service (Provider)
- `updateService()` - Update service (Provider)
- `deleteService()` - Delete service (Provider)
- `activateService()` / `deactivateService()` - Manage service status
- `uploadServiceImages()` - Upload service images
- `getCategories()` - Get service categories
- `createBooking()` - Create booking
- `getBooking()` - Get booking by ID
- `getMyBookings()` - Get user's bookings
- `updateBookingStatus()` - Update booking status
- `addReview()` - Add review to booking
- `approvePayPalBooking()` - Approve PayPal booking

### 4. Jobs API (`client.jobs`)

Manages job postings, applications, and job board functionality.

**Key Methods:**
- `list()` - List jobs
- `search()` - Search jobs
- `getById()` - Get job by ID
- `getCategories()` - Get job categories
- `create()` - Create job posting (Employer)
- `update()` - Update job posting (Employer)
- `delete()` - Delete job posting (Employer)
- `getMyJobs()` - Get employer's jobs
- `getStats()` - Get job statistics
- `uploadCompanyLogo()` - Upload company logo
- `apply()` - Apply for job
- `getMyApplications()` - Get user's applications
- `withdrawApplication()` - Withdraw application
- `getApplications()` - Get job applications (Employer)
- `updateApplicationStatus()` - Update application status (Employer)

### 5. Auth API (`client.auth`)

Handles authentication, user registration, profile management, and verification.

**Key Methods:**
- `register()` - Register new user
- `login()` - Login with email/password
- `logout()` - Logout user
- `refreshToken()` - Refresh access token
- `sendVerificationCode()` - Send SMS verification code
- `verifyCode()` - Verify SMS code
- `verifyEmailOTP()` - Verify email with OTP
- `checkEmail()` - Check if email exists
- `setPassword()` - Set/reset password
- `getMe()` - Get current user profile
- `updateProfile()` - Update user profile
- `completeOnboarding()` - Complete onboarding
- `getProfileCompletionStatus()` - Get completion status
- `getProfileCompleteness()` - Get completeness percentage
- `uploadAvatar()` - Upload avatar image
- `uploadPortfolio()` - Upload portfolio images

### 6. Finance API (`client.finance`)

Manages financial operations, transactions, withdrawals, and reports.

**Key Methods:**
- `getOverview()` - Get financial overview
- `getTransactions()` - Get transactions with filters
- `getEarnings()` - Get earnings
- `getExpenses()` - Get expenses
- `addExpense()` - Add expense
- `requestWithdrawal()` - Request withdrawal
- `processWithdrawal()` - Process withdrawal (Admin)
- `requestTopUp()` - Request wallet top-up
- `getMyTopUpRequests()` - Get my top-up requests
- `processTopUp()` - Process top-up (Admin)
- `getTaxDocuments()` - Get tax documents
- `getReports()` - Get financial reports
- `updateWalletSettings()` - Update wallet settings

### 7. Maps API (`client.maps`)

Provides location services, geocoding, places search, and distance calculations.

**Key Methods:**
- `getInfo()` - Get maps API info
- `geocode()` - Geocode address to coordinates
- `reverseGeocode()` - Reverse geocode coordinates to address
- `searchPlaces()` - Search for places
- `getPlaceDetails()` - Get place details
- `calculateDistance()` - Calculate distance between points
- `findNearby()` - Find nearby places
- `validateServiceArea()` - Validate service area coverage
- `analyzeCoverage()` - Analyze service coverage (Protected)
- `testConnection()` - Test API connection (Admin)

### 8. Supplies API (`client.supplies`)

Manages supplies, equipment, and product marketplace functionality.

**Key Methods:**
- `list()` - List supplies with filters
- `getById()` - Get supply by ID
- `getCategories()` - Get supply categories
- `getFeatured()` - Get featured supplies
- `getNearby()` - Get nearby supplies
- `create()` - Create supply (Supplier)
- `update()` - Update supply (Supplier)
- `patch()` - Partially update supply (Supplier)
- `delete()` - Delete supply (Supplier)
- `uploadImages()` - Upload supply images (Supplier)
- `deleteImage()` - Delete supply image (Supplier)
- `order()` - Order supply item
- `updateOrderStatus()` - Update order status
- `addReview()` - Add review to supply
- `getMySupplies()` - Get my supplies (Supplier)
- `getMyOrders()` - Get my supply orders
- `generateDescription()` - Generate description using AI (Supplier/Admin)

### 9. Rentals API (`client.rentals`)

Manages equipment rental items, bookings, and reviews.

**Key Methods:**
- `list()` - List rental items with filters
- `getById()` - Get rental by ID
- `getCategories()` - Get rental categories
- `getFeatured()` - Get featured rentals
- `getNearby()` - Get nearby rentals
- `create()` - Create rental item (Provider)
- `update()` - Update rental item (Provider)
- `delete()` - Delete rental item (Provider)
- `uploadImages()` - Upload rental images (Provider)
- `deleteImage()` - Delete rental image (Provider)
- `book()` - Book rental item
- `updateBookingStatus()` - Update booking status
- `addReview()` - Add review to rental
- `getMyRentals()` - Get my rental items (Owner)
- `getMyBookings()` - Get my rental bookings
- `generateDescription()` - Generate description using AI (Provider/Admin)

### 10. Search API (`client.search`)

Provides global search functionality across all entities.

**Key Methods:**
- `search()` - Global search across all entities
- `getSuggestions()` - Get search suggestions/autocomplete
- `getPopular()` - Get popular search terms
- `advancedSearch()` - Advanced search with more filters
- `searchByType()` - Search within specific entity type
- `getCategories()` - Get all available search categories
- `getLocations()` - Get popular search locations
- `getTrending()` - Get trending search terms
- `trackAnalytics()` - Track search analytics (Admin)

### 11. Referrals API (`client.referrals`)

Manages referral system including links, tracking, rewards, and analytics.

**Key Methods:**
- `validateCode()` - Validate referral code (Public)
- `trackClick()` - Track referral click (Public)
- `getLeaderboard()` - Get referral leaderboard (Public)
- `getMyReferrals()` - Get my referrals
- `getStats()` - Get referral statistics
- `getLinks()` - Get referral links
- `getRewards()` - Get referral rewards
- `sendInvitation()` - Send referral invitation
- `updatePreferences()` - Update referral preferences
- `processCompletion()` - Process referral completion (Admin)
- `getAnalytics()` - Get referral analytics (Admin)

### 12. Communication API (`client.communication`)

Handles messaging, conversations, and notifications.

**Key Methods:**
- `getConversations()` - Get user conversations
- `getConversation()` - Get conversation by ID
- `createConversation()` - Create a new conversation
- `deleteConversation()` - Delete conversation
- `getMessages()` - Get messages in a conversation
- `sendMessage()` - Send a message (supports file uploads)
- `updateMessage()` - Update a message
- `deleteMessage()` - Delete a message
- `markAsRead()` - Mark conversation as read
- `getUnreadCount()` - Get unread message count
- `searchConversations()` - Search conversations
- `getConversationWithUser()` - Get or create conversation with a user
- `getNotifications()` - Get user notifications
- `getNotificationCount()` - Get notification count
- `markNotificationAsRead()` - Mark notification as read
- `markAllNotificationsAsRead()` - Mark all notifications as read
- `deleteNotification()` - Delete notification
- `sendEmailNotification()` - Send email notification
- `sendSMSNotification()` - Send SMS notification

### 13. Settings API (`client.settings`)

Manages user and app settings.

**Key Methods:**
- `getUserSettings()` - Get user settings
- `updateUserSettings()` - Update user settings
- `updateUserSettingsCategory()` - Update user settings category
- `resetUserSettings()` - Reset user settings to defaults
- `deleteUserSettings()` - Delete user settings
- `getAppSettings()` - Get app settings (Admin)
- `getPublicAppSettings()` - Get public app settings (No auth)
- `updateAppSettings()` - Update app settings (Admin)
- `updateAppSettingsCategory()` - Update app settings category (Admin)
- `toggleFeatureFlag()` - Toggle feature flag (Admin)
- `getAppHealth()` - Get app health status

### 14. Notifications API (`client.notifications`)

Handles push notifications, FCM tokens, and notification management.

**Key Methods:**
- `getNotifications()` - Get user notifications
- `getUnreadCount()` - Get unread notification count
- `markAsRead()` - Mark notification as read
- `markAllAsRead()` - Mark all notifications as read
- `deleteNotification()` - Delete notification
- `deleteAllNotifications()` - Delete all notifications
- `registerFCMToken()` - Register or update FCM token
- `removeFCMToken()` - Remove FCM token
- `getFCMTokens()` - Get registered FCM tokens
- `getSettings()` - Get notification settings
- `checkEnabled()` - Check if notification type is enabled
- `sendNotification()` - Send notification to user (Admin)
- `sendBulkNotification()` - Send bulk notification (Admin)
- `sendAnnouncement()` - Send system announcement (Admin)
- `sendTest()` - Send test notification

## Usage Pattern

All modules follow the same pattern:

```javascript
const LocalPro = require('@localpro/sdk');

const client = new LocalPro({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  baseURL: 'https://api.localpro.com'
});

// Access modules
client.escrow.methodName();
client.providers.methodName();
client.marketplace.methodName();
client.jobs.methodName();
client.auth.methodName();
client.finance.methodName();
client.maps.methodName();
client.supplies.methodName();
client.rentals.methodName();
client.search.methodName();
client.referrals.methodName();
client.communication.methodName();
client.settings.methodName();
client.notifications.methodName();
```

### 13. Analytics API (`client.analytics`)

Access analytics and reporting endpoints.

**Key Methods:**
- `getOverview()` - Get analytics overview
- `getUserAnalytics(userId)` - Get analytics for a user

### 14. Scheduling API (`client.scheduling`)

Access job scheduling, suggestions, and ranking endpoints.

**Key Methods:**
- `getRankedJobs()` - Get ranked jobs
- `generateDailySuggestion()` - Generate daily job suggestions

### 15. Trust Verification API (`client.trustVerification`)

Manage user trust verification and requests.

**Key Methods:**
- `getVerifiedUsers()` - List verified users
- `createVerificationRequest()` - Create verification request

### 16. User Management API (`client.userManagement`)

Manage users, roles, and permissions.

**Key Methods:**
- `list()` - List users
- `getById(id)` - Get user by ID

### 17. Broadcaster API (`client.broadcaster`)

Manage broadcasts and notifications.

**Key Methods:**
- `list()` - List broadcasts
- `create()` - Create a broadcast

### 18. AI API (`client.ai`)

Access AI bot and marketplace endpoints.

**Key Methods:**
- `getBotResponse()` - Get AI bot response
- `getMarketplaceItems()` - Get AI marketplace items

## Error Handling

All modules use the same error handling system:

```javascript
try {
  await client.moduleName.method();
} catch (error) {
  // Handle LocalProError, LocalProAPIError, etc.
  console.error(error.message, error.code);
}
```

## Extending the SDK

To add new modules:

1. Create a new file in `lib/` (e.g., `lib/newmodule.js`)
2. Follow the pattern of existing modules
3. Import and initialize in `index.js`
4. Update this document
