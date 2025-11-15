# Job Endpoint Query Parameters

This document describes all available query parameters for filtering, searching, sorting, and paginating jobs in the Jobs API endpoints.

## Endpoints

### Public Endpoints

- `GET /api/jobs` - Get all jobs with filters
- `GET /api/jobs/search` - Advanced job search
- `GET /api/jobs/categories` - Get job categories
- `GET /api/jobs/:id` - Get single job by ID

### Protected Endpoints

- `GET /api/jobs/my-applications` - Get current user's job applications
- `GET /api/jobs/my-jobs` - Get current user's posted jobs (Provider/Admin)
- `GET /api/jobs/:id/applications` - Get applications for a job (Employer/Admin)

**Authentication:** Required for protected endpoints (Bearer token)

---

## GET /api/jobs - Get All Jobs

### Query Parameters

#### Pagination Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Number | `1` | Page number (starts at 1) |
| `limit` | Number | `10` | Number of items per page |

#### Search Parameter

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | String | Full-text search across job title, description, and company name (uses MongoDB text search) |

#### Category Filters

| Parameter | Type | Description | Example Values |
|-----------|------|-------------|----------------|
| `category` | String | Filter by job category | `engineering`, `marketing`, `sales` |
| `subcategory` | String | Filter by job subcategory | `frontend`, `backend`, `fullstack` |
| `jobType` | String | Filter by job type | `full-time`, `part-time`, `contract`, `internship` |
| `experienceLevel` | String | Filter by experience level | `entry`, `mid`, `senior`, `executive` |

#### Location Filters

| Parameter | Type | Description | Example Values |
|-----------|------|-------------|----------------|
| `location` | String | Search by city, state, or country (case-insensitive) | `Manila`, `New York`, `Philippines` |
| `isRemote` | String | Filter remote jobs | `"true"` (must be string "true") |

#### Salary Filters

| Parameter | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| `minSalary` | Number | Minimum salary filter | 0 - 1,000,000 |
| `maxSalary` | Number | Maximum salary filter | 0 - 1,000,000 |

**Note:** `minSalary` cannot be greater than `maxSalary`

#### Company Filter

| Parameter | Type | Description |
|-----------|------|-------------|
| `company` | String | Filter by company name (case-insensitive regex) |

#### Featured Filter

| Parameter | Type | Description |
|-----------|------|-------------|
| `featured` | String | Show only featured jobs | `"true"` (must be string "true") |

#### Sorting Parameters

| Parameter | Type | Default | Description | Example Values |
|-----------|------|---------|-------------|----------------|
| `sortBy` | String | `createdAt` | Field to sort by | `createdAt`, `title`, `salary.min`, `relevance` |
| `sortOrder` | String | `desc` | Sort direction | `asc`, `desc` |

**Note:** When `sortBy=relevance` and `search` is provided, results are sorted by text search relevance score.

---

## URL Query Examples

### Basic Examples

#### 1. Get all jobs (default pagination)
```
GET /api/jobs
```
Returns first 10 active jobs, sorted by creation date (newest first).

#### 2. Get jobs with pagination
```
GET /api/jobs?page=2&limit=20
```
Returns page 2 with 20 jobs per page.

#### 3. Search jobs
```
GET /api/jobs?search=software engineer
```
Searches for "software engineer" in job titles, descriptions, and company names.

#### 4. Filter by category
```
GET /api/jobs?category=engineering
```
Returns jobs in the engineering category.

#### 5. Filter by job type
```
GET /api/jobs?jobType=full-time
```
Returns only full-time jobs.

#### 6. Filter by experience level
```
GET /api/jobs?experienceLevel=senior
```
Returns senior-level jobs.

---

### Location Examples

#### 7. Filter by location
```
GET /api/jobs?location=Manila
```
Returns jobs in Manila (searches city, state, and country).

#### 8. Get remote jobs only
```
GET /api/jobs?isRemote=true
```
Returns only remote jobs.

#### 9. Remote jobs in specific category
```
GET /api/jobs?category=engineering&isRemote=true
```
Returns remote engineering jobs.

---

### Salary Examples

#### 10. Filter by minimum salary
```
GET /api/jobs?minSalary=50000
```
Returns jobs with minimum salary of $50,000 or more.

#### 11. Filter by salary range
```
GET /api/jobs?minSalary=40000&maxSalary=80000
```
Returns jobs with salary between $40,000 and $80,000.

