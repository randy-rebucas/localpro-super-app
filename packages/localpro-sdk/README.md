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
    // Marketplace: Get services
    const services = await client.marketplace.getServices({
      category: 'plumbing',
      page: 1,
      limit: 10
    });
    
    // Providers: Get provider details
    const provider = await client.providers.getById('provider-id');
    
    // Jobs: Search for jobs
    const jobs = await client.jobs.search({
      q: 'plumber',
      location: 'New York'
    });
    
    // Escrow: Create escrow
    const escrow = await client.escrow.create({
      bookingId: '507f1f77bcf86cd799439011',
      providerId: '507f1f77bcf86cd799439012',
      amount: 10000, // $100.00 in cents
      currency: 'USD',
      holdProvider: 'paymongo'
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

## Configuration

### Required Parameters

- `apiKey` (string): Your LocalPro API key
- `apiSecret` (string): Your LocalPro API secret

### Optional Parameters

- `baseURL` (string): Base URL for the API (default: `http://localhost:5000`)
- `timeout` (number): Request timeout in milliseconds (default: `30000`)
- `headers` (object): Additional headers to include in all requests

## Escrow API

The SDK provides comprehensive escrow management functionality:

### Create Escrow

Create a new escrow and initiate payment hold:

```javascript
const escrow = await client.escrow.create({
  bookingId: '507f1f77bcf86cd799439011',
  providerId: '507f1f77bcf86cd799439012',
  amount: 10000, // Amount in cents
  currency: 'USD', // USD, PHP, EUR, GBP, JPY
  holdProvider: 'paymongo' // paymongo, xendit, stripe, paypal, paymaya
});
```

### Get Escrow Details

```javascript
const escrow = await client.escrow.getById('escrow-id');
```

### List Escrows

```javascript
// Get all escrows
const escrows = await client.escrow.list();

// With filters
const filtered = await client.escrow.list({
  status: 'FUNDS_HELD',
  page: 1,
  limit: 20
});
```

### Capture Payment

Capture held payment after client approval:

```javascript
const result = await client.escrow.capture('escrow-id');
```

### Refund Payment

Refund payment before capture:

```javascript
const result = await client.escrow.refund('escrow-id', 'Cancellation reason');
```

### Upload Proof of Work

Provider uploads proof of work:

```javascript
const result = await client.escrow.uploadProofOfWork('escrow-id', {
  documents: [
    { url: 'https://example.com/proof1.jpg' },
    { url: 'https://example.com/proof2.jpg' }
  ],
  notes: 'Work completed as per agreement'
});
```

### Initiate Dispute

```javascript
const result = await client.escrow.initiateDispute('escrow-id', {
  reason: 'Service not delivered as promised',
  evidence: [
    { url: 'https://example.com/evidence.jpg' }
  ]
});
```

### Request Payout

Provider requests payout:

```javascript
const payout = await client.escrow.requestPayout('escrow-id');
```

### Get Transactions

Get escrow transaction history:

```javascript
const transactions = await client.escrow.getTransactions('escrow-id');
```

### Get Payout Details

```javascript
const payout = await client.escrow.getPayoutDetails('escrow-id');
```

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
