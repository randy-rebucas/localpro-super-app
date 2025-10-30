# Analytics Best Practices

## Event Taxonomy
- Maintain a controlled enum for `eventType` aligned with product KPIs.
- Use `module` to segment domains (marketplace, jobs, referrals, academy, settings, etc.).
- Keep `eventData` compact; prefer IDs and small denormalized fields.

## Privacy & Security
- Do not store PII in `eventData` or `metadata` (avoid emails, phone, payment data).
- Hash or drop IP if not strictly required; limit retention.
- Honor user privacy/consent settings and feature flags.

## Performance
- Batch send events on the client; debounce high-frequency actions.
- Use capped response sizes and indexes: `{ eventType, timestamp:-1 }`.
- Prefer materialized summaries (`UserAnalytics`, `ServiceAnalytics`) for dashboards.

## Data Quality
- Validate `eventType`; reject unknown types.
- Attach `sessionId`, `deviceType`, and `referrer` when available.
- Use ISO dates for `startDate`/`endDate` filters.

## Sampling & Limits
- Sample high-volume events (e.g., `page_view`) at n% if load spikes.
- Limit `/custom` to 100 rows; paginate if needed.

## Aggregations
- Use `$match` with pre-built date ranges before grouping.
- Precompute monthly snapshots for platform metrics.

## Error Handling
- Return consistent errors; log server failures with correlation IDs.

## Example Validation (server)
```js
if (!req.body.eventType || !req.body.module) {
  return res.status(400).json({ success:false, message:'Event type and module are required' });
}
```
