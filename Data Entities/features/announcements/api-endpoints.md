# Announcements API Endpoints

Base path: `/api/announcements`

## Public
### GET `/`
Query: `type? priority? status? targetAudience? page? limit? sortBy? sortOrder? search? tags? isSticky? author?`
Response: `{ success, data: { announcements: [...], pagination:{...} } }`

### GET `/:id`
Path: `id` (mongo id)
Response: `{ success, data: { ...announcement, isAcknowledged, canComment, canAcknowledge } }`

## Authenticated
### GET `/my/list`
Query: `page? limit? includeAcknowledged?`
Response: `{ success, data: { announcements:[...], pagination:{...} } }`

### POST `/`  [admin, agency_admin, agency_owner]
Body: `title, content, summary, type?, priority?, targetAudience?, targetRoles?, targetLocations?, targetCategories?, scheduledAt?, expiresAt?, isSticky?, allowComments?, requireAcknowledgment?, tags?`
Response: `{ success, message, data }`

### PUT `/:id`
Body: any updatable fields
Response: `{ success, message, data }`

### DELETE `/:id`
Response: `{ success, message }`

### POST `/:id/acknowledge`
Response: `{ success, message, data:{ acknowledgmentCount } }`

### POST `/:id/comments`
Body: `{ content }`
Response: `{ success, message, data:{ comment, totalComments } }`

## Admin
### GET `/admin/statistics` [admin]
Response:
```
{
  success: true,
  data: {
    overview: {
      totalAnnouncements,
      publishedAnnouncements,
      draftAnnouncements,
      scheduledAnnouncements,
      totalViews,
      totalAcknowledged,
      totalComments
    },
    typeBreakdown: [{ _id:type, count, totalViews }],
    priorityBreakdown: [{ _id:priority, count }]
  }
}
```

## Validation Notes
- Request validators enforce enums, sizes, date format ISO8601, arrays for list fields.
