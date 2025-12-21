# Rentals Features Documentation

## Overview

The Rentals feature provides a comprehensive marketplace for equipment rentals, enabling equipment owners to list their tools, vehicles, and machinery for rent, and renters to browse, book, and manage rental transactions. The system supports short-term and long-term rentals with flexible pricing, availability management, and location-based discovery.

## Base Path
`/api/rentals`

---

## Core Features

### 1. Rental Item Management
- **Rental Creation** - Providers and admins can create detailed rental listings
- **Rental Updates** - Modify rental details, pricing, availability, and specifications
- **Rental Deletion** - Soft delete rentals (archive functionality)
- **Image Management** - Upload and manage multiple rental images
- **Document Management** - Upload manuals, warranties, insurance documents
- **Rental Status** - Control rental visibility (active/inactive, featured)
- **Specifications** - Detailed equipment specifications (brand, model, year, condition)
- **Requirements** - Set rental requirements (age, license, deposit, insurance)

### 2. Rental Discovery & Browsing
- **Browse Rentals** - Paginated listing of all available rental items
- **Advanced Search** - Full-text search across name, title, description, and tags
- **Filtering Options** - Filter by:
  - Category and subcategory
  - Location (city, coordinates)
  - Price range (min/max daily rate)
  - Availability dates
  - Equipment condition
- **Featured Rentals** - View featured/promoted rental items
- **Category Browsing** - Browse rentals by category with counts
- **Location-Based Search** - Find nearby rentals using coordinates
- **Rental Details** - Comprehensive rental information including:
  - Full description and specifications
  - Pricing (hourly, daily, weekly, monthly)
  - Availability schedule
  - Owner information
  - Reviews and ratings
  - Images and documents

### 3. Pricing Management
- **Flexible Pricing** - Set pricing for multiple time periods:
  - Hourly rate
  - Daily rate
  - Weekly rate
  - Monthly rate
- **Currency Support** - Multi-currency pricing support
- **Deposit Management** - Set security deposits for rentals
- **Delivery Fees** - Optional delivery fee configuration
- **Pricing Updates** - Update pricing dynamically

### 4. Availability Management
- **Availability Status** - Mark rentals as available/unavailable
- **Schedule Management** - Block dates for maintenance or other rentals
- **Availability Calendar** - Track booked and available dates
- **Automatic Updates** - Availability updated automatically on booking
- **Conflict Prevention** - Prevent double-booking of rental items

### 5. Booking Management
- **Booking Creation** - Renters can book rental items for specific dates
- **Booking Tracking** - Track booking status through rental process
- **Booking Status Updates** - Update booking status (pending → confirmed → completed)
- **Date Management** - Start and end date selection
- **Quantity Management** - Book multiple units if available
- **Special Requests** - Include special requests with bookings
- **Contact Information** - Renter contact details for coordination

### 6. Location Services
- **Geospatial Search** - Find rentals within specified radius
- **Location-Based Filtering** - Filter rentals by city or location
- **Coordinates Support** - Latitude/longitude for precise location
- **Nearby Rentals** - Discover rentals near user location
- **Pickup/Delivery Options** - Configure pickup required or delivery available
- **Delivery Address** - Delivery address management for bookings

### 7. Review & Rating System
- **Rental Reviews** - Renters can review rented equipment
- **Rating System** - 1-5 star rating system
- **Review Comments** - Detailed feedback and comments
- **Review Display** - Show reviews and ratings on rental pages
- **Average Ratings** - Calculate and display average rental ratings
- **Review Analytics** - Track review trends and feedback

### 8. Maintenance Tracking
- **Service History** - Track maintenance and service records
- **Last Service Date** - Record last service date
- **Next Service Date** - Schedule upcoming maintenance
- **Service Costs** - Track maintenance costs
- **Service Types** - Categorize service types (routine, repair, etc.)

### 9. Owner Dashboard
- **My Rentals** - View all created rental items
- **Booking Management** - Manage and process bookings
- **Availability Overview** - Monitor availability and schedule
- **Revenue Tracking** - Track rental earnings
- **Rental Performance** - View rental views, bookings, and reviews

