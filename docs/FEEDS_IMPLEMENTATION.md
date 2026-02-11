# Feeds Feature Documentation

## Overview

The Feeds feature provides a unified, personalized content aggregation system for the LocalPro Super App. It aggregates content from multiple sources including jobs, services, courses, promos, agencies, supplies, rentals, rewards, and more into a single, cohesive feed experience.

## Features

- **Unified Feed**: Aggregates content from all major features into one feed
- **Personalization**: Delivers content based on user role, location, interests, and behavior
- **Real-time Content**: Combines stored feed items with real-time content
- **Trending & Featured**: Highlights trending and featured content
- **Engagement Tracking**: Tracks views, likes, shares, comments, and bookmarks
- **Content Filtering**: Filter by content type, category, timeframe
- **Multiple Sort Options**: Sort by relevance, recency, trending, or popularity
- **Promotion System**: Promote feed items with budget tracking
- **Analytics**: Comprehensive feed analytics and insights

## Architecture

### Models

#### Feed Model (`src/models/Feed.js`)
The main feed item model with the following key features:
- Content type and reference (polymorphic)
- Author/creator tracking
- Media and images support
- Visibility and targeting options
- Priority and featured flags
- Engagement analytics
- Promotion data
- Status management

### Services

#### Feed Service (`src/services/feedService.js`)
Core service for feed operations:
- `getAggregatedFeed(user, options)` - Get personalized feed with real-time content
- `getRealtimeContent(user, options)` - Fetch real-time content from various sources
- `getTrending(options)` - Get trending content
- `getFeatured(limit)` - Get featured content
- `createFeedItem(contentType, contentId, data)` - Create feed item
- `trackView(feedItemId, userId)` - Track view
- `trackInteraction(feedItemId, userId, type)` - Track interaction
- `getFeedAnalytics(userId, timeframe)` - Get analytics
- `autoGenerateFeedItem(contentType, content)` - Auto-generate feed items

### Controllers

#### Feed Controller (`src/controllers/feedController.js`)
Handles all feed-related HTTP requests:
- `getFeed` - Get personalized feed
- `getTrending` - Get trending items
- `getFeatured` - Get featured items
- `getFeedItem` - Get single feed item
- `createFeedItem` - Create feed item
- `updateFeedItem` - Update feed item
- `deleteFeedItem` - Delete feed item
- `addInteraction` - Add interaction
- `removeInteraction` - Remove interaction
- `getFeedAnalytics` - Get analytics
- `getFeedByType` - Get feed by content type
- `getMyFeedItems` - Get user's own feed items
- `promoteFeedItem` - Promote feed item

### Routes

#### Feed Routes (`src/routes/feeds.js`)
RESTful API endpoints:

**Public Routes:**
- `GET /api/feeds/trending` - Get trending content
- `GET /api/feeds/featured` - Get featured content

**Authenticated Routes:**
- `GET /api/feeds` - Get personalized feed
- `GET /api/feeds/my` - Get user's own feed items
- `GET /api/feeds/analytics` - Get feed analytics
- `GET /api/feeds/by-type/:contentType` - Get feed by content type
- `GET /api/feeds/:id` - Get single feed item
- `POST /api/feeds` - Create feed item
- `PUT /api/feeds/:id` - Update feed item
- `DELETE /api/feeds/:id` - Delete feed item
- `POST /api/feeds/:id/interactions` - Add interaction
- `DELETE /api/feeds/:id/interactions` - Remove interaction
- `POST /api/feeds/:id/promote` - Promote feed item (Admin only)

## API Usage

### Get Personalized Feed

```javascript
GET /api/feeds?page=1&limit=20&contentTypes=job,course&sortBy=relevance&timeframe=7d&includeRealtime=true
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `contentTypes` - Comma-separated list of content types
- `categories` - Comma-separated list of categories
- `timeframe` - Timeframe: 1h, 1d, 7d, 30d, 90d, all (default: 7d)
- `sortBy` - Sort option: relevance, recent, trending, popular (default: relevance)
- `includeRealtime` - Include real-time content (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "...",
        "contentType": "job",
        "contentId": "...",
        "author": {
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "...",
          "role": "client"
        },
        "title": "Hiring: Senior Plumber",
        "description": "...",
        "summary": "...",
        "category": "jobs",
        "media": { "type": "image", "url": "..." },
        "analytics": {
          "views": 150,
          "likes": 25,
          "shares": 5,
          "engagementRate": 0.2
        },
        "cta": {
          "text": "Apply Now",
          "type": "apply"
        },
        "publishedAt": "2026-02-11T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Trending Content

```javascript
GET /api/feeds/trending?limit=10&timeframe=24h
```

### Get Featured Content

```javascript
GET /api/feeds/featured?limit=5
```

### Get Feed by Content Type

```javascript
GET /api/feeds/by-type/job?page=1&limit=20
```

### Create Feed Item

```javascript
POST /api/feeds
Content-Type: application/json

