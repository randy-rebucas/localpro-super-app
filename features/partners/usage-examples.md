# Partner Usage Examples

## Overview

This document provides practical examples for using the Partner API, including onboarding flows, admin management, and third-party integration scenarios.

## Partner Onboarding Flow

### Complete Onboarding Process

#### 1. Start Onboarding

```bash
curl -X POST http://localhost:5000/api/partners/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Solutions Inc.",
    "email": "contact@techsolutions.com",
    "phoneNumber": "+1234567890"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Partner onboarding started successfully",
  "data": {
    "partner": {
      "id": "674d8f2c8f1b2c001f3a4e5f",
      "name": "Tech Solutions Inc.",
      "email": "contact@techsolutions.com",
      "slug": "tech-solutions-inc",
      "onboarding": {
        "completed": false,
        "currentStep": "business_info",
        "progress": 20
      }
    }
  }
}
```

#### 2. Update Business Information

```bash
curl -X PUT http://localhost:5000/api/partners/674d8f2c8f1b2c001f3a4e5f/business-info \
  -H "Content-Type: application/json" \
  -d '{
    "businessInfo": {
      "companyName": "Tech Solutions Inc.",
      "website": "https://techsolutions.com",
      "industry": "Software Development",
      "description": "Leading provider of enterprise software solutions",
      "address": {
        "street": "123 Tech Street",
        "city": "San Francisco",
        "state": "CA",
        "zipCode": "94105",
        "country": "USA"
      }
    }
  }'
```

#### 3. Configure API Settings

```bash
curl -X PUT http://localhost:5000/api/partners/674d8f2c8f1b2c001f3a4e5f/api-setup \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://api.techsolutions.com/webhooks/localpro",
    "callbackUrl": "https://app.techsolutions.com/auth/callback"
  }'
```

#### 4. Submit Verification Documents

```bash
curl -X PUT http://localhost:5000/api/partners/674d8f2c8f1b2c001f3a4e5f/verification \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "type": "business_registration",
        "name": "Business License",
        "url": "https://storage.techsolutions.com/docs/license.pdf"
      },
      {
        "type": "tax_id",
        "name": "Tax Identification",
        "url": "https://storage.techsolutions.com/docs/tax.pdf"
      }
    ]
  }'
```

#### 5. Activate Partner

```bash
curl -X PUT http://localhost:5000/api/partners/674d8f2c8f1b2c001f3a4e5f/activate \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Partner activated successfully",
  "data": {
    "partner": {
      "id": "674d8f2c8f1b2c001f3a4e5f",
      "name": "Tech Solutions Inc.",
      "email": "contact@techsolutions.com",
      "slug": "tech-solutions-inc",
      "status": "active",
      "apiCredentials": {
        "clientId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "apiKey": "x1y2z3w4-v5u6-7890-abcd-ef1234567890",
        "webhookUrl": "https://api.techsolutions.com/webhooks/localpro",
        "callbackUrl": "https://app.techsolutions.com/auth/callback"
      }
    }
  }
}
```

## Admin Management Examples

### Create Partner (Admin Only)

```bash
curl -X POST http://localhost:5000/api/partners \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "name": "Data Analytics Corp",
    "email": "admin@dataanalytics.com",
    "phoneNumber": "+1987654321",
    "businessInfo": {
      "companyName": "Data Analytics Corp",
      "industry": "Data Analytics",
      "description": "Advanced data analytics and business intelligence"
    }
  }'
```

### List Partners with Filtering

```bash
# Get active partners
curl -X GET "http://localhost:5000/api/partners?status=active&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Search partners
curl -X GET "http://localhost:5000/api/partners?search=tech&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# Get partners with incomplete onboarding
curl -X GET "http://localhost:5000/api/partners?onboardingCompleted=false" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "partners": [
      {
        "id": "674d8f2c8f1b2c001f3a4e5f",
        "name": "Tech Solutions Inc.",
        "email": "contact@techsolutions.com",
        "slug": "tech-solutions-inc",
        "status": "active",
        "onboarding": {
          "completed": true,
          "progress": 100
        },
        "businessInfo": {
          "companyName": "Tech Solutions Inc.",
          "industry": "Software Development"
        },
        "usage": {
          "totalRequests": 1250,
          "monthlyRequests": 380
        },
        "createdAt": "2025-12-14T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Update Partner Status

```bash
curl -X PUT http://localhost:5000/api/partners/674d8f2c8f1b2c001f3a4e5f \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "status": "suspended",
    "notes": "Suspended due to policy violation"
  }'
```

### Add Admin Note

```bash
curl -X POST http://localhost:5000/api/partners/674d8f2c8f1b2c001f3a4e5f/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "content": "Partner requested increased API limits for Q4 campaign"
  }'
```

### Delete Partner

```bash
curl -X DELETE http://localhost:5000/api/partners/674d8f2c8f1b2c001f3a4e5f \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## Third-Party Integration Examples

