# Route Optimization Guide

## Issues Found in Current Routes

### 1. **Missing Rate Limiting**
- **Problem**: No rate limiting on sensitive endpoints
- **Impact**: Vulnerable to DDoS attacks and abuse
- **Solution**: Apply appropriate rate limiters

### 2. **Inconsistent Middleware Application**
- **Problem**: Some routes apply auth globally, others per route
- **Impact**: Security vulnerabilities and inconsistent behavior
- **Solution**: Standardize middleware application patterns

### 3. **Missing Input Validation**
- **Problem**: No validation middleware for route parameters
- **Impact**: Invalid data reaching controllers
- **Solution**: Add comprehensive validation middleware

### 4. **No Error Handling**
- **Problem**: No centralized error handling for routes
- **Impact**: Inconsistent error responses
- **Solution**: Add error handling middleware

### 5. **Missing File Upload Validation**
- **Problem**: No validation for uploaded files
- **Impact**: Security risks and storage issues
- **Solution**: Add file validation middleware

## Recommended Route Structure

### **Public Routes** (No Authentication)
```javascript
// Apply rate limiting
router.get('/public-endpoint', generalLimiter, controller);
```

### **Protected Routes** (Authentication Required)
```javascript
// Apply authentication
router.use(auth);

// Apply specific middleware per route
router.get('/protected-endpoint', 
  validatePaginationParams,
  controller
);
```

### **Admin Routes** (Authorization Required)
```javascript
// Apply authentication and authorization
router.get('/admin-endpoint', 
  auth,
  authorize('admin'),
  validateObjectIdParam('id'),
  controller
);
```

## Middleware Application Order

1. **Rate Limiting** - First (prevent abuse)
2. **Authentication** - Second (verify identity)
3. **Authorization** - Third (check permissions)
4. **Validation** - Fourth (validate inputs)
5. **Controller** - Last (business logic)

## Rate Limiting Configuration

### **Authentication Routes**
- `send-code`: 1 request/minute
- `verify-code`: 5 requests/15 minutes
- `login`: 5 requests/15 minutes

### **Search Routes**
- `search`: 30 requests/minute
- `jobs`: 30 requests/minute
- `services`: 30 requests/minute

### **Upload Routes**
- `upload`: 10 requests/minute
- `upload-avatar`: 5 requests/minute

### **General API Routes**
- `api/*`: 100 requests/15 minutes

## Validation Middleware

### **ObjectId Validation**
```javascript
router.get('/:id', validateObjectIdParam('id'), controller);
```

### **Pagination Validation**
```javascript
router.get('/', validatePaginationParams, controller);
```

### **Search Validation**
```javascript
router.get('/search', validateSearchParams, controller);
```

### **File Upload Validation**
```javascript
router.post('/upload', 
  uploader.single('file'),
  validateFileUpload({
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png']
  }),
  controller
);
```

## Error Handling

### **Async Error Wrapper**
```javascript
const handleAsyncErrors = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

router.get('/endpoint', handleAsyncErrors(controller));
```

### **Centralized Error Handler**
```javascript
app.use((error, req, res, next) => {
  if (error.name === 'ValidationError') {
    return sendValidationError(res, error.errors);
  }
  
  if (error.name === 'CastError') {
    return sendNotFoundError(res, 'Invalid ID format');
  }
  
  return sendServerError(res, error);
});
```

## Security Best Practices

### **1. Input Sanitization**
- Validate all inputs
- Sanitize user data
- Prevent injection attacks

### **2. File Upload Security**
- Validate file types
- Check file sizes
- Scan for malware

### **3. Rate Limiting**
- Apply appropriate limits
- Use Redis for distributed systems
- Monitor for abuse

### **4. Authentication**
- Verify tokens
- Check expiration
- Handle refresh tokens

### **5. Authorization**
- Check user roles
- Validate permissions
- Audit access

## Performance Optimizations

### **1. Middleware Order**
- Apply expensive middleware last
- Use early returns for validation
- Cache authentication results

### **2. Route Caching**
- Cache static responses
- Use ETags for conditional requests
- Implement proper cache headers

### **3. Database Optimization**
- Use lean queries
- Implement pagination
- Add proper indexing

## Monitoring and Logging

### **1. Request Logging**
```javascript
router.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});
```

### **2. Error Tracking**
```javascript
router.use((error, req, res, next) => {
  logger.error('Route error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  next(error);
});
```

### **3. Performance Monitoring**
```javascript
router.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed:', {
      path: req.path,
      method: req.method,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});
```

## Implementation Checklist

- [ ] Apply rate limiting to all routes
- [ ] Add input validation middleware
- [ ] Implement proper error handling
- [ ] Add file upload validation
- [ ] Standardize middleware application
- [ ] Add request logging
- [ ] Implement performance monitoring
- [ ] Add security headers
- [ ] Test all route combinations
- [ ] Document API endpoints

## Next Steps

1. **Update existing routes** with new middleware
2. **Test rate limiting** with load testing
3. **Monitor performance** in production
4. **Add comprehensive logging**
5. **Implement API documentation**
