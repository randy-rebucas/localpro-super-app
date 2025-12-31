# LocalPro SDK Modules

This document provides an overview of all available modules in the LocalPro SDK.

## Available Modules

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
