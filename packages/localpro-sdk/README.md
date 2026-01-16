# LocalPro SDK

Official JavaScript/Node.js SDK for the LocalPro Super App API. This SDK provides a simple and convenient way to interact with the LocalPro API, including escrow, providers, marketplace, jobs, and more.

## Installation

```bash
npm install @localpro/sdk
```

## Quick Start

```javascript
const LocalPro = require('@localpro/sdk');

// Initialize the SDK
const client = new LocalPro({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  baseURL: 'https://api.localpro.com' // optional, defaults to http://localhost:5000
});

// Use the APIs
async function example() {
  try {
    // Auth: Register and login
    await client.auth.register({
      email: 'user@example.com',
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe'
    });
    const login = await client.auth.login({
      email: 'user@example.com',
      password: 'SecurePass123'
    });

    // Activities: Get activity feed
    const feed = await client.activities.getFeed({ page: 1, limit: 10 });

    // Ads: List ads
    const ads = await client.ads.list({ page: 1, limit: 10 });

    // Agencies: List agencies
    const agencies = await client.agencies.list({ page: 1, limit: 10 });

    // Partners: List partners
    const partners = await client.partners.list({ page: 1, limit: 10 });

    // Analytics: Get overview
    const analytics = await client.analytics.getOverview();

    // Scheduling: Get ranked jobs
    const rankedJobs = await client.scheduling.getRankedJobs();

    // Trust Verification: Get verified users
    const verified = await client.trustVerification.getVerifiedUsers();

    // User Management: List users
    const users = await client.userManagement.list();

    // Broadcaster: List broadcasts
    const broadcasts = await client.broadcaster.list();

    // AI: Get bot response
    const aiResponse = await client.ai.getBotResponse({ message: 'Hello' });

    // Marketplace: Get services
    const services = await client.marketplace.getServices({
      category: 'plumbing',
      page: 1,
      limit: 10
    });
    // ...existing code...
```

## Configuration

### Required Parameters

- `apiKey` (string): Your LocalPro API key
- `apiSecret` (string): Your LocalPro API secret

### Optional Parameters

- `baseURL` (string): Base URL for the API (default: `http://localhost:5000`)
- `timeout` (number): Request timeout in milliseconds (default: `30000`)
- `headers` (object): Additional headers to include in all requests


## Available Modules

The SDK provides access to all major LocalPro API modules:

- `client.activities` — Activities feed, stats, and interactions
- `client.ads` — Ads management, categories, analytics
- `client.agencies` — Agencies, providers, admins, analytics
- `client.partners` — Partners management and analytics
- `client.academy` — Academy courses, categories, certifications, enrollments
- `client.escrow` — Escrow management
- `client.providers` — Provider management
- `client.marketplace` — Marketplace services and bookings
- `client.jobs` — Job board and applications
- `client.auth` — Authentication and user management
- `client.finance` — Financial operations
- `client.maps` — Location and geocoding
- `client.supplies` — Supplies and equipment
- `client.rentals` — Equipment rentals
- `client.search` — Global search
- `client.referrals` — Referral system
- `client.communication` — Messaging and notifications
- `client.settings` — User and app settings
- `client.notifications` — Push notification management
- `client.analytics` — Analytics and reporting
- `client.scheduling` — Job scheduling and suggestions
- `client.trustVerification` — Trust verification
- `client.userManagement` — User, roles, permissions
- `client.broadcaster` — Broadcasts and notifications
- `client.ai` — AI bot and marketplace

See MODULES.md for a full list of methods for each module.

## Example Usage for New Modules

### Activities
```javascript
const feed = await client.activities.getFeed({ page: 1, limit: 10 });
const myActivities = await client.activities.getMyActivities();
```

### Ads
```javascript
const ads = await client.ads.list({ page: 1, limit: 10 });
const ad = await client.ads.getById('ad-id');
```

### Agencies
```javascript
const agencies = await client.agencies.list();
const agency = await client.agencies.getById('agency-id');
```

### Partners
```javascript
const partners = await client.partners.list();
const partner = await client.partners.getById('partner-id');
```

## Escrow API

## Providers API

The SDK provides comprehensive provider management functionality:

### List Providers

