# Database Optimization Guide

This guide covers the comprehensive database optimization system implemented in the LocalPro Super App, including query optimization, indexing strategies, and performance monitoring.

## Overview

The database optimization system includes:
- **Query Optimization Service**: Automatically optimizes database queries
- **Index Management**: Comprehensive indexing strategy for all collections
- **Performance Monitoring**: Real-time query performance tracking
- **Caching System**: Query result caching for improved performance
- **Optimization Tools**: Scripts and utilities for database maintenance

## Features

### 1. Query Optimization

#### Query Optimization Service (`src/services/queryOptimizationService.js`)
- Automatically optimizes find queries with best practices
- Adds lean() for read-only operations
- Implements query result caching
- Provides compound query builders
- Supports geospatial and text search optimization

#### Key Features:
- **Automatic Query Optimization**: Wraps Mongoose queries with optimization logic
- **Query Caching**: Implements intelligent caching with configurable timeouts
- **Compound Query Builder**: Creates optimized compound queries from filters
- **Performance Tracking**: Monitors and logs slow queries

### 2. Database Indexing

#### Comprehensive Index Strategy
The system implements a comprehensive indexing strategy across all collections:

#### User Collection Indexes:
```javascript
// Basic indexes
{ role: 1, isActive: 1, status: 1 }
{ 'profile.address.city': 1, 'profile.address.state': 1, role: 1 }
{ 'profile.rating': -1, 'profile.totalReviews': -1, isActive: 1 }

// Text search index
{
  firstName: 'text',
  lastName: 'text',
  'profile.businessName': 'text',
  'profile.skills': 'text',
  'profile.specialties': 'text',
  'profile.bio': 'text'
}
```

#### Job Collection Indexes:
```javascript
// Compound indexes for common queries
{ status: 1, isActive: 1, category: 1 }
{ category: 1, subcategory: 1, jobType: 1 }
{ 'company.location.city': 1, 'company.location.state': 1, status: 1 }
{ jobType: 1, experienceLevel: 1, status: 1 }
{ 'salary.min': 1, 'salary.max': 1, status: 1 }
```

#### Service Collection Indexes:
```javascript
// Service-specific indexes
{ category: 1, subcategory: 1, isActive: 1 }
{ provider: 1, isActive: 1, category: 1 }
{ serviceArea: 1, isActive: 1, category: 1 }
{ 'rating.average': -1, 'rating.count': -1, isActive: 1 }
{ 'pricing.basePrice': 1, category: 1, isActive: 1 }
```

### 3. Performance Monitoring

#### Database Performance Monitor (`src/services/databasePerformanceMonitor.js`)
- Tracks query execution times
- Identifies slow queries (>1 second)
- Monitors database connections
- Provides collection statistics
- Generates performance reports

#### Key Metrics:
- Query execution time
- Slow query identification
- Connection pool status
- Collection statistics
- Index usage statistics

### 4. Query Optimization Middleware

#### Middleware Features (`src/middleware/queryOptimizationMiddleware.js`)
- **Query Optimization**: Automatically optimizes queries
- **Caching Headers**: Adds appropriate cache headers
- **Performance Tracking**: Tracks query count and response times
- **Parameter Validation**: Validates and sanitizes query parameters
- **Query Logging**: Comprehensive query logging

## Usage

### 1. Basic Query Optimization

```javascript
const queryOptimizationService = require('../services/queryOptimizationService');

// Optimize a find query
const { query: optimizedQuery, options: optimizedOptions } = 
  queryOptimizationService.optimizeFindQuery(query, options);

// Execute optimized query with caching
const results = await queryOptimizationService.executeOptimizedQuery(
  Model,
  query,
  { useCache: true, collection: 'users' }
);
```

### 2. Compound Query Building

```javascript
// Create compound query from filters
const searchQuery = queryOptimizationService.createCompoundQuery({
  role: 'provider',
  isActive: true,
  search: 'cleaning',
  textFields: ['firstName', 'lastName', 'profile.businessName'],
  category: 'cleaning',
  location: 'New York',
  minRating: 4.0
});
```

### 3. Using Optimization Middleware

```javascript
const { optimizeFindQueries, addQueryCaching } = require('../middleware/queryOptimizationMiddleware');

// Apply to routes
router.get('/users', 
  optimizeFindQueries(User),
  addQueryCaching(300000), // 5 minutes
  getUsers
);
```

### 4. Performance Monitoring