### 10. Renter Dashboard
- **My Bookings** - View all rental bookings
- **Booking Status** - Track booking status and rental period
- **Booking History** - Access past rental bookings
- **Upcoming Rentals** - View upcoming rental dates
- **Review Management** - Manage rental reviews

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Get all rental items | `page`, `limit`, `search`, `category`, `location`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder` |
| GET | `/items` | Get rental items (alias) | Same as above |
| GET | `/:id` | Get rental details | - |
| GET | `/items/:id` | Get rental item (alias) | - |
| GET | `/categories` | Get rental categories | - |
| GET | `/featured` | Get featured rentals | `limit` |
| GET | `/nearby` | Get nearby rentals | `lat`, `lng`, `radius`, `page`, `limit` |

### Authenticated Endpoints - Rental Management

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/` | Create rental | **provider, admin** |
| POST | `/items` | Create rental (alias) | **provider, admin** |
| PUT | `/:id` | Update rental | **provider, admin** |
| DELETE | `/:id` | Delete rental | **provider, admin** |
| POST | `/:id/images` | Upload rental images | **provider, admin** |
| DELETE | `/:id/images/:imageId` | Delete rental image | **provider, admin** |

### Authenticated Endpoints - Bookings & Reviews

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/:id/book` | Book rental | AUTHENTICATED |
| PUT | `/:id/bookings/:bookingId/status` | Update booking status | AUTHENTICATED |
| POST | `/:id/reviews` | Add rental review | AUTHENTICATED |
| GET | `/my-rentals` | Get my rentals | AUTHENTICATED |
| GET | `/my-bookings` | Get my rental bookings | AUTHENTICATED |

### Admin Endpoints

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/statistics` | Get rental statistics | **admin** |

---

## Request/Response Examples

### Create Rental (Provider)

```http
POST /api/rentals
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Professional Drill Set",
  "title": "Heavy Duty Cordless Drill Set",
  "description": "Complete professional drill set with multiple bits",
  "category": "tools",
  "subcategory": "power_tools",
  "pricing": {
    "hourly": 15,
    "daily": 50,
    "weekly": 300,
    "monthly": 1000,
    "currency": "USD"
  },
  "location": {
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "pickupRequired": true,
    "deliveryAvailable": false
  },
  "specifications": {
    "brand": "DeWalt",
    "model": "DCD996B",
    "year": 2023,
    "condition": "excellent",
    "features": ["cordless", "brushless", "LED light"],
    "dimensions": {
      "length": 12,
      "width": 3,
      "height": 8,
      "unit": "inches"
    },
    "weight": {
      "value": 3.2,
      "unit": "lbs"
    }
  },
  "requirements": {
    "minAge": 18,
    "licenseRequired": false,
    "deposit": 100,
    "insuranceRequired": true
  },
  "tags": ["drill", "power_tools", "construction"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rental item created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "Professional Drill Set",
    "title": "Heavy Duty Cordless Drill Set",
    "owner": "64a1b2c3d4e5f6789012346",
    "pricing": {
      "hourly": 15,
      "daily": 50,
      "weekly": 300,
      "monthly": 1000,
      "currency": "USD"
    },
    "isActive": true,
    "isFeatured": false,
    "views": 0,
    "createdAt": "2025-07-01T10:00:00.000Z"
  }
}
```

### Book Rental

```http
POST /api/rentals/:id/book
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2025-07-15T09:00:00.000Z",
  "endDate": "2025-07-17T17:00:00.000Z",
  "quantity": 1,
  "specialRequests": "Please ensure fully charged batteries",
  "contactInfo": {
    "phone": "+1234567890",
    "email": "renter@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rental item booked successfully",
  "data": {
    "user": "64a1b2c3d4e5f6789012347",
    "startDate": "2025-07-15T09:00:00.000Z",
    "endDate": "2025-07-17T17:00:00.000Z",
    "quantity": 1,
    "totalCost": 100,
    "specialRequests": "Please ensure fully charged batteries",
    "contactInfo": {
      "phone": "+1234567890",
      "email": "renter@example.com"
    },
    "status": "pending",
    "createdAt": "2025-07-01T10:00:00.000Z"
  }
}
```

### Update Booking Status

```http
PUT /api/rentals/:id/bookings/:bookingId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "user": "64a1b2c3d4e5f6789012347",
    "startDate": "2025-07-15T09:00:00.000Z",
    "endDate": "2025-07-17T17:00:00.000Z",
    "quantity": 1,
    "totalCost": 100,
    "status": "confirmed",
    "updatedAt": "2025-07-01T10:30:00.000Z"
  }
}
```

### Upload Rental Images

```http
POST /api/rentals/:id/images
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
      "url": "https://example.com/drill1.jpg",
      "publicId": "drill_image_123",
      "thumbnail": "https://example.com/drill1_thumb.jpg"
    },
    {
      "url": "https://example.com/drill2.jpg",
      "publicId": "drill_image_124",
      "thumbnail": "https://example.com/drill2_thumb.jpg"
    }
  ]
}
```