```javascript
// Get all providers
const providers = await client.providers.list();

// With filters
const filtered = await client.providers.list({
  status: 'active',
  providerType: 'individual',
  search: 'plumber',
  page: 1,
  limit: 20
});
```

### Get Provider

```javascript
const provider = await client.providers.getById('provider-id');
```

### Get Provider Skills

```javascript
// Get all skills
const skills = await client.providers.getSkills();

// Filter by category
const skills = await client.providers.getSkills({ category: 'plumbing' });
```

### Provider Profile Management

```javascript
// Get my profile
const profile = await client.providers.getMyProfile();

// Create profile (upgrade from client)
const newProfile = await client.providers.createProfile({
  providerType: 'individual',
  professionalInfo: {
    specialties: [/* ... */]
  }
});

// Update profile
const updated = await client.providers.updateProfile({
  professionalInfo: { /* ... */ }
});

// Partial update
const patched = await client.providers.patchProfile({
  status: 'active'
});
```

### Onboarding

```javascript
await client.providers.updateOnboardingStep({
  step: 'professional_info',
  data: { /* step data */ }
});
```

### Documents & Analytics

```javascript
// Upload documents
await client.providers.uploadDocuments(formData);

// Get dashboard
const dashboard = await client.providers.getDashboard();

// Get analytics
const analytics = await client.providers.getAnalytics({
  timeframe: '30d'
});
```

## Marketplace API

The SDK provides comprehensive marketplace functionality for services and bookings:

### Services

```javascript
// Get all services
const services = await client.marketplace.getServices({
  category: 'plumbing',
  minPrice: 50,
  maxPrice: 500,
  page: 1,
  limit: 20
});

// Get service by ID
const service = await client.marketplace.getService('service-id');

// Get nearby services
const nearby = await client.marketplace.getNearbyServices({
  latitude: 40.7128,
  longitude: -74.0060,
  radius: 10
});

// Create service (Provider only)
const newService = await client.marketplace.createService({
  title: 'Plumbing Repair',
  category: 'plumbing',
  price: 150,
  description: 'Professional plumbing services'
});

// Update service
await client.marketplace.updateService('service-id', {
  price: 175
});

// Activate/Deactivate
await client.marketplace.activateService('service-id');
await client.marketplace.deactivateService('service-id');

// Upload images
await client.marketplace.uploadServiceImages('service-id', formData);
```

### Service Categories

```javascript
// Get all categories
const categories = await client.marketplace.getCategories();

// Get category details
const category = await client.marketplace.getCategoryDetails('plumbing');
```

### Bookings

```javascript
// Create booking
const booking = await client.marketplace.createBooking({
  serviceId: 'service-id',
  providerId: 'provider-id',
  scheduledDate: '2024-01-15T10:00:00Z',
  address: { /* address object */ },
  notes: 'Please arrive on time'
});

// Get booking
const booking = await client.marketplace.getBooking('booking-id');

// Get my bookings
const bookings = await client.marketplace.getMyBookings({
  status: 'confirmed',
  role: 'client'
});

// Update booking status
await client.marketplace.updateBookingStatus('booking-id', {
  status: 'completed'
});

// Add review
await client.marketplace.addReview('booking-id', {
  rating: 5,
  comment: 'Excellent service!'
});
```

### PayPal Integration

```javascript
// Approve PayPal booking
await client.marketplace.approvePayPalBooking({
  orderID: 'paypal-order-id',
  bookingId: 'booking-id'
});

// Get PayPal order details
const order = await client.marketplace.getPayPalOrderDetails('order-id');
```

## Jobs API

The SDK provides comprehensive job board functionality:

### Jobs

```javascript
// Get all jobs
const jobs = await client.jobs.list({
  category: 'construction',
  location: 'New York',
  page: 1,
  limit: 20
});

// Search jobs
const results = await client.jobs.search({
  q: 'plumber',
  location: 'Los Angeles',
  category: 'trades'
});

// Get job by ID
const job = await client.jobs.getById('job-id');

// Get job categories
const categories = await client.jobs.getCategories();

// Create job (Employer only)
const newJob = await client.jobs.create({
  title: 'Experienced Plumber Needed',
  description: 'Full-time plumbing position',
  category: 'trades',
  type: 'full-time',
  location: { /* location object */ }
});

// Update job
await client.jobs.update('job-id', {
  description: 'Updated description'
});

// Get job statistics
const stats = await client.jobs.getStats('job-id');

// Upload company logo
await client.jobs.uploadCompanyLogo('job-id', formData);
```

