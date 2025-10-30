# Announcements Data Entities

## Announcement
- title: string (required, <=200)
- content: string (required, <=5000)
- summary: string (required, <=500)
- type: enum ['system','maintenance','feature','security','promotion','policy','event','emergency','update','general'] (default 'general')
- priority: enum ['low','medium','high','urgent'] (default 'medium')
- status: enum ['draft','scheduled','published','archived'] (default 'draft')
- targetAudience: enum ['all','providers','clients','agencies','premium','verified','specific_roles'] (default 'all')
- targetRoles: ['admin','provider','client','agency_admin','agency_owner','instructor','supplier','advertiser']
- targetLocations: [string]
- targetCategories: service category enum list
- scheduledAt: Date|null
- publishedAt: Date|null
- expiresAt: Date|null
- isSticky: boolean (default false)
- allowComments: boolean (default true)
- requireAcknowledgment: boolean (default false)
- attachments: [{ filename, url, type: ['image','document','video','audio'], size }]
- tags: [string<=50]
- author: ObjectId(User, required)
- authorName: string (required)
- authorRole: string (required)
- views: number
- acknowledgments: [{ user:ObjectId(User), acknowledgedAt }]
- comments: [{ user, userName, content<=1000, createdAt, isEdited, editedAt, likes:[UserId], replies:[{ user, userName, content<=500, createdAt, isEdited, editedAt, likes:[UserId] }] }]
- analytics: { totalViews, uniqueViews, totalAcknowledged, totalComments, engagementRate }
- metadata: { lastModifiedBy:UserId, lastModifiedAt, version, isDeleted, deletedAt, deletedBy }
- timestamps, toJSON/toObject include virtuals

### Indexes
- { status, publishedAt:-1 }
- { type, priority }
- { targetAudience, targetRoles }
- { scheduledAt }, { expiresAt }
- { isSticky, publishedAt:-1 }
- { tags }, { author }, { createdAt:-1 }

### Virtuals
- isActive: `status==='published' && !expired && !future`
- isExpired: `expiresAt <= now`
- isScheduled: `status==='scheduled' && scheduledAt>now`

### Hooks
- pre('save'): sets `publishedAt` on publish, updates `metadata.lastModifiedAt`, increments `metadata.version` on updates

### Statics
- getActiveAnnouncements(targetAudience='all', userRoles=[])
- getAnnouncementsForUser(userId, userRole, userLocation?, userCategories[]?)

### Methods
- incrementViews(userId)
- acknowledge(userId)
- addComment(userId, userName, content)
- softDelete(deletedBy)