#### 12. Filter by maximum salary
```
GET /api/jobs?maxSalary=60000
```
Returns jobs with maximum salary of $60,000 or less.

---

### Company Examples

#### 13. Filter by company name
```
GET /api/jobs?company=Google
```
Returns jobs from companies with "Google" in the name.

#### 14. Search and filter by company
```
GET /api/jobs?search=developer&company=Tech Corp
```
Searches for "developer" in jobs from "Tech Corp".

---

### Featured Jobs

#### 15. Get featured jobs only
```
GET /api/jobs?featured=true
```
Returns only featured jobs that are currently active.

---

### Sorting Examples

#### 16. Sort by title (ascending)
```
GET /api/jobs?sortBy=title&sortOrder=asc
```
Returns jobs sorted by title (A-Z).

#### 17. Sort by salary (highest first)
```
GET /api/jobs?sortBy=salary.min&sortOrder=desc
```
Returns jobs sorted by minimum salary (highest first).

#### 18. Sort by relevance (with search)
```
GET /api/jobs?search=engineer&sortBy=relevance
```
Returns jobs sorted by search relevance score.

#### 19. Sort by creation date (oldest first)
```
GET /api/jobs?sortBy=createdAt&sortOrder=asc
```
Returns jobs sorted by creation date (oldest first).

---

### Complex Examples

#### 20. Full-time senior engineering jobs in Manila
```
GET /api/jobs?category=engineering&jobType=full-time&experienceLevel=senior&location=Manila&page=1&limit=25
```

#### 21. Remote jobs with salary range, sorted by salary
```
GET /api/jobs?isRemote=true&minSalary=50000&maxSalary=100000&sortBy=salary.min&sortOrder=desc
```

#### 22. Search with multiple filters
```
GET /api/jobs?search=developer&category=engineering&jobType=full-time&location=New York&minSalary=60000&page=1&limit=20
```

#### 23. Featured remote jobs in tech
```
GET /api/jobs?featured=true&isRemote=true&category=engineering&sortBy=createdAt&sortOrder=desc
```

#### 24. Entry-level jobs with pagination
```
GET /api/jobs?experienceLevel=entry&page=1&limit=15&sortBy=createdAt&sortOrder=desc
```

#### 25. Search with relevance sorting
```
GET /api/jobs?search=full stack developer&category=engineering&sortBy=relevance&page=1&limit=10
```

---

## GET /api/jobs/search - Advanced Search

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | String | - | Search query (searches title, description, company name, category, subcategory) |
| `category` | String | - | Filter by category |
| `subcategory` | String | - | Filter by subcategory |
| `jobType` | String | - | Filter by job type |
| `experienceLevel` | String | - | Filter by experience level |
| `location` | String | - | Filter by location |
| `isRemote` | String | - | Filter remote jobs (`"true"`) |
| `minSalary` | Number | - | Minimum salary |
| `maxSalary` | Number | - | Maximum salary |
| `company` | String | - | Filter by company name |
| `page` | Number | `1` | Page number |
| `limit` | Number | `10` | Items per page |

### Examples

#### 26. Basic search
```
GET /api/jobs/search?q=software engineer
```

#### 27. Search with filters
```
GET /api/jobs/search?q=developer&category=engineering&location=Manila&minSalary=50000
```

#### 28. Search remote jobs
```
GET /api/jobs/search?q=designer&isRemote=true&page=1&limit=20
```

---

## GET /api/jobs/my-applications - Get My Applications

**Access:** Authenticated users only

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | String | - | Filter by application status | `pending`, `reviewed`, `shortlisted`, `rejected`, `accepted` |
| `page` | Number | `1` | Page number |
| `limit` | Number | `10` | Items per page |

### Examples

#### 29. Get all my applications
```
GET /api/jobs/my-applications
```

#### 30. Get pending applications
```
GET /api/jobs/my-applications?status=pending
```

#### 31. Get accepted applications
```
GET /api/jobs/my-applications?status=accepted&page=1&limit=20
```

---

## GET /api/jobs/my-jobs - Get My Posted Jobs

**Access:** Provider, Admin only

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | String | - | Filter by job status | `active`, `inactive`, `closed`, `draft`, `featured` |
| `page` | Number | `1` | Page number |
| `limit` | Number | `10` | Items per page |

### Examples

#### 32. Get all my jobs
```
GET /api/jobs/my-jobs
```

#### 33. Get active jobs only
```
GET /api/jobs/my-jobs?status=active
```

