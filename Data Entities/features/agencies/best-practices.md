# Agencies Best Practices

## Overview

This document outlines best practices for implementing and using the Agencies feature in the LocalPro Super App. These guidelines ensure optimal performance, security, and maintainability when working with agency management, provider management, and administrative controls.

## Security Best Practices

### Authentication & Authorization

#### Agency Access Control
```javascript
// ✅ Good: Implement proper agency access control
const checkAgencyAccess = (agency, user, requiredRole = 'view') => {
  if (!user) {
    return false;
  }

  // Owner has full access
  if (agency.owner.toString() === user.id) {
    return true;
  }

  // Check admin access
  const admin = agency.admins.find(a => a.user.toString() === user.id);
  if (admin) {
    const roleHierarchy = { 'admin': 3, 'manager': 2, 'supervisor': 1 };
    const requiredLevel = roleHierarchy[requiredRole] || 1;
    const userLevel = roleHierarchy[admin.role] || 0;
    return userLevel >= requiredLevel;
  }

  // Check provider access (limited)
  if (agency.isProvider(user.id) && requiredRole === 'view') {
    return true;
  }

  return false;
};

// Usage in controller
const getAgency = async (req, res) => {
  const agency = await Agency.findById(req.params.id);
  
  if (!checkAgencyAccess(agency, req.user, 'view')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this agency'
    });
  }
  
  // Proceed with agency retrieval
};
```

#### Data Sanitization
```javascript
// ✅ Good: Sanitize agency data before sending to client
const sanitizeAgencyData = (agency) => {
  const sanitized = { ...agency.toObject() };
  
  // Remove sensitive business information for non-owners
  if (sanitized.business) {
    delete sanitized.business.taxId;
    delete sanitized.business.registrationNumber;
    delete sanitized.business.insurance.policyNumber;
  }
  
  // Sanitize provider data
  if (sanitized.providers) {
    sanitized.providers = sanitized.providers.map(provider => ({
      ...provider,
      user: {
        _id: provider.user._id,
        firstName: provider.user.firstName,
        lastName: provider.user.lastName,
        profile: {
          avatar: provider.user.profile?.avatar
        }
      }
    }));
  }
  
  return sanitized;
};

// ✅ Good: Use field selection in queries
const getPublicAgencyData = async (agencyId) => {
  return await Agency.findById(agencyId)
    .select('name description contact services serviceAreas analytics.isVerified')
    .populate('owner', 'firstName lastName profile.avatar')
    .populate('providers.user', 'firstName lastName profile.avatar')
    .lean();
};
```

### Input Validation
```javascript
// ✅ Good: Comprehensive input validation
const validateAgencyInput = (data) => {
  const errors = [];
  
  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Agency name must be at least 2 characters long');
  }
  
  if (data.name && data.name.length > 100) {
    errors.push('Agency name must be less than 100 characters');
  }
  
  // Description validation
  if (!data.description || data.description.trim().length < 10) {
    errors.push('Agency description must be at least 10 characters long');
  }
  
  if (data.description && data.description.length > 500) {
    errors.push('Agency description must be less than 500 characters');
  }
  
  // Contact validation
  if (data.contact) {
    if (!data.contact.email || !isValidEmail(data.contact.email)) {
      errors.push('Valid email is required');
    }
    
    if (!data.contact.phone || data.contact.phone.length < 10) {
      errors.push('Valid phone number is required');
    }
  }
  
  // Business type validation
  const validBusinessTypes = ['sole_proprietorship', 'partnership', 'corporation', 'llc', 'nonprofit'];
  if (data.business?.type && !validBusinessTypes.includes(data.business.type)) {
    errors.push('Invalid business type');
  }
  
  // Commission rate validation
  if (data.commissionRate !== undefined) {
    if (data.commissionRate < 0 || data.commissionRate > 100) {
      errors.push('Commission rate must be between 0 and 100');
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
const getAgencies = async (filters) => {
  return await Agency.find(filters)
    .select('name description owner contact services analytics isActive createdAt')
    .populate('owner', 'firstName lastName profile.avatar')
    .populate('providers.user', 'firstName lastName profile.avatar')
    .lean() // Use lean() for read-only operations
    .limit(20);
};

// ❌ Bad: Selecting all fields
const getAgencies = async (filters) => {
  return await Agency.find(filters)
    .populate('owner')
    .populate('providers.user')
    .limit(20);
};
```

#### Proper Indexing
```javascript
// ✅ Good: Create compound indexes for common queries
agencySchema.index({ owner: 1 });
agencySchema.index({ 'providers.user': 1 });
agencySchema.index({ isActive: 1 });
agencySchema.index({ 'contact.address.city': 1 });
agencySchema.index({ 'services.category': 1 });
agencySchema.index({ name: 'text', description: 'text' });

// ✅ Good: Use text search index for search functionality
agencySchema.index({
  name: 'text',
  description: 'text',
  'contact.address.city': 'text'
});
```

