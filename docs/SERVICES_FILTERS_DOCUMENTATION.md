# Services API Filters Documentation

## Endpoint: `GET /api/marketplace/services`

This endpoint allows browsing all services with advanced filtering, pagination, and sorting capabilities.

## Available Filters

### 1. **Category Filter**
Filter services by main category.

**Parameter:** `category`

**Available Categories:**
- `cleaning` - House and office cleaning services
- `plumbing` - Plumbing repairs and installations
- `electrical` - Electrical work and repairs
- `moving` - Moving and relocation services
- `landscaping` - Garden and lawn care
- `painting` - Interior and exterior painting
- `carpentry` - Woodwork and furniture
- `flooring` - Floor installation and repair
- `roofing` - Roof repairs and installation
- `hvac` - Heating, ventilation, and air conditioning
- `appliance_repair` - Appliance repair services
- `locksmith` - Lock and key services
- `handyman` - General repair services
- `home_security` - Security system installation
- `pool_maintenance` - Swimming pool maintenance
- `pest_control` - Pest control services
- `carpet_cleaning` - Carpet and upholstery cleaning
- `window_cleaning` - Window cleaning services
- `gutter_cleaning` - Gutter cleaning and maintenance
- `power_washing` - Pressure washing services
- `snow_removal` - Snow removal services
- `other` - Other services not listed

**Example:**
```bash
GET /api/marketplace/services?category=cleaning
```

### 2. **Subcategory Filter**
Filter services by specific subcategory.

**Parameter:** `subcategory`

**Example:**
```bash
GET /api/marketplace/services?subcategory=residential_cleaning
```

### 3. **Location Filter**
Filter services by location with optional geospatial search.

**Parameter:** `location`

**Optional Parameters:**
- `coordinates` - JSON string with lat/lng coordinates
- `radius` - Search radius in meters (default: 50000m = 50km)

**Examples:**
```bash
# Text-based location search
GET /api/marketplace/services?location=Manila

# Geospatial search with coordinates
GET /api/marketplace/services?location=Manila&coordinates={"lat":14.5995,"lng":120.9842}&radius=10000
```

### 4. **Price Range Filter**
Filter services by price range.

**Parameters:**
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter

**Examples:**
```bash
# Services between $50 and $200
GET /api/marketplace/services?minPrice=50&maxPrice=200

# Services above $100
GET /api/marketplace/services?minPrice=100

# Services below $500
GET /api/marketplace/services?maxPrice=500
```

### 5. **Rating Filter**
Filter services by minimum rating.

**Parameter:** `rating`

**Example:**
```bash
# Services with 4+ star rating
GET /api/marketplace/services?rating=4
```

## Pagination Parameters

### 6. **Page Number**
**Parameter:** `page`
**Default:** `1`
**Type:** Number

### 7. **Items Per Page**
**Parameter:** `limit`
**Default:** `10`
**Type:** Number

**Example:**
```bash
GET /api/marketplace/services?page=2&limit=20
```

## Sorting Parameters

### 8. **Sort Field**
**Parameter:** `sortBy`
**Default:** `createdAt`
**Available Options:**
- `createdAt` - Sort by creation date
- `title` - Sort by service title
- `pricing.basePrice` - Sort by price
- `rating.average` - Sort by rating

### 9. **Sort Order**
**Parameter:** `sortOrder`
**Default:** `desc`
**Available Options:**
- `asc` - Ascending order
- `desc` - Descending order

**Examples:**
```bash
# Sort by price (lowest first)
GET /api/marketplace/services?sortBy=pricing.basePrice&sortOrder=asc

# Sort by rating (highest first)
GET /api/marketplace/services?sortBy=rating.average&sortOrder=desc

# Sort by title (A-Z)
GET /api/marketplace/services?sortBy=title&sortOrder=asc
```

## Complete Filter Examples

### Basic Service Search
```bash
GET /api/marketplace/services
```

### Category-Specific Search
```bash
GET /api/marketplace/services?category=plumbing&subcategory=pipe_repair
```

### Location-Based Search
```bash
GET /api/marketplace/services?location=Quezon City&category=cleaning
```

### Price Range Search
```bash
GET /api/marketplace/services?category=electrical&minPrice=50&maxPrice=200
```

### High-Rated Services
```bash
GET /api/marketplace/services?rating=4.5&sortBy=rating.average&sortOrder=desc
```

### Nearby Services with Coordinates
```bash
GET /api/marketplace/services?location=Manila&coordinates={"lat":14.5995,"lng":120.9842}&radius=5000
```

