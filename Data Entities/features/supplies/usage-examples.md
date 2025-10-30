# Supplies Usage Examples

## Overview

This document provides practical examples and implementation patterns for working with the Supplies feature. These examples demonstrate common use cases and best practices for integrating with the supplies API.

## 🛒 Product Management Examples

### Creating a New Product

```javascript
// Frontend: Create a new supply item
const createSupply = async (supplyData) => {
  try {
    const response = await fetch('/api/supplies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        name: 'Professional Cleaning Spray',
        title: 'Multi-Surface Cleaning Spray 32oz',
        description: 'Heavy-duty cleaning spray for all surfaces',
        category: 'cleaning_supplies',
        subcategory: 'sprays',
        brand: 'CleanPro',
        sku: 'CP-CS-32',
        pricing: {
          retailPrice: 12.99,
          wholesalePrice: 9.99,
          currency: 'USD'
        },
        inventory: {
          quantity: 150,
          minStock: 10,
          maxStock: 500,
          location: 'Warehouse A'
        },
        specifications: {
          weight: '2.5 lbs',
          dimensions: '8x3x12 inches',
          material: 'Plastic bottle',
          color: 'Blue',
          warranty: '1 year'
        },
        location: {
          street: '123 Industrial Blvd',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA'
        },
        tags: ['cleaning', 'professional', 'multi-surface'],
        isSubscriptionEligible: true
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Supply created:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error creating supply:', error);
    throw error;
  }
};
```

### Updating Product Inventory

```javascript
// Backend: Update inventory after order completion
const updateInventoryAfterOrder = async (productId, orderQuantity) => {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if sufficient inventory
    if (product.inventory.quantity < orderQuantity) {
      throw new Error('Insufficient inventory');
    }

    // Update inventory
    product.inventory.quantity -= orderQuantity;
    
    // Check for low stock alert
    if (product.inventory.quantity <= product.inventory.minStock) {
      await sendLowStockAlert(product);
    }

    await product.save();
    
    return product;
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

// Send low stock alert
const sendLowStockAlert = async (product) => {
  const supplier = await User.findById(product.supplier);
  
  await EmailService.sendEmail({
    to: supplier.email,
    subject: 'Low Stock Alert',
    template: 'low-stock-alert',
    data: {
      productName: product.name,
      currentStock: product.inventory.quantity,
      minStock: product.inventory.minStock,
      sku: product.sku
    }
  });
};
```

### Bulk Product Import

```javascript
// Backend: Import multiple products from CSV
const importProductsFromCSV = async (csvData, supplierId) => {
  const products = [];
  const errors = [];

  for (const [index, row] of csvData.entries()) {
    try {
      const productData = {
        name: row.name,
        title: row.title,
        description: row.description,
        category: row.category,
        subcategory: row.subcategory,
        brand: row.brand,
        sku: row.sku,
        pricing: {
          retailPrice: parseFloat(row.retailPrice),
          wholesalePrice: parseFloat(row.wholesalePrice),
          currency: row.currency || 'USD'
        },
        inventory: {
          quantity: parseInt(row.quantity),
          minStock: parseInt(row.minStock) || 10,
          maxStock: parseInt(row.maxStock),
          location: row.location
        },
        specifications: {
          weight: row.weight,
          dimensions: row.dimensions,
          material: row.material,
          color: row.color,
          warranty: row.warranty
        },
        tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
        supplier: supplierId
      };

      // Geocode location if provided
      if (row.street && row.city && row.state) {
        const address = `${row.street}, ${row.city}, ${row.state}`;
        const geocodeResult = await GoogleMapsService.geocodeAddress(address);
        
        if (geocodeResult.success && geocodeResult.data.length > 0) {
          const location = geocodeResult.data[0];
          productData.location = {
            street: row.street,
            city: row.city,
            state: row.state,
            zipCode: row.zipCode,
            country: row.country || 'USA',
            coordinates: {
              lat: location.geometry.location.lat,
              lng: location.geometry.location.lng
            }
          };
        }
      }

      const product = await Product.create(productData);
      products.push(product);
    } catch (error) {
      errors.push({
        row: index + 1,
        error: error.message,
        data: row
      });
    }
  }

  return {
    success: errors.length === 0,
    imported: products.length,
    errors: errors
  };
};
```

