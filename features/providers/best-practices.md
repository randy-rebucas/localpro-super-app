## Best Practices: Providers

- Security and Privacy
  - Exclude sensitive fields (financial info, background report docs) from public responses
  - Encrypt PII at rest where applicable (banking/tax fields)
  - Audit changes to verification, status, and financial data

- Data Integrity
  - Enforce valid specialties and at least one service area
  - Keep onboarding steps canonical; compute `progress` from completed steps
  - Derive `completionRate` from job stats; do not set directly

- Performance
  - Use existing indexes when filtering by status, category, location, rating
  - Paginate lists and project only necessary fields

- Verification Workflow
  - Separate identity vs business verification paths
  - Capture and validate document types (insurance, license, portfolio)
  - Track `notes` and status transitions for admin decisions

- Experience and Marketplace Fit
  - Populate `userId` minimally for UI (name, contact, avatar)
  - Keep `preferences` and `settings` consistent with booking flow (allowDirectBooking, requireApproval)
  - Align categories with `Service` categories to enable search and matching