#### 34. Get closed jobs
```
GET /api/jobs/my-jobs?status=closed&page=1&limit=25
```

---

## GET /api/jobs/:id/applications - Get Job Applications

**Access:** Employer (job owner), Admin only

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | String | - | Filter by application status | `pending`, `reviewed`, `shortlisted`, `rejected`, `accepted` |
| `page` | Number | `1` | Page number |
| `limit` | Number | `10` | Items per page |

### Examples

#### 35. Get all applications for a job
```
GET /api/jobs/507f1f77bcf86cd799439011/applications
```

#### 36. Get pending applications
```
GET /api/jobs/507f1f77bcf86cd799439011/applications?status=pending
```

#### 37. Get shortlisted applications
```
GET /api/jobs/507f1f77bcf86cd799439011/applications?status=shortlisted&page=1&limit=20
```

---

## Complete cURL Examples

### Example 1: Search for remote engineering jobs
```bash
curl -X GET "https://api.example.com/api/jobs?category=engineering&isRemote=true&page=1&limit=20" \
  -H "Content-Type: application/json"
```

### Example 2: Search with salary range
```bash
curl -X GET "https://api.example.com/api/jobs?search=developer&minSalary=50000&maxSalary=100000&sortBy=salary.min&sortOrder=desc" \
  -H "Content-Type: application/json"
```

### Example 3: Get my applications (authenticated)
```bash
curl -X GET "https://api.example.com/api/jobs/my-applications?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Example 4: Advanced search endpoint
```bash
curl -X GET "https://api.example.com/api/jobs/search?q=full stack&category=engineering&location=Manila&isRemote=true&minSalary=60000" \
  -H "Content-Type: application/json"
```

---

## JavaScript/Fetch Examples

### Example 1: Basic job search
```javascript
const getJobs = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/jobs?${queryParams}`);
  return await response.json();
};

// Usage
const jobs = await getJobs({
  category: 'engineering',
  jobType: 'full-time',
  location: 'Manila',
  page: 1,
  limit: 20
});
```

### Example 2: Search with salary filter
```javascript
const searchJobsBySalary = async (minSalary, maxSalary) => {
  const params = {
    minSalary,
    maxSalary,
    sortBy: 'salary.min',
    sortOrder: 'desc',
    page: 1,
    limit: 25
  };
  
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`/api/jobs?${queryParams}`);
  return await response.json();
};

// Usage
const jobs = await searchJobsBySalary(50000, 100000);
```

### Example 3: Get my applications
```javascript
const getMyApplications = async (status = null) => {
  const params = { page: 1, limit: 10 };
  if (status) params.status = status;
  
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`/api/jobs/my-applications?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// Usage
const pendingApps = await getMyApplications('pending');
```

### Example 4: Advanced search with all filters
```javascript
const advancedJobSearch = async (options = {}) => {
  const {
    q,
    category,
    subcategory,
    jobType,
    experienceLevel,
    location,
    isRemote,
    minSalary,
    maxSalary,
    company,
    page = 1,
    limit = 10
  } = options;

  const params = { page, limit };
  
  if (q) params.q = q;
  if (category) params.category = category;
  if (subcategory) params.subcategory = subcategory;
  if (jobType) params.jobType = jobType;
  if (experienceLevel) params.experienceLevel = experienceLevel;
  if (location) params.location = location;
  if (isRemote) params.isRemote = 'true';
  if (minSalary) params.minSalary = minSalary;
  if (maxSalary) params.maxSalary = maxSalary;
  if (company) params.company = company;

  const queryParams = new URLSearchParams(params);
  const response = await fetch(`/api/jobs/search?${queryParams}`);
  return await response.json();
};

