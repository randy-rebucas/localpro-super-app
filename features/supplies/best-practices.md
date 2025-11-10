# Supplies Best Practices

## Overview

This document outlines best practices, development guidelines, and architectural patterns for working with the Supplies feature. Following these practices ensures maintainable, performant, and secure code.

## 🏗️ Architecture Patterns

### Data Modeling Best Practices

#### 1. Schema Design Principles

```javascript
// ✅ Good: Comprehensive field validation
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: /^[A-Z0-9-]+$/
  },
  pricing: {
    retailPrice: {
      type: Number,
      required: true,
      min: 0,
      set: v => Math.round(v * 100) / 100 // Round to 2 decimal places
    }
  }
});

// ❌ Bad: Minimal validation
const badSchema = new mongoose.Schema({
  name: String,
  price: Number
});
```

#### 2. Index Strategy

```javascript
// ✅ Good: Compound indexes for common queries
productSchema.index({ category: 1, subcategory: 1, isActive: 1 });
productSchema.index({ supplier: 1, isActive: 1, category: 1 });
productSchema.index({ 'pricing.retailPrice': 1, category: 1, isActive: 1 });

// ✅ Good: Text search index
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text'
});

// ❌ Bad: Too many single-field indexes
productSchema.index({ name: 1 });
productSchema.index({ description: 1 });
productSchema.index({ brand: 1 });
// ... many more single indexes
```

#### 3. Embedded vs Referenced Data

```javascript
// ✅ Good: Embed orders for better performance
const productSchema = new mongoose.Schema({
  orders: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    quantity: Number,
    totalCost: Number,
    status: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

// ✅ Good: Reference for large, independent entities
const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' } }]
});
```

### API Design Patterns

#### 1. Consistent Response Format

```javascript
// ✅ Good: Standardized response structure
const sendResponse = (res, statusCode, data, message = 'Success') => {
  res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Usage
sendResponse(res, 200, products, 'Products retrieved successfully');
sendResponse(res, 404, null, 'Product not found');
```

#### 2. Error Handling

```javascript
// ✅ Good: Comprehensive error handling
const getProduct = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return sendResponse(res, 400, null, 'Invalid product ID format');
    }

    const product = await Product.findById(req.params.id)
      .populate('supplier', 'firstName lastName profile.avatar');

    if (!product) {
      return sendResponse(res, 404, null, 'Product not found');
    }

    if (!product.isActive) {
      return sendResponse(res, 410, null, 'Product no longer available');
    }

    sendResponse(res, 200, product, 'Product retrieved successfully');
  } catch (error) {
    console.error('Get product error:', error);
    sendResponse(res, 500, null, 'Internal server error');
  }
};
```

#### 3. Input Validation

```javascript
// ✅ Good: Comprehensive input validation
const validateProductData = (data) => {
  const errors = [];

  // Required fields
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Product name is required');
  }

  if (!data.sku || !/^[A-Z0-9-]+$/.test(data.sku)) {
    errors.push('SKU must be uppercase alphanumeric with hyphens only');
  }

  if (!data.pricing?.retailPrice || data.pricing.retailPrice <= 0) {
    errors.push('Retail price must be greater than 0');
  }

  if (!data.inventory?.quantity || data.inventory.quantity < 0) {
    errors.push('Inventory quantity cannot be negative');
  }

  // Category validation
  const validCategories = ['cleaning_supplies', 'tools', 'materials', 'equipment'];
  if (!validCategories.includes(data.category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }

  return errors;
};
```

## 🔒 Security Best Practices

### 1. Authentication and Authorization

```javascript
// ✅ Good: Role-based access control
const authorizeSupplier = (req, res, next) => {
  if (req.user.role !== 'supplier' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Supplier role required.'
    });
  }
  next();
};

// ✅ Good: Resource ownership validation
const checkProductOwnership = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.supplier.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this product'
      });
    }

    req.product = product;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
```

### 2. Input Sanitization

```javascript
// ✅ Good: Sanitize user input
const sanitizeProductData = (data) => {
  return {
    name: data.name?.trim(),
    description: data.description?.trim(),
    sku: data.sku?.toUpperCase().trim(),
    pricing: {
      retailPrice: parseFloat(data.pricing?.retailPrice) || 0,
      wholesalePrice: parseFloat(data.pricing?.wholesalePrice) || 0,
      currency: data.pricing?.currency || 'USD'
    },
    tags: Array.isArray(data.tags) ? data.tags.map(tag => tag.trim()) : []
  };
};
```

### 3. Rate Limiting

