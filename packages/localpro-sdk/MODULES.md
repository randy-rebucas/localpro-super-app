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