### Advanced Combined Filters
```bash
GET /api/marketplace/services?category=cleaning&minPrice=25&maxPrice=100&rating=4&location=Manila&sortBy=pricing.basePrice&sortOrder=asc&page=1&limit=15
```

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "count": 10,
  "total": 150,
  "page": 1,
  "pages": 15,
  "data": [
    {
      "_id": "service_id",
      "title": "Professional House Cleaning",
      "description": "Complete house cleaning service",
      "category": "cleaning",
      "subcategory": "residential_cleaning",
      "provider": {
        "_id": "provider_id",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "avatar": {
            "url": "https://cloudinary.com/avatar.jpg",
            "publicId": "avatar_id",
            "thumbnail": "https://cloudinary.com/avatar_thumb.jpg"
          },
          "rating": 4.8
        }
      },
      "pricing": {
        "type": "hourly",
        "basePrice": 25,
        "currency": "USD"
      },
      "serviceArea": ["Manila", "Quezon City"],
      "images": [
        {
          "url": "https://cloudinary.com/service.jpg",
          "publicId": "service_img_id",
          "thumbnail": "https://cloudinary.com/service_thumb.jpg",
          "alt": "Cleaning service"
        }
      ],
      "features": ["Eco-friendly", "Insured", "Same-day service"],
      "requirements": ["Access to water", "Parking space"],
      "serviceType": "one_time",
      "estimatedDuration": {
        "min": 2,
        "max": 4
      },
      "teamSize": 2,
      "equipmentProvided": true,
      "materialsIncluded": true,
      "warranty": {
        "hasWarranty": true,
        "duration": 30,
        "description": "30-day satisfaction guarantee"
      },
      "insurance": {
        "covered": true,
        "coverageAmount": 100000
      },
      "emergencyService": {
        "available": true,
        "surcharge": 50,
        "responseTime": "within 2 hours"
      },
      "servicePackages": [
        {
          "name": "Basic Cleaning",
          "description": "Standard cleaning service",
          "price": 50,
          "features": ["Dusting", "Vacuuming", "Bathroom cleaning"],
          "duration": 2
        }
      ],
      "addOns": [
        {
          "name": "Window Cleaning",
          "description": "Interior and exterior window cleaning",
          "price": 25,
          "category": "additional_services"
        }
      ],
      "isActive": true,
      "rating": {
        "average": 4.8,
        "count": 15
      },
      "availability": {
        "schedule": [
          {
            "day": "monday",
            "startTime": "09:00",
            "endTime": "17:00",
            "isAvailable": true
          }
        ],
        "timezone": "Asia/Manila"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z"
    }
  ]
}
```

## Frontend Integration Examples

### JavaScript/React
```javascript
// Basic service search
const searchServices = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/marketplace/services?${queryParams}`);
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error searching services:', error);
    throw error;
  }
};

// Usage examples
const loadServices = async () => {
  try {
    // Get all services
    const allServices = await searchServices();
    
    // Get cleaning services in Manila
    const cleaningServices = await searchServices({
      category: 'cleaning',
      location: 'Manila'
    });
    
    // Get services in price range
    const affordableServices = await searchServices({
      minPrice: 25,
      maxPrice: 100,
      sortBy: 'pricing.basePrice',
      sortOrder: 'asc'
    });
    
    // Get high-rated services
    const topRatedServices = await searchServices({
      rating: 4.5,
      sortBy: 'rating.average',
      sortOrder: 'desc'
    });
    
    // Get nearby services with coordinates
    const nearbyServices = await searchServices({
      location: 'Manila',
      coordinates: JSON.stringify({ lat: 14.5995, lng: 120.9842 }),
      radius: 10000
    });
    
    console.log('Services:', allServices);
  } catch (error) {
    console.error('Failed to load services:', error);
  }
};
```

### Vue.js
```javascript
// Vue.js component method
async searchServices() {
  try {
    this.loading = true;
    const response = await this.$http.get('/api/marketplace/services', {
      params: this.filters
    });
    
    if (response.data.success) {
      this.services = response.data.data;
      this.pagination = {
        current: response.data.page,
        total: response.data.total,
        pages: response.data.pages
      };
    }
  } catch (error) {
    this.$toast.error('Failed to load services');
    console.error('Error:', error);
  } finally {
    this.loading = false;
  }
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid query parameters"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Server error"
}
```

## Rate Limiting

This endpoint is subject to rate limiting:
- 100 requests per 15 minutes per IP address

## Security Notes

- This is a public endpoint (no authentication required)
- Only active services are returned (`isActive: true`)
- Input validation and sanitization
- SQL injection protection through MongoDB queries

This comprehensive filtering system allows for powerful service discovery and search functionality in the LocalPro Super App marketplace.
