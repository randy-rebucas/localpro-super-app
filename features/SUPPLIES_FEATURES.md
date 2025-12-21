# Supplies Features Documentation

## Overview

The Supplies feature provides a comprehensive e-commerce marketplace for equipment, tools, materials, and cleaning supplies. It enables suppliers to list their products and customers to browse, order, and review supplies through a robust e-commerce system with inventory tracking, order management, and location-based discovery.

## Base Path
`/api/supplies`

---

## Core Features

### 1. Product Management
- **Product Creation** - Suppliers and admins can create detailed product listings
- **Product Updates** - Modify product details, pricing, inventory, and specifications
- **Product Deletion** - Soft delete products (archive functionality)
- **Image Management** - Upload and manage multiple product images
- **Product Status** - Control product visibility (active/inactive, featured)
- **SKU Management** - Unique SKU tracking for inventory management
- **Brand Management** - Organize products by brand
- **Category Organization** - Categorize products for easy discovery

### 2. Product Discovery & Browsing
- **Browse Products** - Paginated listing of all available products
- **Advanced Search** - Full-text search across name, description, and tags
- **Filtering Options** - Filter by:
  - Category and subcategory
  - Location (city, coordinates)
  - Price range (min/max)
  - Brand
  - Availability (in stock)
- **Featured Products** - View featured/promoted products
- **Category Browsing** - Browse products by category with counts
- **Location-Based Search** - Find nearby products using coordinates
- **Product Details** - Comprehensive product information including:
  - Full description and specifications
  - Pricing (retail and wholesale)
  - Inventory status
  - Supplier information
  - Reviews and ratings
  - Images and media

### 3. Inventory Management
- **Stock Tracking** - Real-time inventory quantity tracking
- **Stock Alerts** - Low stock warnings (minStock threshold)
- **Stock Limits** - Maximum stock capacity management
- **Location Tracking** - Warehouse/location tracking for inventory
- **Automatic Updates** - Inventory automatically updated on order completion
- **Stock Status** - Display availability status to customers

### 4. Order Management
- **Order Creation** - Customers can place orders for products
- **Order Tracking** - Track order status through fulfillment process
- **Order Status Updates** - Update order status (pending → confirmed → processing → shipped → delivered)
- **Delivery Management** - Delivery address and special instructions
- **Contact Information** - Customer contact details for delivery
- **Order History** - View order history for customers and suppliers
- **Order Analytics** - Track order volume and trends

### 5. Pricing Management
- **Retail Pricing** - Set retail prices for customers
- **Wholesale Pricing** - Set wholesale prices for bulk orders
- **Currency Support** - Multi-currency pricing support
- **Price Display** - Display appropriate price based on user type
- **Pricing Updates** - Update pricing dynamically

### 6. Review & Rating System
- **Product Reviews** - Customers can review purchased products
- **Rating System** - 1-5 star rating system
- **Review Comments** - Detailed feedback and comments
- **Review Display** - Show reviews and ratings on product pages
- **Average Ratings** - Calculate and display average product ratings
- **Review Analytics** - Track review trends and feedback

### 7. Subscription Support
- **Subscription Eligibility** - Mark products as subscription-eligible
- **Recurring Orders** - Support for recurring product orders
- **Subscription Kits** - Pre-configured product bundles for subscriptions
- **Subscription Management** - Manage subscription preferences

### 8. Location Services
- **Geospatial Search** - Find products within specified radius
- **Location-Based Filtering** - Filter products by city or location
- **Coordinates Support** - Latitude/longitude for precise location
- **Nearby Products** - Discover products near user location
- **Delivery Area** - Define delivery areas for products

### 9. Supplier Dashboard
- **My Products** - View all created products
- **Order Management** - Manage and process orders
- **Inventory Overview** - Monitor inventory levels and alerts
- **Sales Analytics** - Track sales and revenue
- **Product Performance** - View product views, orders, and reviews

