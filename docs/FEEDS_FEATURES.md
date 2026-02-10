# Features Appropriate for the Feeds Page

This document lists features and content types in the LocalPro Super App that are suitable to display on a user-facing Feeds page. The Feeds page is intended to surface relevant, engaging, and actionable updates for users, similar to an activity or news feed.

## Core Feed Content Types

### 1. Activities & Updates
- User activities (e.g., bookings, reviews, achievements)
- Platform-wide announcements
- Recent interactions (likes, comments, shares)
- Leaderboard and points updates

### 2. Jobs & Opportunities
- New job postings
- Featured jobs
- Application status updates
- Job recommendations

### 3. Marketplace Services
- Featured or trending services
- New service listings
- Promotions or discounts

### 4. Academy & Learning
- New or featured courses
- Course completion or certification achievements
- Academy announcements

### 5. Ads & Promotions
- Sponsored ads relevant to user interests
- Platform-wide promotions
- Featured suppliers or partners

### 6. Agencies & Providers
- Agency achievements or updates
- New agencies or providers in the area
- Provider milestones (e.g., ratings, completed jobs)

### 7. Supplies & Rentals
- New or featured supplies and equipment
- Rental availability updates
- Supply promotions

### 8. Referrals & Rewards
- Referral program updates
- Earned rewards or bonuses

### 9. Communication & Notifications
- Direct messages or important notifications
- System alerts (e.g., verification, payment reminders)

## Example Feed Items
- "John Doe completed a job in Plumbing."
- "New course available: Advanced Electrical Safety."
- "You earned 50 points for a completed booking!"
- "Featured: 20% off on cleaning supplies this week."
- "Agency ABC reached 100 completed jobs."
- "New job posted: Office Cleaning in Makati."

## Data Sources & APIs
- Activities API (`/api/activities`, `client.activities.getFeed`)
- Jobs API (`/api/jobs`, `client.jobs.list`)
- Marketplace API (`/api/marketplace`, `client.marketplace.list`)
- Academy API (`/api/academy`, `client.academy.list`)
- Ads API (`/api/ads`, `client.ads.list`)
- Agencies API (`/api/agencies`, `client.agencies.list`)
- Supplies API (`/api/supplies`, `client.supplies.list`)
- Rentals API (`/api/rentals`, `client.rentals.list`)
- Referrals API (`/api/referrals`, `client.referrals.list`)
- Notifications API (`/api/notifications`, `client.notifications.list`)

## Best Practices
- Personalize feed content based on user role, location, and interests.
- Mix actionable items (e.g., job applications) with informative updates (e.g., achievements).
- Support filtering and sorting (e.g., by type, date, relevance).
- Highlight featured, trending, or urgent items.

## References
- See [KNOWLEDGE_BASE.md](KNOWLEDGE_BASE.md) and [API_REFERENCE.md](API_REFERENCE.md) for detailed API and feature descriptions.
- For feed UI/UX, refer to platform design guidelines.

---

## Suggested Feeds Page Layout

### 1. Header
- App logo and navigation
- User profile summary (avatar, name, notifications icon)

### 2. Filters & Actions
- Tabs or dropdowns to filter by content type (All, Jobs, Activities, Courses, etc.)
- Search bar for quick filtering
- Sort options (e.g., Recent, Trending, Recommended)

### 3. Main Feed Content
- **Feed List**: Vertical scrollable list of feed items
	- Each item styled as a card or tile
	- Item types visually distinguished (icon, color, badge)
- **Feed Item Components:**
	- Title/summary
	- Description or snippet
	- Associated user or entity (avatar, name, role)
	- Timestamp
	- Action buttons (e.g., Apply, View, Like, Share)
	- Media (optional: image, video, badge)

### 4. Sidebar (optional)
- Quick links (e.g., Post a Job, Enroll in Course)
- Trending tags or categories
- Featured ads or promotions

### 5. Footer
- App links, support, terms, etc.

### Example Wireframe

```
---------------------------------------------------
| Logo | Home | Jobs | Academy | ... | [Avatar] [🔔]|
---------------------------------------------------
| [Filter Tabs]   [Search]   [Sort Dropdown]      |
---------------------------------------------------
| [Feed Item Card]                                 |
| [Feed Item Card]                                 |
| [Feed Item Card]                                 |
| ...                                             |
---------------------------------------------------
| [Sidebar: Quick Links | Trending | Ads]          |
---------------------------------------------------
| Footer: About | Support | Terms                  |
---------------------------------------------------
```

---