```javascript
const dbMonitor = require('../services/databasePerformanceMonitor');

// Get query statistics
const queryStats = dbMonitor.getQueryStats();
const slowQueries = dbMonitor.getSlowQueries(20);

// Get database health
const health = await dbMonitor.getDatabaseStats();
```

## API Endpoints

### Database Optimization Endpoints

All endpoints require admin authentication:

#### Get Optimization Report
```
GET /api/database/optimization/report
```
Returns comprehensive database optimization report with recommendations.

#### Get Index Recommendations
```
GET /api/database/optimization/recommendations
```
Returns recommended indexes for better performance.

#### Create Recommended Indexes
```
POST /api/database/optimization/create-indexes
Body: { collection: "users", indexes: [...] }
```
Creates recommended database indexes.

#### Get Query Statistics
```
GET /api/database/optimization/query-stats?limit=20
```
Returns query performance statistics and slow queries.

#### Get Database Health
```
GET /api/database/optimization/health
```
Returns database health status and connection information.

#### Clear Query Cache
```
POST /api/database/optimization/clear-cache
```
Clears the query result cache.

#### Get Collection Statistics
```
GET /api/database/optimization/collections
```
Returns statistics for all collections.

#### Analyze Slow Queries
```
GET /api/database/optimization/slow-queries?limit=50
```
Analyzes slow queries and provides recommendations.

## Database Index Creation

### Automatic Index Creation

Run the index creation script to create all recommended indexes:

```bash
node scripts/create-database-indexes.js
```

### Manual Index Creation

You can also create indexes manually using MongoDB commands:

```javascript
// Create compound index
db.users.createIndex({ role: 1, isActive: 1, status: 1 });

// Create text search index
db.users.createIndex({
  firstName: 'text',
  lastName: 'text',
  'profile.businessName': 'text'
});
```

## Performance Best Practices

### 1. Query Optimization
- Use `lean()` for read-only operations
- Limit fields with `select()`
- Use appropriate indexes
- Implement query caching
- Monitor slow queries

### 2. Index Strategy
- Create compound indexes for common query patterns
- Use sparse indexes for optional fields
- Implement text search indexes for search functionality
- Monitor index usage and remove unused indexes

### 3. Caching
- Cache frequently accessed data
- Use appropriate cache timeouts
- Implement cache invalidation strategies
- Monitor cache hit rates

### 4. Monitoring
- Track query performance
- Monitor slow queries
- Analyze index usage
- Set up alerts for performance issues

## Configuration

### Environment Variables

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/localpro-super-app

# Query Optimization
QUERY_CACHE_TIMEOUT=300000  # 5 minutes
SLOW_QUERY_THRESHOLD=1000   # 1 second
```

### Middleware Configuration

```javascript
// Query optimization middleware
app.use('/api', optimizeSearchQueries());
app.use('/api', validateQueryParams(['search', 'page', 'limit', 'sortBy']));
app.use('/api', addQueryLogging('debug'));
```

## Monitoring and Alerts

### Performance Metrics
- Query execution time
- Slow query count
- Cache hit rate
- Database connection status
- Index usage statistics

### Alerting
- Slow query alerts (>1 second)
- High error rate alerts
- Connection pool exhaustion
- Index usage warnings

## Troubleshooting

### Common Issues

1. **Slow Queries**
   - Check if appropriate indexes exist
   - Analyze query execution plans
   - Consider query optimization

2. **High Memory Usage**
   - Review index sizes
   - Check for unused indexes
   - Optimize query projections

3. **Connection Issues**
   - Monitor connection pool
   - Check database health
   - Review connection limits

### Debugging Tools

1. **Query Analysis**
   ```javascript
   // Enable MongoDB profiler
   db.setProfilingLevel(2, { slowms: 100 });
   ```

2. **Index Usage Analysis**
   ```javascript
   // Get index usage statistics
   db.collection.aggregate([{ $indexStats: {} }]);
   ```

3. **Query Execution Plans**
   ```javascript
   // Explain query execution
   db.collection.find(query).explain('executionStats');
   ```

## Maintenance

### Regular Tasks
1. Monitor slow queries weekly
2. Review index usage monthly
3. Analyze query patterns quarterly
4. Update optimization strategies as needed

### Index Maintenance
1. Remove unused indexes
2. Add missing indexes based on query patterns
3. Optimize compound indexes
4. Monitor index sizes

## Conclusion

The database optimization system provides comprehensive tools for maintaining optimal database performance. Regular monitoring and maintenance ensure the system continues to perform efficiently as the application scales.

For questions or issues, refer to the troubleshooting section or contact the development team.