## 🔍 Search and Filtering Examples

### Advanced Product Search

```javascript
// Frontend: Advanced search with multiple filters
const searchProducts = async (searchParams) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Text search
    if (searchParams.query) {
      queryParams.append('search', searchParams.query);
    }
    
    // Category filter
    if (searchParams.category) {
      queryParams.append('category', searchParams.category);
    }
    
    // Price range
    if (searchParams.minPrice) {
      queryParams.append('minPrice', searchParams.minPrice);
    }
    if (searchParams.maxPrice) {
      queryParams.append('maxPrice', searchParams.maxPrice);
    }
    
    // Location filter
    if (searchParams.location) {
      queryParams.append('location', searchParams.location);
    }
    
    // Pagination
    queryParams.append('page', searchParams.page || 1);
    queryParams.append('limit', searchParams.limit || 20);
    
    // Sorting
    queryParams.append('sortBy', searchParams.sortBy || 'createdAt');
    queryParams.append('sortOrder', searchParams.sortOrder || 'desc');

    const response = await fetch(`/api/supplies?${queryParams}`);
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

// Usage example
const searchResults = await searchProducts({
  query: 'cleaning spray',
  category: 'cleaning_supplies',
  minPrice: 10,
  maxPrice: 50,
  location: 'San Francisco',
  page: 1,
  limit: 20,
  sortBy: 'price',
  sortOrder: 'asc'
});
```

### Geospatial Search

```javascript
// Frontend: Find nearby products
const findNearbyProducts = async (userLocation, radius = 10) => {
  try {
    const response = await fetch(
      `/api/supplies/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}`
    );
    const result = await response.json();
    
    return result.data;
  } catch (error) {
    console.error('Nearby search error:', error);
    throw error;
  }
};

// Usage example
const userLocation = { lat: 37.7749, lng: -122.4194 };
const nearbyProducts = await findNearbyProducts(userLocation, 5);
```

### Search with Autocomplete

```javascript
// Frontend: Search autocomplete
const getSearchSuggestions = async (query) => {
  try {
    const response = await fetch(`/api/supplies?search=${encodeURIComponent(query)}&limit=5`);
    const result = await response.json();
    
    return result.data.map(product => ({
      id: product._id,
      title: product.title,
      category: product.category,
      price: product.pricing.retailPrice,
      image: product.images[0]?.thumbnail
    }));
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
};

// Debounced search input
const useSearchAutocomplete = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      if (searchQuery.length >= 2) {
        setLoading(true);
        const results = await getSearchSuggestions(searchQuery);
        setSuggestions(results);
        setLoading(false);
      } else {
        setSuggestions([]);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return { query, setQuery, suggestions, loading };
};
```

## 🛍️ Order Management Examples

### Placing an Order

```javascript
// Frontend: Place an order
const placeOrder = async (productId, orderData) => {
  try {
    const response = await fetch(`/api/supplies/${productId}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        quantity: orderData.quantity,
        deliveryAddress: {
          street: orderData.deliveryAddress.street,
          city: orderData.deliveryAddress.city,
          state: orderData.deliveryAddress.state,
          zipCode: orderData.deliveryAddress.zipCode,
          country: orderData.deliveryAddress.country
        },
        specialInstructions: orderData.specialInstructions,
        contactInfo: {
          phone: orderData.contactInfo.phone,
          email: orderData.contactInfo.email
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Show success message
      showNotification('Order placed successfully!', 'success');
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Order error:', error);
    showNotification('Failed to place order', 'error');
    throw error;
  }
};
```

### Order Status Management

```javascript
// Backend: Update order status with notifications
const updateOrderStatus = async (productId, orderId, newStatus, supplierId) => {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    // Check authorization
    if (product.supplier.toString() !== supplierId) {
      throw new Error('Not authorized to update this order');
    }

    const order = product.orders.id(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    const oldStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date();

    // Update inventory if order is completed
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      product.inventory.quantity -= order.quantity;
    }

    // Revert inventory if order is cancelled
    if (newStatus === 'cancelled' && oldStatus === 'completed') {
      product.inventory.quantity += order.quantity;
    }

    await product.save();

    // Send notification to customer
    const customer = await User.findById(order.user);
    await EmailService.sendEmail({
      to: customer.email,
      subject: 'Order Status Update',
      template: 'order-status-update',
      data: {
        productName: product.title,
        orderId: orderId,
        oldStatus: oldStatus,
        newStatus: newStatus,
        quantity: order.quantity,
        totalCost: order.totalCost
      }
    });

    return order;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};
