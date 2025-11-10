# Activity Best Practices

## Overview

This document outlines best practices for implementing and using the Activity feature in the LocalPro Super App. These guidelines ensure optimal performance, security, and maintainability when working with activity tracking, social engagement, and analytics.

## Security Best Practices

### Authentication & Authorization

#### Activity Access Control
```javascript
// ✅ Good: Implement proper activity access control
const checkActivityAccess = (activity, user) => {
  if (!user) {
    // Public activities only for non-authenticated users
    return activity.visibility === 'public';
  }

  // Admin can access all activities
  if (user.role === 'admin') {
    return true;
  }

  // User can always access their own activities
  if (activity.user._id.toString() === user.id) {
    return true;
  }

  // Check visibility
  if (activity.visibility === 'public') {
    return true;
  }

  if (activity.visibility === 'private') {
    return false;
  }

  // For connections and followers, implement connection logic
  if (activity.visibility === 'connections') {
    return checkUserConnection(activity.user._id, user.id);
  }

  if (activity.visibility === 'followers') {
    return checkUserFollow(activity.user._id, user.id);
  }

  return false;
};

// Usage in controller
const getActivity = async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  
  if (!checkActivityAccess(activity, req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this activity'
    });
  }
  
  // Proceed with activity retrieval
};
```

#### Data Sanitization
```javascript
// ✅ Good: Sanitize activity data before sending to client
const sanitizeActivityData = (activity) => {
  const sanitized = { ...activity.toObject() };
  
  // Remove sensitive metadata
  delete sanitized.metadata.ipAddress;
  delete sanitized.metadata.sessionId;
  delete sanitized.metadata.requestId;
  
  // Sanitize user data
  if (sanitized.user && sanitized.user.profile) {
    delete sanitized.user.profile.phoneNumber;
    delete sanitized.user.profile.email;
  }
  
  // Sanitize details
  if (sanitized.details) {
    // Remove sensitive information from details
    delete sanitized.details.password;
    delete sanitized.details.creditCard;
    delete sanitized.details.ssn;
  }
  
  return sanitized;
};

// ✅ Good: Use field selection in queries
const getPublicActivityData = async (activityId) => {
  return await Activity.findById(activityId)
    .select('type action description targetEntity analytics visibility createdAt')
    .populate('user', 'firstName lastName avatar role')
    .lean();
};
```

### Input Validation
```javascript
// ✅ Good: Comprehensive input validation
const validateActivityInput = (data) => {
  const errors = [];
  
  // Type validation
  const validTypes = [
    'user_login', 'user_logout', 'user_register', 'profile_update',
    'service_created', 'service_updated', 'booking_created',
    'course_enrolled', 'course_completed', 'payment_made'
    // ... all valid types
  ];
  
  if (!validTypes.includes(data.type)) {
    errors.push('Invalid activity type');
  }
  
  // Action validation
  if (!data.action || data.action.trim().length < 3) {
    errors.push('Action must be at least 3 characters long');
  }
  
  if (data.action && data.action.length > 100) {
    errors.push('Action must be less than 100 characters');
  }
  
  // Description validation
  if (!data.description || data.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }
  
  if (data.description && data.description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }
  
  // Visibility validation
  const validVisibility = ['public', 'private', 'connections', 'followers'];
  if (data.visibility && !validVisibility.includes(data.visibility)) {
    errors.push('Invalid visibility level');
  }
  
  // Impact validation
  const validImpact = ['low', 'medium', 'high', 'critical'];
  if (data.impact && !validImpact.includes(data.impact)) {
    errors.push('Invalid impact level');
  }
  
  return errors;
};
```

## Performance Best Practices

### Database Optimization

#### Efficient Queries
```javascript
// ✅ Good: Use specific field selection
const getActivityFeed = async (filters) => {
  return await Activity.find(filters)
    .select('type action description targetEntity analytics visibility createdAt user')
    .populate('user', 'firstName lastName avatar role')
    .lean() // Use lean() for read-only operations
    .limit(20);
};

// ❌ Bad: Selecting all fields
const getActivityFeed = async (filters) => {
  return await Activity.find(filters)
    .populate('user')
    .limit(20);
};
```

#### Proper Indexing
```javascript
// ✅ Good: Create compound indexes for common queries
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ category: 1, createdAt: -1 });
activitySchema.index({ visibility: 1, isVisible: 1, createdAt: -1 });
activitySchema.index({ 'targetEntity.type': 1, 'targetEntity.id': 1 });

// ✅ Good: Use text search index for search functionality
activitySchema.index({
  action: 'text',
  description: 'text',
  tags: 'text'
});
```