#### Pagination
```javascript
// ✅ Good: Implement efficient pagination
const getAgenciesPaginated = async (page = 1, limit = 20, filters = {}) => {
  const skip = (page - 1) * limit;
  
  const [agencies, total] = await Promise.all([
    Agency.find(filters)
      .select('name description owner contact services analytics isActive createdAt')
      .populate('owner', 'firstName lastName profile.avatar')
      .populate('providers.user', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Agency.countDocuments(filters)
  ]);
  
  return {
    agencies,
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
// ✅ Good: Implement Redis caching for agency data
const getAgencyWithCache = async (agencyId) => {
  const cacheKey = `agency:${agencyId}`;
  
  // Try to get from cache first
  let agency = await redis.get(cacheKey);
  
  if (agency) {
    return JSON.parse(agency);
  }
  
  // If not in cache, get from database
  agency = await Agency.findById(agencyId)
    .populate('owner', 'firstName lastName profile.avatar')
    .populate('providers.user', 'firstName lastName profile.avatar')
    .lean();
  
  if (agency) {
    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(agency));
  }
  
  return agency;
};

// ✅ Good: Invalidate cache on agency updates
const updateAgency = async (agencyId, agencyData) => {
  const agency = await Agency.findByIdAndUpdate(agencyId, agencyData, { new: true });
  
  // Invalidate related caches
  await redis.del(`agency:${agencyId}`);
  await redis.del(`agencies:list:*`);
  await redis.del(`agency:analytics:${agencyId}`);
  
  return agency;
};
```

#### Client-Side Caching
```javascript
// ✅ Good: Use React Query for client-side caching
const useAgency = (agencyId) => {
  return useQuery(
    ['agency', agencyId],
    () => fetchAgency(agencyId),
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
const handleAgencyError = (error, res) => {
  console.error('Agency API Error:', error);
  
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
      message: 'Invalid agency ID format'
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Agency with this name already exists'
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
const useAgency = () => {
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
  
  const getAgency = (agencyId) => {
    return handleApiCall(() => 
      fetch(`/api/agencies/${agencyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
    );
  };
  
  return { getAgency, error, setError };
};
```

## Data Validation Best Practices

### Server-Side Validation
```javascript
// ✅ Good: Use express-validator for request validation
const { body, validationResult } = require('express-validator');

const validateAgencyCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Agency name must be between 2 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('contact.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('contact.phone')
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Valid phone number is required'),
  
  body('business.type')
    .optional()
    .isIn(['sole_proprietorship', 'partnership', 'corporation', 'llc', 'nonprofit'])
    .withMessage('Valid business type is required'),
  
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
const useAgencyForm = (initialValues) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validate = (field, value) => {
    const rules = {
      name: (val) => {
        if (!val) return 'Agency name is required';
        if (val.length < 2) return 'Agency name must be at least 2 characters';
        if (val.length > 100) return 'Agency name must be less than 100 characters';
        return '';
      },
      description: (val) => {
        if (!val) return 'Description is required';
        if (val.length < 10) return 'Description must be at least 10 characters';
        if (val.length > 500) return 'Description must be less than 500 characters';
        return '';
      },
      'contact.email': (val) => {
        if (!val) return 'Email is required';
        if (!isValidEmail(val)) return 'Valid email is required';
        return '';
      },
      'contact.phone': (val) => {
        if (!val) return 'Phone number is required';
        if (val.length < 10) return 'Phone number must be at least 10 digits';
        return '';
      }
    };
    
    return rules[field] ? rules[field](value) : '';
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
  agencies: {
    byId: {},
    allIds: [],
    loading: false,
    error: null,
    pagination: {
      current: 1,
      pages: 0,
      total: 0,
      limit: 20
    }
  },
  providers: {
    byAgencyId: {},
    loading: false,
    error: null
  },
  analytics: {
    byAgencyId: {},
    loading: false,
    error: null
  }
};

// ✅ Good: Action creators with proper error handling
const agencyActions = {
  fetchAgencies: (filters) => async (dispatch) => {
    dispatch({ type: 'FETCH_AGENCIES_START' });
    
    try {
      const response = await fetch(`/api/agencies?${new URLSearchParams(filters)}`);
      const data = await response.json();
      
      if (data.success) {
        dispatch({
          type: 'FETCH_AGENCIES_SUCCESS',
          payload: {
            agencies: data.data,
            pagination: data.pagination
          }
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      dispatch({
        type: 'FETCH_AGENCIES_ERROR',
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
describe('AgencyService', () => {
  let agencyService;
  let mockApiClient;
  
  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    agencyService = new AgencyService(mockApiClient);
  });
  
  describe('getAgencies', () => {
    it('should fetch agencies with filters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            { _id: '1', name: 'Test Agency', description: 'Test description' }
          ],
          pagination: { current: 1, pages: 1, total: 1 }
        }
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      const result = await agencyService.getAgencies({ search: 'test' });
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/agencies', {
        params: { search: 'test' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
```

### Integration Testing
```javascript
// ✅ Good: Integration tests with test database
describe('Agency API Integration', () => {
  let app;
  let testUser;
  let testAgency;
  
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
      role: 'provider'
    });
    
    testAgency = await Agency.create({
      name: 'Test Agency',
      description: 'Test agency description',
      owner: testUser._id,
      contact: {
        email: 'test@agency.com',
        phone: '+1-555-0123'
      }
    });
  });
  
  afterEach(async () => {
    await Agency.deleteMany({});
    await User.deleteMany({});
  });
  
  describe('POST /api/agencies/:id/providers', () => {
    it('should add provider to agency', async () => {
      const response = await request(app)
        .post(`/api/agencies/${testAgency._id}/providers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: testUser._id, commissionRate: 15 })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Provider added successfully');
    });
  });
});
```

## Monitoring and Logging Best Practices

### Structured Logging
```javascript
// ✅ Good: Structured logging with context
const logger = require('winston');

const logAgencyAction = (action, agencyId, userId, details = {}) => {
  logger.info('Agency action', {
    action,
    agencyId,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Usage
const createAgency = async (req, res) => {
  try {
    const agencyData = {
      ...req.body,
      owner: req.user.id
    };
    
    const agency = await Agency.create(agencyData);
    
    logAgencyAction('agency_created', agency._id, req.user.id, {
      agencyName: agency.name,
      businessType: agency.business.type
    });
    
    res.status(201).json({
      success: true,
      message: 'Agency created successfully',
      data: agency
    });
  } catch (error) {
    logAgencyAction('agency_creation_failed', null, req.user.id, {
      error: error.message,
      agencyData: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
```

### Performance Monitoring
```javascript
// ✅ Good: Performance monitoring for agency operations
const monitorAgencyOperation = (operationName) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        
        const duration = Date.now() - startTime;
        logger.info('Agency operation completed', {
          operation: operationName,
          duration,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Agency operation failed', {
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
class AgencyController {
  @monitorAgencyOperation('getAgencies')
  async getAgencies(req, res) {
    // Implementation
  }
}
```

## Mobile App Best Practices

### Offline Support
```javascript
// ✅ Good: Implement offline support for agencies
const useOfflineAgency = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineAgencies, setOfflineAgencies] = useState([]);
  
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
  
  const syncOfflineAgencies = async () => {
    if (isOnline && offlineAgencies.length > 0) {
      try {
        await syncAgencies(offlineAgencies);
        setOfflineAgencies([]);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  };
  
  useEffect(() => {
    syncOfflineAgencies();
  }, [isOnline]);
  
  return { isOnline, offlineAgencies, setOfflineAgencies };
};
```

### Real-time Updates
```javascript
// ✅ Good: Implement real-time agency updates
const useRealtimeAgency = () => {
  const [agencies, setAgencies] = useState([]);
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL);
    setSocket(newSocket);
    
    newSocket.on('agency_created', (agency) => {
      setAgencies(prev => [agency, ...prev]);
    });
    
    newSocket.on('agency_updated', (agency) => {
      setAgencies(prev => 
        prev.map(a => a._id === agency._id ? agency : a)
      );
    });
    
    newSocket.on('agency_deleted', (agencyId) => {
      setAgencies(prev => prev.filter(a => a._id !== agencyId));
    });
    
    return () => {
      newSocket.close();
    };
  }, []);
  
  return { agencies, setAgencies, socket };
};
```

## Security Considerations

### Rate Limiting
```javascript
// ✅ Good: Implement rate limiting for agency operations
const rateLimit = require('express-rate-limit');

const agencyCreationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 agencies per hour
  message: {
    success: false,
    message: 'Too many agency creation attempts, please try again later'
  }
});

const providerManagementLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 provider operations per 15 minutes
  message: {
    success: false,
    message: 'Too many provider management attempts, please try again later'
  }
});

// Apply to routes
app.post('/api/agencies', agencyCreationLimit);
app.post('/api/agencies/:id/providers', providerManagementLimit);
```

### Content Security Policy
```javascript
// ✅ Good: Implement CSP for agency content
const csp = require('helmet-csp');

app.use(csp({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
    connectSrc: ["'self'", "https://api.localpro.com", "wss://api.localpro.com"]
  }
}));
```

These best practices ensure that your Agencies feature implementation is secure, performant, and maintainable. Always consider your specific use case and requirements when implementing these patterns.
