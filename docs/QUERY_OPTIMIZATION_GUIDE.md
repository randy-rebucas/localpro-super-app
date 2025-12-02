# Query Optimization Implementation Guide

## Quick Start

### 1. Run Index Creation Script
```bash
node scripts/create-slow-query-indexes.js
```

### 2. Apply Code Fixes (This Document)

---

## Finance Controller Optimizations

### Issue 1: `getFinancialOverview` - Multiple Aggregations (Line 35-81)

#### Current Problem
```javascript
// Query 1: Monthly earnings
const monthlyEarnings = await Booking.aggregate([...]);

// Query 2: Pending payments
const pendingPayments = await Booking.aggregate([...]);

// Query 3: Referral earnings
const referralEarnings = await Referral.aggregate([...]);
```

**Why it's slow**: 3 network round-trips, each scanning booking/referral collections

#### Solution: Combine with $facet
```javascript
// Instead of 3 queries, use 1
const financialData = await Booking.aggregate([
  {
    $match: {
      type: 'booking',
      provider: userId,
      $or: [
        { status: 'completed', createdAt: { $gte: currentMonth } },
        { status: 'completed', 'payment.status': 'pending' }
      ]
    }
  },
  {
    $facet: {
      monthlyEarnings: [
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: currentMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$pricing.total' },
            bookingCount: { $sum: 1 }
          }
        }
      ],
      pendingPayments: [
        {
          $match: {
            status: 'completed',
            'payment.status': 'pending'
          }
        },
        {
          $group: {
            _id: null,
            totalPending: { $sum: '$pricing.total' },
            count: { $sum: 1 }
          }
        }
      ]
    }
  }
]);

// Handle referral earnings separately (different collection)
const referralEarnings = await Referral.aggregate([
  {
    $match: {
      referrer: userId,
      status: 'completed'
    }
  },
  {
    $group: {
      _id: null,
      totalEarnings: { $sum: '$rewardDistribution.referrerReward' },
      count: { $sum: 1 }
    }
  }
]);
```

**Expected improvement**: 
- ⚡ 2 queries instead of 3 (33% reduction)
- 📊 Single booking collection scan
- 💾 Connection pool savings

---

### Issue 2: `getEarnings` - Inefficient Lookup (Line 212-320)

#### Current Problem
```javascript
const earningsByCategory = await Booking.aggregate([
  { $match: { ... } },
  {
    $lookup: {
      from: 'marketplaces',
      localField: 'service',
      foreignField: '_id',
      as: 'serviceData'
    }
  },
  { $unwind: '$serviceData' },
  { $group: { _id: '$serviceData.category', ... } }
  // ⚠️ NO LIMIT - processes ALL documents
]);
```

**Why it's slow**:
- Full collection scan of all bookings
- JOIN with marketplace collection
- No pagination or limits
- Group operation on potentially millions of documents

#### Solution 1: Add Early Filtering & Projection
```javascript
const earningsByCategory = await Booking.aggregate([
  {
    $match: {
      type: 'booking',
      provider: req.user.id,
      status: 'completed',
      ...dateFilter
    }
  },
  // Early projection - reduce data transfer
  {
    $project: {
      service: 1,
      'pricing.total': 1
    }
  },
  {
    $lookup: {
      from: 'marketplaces',
      localField: 'service',
      foreignField: '_id',
      as: 'serviceData',
      // Use pipeline to filter early
      pipeline: [
        {
          $project: { category: 1 }
        }
      ]
    }
  },
  { $unwind: '$serviceData' },
  {
    $group: {
      _id: '$serviceData.category',
      totalEarnings: { $sum: '$pricing.total' },
      bookingCount: { $sum: 1 }
    }
  },
  { $sort: { totalEarnings: -1 } },
  // ADD LIMIT - prevent processing millions
  { $limit: 100 }
]);
```

#### Solution 2: Use allowDiskUse for Large Results
```javascript
const result = await Booking.aggregate(pipeline, {
  allowDiskUse: true,  // Enable disk usage for large aggregations
  maxTimeMS: 30000      // 30 second timeout
});
```

**Expected improvement**:
- ⚡ 50% faster with early projection
- 🔒 Limits prevent memory issues
- 💾 Disk spillover for massive datasets

---

### Issue 3: `getProviderEarnings` - Multiple $lookup Stages (Line 662-730)

#### Problem
```javascript
const earnings = await Booking.aggregate([
  { $match: { ... } },
  { $lookup: { from: 'marketplaces', ... } },  // First lookup
  { $unwind: '$serviceData' },
  { $lookup: { from: 'users', ... } },         // Second lookup
  { $unwind: '$userData' },
  // ... multiple group stages
]);
```

**Why slow**: Multiple lookups without indexes on foreign keys

#### Solution: Optimize Lookup Order & Add Indexes
```javascript
// Ensure indexes exist first
// db.marketplaces.createIndex({ _id: 1 })
// db.users.createIndex({ _id: 1 })

const earnings = await Booking.aggregate([
  {
    $match: {
      type: 'booking',
      provider: req.user.id,
      status: 'completed',
      ...dateFilter
    }
  },
  // Single optimized lookup with subpipeline
  {
    $lookup: {
      from: 'marketplaces',
      let: { serviceId: '$service' },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$serviceId'] } } },
        { $project: { category: 1, subcategory: 1 } }
      ],
      as: 'service'
    }
  },
  {
    $unwind: {
      path: '$service',
      preserveNullAndEmptyArrays: true
    }
  },
  // Group early before second lookup
  {
    $group: {
      _id: '$service.category',
      totalEarnings: { $sum: '$pricing.total' },
      bookingCount: { $sum: 1 },
      serviceIds: { $push: '$service' }
    }
  },
  // $limit before second lookup to reduce data
  { $limit: 50 },
  // Only then do additional lookups if absolutely necessary
  { $sort: { totalEarnings: -1 } }
]);
```