#### Pagination
```javascript
// ✅ Good: Implement efficient pagination
const getActivitiesPaginated = async (page = 1, limit = 20, filters = {}) => {
  const skip = (page - 1) * limit;
  
  const [activities, total] = await Promise.all([
    Activity.find(filters)
      .select('type action description targetEntity analytics visibility createdAt')
      .populate('user', 'firstName lastName avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Activity.countDocuments(filters)
  ]);
  
  return {
    activities,
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
// ✅ Good: Implement Redis caching for activity feeds
const getActivityFeedWithCache = async (userId, filters) => {
  const cacheKey = `activity_feed:${userId}:${JSON.stringify(filters)}`;
  
  // Try to get from cache first
  let activities = await redis.get(cacheKey);
  
  if (activities) {
    return JSON.parse(activities);
  }
  
  // If not in cache, get from database
  activities = await Activity.getActivityFeed(userId, filters);
  
  if (activities) {
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(activities));
  }
  
  return activities;
};

// ✅ Good: Invalidate cache on activity updates
const createActivity = async (activityData) => {
  const activity = await Activity.create(activityData);
  
  // Invalidate related caches
  await redis.del(`activity_feed:${activity.user}:*`);
  await redis.del(`activity_stats:${activity.user}:*`);
  
  return activity;
};
```

#### Client-Side Caching
```javascript
// ✅ Good: Use React Query for client-side caching
const useActivityFeed = (filters) => {
  return useQuery(
    ['activityFeed', filters],
    () => fetchActivityFeed(filters),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
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
const handleActivityError = (error, res) => {
  console.error('Activity API Error:', error);
  
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
      message: 'Invalid activity ID format'
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Activity already exists'
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
const useActivity = () => {
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
  
  const getActivityFeed = (filters) => {
    return handleApiCall(() => 
      fetch(`/api/activities/feed?${new URLSearchParams(filters)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
    );
  };
  
  return { getActivityFeed, error, setError };
};
```

## Data Validation Best Practices

### Server-Side Validation
```javascript
// ✅ Good: Use express-validator for request validation
const { body, validationResult } = require('express-validator');

