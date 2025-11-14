# Job Application - Full Payload Examples

## Endpoint
**POST** `/api/jobs/:id/apply`

**Content-Type:** `multipart/form-data`

---

## Complete Payload Structure

### All Fields (Full Example)

```javascript
// JavaScript/TypeScript - Full Payload Example
const formData = new FormData();

// File upload (optional)
formData.append('resume', resumeFile); // File object (PDF, DOC, or DOCX)

// Text fields (all optional)
formData.append('coverLetter', 'I am writing to express my strong interest in the Software Engineer position at your company. With over 5 years of experience in full-stack development, I believe I would be an excellent addition to your team. My expertise includes Node.js, React, and cloud technologies, which align perfectly with your requirements.');
formData.append('expectedSalary', '75000');
formData.append('availability', '2024-03-01');
formData.append('portfolio', 'https://github.com/johndoe/projects');
```

---

## Complete cURL Examples

### Example 1: Full Payload with All Fields

```bash
curl -X POST http://localhost:5000/api/jobs/64a1b2c3d4e5f6789012345/apply \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NGE0YjJjM2Q0ZTVmNjc4OTAxMjM0NSIsImlhdCI6MTYzODU2NzI4MCwiZXhwIjoxNjM4NjUzNjgwfQ.example" \
  -F "resume=@/path/to/resume.pdf" \
  -F "coverLetter=I am writing to express my strong interest in the Software Engineer position at your company. With over 5 years of experience in full-stack development, I believe I would be an excellent addition to your team. My expertise includes Node.js, React, and cloud technologies, which align perfectly with your requirements. I am particularly excited about the opportunity to work on innovative projects and contribute to your team's success." \
  -F "expectedSalary=75000" \
  -F "availability=2024-03-01" \
  -F "portfolio=https://github.com/johndoe/projects"
```

### Example 2: With Resume and Cover Letter Only

```bash
curl -X POST http://localhost:5000/api/jobs/64a1b2c3d4e5f6789012345/apply \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@/Users/john/Documents/John_Doe_Resume.pdf" \
  -F "coverLetter=I am very interested in this position and believe my skills and experience make me an ideal candidate."
```

### Example 3: Without Resume (Text Fields Only)

```bash
curl -X POST http://localhost:5000/api/jobs/64a1b2c3d4e5f6789012345/apply \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "coverLetter=I am writing to apply for the Software Engineer position. I have 5 years of experience in web development and am excited about this opportunity." \
  -F "expectedSalary=70000" \
  -F "availability=2024-02-15" \
  -F "portfolio=https://myportfolio.com/johndoe"
```

### Example 4: Minimal Payload (Cover Letter Only)

```bash
curl -X POST http://localhost:5000/api/jobs/64a1b2c3d4e5f6789012345/apply \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "coverLetter=I would like to apply for this position."
```

---

## Complete JavaScript/TypeScript Examples

### Example 1: Full Payload with File Upload

```javascript
// Full payload with all fields
async function applyForJob(jobId, token, applicationData) {
  const formData = new FormData();
  
  // Resume file (optional)
  if (applicationData.resumeFile) {
    formData.append('resume', applicationData.resumeFile);
  }
  
  // Cover letter (optional)
  if (applicationData.coverLetter) {
    formData.append('coverLetter', applicationData.coverLetter);
  }
  
  // Expected salary (optional)
  if (applicationData.expectedSalary) {
    formData.append('expectedSalary', applicationData.expectedSalary.toString());
  }
  
  // Availability date (optional)
  if (applicationData.availability) {
    formData.append('availability', applicationData.availability);
  }
  
  // Portfolio URL (optional)
  if (applicationData.portfolio) {
    formData.append('portfolio', applicationData.portfolio);
  }
  
  const response = await fetch(`/api/jobs/${jobId}/apply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type - browser will set it with boundary
    },
    body: formData
  });
  
  return await response.json();
}

// Usage
const applicationData = {
  resumeFile: document.getElementById('resumeInput').files[0], // File from input
  coverLetter: 'I am writing to express my interest in this position...',
  expectedSalary: 75000,
  availability: '2024-03-01',
  portfolio: 'https://github.com/johndoe'
};

await applyForJob('64a1b2c3d4e5f6789012345', 'your-jwt-token', applicationData);
```

### Example 2: Using Axios

```javascript
import axios from 'axios';

