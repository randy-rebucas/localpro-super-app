# Marketplace Services - All Filter Query Parameters

This document lists all available filter query parameters for marketplace services endpoints.

## 📍 Main Services Endpoint

### `GET /api/marketplace/services`

**Description**: Retrieve a paginated list of services with filtering and sorting options.

#### Filter Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | String | No | - | Filter by service category (exact match) |
| `subcategory` | String | No | - | Filter by service subcategory (exact match) |
| `location` | String | No | - | Filter by service area (case-insensitive regex match) |
| `coordinates` | String | No | - | Coordinates for location-based filtering (used with `location`) |
| `minPrice` | Number | No | - | Minimum price filter (filters `pricing.basePrice`) |
| `maxPrice` | Number | No | - | Maximum price filter (filters `pricing.basePrice`) |
| `rating` | Number | No | - | Minimum rating filter (filters `rating.average`, uses `$gte`) |
| `page` | Number | No | `1` | Page number for pagination |
| `limit` | Number | No | `10` | Number of items per page |
| `sortBy` | String | No | `createdAt` | Field to sort by (any service field) |
| `sortOrder` | String | No | `desc` | Sort order: `asc` or `desc` |
| `groupByCategory` | Boolean/String | No | `false` | If `true`, returns services grouped by category |

#### Filter Logic

- **Base Filter**: Always includes `isActive: true`
- **Category**: Exact match on `category` field
- **Subcategory**: Exact match on `subcategory` field
- **Location**: Case-insensitive regex match on `serviceArea` array field
- **Price Range**: Filters `pricing.basePrice` with `$gte` (minPrice) and `$lte` (maxPrice)
- **Rating**: Filters `rating.average` with `$gte` (minimum rating)

#### Example Usage

```
GET /api/marketplace/services?category=cleaning&minPrice=20&maxPrice=50&rating=4&page=1&limit=20&sortBy=rating.average&sortOrder=desc
```

---

## 📍 Nearby Services Endpoint

### `GET /api/marketplace/services/nearby`

**Description**: Find services within a specified radius of a location with distance calculation.

#### Filter Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `lat` | Number | **Yes** | - | Latitude coordinate (required) |
| `lng` | Number | **Yes** | - | Longitude coordinate (required) |
| `radius` | Number | No | `50000` | Search radius in meters (default: 50km) |
| `category` | String | No | - | Filter by service category (exact match) |
| `subcategory` | String | No | - | Filter by service subcategory (exact match) |
| `minPrice` | Number | No | - | Minimum price filter (filters `pricing.basePrice`) |
| `maxPrice` | Number | No | - | Maximum price filter (filters `pricing.basePrice`) |
| `rating` | Number | No | - | Minimum rating filter (filters `rating.average`, uses `$gte`) |
| `page` | Number | No | `1` | Page number for pagination |
| `limit` | Number | No | `10` | Number of items per page |

#### Filter Logic

- **Base Filter**: Always includes `isActive: true`
- **Location**: Uses provided `lat` and `lng` to calculate distance from provider location
- **Radius**: Filters services within the specified radius (in meters)
- **Category**: Exact match on `category` field
- **Subcategory**: Exact match on `subcategory` field
- **Price Range**: Filters `pricing.basePrice` with `$gte` (minPrice) and `$lte` (maxPrice)
- **Rating**: Filters `rating.average` with `$gte` (minimum rating)

#### Response Includes

- `distance`: Distance from search location (value, unit, text)
- `duration`: Travel duration (value, unit, text)
- `isWithinRange`: Boolean indicating if service is within radius

#### Example Usage

```
GET /api/marketplace/services/nearby?lat=40.7128&lng=-74.0060&radius=10000&category=cleaning&minPrice=25&rating=4.5
```

---

## 📍 My Services Endpoint

### `GET /api/marketplace/my-services`

**Description**: Get services created by the authenticated provider.

