# Jobs API Endpoints

Base path: `/api/jobs`

## Public
### GET `/`
Query: `search?, category?, subcategory?, jobType?, experienceLevel?, location?, isRemote?, minSalary?, maxSalary?, company?, page?, limit?, sortBy?, sortOrder?, featured?`
Response: paginated jobs.

### GET `/search`
Query: same search params; full text search wrapper.

### GET `/:id`
Get job details.

## Authenticated
### POST `/` (provider/admin)
Create job.

### PUT `/:id` (provider/admin)
Update job.

### DELETE `/:id` (provider/admin)
Delete job.

### POST `/:id/logo` (provider/admin)
Upload company logo (multipart).

### GET `/:id/stats` (provider/admin)
Get job statistics.

## Applications
### POST `/:id/apply`
Multipart with resume (pdf/doc/docx) and fields; creates an application.

### GET `/my-applications`
Get current user's applications.

### GET `/my-jobs` (provider/admin)
Get employer's jobs.

### GET `/:id/applications` (provider/admin)
List applications for a job.

### PUT `/:id/applications/:applicationId/status` (provider/admin)
Update application status (and optional feedback).

## Responses
- Lists: `{ success, count, total, page, pages, data }`
- Mutations: `{ success, message, data }`
- Details: `{ success, data }`

## Errors
- 400 validation errors
- 403 unauthorized
- 404 not found
- 500 server error
