# My Applications Endpoint Documentation

## Endpoint
**GET** `/api/jobs/my-applications`

**Access:** Private (Authentication required)

**Description:** Get all job applications submitted by the authenticated user.

---

## Request

### Method
```
GET
```

### URL
```
/api/jobs/my-applications
```

### Headers
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | String | No | - | Filter applications by status |
| `page` | Number | No | 1 | Page number for pagination |
| `limit` | Number | No | 10 | Number of applications per page |

### Status Values

The `status` parameter accepts one of the following values:
- `pending` - Application is pending review
- `reviewing` - Application is being reviewed
- `shortlisted` - Application has been shortlisted
- `interviewed` - Candidate has been interviewed
- `rejected` - Application has been rejected
- `hired` - Candidate has been hired

---

## Request Examples

### Example 1: Get All Applications

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/jobs/my-applications" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript:**
```javascript
const response = await fetch('/api/jobs/my-applications', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

### Example 2: Get Applications with Pagination

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/jobs/my-applications?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript:**
```javascript
const response = await fetch('/api/jobs/my-applications?page=1&limit=20', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

### Example 3: Filter by Status

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/jobs/my-applications?status=shortlisted" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript:**
```javascript
const response = await fetch('/api/jobs/my-applications?status=shortlisted', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

### Example 4: Combined Filters

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/jobs/my-applications?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript:**
```javascript
const params = new URLSearchParams({
  status: 'pending',
  page: '1',
  limit: '10'
});

const response = await fetch(`/api/jobs/my-applications?${params}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "count": 5,
  "total": 12,
  "page": 1,
  "pages": 2,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "job": {
        "_id": "64a1b2c3d4e5f6789012346",
        "title": "Senior Software Engineer",
        "company": {
          "name": "Tech Solutions Inc.",
          "logo": {
            "url": "https://cloudinary.com/logo.png",
            "publicId": "localpro/jobs/logos/logo"
          }
        }
      },
      "employer": {
        "_id": "64a1b2c3d4e5f6789012347",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "businessName": "Tech Solutions Inc."
        }
      },
      "status": "pending",
      "appliedAt": "2024-01-15T10:30:00.000Z",
      "coverLetter": "I am writing to express my interest in this position...",
      "expectedSalary": 75000,
      "availability": "2024-03-01T00:00:00.000Z"
    },
    {
      "_id": "64a1b2c3d4e5f6789012348",
      "job": {
        "_id": "64a1b2c3d4e5f6789012349",
        "title": "Full Stack Developer",
        "company": {
          "name": "WebDev Corp",
          "logo": null
        }
      },
      "employer": {
        "_id": "64a1b2c3d4e5f6789012350",
        "firstName": "Jane",
        "lastName": "Smith",
        "profile": {
          "businessName": "WebDev Corp"
        }
      },
      "status": "shortlisted",
      "appliedAt": "2024-01-10T14:20:00.000Z",
      "coverLetter": "I am excited about this opportunity...",
      "expectedSalary": 70000,
      "availability": "2024-02-15T00:00:00.000Z"
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Request success status |
| `count` | Number | Number of applications in current page |
| `total` | Number | Total number of applications |
| `page` | Number | Current page number |
| `pages` | Number | Total number of pages |
| `data` | Array | Array of application objects |

### Application Object Structure

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Application ID |
| `job._id` | String | Job ID |
| `job.title` | String | Job title |
| `job.company.name` | String | Company name |
| `job.company.logo` | Object | Company logo (url, publicId) |
| `employer._id` | String | Employer user ID |
| `employer.firstName` | String | Employer first name |
| `employer.lastName` | String | Employer last name |
| `employer.profile.businessName` | String | Employer business name |
| `status` | String | Application status (pending, reviewing, shortlisted, interviewed, rejected, hired) |
| `appliedAt` | Date | Date when application was submitted |
| `coverLetter` | String | Cover letter text |
| `expectedSalary` | Number | Expected salary |
| `availability` | Date | Availability date |

---

## Error Responses

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Not authorized, token required"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## Usage Examples

### React Hook Example

```jsx
import { useState, useEffect } from 'react';

function useMyApplications(token, filters = {}) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const params = new URLSearchParams({
          page: filters.page || '1',
          limit: filters.limit || '10',
          ...(filters.status && { status: filters.status })
        });

        const response = await fetch(`/api/jobs/my-applications?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (data.success) {
          setApplications(data.data);
          setPagination({
            page: data.page,
            pages: data.pages,
            total: data.total,
            count: data.count
          });
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [token, filters.status, filters.page, filters.limit]);

  return { applications, loading, pagination };
}

// Usage
function MyApplicationsPage() {
  const { token } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  
  const { applications, loading, pagination } = useMyApplications(token, {
    status: statusFilter,
    page,
    limit: 10
  });

  return (
    <div>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="reviewing">Reviewing</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="interviewed">Interviewed</option>
        <option value="rejected">Rejected</option>
        <option value="hired">Hired</option>
      </select>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>Total: {pagination.total} applications</p>
          {applications.map(app => (
            <div key={app._id}>
              <h3>{app.job.title}</h3>
              <p>Company: {app.job.company.name}</p>
              <p>Status: {app.status}</p>
              <p>Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Axios Example

```javascript
import axios from 'axios';

async function getMyApplications(token, options = {}) {
  try {
    const params = {
      page: options.page || 1,
      limit: options.limit || 10,
      ...(options.status && { status: options.status })
    };

    const response = await axios.get('/api/jobs/my-applications', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching applications:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
const data = await getMyApplications(token, {
  status: 'pending',
  page: 1,
  limit: 20
});

console.log(`Found ${data.total} applications`);
console.log(`Page ${data.page} of ${data.pages}`);
```

---

## Postman Configuration

### Setup in Postman:

1. **Method:** GET
2. **URL:** `{{baseUrl}}/api/jobs/my-applications`
3. **Headers:**
   ```
   Authorization: Bearer {{authToken}}
   ```
4. **Query Parameters (optional):**
   - `status` - Filter by status (pending, reviewing, shortlisted, interviewed, rejected, hired)
   - `page` - Page number (default: 1)
   - `limit` - Items per page (default: 10)

### Example URLs:
```
{{baseUrl}}/api/jobs/my-applications
{{baseUrl}}/api/jobs/my-applications?status=pending
{{baseUrl}}/api/jobs/my-applications?page=2&limit=20
{{baseUrl}}/api/jobs/my-applications?status=shortlisted&page=1&limit=10
```

---

## Notes

1. **Authentication Required** - You must be logged in to access this endpoint
2. **User-Specific** - Only returns applications submitted by the authenticated user
3. **Sorted by Date** - Applications are sorted by `appliedAt` in descending order (newest first)
4. **Pagination** - Results are paginated for better performance
5. **Status Filtering** - Filter applications by their current status
6. **No Resume Data** - The response does not include resume file data (only basic application info)

---

## Related Endpoints

- **POST** `/api/jobs/:id/apply` - Submit a new job application
- **GET** `/api/jobs/:id/applications` - Get applications for a specific job (Employer/Admin only)
- **PUT** `/api/jobs/:id/applications/:applicationId/status` - Update application status (Employer/Admin only)