### 10. Customer Dashboard
- **My Orders** - View all placed orders
- **Order Status** - Track order status and delivery
- **Order History** - Access past orders
- **Wishlist** - Save products for later (if implemented)
- **Review Management** - Manage product reviews

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get all supplies | `page`, `limit`, `search`, `category`, `location`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder` |
| GET | `/products` | Get supplies (alias) | Same as above |
| GET | `/:id` | Get supply details | - |
| GET | `/products/:id` | Get supply (alias) | - |
| GET | `/categories` | Get supply categories | - |
| GET | `/featured` | Get featured supplies | `limit` |
| GET | `/nearby` | Get nearby supplies | `lat`, `lng`, `radius`, `page`, `limit` |

### Authenticated Endpoints - Product Management

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/` | Create supply | **supplier, admin** |
| POST | `/products` | Create supply (alias) | **supplier, admin** |
| PUT | `/:id` | Update supply | **supplier, admin** |
| DELETE | `/:id` | Delete supply | **supplier, admin** |
| POST | `/:id/images` | Upload supply images | **supplier, admin** |
| DELETE | `/:id/images/:imageId` | Delete supply image | **supplier, admin** |

### Authenticated Endpoints - Orders & Reviews

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/:id/order` | Order supply | AUTHENTICATED |
| PUT | `/:id/orders/:orderId/status` | Update order status | AUTHENTICATED |
| POST | `/:id/reviews` | Add supply review | AUTHENTICATED |
| GET | `/my-supplies` | Get my supplies | AUTHENTICATED |
| GET | `/my-orders` | Get my supply orders | AUTHENTICATED |

### Admin Endpoints

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/statistics` | Get supply statistics | **admin** |

---

## Request/Response Examples

### Create Supply (Supplier)

```http
POST /api/supplies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Professional Cleaning Spray",
  "title": "Multi-Surface Cleaning Spray 32oz",
  "description": "Heavy-duty cleaning spray for all surfaces",
  "category": "cleaning_supplies",
  "subcategory": "sprays",
  "brand": "CleanPro",
  "sku": "CP-CS-32",
  "pricing": {
    "retailPrice": 12.99,
    "wholesalePrice": 9.99,
    "currency": "USD"
  },
  "inventory": {
    "quantity": 150,
    "minStock": 10,
    "maxStock": 500,
    "location": "Warehouse A"
  },
  "specifications": {
    "weight": "2.5 lbs",
    "dimensions": "8x3x12 inches",
    "material": "Plastic bottle",
    "color": "Blue",
    "warranty": "1 year"
  },
  "location": {
    "street": "123 Industrial Blvd",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94105",
    "country": "USA"
  },
  "tags": ["cleaning", "professional", "multi-surface"],
  "isSubscriptionEligible": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Supply item created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "Professional Cleaning Spray",
    "title": "Multi-Surface Cleaning Spray 32oz",
    "supplier": "64a1b2c3d4e5f6789012346",
    "createdAt": "2025-07-01T10:00:00.000Z"
  }
}
```

### Order Supply

```http
POST /api/supplies/:id/order
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 5,
  "deliveryAddress": {
    "street": "456 Customer St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "country": "USA"
  },
  "specialInstructions": "Leave at front door",
  "contactInfo": {
    "phone": "+1-555-0123",
    "email": "jane@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Supply item ordered successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012347",
    "user": "64a1b2c3d4e5f6789012348",
    "quantity": 5,
    "totalCost": 64.95,
    "status": "pending",
    "createdAt": "2025-07-01T14:30:00.000Z"
  }
}
```

### Update Order Status

```http
PUT /api/supplies/:id/orders/:orderId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shipped",
  "trackingNumber": "TRACK123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012347",
    "status": "shipped",
    "trackingNumber": "TRACK123456",
    "updatedAt": "2025-07-01T15:00:00.000Z"
  }
}
```

### Upload Supply Images

```http
POST /api/supplies/:id/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "images": [<file1>, <file2>]
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 image(s) uploaded successfully",
  "data": [
    {
      "url": "https://res.cloudinary.com/example/image/upload/v1234567890/cleaning-spray-1.jpg",
      "publicId": "cleaning-spray-1",
      "thumbnail": "https://res.cloudinary.com/example/image/upload/w_200,h_200/cleaning-spray-1.jpg"
    },
    {
      "url": "https://res.cloudinary.com/example/image/upload/v1234567890/cleaning-spray-2.jpg",
      "publicId": "cleaning-spray-2",
      "thumbnail": "https://res.cloudinary.com/example/image/upload/w_200,h_200/cleaning-spray-2.jpg"
    }
  ]
}
```

