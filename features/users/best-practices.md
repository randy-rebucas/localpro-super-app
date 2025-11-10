# Users Best Practices

## Overview

This document outlines best practices for implementing and using the Users feature in the LocalPro Super App. These guidelines ensure optimal performance, security, and maintainability when working with user data and authentication.

## Security Best Practices

### Authentication & Authorization

#### JWT Token Management
```javascript
// ✅ Good: Secure token storage
const storeToken = async (token) => {
  try {
    // Use secure storage for mobile apps
    await SecureStore.setItemAsync('authToken', token);
    
    // For web, use httpOnly cookies when possible
    document.cookie = `authToken=${token}; HttpOnly; Secure; SameSite=Strict`;
  } catch (error) {
    console.error('Token storage error:', error);
  }
};

// ❌ Bad: Storing tokens in localStorage (web) or AsyncStorage (mobile)
localStorage.setItem('authToken', token); // Vulnerable to XSS
```

#### Token Validation
```javascript
// ✅ Good: Validate token on every request
const validateToken = async (token) => {
  try {
    const response = await fetch('/api/auth/validate-token', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// ✅ Good: Implement token refresh
const refreshToken = async (refreshToken) => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      await storeToken(data.token);
      return data.token;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
  return null;
};
```

#### Role-Based Access Control
```javascript
// ✅ Good: Implement proper role checking
const checkPermission = (user, requiredRole, resource = null) => {
  // Admin has access to everything
  if (user.role === 'admin') return true;
  
  // Agency users can only access their agency resources
  if (['agency_owner', 'agency_admin'].includes(user.role)) {
    if (resource && resource.agencyId !== user.agency.agencyId) {
      return false;
    }
  }
  
  // Check role hierarchy
  const roleHierarchy = {
    'admin': 7,
    'agency_owner': 6,
    'agency_admin': 5,
    'provider': 4,
    'instructor': 3,
    'supplier': 2,
    'client': 1
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
};

// Usage
if (!checkPermission(user, 'agency_admin', agency)) {
  return res.status(403).json({ message: 'Access denied' });
}
```

### Data Protection

#### Sensitive Data Handling
```javascript
// ✅ Good: Sanitize user data before sending to client
const sanitizeUserData = (user) => {
  const sanitized = { ...user };
  
  // Remove sensitive fields
  delete sanitized.verificationCode;
  delete sanitized.lastLoginIP;
  delete sanitized.notes;
  delete sanitized.tags;
  
  // Mask sensitive information
  if (sanitized.phoneNumber) {
    sanitized.phoneNumber = sanitized.phoneNumber.replace(/(\+\d{1,3})\d{4,}/, '$1****');
  }
  
  return sanitized;
};

// ✅ Good: Use field selection in queries
const getPublicUserProfile = async (userId) => {
  return await User.findById(userId)
    .select('firstName lastName profile.avatar profile.bio profile.rating profile.businessName')
    .lean();
};
```

#### Input Validation
```javascript
// ✅ Good: Comprehensive input validation
const validateUserInput = (data) => {
  const errors = [];
  
  // Phone number validation
  if (data.phoneNumber && !/^\+[1-9]\d{1,14}$/.test(data.phoneNumber)) {
    errors.push('Invalid phone number format');
  }
  
  // Email validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  // Business name validation for business users
  if (data.role && ['provider', 'supplier', 'instructor'].includes(data.role)) {
    if (!data.profile?.businessName) {
      errors.push('Business name is required for this role');
    }
  }
  
  return errors;
};
```

## Performance Best Practices

### Database Optimization

#### Efficient Queries
```javascript
// ✅ Good: Use specific field selection
const getUsersList = async (filters) => {
  return await User.find(filters)
    .select('firstName lastName email role isActive trustScore profile.rating')
    .populate('agency.agencyId', 'name type')
    .lean() // Use lean() for read-only operations
    .limit(20);
};

// ❌ Bad: Selecting all fields
const getUsersList = async (filters) => {
  return await User.find(filters)
    .populate('agency.agencyId')
    .limit(20);
};
```

#### Proper Indexing
```javascript
// ✅ Good: Create compound indexes for common queries
userSchema.index({ role: 1, isActive: 1, status: 1 });
userSchema.index({ 'profile.address.city': 1, 'profile.address.state': 1, role: 1 });
userSchema.index({ 'profile.rating': -1, 'profile.totalReviews': -1, isActive: 1 });

// ✅ Good: Use text search index for search functionality
userSchema.index({
  firstName: 'text',
  lastName: 'text',
  'profile.businessName': 'text',
  'profile.skills': 'text'
});
```

