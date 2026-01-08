# LocalPro API - Quick Start Guide for Developers

> **Version:** 1.0.0  
> **Last Updated:** January 7, 2026  
> **Estimated Time:** 30 minutes

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Authentication](#authentication)
4. [Your First API Call](#your-first-api-call)
5. [Common Use Cases](#common-use-cases)
6. [Testing with Postman](#testing-with-postman)
7. [SDK Integration](#sdk-integration)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js** v14 or higher (for backend)
- ✅ **npm** or **yarn** package manager
- ✅ **Postman** (optional, for testing)
- ✅ **Git** for version control
- ✅ **Code Editor** (VS Code, WebStorm, etc.)
- ✅ **API Key** (for production) - Contact support@localpro.com

### Development Tools

```bash
# Check your Node.js version
node --version  # Should be v14+

# Check npm version
npm --version

# Install Postman (optional)
# Download from: https://www.postman.com/downloads/
```

---

## Environment Setup

### 1. Base URLs

Choose the appropriate base URL for your environment:

```javascript
const BASE_URLS = {
  development: 'http://localhost:4000/api',
  staging: 'https://api-staging.localpro.com/api',
  production: 'https://api.localpro.com/api'
};
```

### 2. Create Environment Configuration

Create a `.env` file in your project root:

```env
# Environment
NODE_ENV=development
API_BASE_URL=http://localhost:4000/api

# API Keys (for production)
API_KEY=your_api_key_here
API_SECRET=your_api_secret_here

# Testing Credentials
TEST_CLIENT_EMAIL=test.client@example.com
TEST_CLIENT_PASSWORD=TestPassword123
TEST_PROVIDER_EMAIL=test.provider@example.com
TEST_PROVIDER_PASSWORD=TestPassword123
```

### 3. Install HTTP Client

Choose your preferred HTTP client:

**Option A: Axios (Recommended)**
```bash
npm install axios
```

**Option B: Fetch (Built-in)**
```javascript
// No installation needed
```

**Option C: Request (Node.js)**
```bash
npm install node-fetch
```

### 4. Create API Client

Create a reusable API client (`api-client.js`):

```javascript
// api-client.js
const axios = require('axios');

class LocalProAPI {
  constructor(baseURL = 'http://localhost:4000/api') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor for adding auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry original request
            return this.client.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token) {
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await this.client.post('/auth/refresh', {
        refreshToken
      });
      
      this.setToken(response.data.token);
      localStorage.setItem('refresh_token', response.data.refreshToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // API Methods
  async login(email, password) {
    const response = await this.client.post('/auth/login', {
      email,
      password
    });
    
    this.setToken(response.data.token);
    localStorage.setItem('refresh_token', response.data.refreshToken);
    return response.data;
  }

  async register(userData) {
    return this.client.post('/auth/register', userData);
  }

  async getProfile() {
    return this.client.get('/auth/me');
  }

  // Add more methods as needed
}

module.exports = LocalProAPI;
```

---

## Authentication

### Method 1: Email & Password Authentication

**Step 1: Register a New User**

```javascript
const api = new LocalProAPI();

// Register
const registerData = {
  email: 'developer@example.com',
  password: 'SecurePassword123',
  firstName: 'John',
  lastName: 'Developer'
};

try {
  const response = await api.register(registerData);
  console.log('Registration successful:', response.data);
  
  // Note: You'll receive an OTP via email
} catch (error) {
  console.error('Registration failed:', error.response.data);
}
```

**Step 2: Verify Email with OTP**

```javascript
// After receiving OTP via email
const verifyData = {
  email: 'developer@example.com',
  otp: '123456'  // OTP from email
};

try {
  const response = await api.client.post('/auth/verify-email-otp', verifyData);
  console.log('Email verified:', response.data);
  
  // Save tokens
  api.setToken(response.data.token);
  localStorage.setItem('refresh_token', response.data.refreshToken);
} catch (error) {
  console.error('Verification failed:', error.response.data);
}
```

**Step 3: Login**

```javascript
try {
  const response = await api.login(
    'developer@example.com',
    'SecurePassword123'
  );
  
  console.log('Login successful!');
  console.log('User:', response.user);
  console.log('Token:', response.token);
} catch (error) {
  console.error('Login failed:', error.response.data);
}
```

### Method 2: Phone/SMS Authentication

```javascript
// Step 1: Send verification code
const sendCodeResponse = await api.client.post('/auth/send-code', {
  phoneNumber: '+639171234567'
});

console.log('Code sent!', sendCodeResponse.data);

// Step 2: Verify code
const verifyCodeResponse = await api.client.post('/auth/verify-code', {
  phoneNumber: '+639171234567',
  code: '123456'  // Code from SMS
});

// Save tokens
api.setToken(verifyCodeResponse.data.token);
```

---

## Your First API Call

### 1. Get User Profile

```javascript
const api = new LocalProAPI();

async function getUserProfile() {
  try {
    // Make sure you're logged in first
    await api.login('developer@example.com', 'SecurePassword123');
    
    // Get profile
    const response = await api.getProfile();
    console.log('Profile:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

getUserProfile();
```

### 2. Browse Services

```javascript
async function browseServices() {
  try {
    const response = await api.client.get('/marketplace/services', {
      params: {
        page: 1,
        limit: 10,
        category: 'cleaning',
        city: 'Manila'
      }
    });
    
    console.log('Services found:', response.data.data.services.length);
    console.log('Services:', response.data.data.services);
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

browseServices();
```

### 3. Create a Booking

```javascript
async function createBooking() {
  try {
    const bookingData = {
      serviceId: '507f191e810c19729de860ea',
      providerId: '507f1f77bcf86cd799439011',
      scheduledDate: '2026-01-15T10:00:00Z',
      duration: 3,
      address: {
        street: '123 Main Street',
        city: 'Manila',
        state: 'Metro Manila',
        zipCode: '1000',
        country: 'Philippines'
      },
      notes: 'Please bring eco-friendly products'
    };
    
    const response = await api.client.post('/marketplace/bookings', bookingData);
    console.log('Booking created:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createBooking();
```

---

## Common Use Cases

### 1. Client App - Service Booking Flow

```javascript
class ClientApp {
  constructor() {
    this.api = new LocalProAPI();
  }

  async bookService() {
    try {
      // 1. Login
      await this.api.login('client@example.com', 'password');
      
      // 2. Search for services
      const services = await this.api.client.get('/marketplace/services', {
        params: { category: 'cleaning', city: 'Manila' }
      });
      
      // 3. Get service details
      const serviceId = services.data.data.services[0].id;
      const serviceDetails = await this.api.client.get(
        `/marketplace/services/${serviceId}`
      );
      
      // 4. Create booking
      const booking = await this.api.client.post('/marketplace/bookings', {
        serviceId: serviceId,
        providerId: serviceDetails.data.data.provider.id,
        scheduledDate: '2026-01-15T10:00:00Z',
        address: { /* address details */ }
      });
      
      console.log('Booking successful:', booking.data);
      return booking.data;
      
    } catch (error) {
      console.error('Booking failed:', error.response?.data);
      throw error;
    }
  }
}
```

### 2. Provider App - Manage Bookings

```javascript
class ProviderApp {
  constructor() {
    this.api = new LocalProAPI();
  }

  async manageDailyBookings() {
    try {
      // 1. Login as provider
      await this.api.login('provider@example.com', 'password');
      
      // 2. Get pending bookings
      const bookings = await this.api.client.get('/marketplace/my-bookings', {
        params: {
          role: 'provider',
          status: 'pending'
        }
      });
      
      console.log('Pending bookings:', bookings.data.data.bookings);
      
      // 3. Accept a booking
      const bookingId = bookings.data.data.bookings[0].id;
      await this.api.client.put(
        `/marketplace/bookings/${bookingId}/status`,
        {
          status: 'confirmed',
          message: 'Booking confirmed! See you soon.'
        }
      );
      
      console.log('Booking accepted');
      
      // 4. Get today's schedule
      const schedule = await this.api.client.get('/scheduling', {
        params: {
          startDate: new Date().toISOString().split('T')[0],
          view: 'day'
        }
      });
      
      return schedule.data;
      
    } catch (error) {
      console.error('Error:', error.response?.data);
      throw error;
    }
  }
}
```

### 3. Partner Portal - Bulk Operations

```javascript
class PartnerPortal {
  constructor() {
    this.api = new LocalProAPI();
    this.orgId = 'org123';
  }

  async setupCorporateProgram() {
    try {
      // 1. Login as partner
      await this.api.login('partner@abccorp.com', 'password');
      
      // 2. Create employee benefit program
      const program = await this.api.client.post('/partners/programs', {
        programType: 'employee_benefit',
        name: 'Home Services Benefit 2026',
        benefits: {
          type: 'credit',
          amount: 5000,
          frequency: 'annual'
        },
        allowedServices: ['cleaning', 'maintenance']
      }, {
        headers: {
          'X-Organization-ID': this.orgId
        }
      });
      
      console.log('Program created:', program.data);
      
      // 3. Bulk enroll employees (CSV)
      const formData = new FormData();
      formData.append('file', csvFile);
      
      const enrollment = await this.api.client.post(
        '/partners/users/bulk-enroll',
        formData,
        {
          headers: {
            'X-Organization-ID': this.orgId,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Enrolled:', enrollment.data);
      
      return { program, enrollment };
      
    } catch (error) {
      console.error('Error:', error.response?.data);
      throw error;
    }
  }
}
```

---

## Testing with Postman

### 1. Import Postman Collections

We've provided ready-to-use Postman collections:

```
📁 postman/
  ├── LocalPro-Client-API.postman_collection.json
  ├── LocalPro-Provider-API.postman_collection.json
  ├── LocalPro-Admin-API.postman_collection.json
  ├── LocalPro-Partner-API.postman_collection.json
  └── LocalPro-Environment.postman_environment.json
```

**Import Steps:**
1. Open Postman
2. Click **Import** button
3. Select all `.json` files from `postman/` folder
4. Collections will appear in left sidebar

### 2. Set Up Environment

1. Click **Environments** in Postman
2. Select **LocalPro Environment**
3. Set variables:
   - `base_url`: `http://localhost:4000/api`
   - `email`: Your test email
   - `password`: Your test password
   - `token`: (will be set automatically after login)

### 3. Run Your First Request

1. Expand **LocalPro Client API** collection
2. Open **Auth** folder
3. Click **Login** request
4. Click **Send**
5. Token will be saved automatically in environment

### 4. Run Collection Tests

```bash
# Install Newman (Postman CLI)
npm install -g newman

# Run collection
newman run postman/LocalPro-Client-API.postman_collection.json \
  -e postman/LocalPro-Environment.postman_environment.json \
  --reporters cli,json
```

---

## SDK Integration

### React Native Example

```javascript
// api/localPro.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocalProSDK {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.localpro.com/api',
      timeout: 30000
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Add token to requests
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.handleTokenExpired();
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email, password) {
    try {
      const response = await this.client.post('/auth/login', {
        email,
        password
      });
      
      await AsyncStorage.setItem('auth_token', response.data.token);
      await AsyncStorage.setItem('refresh_token', response.data.refreshToken);
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getServices(params) {
    try {
      const response = await this.client.get('/marketplace/services', {
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data.message,
        status: error.response.status,
        data: error.response.data
      };
    }
    return { message: error.message };
  }
}

export default new LocalProSDK();
```

**Usage in React Native:**

```javascript
// screens/ServicesScreen.js
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import LocalProSDK from '../api/localPro';

function ServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const response = await LocalProSDK.getServices({
        category: 'cleaning',
        page: 1,
        limit: 20
      });
      
      setServices(response.data.services);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <FlatList
        data={services}
        renderItem={({ item }) => (
          <Text>{item.title}</Text>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}
```

### Flutter Example

```dart
// lib/services/localpro_api.dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalProAPI {
  late Dio _dio;
  String baseUrl = 'https://api.localpro.com/api';

  LocalProAPI() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
    ));

    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Token expired, try refresh
            bool refreshed = await _refreshToken();
            if (refreshed) {
              return handler.resolve(await _retry(error.requestOptions));
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<Response> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      await _saveToken(response.data['token']);
      return response;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> getServices({
    String? category,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.get('/marketplace/services', queryParameters: {
        if (category != null) 'category': category,
        'page': page,
        'limit': limit,
      });
      return response;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(dynamic error) {
    if (error is DioError) {
      return Exception(error.response?.data['message'] ?? error.message);
    }
    return Exception(error.toString());
  }
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Valid email is required"
      }
    ]
  }
}
```

### Error Handling Best Practices

```javascript
async function handleAPICall() {
  try {
    const response = await api.client.get('/marketplace/services');
    return response.data;
    
  } catch (error) {
    // Network error
    if (!error.response) {
      console.error('Network error:', error.message);
      throw new Error('Network connection failed. Please check your internet.');
    }

    // API error
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        console.error('Validation error:', data.error.details);
        throw new Error('Please check your input data.');

      case 401:
        console.error('Unauthorized:', data.message);
        // Redirect to login
        window.location.href = '/login';
        break;

      case 403:
        console.error('Forbidden:', data.message);
        throw new Error('You do not have permission to perform this action.');

      case 404:
        console.error('Not found:', data.message);
        throw new Error('Requested resource not found.');

      case 429:
        console.error('Rate limit exceeded:', data.error.retryAfter);
        throw new Error(`Too many requests. Please wait ${data.error.retryAfter} seconds.`);

      case 500:
        console.error('Server error:', data.message);
        throw new Error('Server error. Please try again later.');

      default:
        console.error('Unknown error:', status, data);
        throw new Error('An unexpected error occurred.');
    }
  }
}
```

---

## Best Practices

### 1. Security

```javascript
// ✅ DO: Store tokens securely
// React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('auth_token', token);

// Web (use httpOnly cookies in production)
// Store in memory or use secure cookie
const secureStorage = new SecureLS({ encodingType: 'aes' });
secureStorage.set('auth_token', token);

// ❌ DON'T: Store in localStorage (web)
localStorage.setItem('auth_token', token); // Vulnerable to XSS
```

### 2. Rate Limiting

```javascript
// Implement exponential backoff
class APIClient {
  async retryWithBackoff(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (error.response?.status === 429) {
          const delay = Math.pow(2, i) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```

### 3. Request Caching

```javascript
// Simple cache implementation
class CachedAPI {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  async getCached(key, fetchFn) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    const data = await fetchFn();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  async getServices(params) {
    const cacheKey = `services:${JSON.stringify(params)}`;
    return this.getCached(cacheKey, () =>
      this.api.client.get('/marketplace/services', { params })
    );
  }
}
```

### 4. Pagination Handling

```javascript
async function getAllServices() {
  const allServices = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await api.client.get('/marketplace/services', {
      params: { page, limit: 50 }
    });

    const { services, pagination } = response.data.data;
    allServices.push(...services);

    hasMore = pagination.hasNext;
    page++;

    // Add delay to avoid rate limiting
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return allServices;
}
```

---

## Troubleshooting

### Common Issues

#### 1. 401 Unauthorized Error

**Problem:** Token expired or invalid

**Solution:**
```javascript
// Implement automatic token refresh
async function refreshToken() {
  const refreshToken = await getStoredRefreshToken();
  
  const response = await api.client.post('/auth/refresh', {
    refreshToken
  });
  
  await saveToken(response.data.token);
  await saveRefreshToken(response.data.refreshToken);
}
```

#### 2. CORS Error (Web)

**Problem:** Cross-Origin Resource Sharing blocked

**Solution:**
```javascript
// Make sure API allows your origin
// Contact API support to whitelist your domain

// For development, use proxy
// package.json (React)
{
  "proxy": "http://localhost:4000"
}

// Or use CORS proxy for development only
const API_URL = process.env.NODE_ENV === 'development'
  ? '/api' // proxied
  : 'https://api.localpro.com/api';
```

#### 3. Network Timeout

**Problem:** Request takes too long

**Solution:**
```javascript
// Increase timeout
const api = axios.create({
  baseURL: 'https://api.localpro.com/api',
  timeout: 60000 // 60 seconds for file uploads
});

// Or cancel long requests
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

api.get('/endpoint', {
  cancelToken: source.token
});

// Cancel after 30 seconds
setTimeout(() => {
  source.cancel('Request timeout');
}, 30000);
```

#### 4. Rate Limit Exceeded

**Problem:** Too many requests

**Solution:**
```javascript
// Implement request queue
class RequestQueue {
  constructor(maxPerMinute = 100) {
    this.queue = [];
    this.maxPerMinute = maxPerMinute;
    this.requestCount = 0;
    this.resetTime = Date.now() + 60000;
  }

  async add(fn) {
    if (Date.now() > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = Date.now() + 60000;
    }

    if (this.requestCount >= this.maxPerMinute) {
      await new Promise(resolve => 
        setTimeout(resolve, this.resetTime - Date.now())
      );
    }

    this.requestCount++;
    return fn();
  }
}
```

---

## Testing

### Unit Tests (Jest)

```javascript
// __tests__/api.test.js
const LocalProAPI = require('../api-client');

describe('LocalPro API', () => {
  let api;

  beforeAll(() => {
    api = new LocalProAPI('http://localhost:4000/api');
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const response = await api.login(
        'test@example.com',
        'TestPassword123'
      );

      expect(response.success).toBe(true);
      expect(response.token).toBeDefined();
      expect(response.user).toBeDefined();
    });

    it('should fail with invalid credentials', async () => {
      await expect(
        api.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow();
    });
  });

  describe('Services', () => {
    beforeAll(async () => {
      await api.login('test@example.com', 'TestPassword123');
    });

    it('should fetch services', async () => {
      const response = await api.client.get('/marketplace/services');
      
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data.services)).toBe(true);
    });
  });
});
```

---

## Next Steps

### 1. Explore Documentation
- 📱 [Client API Documentation](CLIENT_MOBILE_APP_DOCUMENTATION.md)
- 🛠️ [Provider API Documentation](PROVIDER_MOBILE_APP_DOCUMENTATION.md)
- ⚙️ [Admin API Documentation](ADMIN_DASHBOARD_DOCUMENTATION.md)
- 🏢 [Partner API Documentation](PARTNER_PORTAL_DOCUMENTATION.md)

### 2. Try Postman Collections
- Import collections from `postman/` folder
- Test all endpoints
- Customize for your use case

### 3. Join Community
- **Discord**: https://discord.gg/localpro
- **GitHub**: https://github.com/localpro/api
- **Forum**: https://forum.localpro.com

### 4. Get Support
- **Email**: developers@localpro.com
- **Docs**: https://docs.localpro.com
- **Status**: https://status.localpro.com

---

## Resources

### Code Examples
- **React Native App**: https://github.com/localpro/examples/react-native
- **Flutter App**: https://github.com/localpro/examples/flutter
- **Web App**: https://github.com/localpro/examples/web

### SDKs
- **JavaScript/TypeScript**: `npm install @localpro/sdk`
- **React Native**: `npm install @localpro/react-native-sdk`
- **Flutter**: Add to `pubspec.yaml`

### Tools
- **Postman Collections**: In `postman/` folder
- **OpenAPI Spec**: `openapi.yaml`
- **Webhook Tester**: https://webhook.localpro.com

---

## Changelog

### v1.0.0 (January 7, 2026)
- Initial Quick Start Guide
- Basic authentication flow
- Common use cases
- Error handling examples
- Postman collections

---

**Happy Coding! 🚀**

For questions or issues, contact: developers@localpro.com