**Access**: Private (requires authentication)

#### Filter Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | String | No | - | Filter by service category (exact match) |
| `status` | String | No | `all` | Filter by status: `all`, `active`, or `inactive` |
| `page` | Number | No | `1` | Page number for pagination |
| `limit` | Number | No | `10` | Number of items per page |
| `sortBy` | String | No | `createdAt` | Field to sort by (any service field) |
| `sortOrder` | String | No | `desc` | Sort order: `asc` or `desc` |

#### Filter Logic

- **Base Filter**: Always includes `provider: userId` (authenticated user)
- **Category**: Exact match on `category` field
- **Status**:
  - `all`: No `isActive` filter (returns all services)
  - `active`: `isActive: true`
  - `inactive`: `isActive: false`

#### Response Includes

- Services list with pagination
- Statistics:
  - `totalServices`: Total count
  - `activeServices`: Active services count
  - `inactiveServices`: Inactive services count
  - `averageRating`: Average rating across all services
  - `totalBookings`: Total bookings count

#### Example Usage

```
GET /api/marketplace/my-services?status=active&category=cleaning&page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

---

## 🔍 Search Controller Filters

### Used in Global Search

The search controller (`searchController.js`) also supports filtering marketplace services:

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | String | Filter by service category |
| `location` | String | Filter by service area (case-insensitive regex) |
| `minPrice` | Number | Minimum price filter |
| `maxPrice` | Number | Maximum price filter |
| `rating` | Number | Minimum rating filter |
| `limit` | Number | Maximum number of results (default: 20) |
| `skip` | Number | Number of results to skip |

---

## 🤖 AI Natural Language Search

### `POST /api/ai/marketplace/recommendations`

**Description**: Natural language search that parses query and applies filters automatically.

#### Supported Filters (Parsed from Query)

- `category`: Service category
- `subcategory`: Service subcategory
- `location`: Service area
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `keywords`: Text search on title and description

---

## 📊 Summary of All Available Filters

### Common Filters (Available on Most Endpoints)

1. **`category`** - Filter by service category
2. **`subcategory`** - Filter by service subcategory
3. **`minPrice`** - Minimum price filter
4. **`maxPrice`** - Maximum price filter
5. **`rating`** - Minimum rating filter
6. **`page`** - Pagination page number
7. **`limit`** - Items per page
8. **`sortBy`** - Field to sort by
9. **`sortOrder`** - Sort direction (asc/desc)

### Endpoint-Specific Filters

#### Main Services (`/api/marketplace/services`)
- `location` - Service area filter
- `coordinates` - Coordinates for location filtering
- `groupByCategory` - Group results by category

#### Nearby Services (`/api/marketplace/services/nearby`)
- `lat` - **Required** - Latitude
- `lng` - **Required** - Longitude
- `radius` - Search radius in meters

#### My Services (`/api/marketplace/my-services`)
- `status` - Filter by active/inactive status

---

## 💡 Usage Tips

1. **Price Filtering**: Use both `minPrice` and `maxPrice` together for a price range
2. **Location Filtering**: On main endpoint, use `location` for text-based search; use `/nearby` for geospatial search
3. **Rating Filter**: Uses `$gte`, so `rating=4` will return services with rating >= 4.0
4. **Sorting**: Can sort by any field (e.g., `sortBy=rating.average`, `sortBy=pricing.basePrice`)
5. **Pagination**: Always use `page` and `limit` together for consistent results
6. **Grouping**: Use `groupByCategory=true` to get services organized by category

---

## 🔗 Related Endpoints

- **Get Single Service**: `GET /api/marketplace/services/:id` (no filters)
- **Create Service**: `POST /api/marketplace/services`
- **Update Service**: `PUT /api/marketplace/services/:id`
- **Delete Service**: `DELETE /api/marketplace/services/:id`

---

*Last updated: Based on marketplaceController.js implementation*

