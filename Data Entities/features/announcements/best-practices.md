# Announcements Best Practices

## Targeting
- Prefer broad `targetAudience` where possible; use `targetRoles/Locations/Categories` sparingly to avoid over-fragmentation.
- When `targetAudience='specific_roles'`, validate `targetRoles` is non-empty.

## Lifecycle & Scheduling
- Draft -> Scheduled -> Published -> Archived; keep `publishedAt` and `expiresAt` accurate.
- Use `isSticky` for time-bound critical messages only; unstick after the window.

## Moderation & Comments
- Disable comments for security/policy/incident messages.
- Enforce content length limits; strip scripts/unsafe HTML if rich text is introduced later.
- Support soft delete and audit trails via `metadata`.

## Acknowledgments
- Use `requireAcknowledgment` only for compliance-critical posts.
- Track acknowledgment counts; surface "unread/unacknowledged" to targeted users.

## Analytics
- Increment views server-side on fetch by authenticated users.
- Compute engagement rate as (acknowledgments+comments)/views, guard against divide-by-zero.

## Performance
- Index common filters: status, publishedAt, type, priority, targetAudience, isSticky, createdAt.
- Paginate lists; cap `limit` to <=100.

## Access Control
- Public read for published `targetAudience='all'`; restrict others based on roles.
- Author/Admin can update/delete; log changes and maintain `metadata.version`.

## Validation
- Enforce enums and ISO8601 dates; reject expired schedules (scheduledAt>=now, expiresAt>scheduledAt).

## Example guard (server)
```js
if (body.status === 'scheduled' && body.scheduledAt && new Date(body.scheduledAt) <= new Date()) {
  return res.status(400).json({ success:false, message:'scheduledAt must be in the future' });
}
```
