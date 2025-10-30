# Logs API Endpoints

Base path: `/api/logs` (auth required; admin-only for most)

## GET `/stats` [admin]
Query: `timeframe='1h'|'24h'|'7d'|'30d'`
Returns aggregated log counts by level and category.

## GET `/` [admin]
Query filters: `level, category, source, startDate, endDate, userId, url, method, statusCode, search, page=1, limit<=100, sortBy='timestamp', sortOrder='desc'`
Returns paginated logs.

## GET `/:logId` [admin]
Returns a specific log by `logId`.

## GET `/analytics/error-trends` [admin]
Query: `timeframe='7d'|...`
Returns error name counts and messages.

## GET `/analytics/performance` [admin]
Query: `timeframe='24h'|...`
Returns URL-level performance metrics (avg/max/min response times, count).

## GET `/user/:userId/activity` [admin or self]
Query: `timeframe='7d'|...`
Returns activity logs for a user.

## GET `/export/data` [admin]
Query: same filters as list plus `format='json'|'csv'`
Returns JSON or CSV export.

## POST `/cleanup` [admin]
Triggers cleanup of expired logs.

## POST `/flush` [admin]
Body: `{ type: 'all'|'database'|'files' }`
Flushes logs from DB/files.

## DELETE `/flush` [admin]
Flushes all logs (alternative endpoint).

## Errors
- 400 invalid params
- 403 forbidden (non-admin)
- 404 not found
- 500 server error
