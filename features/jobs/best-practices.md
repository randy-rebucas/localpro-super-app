# Jobs Best Practices

## Postings
- Normalize categories/subcategories; validate enums.
- Use text index for search; combine with filters for performance.
- Keep salary confidentiality flags respected in UI/API.

## Applications
- One application per user per job; enforce in addApplication.
- Store resumes in cloud storage; validate file types and sizes.
- Track interview schedules and status transitions with timestamps.

## Employer Tools
- Restrict job CRUD and application status updates to employer/admin.
- Provide stats endpoint to monitor views/applications.

## Performance
- Use lean queries for lists; paginate consistently.
- Ensure compound indexes match common query patterns (category+type+status, location+status, etc.).
