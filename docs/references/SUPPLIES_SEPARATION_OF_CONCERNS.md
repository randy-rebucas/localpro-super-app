# Supplies Model - Separation of Concerns

## Overview
The Supplies model has been refactored to follow the principle of separation of concerns by extracting embedded subdocuments into their own collections. This improves scalability, maintainability, and query performance.

## Separated Collections

### 1. **ProductReview Collection** (`src/models/ProductReview.js`)

**Purpose**: Manage all product reviews separately from products

**Benefits**:
- Scalability: Products with thousands of reviews won't have massive documents
- Performance: Can paginate reviews independently
- Flexibility: Easier to implement review moderation workflows
- Analytics: Better query performance for review analytics

**Schema Features**:
- Multi-aspect ratings (overall, quality, value, shipping)
- Review content with title, comment, pros, and cons
- Media attachments (images and videos)
- Supplier response capability
- Verification system (verified purchase, verified review)
- Moderation workflow (approval, flagging, hiding)
- Engagement tracking (helpful votes, reports)
- Soft delete support

**Key Methods**:
- `toggleHelpfulVote(userId, voteType)` - Vote helpful/not helpful
- `addReport(userId, reason, description)` - Report inappropriate reviews
- `getProductRatingSummary(productId)` - Calculate product rating summary (static)
- `getUserReviewForProduct(userId, productId)` - Get user's review (static)
- `canUserReviewProduct(userId, productId)` - Check review eligibility (static)

**Indexes** (9 total):
- Product + created date
- User + created date  
- Order reference
- Rating queries
- Approval status filtering
- Text search on review content
- Unique constraint: one review per user per product

**Auto-Updates**:
- Automatically updates product rating summary after save/delete via middleware

---

### 2. **StockHistory Collection** (`src/models/StockHistory.js`)

**Purpose**: Track all inventory changes separately from products

**Benefits**:
- Audit Trail: Complete history of all stock movements
- Scalability: Products with frequent stock changes won't bloat
- Analytics: Detailed inventory analytics and reporting
- Compliance: Better audit trail for inventory management

**Schema Features**:
- Quantity tracking (before, change, after)
- Change reason with 11 reason types
- Transaction references (order, return, transfer, etc.)
- Location tracking (warehouse, from/to locations)
- Financial impact tracking
- Multi-level approval system
- IP address and user agent for security
- Metadata for extensibility

**Reason Types**:
- purchase, sale, return, adjustment, damaged
- restock, transfer, theft, expired, promotion, correction

**Key Methods**:
- `getProductHistory(productId, options)` - Get stock history with filters (static)
- `getStockSummary(productId, startDate, endDate)` - Aggregate summary (static)
- `createEntry(data)` - Create new stock history entry (static)

**Indexes** (8 total):
- Product + created date
- Supplier + created date
- Reason + created date
- Reference lookups
- User tracking
- Compound indexes for reporting

---

## Updated Product Model

### **Removed**:
1. ✅ Embedded `reviews` array
2. ✅ Embedded `inventory.stockHistory` array
3. ✅ `updateRatings()` method (replaced with `updateRatingSummary()`)

### **Added**:
1. ✅ `getReviewsCount()` - Get count of approved reviews
2. ✅ `updateRatingSummary()` - Update rating from ProductReview collection
3. ✅ `getStockHistory(options)` - Fetch stock history with filters
4. ✅ `addStockHistory(data)` - Add stock change and update quantity

### **Retained**:
- All product fields (pricing, inventory, specifications, etc.)
- Rating summary (average, count, breakdown, distribution) - now updated from reviews
- Analytics tracking
- Virtuals (isLowStock, isOutOfStock, discountedPrice)
- All indexes

---

## Usage Examples

### Working with Reviews

```javascript
const { Product, ProductReview } = require('./models/Supplies');

// Check if user can review
const { canReview, orderId } = await ProductReview.canUserReviewProduct(userId, productId);

// Create review
const review = new ProductReview({
  product: productId,
  user: userId,
  order: orderId,
  rating: { overall: 5, quality: 5, value: 4, shipping: 5 },
  title: 'Excellent product!',
  comment: 'Very satisfied with this purchase',
  pros: ['Great quality', 'Fast shipping'],
  verifiedPurchase: true
});
await review.save();
// Product rating automatically updated via middleware

// Get reviews for product (paginated)
const reviews = await ProductReview.find({
  product: productId,
  isApproved: true,
  isHidden: false,
  isDeleted: false
})
  .populate('user', 'firstName lastName profileImage')
  .sort({ createdAt: -1 })
  .limit(10)
  .skip(page * 10);

// Vote helpful
await review.toggleHelpfulVote(userId, 'helpful');

// Report review
await review.addReport(userId, 'spam', 'This looks like a fake review');

// Get rating summary
const summary = await ProductReview.getProductRatingSummary(productId);
// { average: 4.5, count: 100, breakdown: {...}, distribution: {...} }
```

### Working with Stock History

