# Bookings Best Practices

## Overview

This document outlines best practices for developing, maintaining, and optimizing the Bookings feature. It covers performance considerations, security guidelines, data management, and development patterns.

## 🚀 Performance Optimization

### Database Optimization

#### Indexing Strategy
```javascript
// Service indexes for optimal query performance
serviceSchema.index({ category: 1, subcategory: 1, isActive: 1 });
serviceSchema.index({ provider: 1, isActive: 1, category: 1 });
serviceSchema.index({ serviceArea: 1, isActive: 1, category: 1 });
serviceSchema.index({ 'rating.average': -1, 'rating.count': -1, isActive: 1 });
serviceSchema.index({ 'pricing.basePrice': 1, category: 1, isActive: 1 });
serviceSchema.index({ createdAt: -1, isActive: 1 });

// Booking indexes for efficient filtering
bookingSchema.index({ client: 1, status: 1, bookingDate: 1 });
bookingSchema.index({ provider: 1, status: 1, bookingDate: 1 });
bookingSchema.index({ service: 1, status: 1, bookingDate: 1 });
bookingSchema.index({ 'payment.status': 1, status: 1 });
bookingSchema.index({ createdAt: -1, status: 1 });
```

#### Query Optimization
```javascript
// Use lean() for read-only operations
const services = await Service.find(filter)
  .populate('provider', 'firstName lastName profile.avatar')
  .select('-reviews -bookings -metadata')
  .sort(sort)
  .skip(skip)
  .limit(limit)
  .lean(); // Use lean() for better performance

// Use aggregation for complex analytics
const stats = await Booking.aggregate([
  { $match: { $or: [{ client: userId }, { provider: userId }] } },
  {
    $group: {
      _id: null,
      totalBookings: { $sum: 1 },
      completedBookings: {
        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
      },
      totalEarnings: {
        $sum: {
          $cond: [
            { $eq: ['$provider', userId] },
            '$pricing.totalAmount',
            0
          ]
        }
      }
    }
  }
]);
```

