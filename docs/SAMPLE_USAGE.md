# Sample Usage Guide

## Overview
This document provides practical code examples and sample implementations for common use cases in the LocalPro Super App API.

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [Client Examples](#client-examples)
3. [Provider Examples](#provider-examples)
4. [Common Patterns](#common-patterns)
5. [Complete Integration Examples](#complete-integration-examples)

---

## Authentication Flow

### Complete Registration and Login Flow

```javascript
// Complete authentication flow example
class AuthService {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = null;
  }
  
  // Step 1: Send verification code
  async sendVerificationCode(phoneNumber) {
    const response = await fetch(`${this.apiBaseUrl}/api/auth/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phoneNumber })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send code');
    }
    
    return await response.json();
  }
  
  // Step 2: Verify code and get token
  async verifyCode(phoneNumber, code) {
    const response = await fetch(`${this.apiBaseUrl}/api/auth/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phoneNumber, code })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid verification code');
    }
    
    const data = await response.json();
    this.token = data.token;
    
    // Store token securely
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
    }
    
    return data;
  }
  
  // Step 3: Complete onboarding
  async completeOnboarding(profileData) {
    const response = await fetch(`${this.apiBaseUrl}/api/auth/complete-onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(profileData)
    });
    
    return await response.json();
  }
  
  // Get current user
  async getCurrentUser() {
    const response = await fetch(`${this.apiBaseUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    return await response.json();
  }
}

// Usage example
const authService = new AuthService('https://api.localpro.com');

// Registration flow
async function registerUser() {
  try {
    // Step 1: Send code
    await authService.sendVerificationCode('+639123456789');
    console.log('Verification code sent');
    
    // Step 2: User enters code (in real app, get from user input)
    const code = prompt('Enter verification code:');
    const authData = await authService.verifyCode('+639123456789', code);
    console.log('User authenticated:', authData);
    
    // Step 3: Complete onboarding
    const onboardingData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      address: {
        street: '123 Main St',
        city: 'Manila',
        state: 'Metro Manila',
        zipCode: '1000',
        country: 'Philippines'
      }
    };
    
    await authService.completeOnboarding(onboardingData);
    console.log('Onboarding completed');
    
    // Step 4: Get user profile
    const user = await authService.getCurrentUser();
    console.log('Current user:', user);
    
  } catch (error) {
    console.error('Registration failed:', error);
  }
}
```

---

## Client Examples

### Browse and Book a Service

```javascript
// Complete service booking flow for clients
class MarketplaceService {
  constructor(apiBaseUrl, token) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
  }
  
  // Browse services
  async browseServices(filters = {}) {
    const params = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...filters
    });
    
    const response = await fetch(
      `${this.apiBaseUrl}/api/marketplace/services?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    
    return await response.json();
  }
  
  // Get service details
  async getServiceDetails(serviceId) {
    const response = await fetch(
      `${this.apiBaseUrl}/api/marketplace/services/${serviceId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    
    return await response.json();
  }
  
  // Get provider details
  async getProviderDetails(providerId) {
    const response = await fetch(
      `${this.apiBaseUrl}/api/marketplace/providers/${providerId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    
    return await response.json();
  }
  
  // Create booking
  async createBooking(bookingData) {
    const response = await fetch(
      `${this.apiBaseUrl}/api/marketplace/bookings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(bookingData)
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create booking');
    }
    
    return await response.json();
  }
  
  // Get my bookings
  async getMyBookings() {
    const response = await fetch(
      `${this.apiBaseUrl}/api/marketplace/my-bookings`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    
    return await response.json();
  }
  
  // Add review
  async addReview(bookingId, reviewData) {
    const formData = new FormData();
    formData.append('rating', reviewData.rating);
    formData.append('comment', reviewData.comment);
    
    if (reviewData.photos) {
      reviewData.photos.forEach((photo, index) => {
        formData.append('photos', photo);
      });
    }
    
    const response = await fetch(
      `${this.apiBaseUrl}/api/marketplace/bookings/${bookingId}/review`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      }
    );
    
    return await response.json();
  }
}

// Usage example: Complete booking flow
async function bookService() {
  const marketplace = new MarketplaceService(
    'https://api.localpro.com',
    localStorage.getItem('auth_token')
  );
  
  try {
    // Step 1: Browse services
    const services = await marketplace.browseServices({
      category: 'cleaning',
      location: 'Manila'
    });
    console.log('Available services:', services.data);
    
    // Step 2: Select a service
    const selectedService = services.data[0];
    const serviceDetails = await marketplace.getServiceDetails(selectedService._id);
    console.log('Service details:', serviceDetails);
    
    // Step 3: Get provider details
    const providerDetails = await marketplace.getProviderDetails(
      serviceDetails.data.providerId
    );
    console.log('Provider details:', providerDetails);
    
    // Step 4: Create booking
    const booking = await marketplace.createBooking({
      serviceId: selectedService._id,
      providerId: serviceDetails.data.providerId,
      scheduledDate: '2025-01-20T10:00:00Z',
      address: {
        street: '123 Main St',
        city: 'Manila',
        zipCode: '1000',
        coordinates: {
          lat: 14.5995,
          lng: 120.9842
        }
      },
      notes: 'Please bring cleaning supplies'
    });
    console.log('Booking created:', booking);
    
    // Step 5: After service completion, add review
    const review = await marketplace.addReview(booking.data._id, {
      rating: 5,
      comment: 'Excellent service! Very professional.',
      photos: [] // Can include photos
    });
    console.log('Review added:', review);
    
  } catch (error) {
    console.error('Booking failed:', error);
  }
}
```

### Search and Apply for Jobs

```javascript
// Job search and application flow
class JobService {
  constructor(apiBaseUrl, token) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
  }
  
  // Search jobs
  async searchJobs(query, filters = {}) {
    const params = new URLSearchParams({
      query,
      ...filters
    });
    
    const response = await fetch(
      `${this.apiBaseUrl}/api/jobs/search?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    
    return await response.json();
  }
  
  // Get job details
  async getJobDetails(jobId) {
    const response = await fetch(
      `${this.apiBaseUrl}/api/jobs/${jobId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    
    return await response.json();
  }
  
  // Apply for job
  async applyForJob(jobId, applicationData) {
    const formData = new FormData();
    formData.append('coverLetter', applicationData.coverLetter);
    
    if (applicationData.resume) {
      formData.append('resume', applicationData.resume);
    }
    
    const response = await fetch(
      `${this.apiBaseUrl}/api/jobs/${jobId}/apply`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      }
    );
    
    return await response.json();
  }
  
  // Get my applications
  async getMyApplications() {
    const response = await fetch(
      `${this.apiBaseUrl}/api/jobs/my-applications`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    
    return await response.json();
  }
}

// Usage example
async function applyForJob() {
  const jobService = new JobService(
    'https://api.localpro.com',
    localStorage.getItem('auth_token')
  );
  
  try {
    // Search for jobs
    const jobs = await jobService.searchJobs('plumber', {
      location: 'Manila',
      salaryRange: '30000-50000'
    });
    console.log('Found jobs:', jobs.data);
    
    // Get job details
    const jobId = jobs.data[0]._id;
    const jobDetails = await jobService.getJobDetails(jobId);
    console.log('Job details:', jobDetails);
    
    // Apply for job
    const application = await jobService.applyForJob(jobId, {
      coverLetter: 'I am interested in this position...',
      resume: document.getElementById('resumeFile').files[0]
    });
    console.log('Application submitted:', application);
    
    // Track applications
    const myApplications = await jobService.getMyApplications();
    console.log('My applications:', myApplications);
    
  } catch (error) {
    console.error('Application failed:', error);
  }
}
```

---

## Provider Examples

### Create and Manage Service Listing

```javascript
// Provider service management
class ProviderService {
  constructor(apiBaseUrl, token) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
  }
  
  // Create service
  async createService(serviceData) {
    const response = await fetch(
      `${this.apiBaseUrl}/api/marketplace/services`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(serviceData)
      }
    );
    
    return await response.json();
  }
  
  // Upload service images
  async uploadServiceImages(serviceId, images) {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append('images', image);
    });
    
    const response = await fetch(
      `${this.apiBaseUrl}/api/marketplace/services/${serviceId}/images`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`
        },
        body: formData
      }
    );
    
    return await response.json();
  }
  
  // Get my services
  async getMyServices() {
    const response = await fetch(
      `${this.apiBaseUrl}/api/marketplace/my-services`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    
    return await response.json();
  }
  
  // Update service
  async updateService(serviceId, updates) {
    const response = await fetch(
      `${this.apiBaseUrl}/api/marketplace/services/${serviceId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(updates)
      }
    );
    
    return await response.json();
  }
  
  // Get dashboard
  async getDashboard() {
    const response = await fetch(
      `${this.apiBaseUrl}/api/providers/dashboard/overview`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    
    return await response.json();
  }
  
  // Get analytics
  async getAnalytics(timeframe = '30d') {
    const response = await fetch(
      `${this.apiBaseUrl}/api/providers/analytics/performance?timeframe=${timeframe}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    
    return await response.json();
  }
}

// Usage example: Create service listing
async function createServiceListing() {
  const providerService = new ProviderService(
    'https://api.localpro.com',
    localStorage.getItem('auth_token')
  );
  
  try {
    // Create service
    const service = await providerService.createService({
      title: 'Professional Home Cleaning',
      description: 'Complete home cleaning service including all rooms',
      category: 'cleaning',
      price: 500,
      duration: 120, // minutes
      serviceArea: {
        cities: ['Manila', 'Quezon City'],
        radius: 10 // km
      },
      availability: {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        hours: {
          start: '09:00',
          end: '17:00'
        }
      }
    });
    console.log('Service created:', service);
    
    // Upload images
    const imageFiles = document.getElementById('serviceImages').files;
    if (imageFiles.length > 0) {
      const images = await providerService.uploadServiceImages(
        service.data._id,
        Array.from(imageFiles)
      );
      console.log('Images uploaded:', images);
    }
    
    // View dashboard
    const dashboard = await providerService.getDashboard();
    console.log('Dashboard:', dashboard);
    
    // View analytics
    const analytics = await providerService.getAnalytics('7d');
    console.log('Analytics:', analytics);
    
  } catch (error) {
    console.error('Service creation failed:', error);
  }
}
```

### Manage Bookings

```javascript
// Provider booking management
async function manageBookings() {
  const providerService = new ProviderService(
    'https://api.localpro.com',
    localStorage.getItem('auth_token')
  );
  
  try {
    // Get my bookings
    const bookings = await providerService.getMyBookings();
    console.log('My bookings:', bookings.data);
    
    // Update booking status
    const bookingId = bookings.data[0]._id;
    const updateResponse = await fetch(
      `https://api.localpro.com/api/marketplace/bookings/${bookingId}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          status: 'confirmed',
          notes: 'Booking confirmed, will arrive on time'
        })
      }
    );
    
    const updated = await updateResponse.json();
    console.log('Booking updated:', updated);
    
  } catch (error) {
    console.error('Booking management failed:', error);
  }
}
```

---

## Common Patterns

### Error Handling Wrapper

```javascript
// Reusable error handling wrapper
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle API errors
      handleApiError(error);
    } else {
      // Handle network errors
      console.error('Network error:', error);
      showNotification('Network error. Please check your connection.', 'error');
    }
    throw error;
  }
}

class ApiError extends Error {
  constructor(status, error) {
    super(error.message || 'API Error');
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

function handleApiError(error) {
  switch (error.status) {
    case 401:
      // Redirect to login
      window.location.href = '/login';
      break;
    case 403:
      showNotification('You don\'t have permission for this action.', 'error');
      break;
    case 404:
      showNotification('Resource not found.', 'error');
      break;
    case 429:
      showNotification('Too many requests. Please wait a moment.', 'warning');
      break;
    case 500:
      showNotification('Server error. Please try again later.', 'error');
      break;
    default:
      showNotification(error.message || 'An error occurred.', 'error');
  }
}
```

### Pagination Helper

```javascript
// Pagination helper class
class PaginatedList {
  constructor(fetchFunction, options = {}) {
    this.fetchFunction = fetchFunction;
    this.page = options.initialPage || 1;
    this.limit = options.limit || 20;
    this.data = [];
    this.hasMore = true;
    this.loading = false;
  }
  
  async loadNext() {
    if (this.loading || !this.hasMore) return;
    
    this.loading = true;
    try {
      const response = await this.fetchFunction({
        page: this.page,
        limit: this.limit
      });
      
      this.data = [...this.data, ...response.data];
      this.hasMore = response.pagination?.hasNext || false;
      this.page++;
      
      return response;
    } finally {
      this.loading = false;
    }
  }
  
  async refresh() {
    this.page = 1;
    this.data = [];
    this.hasMore = true;
    return this.loadNext();
  }
}

// Usage example
const servicesList = new PaginatedList(async ({ page, limit }) => {
  return await apiCall(
    `/api/marketplace/services?page=${page}&limit=${limit}`
  );
});

// Load initial page
await servicesList.loadNext();

// Load more on scroll
window.addEventListener('scroll', async () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
    await servicesList.loadNext();
  }
});
```

---

## Complete Integration Examples

### React Hook Example

```javascript
// React hook for API integration
import { useState, useEffect, useCallback } from 'react';

function useLocalProAPI(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`https://api.localpro.com${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(options)]);
  
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchData();
    }
  }, [fetchData, options.autoFetch]);
  
  return { data, loading, error, refetch: fetchData };
}

// Usage in component
function ServicesList() {
  const { data, loading, error } = useLocalProAPI('/api/marketplace/services', {
    autoFetch: true
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.data?.map(service => (
        <div key={service._id}>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
          <p>Price: ${service.price}</p>
        </div>
      ))}
    </div>
  );
}
```

### Node.js SDK Example

```javascript
// Complete Node.js SDK example
class LocalProSDK {
  constructor(config) {
    this.baseURL = config.baseURL || 'https://api.localpro.com';
    this.token = config.token;
    this.timeout = config.timeout || 30000;
  }
  
  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      timeout: this.timeout
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  }
  
  // Marketplace methods
  marketplace = {
    getServices: (filters) => this.request('GET', '/api/marketplace/services', filters),
    getService: (id) => this.request('GET', `/api/marketplace/services/${id}`),
    createBooking: (data) => this.request('POST', '/api/marketplace/bookings', data),
    getBookings: () => this.request('GET', '/api/marketplace/my-bookings')
  };
  
  // Finance methods
  finance = {
    getOverview: () => this.request('GET', '/api/finance/overview'),
    getEarnings: () => this.request('GET', '/api/finance/earnings'),
    requestWithdrawal: (data) => this.request('POST', '/api/finance/withdraw', data)
  };
  
  // Provider methods
  provider = {
    getDashboard: () => this.request('GET', '/api/providers/dashboard/overview'),
    getAnalytics: (timeframe) => 
      this.request('GET', `/api/providers/analytics/performance?timeframe=${timeframe}`)
  };
}

// Usage
const sdk = new LocalProSDK({
  baseURL: 'https://api.localpro.com',
  token: 'your-token-here'
});

// Get services
const services = await sdk.marketplace.getServices({ category: 'cleaning' });

// Create booking
const booking = await sdk.marketplace.createBooking({
  serviceId: 'service-id',
  providerId: 'provider-id',
  scheduledDate: '2025-01-20T10:00:00Z'
});

// Get dashboard
const dashboard = await sdk.provider.getDashboard();
```

---

## Summary

These examples demonstrate:
- ✅ Complete authentication flows
- ✅ Service booking workflows
- ✅ Job application processes
- ✅ Provider service management
- ✅ Error handling patterns
- ✅ Pagination implementations
- ✅ React integration
- ✅ Node.js SDK patterns

For more specific examples, refer to individual feature documentation in `docs/features/`.


