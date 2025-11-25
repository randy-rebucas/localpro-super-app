# Create Job - Payload Documentation

## Endpoint
**POST** `/api/jobs`

**Access:** Private (Authentication required - Provider/Admin only)

**Content-Type:** `application/json`

---

## Payload Structure

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Job title (max 100 characters) |
| `description` | String | Job description (max 2000 characters) |
| `company.name` | String | Company name |
| `category` | String/ObjectId | Job category ID or name (will be resolved to ObjectId) |
| `subcategory` | String | Job subcategory |
| `jobType` | String | One of: `full_time`, `part_time`, `contract`, `freelance`, `internship`, `temporary` |
| `experienceLevel` | String | One of: `entry`, `junior`, `mid`, `senior`, `lead`, `executive` |

**Note:** The `employer` field is automatically set from the authenticated user's ID and should not be included in the payload.

---

## Complete Payload Example

### Minimal Required Payload

```json
{
  "title": "Senior Software Engineer",
  "description": "We are looking for an experienced software engineer to join our team...",
  "company": {
    "name": "Tech Corp"
  },
  "category": "65a1b2c3d4e5f6789012345",
  "subcategory": "Software Development",
  "jobType": "full_time",
  "experienceLevel": "senior"
}
```

### Full Payload with All Optional Fields

```json
{
  "title": "Senior Software Engineer",
  "description": "We are looking for an experienced software engineer to join our dynamic team. You will be responsible for designing and developing scalable web applications using modern technologies.",
  "company": {
    "name": "Tech Corp",
    "website": "https://techcorp.com",
    "size": "medium",
    "industry": "Technology",
    "logo": {
      "url": "https://example.com/logo.png",
      "publicId": "localpro/jobs/logos/xyz123"
    },
    "location": {
      "address": "123 Main Street, San Francisco, CA 94102",
      "city": "San Francisco",
      "state": "California",
      "country": "United States",
      "coordinates": {
        "lat": 37.7749,
        "lng": -122.4194
      },
      "isRemote": false,
      "remoteType": "on_site"
    }
  },
  "category": "65a1b2c3d4e5f6789012345",
  "subcategory": "Software Development",
  "jobType": "full_time",
  "experienceLevel": "senior",
  "salary": {
    "min": 120000,
    "max": 180000,
    "currency": "USD",
    "period": "yearly",
    "isNegotiable": true,
    "isConfidential": false
  },
  "benefits": [
    "health_insurance",
    "dental_insurance",
    "retirement_401k",
    "paid_time_off",
    "remote_work",
    "professional_development",
    "stock_options"
  ],
  "requirements": {
    "skills": [
      "JavaScript",
      "Node.js",
      "React",
      "TypeScript",
      "MongoDB",
      "AWS"
    ],
    "education": {
      "level": "bachelor",
      "field": "Computer Science",
      "isRequired": true
    },
    "experience": {
      "years": 5,
      "description": "5+ years of experience in full-stack development"
    },
    "certifications": [
      "AWS Certified Solutions Architect",
      "MongoDB Certified Developer"
    ],
    "languages": [
      {
        "language": "English",
        "proficiency": "native"
      },
      {
        "language": "Spanish",
        "proficiency": "intermediate"
      }
    ],
    "other": [
      "Strong problem-solving skills",
      "Excellent communication abilities"
    ]
  },
  "responsibilities": [
    "Design and develop scalable web applications",
    "Collaborate with cross-functional teams",
    "Write clean, maintainable code",
    "Participate in code reviews",
    "Mentor junior developers"
  ],
  "qualifications": [
    "Bachelor's degree in Computer Science or related field",
    "5+ years of professional software development experience",
    "Strong knowledge of JavaScript and Node.js",
    "Experience with React and modern frontend frameworks"
  ],
  "applicationProcess": {
    "deadline": "2024-12-31T23:59:59.000Z",
    "startDate": "2024-02-01T00:00:00.000Z",
    "applicationMethod": "platform",
    "contactEmail": "jobs@techcorp.com",
    "contactPhone": "+1-555-123-4567",
    "applicationUrl": "https://techcorp.com/careers/apply",
    "instructions": "Please submit your application through our platform. Include a cover letter and resume."
  },
  "status": "active",
  "visibility": "public",
  "tags": [
    "javascript",
    "nodejs",
    "react",
    "full-stack",
    "remote-friendly"
  ]
}
```

