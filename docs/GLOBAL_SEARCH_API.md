# Global Search API Documentation

## Overview

The Global Search API provides comprehensive search functionality across all entities in the LocalPro Super App. It allows users to search for services, jobs, providers, supplies, courses, rentals, and agencies with advanced filtering and sorting capabilities.

## Base URL

```
/api/search
```

## Authentication

Most endpoints are public and don't require authentication. Some analytics endpoints require authentication.

## Endpoints

### 1. Global Search

**GET** `/api/search`

Search across all entities with optional filters.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (minimum 2 characters) |
| `type` | string | No | Filter by entity type (`users`, `jobs`, `services`, `supplies`, `courses`, `rentals`, `agencies`) |
| `category` | string | No | Filter by category |
| `location` | string | No | Filter by location/city |
| `minPrice` | number | No | Minimum price filter |
| `maxPrice` | number | No | Maximum price filter |
| `rating` | number | No | Minimum rating filter |
| `limit` | number | No | Results per page (default: 20, max: 100) |
| `page` | number | No | Page number (default: 1) |
| `sortBy` | string | No | Sort field (`relevance`, `rating`, `price_low`, `price_high`, `newest`) |
| `sortOrder` | string | No | Sort order (`asc`, `desc`, default: `desc`) |

#### Example Request

```bash
GET /api/search?q=cleaning&category=cleaning&location=Manila&rating=4&limit=10&sortBy=rating
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "query": "cleaning",
    "totalResults": 150,
    "results": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "type": "service",
        "title": "Professional House Cleaning",
        "subtitle": "CleanPro Services",
        "description": "Complete house cleaning services...",
        "category": "cleaning",
        "location": "Manila",
        "price": "50 USD/hourly",
        "rating": 4.8,
        "image": "https://example.com/image.jpg",
        "url": "/marketplace/64f8a1b2c3d4e5f6a7b8c9d0",
        "relevanceScore": 15
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 15,
      "hasNext": true,
      "hasPrev": false,
      "limit": 10
    },
    "filters": {
      "type": null,
      "category": "cleaning",
      "location": "Manila",
      "minPrice": null,
      "maxPrice": null,
      "rating": 4
    }
  }
}
```

### 2. Search Suggestions

**GET** `/api/search/suggestions`

Get autocomplete suggestions for search queries.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (minimum 2 characters) |
| `limit` | number | No | Maximum suggestions (default: 10, max: 20) |

#### Example Request

```bash
GET /api/search/suggestions?q=clean&limit=5
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "query": "clean",
    "suggestions": [
      {
        "text": "Cleaning Services",
        "type": "service",
        "category": "cleaning"
      },
      {
        "text": "CleanPro Services",
        "type": "user",
        "category": "Provider"
      }
    ]
  }
}
```

### 3. Popular Searches

**GET** `/api/search/popular`

Get popular search terms.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Number of terms (default: 12, max: 50) |

#### Example Request

```bash
GET /api/search/popular?limit=10
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "popularSearches": [
      {
        "term": "cleaning services",
        "count": 1250,
        "category": "services"
      },
      {
        "term": "plumbing",
        "count": 980,
        "category": "services"
      }
    ]
  }
}
```

### 4. Categories

**GET** `/api/search/categories`

Get all available search categories and entity types.

#### Example Request

```bash
GET /api/search/categories
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "categories": {
      "services": ["cleaning", "plumbing", "electrical", "moving", "landscaping"],
      "jobs": ["technology", "healthcare", "education", "finance"],
      "supplies": ["cleaning_supplies", "tools", "materials", "equipment"],
      "courses": ["cleaning", "plumbing", "electrical", "business", "safety"],
      "rentals": ["tools", "vehicles", "equipment", "machinery"],
      "agencies": ["cleaning", "plumbing", "electrical", "moving"]
    },
    "entityTypes": [
      {
        "value": "users",
        "label": "Service Providers",
        "description": "Find verified service providers"
      },
      {
        "value": "jobs",
        "label": "Job Opportunities",
        "description": "Browse available job positions"
      }
    ]
  }
}
```

### 5. Locations

**GET** `/api/search/locations`

Get popular search locations.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | No | Filter locations by query |
| `limit` | number | No | Number of locations (default: 20) |

#### Example Request

```bash
GET /api/search/locations?q=Manila&limit=5
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "name": "Manila",
        "country": "Philippines",
        "count": 1250
      },
      {
        "name": "Quezon City",
        "country": "Philippines",
        "count": 980
      }
    ]
  }
}
```

### 6. Trending Searches

**GET** `/api/search/trending`

Get trending search terms.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | Time period (`today`, `week`, `month`, default: `week`) |
| `limit` | number | No | Number of terms (default: 10) |

#### Example Request

```bash
GET /api/search/trending?period=week&limit=5
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "period": "week",
    "trending": [
      {
        "term": "holiday cleaning",
        "count": 250,
        "growth": 45.2,
        "category": "services"
      }
    ]
  }
}
```

