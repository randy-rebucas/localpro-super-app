# Communication Data Entities

## Conversation
- participants: [{ user:ObjectId(User), role['client','provider','admin','support'], joinedAt, lastReadAt }]
- type: ['booking','job_application','support','general','agency'] (default 'general')
- subject: string (required)
- context: { bookingId?, jobId?, agencyId?, orderId? }
- status: ['active','resolved','closed','archived'] (default 'active')
- priority: ['low','medium','high','urgent'] (default 'medium')
- tags: [string]
- lastMessage: { content, sender:UserId, timestamp }
- isActive: boolean (default true)
- timestamps

Indexes:
- participants.user, status, type, context.bookingId, context.jobId, updatedAt

Methods/Statics:
- addParticipant(userId, role), removeParticipant(userId), markAsRead(userId), updateLastMessage(message)
- getUserConversations(userId, limit, skip)

## Message
- conversation: ObjectId(Conversation)
- sender: ObjectId(User)
- content: string (required)
- type: ['text','image','file','system','booking_update','payment_update'] (default 'text')
- attachments: [{ filename, url, publicId, mimeType, size }]
- metadata: { isEdited, editedAt, isDeleted, deletedAt, replyTo:MessageId }
- readBy: [{ user:UserId, readAt }]
- reactions: [{ user:UserId, emoji, timestamp }]
- timestamps

Indexes:
- { conversation, createdAt:-1 }, sender, readBy.user, { conversation, metadata.isDeleted }

Methods/Statics:
- markAsRead(userId), addReaction(userId, emoji), removeReaction(userId)
- getConversationMessages(conversationId, limit, skip)

## Notification
- user: ObjectId(User)
- type: ['booking_created','booking_confirmed','booking_cancelled','booking_completed','job_application','application_status_update','job_posted','message_received','payment_received','payment_failed','referral_reward','course_enrollment','order_confirmation','subscription_renewal','subscription_cancelled','system_announcement']
- title: string (required)
- message: string (required)
- data: Mixed (context payload)
- isRead: boolean (default false), readAt
- priority: ['low','medium','high','urgent'] (default 'medium')
- channels: { inApp:boolean, email:boolean, sms:boolean, push:boolean }
- scheduledFor, sentAt, expiresAt
- timestamps

Indexes:
- { user, isRead }, type, createdAt, scheduledFor, { user, type, isRead }, { user, priority }

Statics:
- getUserNotifications(userId, limit, skip), markAsRead(userId, ids[])