### Get Partner by Slug (for Login)

```bash
curl -X GET http://localhost:5000/api/partners/slug/tech-solutions-inc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "partner": {
      "id": "674d8f2c8f1b2c001f3a4e5f",
      "name": "Tech Solutions Inc.",
      "slug": "tech-solutions-inc",
      "businessInfo": {
        "companyName": "Tech Solutions Inc.",
        "website": "https://techsolutions.com",
        "industry": "Software Development"
      }
    }
  }
}
```

### Partner API Authentication

```javascript
// Example: Authenticate partner API requests
const authenticatePartner = async (clientId, clientSecret) => {
  const partner = await Partner.findOne({
    'apiCredentials.clientId': clientId,
    'apiCredentials.clientSecret': clientSecret,
    status: 'active'
  });

  if (!partner) {
    throw new Error('Invalid credentials');
  }

  // Update usage tracking
  await partner.updateUsage();

  return partner;
};

// Usage in API middleware
app.use('/api/partner/*', async (req, res, next) => {
  const clientId = req.headers['x-client-id'];
  const clientSecret = req.headers['x-client-secret'];

  try {
    req.partner = await authenticatePartner(clientId, clientSecret);
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      code: 'INVALID_CREDENTIALS'
    });
  }
});
```

## Client-Side Integration Examples

### JavaScript SDK Usage

```javascript
class LocalProPartnerSDK {
  constructor(clientId, clientSecret, baseUrl = 'http://localhost:5000') {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = baseUrl;
  }

  async authenticate() {
    const response = await fetch(`${this.baseUrl}/api/partners/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.clientId,
        'x-client-secret': this.clientSecret
      }
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    this.token = data.data.token;
    return this.token;
  }

  async makeAuthenticatedRequest(endpoint, options = {}) {
    if (!this.token) {
      await this.authenticate();
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`,
        'x-client-id': this.clientId
      }
    });
  }

  // Example: Get provider data
  async getProviders(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await this.makeAuthenticatedRequest(
      `/api/providers?${queryString}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch providers');
    }

    return response.json();
  }

  // Example: Create booking
  async createBooking(bookingData) {
    const response = await this.makeAuthenticatedRequest('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      throw new Error('Failed to create booking');
    }

    return response.json();
  }
}

// Usage example
const sdk = new LocalProPartnerSDK('your-client-id', 'your-client-secret');

// Get providers in a specific city
const providers = await sdk.getProviders({
  city: 'Manila',
  service: 'cleaning',
  limit: 10
});

console.log('Available providers:', providers.data.providers);

// Create a booking
const booking = await sdk.createBooking({
  providerId: 'provider-id',
  serviceId: 'service-id',
  scheduledDate: '2025-12-20T10:00:00Z',
  customerInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890'
  }
});

