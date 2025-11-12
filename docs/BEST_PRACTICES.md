# Best Practices Guide

## Overview
This document outlines best practices for using the LocalPro Super App API, including security, performance, error handling, and integration patterns.

## Table of Contents
1. [Authentication & Security](#authentication--security)
2. [API Usage](#api-usage)
3. [Error Handling](#error-handling)
4. [Performance Optimization](#performance-optimization)
5. [Data Management](#data-management)
6. [Integration Patterns](#integration-patterns)
7. [Testing](#testing)
8. [Monitoring & Logging](#monitoring--logging)

---

## Authentication & Security

### Token Management

**✅ DO:**
- Store tokens securely (use secure storage, never localStorage for sensitive apps)
- Implement token refresh before expiration
- Handle token expiration gracefully
- Use HTTPS for all API calls
- Include tokens in Authorization header: `Authorization: Bearer <token>`

**❌ DON'T:**
- Don't expose tokens in URLs or logs
- Don't share tokens between users
- Don't hardcode tokens in client code
- Don't ignore token expiration errors

```javascript
// ✅ Good: Secure token storage and refresh
const refreshToken = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    const { token } = await response.json();
    secureStorage.set('token', token);
    return token;
  } catch (error) {
    // Handle refresh failure - redirect to login
    redirectToLogin();
  }
};

// ❌ Bad: Token in URL or localStorage
const badExample = `https://api.example.com/data?token=${token}`;
localStorage.setItem('token', token); // Not secure for sensitive apps
```

### Rate Limiting

**✅ DO:**
- Respect rate limits (check response headers)
- Implement exponential backoff for retries
- Cache responses when appropriate
- Batch requests when possible

```javascript
// ✅ Good: Rate limit handling with exponential backoff
const fetchWithRetry = async (url, options, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
        await sleep(retryAfter * 1000);
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
};
```

### Input Validation

**✅ DO:**
- Validate all user inputs on client side
- Sanitize data before sending to API
- Use proper data types
- Validate file uploads (size, type)

```javascript
// ✅ Good: Input validation
const validateBooking = (bookingData) => {
  const errors = [];
  
  if (!bookingData.serviceId || !isValidObjectId(bookingData.serviceId)) {
    errors.push('Valid service ID required');
  }
  
  if (!bookingData.scheduledDate || !isValidDate(bookingData.scheduledDate)) {
    errors.push('Valid scheduled date required');
  }
  
  if (bookingData.notes && bookingData.notes.length > 500) {
    errors.push('Notes must be less than 500 characters');
  }
  
  return { isValid: errors.length === 0, errors };
};
```

---

## API Usage

### Request Headers

**✅ DO:**
- Always include Content-Type header
- Include Accept header for expected response format
- Include User-Agent for tracking
- Use appropriate request IDs for tracing

```javascript
// ✅ Good: Proper headers
const apiCall = async (endpoint, data) => {
  const response = await fetch(`/api${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Request-ID': generateRequestId()
    },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### Pagination

**✅ DO:**
- Always use pagination for list endpoints
- Implement infinite scroll or "Load More" buttons
- Cache paginated results
- Handle empty results gracefully

```javascript
// ✅ Good: Pagination handling
const fetchServices = async (page = 1, limit = 20) => {
  const response = await fetch(
    `/api/marketplace/services?page=${page}&limit=${limit}`
  );
  const { data, pagination } = await response.json();
  
  return {
    services: data,
    hasMore: pagination.hasNext,
    nextPage: pagination.currentPage + 1
  };
};
```

### Filtering & Search

**✅ DO:**
- Use query parameters for filtering
- Implement debouncing for search inputs
- Provide clear filter options
- Cache search results

```javascript
// ✅ Good: Debounced search
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const searchServices = debounce(async (query) => {
  if (query.length < 2) return;
  const results = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  return results.json();
}, 300);
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Error Handling Best Practices

**✅ DO:**
- Handle all HTTP status codes appropriately
- Provide user-friendly error messages
- Log errors for debugging
- Implement retry logic for transient errors
- Show loading states during requests

```javascript
// ✅ Good: Comprehensive error handling
const handleApiError = (error, response) => {
  if (!response) {
    // Network error
    return {
      userMessage: 'Network error. Please check your connection.',
      logMessage: 'Network error: ' + error.message,
      retryable: true
    };
  }
  
  switch (response.status) {
    case 400:
      return {
        userMessage: 'Invalid request. Please check your input.',
        logMessage: 'Bad request: ' + error.message,
        retryable: false
      };
    case 401:
      return {
        userMessage: 'Please log in again.',
        logMessage: 'Unauthorized',
        retryable: false,
        action: 'redirectToLogin'
      };
    case 403:
      return {
        userMessage: 'You don\'t have permission for this action.',
        logMessage: 'Forbidden',
        retryable: false
      };
    case 404:
      return {
        userMessage: 'Resource not found.',
        logMessage: 'Not found',
        retryable: false
      };
    case 429:
      return {
        userMessage: 'Too many requests. Please wait a moment.',
        logMessage: 'Rate limited',
        retryable: true
      };
    case 500:
      return {
        userMessage: 'Server error. Please try again later.',
        logMessage: 'Server error: ' + error.message,
        retryable: true
      };
    default:
      return {
        userMessage: 'An unexpected error occurred.',
        logMessage: 'Unknown error: ' + error.message,
        retryable: true
      };
  }
};
```

### Retry Logic

```javascript
// ✅ Good: Retry with exponential backoff
const retryRequest = async (requestFn, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

---

## Performance Optimization

### Caching Strategy

**✅ DO:**
- Cache static or rarely-changing data
- Use ETags for conditional requests
- Implement cache invalidation
- Set appropriate cache headers

```javascript
// ✅ Good: Caching with invalidation
class ApiCache {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key, data, customTtl) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (customTtl || this.ttl)
    });
  }
  
  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### Request Batching

**✅ DO:**
- Batch multiple related requests when possible
- Use GraphQL-style queries for complex data fetching
- Minimize round trips

```javascript
// ✅ Good: Batch requests
const fetchUserDashboard = async (userId) => {
  const [bookings, earnings, notifications] = await Promise.all([
    fetch(`/api/marketplace/my-bookings`),
    fetch(`/api/finance/earnings`),
    fetch(`/api/communication/notifications/count`)
  ]);
  
  return {
    bookings: await bookings.json(),
    earnings: await earnings.json(),
    notifications: await notifications.json()
  };
};
```

### Lazy Loading

**✅ DO:**
- Load data on demand
- Implement pagination for large lists
- Use virtual scrolling for long lists
- Load images lazily

```javascript
// ✅ Good: Lazy loading with intersection observer
const lazyLoadImages = () => {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
};
```

---

## Data Management

### File Uploads

**✅ DO:**
- Validate file size and type before upload
- Show upload progress
- Compress images before upload
- Handle upload failures gracefully

```javascript
// ✅ Good: File upload with validation and progress
const uploadFile = async (file, endpoint) => {
  // Validate file
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  // Compress image if needed
  const compressedFile = await compressImage(file);
  
  // Upload with progress
  const formData = new FormData();
  formData.append('file', compressedFile);
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        updateProgressBar(percentComplete);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });
    
    xhr.addEventListener('error', reject);
    xhr.open('POST', endpoint);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
};
```

### Data Synchronization

**✅ DO:**
- Implement optimistic updates
- Handle conflicts gracefully
- Sync data periodically
- Use WebSockets for real-time updates

```javascript
// ✅ Good: Optimistic updates
const updateBookingStatus = async (bookingId, status) => {
  // Optimistic update
  const previousStatus = getBookingStatus(bookingId);
  setBookingStatus(bookingId, status);
  
  try {
    await fetch(`/api/marketplace/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
  } catch (error) {
    // Rollback on error
    setBookingStatus(bookingId, previousStatus);
    showError('Failed to update booking status');
  }
};
```

---

## Integration Patterns

### SDK Pattern

**✅ DO:**
- Create a client SDK for easier integration
- Abstract API complexity
- Provide type definitions
- Include error handling

```javascript
// ✅ Good: SDK pattern
class LocalProClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }
  
  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.json());
    }
    
    return response.json();
  }
  
  // Marketplace methods
  async getServices(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/marketplace/services?${params}`);
  }
  
  async createBooking(bookingData) {
    return this.request('/api/marketplace/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }
  
  // Finance methods
  async getEarnings() {
    return this.request('/api/finance/earnings');
  }
}
```

### Webhook Integration

**✅ DO:**
- Verify webhook signatures
- Handle idempotency
- Process webhooks asynchronously
- Implement retry logic

```javascript
// ✅ Good: Webhook handler
const handleWebhook = async (req, res) => {
  // Verify signature
  const signature = req.headers['x-webhook-signature'];
  if (!verifySignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Check idempotency
  const eventId = req.body.id;
  if (await isEventProcessed(eventId)) {
    return res.status(200).json({ message: 'Event already processed' });
  }
  
  // Process webhook
  try {
    await processWebhookEvent(req.body);
    await markEventAsProcessed(eventId);
    res.status(200).json({ success: true });
  } catch (error) {
    // Queue for retry
    await queueForRetry(eventId, req.body);
    res.status(500).json({ error: 'Processing failed' });
  }
};
```

---

## Testing

### API Testing

**✅ DO:**
- Write tests for all API endpoints
- Test error cases
- Use test fixtures
- Mock external dependencies

```javascript
// ✅ Good: API testing
describe('Marketplace API', () => {
  let token;
  
  beforeAll(async () => {
    token = await authenticateTestUser();
  });
  
  test('should create booking', async () => {
    const bookingData = {
      serviceId: 'test-service-id',
      providerId: 'test-provider-id',
      scheduledDate: '2025-01-20T10:00:00Z',
      address: {
        street: '123 Test St',
        city: 'Manila'
      }
    };
    
    const response = await request(app)
      .post('/api/marketplace/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send(bookingData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('pending');
  });
  
  test('should handle validation errors', async () => {
    const response = await request(app)
      .post('/api/marketplace/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({}) // Invalid data
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## Monitoring & Logging

### Logging Best Practices

**✅ DO:**
- Log all API requests and responses
- Include request IDs for tracing
- Log errors with context
- Use structured logging
- Don't log sensitive data

```javascript
// ✅ Good: Structured logging
const logger = {
  info: (message, context = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      userId: context.userId,
      ...context
    }));
  },
  
  error: (message, error, context = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      ...context
    }));
  }
};
```

### Performance Monitoring

**✅ DO:**
- Track API response times
- Monitor error rates
- Track usage metrics
- Set up alerts for anomalies

```javascript
// ✅ Good: Performance tracking
const trackApiCall = async (endpoint, requestFn) => {
  const startTime = Date.now();
  let success = false;
  
  try {
    const result = await requestFn();
    success = true;
    return result;
  } finally {
    const duration = Date.now() - startTime;
    analytics.track('api_call', {
      endpoint,
      duration,
      success,
      timestamp: new Date().toISOString()
    });
  }
};
```

---

## Summary

Following these best practices will help you:
- ✅ Build secure and reliable integrations
- ✅ Optimize performance and user experience
- ✅ Handle errors gracefully
- ✅ Maintain code quality
- ✅ Monitor and debug effectively

For specific feature documentation, refer to the `docs/features/` directory.


