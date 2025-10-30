# App Settings Best Practices

## Governance
- Single-document singleton via `getCurrentSettings()`; avoid multiple rows.
- Use category updates for clearer auditing and safer changes.
- Version app clients; use `forceUpdate` for breaking changes.

## Security
- Restrict admin endpoints; enforce role checks and validation.
- Do not expose secrets via public endpoints; only return whitelisted fields.
- Keep `integrations.*` secrets in env/secret storage; store references if needed.

## Rollouts
- Prefer feature flags (`features.*.enabled`) for gradual release.
- Pair flags with analytics to observe impact; revert quickly on regressions.

## Maintenance Mode
- Provide clear message and `estimatedEndTime`; surface on client splash.
- Keep health endpoint fast and public.

## Validation & Consistency
- Use strict enums for providers, currencies, timezones, and categories.
- Validate time formats (HH:mm) and date ISO8601; guard ranges.

## Performance
- Cache public settings server-side (e.g., 60s TTL); invalidate on admin update.
- Compute a flattened public projection once per request.

## Example server cache (pseudo)
```js
const cacheKey = 'publicAppSettings';
let json = await redis.get(cacheKey);
if (!json) {
  const settings = await AppSettings.getCurrentSettings();
  const publicProjection = {/* ... */};
  json = JSON.stringify(publicProjection);
  await redis.setex(cacheKey, 60, json);
}
return JSON.parse(json);
```
