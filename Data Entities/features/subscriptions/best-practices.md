# Subscriptions Best Practices

## Plans
- Keep features list normalized; map to feature flags used in code.
- Store limits in `limits` and mirror into subscription `usage.limit` on subscribe.

## Subscriptions
- Set `nextBillingDate` and `endDate` on subscribe/renew based on cycle.
- Record history actions for audit and support.
- Support trials via `trial` fields; enforce `trialUsed`.

## Payments
- Use provider order/intent IDs; avoid storing full PII.
- Idempotency for confirm endpoints; handle retries safely.
- Refunds update payment record with reasons and amounts.

## Feature Usage
- Gate features with `hasFeatureAccess` and `checkUsageLimit` middleware.
- Track usage with `UsageTrackingService.trackUsage` and reset monthly.
- Provide user-facing usage dashboards.

## Security & Compliance
- Admin-only plan CRUD and analytics routes.
- Avoid exposing subscription/payment internals in public endpoints.

## Performance
- Index user/status/dates for subscriptions/payments.
- Paginate plan lists if large; cache public plans briefly.