#### Pagination
```javascript
// ✅ Good: Implement efficient pagination
const getUsersPaginated = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    User.find(filters)
      .select('firstName lastName email role isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filters)
  ]);
  
  return {
    users,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    }
  };
};
```

### Caching Strategy

#### Redis Caching
```javascript
// ✅ Good: Implement Redis caching for user data
const getUserWithCache = async (userId) => {
  const cacheKey = `user:${userId}`;
  
  // Try to get from cache first
  let user = await redis.get(cacheKey);
  
  if (user) {
    return JSON.parse(user);
  }
  
  // If not in cache, get from database
  user = await User.findById(userId).lean();
  
  if (user) {
    // Cache for 15 minutes
    await redis.setex(cacheKey, 900, JSON.stringify(user));
  }
  
  return user;
};

// ✅ Good: Invalidate cache on updates
const updateUser = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
  
  // Invalidate cache
  await redis.del(`user:${userId}`);
  
  return user;
};
```

#### Client-Side Caching
```javascript
// ✅ Good: Use React Query for client-side caching
const useUser = (userId) => {
  return useQuery(
    ['user', userId],
    () => fetchUser(userId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: 1000
    }
  );
};
```

## Error Handling Best Practices

### API Error Responses
```javascript
// ✅ Good: Consistent error response format
const handleError = (error, res) => {
  console.error('API Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      field: Object.keys(error.keyPattern)[0]
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};
```

### Client-Side Error Handling
```javascript
// ✅ Good: Comprehensive error handling in React
const useAuth = () => {
  const [error, setError] = useState(null);
  
  const handleApiCall = async (apiCall) => {
    try {
      setError(null);
      const result = await apiCall();
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    }
  };
  
  const sendVerificationCode = (phoneNumber) => {
    return handleApiCall(() => 
      fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
    );
  };
  
  return { sendVerificationCode, error, setError };
};
```

## Data Validation Best Practices

### Server-Side Validation
```javascript
// ✅ Good: Use express-validator for request validation
const { body, validationResult } = require('express-validator');

const validateUserCreation = [
  body('phoneNumber')
    .isMobilePhone('any')
    .withMessage('Invalid phone number format'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('role')
    .isIn(['client', 'provider', 'admin', 'supplier', 'instructor', 'agency_owner', 'agency_admin'])
    .withMessage('Invalid user role'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];
```

### Client-Side Validation
```javascript
// ✅ Good: Real-time validation in React
const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validate = (field, value) => {
    const rule = validationRules[field];
    if (!rule) return '';
    
    if (rule.required && !value) {
      return `${field} is required`;
    }
    
    if (rule.minLength && value.length < rule.minLength) {
      return `${field} must be at least ${rule.minLength} characters`;
    }
    
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || `Invalid ${field} format`;
    }
    
    return '';
  };
  
  const handleChange = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validate(field, value) }));
    }
  };
  
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validate(field, values[field]) }));
  };
  
  return { values, errors, touched, handleChange, handleBlur };
};
```

## State Management Best Practices

### Redux/Context State Management
```javascript
// ✅ Good: Normalized state structure
const initialState = {
  users: {
    byId: {},
    allIds: [],
    loading: false,
    error: null,
    pagination: {
      current: 1,
      pages: 0,
      total: 0,
      limit: 10
    }
  },
  currentUser: {
    data: null,
    loading: false,
    error: null
  }
};

// ✅ Good: Action creators with proper error handling
const userActions = {
  fetchUsers: (filters) => async (dispatch) => {
    dispatch({ type: 'FETCH_USERS_START' });
    
    try {
      const response = await fetch(`/api/users?${new URLSearchParams(filters)}`);
      const data = await response.json();
      
      if (data.success) {
        dispatch({
          type: 'FETCH_USERS_SUCCESS',
          payload: {
            users: data.data.users,
            pagination: data.data.pagination
          }
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      dispatch({
        type: 'FETCH_USERS_ERROR',
        payload: error.message
      });
    }
  }
};
```

## Testing Best Practices

