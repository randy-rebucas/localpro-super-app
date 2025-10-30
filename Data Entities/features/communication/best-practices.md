# Communication Best Practices

## Access Control
- Only participants can read/update/delete within a conversation.
- Sender-only edits/deletes for messages; use soft delete.

## Read Receipts
- Store per-user read receipts in `Message.readBy`.
- Update on fetch and on explicit `PUT /read`.

## Attachments
- Validate mime/type/size; store via Cloudinary/S3 and save URLs only.
- Avoid storing secrets in message content/attachments.

## Notifications
- Respect user notification preferences when sending email/SMS/push.
- Use `priority` to drive UI prominence and batch delivery.
- Set `expiresAt` for time-sensitive alerts.

## Performance
- Paginate messages (e.g., 50 per page) and conversations.
- Use `.lean()` for read-only lists; index heavy filters.

## UX
- Show typing/read indicators via realtime channels (future push service).
- Collapse system/payment updates by type for readability.

## Data Retention
- Consider retention for messages and notifications based on policy.