{
  "contentType": "job",
  "contentId": "65abc123...",
  "title": "Hiring: Senior Plumber",
  "description": "We are looking for an experienced plumber...",
  "summary": "Join our team as a senior plumber",
  "category": "jobs",
  "visibility": "public",
  "priority": 10,
  "isFeatured": true,
  "cta": {
    "text": "Apply Now",
    "type": "apply"
  }
}
```

### Add Interaction

```javascript
POST /api/feeds/:id/interactions
Content-Type: application/json

{
  "type": "like"
}
```

**Interaction Types:**
- `like` - Like the feed item
- `share` - Share the feed item
- `comment` - Comment on the feed item
- `bookmark` - Bookmark the feed item
- `click` - Track click/view

## SDK Usage

### Initialize SDK

```javascript
const LocalPro = require('@localpro/sdk');

const client = new LocalPro({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  baseURL: 'https://api.localpro.com'
});
```

### Get Personalized Feed

```javascript
const feed = await client.feeds.getFeed({
  page: 1,
  limit: 20,
  contentTypes: 'job,course,promo',
  sortBy: 'relevance',
  timeframe: '7d',
  includeRealtime: true
});

console.log(feed.data.items);
```

### Get Trending Content

```javascript
const trending = await client.feeds.getTrending({
  limit: 10,
  timeframe: '24h'
});
```

### Get Feed by Content Type

```javascript
// Get jobs feed
const jobsFeed = await client.feeds.getJobs({
  page: 1,
  limit: 20
});

// Get courses feed
const coursesFeed = await client.feeds.getCourses({
  page: 1,
  limit: 20
});

// Or use the generic method
const promosFeed = await client.feeds.getByType('promo', {
  page: 1,
  limit: 20
});
```

### Interact with Feed Items

```javascript
// Like a feed item
await client.feeds.like(feedItemId);

// Unlike a feed item
await client.feeds.unlike(feedItemId);

// Share a feed item
await client.feeds.share(feedItemId);

// Bookmark a feed item
await client.feeds.bookmark(feedItemId);

// Remove bookmark
await client.feeds.removeBookmark(feedItemId);

// Track click
await client.feeds.trackClick(feedItemId);
```

### Create Feed Item

```javascript
const feedItem = await client.feeds.create({
  contentType: 'job',
  contentId: '65abc123...',
  title: 'Hiring: Senior Plumber',
  description: 'We are looking for an experienced plumber...',
  summary: 'Join our team as a senior plumber',
  category: 'jobs',
  visibility: 'public',
  priority: 10,
  isFeatured: true,
  cta: {
    text: 'Apply Now',
    type: 'apply'
  }
});
```

### Get Feed Analytics

```javascript
const analytics = await client.feeds.getAnalytics({
  timeframe: '30d'
});

console.log(analytics.data.analytics);
```

## Content Types

The feed supports the following content types:
- `activity` - User activities
- `job` - Job postings
- `service` - Marketplace services
- `course` - Academy courses
- `ad` - Advertisements
- `promo` - Promotional content
- `agency` - Agency updates
- `supply` - Supply products
- `rental` - Rental equipment
- `reward` - Rewards and referrals
- `referral` - Referral programs
- `announcement` - Platform announcements
- `achievement` - User achievements
- `milestone` - Milestones

## Visibility Levels

- `public` - Visible to all users
- `private` - Visible only to author
- `connections` - Visible to connections
- `followers` - Visible to followers
- `targeted` - Visible to targeted audience based on targeting rules

## Sort Options

- `relevance` - Sort by relevance (featured, priority, then recency)
- `recent` - Sort by most recent first
- `trending` - Sort by engagement rate
- `popular` - Sort by total views and likes

## Targeting

Feed items can be targeted to specific audiences using:
- **Roles**: Target specific user roles (client, provider, supplier, etc.)
- **Locations**: Target specific cities, states, countries with radius
- **Interests**: Target users with specific interests
- **Min Points**: Target users with minimum points
- **Verified**: Target only verified users

Example:
```javascript
{
  "targetAudience": {
    "roles": ["provider", "supplier"],
    "locations": [
      {
        "city": "Manila",
        "state": "Metro Manila",
        "country": "Philippines",
        "radius": 50
      }
    ],
    "interests": ["plumbing", "electrical"],
    "minPoints": 100,
    "verified": true
  }
}
```

## Auto-Generation

Feed items can be automatically generated when new content is created. Implement this in your content creation flow:

```javascript
const feedService = require('./services/feedService');