const validateActivityCreation = [
  body('type')
    .isIn([
      'user_login', 'user_logout', 'user_register', 'profile_update',
      'service_created', 'service_updated', 'booking_created',
      'course_enrolled', 'course_completed', 'payment_made'
      // ... all valid types
    ])
    .withMessage('Invalid activity type'),
  
  body('action')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Action must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'connections', 'followers'])
    .withMessage('Invalid visibility level'),
  
  body('impact')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid impact level'),
  
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
const useActivityForm = (initialValues) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validate = (field, value) => {
    const rules = {
      type: (val) => val ? '' : 'Activity type is required',
      action: (val) => {
        if (!val) return 'Action is required';
        if (val.length < 3) return 'Action must be at least 3 characters';
        if (val.length > 100) return 'Action must be less than 100 characters';
        return '';
      },
      description: (val) => {
        if (!val) return 'Description is required';
        if (val.length < 10) return 'Description must be at least 10 characters';
        if (val.length > 500) return 'Description must be less than 500 characters';
        return '';
      },
      visibility: (val) => val ? '' : 'Visibility is required',
      impact: (val) => val ? '' : 'Impact is required'
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
  activities: {
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
  interactions: {
    byActivityId: {},
    loading: false,
    error: null
  },
  statistics: {
    data: null,
    loading: false,
    error: null
  }
};

// ✅ Good: Action creators with proper error handling
const activityActions = {
  fetchActivityFeed: (filters) => async (dispatch) => {
    dispatch({ type: 'FETCH_ACTIVITY_FEED_START' });
    
    try {
      const response = await fetch(`/api/activities/feed?${new URLSearchParams(filters)}`);
      const data = await response.json();
      
      if (data.success) {
        dispatch({
          type: 'FETCH_ACTIVITY_FEED_SUCCESS',
          payload: {
            activities: data.data.activities,
            pagination: data.data.pagination
          }
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      dispatch({
        type: 'FETCH_ACTIVITY_FEED_ERROR',
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
describe('ActivityService', () => {
  let activityService;
  let mockApiClient;
  
  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    activityService = new ActivityService(mockApiClient);
  });
  
  describe('getActivityFeed', () => {
    it('should fetch activity feed with filters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            activities: [
              { _id: '1', type: 'service_created', action: 'Created service' }
            ],
            pagination: { current: 1, pages: 1, total: 1 }
          }
        }
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      const result = await activityService.getActivityFeed({ page: 1, limit: 20 });
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/activities/feed', {
        params: { page: 1, limit: 20 }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
```

### Integration Testing
```javascript
// ✅ Good: Integration tests with test database
describe('Activity API Integration', () => {
  let app;
  let testUser;
  let testActivity;
  
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
    
    testActivity = await Activity.create({
      user: testUser._id,
      type: 'service_created',
      category: 'marketplace',
      action: 'Created new service',
      description: 'Test user created a new cleaning service',
      visibility: 'public',
      impact: 'medium'
    });
  });
  
  afterEach(async () => {
    await Activity.deleteMany({});
    await User.deleteMany({});
  });
  
  describe('POST /api/activities/:id/interactions', () => {
    it('should add interaction to activity', async () => {
      const response = await request(app)
        .post(`/api/activities/${testActivity._id}/interactions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'like', metadata: { source: 'mobile_app' } })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.interactionType).toBe('like');
    });
  });
});
```

## Monitoring and Logging Best Practices

### Structured Logging
```javascript
// ✅ Good: Structured logging with context
const logger = require('winston');

const logActivityAction = (action, activityId, userId, details = {}) => {
  logger.info('Activity action', {
    action,
    activityId,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Usage
const createActivity = async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      user: req.user.id
    };
    
    const activity = await Activity.create(activityData);
    
    logActivityAction('activity_created', activity._id, req.user.id, {
      activityType: activity.type,
      visibility: activity.visibility,
      impact: activity.impact
    });
    
    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity
    });
  } catch (error) {
    logActivityAction('activity_creation_failed', null, req.user.id, {
      error: error.message,
      activityData: req.body
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
// ✅ Good: Performance monitoring for activity operations
const monitorActivityOperation = (operationName) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        
        const duration = Date.now() - startTime;
        logger.info('Activity operation completed', {
          operation: operationName,
          duration,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Activity operation failed', {
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
class ActivityController {
  @monitorActivityOperation('getActivityFeed')
  async getActivityFeed(req, res) {
    // Implementation
  }
}
```

## Mobile App Best Practices

### Offline Support
```javascript
// ✅ Good: Implement offline support for activities
const useOfflineActivity = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineActivities, setOfflineActivities] = useState([]);
  
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
  
  const syncOfflineActivities = async () => {
    if (isOnline && offlineActivities.length > 0) {
      try {
        await syncActivities(offlineActivities);
        setOfflineActivities([]);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  };
  
  useEffect(() => {
    syncOfflineActivities();
  }, [isOnline]);
  
  return { isOnline, offlineActivities, setOfflineActivities };
};
```

### Real-time Updates
```javascript
// ✅ Good: Implement real-time activity updates
const useRealtimeActivity = () => {
  const [activities, setActivities] = useState([]);
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL);
    setSocket(newSocket);
    
    newSocket.on('activity_created', (activity) => {
      setActivities(prev => [activity, ...prev]);
    });
    
    newSocket.on('activity_updated', (activity) => {
      setActivities(prev => 
        prev.map(a => a._id === activity._id ? activity : a)
      );
    });
    
    newSocket.on('activity_deleted', (activityId) => {
      setActivities(prev => prev.filter(a => a._id !== activityId));
    });
    
    return () => {
      newSocket.close();
    };
  }, []);
  
  return { activities, setActivities, socket };
};
```

## Security Considerations

### Rate Limiting
```javascript
// ✅ Good: Implement rate limiting for activity operations
const rateLimit = require('express-rate-limit');

const activityCreationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 activities per hour
  message: {
    success: false,
    message: 'Too many activity creation attempts, please try again later'
  }
});

const interactionLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 interactions per 15 minutes
  message: {
    success: false,
    message: 'Too many interaction attempts, please try again later'
  }
});

// Apply to routes
app.post('/api/activities', activityCreationLimit);
app.post('/api/activities/:id/interactions', interactionLimit);
```

### Content Security Policy
```javascript
// ✅ Good: Implement CSP for activity content
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

These best practices ensure that your Activity feature implementation is secure, performant, and maintainable. Always consider your specific use case and requirements when implementing these patterns.