console.log('Booking created:', booking.data.booking);
```

### Webhook Handler Example

```javascript
// Express.js webhook handler
app.post('/webhooks/localpro', express.json(), async (req, res) => {
  try {
    const { event, data } = req.body;

    // Verify webhook signature (implement based on your security requirements)
    // const isValid = verifyWebhookSignature(req.body, req.headers['x-signature']);

    console.log(`Received webhook: ${event}`, data);

    switch (event) {
      case 'booking.created':
        await handleBookingCreated(data.booking);
        break;

      case 'booking.updated':
        await handleBookingUpdated(data.booking);
        break;

      case 'provider.status_changed':
        await handleProviderStatusChange(data.provider);
        break;

      default:
        console.log(`Unhandled event: ${event}`);
    }

    res.json({ success: true, message: 'Webhook processed' });

  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

async function handleBookingCreated(booking) {
  // Update your system with new booking
  console.log('New booking created:', booking.id);

  // Send notification to customer
  await sendNotification(booking.customer.email, 'booking_confirmed', {
    bookingId: booking.id,
    providerName: booking.provider.name,
    serviceDate: booking.scheduledDate
  });
}

async function handleBookingUpdated(booking) {
  // Handle booking status changes
  console.log('Booking updated:', booking.id, booking.status);

  if (booking.status === 'completed') {
    // Process payment or update analytics
    await processCompletedBooking(booking);
  }
}
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PartnerDashboard = () => {
  const [partner, setPartner] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartnerData();
  }, []);

  const loadPartnerData = async () => {
    try {
      // Get partner info by slug
      const partnerResponse = await axios.get('/api/partners/slug/tech-solutions-inc');
      setPartner(partnerResponse.data.data.partner);

      // Load providers (using partner API)
      const providersResponse = await axios.get('/api/providers', {
        headers: {
          'x-client-id': 'your-client-id',
          'x-client-secret': 'your-client-secret'
        },
        params: {
          city: 'Manila',
          limit: 20
        }
      });

      setProviders(providersResponse.data.data.providers);
    } catch (error) {
      console.error('Failed to load partner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (providerId, serviceData) => {
    try {
      const response = await axios.post('/api/bookings', {
        providerId,
        ...serviceData
      }, {
        headers: {
          'x-client-id': 'your-client-id',
          'x-client-secret': 'your-client-secret'
        }
      });

      console.log('Booking created:', response.data.data.booking);
      // Show success message, update UI, etc.
    } catch (error) {
      console.error('Failed to create booking:', error);
      // Show error message
    }
  };

  if (loading) {
    return <div>Loading partner dashboard...</div>;
  }

  return (
    <div className="partner-dashboard">
      <header>
        <h1>Welcome, {partner?.businessInfo?.companyName}</h1>
        <p>Partner ID: {partner?.slug}</p>
      </header>

      <section className="providers-section">
        <h2>Available Providers</h2>
        <div className="providers-grid">
          {providers.map(provider => (
            <div key={provider.id} className="provider-card">
              <h3>{provider.name}</h3>
              <p>{provider.businessInfo?.description}</p>
              <button
                onClick={() => createBooking(provider.id, {
                  serviceId: 'service-id',
                  scheduledDate: new Date().toISOString()
                })}
              >
                Book Service
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PartnerDashboard;
```

## Testing Examples

### Postman Collection

```json
{
  "info": {
    "name": "LocalPro Partner API",
    "description": "Complete API collection for partner integration"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    },
    {
      "key": "partnerId",
      "value": "674d8f2c8f1b2c001f3a4e5f"
    },
    {
      "key": "clientId",
      "value": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    {
      "key": "clientSecret",
      "value": "secret-value"
    }
  ]
}
```

### Jest Test Example

```javascript
const request = require('supertest');
const app = require('../src/server');
const Partner = require('../src/models/Partner');

describe('Partner API', () => {
  let partnerId;
  let adminToken;

  beforeAll(async () => {
    // Get admin token for testing
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });

    adminToken = authResponse.body.data.token;
  });

  describe('POST /api/partners/onboarding/start', () => {
    it('should start partner onboarding', async () => {
      const response = await request(app)
        .post('/api/partners/onboarding/start')
        .send({
          name: 'Test Partner',
          email: 'test@partner.com',
          phoneNumber: '+1234567890'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.partner).toHaveProperty('id');
      expect(response.body.data.partner.slug).toBe('test-partner');

      partnerId = response.body.data.partner.id;
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/partners/onboarding/start')
        .send({
          name: 'Another Partner',
          email: 'test@partner.com',
          phoneNumber: '+0987654321'
        })
        .expect(409);

      expect(response.body.code).toBe('PARTNER_EXISTS');
    });
  });

  describe('PUT /api/partners/:id/business-info', () => {
    it('should update business information', async () => {
      const response = await request(app)
        .put(`/api/partners/${partnerId}/business-info`)
        .send({
          businessInfo: {
            companyName: 'Test Company Inc.',
            industry: 'Technology',
            description: 'Test company description'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.partner.businessInfo.companyName).toBe('Test Company Inc.');
    });
  });

  describe('GET /api/partners (Admin)', () => {
    it('should get partners list', async () => {
      const response = await request(app)
        .get('/api/partners')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.partners)).toBe(true);
    });
  });
});
```

## Error Handling Examples

### Handling API Errors

```javascript
const handleApiError = (error) => {
  if (error.response) {
    // API returned an error response
    const { status, data } = error.response;

    switch (status) {
      case 400:
        if (data.code === 'VALIDATION_ERROR') {
          // Handle validation errors
          showValidationErrors(data.errors);
        }
        break;

      case 401:
        if (data.code === 'INVALID_CREDENTIALS') {
          // Handle authentication errors
          redirectToLogin();
        }
        break;

      case 403:
        // Handle authorization errors
        showError('Insufficient permissions');
        break;

      case 404:
        if (data.code === 'PARTNER_NOT_FOUND') {
          showError('Partner not found');
        }
        break;

      case 409:
        if (data.code === 'PARTNER_EXISTS') {
          showError('Partner with this email already exists');
        }
        break;

      case 429:
        // Handle rate limiting
        showError('Too many requests. Please try again later.');
        break;

      default:
        showError(data.message || 'An unexpected error occurred');
    }
  } else if (error.request) {
    // Network error
    showError('Network error. Please check your connection.');
  } else {
    // Other error
    showError('An unexpected error occurred');
  }
};
```

### Retry Logic

```javascript
const apiRequestWithRetry = async (url, options, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response.json();
      }

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }

      // Retry on server errors (5xx) or network issues
      lastError = new Error(`Server error: ${response.status}`);

    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

These examples demonstrate the complete lifecycle of partner integration, from onboarding to active API usage, with proper error handling and best practices.