#### Caching Strategy
```javascript
// Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient();

// Cache service listings
async function getCachedServices(cacheKey) {
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function setCachedServices(cacheKey, data, ttl = 300) {
  try {
    await client.setex(cacheKey, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

// Usage in service controller
const getServices = async (req, res) => {
  try {
    const cacheKey = `services:${JSON.stringify(req.query)}`;
    let services = await getCachedServices(cacheKey);
    
    if (!services) {
      // Fetch from database
      services = await Service.find(filter).lean();
      await setCachedServices(cacheKey, services);
    }
    
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

### API Performance

#### Pagination Best Practices
```javascript
// Implement efficient pagination
const getServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Cap at 100
    const skip = (page - 1) * limit;
    
    // Use countDocuments for total count (more efficient than count)
    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate('provider', 'firstName lastName profile.avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Service.countDocuments(filter)
    ]);
    
    const pagination = {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    };
    
    res.json({
      success: true,
      data: services,
      pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

#### Response Optimization
```javascript
// Use projection to limit returned fields
const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'firstName lastName profile.avatar profile.rating')
      .select('-reviews -bookings -metadata') // Exclude heavy fields
      .lean();
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

## 🔒 Security Best Practices

### Authentication & Authorization

#### JWT Token Validation
```javascript
// Middleware for JWT validation
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};
```

#### Role-Based Access Control
```javascript
// Middleware for role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

// Usage in routes
router.post('/services', auth, authorize('provider', 'admin'), createService);
router.put('/services/:id', auth, authorize('provider', 'admin'), updateService);
```

#### Input Validation
```javascript
// Comprehensive input validation
const validateBooking = (req, res, next) => {
  const { serviceId, bookingDate, duration, address } = req.body;
  const errors = [];
  
  // Validate service ID
  if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
    errors.push({ field: 'serviceId', message: 'Valid service ID is required' });
  }
  
  // Validate booking date
  if (!bookingDate || isNaN(Date.parse(bookingDate))) {
    errors.push({ field: 'bookingDate', message: 'Valid booking date is required' });
  } else if (new Date(bookingDate) <= new Date()) {
    errors.push({ field: 'bookingDate', message: 'Booking date must be in the future' });
  }
  
  // Validate duration
  if (!duration || duration <= 0) {
    errors.push({ field: 'duration', message: 'Duration must be a positive number' });
  }
  
  // Validate address
  if (!address || !address.street || !address.city) {
    errors.push({ field: 'address', message: 'Complete address is required' });
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};
```

### Data Protection

#### Sensitive Data Handling
```javascript
// Sanitize sensitive data in responses
const sanitizeUser = (user) => {
  const sanitized = user.toObject();
  delete sanitized.password;
  delete sanitized.paymentMethods;
  delete sanitized.socialSecurityNumber;
  return sanitized;
};

// Usage in controllers
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('client', 'firstName lastName phoneNumber email')
      .populate('provider', 'firstName lastName phoneNumber email');
    
    // Sanitize user data
    if (booking.client) {
      booking.client = sanitizeUser(booking.client);
    }
    if (booking.provider) {
      booking.provider = sanitizeUser(booking.provider);
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

#### SQL Injection Prevention
```javascript
// Use parameterized queries (Mongoose handles this automatically)
// Avoid string concatenation in queries
const searchServices = async (req, res) => {
  try {
    const { search, category, location } = req.query;
    
    // Safe query construction
    const filter = { isActive: true };
    
    if (search) {
      // Use regex with proper escaping
      filter.$or = [
        { title: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        { description: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      ];
    }
    
    if (category) {
      filter.category = category; // Direct assignment is safe
    }
    
    if (location) {
      filter.serviceArea = { $in: [new RegExp(location, 'i')] };
    }
    
    const services = await Service.find(filter).lean();
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

## 📊 Data Management

### Data Consistency

#### Transaction Management
```javascript
// Use transactions for critical operations
const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Create booking
      const booking = new Booking(bookingData);
      await booking.save({ session });
      
      // Update service availability
      await Service.findByIdAndUpdate(
        serviceId,
        { $push: { bookings: booking._id } },
        { session }
      );
      
      // Update user statistics
      await User.findByIdAndUpdate(
        clientId,
        { $inc: { 'stats.totalBookings': 1 } },
        { session }
      );
    });
    
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    await session.endSession();
  }
};
```

#### Data Validation
```javascript
// Schema-level validation
const bookingSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required'],
    validate: {
      validator: async function(value) {
        const service = await mongoose.model('Service').findById(value);
        return service && service.isActive;
      },
      message: 'Service must exist and be active'
    }
  },
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Booking date must be in the future'
    }
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 hour'],
    max: [24, 'Duration cannot exceed 24 hours']
  }
});
```

### Data Archiving

#### Soft Delete Implementation
```javascript
// Soft delete for services
const serviceSchema = new mongoose.Schema({
  // ... other fields
  isActive: {
    type: Boolean,
    default: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
});

// Soft delete method
serviceSchema.methods.softDelete = function() {
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

// Query middleware to exclude soft-deleted records
serviceSchema.pre(/^find/, function() {
  this.find({ isActive: { $ne: false } });
});
```

#### Data Retention Policy
```javascript
// Cleanup old data
const cleanupOldData = async () => {
  try {
    // Archive completed bookings older than 2 years
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    const result = await Booking.updateMany(
      { 
        status: 'completed',
        completedAt: { $lt: twoYearsAgo }
      },
      { 
        $set: { archived: true, archivedAt: new Date() }
      }
    );
    
    console.log(`Archived ${result.modifiedCount} old bookings`);
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
};

// Run cleanup daily
setInterval(cleanupOldData, 24 * 60 * 60 * 1000);
```

## 🔄 Error Handling

### Comprehensive Error Handling

#### Error Classification
```javascript
// Custom error classes
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error
  console.error(err);
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new NotFoundError('Resource');
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ValidationError(message);
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

#### Retry Logic
```javascript
// Retry mechanism for external API calls
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Usage
const createPayPalOrder = async (orderData) => {
  return retryWithBackoff(async () => {
    const response = await fetch('https://api.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paypalToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      throw new Error(`PayPal API error: ${response.status}`);
    }
    
    return response.json();
  });
};
```

## 📱 Frontend Integration

### State Management

#### Redux Integration
```javascript
// Redux actions for bookings
export const fetchServices = (filters = {}) => async (dispatch) => {
  dispatch({ type: 'FETCH_SERVICES_START' });
  
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/marketplace/services?${queryParams}`);
    const data = await response.json();
    
    if (data.success) {
      dispatch({
        type: 'FETCH_SERVICES_SUCCESS',
        payload: data.data
      });
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    dispatch({
      type: 'FETCH_SERVICES_ERROR',
      payload: error.message
    });
  }
};

// Redux reducer
const servicesReducer = (state = { items: [], loading: false, error: null }, action) => {
  switch (action.type) {
    case 'FETCH_SERVICES_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SERVICES_SUCCESS':
      return { ...state, loading: false, items: action.payload };
    case 'FETCH_SERVICES_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
```

#### React Hooks
```javascript
// Custom hook for service management
const useServices = (filters = {}) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`/api/marketplace/services?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setServices(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  
  return { services, loading, error, refetch: fetchServices };
};

// Usage in component
const ServiceList = ({ filters }) => {
  const { services, loading, error, refetch } = useServices(filters);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {services.map(service => (
        <ServiceCard key={service._id} service={service} />
      ))}
    </div>
  );
};
```

## 🧪 Testing Best Practices

### Unit Testing

#### Service Testing
```javascript
// Jest test for service creation
describe('Service Creation', () => {
  beforeEach(async () => {
    await Service.deleteMany({});
    await User.deleteMany({});
  });
  
  it('should create a service with valid data', async () => {
    const user = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'provider'
    });
    
    const serviceData = {
      title: 'Test Service',
      description: 'Test Description',
      category: 'cleaning',
      subcategory: 'residential',
      provider: user._id,
      pricing: {
        type: 'hourly',
        basePrice: 25,
        currency: 'USD'
      },
      serviceArea: ['10001']
    };
    
    const service = await Service.create(serviceData);
    
    expect(service.title).toBe(serviceData.title);
    expect(service.provider).toEqual(user._id);
    expect(service.isActive).toBe(true);
  });
  
  it('should fail with invalid category', async () => {
    const serviceData = {
      title: 'Test Service',
      description: 'Test Description',
      category: 'invalid',
      subcategory: 'residential',
      provider: new mongoose.Types.ObjectId(),
      pricing: {
        type: 'hourly',
        basePrice: 25,
        currency: 'USD'
      },
      serviceArea: ['10001']
    };
    
    await expect(Service.create(serviceData)).rejects.toThrow();
  });
});
```

#### API Testing
```javascript
// Supertest for API endpoints
describe('POST /api/marketplace/services', () => {
  let user;
  let token;
  
  beforeEach(async () => {
    user = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'provider'
    });
    
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  });
  
  it('should create a service with valid data', async () => {
    const serviceData = {
      title: 'Test Service',
      description: 'Test Description',
      category: 'cleaning',
      subcategory: 'residential',
      pricing: {
        type: 'hourly',
        basePrice: 25,
        currency: 'USD'
      },
      serviceArea: ['10001']
    };
    
    const response = await request(app)
      .post('/api/marketplace/services')
      .set('Authorization', `Bearer ${token}`)
      .send(serviceData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(serviceData.title);
  });
  
  it('should fail without authentication', async () => {
    const serviceData = {
      title: 'Test Service',
      description: 'Test Description',
      category: 'cleaning',
      subcategory: 'residential',
      pricing: {
        type: 'hourly',
        basePrice: 25,
        currency: 'USD'
      },
      serviceArea: ['10001']
    };
    
    await request(app)
      .post('/api/marketplace/services')
      .send(serviceData)
      .expect(401);
  });
});
```

### Integration Testing

#### End-to-End Testing
```javascript
// Cypress E2E test
describe('Service Booking Flow', () => {
  beforeEach(() => {
    cy.login('client@example.com', 'password123');
  });
  
  it('should complete a full booking flow', () => {
    // Search for services
    cy.visit('/services');
    cy.get('[data-cy=category-filter]').select('cleaning');
    cy.get('[data-cy=search-button]').click();
    
    // Select a service
    cy.get('[data-cy=service-card]').first().click();
    cy.get('[data-cy=book-button]').click();
    
    // Fill booking form
    cy.get('[data-cy=booking-date]').type('2024-02-01');
    cy.get('[data-cy=booking-duration]').type('3');
    cy.get('[data-cy=booking-address]').type('123 Main St, New York, NY 10001');
    cy.get('[data-cy=special-instructions]').type('Please use eco-friendly products');
    
    // Submit booking
    cy.get('[data-cy=submit-booking]').click();
    
    // Verify booking creation
    cy.get('[data-cy=booking-confirmation]').should('be.visible');
    cy.get('[data-cy=booking-id]').should('contain', 'Booking created successfully');
  });
});
```

## 📈 Monitoring & Analytics

### Performance Monitoring

#### Metrics Collection
```javascript
// Performance metrics middleware
const performanceMetrics = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const metrics = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    };
    
    // Log to monitoring service
    console.log('Performance metrics:', metrics);
    
    // Send to monitoring service (e.g., DataDog, New Relic)
    if (process.env.MONITORING_ENABLED === 'true') {
      sendMetrics(metrics);
    }
  });
  
  next();
};

// Usage
app.use(performanceMetrics);
```

#### Error Tracking
```javascript
// Error tracking middleware
const errorTracking = (err, req, res, next) => {
  // Log error details
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  };
  
  console.error('Error occurred:', errorDetails);
  
  // Send to error tracking service (e.g., Sentry)
  if (process.env.ERROR_TRACKING_ENABLED === 'true') {
    sendErrorToTracking(errorDetails);
  }
  
  next(err);
};
```

### Business Analytics

#### Booking Analytics
```javascript
// Analytics aggregation
const getBookingAnalytics = async (dateRange) => {
  const { startDate, endDate } = dateRange;
  
  const analytics = await Booking.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          status: '$status',
          category: '$service.category'
        },
        count: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        averageRating: { $avg: '$review.rating' }
      }
    },
    {
      $group: {
        _id: '$_id.status',
        categories: {
          $push: {
            category: '$_id.category',
            count: '$count',
            revenue: '$totalRevenue',
            rating: '$averageRating'
          }
        },
        totalCount: { $sum: '$count' },
        totalRevenue: { $sum: '$totalRevenue' }
      }
    }
  ]);
  
  return analytics;
};
```

---

*These best practices ensure robust, secure, and performant implementation of the Bookings feature. Regular review and updates of these practices are recommended as the system evolves.*