### Applications

```javascript
// Apply for job
const application = await client.jobs.apply('job-id', {
  coverLetter: 'I am interested in this position...'
}, formData); // Optional: formData with resume

// Get my applications
const applications = await client.jobs.getMyApplications({
  page: 1,
  limit: 10
});

// Withdraw application
await client.jobs.withdrawApplication('job-id', 'application-id');

// Get job applications (Employer only)
const applications = await client.jobs.getApplications('job-id', {
  page: 1,
  limit: 20
});

// Update application status (Employer only)
await client.jobs.updateApplicationStatus('job-id', 'application-id', {
  status: 'shortlisted',
  notes: 'Great candidate!'
});
```

## Auth API

The SDK provides comprehensive authentication and user management functionality:

### Registration & Login

```javascript
// Register a new user
const registration = await client.auth.register({
  email: 'user@example.com',
  password: 'SecurePass123',
  firstName: 'John',
  lastName: 'Doe'
});

// Login
const login = await client.auth.login({
  email: 'user@example.com',
  password: 'SecurePass123'
});

// Logout
await client.auth.logout();

// Refresh token
const newToken = await client.auth.refreshToken(refreshToken);
```

### Verification

```javascript
// Send SMS verification code
await client.auth.sendVerificationCode({
  phone: '+1234567890'
});

// Verify SMS code
await client.auth.verifyCode({
  phone: '+1234567890',
  code: '123456'
});

// Verify email with OTP
await client.auth.verifyEmailOTP({
  email: 'user@example.com',
  otp: '123456'
});

// Check if email exists
const exists = await client.auth.checkEmail('user@example.com');
```

### Profile Management

```javascript
// Get current user profile
const profile = await client.auth.getMe();

// Update profile
await client.auth.updateProfile({
  firstName: 'Jane',
  lastName: 'Smith',
  phoneNumber: '+1234567890'
});

// Complete onboarding
await client.auth.completeOnboarding({
  /* onboarding data */
});

// Get profile completion status
const status = await client.auth.getProfileCompletionStatus();

// Get profile completeness percentage
const completeness = await client.auth.getProfileCompleteness();
```

### File Uploads

```javascript
// Upload avatar
await client.auth.uploadAvatar(formData);

// Upload portfolio images
await client.auth.uploadPortfolio(formData);
```

## Finance API

The SDK provides comprehensive financial management functionality:

### Financial Overview

```javascript
// Get financial overview
const overview = await client.finance.getOverview();

// Get transactions
const transactions = await client.finance.getTransactions({
  type: 'income',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  page: 1,
  limit: 20
});

// Get earnings
const earnings = await client.finance.getEarnings({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Get expenses
const expenses = await client.finance.getExpenses({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

### Expense Management

```javascript
// Add expense
await client.finance.addExpense({
  amount: 50.00,
  category: 'supplies',
  description: 'Tools purchase',
  date: '2024-01-15'
});
```

### Withdrawals

```javascript
// Request withdrawal
const withdrawal = await client.finance.requestWithdrawal({
  amount: 500.00,
  method: 'bank_transfer',
  accountDetails: {
    accountNumber: '1234567890',
    bankName: 'Bank Name'
  }
});

// Process withdrawal (Admin only)
await client.finance.processWithdrawal('withdrawal-id', {
  status: 'approved',
  notes: 'Processed successfully'
});
```

### Top-ups

```javascript
// Request top-up
const topUp = await client.finance.requestTopUp({
  amount: 200.00,
  method: 'paypal'
}, formData); // Optional: receipt image

// Get my top-up requests
const requests = await client.finance.getMyTopUpRequests({
  status: 'pending'
});

// Process top-up (Admin only)
await client.finance.processTopUp('topup-id', {
  status: 'approved',
  notes: 'Verified'
});
```

### Reports & Documents

```javascript
// Get tax documents
const taxDocs = await client.finance.getTaxDocuments({
  year: '2024'
});

// Get financial reports
const reports = await client.finance.getReports({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  reportType: 'annual'
});