```javascript
// ✅ Good: Implement rate limiting
const rateLimit = require('express-rate-limit');

const productCreationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 product creations per windowMs
  message: {
    success: false,
    message: 'Too many products created, please try again later.'
  }
});

const orderLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 orders per minute
  message: {
    success: false,
    message: 'Too many orders placed, please try again later.'
  }
});

// Apply to routes
app.post('/api/supplies', productCreationLimit, createProduct);
app.post('/api/supplies/:id/order', orderLimit, placeOrder);
```

## ⚡ Performance Optimization

### 1. Database Query Optimization

```javascript
// ✅ Good: Optimized queries with proper indexing
const getProductsWithFilters = async (filters) => {
  const query = { isActive: true };
  
  // Use indexed fields for filtering
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.minPrice || filters.maxPrice) {
    query['pricing.retailPrice'] = {};
    if (filters.minPrice) query['pricing.retailPrice'].$gte = filters.minPrice;
    if (filters.maxPrice) query['pricing.retailPrice'].$lte = filters.maxPrice;
  }

  // Use projection to limit returned fields
  const products = await Product.find(query)
    .select('name title category pricing images supplier averageRating')
    .populate('supplier', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 })
    .limit(filters.limit || 20);

  return products;
};

// ❌ Bad: Inefficient queries
const badQuery = async () => {
  // No filtering, loads all products
  const products = await Product.find({});
  
  // No projection, loads all fields
  const fullProducts = await Product.find({}).populate('supplier');
  
  // No sorting or limiting
  return products;
};
```

### 2. Caching Strategy

```javascript
// ✅ Good: Implement caching for frequently accessed data
const getFeaturedProducts = async () => {
  const cacheKey = 'featured_products';
  
  try {
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const products = await Product.find({
      isActive: true,
      isFeatured: true
    })
    .populate('supplier', 'firstName lastName profile.avatar')
    .sort({ createdAt: -1 })
    .limit(10);

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(products));
    
    return products;
  } catch (error) {
    console.error('Cache error:', error);
    // Fallback to database
    return await Product.find({ isActive: true, isFeatured: true });
  }
};
```

### 3. Pagination Best Practices

```javascript
// ✅ Good: Cursor-based pagination for large datasets
const getProductsWithCursor = async (cursor, limit = 20) => {
  const query = { isActive: true };
  
  if (cursor) {
    query._id = { $lt: cursor };
  }

  const products = await Product.find(query)
    .populate('supplier', 'firstName lastName profile.avatar')
    .sort({ _id: -1 })
    .limit(limit + 1);

  const hasNext = products.length > limit;
  const data = hasNext ? products.slice(0, -1) : products;
  const nextCursor = hasNext ? data[data.length - 1]._id : null;

  return {
    data,
    hasNext,
    nextCursor
  };
};

// ✅ Good: Offset-based pagination for smaller datasets
const getProductsWithOffset = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  
  const [products, total] = await Promise.all([
    Product.find({ isActive: true })
      .populate('supplier', 'firstName lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments({ isActive: true })
  ]);

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

## 🔄 Data Consistency

### 1. Transaction Management

```javascript
// ✅ Good: Use transactions for critical operations
const processOrder = async (orderData) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Create order
      const order = await Order.create([orderData], { session });
      
      // Update inventory for each item
      for (const item of orderData.items) {
        const product = await Product.findById(item.product);
        
        if (product.inventory.quantity < item.quantity) {
          throw new Error('Insufficient inventory');
        }
        
        product.inventory.quantity -= item.quantity;
        await product.save({ session });
      }
      
      return order;
    });
  } finally {
    await session.endSession();
  }
};
```

### 2. Data Validation

```javascript
// ✅ Good: Comprehensive validation middleware
const validateProductCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  body('sku')
    .trim()
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('SKU must be uppercase alphanumeric with hyphens only'),
  
  body('pricing.retailPrice')
    .isFloat({ min: 0 })
    .withMessage('Retail price must be a positive number'),
  
  body('inventory.quantity')
    .isInt({ min: 0 })
    .withMessage('Inventory quantity must be a non-negative integer'),
  
  body('category')
    .isIn(['cleaning_supplies', 'tools', 'materials', 'equipment'])
    .withMessage('Invalid category'),
  
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

## 📊 Monitoring and Logging

### 1. Structured Logging

```javascript
// ✅ Good: Structured logging with context
const logger = require('winston');

const logProductAction = (action, productId, userId, additionalData = {}) => {
  logger.info('Product action', {
    action,
    productId,
    userId,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
};

// Usage
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    logProductAction('create', product._id, req.user.id, {
      category: product.category,
      supplier: product.supplier
    });
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Product creation failed', {
      error: error.message,
      userId: req.user.id,
      productData: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Product creation failed'
    });
  }
};
```

