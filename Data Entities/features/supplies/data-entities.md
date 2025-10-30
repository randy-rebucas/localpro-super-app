# Supplies Data Entities

## Overview

The Supplies feature uses three main data entities to manage products, subscriptions, and orders. These entities are designed to support a comprehensive e-commerce marketplace with inventory management, order processing, and customer feedback systems.

## 📦 Product Entity

The main entity representing individual products in the supplies marketplace.

### Schema Definition

```javascript
const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Classification
  category: {
    type: String,
    enum: ['cleaning_supplies', 'tools', 'materials', 'equipment'],
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  
  // Pricing
  pricing: {
    retailPrice: {
      type: Number,
      required: true
    },
    wholesalePrice: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Inventory Management
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    minStock: {
      type: Number,
      default: 10
    },
    maxStock: Number,
    location: String
  },
  
  // Product Specifications
  specifications: {
    weight: String,
    dimensions: String,
    material: String,
    color: String,
    warranty: String
  },
  
  // Location Information
  location: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Media
  images: [{
    url: String,
    publicId: String,
    thumbnail: String,
    alt: String
  }],
  tags: [String],
  
  // Status and Features
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  isSubscriptionEligible: {
    type: Boolean,
    default: false
  },
  
  // Order Management
  orders: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    totalCost: {
      type: Number,
      required: true
    },
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    specialInstructions: String,
    contactInfo: {
      phone: String,
      email: String
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Review System
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // Supplier Information
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});
```

### Key Features

- **Comprehensive Product Info** - Name, title, description, and detailed specifications
- **Category System** - Hierarchical categorization with subcategories
- **Inventory Tracking** - Real-time stock management with min/max levels
- **Pricing Structure** - Retail and wholesale pricing with currency support
- **Location Services** - Address and geospatial coordinates for proximity search
- **Media Management** - Image upload with Cloudinary integration
- **Order Integration** - Embedded order management within products
- **Review System** - Customer feedback with rating aggregation
- **Supplier Linking** - Reference to supplier user account

### Indexes

```javascript
// Performance indexes
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ brand: 1, category: 1 });
productSchema.index({ 'pricing.retailPrice': 1, category: 1 });
productSchema.index({ 'inventory.quantity': 1, isActive: 1 });
productSchema.index({ createdAt: -1, isActive: 1 });
productSchema.index({ updatedAt: -1, isActive: 1 });

// Advanced filtering indexes
productSchema.index({ category: 1, subcategory: 1, isActive: 1 });
productSchema.index({ supplier: 1, isActive: 1, category: 1 });
productSchema.index({ 'pricing.retailPrice': 1, 'pricing.wholesalePrice': 1, isActive: 1 });
productSchema.index({ 'inventory.quantity': 1, 'inventory.minStock': 1, isActive: 1 });
productSchema.index({ 'inventory.location': 1, isActive: 1 });
productSchema.index({ 'specifications.brand': 1, 'specifications.model': 1, isActive: 1 });
productSchema.index({ 'specifications.material': 1, category: 1, isActive: 1 });
productSchema.index({ 'specifications.color': 1, category: 1, isActive: 1 });
productSchema.index({ isSubscriptionEligible: 1, isActive: 1 });
productSchema.index({ tags: 1, isActive: 1 });

// Text search index
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text'
});
```

## 📋 SubscriptionKit Entity

Pre-configured product bundles for subscription-based ordering.

### Schema Definition

```javascript
const subscriptionKitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['cleaning', 'maintenance', 'monthly', 'quarterly', 'custom'],
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  pricing: {
    monthlyPrice: Number,
    quarterlyPrice: Number,
    yearlyPrice: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  frequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly'],
    default: 'monthly'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  targetAudience: [String], // e.g., ['cleaning_services', 'maintenance_teams']
  benefits: [String]
}, {
  timestamps: true
});
```

### Key Features

- **Product Bundling** - Combine multiple products into subscription packages
- **Flexible Pricing** - Multiple pricing tiers (monthly, quarterly, yearly)
- **Targeted Marketing** - Audience-specific kit configurations
- **Frequency Control** - Configurable delivery schedules

## 🛒 Order Entity

Comprehensive order management with payment and shipping tracking.

### Schema Definition

```javascript
const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  subscriptionKit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionKit'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'paypal', 'paymaya'],
      default: 'cash'
    },
    transactionId: String,
    paypalOrderId: String,
    paypalTransactionId: String,
    paymayaReferenceNumber: String,
    paymayaCheckoutId: String,
    paymayaPaymentId: String,
    paymayaInvoiceId: String,
    paymayaTransactionId: String,
    paidAt: Date
  },
  shipping: {
    method: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  isSubscription: {
    type: Boolean,
    default: false
  },
  subscriptionDetails: {
    frequency: String,
    nextDelivery: Date,
    isActive: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});
```

### Key Features

- **Multi-Item Orders** - Support for multiple products in single order
- **Subscription Integration** - Link to subscription kits for recurring orders
- **Payment Tracking** - Comprehensive payment status and transaction management
- **Shipping Management** - Delivery tracking and status updates
- **Flexible Payment Methods** - Support for multiple payment providers

## 🔗 Relationships

### Product Relationships
- **Supplier** → `User` (Many-to-One)
- **Orders** → `User` (One-to-Many, embedded)
- **Reviews** → `User` (One-to-Many, embedded)

### SubscriptionKit Relationships
- **Products** → `Product` (Many-to-Many)

### Order Relationships
- **Customer** → `User` (Many-to-One)
- **Items** → `Product` (Many-to-Many)
- **SubscriptionKit** → `SubscriptionKit` (Many-to-One)

## 📊 Data Validation

### Product Validation
- **Required Fields**: name, title, description, category, subcategory, brand, sku, pricing.retailPrice, inventory.quantity, supplier
- **Unique Constraints**: sku (globally unique)
- **Enum Values**: category, subcategory, order status, review rating
- **Numeric Ranges**: inventory.quantity (≥0), rating (1-5), averageRating (0-5)

### Order Validation
- **Required Fields**: customer, items, totalAmount
- **Array Validation**: items must contain at least one product
- **Status Enums**: order status, payment status, payment method
- **Date Validation**: payment dates, delivery dates

## 🚀 Performance Considerations

### Query Optimization
- **Compound Indexes** - Multi-field indexes for complex filtering
- **Text Search** - Full-text search across product fields
- **Geospatial Queries** - Location-based product discovery
- **Pagination** - Efficient large dataset handling

### Caching Strategy
- **Product Listings** - Cache frequently accessed product lists
- **Category Data** - Cache category and subcategory aggregations
- **Search Results** - Cache search queries and filters
- **Inventory Status** - Cache stock levels for performance

### Data Consistency
- **Inventory Updates** - Atomic operations for stock management
- **Order Processing** - Transaction-based order creation
- **Rating Calculation** - Automatic average rating updates
- **View Counting** - Incremental view tracking

---

*This documentation covers the core data structures. For API usage and implementation examples, see the related documentation files.*