```

### Order History and Tracking

```javascript
// Frontend: Get user's order history
const getOrderHistory = async (page = 1, limit = 10) => {
  try {
    const response = await fetch(`/api/supplies/my-orders?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching order history:', error);
    throw error;
  }
};

// Order status tracking component
const OrderStatusTracker = ({ order }) => {
  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: '📝' },
    { key: 'confirmed', label: 'Confirmed', icon: '✅' },
    { key: 'processing', label: 'Processing', icon: '⚙️' },
    { key: 'shipped', label: 'Shipped', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '📦' }
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.key === order.status);
  const isCompleted = (stepIndex) => stepIndex <= currentStepIndex;

  return (
    <div className="order-status-tracker">
      {statusSteps.map((step, index) => (
        <div
          key={step.key}
          className={`status-step ${isCompleted(index) ? 'completed' : ''} ${
            index === currentStepIndex ? 'current' : ''
          }`}
        >
          <div className="step-icon">{step.icon}</div>
          <div className="step-label">{step.label}</div>
        </div>
      ))}
    </div>
  );
};
```

## ⭐ Review System Examples

### Adding a Review

```javascript
// Frontend: Add product review
const addReview = async (productId, reviewData) => {
  try {
    const response = await fetch(`/api/supplies/${productId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        rating: reviewData.rating,
        comment: reviewData.comment
      })
    });

    const result = await response.json();
    
    if (result.success) {
      showNotification('Review added successfully!', 'success');
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Review error:', error);
    showNotification('Failed to add review', 'error');
    throw error;
  }
};
```

### Review Management

```javascript
// Backend: Update average rating after review
const updateAverageRating = async (productId) => {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.reviews.length === 0) {
      product.averageRating = 0;
    } else {
      const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      product.averageRating = totalRating / product.reviews.length;
    }

    await product.save();
    return product.averageRating;
  } catch (error) {
    console.error('Error updating average rating:', error);
    throw error;
  }
};

// Frontend: Review form component
const ReviewForm = ({ productId, onReviewAdded }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await addReview(productId, { rating, comment });
      setRating(0);
      setComment('');
      onReviewAdded();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <div className="rating-input">
        <label>Rating:</label>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => setRating(star)}
          >
            ⭐
          </button>
        ))}
      </div>
      
      <div className="comment-input">
        <label htmlFor="comment">Comment:</label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Share your experience with this product..."
        />
      </div>
      
      <button type="submit" disabled={submitting || rating === 0}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};
