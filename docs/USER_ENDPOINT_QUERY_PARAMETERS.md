# User Endpoint Query Parameters

This document describes all available query parameters for filtering, searching, sorting, and paginating users in the `GET /api/users` endpoint.

## Endpoint

```
GET /api/users
```

**Access:** Admin, Agency Admin, Agency Owner only

**Authentication:** Required (Bearer token)

---

## Query Parameters

### Pagination Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Number | `1` | Page number (starts at 1) |
| `limit` | Number | `10` | Number of items per page |

### Filter Parameters

| Parameter | Type | Description | Example Values |
|-----------|------|-------------|----------------|
| `role` | String | Filter by user role(s). Supports single role or comma-separated roles | `provider`, `client`, `admin`, `provider,client` |
| `isActive` | Boolean/String | Filter by active status | `true`, `false`, `"true"`, `"false"` |
| `isVerified` | Boolean/String | Filter by verification status | `true`, `false`, `"true"`, `"false"` |

### Search Parameter

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | String | Search across firstName, lastName, email, phoneNumber, and profile.businessName (case-insensitive) |

### Sorting Parameters

| Parameter | Type | Default | Description | Example Values |
|-----------|------|---------|-------------|----------------|
| `sortBy` | String | `createdAt` | Field to sort by | `createdAt`, `firstName`, `lastName`, `email`, `updatedAt` |
| `sortOrder` | String | `desc` | Sort direction | `asc`, `desc` |

---

## URL Query Examples

### Basic Examples

#### 1. Get all users (default pagination)
```
GET /api/users
```
Returns first 10 users, sorted by creation date (newest first).

#### 2. Get users with pagination
```
GET /api/users?page=2&limit=20
```
Returns page 2 with 20 users per page.

#### 3. Get all providers
```
GET /api/users?role=provider
```
Returns all users who have "provider" in their roles array.

#### 4. Get active users only
```
GET /api/users?isActive=true
```
Returns only active users.

#### 5. Get verified users only
```
GET /api/users?isVerified=true
```
Returns only verified users.

---

### Filter Combinations

#### 6. Get active providers
```
GET /api/users?role=provider&isActive=true
```
Returns active users with provider role.

#### 7. Get verified providers
```
GET /api/users?role=provider&isVerified=true
```
Returns verified users with provider role.

#### 8. Get active and verified providers
```
GET /api/users?role=provider&isActive=true&isVerified=true
```
Returns active and verified users with provider role.

#### 9. Get inactive users
```
GET /api/users?isActive=false
```
Returns inactive users.

#### 10. Get unverified users
```
GET /api/users?isVerified=false
```
Returns unverified users.

#### 11. Get users with multiple roles
```
GET /api/users?role=provider,client
```
Returns users who have either "provider" OR "client" role (or both).

---

### Search Examples

#### 12. Search by name
```
GET /api/users?search=John
```
Searches for "John" in firstName, lastName, email, phoneNumber, and businessName.

#### 13. Search with filters
```
GET /api/users?search=John&role=provider&isActive=true
```
Searches for "John" among active providers.

#### 14. Search by email
```
GET /api/users?search=john@example.com
```
Searches for the email address.

#### 15. Search by phone number
```
GET /api/users?search=+1234567890
```
Searches for the phone number.

#### 16. Search by business name
```
GET /api/users?search=Professional Services
```
Searches for business name containing "Professional Services".

---

### Sorting Examples

#### 17. Sort by first name (ascending)
```
GET /api/users?sortBy=firstName&sortOrder=asc
```
Returns users sorted by first name (A-Z).

#### 18. Sort by last name (descending)
```
GET /api/users?sortBy=lastName&sortOrder=desc
```
Returns users sorted by last name (Z-A).

#### 19. Sort by email (ascending)
```
GET /api/users?sortBy=email&sortOrder=asc
```
Returns users sorted by email (A-Z).

#### 20. Sort by update date (newest first)
```
GET /api/users?sortBy=updatedAt&sortOrder=desc
```
Returns users sorted by last update date (newest first).

---

### Complex Examples

#### 21. Active providers, sorted by name, with pagination
```
GET /api/users?role=provider&isActive=true&sortBy=firstName&sortOrder=asc&page=1&limit=25
```
Returns first 25 active providers, sorted by first name (A-Z).

#### 22. Search verified users with pagination
```
GET /api/users?search=John&isVerified=true&page=1&limit=10
```
Searches for "John" among verified users, returns first page.

#### 23. Multiple roles with filters and sorting
```
GET /api/users?role=provider,client&isActive=true&isVerified=true&sortBy=createdAt&sortOrder=desc&page=1&limit=50
```
Returns active and verified users with provider or client role, sorted by creation date (newest first), 50 per page.

#### 24. Inactive unverified users
```
GET /api/users?isActive=false&isVerified=false
```
Returns inactive and unverified users.

#### 25. Search with all filters
```
GET /api/users?search=plumber&role=provider&isActive=true&isVerified=true&sortBy=firstName&sortOrder=asc&page=1&limit=20
```
Searches for "plumber" among active, verified providers, sorted by first name, page 1, 20 per page.

