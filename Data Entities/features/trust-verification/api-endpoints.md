## API Endpoints: Trust & Verification

Backed by `src/routes/trustVerification.js` and `src/controllers/trustVerificationController.js`.

Public

- GET /api/trust-verification/verified-users
  - Query: page, limit, minTrustScore?
  - Returns verified users with minimal profile and trustScore

Protected (auth required)

- GET /api/trust-verification/requests
  - Query: page, limit, status?, type?
  - List verification requests (admin context implied by description; route requires auth)

- GET /api/trust-verification/requests/:id
  - Returns a single request; only owner or admin can view

- POST /api/trust-verification/requests
  - Body: { type, documents[], additionalInfo? }
  - Creates a new verification request; prevents duplicate pending by type

- PUT /api/trust-verification/requests/:id
  - Body: { documents[]?, additionalInfo? }
  - Updates a pending request owned by the user

- DELETE /api/trust-verification/requests/:id
  - Deletes request; owner or admin; approved requests not deletable by non-admin

- POST /api/trust-verification/requests/:id/documents
  - Multipart: files[]
  - Uploads additional documents to a pending request

- DELETE /api/trust-verification/requests/:id/documents/:documentId
  - Deletes a document from a pending request

Admin (auth + authorize('admin'))

- PUT /api/trust-verification/requests/:id/review
  - Body: { status: 'approved'|'rejected'|'needs_more_info', adminNotes?, trustScore? }
  - Reviews a request; updates user trust score on approval and emails user

- GET /api/trust-verification/statistics
  - Returns totals, by-status, by-type, monthly trends, average processing time

Notes

- Disputes and direct TrustScore endpoints are not exposed in these routes; only verification requests and verified users are publicly routed.
- Email notifications are sent to admins on creation (if ADMIN_EMAIL) and to users on review.


