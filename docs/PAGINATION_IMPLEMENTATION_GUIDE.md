# API Response Pagination Implementation Guide

This document provides a comprehensive guide for implementing standardized pagination across all list endpoints in the LocalPro Super App API.

## Overview

The new pagination system provides:
- **Consistent pagination metadata** across all endpoints
- **Cursor-based pagination** for large datasets
- **Offset-based pagination** for traditional browsing
- **Performance optimization** and monitoring
- **Comprehensive metadata** for better client experience

## Architecture

### Components

1. **Pagination Middleware** (`src/middleware/paginationMiddleware.js`)
   - Parses and validates pagination parameters
   - Provides helper methods for query building
   - Supports both offset and cursor pagination

2. **Pagination Service** (`src/services/paginationService.js`)
   - Executes paginated queries with performance tracking
   - Provides hybrid pagination strategies
   - Includes optimization recommendations

3. **Response Helpers** (`src/utils/responseHelper.js`)
   - Standardized response formatting
   - Comprehensive pagination metadata creation

## Implementation

### 1. Basic Setup

#### Install Middleware

```javascript
const { paginationMiddleware, offsetPaginationMiddleware, cursorPaginationMiddleware } = require('../middleware/paginationMiddleware');

// For offset pagination (traditional)
app.use('/api/announcements', offsetPaginationMiddleware({
  defaultLimit: 20,
  maxLimit: 100,
  sortField: 'publishedAt',
  sortOrder: 'desc'
}));

// For cursor pagination (feeds, real-time)
app.use('/api/announcements/my', cursorPaginationMiddleware({
  defaultLimit: 20,
  maxLimit: 50,
  cursorField: 'publishedAt',
  sortField: 'publishedAt',
  sortOrder: 'desc'
}));
```

#### Update Controller

```javascript
const { paginationService } = require('../services/paginationService');
const { sendPaginatedResponse } = require('../middleware/paginationMiddleware');

const getAnnouncements = async (req, res) => {
  try {
    // Build your query
    const query = { status: 'published', isDeleted: false };
    
    // Apply filters
    if (req.query.type) query.type = req.query.type;
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Execute paginated query
    const result = await paginationService.executeHybridPagination(
      Announcement,
      query,
      req.pagination,
      {
        useCursor: req.query.useCursor === 'true',
        cursorThreshold: 5000,
        queryOptions: {
          populate: [
            { path: 'author', select: 'firstName lastName email' }
          ]
        }
      }
    );

    // Send standardized response
    return sendPaginatedResponse(
      res,
      result.results,
      result.pagination,
      'Announcements retrieved successfully',
      {
        filters: req.query,
        performance: result.performance
      }
    );

  } catch (error) {
    return sendServerError(res, error, 'Failed to retrieve announcements');
  }
};
```

### 2. Pagination Types

#### Offset Pagination
Best for:
- Traditional browsing interfaces
- Small to medium datasets (< 10,000 records)
- When you need to show page numbers

```javascript
// Request
GET /api/announcements?page=2&limit=20&sortBy=publishedAt&sortOrder=desc

// Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "count": 20,
    "hasNext": true,
    "hasPrev": true,
    "nextPage": 3,
    "prevPage": 1,
    "itemsPerPage": 20,
    "startItem": 21,
    "endItem": 40,
    "isEmpty": false,
    "isFirstPage": false,
    "isLastPage": false,
    "queryTime": 45,
    "indexUsed": "status_1_publishedAt_-1"
  }
}
```

#### Cursor Pagination
Best for:
- Real-time feeds
- Large datasets (> 10,000 records)
- Infinite scroll interfaces
- When data changes frequently

```javascript
// Request
GET /api/announcements/my?cursor=2023-01-01T00:00:00.000Z&limit=20

// Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 20,
    "count": 20,
    "hasMore": true,
    "cursor": "2023-01-01T00:00:00.000Z",
    "nextCursor": "2022-12-31T23:59:59.000Z",
    "prevCursor": "2023-01-02T00:00:00.000Z",
    "isEmpty": false,
    "isFirstPage": false,
    "hasNext": true,
    "hasPrev": true,
    "queryTime": 32,
    "indexUsed": "publishedAt_-1"
  }
}
```

### 3. Advanced Features

#### Hybrid Pagination
Automatically chooses the best pagination strategy:

```javascript
const result = await paginationService.executeHybridPagination(
  Model,
  query,
  paginationParams,
  {
    useCursor: false, // Force offset pagination
    cursorThreshold: 10000, // Use cursor for datasets > 10k
    performanceOptimized: true
  }
);
```

#### Performance Monitoring
Built-in performance tracking:

```javascript
// Get performance statistics
const stats = paginationService.getPerformanceStats();
console.log(stats);
// {
//   totalQueries: 150,
//   averageQueryTime: 45,
//   slowQueries: 3,
//   cacheHits: 12
// }
```

#### Index Optimization
Get recommendations for database indexes:

```javascript
const recommendations = paginationService.optimizeForCollection(
  'announcements',
  { status: 'published', type: 'news' },
  { publishedAt: -1 }
);
console.log(recommendations);
// {
//   recommendedIndexes: [
//     { status: 1, type: 1, publishedAt: -1 },
//     { status: 1 },
//     { publishedAt: -1 }
//   ],
//   paginationStrategy: 'offset',
//   performanceTips: [...]
// }
```

## Migration Guide

### Step 1: Update Existing Controllers

1. **Replace manual pagination logic** with the new middleware
2. **Use paginationService** for query execution
3. **Update response format** to use standardized metadata

