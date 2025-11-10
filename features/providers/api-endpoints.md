## API Endpoints: Providers

Backed by `src/routes/providers.js` and `src/controllers/providerController.js`.

Public

- GET /api/providers
  - Query: status, providerType, category, city, state, minRating, featured, promoted, page, limit, sortBy, sortOrder
  - Returns paginated active providers; excludes sensitive verification/financial fields

- GET /api/providers/:id
  - Params: id (ObjectId)
  - Returns provider profile (increments `metadata.profileViews`)

Protected (auth required)

- GET /api/providers/profile/me
  - Returns current user's provider profile

- POST /api/providers/profile
  - Body: providerType, businessInfo, professionalInfo, verification, preferences, settings
  - Creates provider profile for a user with role `client`; sets status `pending` and initializes onboarding

- PUT /api/providers/profile
  - Body: partial Provider fields
  - Updates current user's provider profile; audited

- PUT /api/providers/onboarding/step
  - Body: { step: enum ['profile_setup','business_info','professional_info','verification','documents','portfolio','preferences','review'], data: object }
  - Marks step complete, updates progress, marks onboarding completed when 100%

- POST /api/providers/documents/upload
  - Multipart: files[] (max 5; images/PDF)
  - Body: { documentType: 'insurance'|'license'|'portfolio', category? }
  - Appends file URLs to matching verification section

- GET /api/providers/dashboard/overview
  - Returns dashboard aggregates (profile, earnings, recentActivity, notifications, performance)

- GET /api/providers/analytics/performance
  - Query: timeframe ['7d','30d','90d','1y']
  - Returns performance analytics snapshot

Admin

- GET /api/providers/admin/all
  - Query: status, providerType, page, limit, sortBy, sortOrder
  - Returns paginated providers for admin management

- PUT /api/providers/admin/:id/status
  - Params: id
  - Body: { status: 'pending'|'active'|'suspended'|'inactive'|'rejected', notes? }
  - Updates provider status; audited

Validation Highlights

- Creation requires providerType, valid specialties, and at least one service area
- Updates validate enumerated fields when provided
- Onboarding step enforces known step names and object `data`
- File uploads restrict to images/PDF, max 10MB per file, max 5 files


