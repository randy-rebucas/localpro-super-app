# Ads Best Practices

This document outlines best practices and guidelines for developing and maintaining the ads feature in the LocalPro Super App.

## Table of Contents

- [Overview](#overview)
- [Development Guidelines](#development-guidelines)
- [Performance Best Practices](#performance-best-practices)
- [Security Considerations](#security-considerations)
- [Testing Strategies](#testing-strategies)
- [Monitoring and Logging](#monitoring-and-logging)
- [Code Organization](#code-organization)

## Overview

Following these best practices ensures maintainable, performant, and secure ads functionality while providing a great user experience.

## Development Guidelines

### 1. Data Validation

#### Always Validate Input
```javascript
// ✅ Good: Comprehensive validation
const validateAdCampaign = (data) => {
  const errors = [];
  
  // Required fields
  if (!data.title?.trim()) errors.push('Title is required');
  if (!data.description?.trim()) errors.push('Description is required');
  if (!data.budget?.total || data.budget.total <= 0) {
    errors.push('Valid budget total is required');
  }
  
  // Enum validation
  const validTypes = ['banner', 'sponsored_listing', 'video', 'text', 'interactive'];
  if (!validTypes.includes(data.type)) {
    errors.push(`Type must be one of: ${validTypes.join(', ')}`);
  }
  
  // Date validation
  if (data.schedule?.startDate && data.schedule?.endDate) {
    const startDate = new Date(data.schedule.startDate);
    const endDate = new Date(data.schedule.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      errors.push('Invalid date format');
    } else if (startDate >= endDate) {
      errors.push('Start date must be before end date');
    }
  }
  
  return errors;
};

// ❌ Bad: Minimal validation
const createAd = (data) => {
  // No validation - prone to errors
  return new AdCampaign(data);
};
```

#### Use Mongoose Validation
```javascript
// ✅ Good: Leverage Mongoose validation
const adSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  budget: {
    total: {
      type: Number,
      required: [true, 'Budget total is required'],
      min: [1, 'Budget must be at least $1']
    }
  }
});

// ❌ Bad: No schema validation
const adSchema = new mongoose.Schema({
  title: String,
  budget: Number
});
```

### 2. Error Handling

#### Consistent Error Responses
```javascript
// ✅ Good: Consistent error handling
const handleAdError = (error, res) => {
  console.error('Ad operation error:', error);
  
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
  
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

// ❌ Bad: Inconsistent error handling
const createAd = async (req, res) => {
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
const createAdCampaign = async (req, res) => {
  try {
    const validationErrors = validateAdCampaign(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    const ad = await AdCampaign.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      data: ad
    });
  } catch (error) {
    handleAdError(error, res);
  }
};
```

### 3. Authorization and Security

#### Check User Permissions
```javascript
// ✅ Good: Proper authorization
const updateAd = async (req, res) => {
  try {
    const ad = await AdCampaign.findById(req.params.id);
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }
    
    // Check if user owns the ad
    if (ad.advertiser.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ad'
      });
    }
    
    const updatedAd = await AdCampaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Ad updated successfully',
      data: updatedAd
    });
  } catch (error) {
    handleAdError(error, res);
  }
};
```

#### Sanitize Input Data
```javascript
// ✅ Good: Sanitize user input
const sanitizeAdData = (data) => {
  return {
    title: data.title?.trim(),
    description: data.description?.trim(),
    budget: {
      total: parseFloat(data.budget?.total) || 0,
      currency: data.budget?.currency || 'USD'
    }
  };
};
```

## Performance Best Practices

### 1. Database Optimization

#### Use Proper Indexing
```javascript
// ✅ Good: Strategic indexing
const adSchema = new mongoose.Schema({
  // ... fields
});

// Create indexes for common queries
adSchema.index({ advertiser: 1 });
adSchema.index({ category: 1 });
adSchema.index({ status: 1 });
adSchema.index({ isActive: 1 });
adSchema.index({ isFeatured: 1 });
adSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
adSchema.index({ title: 'text', description: 'text' });
```

#### Optimize Queries
```javascript
// ✅ Good: Efficient queries
const getActiveAds = async (filters) => {
  const query = { isActive: true };
  
  // Apply filters efficiently
  if (filters.category) query.category = filters.category;
  if (filters.search) {
    query.$or = [
      { title: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') }
    ];
  }
  
  return await AdCampaign.find(query)
    .populate('advertiser', 'firstName lastName profile.avatar')
    .select('title description type category status createdAt')
    .sort({ createdAt: -1 })
    .lean(); // Use lean() for read-only operations
};

// ❌ Bad: Inefficient queries
const getActiveAds = async () => {
  return await AdCampaign.find({ isActive: true })
    .populate('advertiser') // Populating all fields
    .sort({ createdAt: -1 }); // No field selection
};
```

#### Use Aggregation for Complex Queries
```javascript
// ✅ Good: Use aggregation for analytics
const getAdAnalytics = async (campaignId) => {
  return await AdImpression.aggregate([
    { $match: { campaign: campaignId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
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

const getCachedFeaturedAds = async () => {
  const cacheKey = 'featured_ads';
  
  try {
    const cached = await client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const ads = await AdCampaign.find({ isFeatured: true, isActive: true })
      .populate('advertiser', 'firstName lastName profile.avatar')
      .lean();
    
    await client.setex(cacheKey, 300, JSON.stringify(ads)); // 5 min cache
    return ads;
  } catch (error) {
    console.error('Cache error:', error);
    // Fallback to database
    return await AdCampaign.find({ isFeatured: true, isActive: true });
  }
};
```

#### Cache Invalidation
```javascript
// ✅ Good: Invalidate cache when data changes
const updateAd = async (adId, updateData) => {
  const ad = await AdCampaign.findByIdAndUpdate(adId, updateData, { new: true });
  
  // Invalidate related caches
  await client.del('featured_ads');
  await client.del('ad_categories');
  
  return ad;
};
```

### 3. Pagination

#### Implement Efficient Pagination
```javascript
// ✅ Good: Efficient pagination
const getPaginatedAds = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;
  const query = buildQuery(filters);
  
  const [ads, total] = await Promise.all([
    AdCampaign.find(query)
      .populate('advertiser', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AdCampaign.countDocuments(query)
  ]);
  
  return {
    ads,
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
const validateAdInput = (data) => {
  const errors = [];
  
  // XSS prevention
  if (data.title && typeof data.title === 'string') {
    data.title = data.title.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  // SQL injection prevention (Mongoose handles this, but good to be explicit)
  if (data.search) {
    data.search = data.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  return errors;
};
```

#### Rate Limiting
```javascript
// ✅ Good: Implement rate limiting
const rateLimit = require('express-rate-limit');

const adCreationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 ad creations per windowMs
  message: 'Too many ad creations, please try again later'
});

app.post('/api/ads', adCreationLimit, createAd);
```

### 2. Data Protection

#### Sanitize Sensitive Data
```javascript
// ✅ Good: Remove sensitive data from responses
const sanitizeAdResponse = (ad) => {
  const sanitized = ad.toObject();
  
  // Remove internal fields
  delete sanitized.internalNotes;
  delete sanitized.adminComments;
  
  return sanitized;
};
```

## Testing Strategies

### 1. Unit Tests

#### Test Individual Functions
```javascript
// ✅ Good: Comprehensive unit tests
describe('Ad Campaign Creation', () => {
  test('should create ad campaign with valid data', async () => {
    const adData = {
      title: 'Test Ad',
      description: 'Test Description',
      type: 'banner',
      category: 'hardware_stores',
      budget: { total: 1000 },
      schedule: {
        startDate: new Date('2023-07-01'),
        endDate: new Date('2023-07-31')
      }
    };
    
    const ad = await createAdCampaign(adData);
    
    expect(ad.title).toBe('Test Ad');
    expect(ad.status).toBe('draft');
    expect(ad.isActive).toBe(true);
  });
  
  test('should throw error for invalid data', async () => {
    const invalidData = {
      title: '', // Invalid: empty title
      budget: { total: -100 } // Invalid: negative budget
    };
    
    await expect(createAdCampaign(invalidData)).rejects.toThrow();
  });
});
```

### 2. Integration Tests

#### Test API Endpoints
```javascript
// ✅ Good: Test API endpoints
describe('Ads API', () => {
  test('GET /api/ads should return paginated ads', async () => {
    const response = await request(app)
      .get('/api/ads')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body).toHaveProperty('pagination');
  });
  
  test('POST /api/ads should create new ad', async () => {
    const adData = {
      title: 'Test Ad',
      description: 'Test Description',
      type: 'banner',
      category: 'hardware_stores',
      budget: { total: 1000 },
      schedule: {
        startDate: new Date('2023-07-01'),
        endDate: new Date('2023-07-31')
      }
    };
    
    const response = await request(app)
      .post('/api/ads')
      .set('Authorization', `Bearer ${validToken}`)
      .send(adData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Test Ad');
  });
});
```

## Monitoring and Logging

### 1. Structured Logging

#### Use Structured Logs
```javascript
// ✅ Good: Structured logging
const logger = require('winston');

const logAdOperation = (operation, adId, userId, metadata = {}) => {
  logger.info('Ad operation', {
    operation,
    adId,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Usage
const createAd = async (req, res) => {
  try {
    logAdOperation('create_ad', null, req.user.id, { 
      title: req.body.title,
      category: req.body.category 
    });
    
    const ad = await AdCampaign.create(req.body);
    
    logAdOperation('create_ad_success', ad._id, req.user.id);
    res.json({ success: true, data: ad });
  } catch (error) {
    logAdOperation('create_ad_error', null, req.user.id, { 
      error: error.message 
    });
    handleAdError(error, res);
  }
};
```

### 2. Performance Monitoring

#### Track Performance Metrics
```javascript
// ✅ Good: Performance monitoring
const trackAdPerformance = async (operation, fn) => {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    logger.info('Ad operation performance', {
      operation,
      duration,
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Ad operation performance', {
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
│   └── ads/
│       ├── controllers/
│       ├── models/
│       ├── services/
│       ├── routes/
│       └── middleware/
```

#### Separate Concerns
```javascript
// ✅ Good: Separate concerns
// controllers/adsController.js
const createAd = async (req, res) => {
  try {
    const ad = await adService.createAd(req.body, req.user.id);
    res.json({ success: true, data: ad });
  } catch (error) {
    handleAdError(error, res);
  }
};

// services/adService.js
const createAd = async (adData, userId) => {
  const validationErrors = validateAdData(adData);
  if (validationErrors.length > 0) {
    throw new ValidationError(validationErrors);
  }
  
  const ad = new AdCampaign({ ...adData, advertiser: userId });
  return await ad.save();
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
  ads: {
    maxDailyBudget: process.env.MAX_DAILY_BUDGET || 10000,
    cacheTimeout: process.env.ADS_CACHE_TIMEOUT || 300
  }
};
```

Following these best practices ensures your ads feature is robust, performant, and maintainable while providing an excellent user experience.