### Unit Testing
```javascript
// ✅ Good: Comprehensive unit tests
describe('UserService', () => {
  let userService;
  let mockApiClient;
  
  beforeEach(() => {
    mockApiClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn()
    };
    userService = new UserService(mockApiClient);
  });
  
  describe('sendVerificationCode', () => {
    it('should send verification code successfully', async () => {
      const phoneNumber = '+1234567890';
      const mockResponse = {
        data: {
          success: true,
          message: 'Verification code sent successfully'
        }
      };
      
      mockApiClient.post.mockResolvedValue(mockResponse);
      
      const result = await userService.sendVerificationCode(phoneNumber);
      
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/send-code', {
        phoneNumber
      });
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should handle API errors', async () => {
      const phoneNumber = '+1234567890';
      const error = new Error('API Error');
      
      mockApiClient.post.mockRejectedValue(error);
      
      await expect(userService.sendVerificationCode(phoneNumber))
        .rejects.toThrow('API Error');
    });
  });
});
```

### Integration Testing
```javascript
// ✅ Good: Integration tests with test database
describe('User API Integration', () => {
  let app;
  let testUser;
  
  beforeAll(async () => {
    app = require('../app');
    await connectTestDB();
  });
  
  afterAll(async () => {
    await disconnectTestDB();
  });
  
  beforeEach(async () => {
    testUser = await User.create({
      phoneNumber: '+1234567890',
      firstName: 'Test',
      lastName: 'User',
      role: 'client'
    });
  });
  
  afterEach(async () => {
    await User.deleteMany({});
  });
  
  describe('POST /api/auth/send-code', () => {
    it('should send verification code for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({ phoneNumber: '+1234567890' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.phoneNumber).toBe('+1234567890');
    });
  });
});
```

## Monitoring and Logging Best Practices

### Structured Logging
```javascript
// ✅ Good: Structured logging with context
const logger = require('winston');

const logUserAction = (action, userId, details = {}) => {
  logger.info('User action', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Usage
const updateUserProfile = async (userId, profileData) => {
  try {
    const user = await User.findByIdAndUpdate(userId, profileData, { new: true });
    
    logUserAction('profile_update', userId, {
      fields: Object.keys(profileData),
      success: true
    });
    
    return user;
  } catch (error) {
    logUserAction('profile_update', userId, {
      error: error.message,
      success: false
    });
    throw error;
  }
};
```

### Performance Monitoring
```javascript
// ✅ Good: Performance monitoring for user operations
const monitorUserOperation = (operationName) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        
        const duration = Date.now() - startTime;
        logger.info('User operation completed', {
          operation: operationName,
          duration,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('User operation failed', {
          operation: operationName,
          duration,
          error: error.message,
          success: false
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
};

// Usage
class UserController {
  @monitorUserOperation('getUserById')
  async getUserById(req, res) {
    // Implementation
  }
}
```

## Mobile App Best Practices

### Offline Support
```javascript
// ✅ Good: Implement offline support for user data
const useOfflineUser = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState(null);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const syncOfflineData = async () => {
    if (isOnline && offlineData) {
      try {
        await syncUserData(offlineData);
        setOfflineData(null);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  };
  
  useEffect(() => {
    syncOfflineData();
  }, [isOnline]);
  
  return { isOnline, offlineData, setOfflineData };
};
```

### Biometric Authentication
```javascript
// ✅ Good: Implement biometric authentication for mobile
import * as LocalAuthentication from 'expo-local-authentication';

const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState(null);
  
  useEffect(() => {
    checkBiometricAvailability();
  }, []);
  
  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    setIsAvailable(compatible && enrolled);
    setBiometryType(types[0]);
  };
  
  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use passcode'
      });
      
      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  };
  
  return { isAvailable, biometryType, authenticate };
};
```

## Security Considerations

### Rate Limiting
```javascript
// ✅ Good: Implement rate limiting for sensitive operations
const rateLimit = require('express-rate-limit');

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const verificationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 verification code per minute
  message: {
    success: false,
    message: 'Please wait before requesting another verification code'
  }
});

// Apply to routes
app.post('/api/auth/send-code', verificationRateLimit);
app.post('/api/auth/verify-code', authRateLimit);
```

### Input Sanitization
```javascript
// ✅ Good: Sanitize user input to prevent XSS
const DOMPurify = require('isomorphic-dompurify');

const sanitizeUserInput = (input) => {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(input);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeUserInput(value);
    }
    return sanitized;
  }
  
  return input;
};

// Usage in controller
const updateProfile = async (req, res) => {
  const sanitizedData = sanitizeUserInput(req.body);
  // Process sanitized data
};
```

These best practices ensure that your Users feature implementation is secure, performant, and maintainable. Always consider your specific use case and requirements when implementing these patterns.
