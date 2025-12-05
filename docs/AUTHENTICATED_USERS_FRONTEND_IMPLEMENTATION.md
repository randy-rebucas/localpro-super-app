# Authenticated Users Frontend Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [User Profile Management](#user-profile-management)
4. [Feature-Specific Endpoints](#feature-specific-endpoints)
5. [Data Models](#data-models)
6. [API Client Setup](#api-client-setup)
7. [Implementation Examples](#implementation-examples)
8. [State Management](#state-management)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)
11. [Security Considerations](#security-considerations)

---

## Overview

This document provides comprehensive guidance for implementing frontend features for authenticated users in the LocalPro Super App. It covers authentication, profile management, and all user-facing features that require authentication.

### Key Features for Authenticated Users

- **Authentication**: SMS-based phone verification, JWT token management
- **Profile Management**: Complete profile setup, avatar upload, portfolio management
- **Marketplace**: Service discovery, booking management, reviews
- **Jobs**: Job applications, job postings (for providers)
- **Finance**: Wallet management, transactions, withdrawals, top-ups
- **Communication**: Messaging, notifications
- **Academy**: Course enrollment, progress tracking
- **Supplies**: Product ordering, order management
- **Provider Features**: Service creation, provider dashboard, analytics
- **Trust & Verification**: Identity verification, trust score tracking

### Base API URL

```
Production: https://api.localpro.com
Development: http://localhost:4000
```

### Authentication Method

All authenticated endpoints require:
- **JWT Token** in Authorization header: `Bearer <token>`
- Token is obtained after SMS verification via `/api/auth/verify-code`

---

## Authentication Flow

### 1. Send Verification Code

**Endpoint**: `POST /api/auth/send-code`

**Request**:
```javascript
{
  phoneNumber: "+1234567890" // International format required
}
```

**Response**:
```javascript
{
  success: true,
  message: "Verification code sent successfully",
  isNewUser: false // true if user doesn't exist yet
}
```

**Implementation**:
```javascript
const sendVerificationCode = async (phoneNumber) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phoneNumber })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, isNewUser: data.isNewUser };
    } else {
      throw new Error(data.message || 'Failed to send verification code');
    }
  } catch (error) {
    console.error('Send verification code error:', error);
    throw error;
  }
};
```

### 2. Verify Code and Login/Register

**Endpoint**: `POST /api/auth/verify-code`

**Request**:
```javascript
{
  phoneNumber: "+1234567890",
  code: "123456", // 6-digit verification code
  firstName: "John", // Optional for new users
  lastName: "Doe",   // Optional for new users
  email: "john@example.com" // Optional for new users
}
```

**Response**:
```javascript
{
  success: true,
  message: "Login successful" | "User registered and logged in successfully",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    id: "user_id",
    phoneNumber: "+1234567890",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    roles: ["client"],
    isVerified: true,
    subscription: null,
    trustScore: 50,
    profile: {
      avatar: null,
      bio: null
    }
  },
  isNewUser: false
}
```

**Implementation**:
```javascript
const verifyCode = async (phoneNumber, code, optionalData = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber,
        code,
        ...optionalData
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token securely
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return {
        success: true,
        token: data.token,
        user: data.user,
        isNewUser: data.isNewUser
      };
    } else {
      throw new Error(data.message || 'Invalid verification code');
    }
  } catch (error) {
    console.error('Verify code error:', error);
    throw error;
  }
};
```

### 3. Complete Onboarding (If New User)

**Endpoint**: `POST /api/auth/complete-onboarding`

**Request**:
```javascript
{
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com", // Optional
  roles: ["client"], // Optional, defaults to ["client"]
  profile: {
    bio: "Professional service provider",
    address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
      coordinates: {
        lat: 40.7128,
        lng: -74.0060
      }
    }
  },
  gender: "male", // Optional: "male", "female", "other", "prefer_not_to_say"
  birthdate: "1990-01-01" // Optional, ISO date string
}
```

**Response**:
```javascript
{
  success: true,
  message: "Onboarding completed successfully",
  token: "new_jwt_token", // Updated token with new user info
  user: {
    // Complete user object
  },
  redirect: {
    destination: "dashboard",
    reason: "User onboarding completed successfully"
  }
}
```

### 4. Check Profile Completion Status

**Endpoint**: `GET /api/auth/profile-completion-status`

**Response**:
```javascript
{
  success: true,
  data: {
    isProfileComplete: true,
    needsOnboarding: false,
    user: {
      id: "user_id",
      phoneNumber: "+1234567890",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      roles: ["client"],
      isVerified: true
    }
  }
}
```

### 5. Get Profile Completeness

**Endpoint**: `GET /api/auth/profile-completeness`

**Response**:
```javascript
{
  success: true,
  data: {
    completeness: {
      basic: {
        completed: true,
        missing: [],
        percentage: 100
      },
      profile: {
        completed: false,
        missing: ["profile.bio", "profile.address.city"],
        percentage: 33
      },
      verification: {
        completed: false,
        missing: ["verification.emailVerified"],
        percentage: 50
      },
      overall: {
        completed: false,
        percentage: 61,
        missingFields: ["profile.bio", "profile.address.city", "verification.emailVerified"],
        nextSteps: [
          {
            priority: "medium",
            action: "complete_profile",
            title: "Complete Your Profile",
            description: "Add bio and location information",
            fields: ["profile.bio", "profile.address.city"]
          }
        ]
      }
    },
    canAccessDashboard: true,
    needsOnboarding: false,
    user: {
      // User object with trustScore
    }
  }
}
```

### 6. Logout

**Endpoint**: `POST /api/auth/logout`

**Implementation**:
```javascript
const logout = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    return { success: true };
  } catch (error) {
    // Even if API call fails, clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    throw error;
  }
};
```

---

## User Profile Management

### Get Current User

**Endpoint**: `GET /api/auth/me`

**Response**:
```javascript
{
  success: true,
  user: {
    _id: "user_id",
    phoneNumber: "+1234567890",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    roles: ["client"],
    isVerified: true,
    isActive: true,
    profile: {
      avatar: {
        url: "https://res.cloudinary.com/...",
        publicId: "avatar_123",
        thumbnail: "https://res.cloudinary.com/..."
      },
      bio: "Professional service provider",
      address: {
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        }
      }
    },
    verification: {
      phoneVerified: true,
      emailVerified: false,
      identityVerified: false
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Profile

**Endpoint**: `PUT /api/auth/profile`

**Request**:
```javascript
{
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  profile: {
    bio: "Updated bio",
    address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
      coordinates: {
        lat: 40.7128,
        lng: -74.0060
      }
    }
  }
}
```

**Note**: All fields are optional. Only include fields you want to update.

### Upload Avatar

**Endpoint**: `POST /api/auth/upload-avatar`

**Request**: `multipart/form-data`
- Field name: `avatar`
- File type: `image/jpeg` or `image/png`
- Max size: 2MB

**Response**:
```javascript
{
  success: true,
  message: "Avatar uploaded successfully",
  data: {
    avatar: {
      url: "https://res.cloudinary.com/...",
      publicId: "avatar_123",
      thumbnail: "https://res.cloudinary.com/..."
    }
  }
}
```

**Implementation**:
```javascript
const uploadAvatar = async (file) => {
  try {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/upload-avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type header, browser will set it with boundary
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.avatar;
    } else {
      throw new Error(data.message || 'Failed to upload avatar');
    }
  } catch (error) {
    console.error('Upload avatar error:', error);
    throw error;
  }
};
```

### Upload Portfolio Images

**Endpoint**: `POST /api/auth/upload-portfolio`

**Request**: `multipart/form-data`
- Field name: `images` (array, max 5 files)
- File types: `image/jpeg`, `image/png`, `image/gif`
- Max size per file: 5MB
- Additional fields:
  - `title`: string (required)
  - `description`: string (required)
  - `category`: string (required)

**Response**:
```javascript
{
  success: true,
  message: "Portfolio images uploaded successfully",
  data: {
    title: "Project Title",
    description: "Project description",
    category: "plumbing",
    images: [
      {
        url: "https://res.cloudinary.com/...",
        publicId: "portfolio_123",
        thumbnail: "https://res.cloudinary.com/..."
      }
    ],
    completedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Feature-Specific Endpoints

### Marketplace

#### Get My Services (Provider)

**Endpoint**: `GET /api/marketplace/my-services`

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `status`: string (optional: "active", "pending", "inactive")

**Response**:
```javascript
{
  success: true,
  count: 10,
  total: 10,
  page: 1,
  pages: 1,
  data: [
    {
      _id: "service_id",
      title: "Plumbing Service",
      description: "Professional plumbing services",
      category: "plumbing",
      price: 100,
      status: "active",
      // ... other service fields
    }
  ]
}
```

#### Get My Bookings

**Endpoint**: `GET /api/marketplace/my-bookings`

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `status`: string (optional: "pending", "confirmed", "in_progress", "completed", "cancelled")
- `role`: string (optional: "client" or "provider")

**Response**:
```javascript
{
  success: true,
  count: 5,
  total: 5,
  page: 1,
  pages: 1,
  data: [
    {
      _id: "booking_id",
      service: {
        _id: "service_id",
        title: "Plumbing Service"
      },
      provider: {
        _id: "provider_id",
        firstName: "John",
        lastName: "Doe"
      },
      client: {
        _id: "client_id",
        firstName: "Jane",
        lastName: "Smith"
      },
      status: "confirmed",
      scheduledDate: "2024-01-15T10:00:00.000Z",
      totalAmount: 100,
      // ... other booking fields
    }
  ]
}
```

#### Create Booking

**Endpoint**: `POST /api/marketplace/bookings`

**Request**:
```javascript
{
  serviceId: "service_id",
  providerId: "provider_id",
  scheduledDate: "2024-01-15T10:00:00.000Z",
  address: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    coordinates: {
      lat: 40.7128,
      lng: -74.0060
    }
  },
  notes: "Please arrive on time",
  paymentMethod: "wallet" // "wallet", "paypal", "paymaya"
}
```

### Jobs

#### Get My Applications

**Endpoint**: `GET /api/jobs/my-applications`

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `status`: string (optional: "pending", "reviewed", "shortlisted", "rejected", "accepted")

**Response**:
```javascript
{
  success: true,
  count: 3,
  total: 3,
  page: 1,
  pages: 1,
  data: [
    {
      _id: "application_id",
      job: {
        _id: "job_id",
        title: "Plumber Needed",
        company: "ABC Company"
      },
      status: "pending",
      appliedAt: "2024-01-01T00:00:00.000Z",
      // ... other application fields
    }
  ]
}
```

#### Apply for Job

**Endpoint**: `POST /api/jobs/:id/apply`

**Request**:
```javascript
{
  coverLetter: "I am interested in this position...",
  resume: "resume_url_or_id", // Optional
  availability: "immediate", // "immediate", "1_week", "2_weeks", "1_month"
  expectedSalary: 50000, // Optional
  questions: [
    {
      questionId: "question_id",
      answer: "Answer text"
    }
  ]
}
```

### Finance

#### Get Finance Overview

**Endpoint**: `GET /api/finance/overview`

**Response**:
```javascript
{
  success: true,
  data: {
    wallet: {
      balance: 1000.50,
      pendingBalance: 50.00,
      currency: "USD"
    },
    recentTransactions: [
      {
        _id: "transaction_id",
        type: "credit",
        amount: 100,
        description: "Service payment",
        status: "completed",
        createdAt: "2024-01-01T00:00:00.000Z"
      }
    ],
    earnings: {
      total: 5000,
      thisMonth: 500,
      lastMonth: 450
    },
    expenses: {
      total: 200,
      thisMonth: 50,
      lastMonth: 40
    }
  }
}
```

#### Get Transactions

**Endpoint**: `GET /api/finance/transactions`

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `type`: string (optional: "credit", "debit")
- `status`: string (optional: "pending", "completed", "failed")
- `startDate`: string (ISO date)
- `endDate`: string (ISO date)

#### Request Withdrawal

**Endpoint**: `POST /api/finance/withdraw`

**Request**:
```javascript
{
  amount: 500,
  paymentMethod: "bank_transfer", // "bank_transfer", "paypal", "paymaya"
  accountDetails: {
    bankName: "Bank Name",
    accountNumber: "1234567890",
    accountName: "John Doe"
  }
}
```

#### Request Top-Up

**Endpoint**: `POST /api/finance/top-up`

**Request**: `multipart/form-data`
- `amount`: number (required)
- `paymentMethod`: string (required: "bank_transfer", "paypal", "paymaya")
- `receipt`: file (required for bank_transfer)
- `reference`: string (optional)
- `notes`: string (optional)

### Communication

#### Get Conversations

**Endpoint**: `GET /api/communication/conversations`

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `unreadOnly`: boolean (default: false)

**Response**:
```javascript
{
  success: true,
  count: 5,
  total: 5,
  page: 1,
  pages: 1,
  data: [
    {
      _id: "conversation_id",
      participants: [
        {
          _id: "user_id",
          firstName: "John",
          lastName: "Doe",
          profile: {
            avatar: { url: "..." }
          }
        }
      ],
      lastMessage: {
        content: "Hello",
        sender: "user_id",
        createdAt: "2024-01-01T00:00:00.000Z"
      },
      unreadCount: 2,
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Send Message

**Endpoint**: `POST /api/communication/conversations/:id/messages`

**Request**:
```javascript
{
  content: "Hello, how are you?",
  type: "text" // "text", "image", "file"
}
```

#### Get Notifications

**Endpoint**: `GET /api/communication/notifications`

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `unreadOnly`: boolean (default: false)
- `type`: string (optional: "booking", "message", "job", "system")

### Academy

#### Enroll in Course

**Endpoint**: `POST /api/academy/courses/:id/enroll`

**Response**:
```javascript
{
  success: true,
  message: "Successfully enrolled in course",
  data: {
    enrollment: {
      _id: "enrollment_id",
      course: "course_id",
      user: "user_id",
      progress: 0,
      status: "active",
      enrolledAt: "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Get My Courses

**Endpoint**: `GET /api/academy/my-courses`

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `status`: string (optional: "active", "completed", "dropped")

#### Update Course Progress

**Endpoint**: `PUT /api/academy/courses/:id/progress`

**Request**:
```javascript
{
  videoId: "video_id",
  completed: true,
  progress: 50 // percentage
}
```

### Providers

#### Get My Provider Profile

**Endpoint**: `GET /api/providers/profile/me`

**Response**:
```javascript
{
  success: true,
  data: {
    _id: "provider_id",
    userId: "user_id",
    providerType: "individual", // "individual", "business", "agency"
    status: "active", // "pending", "active", "suspended", "rejected"
    professionalInfo: {
      specialties: [
        {
          category: "plumbing",
          subcategories: ["pipe_repair", "installation"],
          experience: 5,
          hourlyRate: 50,
          serviceAreas: [
            {
              city: "New York",
              state: "NY",
              radius: 25
            }
          ]
        }
      ],
      languages: ["en", "es"],
      availability: {
        monday: { start: "09:00", end: "17:00", available: true },
        // ... other days
      }
    },
    verification: {
      identityVerified: true,
      businessVerified: false,
      backgroundCheckVerified: true,
      insuranceVerified: true
    },
    performance: {
      rating: 4.5,
      totalReviews: 50,
      completionRate: 95,
      responseTime: 2, // hours
      totalEarnings: 10000
    },
    onboarding: {
      currentStep: "review",
      completedSteps: ["profile_setup", "business_info", "professional_info"],
      progress: 75
    }
  }
}
```

#### Create Provider Profile

**Endpoint**: `POST /api/providers/profile`

**Request**:
```javascript
{
  providerType: "individual", // "individual", "business", "agency"
  businessInfo: {
    businessName: "John's Plumbing",
    businessType: "sole_proprietorship",
    taxId: "123456789"
  },
  professionalInfo: {
    specialties: [
      {
        category: "plumbing",
        subcategories: ["pipe_repair"],
        experience: 5,
        hourlyRate: 50,
        serviceAreas: [
          {
            city: "New York",
            state: "NY",
            radius: 25
          }
        ]
      }
    ],
    languages: ["en"],
    availability: {
      monday: { start: "09:00", end: "17:00", available: true }
    }
  }
}
```

#### Get Provider Dashboard

**Endpoint**: `GET /api/providers/dashboard/overview`

**Response**:
```javascript
{
  success: true,
  data: {
    profile: {
      status: "active",
      completionPercentage: 85
    },
    earnings: {
      total: 10000,
      thisMonth: 1000,
      pending: 200
    },
    recentActivity: [
      {
        type: "booking",
        description: "New booking received",
        createdAt: "2024-01-01T00:00:00.000Z"
      }
    ],
    notifications: {
      unread: 5,
      total: 20
    },
    performance: {
      rating: 4.5,
      totalReviews: 50,
      completionRate: 95,
      responseTime: 2
    }
  }
}
```

---

## Data Models

### User Model

```typescript
interface User {
  _id: string;
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  birthdate?: Date;
  roles: string[]; // ['client', 'provider', 'supplier', 'instructor', etc.]
  isVerified: boolean;
  isActive: boolean;
  profile: {
    avatar?: {
      url: string;
      publicId: string;
      thumbnail: string;
    };
    bio?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    portfolio?: Array<{
      title: string;
      description: string;
      category: string;
      images: Array<{
        url: string;
        publicId: string;
        thumbnail: string;
      }>;
      completedAt: Date;
    }>;
  };
  verification: {
    phoneVerified: boolean;
    emailVerified: boolean;
    identityVerified: boolean;
    businessVerified?: boolean;
    addressVerified?: boolean;
    bankAccountVerified?: boolean;
  };
  localProPlusSubscription?: string; // Subscription ID
  trustScore?: number;
  createdAt: string;
  updatedAt: string;
}
```

### Booking Model

```typescript
interface Booking {
  _id: string;
  service: {
    _id: string;
    title: string;
    category: string;
    price: number;
  };
  provider: {
    _id: string;
    firstName: string;
    lastName: string;
    profile: {
      avatar?: { url: string };
    };
  };
  client: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  totalAmount: number;
  paymentMethod: 'wallet' | 'paypal' | 'paymaya';
  paymentStatus: 'pending' | 'completed' | 'failed';
  notes?: string;
  review?: {
    rating: number;
    comment: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Transaction Model

```typescript
interface Transaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  category: 'booking' | 'withdrawal' | 'top_up' | 'refund' | 'commission';
  reference?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## API Client Setup

### Axios Configuration

```javascript
// apiClient.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Service Examples

```javascript
// services/authService.js
import apiClient from '../apiClient';

export const authService = {
  sendVerificationCode: async (phoneNumber) => {
    const response = await apiClient.post('/api/auth/send-code', { phoneNumber });
    return response.data;
  },

  verifyCode: async (phoneNumber, code, optionalData = {}) => {
    const response = await apiClient.post('/api/auth/verify-code', {
      phoneNumber,
      code,
      ...optionalData
    });
    return response.data;
  },

  completeOnboarding: async (data) => {
    const response = await apiClient.post('/api/auth/complete-onboarding', data);
    return response.data;
  },

  getProfileCompleteness: async () => {
    const response = await apiClient.get('/api/auth/profile-completeness');
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.put('/api/auth/profile', data);
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post('/api/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  }
};
```

```javascript
// services/marketplaceService.js
import apiClient from '../apiClient';

export const marketplaceService = {
  getMyServices: async (params = {}) => {
    const response = await apiClient.get('/api/marketplace/my-services', { params });
    return response.data;
  },

  getMyBookings: async (params = {}) => {
    const response = await apiClient.get('/api/marketplace/my-bookings', { params });
    return response.data;
  },

  createBooking: async (data) => {
    const response = await apiClient.post('/api/marketplace/bookings', data);
    return response.data;
  },

  updateBookingStatus: async (bookingId, status) => {
    const response = await apiClient.put(`/api/marketplace/bookings/${bookingId}/status`, { status });
    return response.data;
  }
};
```

---

## Implementation Examples

### React: Authentication Flow

```jsx
// components/LoginForm.jsx
import React, { useState } from 'react';
import { authService } from '../services/authService';

const LoginForm = ({ onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'code'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.sendVerificationCode(phoneNumber);
      setStep('code');
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await authService.verifyCode(phoneNumber, code);
      
      if (result.isNewUser) {
        // Redirect to onboarding
        window.location.href = '/onboarding';
      } else {
        // User exists, check if onboarding is complete
        const completeness = await authService.getProfileCompleteness();
        
        if (completeness.data.needsOnboarding) {
          window.location.href = '/onboarding';
        } else {
          onLoginSuccess(result.user);
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendCode}>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1234567890"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Code'}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyCode}>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter 6-digit code"
        maxLength={6}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Code'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};

export default LoginForm;
```

### React: Profile Management

```jsx
// components/ProfileForm.jsx
import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';

const ProfileForm = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profile: {
      bio: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authService.getMe();
      setUser(response.user);
      setFormData({
        firstName: response.user.firstName || '',
        lastName: response.user.lastName || '',
        email: response.user.email || '',
        profile: {
          bio: response.user.profile?.bio || '',
          address: {
            street: response.user.profile?.address?.street || '',
            city: response.user.profile?.address?.city || '',
            state: response.user.profile?.address?.state || '',
            zipCode: response.user.profile?.address?.zipCode || '',
            country: response.user.profile?.address?.country || ''
          }
        }
      });
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await authService.updateProfile(formData);
      setUser(response.user);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await authService.uploadAvatar(file);
      setUser({ ...user, profile: { ...user.profile, avatar: response.data.avatar } });
      alert('Avatar uploaded successfully');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Avatar</label>
        {user.profile?.avatar && (
          <img src={user.profile.avatar.thumbnail} alt="Avatar" />
        )}
        <input type="file" accept="image/*" onChange={handleAvatarUpload} />
      </div>

      <div>
        <label>First Name</label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        />
      </div>

      <div>
        <label>Last Name</label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        />
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div>
        <label>Bio</label>
        <textarea
          value={formData.profile.bio}
          onChange={(e) => setFormData({
            ...formData,
            profile: { ...formData.profile, bio: e.target.value }
          })}
        />
      </div>

      <div>
        <label>Street</label>
        <input
          type="text"
          value={formData.profile.address.street}
          onChange={(e) => setFormData({
            ...formData,
            profile: {
              ...formData.profile,
              address: { ...formData.profile.address, street: e.target.value }
            }
          })}
        />
      </div>

      <div>
        <label>City</label>
        <input
          type="text"
          value={formData.profile.address.city}
          onChange={(e) => setFormData({
            ...formData,
            profile: {
              ...formData.profile,
              address: { ...formData.profile.address, city: e.target.value }
            }
          })}
        />
      </div>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
};

export default ProfileForm;
```

### React: Protected Route

```jsx
// components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await authService.getMe();
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
```

---

## State Management

### React Context Example

```javascript
// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authService.getMe();
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (phoneNumber, code, optionalData = {}) => {
    try {
      const result = await authService.verifyCode(phoneNumber, code, optionalData);
      setUser(result.user);
      setIsAuthenticated(true);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

---

## Error Handling

### Error Codes

```javascript
const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_PHONE_FORMAT: 'INVALID_PHONE_FORMAT',
  INVALID_VERIFICATION_CODE: 'INVALID_VERIFICATION_CODE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS'
};
```

### Error Handler Utility

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          message: data.message || 'Invalid request',
          code: data.code || 'VALIDATION_ERROR',
          type: 'error'
        };
      case 401:
        // Token expired or invalid
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        return {
          message: 'Session expired. Please login again.',
          code: 'UNAUTHORIZED',
          type: 'error',
          redirect: '/login'
        };
      case 403:
        return {
          message: 'You do not have permission to perform this action',
          code: 'FORBIDDEN',
          type: 'error'
        };
      case 404:
        return {
          message: 'Resource not found',
          code: 'NOT_FOUND',
          type: 'error'
        };
      case 429:
        return {
          message: data.message || 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          type: 'error',
          retryAfter: data.retryAfter
        };
      case 500:
        return {
          message: 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
          type: 'error'
        };
      default:
        return {
          message: data.message || 'An error occurred',
          code: data.code || 'UNKNOWN_ERROR',
          type: 'error'
        };
    }
  } else if (error.request) {
    // Request made but no response
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      type: 'error'
    };
  } else {
    // Error setting up request
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      type: 'error'
    };
  }
};
```

---

## Best Practices

### 1. Token Management

- Store tokens securely (consider using httpOnly cookies in production)
- Implement token refresh mechanism if available
- Clear tokens on logout
- Handle token expiration gracefully

### 2. Loading States

Always show loading indicators for async operations:

```javascript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await performAction();
  } finally {
    setLoading(false);
  }
};
```

### 3. Optimistic Updates

Update UI immediately, rollback on error:

```javascript
const handleStatusUpdate = async (bookingId, newStatus) => {
  // Optimistic update
  const previousStatus = bookings.find(b => b.id === bookingId)?.status;
  setBookings(bookings.map(b => 
    b.id === bookingId ? { ...b, status: newStatus } : b
  ));

  try {
    await bookingService.updateStatus(bookingId, newStatus);
  } catch (error) {
    // Rollback on error
    setBookings(bookings.map(b => 
      b.id === bookingId ? { ...b, status: previousStatus } : b
    ));
    showError('Failed to update status');
  }
};
```

### 4. Form Validation

Validate inputs before submission:

```javascript
const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### 5. Debouncing Search

Use debouncing for search inputs:

```javascript
import { useDebounce } from 'use-debounce';

const [searchTerm, setSearchTerm] = useState('');
const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearchTerm) {
    performSearch(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);
```

### 6. Pagination

Implement efficient pagination:

```javascript
const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
});

const handlePageChange = (newPage) => {
  setPagination({ ...pagination, page: newPage });
  fetchData({ ...filters, page: newPage });
};
```

---

## Security Considerations

1. **Token Storage**: 
   - Use secure storage (httpOnly cookies in production)
   - Never expose tokens in URLs or logs
   - Clear tokens on logout

2. **HTTPS**: Always use HTTPS in production

3. **Input Validation**: 
   - Validate all user inputs on frontend
   - Sanitize user-generated content
   - Use proper input types and constraints

4. **XSS Protection**: 
   - Sanitize HTML content before rendering
   - Use React's built-in XSS protection
   - Avoid `dangerouslySetInnerHTML` when possible

5. **CSRF Protection**: 
   - Implement CSRF tokens if required by backend
   - Use same-site cookies

6. **Rate Limiting**: 
   - Respect API rate limits
   - Implement client-side throttling for user actions

7. **Error Messages**: 
   - Don't expose sensitive information in error messages
   - Show user-friendly messages

8. **File Uploads**: 
   - Validate file types and sizes on frontend
   - Show progress indicators
   - Handle upload errors gracefully

---

## Testing Recommendations

1. **Unit Tests**: Test individual components and services
2. **Integration Tests**: Test API integration
3. **E2E Tests**: Test complete user flows
4. **Error Scenarios**: Test error handling
5. **Loading States**: Test loading and empty states
6. **Authentication**: Test login/logout flows
7. **Form Validation**: Test form inputs and validation

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] API base URL set correctly
- [ ] Authentication flow tested
- [ ] Token storage implemented securely
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Responsive design verified
- [ ] Browser compatibility tested
- [ ] Performance optimized
- [ ] Security measures in place
- [ ] Analytics tracking configured (if needed)

---

## Support & Resources

- **API Documentation**: See `/docs` folder for detailed API docs
- **Postman Collection**: Available at `/LocalPro-Super-App-API.postman_collection.json`
- **Health Check**: `GET /health` for API status
- **Support Email**: api-support@localpro.com

---

**Last Updated**: January 2025  
**Version**: 1.0.0