### 7. Advanced Search

**GET** `/api/search/advanced`

Advanced search with additional filters.

#### Query Parameters

All global search parameters plus:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string | No | Filter results from this date |
| `dateTo` | string | No | Filter results to this date |
| `verified` | boolean | No | Filter for verified providers only |
| `availability` | string | No | Filter by availability (`available`, `unavailable`) |
| `serviceType` | string | No | Filter by service type |
| `experienceLevel` | string | No | Filter by experience level |
| `jobType` | string | No | Filter by job type |
| `isRemote` | boolean | No | Filter for remote work |
| `certification` | string | No | Filter by certification requirements |
| `language` | string | No | Filter by language requirements |

### 8. Entity-Specific Search

**GET** `/api/search/entities/:type`

Search within a specific entity type.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Entity type (`users`, `jobs`, `services`, `supplies`, `courses`, `rentals`, `agencies`) |

#### Example Request

```bash
GET /api/search/entities/jobs?q=developer&location=Manila&limit=5
```

### 9. Search Analytics (Admin)

**POST** `/api/search/analytics`

Track search analytics (requires authentication).

#### Request Body

```json
{
  "query": "cleaning services",
  "results": 25,
  "filters": {
    "category": "cleaning",
    "location": "Manila"
  },
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Searchable Entities

### 1. Users (Service Providers)
- **Fields**: Name, business name, bio, skills, specialties, location
- **Filters**: Category, location, rating, verification status
- **Sorting**: Relevance, rating, verification status

### 2. Jobs
- **Fields**: Title, description, company name, category, location
- **Filters**: Category, location, salary range, job type, experience level
- **Sorting**: Relevance, salary, date posted

### 3. Services (Marketplace)
- **Fields**: Title, description, category, features, location
- **Filters**: Category, location, price range, rating, service type
- **Sorting**: Relevance, rating, price

### 4. Supplies
- **Fields**: Name, description, brand, category, tags
- **Filters**: Category, price range, availability
- **Sorting**: Relevance, price, availability

### 5. Courses (Academy)
- **Fields**: Title, description, category, learning outcomes, tags
- **Filters**: Category, level, rating, certification availability
- **Sorting**: Relevance, rating, enrollment count

### 6. Rentals
- **Fields**: Name, description, brand, model, category
- **Filters**: Category, location, price range, availability, condition
- **Sorting**: Relevance, rating, price

### 7. Agencies
- **Fields**: Name, description, services, location
- **Filters**: Category, location, rating, verification status
- **Sorting**: Relevance, rating, provider count

## Search Features

### Relevance Scoring
Results are scored based on:
- Title/name matches (highest score)
- Category matches
- Description matches
- Skills/specialties matches
- Verification status boost
- Rating boost

### Sorting Options
- **Relevance**: Default sorting by relevance score
- **Rating**: Sort by average rating
- **Price Low**: Sort by price (ascending)
- **Price High**: Sort by price (descending)
- **Newest**: Sort by creation date

### Filtering
- **Category**: Filter by service/job category
- **Location**: Filter by city or region
- **Price Range**: Filter by minimum/maximum price
- **Rating**: Filter by minimum rating
- **Type**: Filter by entity type
- **Verification**: Filter for verified providers
- **Availability**: Filter by availability status

### Pagination
- Configurable page size (default: 20, max: 100)
- Page-based navigation
- Total results count
- Navigation indicators (hasNext, hasPrev)

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Search query must be at least 2 characters long"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Search failed. Please try again.",
  "error": "Detailed error message (development only)"
}
```

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Applied to all search endpoints

## Usage Examples

### Basic Search
```bash
curl "http://localhost:5000/api/search?q=cleaning&limit=10"
```

### Filtered Search
```bash
curl "http://localhost:5000/api/search?q=plumbing&category=plumbing&location=Manila&rating=4"
```

### Type-Specific Search
```bash
curl "http://localhost:5000/api/search?q=cleaning&type=services&limit=5"
```

### Advanced Search
```bash
curl "http://localhost:5000/api/search/advanced?q=cleaning&minPrice=50&maxPrice=500&rating=4&verified=true"
```

### Search Suggestions
```bash
curl "http://localhost:5000/api/search/suggestions?q=clean&limit=5"
```

### Popular Searches
```bash
curl "http://localhost:5000/api/search/popular?limit=10"
```

## Testing

Use the provided test file to verify API functionality:

```bash
# Run all tests
node test-search-api.js

# Show usage examples
node test-search-api.js --examples

# Show help
node test-search-api.js --help
```

## Performance Considerations

- Search results are cached for improved performance
- Database indexes are optimized for common search patterns
- Pagination limits prevent large result sets
- Concurrent searches are supported for better user experience

## Future Enhancements

- Full-text search with Elasticsearch integration
- Search analytics and insights
- Personalized search results
- Search history and saved searches
- Advanced filtering with multiple criteria
- Search result ranking improvements
- Real-time search suggestions
- Search result previews