// Usage
const results = await advancedJobSearch({
  q: 'software engineer',
  category: 'engineering',
  location: 'Manila',
  isRemote: true,
  minSalary: 60000,
  maxSalary: 120000,
  page: 1,
  limit: 20
});
```

---

## Response Format

### GET /api/jobs Response
```json
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": [
    {
      "_id": "...",
      "title": "Senior Software Engineer",
      "description": "...",
      "category": "engineering",
      "jobType": "full-time",
      "experienceLevel": "senior",
      "company": {
        "name": "Tech Corp",
        "location": {
          "city": "Manila",
          "state": "Metro Manila",
          "country": "Philippines",
          "isRemote": false
        },
        "logo": {
          "url": "..."
        }
      },
      "salary": {
        "min": 80000,
        "max": 120000,
        "currency": "USD"
      },
      "employer": {
        "_id": "...",
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 10,
    "total": 100,
    "limit": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET /api/jobs/my-applications Response
```json
{
  "success": true,
  "count": 5,
  "total": 15,
  "page": 1,
  "pages": 2,
  "data": [
    {
      "_id": "...",
      "job": {
        "_id": "...",
        "title": "Software Engineer",
        "company": {
          "name": "Tech Corp"
        }
      },
      "employer": {
        "_id": "...",
        "firstName": "John",
        "lastName": "Doe"
      },
      "status": "pending",
      "appliedAt": "2024-01-20T10:30:00.000Z"
    }
  ]
}
```

---

## Parameter Details

### Job Type Values
- `full-time`
- `part-time`
- `contract`
- `internship`
- `freelance`

### Experience Level Values
- `entry`
- `mid`
- `senior`
- `executive`

### Application Status Values
- `pending` - Application submitted, awaiting review
- `reviewed` - Application has been reviewed
- `shortlisted` - Application is shortlisted
- `rejected` - Application was rejected
- `accepted` - Application was accepted

### Job Status Values
- `active` - Job is active and accepting applications
- `inactive` - Job is inactive
- `closed` - Job is closed, no longer accepting applications
- `draft` - Job is saved as draft
- `featured` - Job is featured

### Salary Constraints
- `minSalary`: Must be between 0 and 1,000,000
- `maxSalary`: Must be between 0 and 1,000,000
- `minSalary` cannot be greater than `maxSalary`

### Sorting Options
- `createdAt` - Creation date (default)
- `title` - Job title
- `salary.min` - Minimum salary
- `relevance` - Search relevance (only works with `search` parameter)

### Search Behavior
- The `search` parameter uses MongoDB full-text search
- Searches across: title, description, company name
- Case-insensitive
- When combined with `sortBy=relevance`, results are sorted by relevance score

### Location Search
- Searches across: city, state, country
- Case-insensitive
- Uses regex matching

### Remote Jobs
- `isRemote` must be the string `"true"` (not boolean)
- Filters jobs where `company.location.isRemote === true`

### Featured Jobs
- `featured` must be the string `"true"` (not boolean)
- Only returns jobs that are currently featured and not expired

---

## Common Use Cases

### 1. Job Board - Browse All Jobs
```
GET /api/jobs?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

### 2. Search Jobs by Keyword
```
GET /api/jobs?search=software engineer&page=1&limit=10
```

### 3. Filter Remote Jobs
```
GET /api/jobs?isRemote=true&page=1&limit=25
```

### 4. Find Jobs by Salary Range
```
GET /api/jobs?minSalary=50000&maxSalary=100000&sortBy=salary.min&sortOrder=desc
```

### 5. Category-Specific Jobs
```
GET /api/jobs?category=engineering&jobType=full-time&experienceLevel=senior
```

### 6. Location-Based Search
```
GET /api/jobs?location=Manila&category=marketing&page=1&limit=15
```

### 7. Featured Jobs Only
```
GET /api/jobs?featured=true&sortBy=createdAt&sortOrder=desc
```

### 8. My Job Applications
```
GET /api/jobs/my-applications?status=pending&page=1&limit=10
```

### 9. My Posted Jobs
```
GET /api/jobs/my-jobs?status=active&page=1&limit=20
```

### 10. Job Applications Management
```
GET /api/jobs/507f1f77bcf86cd799439011/applications?status=shortlisted
```

---

## Notes

1. **All parameters are optional** - Use any combination or none at all
2. **Filters use AND logic** - All specified filters must match
3. **Search is case-insensitive** - Text search ignores case
4. **Default filters** - Only active jobs with status 'active' or 'featured' are returned
5. **Pagination** - Page starts at 1, not 0
6. **Authentication** - Required for protected endpoints (my-applications, my-jobs, etc.)
7. **Authorization** - Some endpoints require specific roles (Provider, Admin)
8. **Salary validation** - Invalid salary ranges return validation errors
9. **Relevance sorting** - Only works when `search` parameter is provided
10. **Remote/Featured filters** - Must be string `"true"`, not boolean

---

## Error Responses

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "minSalary",
      "message": "Minimum salary cannot be greater than maximum salary",
      "code": "INVALID_SALARY_RANGE"
    }
  ]
}
```

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
  "message": "User roles [client] are not authorized to access this route. Required: [provider, admin]"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Job not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error"
}
```

