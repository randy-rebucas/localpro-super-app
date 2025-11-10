# Logs Best Practices

## Logging Strategy
- Structure logs with level, category, source, request/response, and metadata.
- Use correlation IDs (logId) across services/requests.
- Avoid logging secrets/PII; mask tokens and account numbers.

## Retention & Cleanup
- Leverage TTL index on `retentionDate`; set level-based retention days.
- Provide admin cleanup endpoints for immediate pruning.

## Security
- Restrict log APIs to admins; log access attempts.
- Sanitize inputs for search/export; limit export sizes.

## Performance
- Index common filters; paginate lists (max 100 per page).
- Offload heavy analytics to background tasks if needed.

## Observability
- Track error trends and performance metrics periodically.
- Integrate alerts on error surges or slow endpoints.
