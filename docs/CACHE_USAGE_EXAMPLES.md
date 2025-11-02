# Redis Cache Usage Examples

This document provides examples of how to use the Redis cache service in controllers.

## Basic Usage

### 1. Cache Service Import

```javascript
const cacheService = require('../services/cacheService');
```

## Common Patterns

### Pattern 1: Cache GET Requests with Query Parameters

```javascript
// Example: Get services with filters
const getServices = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    
    // Generate cache key from query parameters
    const filter = { category, page, limit };
    const cacheKey = cacheService.servicesKey(filter);
    
    // Try cache first
    let services = await cacheService.get(cacheKey);
    
    if (!services) {
      // Cache miss - fetch from database
      services = await Service.find({ category })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      
      // Cache for 5 minutes (300 seconds)
      await cacheService.set(cacheKey, services, 300);
    }
    
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Pattern 2: Cache Single Entity by ID

```javascript
// Example: Get user by ID
const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = cacheService.userKey(userId);
    
    // Try cache first
    let user = await cacheService.get(cacheKey);
    
    if (!user) {
      // Cache miss - fetch from database
      user = await User.findById(userId).lean();
      
      if (user) {
        // Cache for 15 minutes (900 seconds)
        await cacheService.set(cacheKey, user, 900);
      }
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Pattern 3: Cache Invalidation on Update

```javascript
// Example: Update user and invalidate cache
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Update in database
    const user = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true }
    );
    
    // Invalidate cache
    await cacheService.invalidateUser(userId);
    
    // Optionally, set new value in cache
    const cacheKey = cacheService.userKey(userId);
    await cacheService.set(cacheKey, user, 900);
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Pattern 4: Cache Search Results

```javascript
// Example: Cache search queries
const searchServices = async (req, res) => {
  try {
    const { q, filters } = req.query;
    
    // Generate cache key from search query and filters
    const cacheKey = cacheService.searchKey(q, filters);
    
    // Try cache first
    let results = await cacheService.get(cacheKey);
    
    if (!results) {
      // Cache miss - perform search
      results = await Service.find({
        $text: { $search: q },
        ...filters
      }).lean();
      
      // Cache for 10 minutes (600 seconds)
      await cacheService.set(cacheKey, results, 600);
    }
    
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

## Cache Helper Methods

The cache service provides helper methods for common entities:

```javascript
// User cache
const userKey = cacheService.userKey(userId);
await cacheService.set(userKey, userData, 900);

// Services cache with filters
const servicesKey = cacheService.servicesKey(filters);
await cacheService.set(servicesKey, servicesData, 300);

// Search cache
const searchKey = cacheService.searchKey(query, filters);
await cacheService.set(searchKey, searchResults, 600);

// Course cache
const courseKey = cacheService.courseKey(courseId);
await cacheService.set(courseKey, courseData, 1800);

// Job cache
const jobKey = cacheService.jobKey(jobId);
await cacheService.set(jobKey, jobData, 900);
```

## Custom Cache Keys

For custom entities, use the `getKey` method:

```javascript
// Custom cache key
const customKey = cacheService.getKey('myPrefix', identifier);
await cacheService.set(customKey, data, ttl);

// Example: Cache rental items
const rentalKey = cacheService.getKey('rental', rentalId);
await cacheService.set(rentalKey, rentalData, 600);
```

## Cache Invalidation

### Invalidate Single Key

```javascript
await cacheService.del(cacheKey);
```

### Invalidate Multiple Keys

```javascript
const keys = [
  cacheService.userKey(userId),
  cacheService.getKey('user_settings', userId)
];
await cacheService.delMultiple(keys);
```

### Invalidate User-Related Cache

```javascript
// This invalidates user, user_settings, and user_provider cache
await cacheService.invalidateUser(userId);
```

## Cache TTL (Time To Live) Recommendations

| Data Type | Recommended TTL | Reason |
|-----------|----------------|--------|
| User profiles | 900s (15 min) | Rarely changes |
| Service listings | 300s (5 min) | Frequently updated |
| Search results | 600s (10 min) | Semi-static |
| Course details | 1800s (30 min) | Very stable |
| Job listings | 900s (15 min) | Moderately updated |
| Real-time data | 60s (1 min) | Highly dynamic |

## Best Practices

1. **Always check cache first** before database queries
2. **Set appropriate TTL** based on data volatility
3. **Invalidate cache** on updates/deletes
4. **Use lean() queries** when caching MongoDB documents
5. **Handle cache errors gracefully** - fallback to database
6. **Don't cache sensitive data** - only cache public/read-only data
7. **Use descriptive cache keys** for debugging
8. **Monitor cache hit rates** to optimize TTL values

## Error Handling

The cache service gracefully handles errors:

```javascript
// Cache operations never throw errors
// They return null/false on failure
const cached = await cacheService.get(key);

if (cached) {
  // Use cached data
} else {
  // Fetch from database (cache miss or error)
}
```

## Testing Cache

Check if cache is working:

```javascript
// Set a test value
await cacheService.set('test', { message: 'Hello' }, 60);

// Get it back
const test = await cacheService.get('test');
console.log(test); // { message: 'Hello' }

// Check if exists
const exists = await cacheService.exists('test');
console.log(exists); // true

// Delete it
await cacheService.del('test');
```

## Cache Statistics

Get cache statistics:

```javascript
const stats = await cacheService.getStats();
console.log(stats);
// {
//   enabled: true,
//   connected: true,
//   host: 'localhost',
//   port: 6379
// }
```

## Disabling Cache

To disable caching, set in `.env`:

```env
REDIS_ENABLED=false
```

The cache service will continue to work but all operations will return `null`/`false` without throwing errors.