### Step 2: Update Routes

```javascript
// Before
router.get('/', getAnnouncements);

// After
router.get('/', 
  offsetPaginationMiddleware({
    defaultLimit: 20,
    maxLimit: 100
  }),
  getAnnouncements
);
```

### Step 3: Update Client Code

#### Offset Pagination
```javascript
// Request
const response = await fetch('/api/announcements?page=2&limit=20');

// Handle response
const { data, pagination } = response.data;
if (pagination.hasNext) {
  // Show "Next" button
}
if (pagination.hasPrev) {
  // Show "Previous" button
}
```

#### Cursor Pagination
```javascript
// Request
const response = await fetch('/api/announcements/my?cursor=2023-01-01T00:00:00.000Z&limit=20');

// Handle response
const { data, pagination } = response.data;
if (pagination.hasMore) {
  // Load more with pagination.nextCursor
  loadMore(pagination.nextCursor);
}
```

## Best Practices

### 1. Choose the Right Pagination Type

- **Offset Pagination**: Use for admin panels, search results, traditional browsing
- **Cursor Pagination**: Use for feeds, real-time data, infinite scroll

### 2. Set Appropriate Limits

```javascript
// For browsing/search
offsetPaginationMiddleware({
  defaultLimit: 20,
  maxLimit: 100
});

// For feeds
cursorPaginationMiddleware({
  defaultLimit: 20,
  maxLimit: 50
});
```

### 3. Optimize Database Queries

```javascript
// Add indexes for common query patterns
db.announcements.createIndex({ status: 1, publishedAt: -1 });
db.announcements.createIndex({ author: 1, publishedAt: -1 });
```

### 4. Handle Edge Cases

```javascript
// Empty results
if (pagination.isEmpty) {
  return res.json({
    success: true,
    data: [],
    pagination,
    message: 'No announcements found'
  });
}

// Invalid pagination parameters
if (!pagination.isValid) {
  return res.status(400).json({
    success: false,
    message: 'Invalid pagination parameters',
    code: 'INVALID_PAGINATION'
  });
}
```

## Testing

### Unit Tests

```javascript
describe('Pagination Middleware', () => {
  it('should parse pagination parameters correctly', async () => {
    const response = await request(app)
      .get('/test?page=2&limit=10')
      .expect(200);

    expect(response.body.pagination).toMatchObject({
      page: 2,
      limit: 10,
      skip: 10
    });
  });
});
```

### Integration Tests

```javascript
describe('Pagination Service', () => {
  it('should execute offset pagination', async () => {
    const result = await paginationService.executeOffsetPagination(
      Model,
      { status: 'active' },
      { page: 1, limit: 10, skip: 0, sortBy: 'name', sortOrder: 'asc' }
    );

    expect(result.results).toBeDefined();
    expect(result.pagination.page).toBe(1);
  });
});
```

## Performance Considerations

### 1. Database Indexes
- Create compound indexes for common query + sort patterns
- Use the optimization recommendations from the service

### 2. Query Optimization
- Use `lean()` for read-only operations
- Limit populated fields
- Use projection to exclude unnecessary fields

### 3. Caching
- Consider caching for frequently accessed data
- Use the performance monitoring to identify slow queries

### 4. Large Datasets
- Use cursor pagination for datasets > 10,000 records
- Consider data archiving for very large datasets

## Troubleshooting

### Common Issues

1. **Slow Queries**
   - Check database indexes
   - Use the performance monitoring
   - Consider cursor pagination for large datasets

2. **Inconsistent Results**
   - Ensure proper sorting
   - Use cursor pagination for frequently changing data

3. **Memory Issues**
   - Limit the maximum page size
   - Use lean queries
   - Consider data archiving

### Debug Mode

```javascript
// Enable detailed logging
const result = await paginationService.executeOffsetPagination(
  Model,
  query,
  paginationParams,
  { debug: true }
);

console.log(result.performance);
// {
//   queryTime: 45,
//   totalQueries: 2,
//   cacheHit: false,
//   executionStats: { ... }
// }
```

## API Reference

### Pagination Middleware Options

```javascript
{
  defaultLimit: 20,        // Default items per page
  maxLimit: 100,           // Maximum items per page
  minLimit: 1,             // Minimum items per page
  defaultPage: 1,          // Default page number
  minPage: 1,              // Minimum page number
  enableCursor: false,     // Enable cursor pagination
  cursorField: 'createdAt', // Field used for cursor
  sortField: 'createdAt',   // Default sort field
  sortOrder: 'desc'         // Default sort order
}
```

### Response Format

```javascript
{
  "success": true,
  "message": "Success message",
  "data": [...],           // Array of results
  "pagination": {          // Pagination metadata
    "page": 1,             // Current page (offset)
    "limit": 20,           // Items per page
    "total": 150,          // Total items (offset)
    "totalPages": 8,       // Total pages (offset)
    "count": 20,           // Items in current page
    "hasNext": true,       // Has next page
    "hasPrev": false,      // Has previous page
    "cursor": "...",       // Current cursor (cursor)
    "nextCursor": "...",   // Next cursor (cursor)
    "hasMore": true,       // Has more items (cursor)
    "queryTime": 45,       // Query execution time
    "indexUsed": "..."     // Index used for query
  },
  "meta": {                // Additional metadata
    "timestamp": "...",
    "filters": {...},
    "performance": {...}
  }
}
```

This implementation provides a robust, scalable, and consistent pagination system that can handle both small and large datasets efficiently while providing comprehensive metadata for better client experiences.
