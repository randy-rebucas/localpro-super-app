# Jobs Usage Examples

## List jobs
```javascript
const qs = new URLSearchParams({ search: 'cleaner', location: 'Manila', page: 1, limit: 20 });
const res = await fetch(`/api/jobs?${qs}`);
const { data } = await res.json();
```

## Create job (provider)
```javascript
await fetch('/api/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerToken}` },
  body: JSON.stringify({
    title: 'Office Cleaner',
    description: 'Daily office cleaning and maintenance',
    company: { name: 'CleanCo', location: { city: 'Manila', country: 'PH', isRemote: false } },
    category: 'cleaning',
    subcategory: 'office_cleaning',
    jobType: 'full_time',
    experienceLevel: 'entry'
  })
});
```

## Apply for a job (with resume)
```javascript
const form = new FormData();
form.append('resume', file); // pdf/doc/docx
form.append('coverLetter', 'I have 3 years experience...');

await fetch(`/api/jobs/${jobId}/apply`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form
});
```

## Update application status (employer)
```javascript
await fetch(`/api/jobs/${jobId}/applications/${applicationId}/status`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerToken}` },
  body: JSON.stringify({ status: 'shortlisted', feedback: { rating: 5, comments: 'Great fit' } })
});
```