### 2. Performance Monitoring

```javascript
// ✅ Good: Performance monitoring
const monitorQueryPerformance = (queryName) => {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (duration > 1000) { // Log slow queries
        logger.warn('Slow query detected', {
          query: queryName,
          duration,
          url: req.url,
          method: req.method
        });
      }
      
      // Send metrics to monitoring service
      metrics.timing(`query.${queryName}.duration`, duration);
    });
    
    next();
  };
};

// Usage
app.get('/api/supplies', monitorQueryPerformance('getSupplies'), getSupplies);
```

## 🧪 Testing Best Practices

### 1. Unit Testing

```javascript
// ✅ Good: Comprehensive unit tests
describe('Product Model', () => {
  describe('Validation', () => {
    it('should require name field', async () => {
      const product = new Product({});
      const error = product.validateSync();
      expect(error.errors.name).toBeDefined();
    });

    it('should validate SKU format', async () => {
      const product = new Product({
        name: 'Test Product',
        sku: 'invalid-sku!',
        category: 'cleaning_supplies',
        pricing: { retailPrice: 10 },
        inventory: { quantity: 5 }
      });
      const error = product.validateSync();
      expect(error.errors.sku).toBeDefined();
    });
  });

  describe('Methods', () => {
    it('should calculate total revenue correctly', () => {
      const product = new Product({
        orders: [
          { totalCost: 100, status: 'delivered' },
          { totalCost: 50, status: 'delivered' },
          { totalCost: 25, status: 'pending' }
        ]
      });
      
      expect(product.getTotalRevenue()).toBe(150);
    });
  });
});
```

### 2. Integration Testing

```javascript
// ✅ Good: API integration tests
describe('Supplies API', () => {
  describe('GET /api/supplies', () => {
    it('should return paginated products', async () => {
      // Create test products
      await Product.create([
        { name: 'Product 1', category: 'cleaning_supplies', /* ... */ },
        { name: 'Product 2', category: 'tools', /* ... */ }
      ]);

      const response = await request(app)
        .get('/api/supplies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/supplies?category=cleaning_supplies')
        .expect(200);

      expect(response.body.data.every(p => p.category === 'cleaning_supplies')).toBe(true);
    });
  });
});
```

## 🚀 Deployment Considerations

### 1. Environment Configuration

```javascript
// ✅ Good: Environment-specific configuration
const config = {
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 5
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  }
};
```

### 2. Health Checks

```javascript
// ✅ Good: Comprehensive health checks
const healthCheck = async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    cloudinary: false
  };

  try {
    // Check database
    await mongoose.connection.db.admin().ping();
    checks.database = true;
  } catch (error) {
    logger.error('Database health check failed', error);
  }

  try {
    // Check Redis
    await redis.ping();
    checks.redis = true;
  } catch (error) {
    logger.error('Redis health check failed', error);
  }

  try {
    // Check Cloudinary
    await cloudinary.api.ping();
    checks.cloudinary = true;
  } catch (error) {
    logger.error('Cloudinary health check failed', error);
  }

  const isHealthy = Object.values(checks).every(check => check);
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
};
```

## 📝 Documentation Standards

### 1. API Documentation

```javascript
/**
 * @desc    Get all supplies with filtering and pagination
 * @route   GET /api/supplies
 * @access  Public
 * @param   {string} search - Text search query
 * @param   {string} category - Product category filter
 * @param   {number} minPrice - Minimum price filter
 * @param   {number} maxPrice - Maximum price filter
 * @param   {number} page - Page number for pagination
 * @param   {number} limit - Items per page
 * @param   {string} sortBy - Sort field (createdAt, price, rating)
 * @param   {string} sortOrder - Sort direction (asc, desc)
 * @returns {Object} Paginated list of products
 */
const getSupplies = async (req, res) => {
  // Implementation...
};
```

### 2. Code Comments

```javascript
// ✅ Good: Clear, concise comments
const updateInventoryAfterOrder = async (productId, orderQuantity) => {
  // Get product with current inventory
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  // Validate sufficient inventory before updating
  if (product.inventory.quantity < orderQuantity) {
    throw new Error('Insufficient inventory');
  }

  // Update inventory atomically
  product.inventory.quantity -= orderQuantity;
  
  // Check for low stock alert threshold
  if (product.inventory.quantity <= product.inventory.minStock) {
    await sendLowStockAlert(product);
  }

  await product.save();
  
  return product;
};
```

---

*Following these best practices ensures your Supplies feature implementation is robust, maintainable, and performant. Always consider your specific use case and requirements when applying these patterns.*