// Update wallet settings
await client.finance.updateWalletSettings({
  preferences: {
    autoWithdraw: false
  },
  notifications: {
    lowBalance: true
  }
});
```

## Maps API

The SDK provides comprehensive location and mapping functionality:

### Geocoding

```javascript
// Geocode address to coordinates
const geocode = await client.maps.geocode({
  address: '123 Main St, New York, NY 10001'
});

// Reverse geocode coordinates to address
const address = await client.maps.reverseGeocode({
  lat: 40.7128,
  lng: -74.0060
});
```

### Places Search

```javascript
// Search for places
const places = await client.maps.searchPlaces({
  query: 'plumber',
  location: { lat: 40.7128, lng: -74.0060 },
  radius: 5000,
  type: 'establishment'
});

// Get place details
const place = await client.maps.getPlaceDetails('place-id');

// Find nearby places
const nearby = await client.maps.findNearby({
  lat: 40.7128,
  lng: -74.0060,
  radius: 1000,
  type: 'restaurant'
});
```

### Distance & Coverage

```javascript
// Calculate distance between points
const distance = await client.maps.calculateDistance({
  origin: { lat: 40.7128, lng: -74.0060 },
  destination: { lat: 40.7580, lng: -73.9855 },
  mode: 'driving',
  units: 'metric'
});

// Validate service area coverage
const validation = await client.maps.validateServiceArea({
  location: { lat: 40.7128, lng: -74.0060 },
  serviceAreas: [/* array of polygons */]
});

// Analyze service coverage (Protected)
const coverage = await client.maps.analyzeCoverage({
  locations: [
    { lat: 40.7128, lng: -74.0060 },
    { lat: 40.7580, lng: -73.9855 }
  ],
  radius: 5000
});
```

### Utility

```javascript
// Get maps API info
const info = await client.maps.getInfo();

// Test connection (Admin only)
const test = await client.maps.testConnection();
```

## Supplies API

The SDK provides comprehensive supplies and equipment marketplace functionality:

### Supplies Management

```javascript
// Get all supplies
const supplies = await client.supplies.list({
  category: 'tools',
  search: 'drill',
  minPrice: 10,
  maxPrice: 500,
  page: 1,
  limit: 20
});

// Get supply by ID
const supply = await client.supplies.getById('supply-id');

// Get categories
const categories = await client.supplies.getCategories();

// Get featured supplies
const featured = await client.supplies.getFeatured({ limit: 10 });

// Get nearby supplies
const nearby = await client.supplies.getNearby({
  lat: 40.7128,
  lng: -74.0060,
  radius: 10
});
```

### Supply Operations (Supplier only)

```javascript
// Create supply
const newSupply = await client.supplies.create({
  name: 'Power Drill',
  price: 150,
  description: 'Professional power drill',
  category: 'tools'
});

// Update supply
await client.supplies.update('supply-id', {
  price: 175
});

// Partial update
await client.supplies.patch('supply-id', {
  isActive: false
});

// Upload images
await client.supplies.uploadImages('supply-id', formData);

// Delete image
await client.supplies.deleteImage('supply-id', 'image-id');

// Generate description using AI
const description = await client.supplies.generateDescription({
  name: 'Power Drill',
  category: 'tools'
});
```

### Orders & Reviews

```javascript
// Order supply
const order = await client.supplies.order('supply-id', {
  quantity: 2,
  shippingAddress: { /* address */ }
});

// Update order status
await client.supplies.updateOrderStatus('supply-id', 'order-id', {
  status: 'shipped'
});

// Add review
await client.supplies.addReview('supply-id', {
  rating: 5,
  comment: 'Great product!'
});

// Get my supplies
const mySupplies = await client.supplies.getMySupplies();

// Get my orders
const myOrders = await client.supplies.getMyOrders();
```

## Rentals API

The SDK provides comprehensive equipment rental functionality:

### Rentals Management

```javascript
// Get all rentals
const rentals = await client.rentals.list({
  category: 'tools',
  search: 'generator',
  page: 1,
  limit: 20
});

// Get rental by ID
const rental = await client.rentals.getById('rental-id');

// Get categories
const categories = await client.rentals.getCategories();

// Get featured rentals
const featured = await client.rentals.getFeatured({ limit: 10 });