---

## Field Details

### Company Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Company name |
| `website` | String | No | Company website URL |
| `size` | String | No | Company size: `startup`, `small`, `medium`, `large`, `enterprise` (default: `small`) |
| `industry` | String | No | Industry sector |
| `logo` | Object | No | Logo object with `url` and `publicId` |
| `location` | Object | No | Location details (see below) |

### Company Location Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | String | No | Full address (will be geocoded automatically if provided) |
| `city` | String | No | City name (auto-populated from geocoding) |
| `state` | String | No | State/Province (auto-populated from geocoding) |
| `country` | String | No | Country (auto-populated from geocoding) |
| `coordinates` | Object | No | Coordinates with `lat` and `lng` (auto-populated from geocoding) |
| `isRemote` | Boolean | No | Whether the job is remote (default: `false`) |
| `remoteType` | String | No | Remote type: `fully_remote`, `hybrid`, `on_site` (default: `on_site`) |

**Note:** If you provide `company.location.address`, the system will automatically geocode it and populate `city`, `state`, `country`, and `coordinates`.

### Salary Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `min` | Number | No | Minimum salary |
| `max` | Number | No | Maximum salary |
| `currency` | String | No | Currency code (default: `USD`) |
| `period` | String | No | Pay period: `hourly`, `daily`, `weekly`, `monthly`, `yearly` (default: `yearly`) |
| `isNegotiable` | Boolean | No | Whether salary is negotiable (default: `false`) |
| `isConfidential` | Boolean | No | Whether salary is confidential (default: `false`) |

### Benefits Array

Array of strings. Valid values:
- `health_insurance`
- `dental_insurance`
- `vision_insurance`
- `life_insurance`
- `retirement_401k`
- `paid_time_off`
- `sick_leave`
- `maternity_leave`
- `paternity_leave`
- `flexible_schedule`
- `remote_work`
- `professional_development`
- `gym_membership`
- `commuter_benefits`
- `stock_options`
- `bonus`
- `other`

### Requirements Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `skills` | Array[String] | No | Required skills |
| `education` | Object | No | Education requirements (see below) |
| `experience` | Object | No | Experience requirements (see below) |
| `certifications` | Array[String] | No | Required certifications |
| `languages` | Array[Object] | No | Language requirements (see below) |
| `other` | Array[String] | No | Other requirements |

### Education Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `level` | String | No | Education level: `high_school`, `associate`, `bachelor`, `master`, `phd`, `none_required` |
| `field` | String | No | Field of study |
| `isRequired` | Boolean | No | Whether education is required (default: `true`) |

### Experience Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `years` | Number | No | Years of experience required |
| `description` | String | No | Experience description |

### Language Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `language` | String | Yes | Language name |
| `proficiency` | String | Yes | Proficiency level: `beginner`, `intermediate`, `advanced`, `native` |

### Application Process Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deadline` | Date/ISO String | No | Application deadline |
| `startDate` | Date/ISO String | No | Job start date |
| `applicationMethod` | String | No | Method: `email`, `website`, `platform`, `phone` (default: `platform`) |
| `contactEmail` | String | No | Contact email for applications |
| `contactPhone` | String | No | Contact phone for applications |
| `applicationUrl` | String | No | External application URL |
| `instructions` | String | No | Application instructions |

### Status and Visibility

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `status` | String | No | `draft` | Job status: `draft`, `active`, `paused`, `closed`, `filled` |
| `visibility` | String | No | `public` | Visibility: `public`, `private`, `featured` |
| `tags` | Array[String] | No | - | Tags for categorization and search |

---

## Request Examples

### cURL Example

```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Senior Software Engineer",
    "description": "We are looking for an experienced software engineer...",
    "company": {
      "name": "Tech Corp",
      "location": {
        "address": "123 Main Street, San Francisco, CA 94102"
      }
    },
    "category": "65a1b2c3d4e5f6789012345",
    "subcategory": "Software Development",
    "jobType": "full_time",
    "experienceLevel": "senior",
    "salary": {
      "min": 120000,
      "max": 180000,
      "currency": "USD",
      "period": "yearly"
    }
  }'
```

### JavaScript/TypeScript Example (Fetch API)