### Add Rental Review

```http
POST /api/rentals/:id/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent drill set, very reliable and easy to use. Owner was very professional and helpful."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "user": "64a1b2c3d4e5f6789012347",
    "rating": 5,
    "comment": "Excellent drill set, very reliable and easy to use. Owner was very professional and helpful.",
    "createdAt": "2025-07-01T10:00:00.000Z"
  }
}
```

### Get Nearby Rentals

```http
GET /api/rentals/nearby?lat=40.7128&lng=-74.0060&radius=5&limit=20
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 25,
  "page": 1,
  "pages": 3,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Professional Drill Set",
      "title": "Heavy Duty Cordless Drill Set",
      "location": {
        "coordinates": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      },
      "owner": {
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

---

## Rental Booking Flow

### 1. Rental Discovery
- Renter browses rentals via `/` endpoint
- Renter applies filters by category, location, price, etc.
- Renter views detailed rental information
- Renter checks owner profile and rental reviews
- Renter checks availability calendar

### 2. Booking Creation
- Renter selects rental dates via `POST /:id/book`
- System checks availability for selected dates
- Booking created with status `pending`
- Payment processed (if required)
- Deposit held (if required)
- Email notification sent

### 3. Booking Confirmation
- Owner reviews booking request
- Owner confirms booking: `pending` → `confirmed`
- Availability updated (dates blocked)
- Email notification sent to renter

### 4. Rental Period
- Owner delivers equipment (or renter picks up)
- Rental period: `confirmed` → `in_progress`
- Renter uses equipment during rental period
- Equipment returned at end of period

### 5. Completion
- Rental completed: `in_progress` → `completed`
- Deposit released (if applicable)
- Renter can add review and rating
- Availability updated (dates unblocked)

---

## Booking Status Flow

```
pending → confirmed → in_progress → completed
```

**Status Details:**
- **pending** - Booking created, awaiting owner confirmation
- **confirmed** - Booking confirmed by owner
- **in_progress** - Rental period active
- **completed** - Rental period ended, equipment returned
- **cancelled** - Booking cancelled (can occur at any stage before completion)

---

## Rental Categories

### Tools
- Hand tools
- Power tools
- Specialty tools
- Tool accessories

### Vehicles
- Cars and trucks
- Vans and SUVs
- Motorcycles
- Specialty vehicles

### Equipment
- Construction equipment
- Cleaning equipment
- Landscaping equipment
- Event equipment

### Machinery
- Heavy machinery
- Industrial equipment
- Agricultural machinery
- Manufacturing equipment

---

## Data Models

### RentalItem Model

```javascript
{
  // Basic Information
  name: String,                    // Required
  title: String,                   // Required
  description: String,             // Required
  category: String,                // Required, enum: tools, vehicles, equipment, machinery
  subcategory: String,            // Required
  owner: ObjectId,                // Required, User reference
  
  // Pricing
  pricing: {
    hourly: Number,               // Optional
    daily: Number,                // Optional
    weekly: Number,               // Optional
    monthly: Number,              // Optional
    currency: String              // Default: USD
  },
  
  // Availability
  availability: {
    isAvailable: Boolean,         // Default: true
    schedule: [{
      startDate: Date,
      endDate: Date,
      reason: String              // rented, maintenance, unavailable
    }]
  },
  
  // Location
  location: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    pickupRequired: Boolean,      // Default: true
    deliveryAvailable: Boolean,   // Default: false
    deliveryFee: Number            // Optional
  },
  
  // Specifications
  specifications: {
    brand: String,
    model: String,
    year: Number,
    condition: String,            // enum: excellent, good, fair, poor
    features: [String],
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: String                // Default: inches
    },
    weight: {
      value: Number,
      unit: String                // Default: lbs
    }
  },
  
  // Requirements
  requirements: {
    minAge: Number,
    licenseRequired: Boolean,     // Default: false
    licenseType: String,
    deposit: Number,
    insuranceRequired: Boolean   // Default: false
  },
  
  // Media
  images: [{
    url: String,
    publicId: String,
    thumbnail: String,
    alt: String
  }],
  documents: [{
    type: String,                 // enum: manual, warranty, insurance, license, other
    url: String,
    publicId: String,
    name: String
  }],
  
  // Maintenance
  maintenance: {
    lastService: Date,
    nextService: Date,
    serviceHistory: [{
      date: Date,
      type: String,
      description: String,
      cost: Number
    }]
  },
  
  // Bookings (Embedded)
  bookings: [{
    user: ObjectId,                // User reference
    startDate: Date,              // Required
    endDate: Date,                // Required
    quantity: Number,             // Default: 1
    totalCost: Number,            // Required
    specialRequests: String,
    contactInfo: {
      phone: String,
      email: String
    },
    status: String,                // enum: pending, confirmed, cancelled, completed
    createdAt: Date,
    updatedAt: Date
  }],
  
  // Reviews (Embedded)
  reviews: [{
    user: ObjectId,                // User reference
    rating: Number,                // Required, min: 1, max: 5
    comment: String,
    createdAt: Date
  }],
  averageRating: Number,           // Default: 0, min: 0, max: 5
  
  // Status
  isActive: Boolean,               // Default: true
  isFeatured: Boolean,             // Default: false
  views: Number,                   // Default: 0
  tags: [String],
  
  // Metadata
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
- `search` - Full-text search across name, title, description, tags

