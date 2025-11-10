# Activity Feature

## Overview

The Activity feature provides comprehensive activity tracking and social engagement functionality for the LocalPro Super App. This feature enables real-time activity monitoring, social interactions, analytics, and user engagement tracking across all platform features.

## Key Features

- **Activity Tracking**: Comprehensive tracking of user actions across all platform features
- **Social Feed**: Real-time activity feed with filtering and personalization
- **Engagement Analytics**: Detailed analytics on user interactions and engagement patterns
- **Social Interactions**: Like, share, comment, and bookmark functionality for activities
- **Privacy Controls**: Granular visibility settings for activity sharing
- **Real-time Updates**: Live activity updates and notifications
- **Analytics Dashboard**: Comprehensive activity statistics and insights
- **Content Discovery**: Activity-based content discovery and recommendations

## Documentation Structure

This feature documentation is organized into the following sections:

- **[Data Entities](data-entities.md)** - Detailed schema documentation for Activity model
- **[API Endpoints](api-endpoints.md)** - Complete API reference with request/response examples
- **[Usage Examples](usage-examples.md)** - Practical implementation examples and code snippets
- **[Best Practices](best-practices.md)** - Development guidelines and recommended patterns

## Quick Start

### Activity Feed
```javascript
// Get activity feed
const response = await fetch('/api/activities/feed?page=1&limit=20&timeframe=7d', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Create Activity
```javascript
// Create a new activity
const response = await fetch('/api/activities', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'service_created',
    action: 'Created new service',
    description: 'John Doe created a new cleaning service',
    targetEntity: {
      type: 'service',
      id: '60f7b3b3b3b3b3b3b3b3b3b3',
      name: 'Professional Cleaning Service'
    },
    visibility: 'public',
    impact: 'medium'
  })
});
```

### Add Interaction
```javascript
// Like an activity
const response = await fetch('/api/activities/:activityId/interactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'like',
    metadata: { source: 'mobile_app' }
  })
});
```

## Activity Types

### Authentication & Profile
- **user_login**: User login events
- **user_logout**: User logout events
- **user_register**: User registration events
- **profile_update**: Profile update events
- **avatar_upload**: Avatar upload events
- **password_change**: Password change events
- **email_verification**: Email verification events
- **phone_verification**: Phone verification events

### Marketplace Activities
- **service_created**: Service creation events
- **service_updated**: Service update events
- **service_deleted**: Service deletion events
- **service_published**: Service publication events
- **service_viewed**: Service view events
- **service_favorited**: Service favorite events
- **service_shared**: Service share events
- **booking_created**: Booking creation events
- **booking_accepted**: Booking acceptance events
- **booking_rejected**: Booking rejection events
- **booking_completed**: Booking completion events
- **booking_cancelled**: Booking cancellation events
- **booking_rescheduled**: Booking rescheduling events
- **review_created**: Review creation events
- **review_updated**: Review update events
- **review_deleted**: Review deletion events

### Job Board Activities
- **job_created**: Job creation events
- **job_updated**: Job update events
- **job_deleted**: Job deletion events
- **job_published**: Job publication events
- **job_closed**: Job closure events
- **job_applied**: Job application events
- **job_application_withdrawn**: Job application withdrawal events
- **job_application_approved**: Job application approval events
- **job_application_rejected**: Job application rejection events
- **job_application_shortlisted**: Job application shortlisting events

### Academy Activities
- **course_created**: Course creation events
- **course_updated**: Course update events
- **course_deleted**: Course deletion events
- **course_published**: Course publication events
- **course_enrolled**: Course enrollment events
- **course_completed**: Course completion events
- **course_progress_updated**: Course progress update events
- **course_review_created**: Course review creation events
- **certificate_earned**: Certificate earning events

### Financial Activities
- **payment_made**: Payment made events
- **payment_received**: Payment received events
- **payment_failed**: Payment failure events
- **payment_refunded**: Payment refund events
- **withdrawal_requested**: Withdrawal request events
- **withdrawal_approved**: Withdrawal approval events
- **withdrawal_rejected**: Withdrawal rejection events
- **invoice_created**: Invoice creation events
- **invoice_paid**: Invoice payment events
- **invoice_overdue**: Invoice overdue events

### Communication Activities
- **message_sent**: Message sending events
- **message_received**: Message receiving events
- **conversation_started**: Conversation initiation events
- **notification_sent**: Notification sending events
- **notification_read**: Notification reading events
- **email_sent**: Email sending events

### Agency Activities
- **agency_joined**: Agency joining events
- **agency_left**: Agency leaving events
- **agency_created**: Agency creation events
- **agency_updated**: Agency update events
- **provider_added**: Provider addition events
- **provider_removed**: Provider removal events
- **provider_status_updated**: Provider status update events

### Referral Activities
- **referral_sent**: Referral sending events
- **referral_accepted**: Referral acceptance events
- **referral_completed**: Referral completion events
- **referral_reward_earned**: Referral reward earning events
- **referral_invitation_sent**: Referral invitation sending events

### Trust & Verification
- **verification_requested**: Verification request events
- **verification_approved**: Verification approval events
- **verification_rejected**: Verification rejection events
- **document_uploaded**: Document upload events
- **document_verified**: Document verification events
- **badge_earned**: Badge earning events

### Supply & Rental Activities
- **supply_created**: Supply creation events
- **supply_ordered**: Supply ordering events
- **supply_delivered**: Supply delivery events
- **supply_reviewed**: Supply review events
- **rental_created**: Rental creation events
- **rental_booked**: Rental booking events
- **rental_returned**: Rental return events
- **rental_reviewed**: Rental review events

### Advertisement Activities
- **ad_created**: Advertisement creation events
- **ad_updated**: Advertisement update events
- **ad_published**: Advertisement publication events
- **ad_clicked**: Advertisement click events
- **ad_promoted**: Advertisement promotion events

### System Activities
- **settings_updated**: Settings update events
- **preferences_changed**: Preference change events
- **subscription_created**: Subscription creation events
- **subscription_cancelled**: Subscription cancellation events
- **subscription_renewed**: Subscription renewal events

### Social Activities
- **connection_made**: Connection establishment events
- **connection_removed**: Connection removal events
- **follow_started**: Follow initiation events
- **follow_stopped**: Follow cessation events
- **content_liked**: Content liking events
- **content_shared**: Content sharing events
- **content_commented**: Content commenting events

### Other Activities
- **search_performed**: Search execution events
- **filter_applied**: Filter application events
- **export_requested**: Export request events
- **report_generated**: Report generation events

## Activity Categories

### Authentication
- User authentication and account management activities
- Login, logout, registration, and verification events

### Profile
- User profile management activities
- Profile updates, avatar changes, and personal information modifications

### Marketplace
- Service marketplace activities
- Service creation, booking, and review management

### Job Board
- Job posting and application activities
- Job management and application tracking

### Academy
- Learning and education activities
- Course enrollment, completion, and certification

### Financial
- Payment and financial transaction activities
- Payment processing, withdrawals, and invoicing

### Communication
- Messaging and notification activities
- Communication management and delivery

### Agency
- Agency management activities
- Provider management and agency operations

### Referral
- Referral program activities
- Referral tracking and reward management

### Verification
- Trust and verification activities
- Document verification and badge management

### Supplies
- Supply marketplace activities
- Product ordering and delivery management

### Rentals
- Equipment rental activities
- Rental booking and return management

### Advertising
- Advertisement management activities
- Ad creation, promotion, and tracking

### System
- System configuration activities
- Settings and preference management

### Social
- Social interaction activities
- Connections, follows, and content engagement

### Other
- Miscellaneous activities
- Search, filtering, and reporting activities

## Key Benefits

1. **Real-time Tracking**: Comprehensive real-time activity monitoring across all features
2. **Social Engagement**: Rich social interaction capabilities with likes, shares, and comments
3. **Analytics Insights**: Detailed analytics and insights into user behavior and engagement
4. **Privacy Control**: Granular privacy settings for activity sharing and visibility
5. **Content Discovery**: Activity-based content discovery and recommendation system
6. **Performance Monitoring**: Activity-based performance and engagement metrics
7. **User Engagement**: Enhanced user engagement through social features and gamification
8. **Data Insights**: Valuable data insights for product improvement and user experience optimization

## Integration Points

- **User Management**: Integration with user profiles and authentication
- **All Platform Features**: Activity tracking across all platform features
- **Analytics System**: Integration with analytics and reporting systems
- **Notification System**: Activity-based notification triggers
- **Social Features**: Integration with social networking capabilities
- **Content Management**: Activity-based content organization and discovery
- **Gamification**: Points and rewards system integration
- **Privacy Controls**: Integration with user privacy and visibility settings

## Getting Started

1. Review the [Data Entities](data-entities.md) documentation to understand the activity data structure
2. Check the [API Endpoints](api-endpoints.md) for available operations
3. Use the [Usage Examples](usage-examples.md) for implementation guidance
4. Follow the [Best Practices](best-practices.md) for optimal implementation

For more detailed information, explore the individual documentation files in this directory.
