# Job Application Payload Documentation

## Endpoint
**POST** `/api/jobs/:id/apply`

**Access:** Private (Authentication required)

**Content-Type:** `multipart/form-data` (because it accepts file uploads)

---

## Payload Structure

### Form Data Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resume` | File | No | Resume file (PDF, DOC, or DOCX). Max size: 10MB |
| `coverLetter` | String | No | Cover letter text |
| `expectedSalary` | Number | No | Expected salary amount |
| `availability` | String/Date | No | Availability date (ISO 8601 format or date string) |
| `portfolio` | String | No | Portfolio URL or description |

---

## Examples

### Example 1: Application with Resume (Multipart Form Data)

**Using cURL:**
```bash
curl -X POST http://localhost:5000/api/jobs/64a1b2c3d4e5f6789012345/apply \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@/path/to/resume.pdf" \
  -F "coverLetter=I am very interested in this position and believe my experience aligns perfectly with your requirements." \
  -F "expectedSalary=50000" \
  -F "availability=2024-02-01" \
  -F "portfolio=https://myportfolio.com"
```

**Using JavaScript (Fetch API):**
```javascript
const formData = new FormData();
formData.append('resume', resumeFile); // File object (PDF, DOC, or DOCX)
formData.append('coverLetter', 'I am very interested in this position...');
formData.append('expectedSalary', '50000');
formData.append('availability', '2024-02-01');
formData.append('portfolio', 'https://myportfolio.com');

const response = await fetch('/api/jobs/64a1b2c3d4e5f6789012345/apply', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Don't set Content-Type header - browser will set it with boundary
  },
  body: formData
});
```

**Using Axios:**
```javascript
const formData = new FormData();
formData.append('resume', resumeFile);
formData.append('coverLetter', 'I am very interested in this position...');
formData.append('expectedSalary', '50000');
formData.append('availability', '2024-02-01');
formData.append('portfolio', 'https://myportfolio.com');

await axios.post('/api/jobs/64a1b2c3d4e5f6789012345/apply', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

---

### Example 2: Application without Resume (All Fields Optional)

**Using cURL:**
```bash
curl -X POST http://localhost:5000/api/jobs/64a1b2c3d4e5f6789012345/apply \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "coverLetter=I am very interested in this position." \
  -F "expectedSalary=45000" \
  -F "availability=2024-02-15"
```

**Using JavaScript:**
```javascript
const formData = new FormData();
formData.append('coverLetter', 'I am very interested in this position.');
formData.append('expectedSalary', '45000');
formData.append('availability', '2024-02-15');

const response = await fetch('/api/jobs/64a1b2c3d4e5f6789012345/apply', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

---

### Example 3: Minimal Application (Only Cover Letter)

**Using cURL:**
```bash
curl -X POST http://localhost:5000/api/jobs/64a1b2c3d4e5f6789012345/apply \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "coverLetter=I would like to apply for this position."
```

**Using JavaScript:**
```javascript
const formData = new FormData();
formData.append('coverLetter', 'I would like to apply for this position.');

const response = await fetch('/api/jobs/64a1b2c3d4e5f6789012345/apply', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

---

## Field Details

### `resume` (File)
- **Type:** File upload
- **Required:** No (optional)
- **Accepted formats:** 
  - `application/pdf` (PDF)
  - `application/msword` (DOC)
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
- **Max size:** 10MB (10 * 1024 * 1024 bytes)
- **Field name:** `resume`

### `coverLetter` (String)
- **Type:** Text/String
- **Required:** No (optional)
- **Description:** Cover letter text explaining why you're interested in the position
- **Example:** `"I am very interested in this position and believe my experience aligns perfectly with your requirements."`

### `expectedSalary` (Number)
- **Type:** Number (can be sent as string, will be converted)
- **Required:** No (optional)
- **Description:** Expected salary amount
- **Example:** `50000` or `"50000"`

### `availability` (Date/String)
- **Type:** Date string (ISO 8601 format preferred)
- **Required:** No (optional)
- **Description:** When you're available to start
- **Formats accepted:**
  - ISO 8601: `"2024-02-01T00:00:00.000Z"`
  - Date string: `"2024-02-01"`
  - Any valid date string that can be parsed by JavaScript `new Date()`
- **Example:** `"2024-02-01"` or `"2024-02-01T00:00:00.000Z"`

### `portfolio` (String)
- **Type:** String/URL
- **Required:** No (optional)
- **Description:** Portfolio URL or description
- **Example:** `"https://myportfolio.com"` or `"See my work at https://github.com/username"`

---

## Response

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Application submitted successfully"
}
```

### Error Responses

#### Job Not Found (404)
```json
{
  "success": false,
  "message": "Job not found"
}
```

#### Already Applied (400)
```json
{
  "success": false,
  "message": "You have already applied for this job"
}
```

#### Job Not Accepting Applications (400)
```json
{
  "success": false,
  "message": "This job is no longer accepting applications"
}
```

#### Invalid File Type (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "file",
      "message": "File type must be one of: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "code": "INVALID_FILE_TYPE"
    }
  ]
}
```

#### File Too Large (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "file",
      "message": "File size must be less than 10MB",
      "code": "FILE_TOO_LARGE"
    }
  ]
}
```

---

## Important Notes

1. **All fields are optional** - You can submit an application with just a cover letter, or even without any fields (though that's not recommended).

2. **Resume is optional** - The resume file is not required. If you don't include it, the application will still be submitted.

3. **Use multipart/form-data** - Since the endpoint accepts file uploads, you must use `multipart/form-data` format, not `application/json`.

4. **Authentication required** - You must include a valid JWT token in the Authorization header.

5. **User ID is automatic** - The `applicant` field is automatically set from the authenticated user's ID, so you don't need to include it in the payload.

6. **One application per user** - Each user can only apply once to a specific job. Attempting to apply again will return an error.

7. **File validation** - If a resume file is provided, it will be validated for:
   - File type (PDF, DOC, or DOCX only)
   - File size (max 10MB)

---

## Postman Example

In Postman:
1. Set method to **POST**
2. URL: `{{baseUrl}}/api/jobs/:id/apply` (replace `:id` with actual job ID)
3. Headers: Add `Authorization: Bearer {{authToken}}`
4. Body: Select **form-data**
5. Add fields:
   - `resume` (type: File) - Select a PDF/DOC/DOCX file
   - `coverLetter` (type: Text) - Enter your cover letter
   - `expectedSalary` (type: Text) - Enter salary number
   - `availability` (type: Text) - Enter date
   - `portfolio` (type: Text) - Enter portfolio URL

---

## Testing with cURL (Complete Example)

```bash
# Application with all fields
curl -X POST http://localhost:5000/api/jobs/64a1b2c3d4e5f6789012345/apply \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "resume=@/Users/john/Documents/resume.pdf" \
  -F "coverLetter=I am writing to express my interest in the Software Engineer position. With 5 years of experience in full-stack development, I believe I would be a great fit for your team." \
  -F "expectedSalary=75000" \
  -F "availability=2024-03-01" \
  -F "portfolio=https://github.com/johndoe"
```