**Filters:**
- `category` - Filter by rental category
- `location` - Filter by city name
- `minPrice` - Minimum daily price filter
- `maxPrice` - Maximum daily price filter

**Sorting:**
- `sortBy` - Sort field (createdAt, price, rating)
- `sortOrder` - Sort direction (asc, desc)

**Location Search:**
- `lat` - Latitude coordinate (required)
- `lng` - Longitude coordinate (required)
- `radius` - Search radius in kilometers (default: 10)

### Response Format

**List Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "pages": 15,
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

- **Total Rentals** - Total number of active rental items
- **Rentals by Category** - Rental distribution by category
- **Total Bookings** - Total booking count
- **Booking Trends** - Monthly booking trends
- **Average Rental Duration** - Average rental period length
- **Revenue** - Total rental revenue
- **Customer Satisfaction** - Average ratings and review counts
- **Geographic Coverage** - Rentals available by location
- **Utilization Rate** - Equipment utilization percentage

---

## Related Features

The Rentals feature integrates with several other features in the LocalPro Super App:

- **User Management** - Owner and renter profiles
- **Providers** - Owner profiles and management
- **Finance** - Rental payment processing and deposits
- **File Storage** - Cloudinary integration for images and documents
- **Email Service** - Booking notifications and updates
- **Analytics** - Rental performance and booking analytics
- **Reviews & Ratings** - Rental review system
- **Maps & Location** - Geospatial search and delivery tracking

---

## Common Use Cases

1. **Rental Listing** - Owners create and manage rental listings
2. **Rental Discovery** - Renters browse and search for equipment
3. **Rental Booking** - Renters book equipment for specific dates
4. **Booking Management** - Owners process and manage bookings
5. **Availability Management** - Owners manage availability calendar
6. **Rental Reviews** - Renters review rented equipment
7. **Location-Based Search** - Find rentals near renter location
8. **Maintenance Tracking** - Track equipment maintenance and service

---

## Error Handling

**Common Error Codes:**
- `400` - Validation errors (invalid data, missing fields, date conflicts)
- `401` - Unauthorized (no token provided)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (rental or booking doesn't exist)
- `409` - Conflict (dates already booked, availability conflict)
- `500` - Server error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "startDate",
      "message": "Selected dates are not available"
    }
  ]
}
```

---

## Availability Management

### Availability Checking
- Check availability before booking creation
- Prevent double-booking of rental items
- Block dates for maintenance
- Automatic availability updates on booking

### Schedule Management
- View availability calendar
- Block dates for maintenance
- Unblock dates when rentals complete
- Handle date conflicts

### Availability Status
- `isAvailable` - Overall availability flag
- `schedule` - Array of blocked date ranges
- Automatic updates on booking status changes

---

## Best Practices

### For Owners
1. **Accurate Descriptions** - Provide detailed equipment descriptions
2. **Quality Images** - Upload high-quality rental images
3. **Maintain Availability** - Keep availability calendar up to date
4. **Prompt Responses** - Respond to booking requests promptly
5. **Maintenance Records** - Keep maintenance history current

### For Renters
1. **Check Availability** - Verify dates before booking
2. **Read Requirements** - Review rental requirements (age, license, deposit)
3. **Special Requests** - Include special requests in booking
4. **Return on Time** - Return equipment on scheduled end date
5. **Leave Reviews** - Review equipment after rental completion

### For Developers
1. **Date Validation** - Always validate date ranges and conflicts
2. **Availability Checks** - Check availability before booking creation
3. **Atomic Updates** - Ensure availability updates are atomic
4. **Error Handling** - Handle all error cases gracefully
5. **Image Optimization** - Optimize images before upload

---

*For detailed implementation guidance, see the individual documentation files in the `features/rentals/` and `docs/features/` directories.*