// Get nearby rentals
const nearby = await client.rentals.getNearby({
  lat: 40.7128,
  lng: -74.0060,
  radius: 10
});
```

### Rental Operations (Provider only)

```javascript
// Create rental
const newRental = await client.rentals.create({
  name: 'Power Generator',
  price: 50, // per day
  description: '5000W portable generator',
  category: 'equipment'
});

// Update rental
await client.rentals.update('rental-id', {
  price: 60
});

// Upload images
await client.rentals.uploadImages('rental-id', formData);

// Delete image
await client.rentals.deleteImage('rental-id', 'image-id');

// Generate description using AI
const description = await client.rentals.generateDescription({
  name: 'Power Generator',
  category: 'equipment'
});
```

### Bookings & Reviews

```javascript
// Book rental
const booking = await client.rentals.book('rental-id', {
  startDate: '2024-01-15T10:00:00Z',
  endDate: '2024-01-20T18:00:00Z',
  deliveryAddress: { /* address */ }
});

// Update booking status
await client.rentals.updateBookingStatus('rental-id', 'booking-id', {
  status: 'confirmed'
});

// Add review
await client.rentals.addReview('rental-id', {
  rating: 5,
  comment: 'Excellent equipment!'
});

// Get my rentals
const myRentals = await client.rentals.getMyRentals();

// Get my bookings
const myBookings = await client.rentals.getMyBookings();
```

## Search API

The SDK provides comprehensive global search functionality:

### Basic Search

```javascript
// Global search across all entities
const results = await client.search.search({
  q: 'plumber',
  type: 'services',
  location: 'New York',
  minPrice: 50,
  maxPrice: 500,
  rating: 4,
  page: 1,
  limit: 20,
  sortBy: 'relevance',
  sortOrder: 'desc'
});
```

### Search Features

```javascript
// Get search suggestions/autocomplete
const suggestions = await client.search.getSuggestions({
  q: 'plumb',
  limit: 10
});

// Get popular searches
const popular = await client.search.getPopular({ limit: 12 });

// Get trending searches
const trending = await client.search.getTrending({
  period: 'week',
  limit: 10
});
```

### Advanced Search

```javascript
// Advanced search with more filters
const advanced = await client.search.advancedSearch({
  q: 'cleaning',
  type: 'services',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  verified: true,
  availability: 'available',
  serviceType: 'recurring'
});

// Search within specific entity type
const services = await client.search.searchByType('services', {
  q: 'plumber',
  location: 'Los Angeles',
  category: 'plumbing'
});
```

### Search Metadata

```javascript
// Get all search categories
const categories = await client.search.getCategories();

// Get popular locations
const locations = await client.search.getLocations({
  q: 'New',
  limit: 20
});

// Track search analytics (Admin only)
await client.search.trackAnalytics({
  query: 'plumber',
  results: 25,
  filters: { type: 'services' },
  userId: 'user-id'
});
```

## Referrals API

The SDK provides comprehensive referral system functionality:

### Referral Management

```javascript
// Validate referral code (Public)
const validation = await client.referrals.validateCode({
  code: 'REF123'
});

// Track referral click (Public)
await client.referrals.trackClick({
  code: 'REF123'
});

// Get referral leaderboard (Public)
const leaderboard = await client.referrals.getLeaderboard({
  limit: 10
});
```

### My Referrals

```javascript
// Get my referrals
const myReferrals = await client.referrals.getMyReferrals({
  page: 1,
  limit: 20
});

// Get referral statistics
const stats = await client.referrals.getStats();

// Get referral links
const links = await client.referrals.getLinks();

// Get referral rewards
const rewards = await client.referrals.getRewards();
```

### Referral Actions

```javascript
// Send referral invitation
await client.referrals.sendInvitation({
  email: 'friend@example.com',
  message: 'Join LocalPro and get rewards!'
});

// Update referral preferences
await client.referrals.updatePreferences({
  autoShare: true,
  preferredChannel: 'email'
});
```

### Admin Functions

```javascript
// Process referral completion (Admin only)
await client.referrals.processCompletion({
  referralId: 'ref-id',
  action: 'approve'
});

