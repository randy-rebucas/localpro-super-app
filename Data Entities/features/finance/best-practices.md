# Finance Best Practices

## Loans
- Validate affordability: income, obligations, risk score thresholds.
- Generate amortization schedules server-side; lock after approval.
- Track lifecycle transitions with audit logs (who/when/what).
- Disburse via secured payment provider; store external refs only.

## Salary Advance
- Caps: percentage of monthly salary and frequency limits.
- Auto-deduct on payroll where permitted; record repaidAt and receipts.
- Employer approval path; keep employer-employee linkage.

## Transactions
- Immutability for financial records; use correcting entries rather than edits.
- Reconcile with payment providers via webhooks; store provider IDs.
- Use idempotency keys for external payment actions.

## Wallet
- Keep `balance` and `pendingBalance` consistent; atomic updates.
- Minimum withdrawal thresholds; KYC checks before payouts.
- Notify low balance/withdrawal/payment events per user settings.

## Security & Compliance
- Do not store raw secrets; use env/secret manager.
- Mask PII and account numbers in logs/exports.
- Consider AML/KYC workflows for larger loans/payouts.

## Performance
- Index user, status, createdAt, and reference for queries.
- Paginate all lists; avoid large in-memory aggregations.
