## Best Practices: Trust & Verification

- Security and Compliance
  - Encrypt sensitive fields (SSN, bank/account numbers); never expose in responses
  - Restrict document access to owner/admin; enforce pending-only mutations
  - Log admin reviews and preserve an audit trail

- Data Integrity
  - Prevent multiple pending requests per type per user
  - Keep `review` metadata consistent; set `reviewedAt`, `reviewedBy`
  - Auto-expire requests via `expiresAt` policy

- Trust Score
  - Use `TrustScore.getUserTrustScore` to initialize; update via `updateFromActivity`
  - Recalculate with `calculateScore` after component updates
  - Cap history length to avoid unbounded growth (already implemented)

- Disputes
  - Associate context (booking/job/order/verification) when filing
  - Separate internal vs external communications (`isInternal`)
  - Use `priority` and `tags` for triage; track outcomes and compensation

- Performance
  - Leverage indexes on status, type, createdAt for queries and analytics
  - Paginate all admin/user listings