```javascript
const jobData = {
  title: "Senior Software Engineer",
  description: "We are looking for an experienced software engineer...",
  company: {
    name: "Tech Corp",
    location: {
      address: "123 Main Street, San Francisco, CA 94102"
    }
  },
  category: "65a1b2c3d4e5f6789012345",
  subcategory: "Software Development",
  jobType: "full_time",
  experienceLevel: "senior",
  salary: {
    min: 120000,
    max: 180000,
    currency: "USD",
    period: "yearly"
  }
};

const response = await fetch('/api/jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(jobData)
});

const result = await response.json();
```

### JavaScript/TypeScript Example (Axios)

```javascript
const jobData = {
  title: "Senior Software Engineer",
  description: "We are looking for an experienced software engineer...",
  company: {
    name: "Tech Corp",
    location: {
      address: "123 Main Street, San Francisco, CA 94102"
    }
  },
  category: "65a1b2c3d4e5f6789012345",
  subcategory: "Software Development",
  jobType: "full_time",
  experienceLevel: "senior",
  salary: {
    min: 120000,
    max: 180000,
    currency: "USD",
    period: "yearly"
  }
};

const response = await axios.post('/api/jobs', jobData, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Response Examples

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6789012345",
    "title": "Senior Software Engineer",
    "description": "We are looking for an experienced software engineer...",
    "company": {
      "name": "Tech Corp",
      "location": {
        "address": "123 Main Street, San Francisco, CA 94102",
        "city": "San Francisco",
        "state": "California",
        "country": "United States",
        "coordinates": {
          "lat": 37.7749,
          "lng": -122.4194
        },
        "isRemote": false,
        "remoteType": "on_site"
      }
    },
    "employer": "64a1b2c3d4e5f6789012345",
    "category": "65a1b2c3d4e5f6789012345",
    "subcategory": "Software Development",
    "jobType": "full_time",
    "experienceLevel": "senior",
    "salary": {
      "min": 120000,
      "max": 180000,
      "currency": "USD",
      "period": "yearly",
      "isNegotiable": false,
      "isConfidential": false
    },
    "status": "draft",
    "visibility": "public",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### Validation Error (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "category",
      "message": "Category is required"
    }
  ]
}
```

#### Unauthorized (401)

```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

#### Forbidden (403)

```json
{
  "success": false,
  "message": "Not authorized to create jobs"
}
```

#### Server Error (500)

```json
{
  "success": false,
  "message": "Server error"
}
```

---

## Important Notes

1. **Category Field**: The `category` field accepts either:
   - A valid ObjectId string (e.g., `"65a1b2c3d4e5f6789012345"`)
   - A category name (e.g., `"Cleaning"` or `"customer_service"` - will be normalized and resolved to ObjectId)

2. **Automatic Geocoding**: If you provide `company.location.address`, the system will automatically:
   - Geocode the address using Google Maps API
   - Populate `city`, `state`, `country`, and `coordinates` fields
   - This happens asynchronously and won't fail the request if geocoding fails

3. **Employer Field**: The `employer` field is automatically set from the authenticated user's ID (`req.user.id`). Do not include it in your payload.

4. **Default Values**: 
   - `status` defaults to `"draft"`
   - `visibility` defaults to `"public"`
   - `company.size` defaults to `"small"`
   - `company.location.isRemote` defaults to `false`
   - `company.location.remoteType` defaults to `"on_site"`
   - `salary.currency` defaults to `"USD"`
   - `salary.period` defaults to `"yearly"`
   - `applicationProcess.applicationMethod` defaults to `"platform"`

5. **Arrays**: Fields like `benefits`, `requirements.skills`, `responsibilities`, `qualifications`, and `tags` are arrays. You can provide them as empty arrays `[]` or omit them entirely.

6. **Dates**: Date fields (`applicationProcess.deadline`, `applicationProcess.startDate`) can be provided as:
   - ISO 8601 strings: `"2024-12-31T23:59:59.000Z"`
   - Date strings: `"2024-12-31"`
   - JavaScript Date objects (will be serialized to ISO strings)

---

## Related Documentation

- [Job Application Payload](./JOB_APPLICATION_PAYLOAD.md) - For applying to jobs
- [Job Endpoint Query Parameters](./JOB_ENDPOINT_QUERY_PARAMETERS.md) - For querying jobs
- [Jobs Feature Documentation](./features/jobs.md) - General jobs feature documentation

