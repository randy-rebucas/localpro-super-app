# Rentals Best Practices

This document outlines best practices and guidelines for developing and maintaining the rentals feature in the LocalPro Super App.

## Table of Contents

- [Overview](#overview)
- [Development Guidelines](#development-guidelines)
- [Performance Best Practices](#performance-best-practices)
- [Security Considerations](#security-considerations)
- [Testing Strategies](#testing-strategies)
- [Monitoring and Logging](#monitoring-and-logging)
- [Code Organization](#code-organization)

## Overview

Following these best practices ensures maintainable, performant, and secure rentals functionality while providing a great user experience.

## Development Guidelines

### 1. Data Validation

#### Always Validate Input
```javascript
// ✅ Good: Comprehensive validation
const validateRentalItem = (data) => {
  const errors = [];
  
  // Required fields
  if (!data.name?.trim()) errors.push('Name is required');
  if (!data.title?.trim()) errors.push('Title is required');
  if (!data.description?.trim()) errors.push('Description is required');
  if (!data.category || !['tools', 'vehicles', 'equipment', 'machinery'].includes(data.category)) {
    errors.push('Valid category is required');
  }
  
  // Pricing validation
  if (!data.pricing?.daily || data.pricing.daily <= 0) {
    errors.push('Valid daily pricing is required');
  }
  
  // Date validation
  if (data.availability?.schedule) {
    data.availability.schedule.forEach(slot => {
      if (slot.startDate && slot.endDate) {
        const start = new Date(slot.startDate);
        const end = new Date(slot.endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          errors.push('Invalid date format in availability schedule');
        } else if (start >= end) {
          errors.push('Start date must be before end date in availability schedule');
        }
      }
    });
  }
  
  // Requirements validation
  if (data.requirements?.minAge && data.requirements.minAge < 18) {
    errors.push('Minimum age must be at least 18');
  }
  
  return errors;
};

// ❌ Bad: Minimal validation
const createRentalItem = (data) => {
  // No validation - prone to errors
  return new RentalItem(data);
};
```

#### Use Mongoose Validation
```javascript
// ✅ Good: Leverage Mongoose validation
const rentalItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  pricing: {
    daily: {
      type: Number,
      required: [true, 'Daily pricing is required'],
      min: [1, 'Daily pricing must be at least $1']
    }
  },
  requirements: {
    minAge: {
      type: Number,
      min: [18, 'Minimum age must be at least 18']
    }
  }
});

// ❌ Bad: No schema validation
const rentalItemSchema = new mongoose.Schema({
  name: String,
  pricing: Number
});
```

### 2. Error Handling

#### Consistent Error Responses
```javascript
// ✅ Good: Consistent error handling
const handleRentalError = (error, res) => {
  console.error('Rental operation error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry found'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

// ❌ Bad: Inconsistent error handling
const createRentalItem = async (req, res) => {
  try {
    // ... logic
  } catch (error) {
    res.status(500).send('Error'); // Not helpful
  }
};
```

#### Use Try-Catch Blocks
```javascript
// ✅ Good: Proper error handling
const createRentalItem = async (req, res) => {
  try {
    const validationErrors = validateRentalItem(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    const rentalItem = await RentalItem.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Rental item created successfully',
      data: rentalItem
    });
  } catch (error) {
    handleRentalError(error, res);
  }
};
```

### 3. Authorization and Security

#### Check User Permissions
```javascript
// ✅ Good: Proper authorization
const updateRentalItem = async (req, res) => {
  try {
    const rentalItem = await RentalItem.findById(req.params.id);
    
    if (!rentalItem) {
      return res.status(404).json({
        success: false,
        message: 'Rental item not found'
      });
    }
    
    // Check if user owns the rental item
    if (rentalItem.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this rental item'
      });
    }
    
    const updatedItem = await RentalItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Rental item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    handleRentalError(error, res);
  }
};
```

#### Sanitize Input Data
```javascript
// ✅ Good: Sanitize user input
const sanitizeRentalData = (data) => {
  return {
    name: data.name?.trim(),
    title: data.title?.trim(),
    description: data.description?.trim(),
    pricing: {
      daily: parseFloat(data.pricing?.daily) || 0,
      currency: data.pricing?.currency || 'USD'
    },
    tags: data.tags?.map(tag => tag.trim()).filter(tag => tag.length > 0) || []
  };
};
```

## Performance Best Practices

### 1. Database Optimization

#### Use Proper Indexing
```javascript
// ✅ Good: Strategic indexing
const rentalItemSchema = new mongoose.Schema({
  // ... fields
});

// Create indexes for common queries
rentalItemSchema.index({ category: 1, subcategory: 1 });
rentalItemSchema.index({ owner: 1 });
rentalItemSchema.index({ isActive: 1 });
rentalItemSchema.index({ 'location.coordinates': '2dsphere' });
rentalItemSchema.index({ 'pricing.daily': 1 });
rentalItemSchema.index({ averageRating: -1 });
rentalItemSchema.index({ tags: 1 });
rentalItemSchema.index({ name: 'text', title: 'text', description: 'text' });
```

#### Optimize Queries
```javascript
// ✅ Good: Efficient queries
const getRentalItems = async (filters) => {
  const query = { isActive: true };
  
  // Apply filters efficiently
  if (filters.category) query.category = filters.category;
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  return await RentalItem.find(query)
    .populate('owner', 'firstName lastName profile.avatar')
    .select('name title category pricing rating averageRating')
    .sort({ createdAt: -1 })
    .lean(); // Use lean() for read-only operations
};

// ❌ Bad: Inefficient queries
const getRentalItems = async () => {
  return await RentalItem.find({ isActive: true })
    .populate('owner') // Populating all fields
    .sort({ createdAt: -1 }); // No field selection
};
```

#### Use Aggregation for Complex Queries
```javascript
// ✅ Good: Use aggregation for analytics
const getRentalAnalytics = async (ownerId) => {
  return await RentalItem.aggregate([
    { $match: { owner: ownerId, isActive: true } },
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalBookings: { $sum: { $size: '$bookings' } },
        averageRating: { $avg: '$averageRating' },
        totalRevenue: { $sum: { $sum: '$bookings.totalCost' } }
      }
    },
    {
      $sort: { totalItems: -1 }
    }
  ]);
};
```

### 2. Caching Strategies

#### Implement Redis Caching
```javascript
// ✅ Good: Cache frequently accessed data
const redis = require('redis');
const client = redis.createClient();

const getCachedFeaturedRentals = async () => {
  const cacheKey = 'featured_rentals';
  
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const rentals = await RentalItem.find({ isFeatured: true, isActive: true })
      .populate('owner', 'firstName lastName profile.avatar')
      .lean();
    
    await client.setex(cacheKey, 300, JSON.stringify(rentals)); // 5 min cache
    return rentals;
  } catch (error) {
    console.error('Cache error:', error);
    // Fallback to database
    return await RentalItem.find({ isFeatured: true, isActive: true });
  }
};
```

#### Cache Invalidation
```javascript
// ✅ Good: Invalidate cache when data changes
const updateRentalItem = async (rentalItemId, updateData) => {
  const rentalItem = await RentalItem.findByIdAndUpdate(rentalItemId, updateData, { new: true });
  
  // Invalidate related caches
  await client.del('featured_rentals');
  await client.del('rental_categories');
  await client.del(`rental_item_${rentalItemId}`);
  
  return rentalItem;
};
```

### 3. Pagination

#### Implement Efficient Pagination
```javascript
// ✅ Good: Efficient pagination
const getPaginatedRentalItems = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;
  const query = buildQuery(filters);
  
  const [rentalItems, total] = await Promise.all([
    RentalItem.find(query)
      .populate('owner', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    RentalItem.countDocuments(query)
  ]);
  
  return {
    rentalItems,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

## Security Considerations

### 1. Input Validation

#### Validate All Inputs
```javascript
// ✅ Good: Comprehensive input validation
const validateRentalInput = (data) => {
  const errors = [];
  
  // XSS prevention
  if (data.name && typeof data.name === 'string') {
    data.name = data.name.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  // SQL injection prevention (Mongoose handles this, but good to be explicit)
  if (data.search) {
    data.search = data.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  // Price validation
  if (data.pricing?.daily && (isNaN(data.pricing.daily) || data.pricing.daily < 0)) {
    errors.push('Invalid pricing data');
  }
  
  return errors;
};
```

#### Rate Limiting
```javascript
// ✅ Good: Implement rate limiting
const rateLimit = require('express-rate-limit');

const rentalCreationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 rental creations per windowMs
  message: 'Too many rental creations, please try again later'
});

const bookingLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 bookings per windowMs
  message: 'Too many booking attempts, please try again later'
});

app.post('/api/rentals', rentalCreationLimit, createRentalItem);
app.post('/api/rentals/:id/book', bookingLimit, bookRental);
```

### 2. Data Protection

#### Sanitize Sensitive Data
```javascript
// ✅ Good: Remove sensitive data from responses
const sanitizeRentalResponse = (rentalItem) => {
  const sanitized = rentalItem.toObject();
  
  // Remove internal fields
  delete sanitized.internalNotes;
  delete sanitized.adminComments;
  
  // Sanitize owner data
  if (sanitized.owner && sanitized.owner.profile) {
    delete sanitized.owner.profile.phone;
    delete sanitized.owner.profile.address;
  }
  
  return sanitized;
};
```

#### Validate File Uploads
```javascript
// ✅ Good: Validate file uploads
const validateImageUpload = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }
  
  return true;
};
```

## Testing Strategies

### 1. Unit Tests

#### Test Individual Functions
```javascript
// ✅ Good: Comprehensive unit tests
describe('Rental Item Creation', () => {
  test('should create rental item with valid data', async () => {
    const itemData = {
      name: 'Test Drill',
      title: 'Test Drill Set',
      description: 'Test Description',
      category: 'tools',
      subcategory: 'power_tools',
      pricing: { daily: 50 },
      owner: '64a1b2c3d4e5f6789012346'
    };
    
    const rentalItem = await createRentalItem(itemData);
    
    expect(rentalItem.name).toBe('Test Drill');
    expect(rentalItem.category).toBe('tools');
    expect(rentalItem.isActive).toBe(true);
  });
  
  test('should throw error for invalid data', async () => {
    const invalidData = {
      name: '', // Invalid: empty name
      pricing: { daily: -50 } // Invalid: negative pricing
    };
    
    await expect(createRentalItem(invalidData)).rejects.toThrow();
  });
});
```

### 2. Integration Tests

#### Test API Endpoints
```javascript
// ✅ Good: Test API endpoints
describe('Rentals API', () => {
  test('GET /api/rentals should return paginated rental items', async () => {
    const response = await request(app)
      .get('/api/rentals')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body).toHaveProperty('pagination');
  });
  
  test('POST /api/rentals should create new rental item', async () => {
    const itemData = {
      name: 'Test Drill',
      title: 'Test Drill Set',
      description: 'Test Description',
      category: 'tools',
      subcategory: 'power_tools',
      pricing: { daily: 50 }
    };
    
    const response = await request(app)
      .post('/api/rentals')
      .set('Authorization', `Bearer ${validToken}`)
      .send(itemData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Test Drill');
  });
});
```

## Monitoring and Logging

### 1. Structured Logging

#### Use Structured Logs
```javascript
// ✅ Good: Structured logging
const logger = require('winston');

const logRentalOperation = (operation, rentalItemId, userId, metadata = {}) => {
  logger.info('Rental operation', {
    operation,
    rentalItemId,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Usage
const createRentalItem = async (req, res) => {
  try {
    logRentalOperation('create_rental_item', null, req.user.id, { 
      name: req.body.name,
      category: req.body.category 
    });
    
    const rentalItem = await RentalItem.create(req.body);
    
    logRentalOperation('create_rental_item_success', rentalItem._id, req.user.id);
    res.json({ success: true, data: rentalItem });
  } catch (error) {
    logRentalOperation('create_rental_item_error', null, req.user.id, { 
      error: error.message 
    });
    handleRentalError(error, res);
  }
};
```

### 2. Performance Monitoring

#### Track Performance Metrics
```javascript
// ✅ Good: Performance monitoring
const trackRentalPerformance = async (operation, fn) => {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logger.info('Rental operation performance', {
      operation,
      duration,
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Rental operation performance', {
      operation,
      duration,
      success: false,
      error: error.message
    });
    
    throw error;
  }
};
```

## Code Organization

### 1. Modular Structure

#### Organize by Feature
```
src/
├── features/
│   └── rentals/
│       ├── controllers/
│       ├── models/
│       ├── services/
│       ├── routes/
│       └── middleware/
```

#### Separate Concerns
```javascript
// ✅ Good: Separate concerns
// controllers/rentalsController.js
const createRentalItem = async (req, res) => {
  try {
    const rentalItem = await rentalService.createRentalItem(req.body, req.user.id);
    res.json({ success: true, data: rentalItem });
  } catch (error) {
    handleRentalError(error, res);
  }
};

// services/rentalService.js
const createRentalItem = async (itemData, userId) => {
  const validationErrors = validateRentalItemData(itemData);
  if (validationErrors.length > 0) {
    throw new ValidationError(validationErrors);
  }
  
  const rentalItem = new RentalItem({ ...itemData, owner: userId });
  return await rentalItem.save();
};
```

### 2. Configuration Management

#### Use Environment Variables
```javascript
// ✅ Good: Environment-based configuration
const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  rentals: {
    maxImagesPerItem: process.env.MAX_IMAGES_PER_ITEM || 10,
    cacheTimeout: process.env.RENTALS_CACHE_TIMEOUT || 300,
    maxBookingDuration: process.env.MAX_BOOKING_DURATION || 30 // days
  }
};
```

Following these best practices ensures your rentals feature is robust, performant, and maintainable while providing an excellent user experience.
