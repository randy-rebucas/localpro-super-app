# Broadcaster Feature Documentation

## Overview
The Broadcaster feature enables promotional content broadcasting across the platform, including banner ads, announcements, and promotional campaigns with view and click tracking.

## Base Path
`/api/broadcaster`

## Endpoints

### Public Endpoints

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/active` | Get active broadcasters | - |
| GET | `/stats` | Get broadcaster statistics | - |
| GET | `/:id` | Get broadcaster by ID | - |
| POST | `/:id/view` | Track broadcaster view | - |
| POST | `/:id/click` | Track broadcaster click | - |
| POST | `/` | Track view/click (with action in body) | - |

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/` | List all broadcasters | AUTHENTICATED |
| POST | `/` | Create broadcaster | AUTHENTICATED |
| PUT | `/:id` | Update broadcaster | AUTHENTICATED |
| DELETE | `/:id` | Delete broadcaster | AUTHENTICATED |

## Request/Response Examples

### Get Active Broadcasters
```http
GET /api/broadcaster/active
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "title": "Summer Sale",
      "description": "Get 20% off all services",
      "content": "<p>Limited time offer!</p>",
      "imageUrl": "https://cloudinary.com/.../banner.jpg",
      "linkUrl": "https://example.com/promo",
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2025-01-31T23:59:59Z",
      "priority": 1,
      "isActive": true,
      "views": 1500,
      "clicks": 120
    }
  ]
}
```

### Create Broadcaster
```http
POST /api/broadcaster
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Year Promotion",
  "description": "Special offers for the new year",
  "content": "<p>Start the year with great savings!</p>",
  "imageUrl": "https://cloudinary.com/.../newyear.jpg",
  "linkUrl": "https://example.com/newyear",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-01-15T23:59:59Z",
  "priority": 1,
  "isActive": true
}
```

### Track View
```http
POST /api/broadcaster/:id/view
```

Or using body:
```http
POST /api/broadcaster
Content-Type: application/json

{
  "action": "view",
  "broadcasterId": "64f1a2b3c4d5e6f7g8h9i0j1"
}
```

### Track Click
```http
POST /api/broadcaster/:id/click
```

Or using body:
```http
POST /api/broadcaster
Content-Type: application/json

{
  "action": "click",
  "broadcasterId": "64f1a2b3c4d5e6f7g8h9i0j1"
}
```

### Update Broadcaster
```http
PUT /api/broadcaster/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Promotion",
  "isActive": false
}
```

### Get Broadcaster Statistics
```http
GET /api/broadcaster/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "totalBroadcasters": 10,
    "activeBroadcasters": 5,
    "totalViews": 15000,
    "totalClicks": 1200,
    "averageCTR": 8.0,
    "topPerformers": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "title": "Summer Sale",
        "views": 5000,
        "clicks": 500,
        "ctr": 10.0
      }
    ]
  }
}
```

## Broadcaster Fields

| Field | Type | Description |
|-------|------|-------------|
| title | String | Broadcaster title |
| description | String | Short description |
| content | String | HTML content |
| imageUrl | String | Banner image URL |
| linkUrl | String | Target link URL |
| startDate | Date | Campaign start date |
| endDate | Date | Campaign end date |
| priority | Number | Display priority (higher = first) |
| isActive | Boolean | Active status |
| views | Number | Total view count |
| clicks | Number | Total click count |

## Broadcaster Flow

1. **Creation**:
   - Admin/User creates broadcaster
   - Sets content, dates, and priority
   - Broadcaster becomes active

2. **Display**:
   - Active broadcasters fetched via `/active`
   - Displayed based on priority
   - Views tracked automatically

3. **Interaction**:
   - User clicks broadcaster
   - Click tracked
   - User redirected to link URL

4. **Analytics**:
   - Views and clicks aggregated
   - CTR (Click-Through Rate) calculated
   - Performance statistics available

## Use Cases

- **Promotional Banners**: Display promotional content
- **Announcements**: Platform-wide announcements
- **Advertising**: Partner advertisements
- **Feature Highlights**: Highlight new features
- **Seasonal Campaigns**: Holiday promotions

## Related Features
- Announcements
- Ads
- Analytics