```javascript
const { Product, StockHistory } = require('./models/Supplies');

// Add stock via product method (recommended)
const product = await Product.findById(productId);
const entry = await product.addStockHistory({
  quantityChange: 50,
  reason: 'restock',
  reasonDetails: 'Monthly restock from supplier',
  reference: 'PO-2024-001',
  referenceType: 'purchase',
  warehouse: 'Main Warehouse',
  updatedBy: userId,
  valueImpact: 500.00
});

// Or create directly
const entry = await StockHistory.createEntry({
  product: productId,
  supplier: supplierId,
  quantityBefore: 100,
  quantityChange: -10,
  quantityAfter: 90,
  reason: 'sale',
  reference: orderNumber,
  referenceType: 'order',
  referenceId: orderId,
  updatedBy: userId
});

// Get product stock history
const history = await product.getStockHistory({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  reason: 'sale',
  limit: 50
});

// Get stock summary
const summary = await StockHistory.getStockSummary(
  productId,
  '2024-01-01',
  '2024-12-31'
);
// [{ _id: 'sale', totalChange: -100, count: 10, totalValue: 1000 }, ...]
```

---

## Migration Strategy

### For Existing Data

```javascript
// Migrate embedded reviews to separate collection
async function migrateReviews() {
  const products = await Product.find({ 'reviews.0': { $exists: true } });
  
  for (const product of products) {
    for (const review of product.reviews) {
      await ProductReview.create({
        product: product._id,
        user: review.user,
        order: review.orderId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        pros: review.pros,
        cons: review.cons,
        images: review.images,
        supplierResponse: review.supplierResponse,
        isVerified: review.isVerified,
        helpfulCount: review.helpfulCount,
        reportCount: review.reportCount,
        isHidden: review.isHidden,
        createdAt: review.createdAt
      });
    }
    
    // Update rating summary
    await product.updateRatingSummary();
    
    // Clear embedded reviews
    product.reviews = undefined;
    await product.save();
  }
}

// Migrate embedded stock history
async function migrateStockHistory() {
  const products = await Product.find({ 'inventory.stockHistory.0': { $exists: true } });
  
  for (const product of products) {
    for (const entry of product.inventory.stockHistory) {
      await StockHistory.create({
        product: product._id,
        supplier: product.supplier,
        quantityBefore: entry.newQuantity - entry.quantityChange,
        quantityChange: entry.quantityChange,
        quantityAfter: entry.newQuantity,
        reason: entry.reason,
        reference: entry.reference,
        notes: entry.notes,
        updatedBy: entry.updatedBy,
        createdAt: entry.date
      });
    }
    
    // Clear embedded stock history
    product.inventory.stockHistory = undefined;
    await product.save();
  }
}
```

---

## API Updates Needed

### Review Endpoints (New)

```
GET    /api/supplies/products/:id/reviews        # Get product reviews
POST   /api/supplies/products/:id/reviews        # Create review
GET    /api/supplies/products/:id/reviews/check  # Check if user can review
GET    /api/supplies/reviews/:id                 # Get single review
PUT    /api/supplies/reviews/:id                 # Update review
DELETE /api/supplies/reviews/:id                 # Delete review
POST   /api/supplies/reviews/:id/helpful         # Vote helpful
POST   /api/supplies/reviews/:id/report          # Report review
POST   /api/supplies/reviews/:id/response        # Supplier response
GET    /api/supplies/reviews/my                  # Get user's reviews
```

### Stock History Endpoints (New)

```
GET    /api/supplies/products/:id/stock-history  # Get product stock history
POST   /api/supplies/products/:id/stock-history  # Add stock change
GET    /api/supplies/products/:id/stock-summary  # Get stock summary
GET    /api/supplies/stock-history               # Get all stock history (admin)
GET    /api/supplies/stock-history/:id           # Get single entry
```

---

## Benefits Summary

### Scalability
- ✅ Products can have unlimited reviews without document size issues
- ✅ Products can have complete stock history without bloating
- ✅ Better database performance with normalized data

### Performance
- ✅ Faster product queries (smaller documents)
- ✅ Independent pagination for reviews and history
- ✅ Targeted indexes for specific queries
- ✅ Parallel queries possible

### Maintainability
- ✅ Clear separation of concerns
- ✅ Easier to implement new features
- ✅ Better code organization
- ✅ Independent testing possible

### Features
- ✅ Advanced review moderation workflows
- ✅ Detailed stock audit trails
- ✅ Better analytics capabilities
- ✅ Flexible querying options

### Security & Compliance
- ✅ Complete audit trail for inventory
- ✅ User action tracking
- ✅ IP address logging for security
- ✅ Approval workflows

---

## File Structure

```
src/models/
├── Supplies.js           # Main model (Product, Order, SubscriptionKit, ProductCategory)
├── ProductReview.js      # Product reviews (new)
└── StockHistory.js       # Inventory tracking (new)
```

---

## Next Steps

1. ✅ Create migration scripts
2. ✅ Update controllers to use new collections
3. ✅ Create new API endpoints
4. ✅ Update tests
5. ✅ Update API documentation
6. ✅ Run migration on existing data
7. ✅ Update frontend/mobile apps

---

## Backward Compatibility

The Product model still maintains the `rating` object structure, so existing queries for product ratings will continue to work. The rating is now computed from the ProductReview collection rather than embedded reviews.

Existing code can be gradually migrated:
- Old: `product.reviews` → New: `ProductReview.find({ product: product._id })`
- Old: `product.inventory.stockHistory` → New: `StockHistory.find({ product: product._id })`