```

## 📊 Analytics and Reporting Examples

### Sales Analytics

```javascript
// Backend: Generate sales analytics
const getSalesAnalytics = async (supplierId, dateRange) => {
  try {
    const { startDate, endDate } = dateRange;
    
    const products = await Product.find({
      supplier: supplierId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const analytics = {
      totalProducts: products.length,
      totalRevenue: 0,
      totalOrders: 0,
      topProducts: [],
      categoryBreakdown: {},
      monthlyTrends: []
    };

    // Calculate revenue and orders
    products.forEach(product => {
      product.orders.forEach(order => {
        if (order.status === 'delivered') {
          analytics.totalRevenue += order.totalCost;
          analytics.totalOrders += 1;
        }
      });

      // Category breakdown
      if (!analytics.categoryBreakdown[product.category]) {
        analytics.categoryBreakdown[product.category] = 0;
      }
      analytics.categoryBreakdown[product.category] += 1;
    });

    // Top products by revenue
    analytics.topProducts = products
      .map(product => ({
        id: product._id,
        name: product.name,
        revenue: product.orders
          .filter(order => order.status === 'delivered')
          .reduce((sum, order) => sum + order.totalCost, 0)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return analytics;
  } catch (error) {
    console.error('Error generating analytics:', error);
    throw error;
  }
};
```

### Inventory Management

```javascript
// Backend: Low stock alert system
const checkLowStockItems = async () => {
  try {
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: {
        $lte: ['$inventory.quantity', '$inventory.minStock']
      }
    }).populate('supplier', 'email firstName lastName');

    for (const product of lowStockProducts) {
      await EmailService.sendEmail({
        to: product.supplier.email,
        subject: 'Low Stock Alert',
        template: 'low-stock-alert',
        data: {
          productName: product.name,
          sku: product.sku,
          currentStock: product.inventory.quantity,
          minStock: product.inventory.minStock,
          supplierName: `${product.supplier.firstName} ${product.supplier.lastName}`
        }
      });
    }

    return lowStockProducts.length;
  } catch (error) {
    console.error('Error checking low stock:', error);
    throw error;
  }
};

// Schedule low stock check (run daily)
cron.schedule('0 9 * * *', async () => {
  console.log('Running low stock check...');
  const lowStockCount = await checkLowStockItems();
  console.log(`Found ${lowStockCount} low stock items`);
});
```

## 🔄 Subscription Management Examples

### Creating Subscription Kits

```javascript
// Backend: Create subscription kit
const createSubscriptionKit = async (kitData) => {
  try {
    const { name, description, category, products, pricing, frequency, targetAudience, benefits } = kitData;

    const kit = await SubscriptionKit.create({
      name,
      description,
      category,
      products: products.map(p => ({
        product: p.productId,
        quantity: p.quantity
      })),
      pricing,
      frequency,
      targetAudience,
      benefits
    });

    return kit;
  } catch (error) {
    console.error('Error creating subscription kit:', error);
    throw error;
  }
};

// Usage example
const cleaningKit = await createSubscriptionKit({
  name: 'Monthly Cleaning Kit',
  description: 'Essential cleaning supplies for monthly maintenance',
  category: 'cleaning',
  products: [
    { productId: '64a1b2c3d4e5f6789012345', quantity: 2 }, // Cleaning spray
    { productId: '64a1b2c3d4e5f6789012346', quantity: 1 }, // Microfiber cloths
    { productId: '64a1b2c3d4e5f6789012347', quantity: 1 }  // Floor cleaner
  ],
  pricing: {
    monthlyPrice: 49.99,
    quarterlyPrice: 139.99,
    yearlyPrice: 499.99,
    currency: 'USD'
  },
  frequency: 'monthly',
  targetAudience: ['cleaning_services', 'maintenance_teams'],
  benefits: ['Cost savings', 'Convenient delivery', 'Quality products']
});
```

## 🚀 Performance Optimization Examples

### Caching Product Data

```javascript
// Backend: Cache frequently accessed products
const getFeaturedProducts = async () => {
  const cacheKey = 'featured_products';
  
  try {
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // If not in cache, fetch from database
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
    console.error('Error fetching featured products:', error);
    throw error;
  }
};
```

### Pagination with Cursor

```javascript
// Backend: Cursor-based pagination for better performance
const getProductsWithCursor = async (cursor, limit = 20) => {
  try {
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
  } catch (error) {
    console.error('Error fetching products with cursor:', error);
    throw error;
  }
};
```

---

*These examples demonstrate common patterns and best practices for working with the Supplies feature. For more detailed information about data structures and API endpoints, refer to the other documentation files.*