### Add Supply Review

```http
POST /api/supplies/:id/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent cleaning power, highly recommend!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012349",
    "user": "64a1b2c3d4e5f6789012348",
    "rating": 5,
    "comment": "Excellent cleaning power, highly recommend!",
    "createdAt": "2025-07-03T10:00:00.000Z"
  }
}
```

### Get Nearby Supplies

```http
GET /api/supplies/nearby?lat=37.7749&lng=-122.4194&radius=5&limit=20
```

**Response:**
```json
{
  "success": true,
  "count": 8,
  "total": 8,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Professional Cleaning Spray",
      "title": "Multi-Surface Cleaning Spray 32oz",
      "location": {
        "coordinates": {
          "lat": 37.7749,
          "lng": -122.4194
        }
      },
      "supplier": {
        "firstName": "John",
        "lastName": "Supplier"
      }
    }
  ]
}
```

---

## Supply Order Flow

### 1. Product Discovery
- Customer browses supplies via `/` endpoint
- Customer applies filters by category, location, price, etc.
- Customer views detailed product information
- Customer checks supplier profile and product reviews

### 2. Order Creation
- Customer places order via `POST /:id/order`
- Order created with status `pending`
- Payment processed (if required)
- Inventory checked and reserved
- Email notification sent

### 3. Order Processing
- Supplier reviews order
- Order status: `pending` → `confirmed`
- Order prepared: `confirmed` → `processing`
- Order shipped: `processing` → `shipped`
- Tracking information updated

### 4. Order Delivery
- Order delivered: `shipped` → `delivered`
- Inventory updated (quantity decreased)
- Customer receives order
- Customer can add review

---

## Order Status Flow

```
pending → confirmed → processing → shipped → delivered
```

**Status Details:**
- **pending** - Order created, awaiting confirmation
- **confirmed** - Order confirmed by supplier
- **processing** - Order being prepared
- **shipped** - Order shipped with tracking
- **delivered** - Order delivered to customer
- **cancelled** - Order cancelled (can occur at any stage before delivery)

---

## Product Categories

### Cleaning Supplies
- Sprays and cleaners
- Detergents and soaps
- Disinfectants
- Cleaning tools
- Paper products

### Tools
- Hand tools
- Power tools
- Specialty tools
- Tool accessories

### Materials
- Building materials
- Raw materials
- Consumables
- Replacement parts

### Equipment
- Heavy equipment
- Light equipment
- Equipment accessories
- Maintenance supplies

---

## Data Models

### Product Model

