# Search Feature

## Overview

The Search feature provides comprehensive search functionality across all entities in the platform.

## Key Features

- **Global Search** - Search across all entities
- **Entity-Specific Search** - Search within specific types
- **Advanced Filtering** - Multiple filter options
- **Sorting** - Sort results by relevance, date, etc.
- **Pagination** - Handle large result sets

## API Endpoints

### Global Search

```
GET /api/search/global
Query Parameters:
  - q: string (search query)
  - type?: string (services, users, products, etc.)
  - page?: number
  - limit?: number
```

### Entity-Specific Search

```
GET /api/search/services
GET /api/search/users
GET /api/search/products
GET /api/search/jobs
```

## Search Types

- **Text Search** - Full-text search
- **Location Search** - Geospatial search
- **Category Search** - Category filtering
- **Price Range** - Price filtering

## Implementation

```typescript
const searchResults = await searchGlobal({
  query: 'plumbing',
  type: 'services',
  location: { lat: 40.7128, lng: -74.0060 },
  radius: 10
});
```

## Search Results

```json
{
  "success": true,
  "data": {
    "services": [...],
    "users": [...],
    "total": 50,
    "pagination": { ... }
  }
}
```

## Related Features

- [Marketplace](./marketplace.md) - Service search
- [API Endpoints](../api/endpoints.md#search)