**Expected improvement**:
- ⚡ 40% faster with optimized pipelines
- 🔒 Reduced data processed with early grouping
- 📊 Single lookup instead of multiple

---

## Usage Tracking Service Optimizations

### Issue: `getUsageAnalytics` - Memory-Intensive $addToSet (Line 264-310)

#### Current Problem
```javascript
const usageStats = await FeatureUsage.aggregate([
  { $match: matchConditions },
  {
    $group: {
      _id: '$feature',
      uniqueUsers: { $addToSet: '$user' },  // ⚠️ Accumulates ALL users in memory
      // ...
    }
  },
  { $project: { feature: '$_id', featureCount: { $size: '$uniqueUsers' } } }
]);
```

**Why slow**:
- $addToSet holds entire array in memory
- On millions of records = memory explosion
- Can crash server or cause OOM errors

#### Solution: Split into Two-Stage Query
```javascript
const usageStats = await FeatureUsage.aggregate([
  { $match: matchConditions },
  {
    $group: {
      _id: '$feature',
      totalUsage: { $sum: '$usage.count' },
      usageCount: { $sum: 1 }
      // DON'T accumulate user IDs
    }
  },
  { $sort: { totalUsage: -1 } }
]);

// If you absolutely need unique user count:
// Option 1: Count separately with explicit limit
const uniqueUsersByFeature = await FeatureUsage.aggregate([
  { $match: matchConditions },
  {
    $group: {
      _id: { feature: '$feature', user: '$user' }
    }
  },
  {
    $group: {
      _id: '$_id.feature',
      uniqueUsers: { $sum: 1 }
    }
  }
]);

// Option 2: Use $facet with smaller chunks
const stats = await FeatureUsage.aggregate([
  { $match: matchConditions },
  {
    $facet: {
      totalUsage: [
        {
          $group: {
            _id: '$feature',
            totalUsage: { $sum: '$usage.count' },
            usageCount: { $sum: 1 }
          }
        },
        { $sort: { totalUsage: -1 } }
      ],
      uniqueUsers: [
        {
          $group: {
            _id: { feature: '$feature', user: '$user' }
          }
        },
        {
          $group: {
            _id: '$_id.feature',
            uniqueUsers: { $sum: 1 }
          }
        }
      ]
    }
  }
]);
```

**Expected improvement**:
- ⚡ 80%+ memory reduction
- 🔒 Prevents OOM crashes
- 📊 Faster query execution

---

## Marketplace Controller Optimizations

### Issue: Missing $limit in Stat Queries

#### Problem (Line 1430, 1535, 1672+)
```javascript
const stats = await Service.aggregate([
  { $match: { ... } },
  { $group: { ... } },
  // ⚠️ NO LIMIT
]);
```

#### Solution: Add Limits
```javascript
const stats = await Service.aggregate([
  { $match: { ... } },
  { $group: { ... } },
  { $sort: { value: -1 } },
  { $limit: 100 },  // Prevent unbounded results
  { $project: { /* only needed fields */ } }
]);
```

---

## Monitoring & Validation

### Enable Query Profiling
```javascript
// In your database initialization
db.setProfilingLevel(2, { slowms: 100 });
```

### Check Execution Plans
```javascript
// Test query before deploying
const explanation = await Booking.collection.aggregate(pipeline, { 
  explain: 'executionStats' 
}).toArray();

console.log(JSON.stringify(explanation[0], null, 2));

// Look for:
// - "stage": "COLLSCAN" = BAD (full collection scan)
// - "stage": "IXSCAN" = GOOD (index scan)
// - "executionStages.executionStats.scannedObjects" should match returned objects
```

### Performance Testing Query
```javascript
async function testQuery(name, query) {
  const start = Date.now();
  try {
    const result = await query;
    const duration = Date.now() - start;
    console.log(`✅ ${name}: ${duration}ms`);
    return { success: true, duration, data: result };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`❌ ${name}: ${duration}ms - ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

// Usage:
await testQuery('Monthly Earnings - Old', oldQuery());
await testQuery('Monthly Earnings - New', newQuery());
```

---

## Implementation Checklist

- [ ] Run `scripts/create-slow-query-indexes.js`
- [ ] Update `financeController.getFinancialOverview()` to use $facet
- [ ] Update `financeController.getEarnings()` with early projection & $limit
- [ ] Update `financeController.getProviderEarnings()` optimize lookups
- [ ] Update `usageTrackingService.getUsageAnalytics()` remove $addToSet
- [ ] Add $limit to all marketplace stat queries
- [ ] Enable MongoDB profiler
- [ ] Test each query with profiling enabled
- [ ] Monitor for slow queries in production
- [ ] Document any additional optimizations needed

---

## Testing

### Unit Test Example
```javascript
describe('Finance Controller - Optimized Queries', () => {
  it('should return financial overview within 500ms', async () => {
    const start = Date.now();
    const result = await getFinancialOverview(req, res);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(500);
    expect(result.success).toBe(true);
  });

  it('should use indexed fields for queries', async () => {
    const indexes = await Booking.collection.getIndexes();
    const hasOptimizedIndex = Object.values(indexes).some(idx => 
      JSON.stringify(idx.key) === JSON.stringify({ provider: 1, status: 1 })
    );
    expect(hasOptimizedIndex).toBe(true);
  });
});
```

---

**Last Updated**: November 30, 2025
**Priority**: CRITICAL - Performance bottleneck identified