// After creating a job
const job = await Job.create(jobData);
await feedService.autoGenerateFeedItem('job', job);
```

## Best Practices

1. **Pagination**: Always use pagination for large feeds
2. **Filtering**: Use content type and category filters to improve relevance
3. **Caching**: Cache feed results on the client side with appropriate TTL
4. **Real-time Updates**: Implement WebSocket or polling for real-time feed updates
5. **Analytics**: Track user interactions to improve feed relevance
6. **Content Quality**: Ensure feed items have compelling titles and descriptions
7. **Media**: Include high-quality images and media when possible
8. **CTAs**: Provide clear call-to-action buttons
9. **Targeting**: Use targeting to show relevant content to specific users
10. **Performance**: Monitor feed performance and optimize queries

## Integration Examples

### Frontend Integration (React/Vue/Angular)

```javascript
// React example
import { useEffect, useState } from 'react';
import LocalPro from '@localpro/sdk';

function FeedComponent() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const client = new LocalPro({
      apiKey: process.env.API_KEY,
      apiSecret: process.env.API_SECRET
    });

    const loadFeed = async () => {
      try {
        const result = await client.feeds.getFeed({
          page,
          limit: 20,
          sortBy: 'relevance',
          timeframe: '7d'
        });
        
        setFeed(result.data.items);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load feed:', error);
      }
    };

    loadFeed();
  }, [page]);

  const handleLike = async (feedItemId) => {
    try {
      await client.feeds.like(feedItemId);
      // Update UI
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="feed">
      {feed.map(item => (
        <FeedItem 
          key={item._id} 
          item={item} 
          onLike={handleLike}
        />
      ))}
    </div>
  );
}
```

### Mobile Integration (React Native)

```javascript
import LocalPro from '@localpro/sdk';

const client = new LocalPro({
  apiKey: API_KEY,
  apiSecret: API_SECRET
});

// Get feed with infinite scroll
const loadMoreFeed = async (page) => {
  const result = await client.feeds.getFeed({
    page,
    limit: 20,
    includeRealtime: page === 1 // Only include realtime on first page
  });
  
  return result.data.items;
};

// Track interaction
const trackInteraction = async (feedItemId, type) => {
  await client.feeds.addInteraction(feedItemId, { type });
};
```

## Monitoring and Analytics

### Feed Performance Metrics

Monitor these metrics:
- Total feed items
- Average engagement rate
- Views per item
- Interactions per item
- Content type distribution
- User engagement patterns
- Popular content types
- Trending topics

### Get Analytics

```javascript
const analytics = await client.feeds.getAnalytics({
  timeframe: '30d'
});

console.log('Total Views:', analytics.data.analytics.totalViews);
console.log('Total Engagement:', analytics.data.analytics.totalEngagement);
console.log('By Content Type:', analytics.data.analytics.byContentType);
```

## Troubleshooting

### Feed Not Loading
- Check authentication token
- Verify API credentials
- Check network connectivity
- Review server logs

### Missing Content
- Verify content is published and not deleted
- Check visibility settings
- Review targeting rules
- Check timeframe filter

### Poor Performance
- Implement pagination
- Add caching layer
- Optimize database indexes
- Review database query performance

## Security Considerations

1. **Authentication**: All authenticated routes require valid JWT token
2. **Authorization**: Users can only update/delete their own feed items (except admins)
3. **Visibility**: Respect visibility settings and targeting rules
4. **Rate Limiting**: Implement rate limiting on feed endpoints
5. **Input Validation**: All inputs are validated using express-validator
6. **XSS Prevention**: Sanitize all user-generated content
7. **CSRF Protection**: Implement CSRF tokens for state-changing operations

## Future Enhancements

- [ ] Real-time feed updates via WebSocket
- [ ] Machine learning-based content recommendations
- [ ] A/B testing for feed algorithms
- [ ] User feed preferences and customization
- [ ] Advanced targeting with ML models
- [ ] Feed item scheduling
- [ ] Bulk feed operations
- [ ] Feed templates
- [ ] Video content support
- [ ] Stories/ephemeral content
- [ ] Feed moderation tools
- [ ] Content recommendation engine
- [ ] Social graph integration
- [ ] Cross-posting to multiple feeds

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact the development team
- Check the API documentation at `/api-docs`

## License

© 2026 LocalPro Super App. All rights reserved.
