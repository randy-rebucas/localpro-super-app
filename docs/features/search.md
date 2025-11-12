# Search Feature Documentation

## Overview
The Search feature provides global search functionality across all platform entities including services, jobs, supplies, courses, rentals, and users.

## Base Path
`/api/search`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/` | Global search | q, type, category, location, minPrice, maxPrice, rating, limit, page |
| GET | `/suggestions` | Get search suggestions | q, limit |
| GET | `/popular` | Get popular searches | limit |
| GET | `/advanced` | Advanced search | (multiple filters) |
| GET | `/entities/:type` | Search within entity type | q, filters |
| GET | `/categories` | Get search categories | - |
| GET | `/locations` | Get popular locations | - |
| GET | `/trending` | Get trending searches | limit |
| POST | `/analytics` | Track search analytics | **admin** |

## Request/Response Examples

### Global Search
```http
GET /api/search?q=plumbing&type=services&location=Manila&minPrice=500&maxPrice=2000
```

### Search Suggestions
```http
GET /api/search/suggestions?q=cle
```

### Advanced Search
```http
GET /api/search/advanced?q=professional&type=services&category=cleaning&rating=4&location=Manila
```

## Search Flow

1. **Query Input**:
   - User enters search query
   - System provides suggestions
   - User selects or refines query

2. **Search Execution**:
   - System searches across entities
   - Results filtered by type, category, location
   - Results sorted by relevance/rating/price

3. **Results Display**:
   - Paginated results shown
   - Filters available
   - User can refine search

## Search Types

- `services` - Marketplace services
- `jobs` - Job postings
- `supplies` - Supply products
- `courses` - Academy courses
- `rentals` - Rental items
- `agencies` - Agencies
- `users` - User profiles

## Related Features
- Marketplace
- Jobs
- Supplies
- Academy
- Rentals
- Agencies

