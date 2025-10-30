# Services Best Practices

## Overview

This document outlines best practices for developing, maintaining, and optimizing the Services feature. It covers performance considerations, security guidelines, data management, and development patterns.

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
serviceSchema.index({ serviceType: 1, category: 1, isActive: 1 });
serviceSchema.index({ 'emergencyService.available': 1, category: 1, isActive: 1 });

// Booking indexes for efficient filtering
bookingSchema.index({ client: 1, status: 1, bookingDate: 1 });
bookingSchema.index({ provider: 1, status: 1, bookingDate: 1 });
bookingSchema.index({ service: 1, status: 1, bookingDate: 1 });
bookingSchema.index({ 'payment.status': 1, status: 1 });
bookingSchema.index({ 'address.city': 1, 'address.state': 1, status: 1 });
```

#### Query Optimization
```javascript
// Use lean() for read-only operations
const services = await Service.find(filter)
  .populate('provider', 'firstName lastName profile.avatar profile.rating')
  .select('-reviews -bookings -metadata') // Exclude heavy fields
  .sort(sort)
  .skip(skip)
  .limit(limit)
  .lean(); // Use lean() for better performance

// Use aggregation for complex analytics
const stats = await Service.aggregate([
  { $match: { isActive: true } },
  {
    $group: {
      _id: '$category',
      totalServices: { $sum: 1 },
      averageRating: { $avg: '$rating.average' },
      totalBookings: { $sum: '$rating.count' }
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
      services = await Service.find(filter)
        .populate('provider', 'firstName lastName profile.avatar')
        .lean();
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
        .select('-reviews -bookings') // Exclude heavy fields
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
      .select('-reviews -bookings') // Exclude heavy data for public view
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
router.delete('/services/:id', auth, authorize('provider', 'admin'), deleteService);
```

#### Provider Ownership Validation
```javascript
// Verify provider owns the service
const verifyProviderOwnership = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    if (service.provider.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action'
      });
    }
    
    req.service = service;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Usage
router.put('/services/:id', auth, authorize('provider', 'admin'), verifyProviderOwnership, updateService);
```

#### Input Validation
```javascript
// Comprehensive input validation
const validateService = (req, res, next) => {
  const { title, description, category, pricing, serviceArea } = req.body;
  const errors = [];
  
  // Validate title
  if (!title || title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
  }
  
  // Validate description
  if (!description || description.trim().length < 20) {
    errors.push({ field: 'description', message: 'Description must be at least 20 characters' });
  }
  
  // Validate category
  const validCategories = ['cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 'painting', 'carpentry', 'flooring', 'roofing', 'hvac', 'appliance_repair', 'locksmith', 'handyman', 'home_security', 'pool_maintenance', 'pest_control', 'carpet_cleaning', 'window_cleaning', 'gutter_cleaning', 'power_washing', 'snow_removal', 'other'];
  if (!category || !validCategories.includes(category)) {
    errors.push({ field: 'category', message: 'Valid category is required' });
  }
  
  // Validate pricing
  if (!pricing || !pricing.type || !pricing.basePrice || pricing.basePrice <= 0) {
    errors.push({ field: 'pricing', message: 'Valid pricing information is required' });
  }
  
  // Validate service area
  if (!serviceArea || !Array.isArray(serviceArea) || serviceArea.length === 0) {
    errors.push({ field: 'serviceArea', message: 'Service area is required' });
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

### Content Security

#### Image Upload Validation
```javascript
// Validate image uploads
const validateImageUpload = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }
  
  // Check file types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const invalidFiles = req.files.filter(file => !allowedTypes.includes(file.mimetype));
  
  if (invalidFiles.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file types. Only JPEG, PNG, and WebP images are allowed'
    });
  }
  
  // Check file sizes (e.g., max 5MB per file)
  const maxSize = 5 * 1024 * 1024; // 5MB
  const oversizedFiles = req.files.filter(file => file.size > maxSize);
  
  if (oversizedFiles.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size: 5MB per file'
    });
  }
  
  // Check number of files (max 5)
  if (req.files.length > 5) {
    return res.status(400).json({
      success: false,
      message: 'Too many files. Maximum 5 files allowed'
    });
  }
  
  next();
};
```

#### Booking Authorization
```javascript
// Verify user can access booking
const verifyBookingAccess = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user is client or provider
    if (booking.client.toString() !== req.user.id && 
        booking.provider.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }
    
    req.booking = booking;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
```

## 📊 Data Management

### Data Consistency

#### Booking Management
```javascript
// Atomic booking creation
const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Validate service exists and is active
      const service = await Service.findById(req.body.serviceId).session(session);
      
      if (!service || !service.isActive) {
        throw new Error('Service not available');
      }
      
      // Check for conflicting bookings
      const existingBooking = await Booking.findOne({
        service: req.body.serviceId,
        bookingDate: new Date(req.body.bookingDate),
        status: { $in: ['pending', 'confirmed', 'in_progress'] }
      }).session(session);
      
      if (existingBooking) {
        throw new Error('Service already booked for this time');
      }
      
      // Create booking
      const booking = await Booking.create([{
        service: req.body.serviceId,
        client: req.user.id,
        provider: service.provider,
        bookingDate: new Date(req.body.bookingDate),
        duration: req.body.duration,
        address: req.body.address,
        specialInstructions: req.body.specialInstructions,
        pricing: {
          basePrice: service.pricing.basePrice,
          totalAmount: calculateTotalAmount(service, req.body.duration),
          currency: service.pricing.currency
        },
        payment: {
          method: req.body.paymentMethod || 'cash',
          status: 'pending'
        }
      }], { session });
      
      // Update service booking count
      await Service.findByIdAndUpdate(
        req.body.serviceId,
        { $inc: { 'rating.count': 1 } },
        { session }
      );
    });
    
    res.json({ success: true, message: 'Booking created successfully' });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    await session.endSession();
  }
};
```

#### Rating Calculation
```javascript
// Automatic rating calculation
const calculateServiceRating = async (serviceId) => {
  try {
    const service = await Service.findById(serviceId);
    if (!service) return;
    
    // Get all completed bookings with reviews
    const bookings = await Booking.find({
      service: serviceId,
      status: 'completed',
      'review.rating': { $exists: true }
    });
    
    if (bookings.length === 0) {
      service.rating.average = 0;
      service.rating.count = 0;
    } else {
      const totalRating = bookings.reduce((sum, booking) => sum + booking.review.rating, 0);
      service.rating.average = totalRating / bookings.length;
      service.rating.count = bookings.length;
    }
    
    await service.save();
  } catch (error) {
    console.error('Error calculating service rating:', error);
  }
};

// Update rating when review is added
const addReview = async (req, res) => {
  try {
    const { rating, comment, categories } = req.body;
    const bookingId = req.params.id;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Add review
    booking.review = {
      rating,
      comment,
      categories,
      createdAt: new Date()
    };
    
    await booking.save();
    
    // Update service rating
    await calculateServiceRating(booking.service);
    
    res.json({
      success: true,
      message: 'Review added successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
```

### Data Archiving

#### Soft Delete Implementation
```javascript
// Soft delete for services
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Soft delete - set isActive to false
    service.isActive = false;
    await service.save();
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
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

class BookingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BookingError';
    this.statusCode = 409;
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
    error = new Error(message);
    error.statusCode = 404;
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate booking';
    error = new BookingError(message);
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

## 📱 Frontend Integration

### State Management

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
    const provider = await User.create({
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
      provider: provider._id,
      pricing: {
        type: 'hourly',
        basePrice: 25
      },
      serviceArea: ['10001', '10002']
    };
    
    const service = await Service.create(serviceData);
    
    expect(service.title).toBe(serviceData.title);
    expect(service.provider).toEqual(provider._id);
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
        basePrice: 25
      },
      serviceArea: ['10001']
    };
    
    await expect(Service.create(serviceData)).rejects.toThrow();
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

### Business Analytics

#### Service Analytics
```javascript
// Analytics aggregation
const getServiceAnalytics = async (dateRange) => {
  const { startDate, endDate } = dateRange;
  
  const analytics = await Service.aggregate([
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
          category: '$category',
          subcategory: '$subcategory'
        },
        count: { $sum: 1 },
        averageRating: { $avg: '$rating.average' },
        totalBookings: { $sum: '$rating.count' },
        averagePrice: { $avg: '$pricing.basePrice' }
      }
    }
  ]);
  
  return analytics;
};
```

---

*These best practices ensure robust, secure, and performant implementation of the Services feature. Regular review and updates of these practices are recommended as the system evolves.*