```javascript
{
  // Basic Information
  name: String,                    // Required
  title: String,                   // Required
  description: String,             // Required
  category: String,                // Required, enum: cleaning_supplies, tools, materials, equipment
  subcategory: String,            // Required
  brand: String,                   // Required
  sku: String,                     // Required, unique
  
  // Pricing
  pricing: {
    retailPrice: Number,           // Required
    wholesalePrice: Number,        // Optional
    currency: String               // Default: USD
  },
  
  // Inventory Management
  inventory: {
    quantity: Number,              // Required, min: 0
    minStock: Number,             // Default: 10
    maxStock: Number,             // Optional
    location: String               // Warehouse/location
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
  isActive: Boolean,               // Default: true
  isFeatured: Boolean,            // Default: false
  views: Number,                   // Default: 0
  isSubscriptionEligible: Boolean, // Default: false
  
  // Orders
  orders: [{
    user: ObjectId,                // User reference
    quantity: Number,              // Required, min: 1
    totalCost: Number,             // Required
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
    status: String,                // enum: pending, confirmed, processing, shipped, delivered, cancelled
    createdAt: Date,
    updatedAt: Date
  }],
  
  // Reviews
  reviews: [{
    user: ObjectId,                 // User reference
    rating: Number,                 // Required, min: 1, max: 5
    comment: String,
    createdAt: Date
  }],
  averageRating: Number,           // Default: 0, min: 0, max: 5
  
  // Supplier Information
  supplier: ObjectId,               // User reference (supplier)
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

### Subscription Kit Model

```javascript
{
  name: String,                     // Kit name
  description: String,              // Kit description
  products: [{
    product: ObjectId,              // Product reference
    quantity: Number,               // Quantity in kit
    price: Number                   // Price in kit
  }],
  totalPrice: Number,              // Total kit price
  frequency: String,               // Subscription frequency
  isActive: Boolean,               // Kit active status
  createdAt: Date,
  updatedAt: Date
}
```

---

## Search & Filtering

### Query Parameters

**Pagination:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Search:**
- `search` - Full-text search across name, description, tags

**Filters:**
- `category` - Filter by product category
- `location` - Filter by city name
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter

**Sorting:**
- `sortBy` - Sort field (createdAt, price, rating)
- `sortOrder` - Sort direction (asc, desc)

**Location Search:**
- `lat` - Latitude coordinate
- `lng` - Longitude coordinate
- `radius` - Search radius in kilometers (default: 10)

### Response Format

**List Response:**
```json
{
  "success": true,
  "count": 15,
  "total": 150,
  "page": 1,
  "pages": 8,
  "data": [...]
}
```

**Detail Response:**
```json
{
  "success": true,
  "data": {...}
}
```

---

## Key Metrics

- **Total Products** - Total number of active products
- **Products by Category** - Product distribution by category
- **Total Orders** - Total order count
- **Order Trends** - Monthly order trends
- **Inventory Levels** - Stock status across all products
- **Low Stock Alerts** - Products below minimum stock
- **Customer Satisfaction** - Average ratings and review counts
- **Geographic Coverage** - Products available by location
- **Sales Revenue** - Total sales and revenue tracking

---

## Related Features

The Supplies feature integrates with several other features in the LocalPro Super App:

- **User Management** - Supplier and customer profiles
- **Suppliers** - Supplier profiles and management
- **Finance** - Order payment processing
- **File Storage** - Cloudinary integration for product images
- **Email Service** - Order notifications and updates
- **Analytics** - Sales and performance tracking
- **Reviews & Ratings** - Product review system
- **Maps & Location** - Geospatial search and delivery tracking
- **Subscriptions** - Recurring order management

---

## Common Use Cases

1. **Product Listing** - Suppliers create and manage product listings
2. **Product Discovery** - Customers browse and search for products
3. **Order Placement** - Customers place orders for products
4. **Order Fulfillment** - Suppliers process and ship orders
5. **Inventory Management** - Suppliers monitor and manage stock levels
6. **Product Reviews** - Customers review purchased products
7. **Location-Based Search** - Find products near customer location

---

## Error Handling

**Common Error Codes:**
- `400` - Validation errors (invalid data, missing fields, insufficient stock)
- `401` - Unauthorized (no token provided)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (product or order doesn't exist)
- `409` - Conflict (duplicate SKU, order already processed)
- `500` - Server error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "quantity",
      "message": "Insufficient stock available"
    }
  ]
}
```

---

## Inventory Management

### Stock Tracking
- Real-time quantity updates
- Automatic decrement on order completion
- Low stock alerts when quantity < minStock
- Maximum stock capacity management

### Stock Alerts
- Email notifications for low stock
- Dashboard alerts for suppliers
- Automatic reorder suggestions

### Inventory Updates
- Automatic updates on order completion
- Manual adjustments by suppliers
- Bulk import/export capabilities

---

## Best Practices

### For Suppliers
1. **Accurate Inventory** - Keep inventory quantities up to date
2. **Quality Images** - Upload high-quality product images
3. **Detailed Descriptions** - Provide comprehensive product information
4. **Prompt Processing** - Process orders in a timely manner
5. **Stock Management** - Monitor stock levels and set appropriate minStock

### For Customers
1. **Review Products** - Leave reviews after receiving orders
2. **Check Availability** - Verify stock before placing large orders
3. **Delivery Address** - Provide accurate delivery addresses
4. **Contact Information** - Keep contact info updated

### For Developers
1. **Stock Validation** - Always validate stock before order creation
2. **Atomic Updates** - Ensure inventory updates are atomic
3. **Error Handling** - Handle all error cases gracefully
4. **Image Optimization** - Optimize images before upload
5. **Location Services** - Use efficient geospatial queries

---

*For detailed implementation guidance, see the individual documentation files in the `features/supplies/` and `docs/features/` directories.*