---

## Complete cURL Examples

### Example 1: Get all active providers
```bash
curl -X GET "https://api.example.com/api/users?role=provider&isActive=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Example 2: Search with pagination
```bash
curl -X GET "https://api.example.com/api/users?search=John&page=2&limit=25" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Example 3: Complex filter with sorting
```bash
curl -X GET "https://api.example.com/api/users?role=provider,client&isActive=true&isVerified=true&sortBy=firstName&sortOrder=asc&page=1&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## JavaScript/Fetch Examples

### Example 1: Basic fetch with filters
```javascript
const getUsers = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/users?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// Usage
const users = await getUsers({
  role: 'provider',
  isActive: true,
  page: 1,
  limit: 20
});
```

### Example 2: Search with filters
```javascript
const searchUsers = async (searchTerm, role = null) => {
  const params = { search: searchTerm, page: 1, limit: 10 };
  if (role) params.role = role;
  
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`/api/users?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// Usage
const results = await searchUsers('John', 'provider');
```

### Example 3: Advanced filtering
```javascript
const getFilteredUsers = async (options = {}) => {
  const {
    role,
    isActive,
    isVerified,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = options;

  const params = { page, limit, sortBy, sortOrder };
  
  if (role) params.role = role;
  if (isActive !== undefined) params.isActive = isActive;
  if (isVerified !== undefined) params.isVerified = isVerified;
  if (search) params.search = search;

  const queryParams = new URLSearchParams(params);
  const response = await fetch(`/api/users?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// Usage
const users = await getFilteredUsers({
  role: 'provider',
  isActive: true,
  isVerified: true,
  search: 'plumber',
  sortBy: 'firstName',
  sortOrder: 'asc',
  page: 1,
  limit: 25
});
```

---

## Response Format

All queries return the following response structure:

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "...",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "roles": ["client", "provider"],
        "isActive": true,
        "isVerified": true,
        "provider": {
          // Provider data if user has provider role
        },
        // ... other user fields
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 10,
      "total": 100,
      "limit": 10
    }
  }
}
```

---

## Parameter Details

### Role Filter

The `role` parameter supports:
- **Single role:** `role=provider` - Returns users with "provider" in their roles array
- **Multiple roles (comma-separated):** `role=provider,client` - Returns users with either "provider" OR "client" (or both)

**Valid role values:**
- `client`
- `provider`
- `admin`
- `supplier`
- `instructor`
- `agency_owner`
- `agency_admin`

**Note:** Since users can have multiple roles, the filter uses `$in` operator to check if the specified role exists in the user's roles array.

### Boolean Filters

The `isActive` and `isVerified` parameters accept:
- Boolean: `true` or `false`
- String: `"true"` or `"false"` (case-insensitive)

Both formats work the same way.

### Search Functionality

The `search` parameter performs a case-insensitive search across:
- `firstName`
- `lastName`
- `email`
- `phoneNumber`
- `profile.businessName`

The search uses MongoDB regex with case-insensitive matching (`$regex` with `$options: 'i'`).

### Sorting

**Available `sortBy` fields:**
- `createdAt` (default)
- `updatedAt`
- `firstName`
- `lastName`
- `email`
- Any other valid user field

**Sort order:**
- `asc` - Ascending (A-Z, oldest first)
- `desc` - Descending (Z-A, newest first) (default)

### Pagination

- `page` starts at 1 (not 0)
- `limit` determines how many items per page
- Response includes pagination metadata:
  - `current` - Current page number
  - `pages` - Total number of pages
  - `total` - Total number of items matching the filter
  - `limit` - Items per page

---

## Common Use Cases

### 1. Admin Dashboard - User List
```
GET /api/users?page=1&limit=25&sortBy=createdAt&sortOrder=desc
```

### 2. Provider Management
```
GET /api/users?role=provider&isActive=true&isVerified=true&page=1&limit=50
```

### 3. User Search
```
GET /api/users?search=john&page=1&limit=10
```

### 4. Inactive Users Report
```
GET /api/users?isActive=false&sortBy=updatedAt&sortOrder=desc
```

### 5. Unverified Users
```
GET /api/users?isVerified=false&page=1&limit=20
```

### 6. New Users (Last 7 days)
```
GET /api/users?sortBy=createdAt&sortOrder=desc&page=1&limit=50
```
(Filter by date range would need to be added in the controller)

---

## Notes

1. **All parameters are optional** - You can use any combination or none at all
2. **Filters are combined with AND logic** - All specified filters must match
3. **Search uses OR logic** - Matches any of the searchable fields
4. **Role filter supports multi-role users** - Uses `$in` operator to check array membership
5. **Case-insensitive search** - Search is not case-sensitive
6. **Provider data included** - Users with provider role automatically include provider data in response
7. **Authentication required** - All requests require valid Bearer token
8. **Authorization required** - Only Admin, Agency Admin, and Agency Owner can access this endpoint

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User roles [client] are not authorized to access this route. Required: [admin, agency_admin, agency_owner]"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error"
}
```