async function applyForJob(jobId, token, applicationData) {
  const formData = new FormData();
  
  if (applicationData.resumeFile) {
    formData.append('resume', applicationData.resumeFile);
  }
  if (applicationData.coverLetter) {
    formData.append('coverLetter', applicationData.coverLetter);
  }
  if (applicationData.expectedSalary) {
    formData.append('expectedSalary', applicationData.expectedSalary.toString());
  }
  if (applicationData.availability) {
    formData.append('availability', applicationData.availability);
  }
  if (applicationData.portfolio) {
    formData.append('portfolio', applicationData.portfolio);
  }
  
  try {
    const response = await axios.post(
      `/api/jobs/${jobId}/apply`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Application error:', error.response?.data || error.message);
    throw error;
  }
}
```

### Example 3: React Component Example

```jsx
import React, { useState } from 'react';

function JobApplicationForm({ jobId, token }) {
  const [formData, setFormData] = useState({
    resume: null,
    coverLetter: '',
    expectedSalary: '',
    availability: '',
    portfolio: ''
  });
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formDataToSend = new FormData();
    
    if (formData.resume) {
      formDataToSend.append('resume', formData.resume);
    }
    if (formData.coverLetter) {
      formDataToSend.append('coverLetter', formData.coverLetter);
    }
    if (formData.expectedSalary) {
      formDataToSend.append('expectedSalary', formData.expectedSalary);
    }
    if (formData.availability) {
      formDataToSend.append('availability', formData.availability);
    }
    if (formData.portfolio) {
      formDataToSend.append('portfolio', formData.portfolio);
    }
    
    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Application submitted successfully!');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Resume (PDF, DOC, DOCX - Max 10MB):</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFormData({ ...formData, resume: e.target.files[0] })}
        />
      </div>
      
      <div>
        <label>Cover Letter:</label>
        <textarea
          value={formData.coverLetter}
          onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
          rows="5"
          placeholder="Write your cover letter here..."
        />
      </div>
      
      <div>
        <label>Expected Salary:</label>
        <input
          type="number"
          value={formData.expectedSalary}
          onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
          placeholder="50000"
        />
      </div>
      
      <div>
        <label>Availability Date:</label>
        <input
          type="date"
          value={formData.availability}
          onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
        />
      </div>
      
      <div>
        <label>Portfolio URL:</label>
        <input
          type="url"
          value={formData.portfolio}
          onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
          placeholder="https://myportfolio.com"
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  );
}
```

---

## Complete Field Specifications

### 1. `resume` (File)
```javascript
// Field name: "resume"
// Type: File
// Required: No
// Accepted MIME types:
//   - application/pdf
//   - application/msword
//   - application/vnd.openxmlformats-officedocument.wordprocessingml.document
// Max size: 10MB (10 * 1024 * 1024 bytes)

formData.append('resume', fileObject);
```

### 2. `coverLetter` (String)
```javascript
// Field name: "coverLetter"
// Type: String/Text
// Required: No
// Max length: No limit (but recommended to keep it reasonable)
// Description: Cover letter explaining interest and qualifications

formData.append('coverLetter', 'Your cover letter text here...');
```

### 3. `expectedSalary` (Number)
```javascript
// Field name: "expectedSalary"
// Type: Number (can be sent as string, will be converted to Number)
// Required: No
// Format: Numeric value
// Description: Expected salary amount

formData.append('expectedSalary', '75000'); // or 75000
```

### 4. `availability` (Date/String)
```javascript
// Field name: "availability"
// Type: Date string
// Required: No
// Format: ISO 8601 date string or any valid date format
// Description: When you're available to start work
// Examples:
//   - "2024-03-01"
//   - "2024-03-01T00:00:00.000Z"
//   - "March 1, 2024"

formData.append('availability', '2024-03-01');
```

### 5. `portfolio` (String)
```javascript
// Field name: "portfolio"
// Type: String/URL
// Required: No
// Format: URL or text description
// Description: Portfolio URL or description
// Examples:
//   - "https://github.com/johndoe"
//   - "https://myportfolio.com"
//   - "See my work at https://github.com/johndoe/projects"

formData.append('portfolio', 'https://github.com/johndoe');
```

---

## Complete Postman Configuration

### Setup in Postman:

1. **Method:** POST
2. **URL:** `{{baseUrl}}/api/jobs/:id/apply`
   - Replace `:id` with actual job ID (e.g., `64a1b2c3d4e5f6789012345`)
3. **Headers:**
   ```
   Authorization: Bearer {{authToken}}
   ```
   (Don't set Content-Type - Postman will set it automatically for form-data)
4. **Body:** Select `form-data`
5. **Add fields:**

| Key | Type | Value | Description |
|-----|------|-------|-------------|
| `resume` | File | [Select File] | PDF, DOC, or DOCX file |
| `coverLetter` | Text | `I am writing to express my interest...` | Cover letter text |
| `expectedSalary` | Text | `75000` | Expected salary |
| `availability` | Text | `2024-03-01` | Availability date |
| `portfolio` | Text | `https://github.com/johndoe` | Portfolio URL |

---

## Complete Request Example (Raw)

### HTTP Request (with all fields)

```
POST /api/jobs/64a1b2c3d4e5f6789012345/apply HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="resume"; filename="resume.pdf"
Content-Type: application/pdf

[Binary file content]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="coverLetter"

I am writing to express my strong interest in the Software Engineer position at your company. With over 5 years of experience in full-stack development, I believe I would be an excellent addition to your team.
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="expectedSalary"

75000
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="availability"

2024-03-01
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="portfolio"

https://github.com/johndoe/projects
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

---

## Response Examples

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Application submitted successfully"
}
```

### Error Responses

#### Validation Error (400)
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

---

## Summary

**All fields are optional** - You can submit:
- ✅ All fields
- ✅ Some fields
- ✅ Just cover letter
- ✅ Just resume
- ✅ No fields (though not recommended)

**Content-Type:** Must be `multipart/form-data` (not `application/json`)

**Authentication:** Required (JWT token in Authorization header)

**File Upload:** Resume is optional, but if provided:
- Must be PDF, DOC, or DOCX
- Max size: 10MB