// Get referral analytics (Admin only)
const analytics = await client.referrals.getAnalytics({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

## Communication API

The SDK provides comprehensive messaging and communication functionality:

### Conversations

```javascript
// Get user conversations
const conversations = await client.communication.getConversations({
  page: 1,
  limit: 20
});

// Get conversation by ID
const conversation = await client.communication.getConversation('conv-id');

// Create a new conversation
const newConv = await client.communication.createConversation({
  participantId: 'user-id',
  initialMessage: 'Hello!'
});

// Delete conversation
await client.communication.deleteConversation('conv-id');
```

### Messages

```javascript
// Get messages in a conversation
const messages = await client.communication.getMessages('conv-id', {
  page: 1,
  limit: 50
});

// Send a text message
await client.communication.sendMessage('conv-id', {
  content: 'Hello, how can I help?'
});

// Send a message with attachments (FormData)
const formData = new FormData();
formData.append('content', 'Check this out!');
formData.append('attachments', file1);
formData.append('attachments', file2);
await client.communication.sendMessage('conv-id', formData);

// Update a message
await client.communication.updateMessage('conv-id', 'msg-id', {
  content: 'Updated message'
});

// Delete a message
await client.communication.deleteMessage('conv-id', 'msg-id');
```

### Conversation Management

```javascript
// Mark conversation as read
await client.communication.markAsRead('conv-id');

// Get unread message count
const unreadCount = await client.communication.getUnreadCount();

// Search conversations
const results = await client.communication.searchConversations({
  q: 'plumber',
  page: 1,
  limit: 10
});

// Get or create conversation with a user
const conv = await client.communication.getConversationWithUser('user-id');
```

### Notifications (via Communication API)

```javascript
// Get user notifications
const notifications = await client.communication.getNotifications({
  page: 1,
  limit: 20,
  isRead: false,
  type: 'booking_created'
});

// Get notification count
const count = await client.communication.getNotificationCount();

// Mark notification as read
await client.communication.markNotificationAsRead('notif-id');

// Mark all notifications as read
await client.communication.markAllNotificationsAsRead();

// Delete notification
await client.communication.deleteNotification('notif-id');

// Send email notification
await client.communication.sendEmailNotification({
  to: 'user@example.com',
  subject: 'New Booking',
  body: 'You have a new booking!'
});

// Send SMS notification
await client.communication.sendSMSNotification({
  to: '+1234567890',
  message: 'Your booking is confirmed!'
});
```

## Settings API

The SDK provides comprehensive settings management:

### User Settings

```javascript
// Get user settings
const settings = await client.settings.getUserSettings();

// Update user settings
await client.settings.updateUserSettings({
  privacy: {
    profileVisibility: 'public',
    showPhoneNumber: false
  },
  notifications: {
    push: {
      enabled: true,
      newMessages: true
    }
  }
});

// Update specific category
await client.settings.updateUserSettingsCategory('privacy', {
  profileVisibility: 'contacts_only',
  showEmail: false
});

// Reset user settings to defaults
await client.settings.resetUserSettings();

// Delete user settings
await client.settings.deleteUserSettings();
```

### App Settings (Admin)

```javascript
// Get app settings (Admin only)
const appSettings = await client.settings.getAppSettings();

// Get public app settings (No auth required)
const publicSettings = await client.settings.getPublicAppSettings();

// Update app settings (Admin only)
await client.settings.updateAppSettings({
  general: {
    appName: 'LocalPro',
    maintenanceMode: {
      enabled: false
    }
  }
});

// Update app settings category (Admin only)
await client.settings.updateAppSettingsCategory('features', {
  marketplace: {
    enabled: true,
    requireVerification: true
  }
});

// Toggle feature flag (Admin only)
await client.settings.toggleFeatureFlag({
  feature: 'marketplace',
  enabled: true
});

// Get app health status
const health = await client.settings.getAppHealth();
```

## Notifications API

The SDK provides comprehensive push notification management:

### Notification Management

```javascript
// Get user notifications
const notifications = await client.notifications.getNotifications({
  page: 1,
  limit: 20,
  isRead: false,
  type: 'booking_created'
});

// Get unread notification count
const unreadCount = await client.notifications.getUnreadCount();

// Mark notification as read
await client.notifications.markAsRead('notif-id');

// Mark all notifications as read
await client.notifications.markAllAsRead();

// Delete notification
await client.notifications.deleteNotification('notif-id');

// Delete all notifications
await client.notifications.deleteAllNotifications();

// Delete only read notifications
await client.notifications.deleteAllNotifications({ readOnly: true });
```

### FCM Token Management

```javascript
// Register or update FCM token
await client.notifications.registerFCMToken({
  token: 'fcm-token-here',
  deviceId: 'device-id',
  deviceType: 'android' // ios, android, web
});

// Remove FCM token
await client.notifications.removeFCMToken('token-or-device-id');

// Get registered FCM tokens
const tokens = await client.notifications.getFCMTokens();
```

### Notification Settings

```javascript
// Get notification settings
const settings = await client.notifications.getSettings();

// Check if notification type is enabled
const isEnabled = await client.notifications.checkEnabled('booking_created', {
  channel: 'push' // push, email, sms
});
```

### Admin Functions

```javascript
// Send notification to a user (Admin only)
await client.notifications.sendNotification({
  userId: 'user-id',
  type: 'booking_created',
  title: 'New Booking',
  message: 'You have a new booking request',
  data: { bookingId: 'booking-id' },
  priority: 'high' // low, medium, high, urgent
});

// Send bulk notification (Admin only)
await client.notifications.sendBulkNotification({
  userIds: ['user1', 'user2', 'user3'],
  type: 'system_announcement',
  title: 'System Update',
  message: 'We have updated our system',
  priority: 'medium'
});

// Send system announcement (Admin only)
await client.notifications.sendAnnouncement({
  title: 'New Feature Available',
  message: 'Check out our new feature!',
  targetRoles: ['provider', 'client'], // Optional
  expiresAt: '2024-12-31T23:59:59Z' // Optional
});

// Send test notification
await client.notifications.sendTest({
  type: 'all' // push, email, sms, all
});
```

## Error Handling

The SDK provides custom error classes for better error handling:

```javascript
const { Errors } = require('@localpro/sdk');

try {
  await client.escrow.create({ /* ... */ });
} catch (error) {
  if (error instanceof Errors.LocalProAuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof Errors.LocalProValidationError) {
    console.error('Validation error:', error.message);
  } else if (error instanceof Errors.LocalProNotFoundError) {
    console.error('Not found:', error.message);
  } else if (error instanceof Errors.LocalProRateLimitError) {
    console.error('Rate limit exceeded:', error.message);
  } else {
    console.error('API error:', error.message);
  }
  
  // Access error details
  console.error('Error code:', error.code);
  console.error('Status code:', error.statusCode);
  console.error('Response:', error.response);
}
```

### Error Types

- `LocalProError`: Base error class
- `LocalProAPIError`: General API errors
- `LocalProAuthenticationError`: Authentication/authorization errors (401, 403)
- `LocalProValidationError`: Validation errors (400)
- `LocalProNotFoundError`: Resource not found (404)
- `LocalProRateLimitError`: Rate limit exceeded (429)

## Advanced Usage

### Direct Client Access

For advanced use cases, you can access the underlying HTTP client:

```javascript
const client = new LocalPro({ /* config */ });
const httpClient = client.getClient();

// Make custom requests
const response = await httpClient.get('/api/custom-endpoint');
const response = await httpClient.post('/api/custom-endpoint', { data: 'value' });
```

### Custom Headers

```javascript
const client = new LocalPro({
  apiKey: 'your-key',
  apiSecret: 'your-secret',
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

## API Authentication

The SDK uses API key authentication. You need to:

1. Generate an API key and secret from your LocalPro dashboard
2. Pass them to the SDK constructor
3. The SDK automatically includes them in all requests as `X-API-Key` and `X-API-Secret` headers

## Escrow Status Flow

Understanding the escrow status flow:

1. **CREATED**: Escrow created but funds not yet held
2. **FUNDS_HELD**: Payment hold successful, funds are held
3. **IN_PROGRESS**: Payment captured, work in progress
4. **COMPLETE**: Work completed and approved
5. **DISPUTE**: Dispute raised
6. **REFUNDED**: Payment refunded
7. **PAYOUT_INITIATED**: Payout to provider initiated
8. **PAYOUT_COMPLETED**: Payout completed

## Support

For API documentation, visit: [LocalPro API Docs](https://api.localpro.com/api-docs)

For issues and questions, please contact support or open an issue on GitHub.

## License

MIT
