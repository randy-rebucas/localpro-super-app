# Data Entities Documentation

This directory contains comprehensive documentation for all data entities used in the LocalPro Super App API, organized by feature.

## Overview

The LocalPro Super App uses MongoDB with Mongoose for data modeling. Each entity is carefully designed to support the application's features while maintaining data integrity and performance.

## Documentation Structure

This documentation is organized by feature for better maintainability and easier navigation:

```
Data Entities/
├── features/
│   ├── ads/                    # Advertising feature
│   │   ├── README.md          # Feature overview
│   │   ├── data-entities.md   # Data model documentation
│   │   ├── api-endpoints.md   # API endpoints and responses
│   │   ├── usage-examples.md  # Implementation examples
│   │   └── best-practices.md  # Development guidelines
│   ├── rentals/               # Equipment rentals feature
│   │   ├── README.md          # Feature overview
│   │   ├── data-entities.md   # Data model documentation
│   │   ├── api-endpoints.md   # API endpoints and responses
│   │   ├── usage-examples.md  # Implementation examples
│   │   └── best-practices.md  # Development guidelines
│   ├── supplies/              # Supplies marketplace feature
│   │   ├── README.md          # Feature overview
│   │   ├── data-entities.md   # Data model documentation
│   │   ├── api-endpoints.md   # API endpoints and responses
│   │   ├── usage-examples.md  # Implementation examples
│   │   └── best-practices.md  # Development guidelines
│   ├── bookings/              # Service bookings feature
│   │   ├── README.md          # Feature overview
│   │   ├── data-entities.md   # Data model documentation
│   │   ├── api-endpoints.md   # API endpoints and responses
│   │   ├── usage-examples.md  # Implementation examples
│   │   └── best-practices.md  # Development guidelines
│   ├── courses/               # Learning academy feature
│   │   ├── README.md          # Feature overview
│   │   ├── data-entities.md   # Data model documentation
│   │   ├── api-endpoints.md   # API endpoints and responses
│   │   ├── usage-examples.md  # Implementation examples
│   │   └── best-practices.md  # Development guidelines
│   ├── services/              # Marketplace services feature
│   │   ├── README.md          # Feature overview
│   │   ├── data-entities.md   # Data model documentation
│   │   ├── api-endpoints.md   # API endpoints and responses
│   │   ├── usage-examples.md  # Implementation examples
│   │   └── best-practices.md  # Development guidelines
│   ├── providers/             # Provider profiles & management
│   │   ├── README.md          # Feature overview
│   │   ├── data-entities.md   # Data model documentation
│   │   ├── api-endpoints.md   # API endpoints and responses
│   │   ├── usage-examples.md  # Implementation examples
│   │   └── best-practices.md  # Development guidelines
│   ├── trust-verification/    # Verification requests, disputes, trust score
│   │   ├── README.md          # Feature overview
│   │   ├── data-entities.md   # Data model documentation
│   │   ├── api-endpoints.md   # API endpoints and responses
│   │   ├── usage-examples.md  # Implementation examples
│   │   └── best-practices.md  # Development guidelines
│   ├── referrals/             # Referral program
│   │   ├── README.md          # Feature overview
│   │   ├── data-entities.md   # Data model documentation
│   │   ├── api-endpoints.md   # API endpoints and responses
│   │   ├── usage-examples.md  # Implementation examples
│   │   └── best-practices.md  # Development guidelines
│   ├── providers/             # Provider profiles & management
│   │   ├── README.md          # Feature overview
│   │   ├── data-entities.md   # Data model documentation
│   │   ├── api-endpoints.md   # API endpoints and responses
│   │   ├── usage-examples.md  # Implementation examples
│   │   └── best-practices.md  # Development guidelines
    │   ├── user-settings/         # User settings feature
    │   │   ├── README.md          # Feature overview
    │   │   ├── data-entities.md   # Data model documentation
    │   │   ├── api-endpoints.md   # API endpoints and responses
    │   │   ├── usage-examples.md  # Implementation examples
    │   │   └── best-practices.md  # Development guidelines
    │   ├── users/                 # User management feature
    │   │   ├── README.md          # Feature overview
    │   │   ├── data-entities.md   # Data model documentation
    │   │   ├── api-endpoints.md   # API endpoints and responses
    │   │   ├── usage-examples.md  # Implementation examples
    │   │   └── best-practices.md  # Development guidelines
    │   ├── academy/               # Academy feature
    │   │   ├── README.md          # Feature overview
    │   │   ├── data-entities.md   # Data model documentation
    │   │   ├── api-endpoints.md   # API endpoints and responses
    │   │   ├── usage-examples.md  # Implementation examples
    │   │   └── best-practices.md  # Development guidelines
    │   ├── activity/              # Activity feature
    │   │   ├── README.md          # Feature overview
    │   │   ├── data-entities.md   # Data model documentation
    │   │   ├── api-endpoints.md   # API endpoints and responses
    │   │   ├── usage-examples.md  # Implementation examples
    │   │   └── best-practices.md  # Development guidelines
    │   └── analytics/             # Analytics feature
    │       ├── README.md          # Feature overview
    │       ├── data-entities.md   # Data model documentation
    │       ├── api-endpoints.md   # API endpoints and responses
    │       ├── usage-examples.md  # Implementation examples
    │       └── best-practices.md  # Development guidelines
    │   └── agencies/              # Agencies feature
    │       ├── README.md          # Feature overview
    │       ├── data-entities.md   # Data model documentation
    │       ├── api-endpoints.md   # API endpoints and responses
    │       ├── usage-examples.md  # Implementation examples
    │       └── best-practices.md  # Development guidelines
    │   ├── announcements/         # Announcements feature
    │   │   ├── README.md          # Feature overview
    │   │   ├── data-entities.md   # Data model documentation
    │   │   ├── api-endpoints.md   # API endpoints and responses
    │   │   ├── usage-examples.md  # Implementation examples
    │   │   └── best-practices.md  # Development guidelines
    │   ├── app-settings/          # App settings feature
    │   │   ├── README.md          # Feature overview
    │   │   ├── data-entities.md   # Data model documentation
    │   │   ├── api-endpoints.md   # API endpoints and responses
    │   │   ├── usage-examples.md  # Implementation examples
    │   │   └── best-practices.md  # Development guidelines
    │   ├── communication/         # Conversations, messages, notifications
    │   │   ├── README.md          # Feature overview
    │   │   ├── data-entities.md   # Data model documentation
    │   │   ├── api-endpoints.md   # API endpoints and responses
    │   │   ├── usage-examples.md  # Implementation examples
    │   │   └── best-practices.md  # Development guidelines
    │   ├── facility-care/         # Facility care services, contracts, subscriptions
    │   │   ├── README.md          # Feature overview
    │   │   ├── data-entities.md   # Data model documentation
    │   │   ├── api-endpoints.md   # API endpoints and responses
    │   │   ├── usage-examples.md  # Implementation examples
    │   │   └── best-practices.md  # Development guidelines
    │   ├── finance/               # Loans, salary advance, wallet & transactions
    │   │   ├── README.md          # Feature overview
    │   │   ├── data-entities.md   # Data model documentation
    │   │   ├── api-endpoints.md   # API endpoints and responses
    │   │   ├── usage-examples.md  # Implementation examples
    │   │   └── best-practices.md  # Development guidelines
    │   ├── jobs/                  # Job board feature
    │   │   ├── README.md          # Feature overview
    │   │   ├── data-entities.md   # Data model documentation
    │   │   ├── api-endpoints.md   # API endpoints and responses
    │   │   ├── usage-examples.md  # Implementation examples
    │   │   └── best-practices.md  # Development guidelines
    │   ├── subscriptions/         # LocalPro Plus subscriptions
    │   │   ├── README.md          # Feature overview
    │   │   ├── data-entities.md   # Data model documentation
    │   │   ├── api-endpoints.md   # API endpoints and responses
    │   │   ├── usage-examples.md  # Implementation examples
    │   │   └── best-practices.md  # Development guidelines
    │   ├── logs/                  # Logging & monitoring
    │   │   ├── README.md          # Feature overview
    │   │   ├── data-entities.md   # Data model documentation
    │   │   ├── api-endpoints.md   # API endpoints and responses
    │   │   ├── usage-examples.md  # Implementation examples
    │   │   └── best-practices.md  # Development guidelines
```

## Available Features

### 🎯 Advertising System
- **Location**: `features/ads/`
- **Description**: Complete advertising platform with campaign management, targeting, and analytics
- **Entities**: Advertisers, Ad Campaigns, Ad Impressions
- **Key Features**: Campaign creation, performance tracking, featured ads, location targeting

### 🔧 Equipment Rentals
- **Location**: `features/rentals/`
- **Description**: Equipment rental marketplace with booking management and geospatial search
- **Entities**: RentalItem, Rental, Bookings, Reviews
- **Key Features**: Equipment listing, booking system, location-based search, review system

### 📦 Supplies Marketplace
- **Location**: `features/supplies/`
- **Description**: Comprehensive e-commerce platform for equipment, tools, materials, and cleaning supplies
- **Entities**: Product, SubscriptionKit, Order
- **Key Features**: Product catalog, inventory management, order processing, subscription kits, review system

### 📅 Service Bookings
- **Location**: `features/bookings/`
- **Description**: Comprehensive service booking and management system with payment processing
- **Entities**: Service, Booking
- **Key Features**: Service discovery, booking management, payment integration, review system, communication tools

### 🎓 Learning Academy
- **Location**: `features/courses/`
- **Description**: Comprehensive online learning platform with course management, enrollment tracking, and certification issuance
- **Entities**: Course, Enrollment, Certification
- **Key Features**: Course catalog, structured curriculum, progress tracking, certification programs, instructor tools

### 🛠️ Service Marketplace
- **Location**: `features/services/`
- **Description**: Comprehensive service marketplace platform with advanced search, booking management, and payment processing
- **Entities**: Service, Booking
- **Key Features**: Service discovery, location-based search, booking system, payment integration, review system, provider dashboard

### 🧑‍🔧 Providers
- **Location**: `features/providers/`
- **Description**: Provider profiles with onboarding, verification, preferences, performance, and admin workflow
- **Entities**: Provider
- **Key Features**: Profile creation/update, onboarding steps, document uploads, dashboard, performance analytics, admin status management

### 🤝 Referrals
- **Location**: `features/referrals/`
- **Description**: End-to-end referral program with links/codes, tracking, rewards, and analytics
- **Entities**: Referral
- **Key Features**: Code validation, click tracking, invitations, user stats/links, rewards history, admin processing, analytics

### 🛡️ Trust & Verification
- **Location**: `features/trust-verification/`
- **Description**: Manage verification requests and documents, resolve disputes, and compute user trust score
- **Entities**: VerificationRequest, Dispute, TrustScore
- **Key Features**: Request create/update/review, document upload/delete, verified users list, admin statistics; trust score model and methods

### ⚙️ User Settings
- **Location**: `features/user-settings/`
- **Description**: Comprehensive personalization and configuration management system for users and administrators
- **Entities**: UserSettings, AppSettings
- **Key Features**: Privacy controls, notification management, communication preferences, service configuration, payment settings, security controls, app customization, analytics controls

### 👥 User Management
- **Location**: `features/users/`
- **Description**: Comprehensive user management system with authentication, profile management, and role-based access control
- **Entities**: User
- **Key Features**: Phone-based authentication, multi-level verification, trust scoring, agency management, referral system, activity tracking, status management

### 🎓 Academy
- **Location**: `features/academy/`
- **Description**: Comprehensive online learning platform with course management, enrollment tracking, and certification issuance
- **Entities**: Course, Enrollment, Certification
- **Key Features**: Course creation and management, student enrollment, progress tracking, certification programs, content management, instructor tools, review system

### 📊 Activity
- **Location**: `features/activity/`
- **Description**: Comprehensive activity tracking and social engagement system with real-time monitoring and analytics
- **Entities**: Activity
- **Key Features**: Activity tracking, social feed, engagement analytics, social interactions, privacy controls, real-time updates, content discovery

### 📊 Analytics
- **Location**: `features/analytics/`
- **Description**: Event tracking and insights across users, services, and the platform
- **Entities**: AnalyticsEvent, UserAnalytics, ServiceAnalytics, PlatformAnalytics
- **Key Features**: Event tracking, user analytics, marketplace analytics, platform KPIs, admin custom queries

### 🏢 Agencies
- **Location**: `features/agencies/`
- **Description**: Comprehensive agency management system with provider management, administrative controls, and business analytics
- **Entities**: Agency
- **Key Features**: Agency management, provider onboarding, administrative controls, service area management, business information, performance analytics, commission management, verification system

### 📣 Announcements
- **Location**: `features/announcements/`
- **Description**: Platform announcements with targeting, scheduling, acknowledgments, and comments
- **Entities**: Announcement
- **Key Features**: Targeted delivery, lifecycle (draft/scheduled/published/archived), sticky posts, acknowledgments, comments, analytics

### 🔄 Additional Features (Coming Soon)
- **Financial System** - Payments, subscriptions, and billing
- **Analytics** - Performance tracking and reporting

### 🛠️ App Settings
- **Location**: `features/app-settings/`
- **Description**: Centralized, admin-managed platform configuration with public bootstrap and health
- **Entities**: AppSettings
- **Key Features**: Feature flags, maintenance mode, force updates, security policies, uploads, notifications, payments, analytics, integrations

### 💬 Communication
- **Location**: `features/communication/`
- **Description**: In-app conversations, messaging, and notifications across modules
- **Entities**: Conversation, Message, Notification
- **Key Features**: Participant roles, context links, read receipts, attachments, reactions, in-app/Email/SMS/Push notifications

### 🏢 Facility Care
- **Location**: `features/facility-care/`
- **Description**: Managed facility services with contracts and recurring subscriptions
- **Entities**: FacilityCareService, Contract, Subscription
- **Key Features**: Service catalog, availability, contract terms/pricing/KPIs, recurring plans, schedules, payment history

### 💸 Finance
- **Location**: `features/finance/`
- **Description**: Loans, salary advances, wallet balances, transactions, withdrawals, and reports
- **Entities**: Loan, SalaryAdvance, Transaction, Finance
- **Key Features**: Loan lifecycle, salary advance flow, transaction history, withdrawals, wallet settings, financial reports

### 💼 Jobs
- **Location**: `features/jobs/`
- **Description**: Rich job postings with employer tools, applications, and search
- **Entities**: Job (with embedded applications)
- **Key Features**: Advanced filters, employer management, resume uploads, interview scheduling, stats

### 🔔 Subscriptions (LocalPro Plus)
- **Location**: `features/subscriptions/`
- **Description**: Plans, user subscriptions, payments, and feature usage with limits
- **Entities**: SubscriptionPlan, UserSubscription, Payment, FeatureUsage
- **Key Features**: Plan CRUD (admin), subscribe/renew/cancel, payment confirmations, usage tracking and analytics

### 📝 Logs
- **Location**: `features/logs/`
- **Description**: Centralized application logging with admin analytics, export, and retention
- **Entities**: Log
- **Key Features**: Filtered queries, stats, error trends, performance metrics, user activity, export, cleanup/flush

## Data Modeling Principles

1. **Consistency** - All entities follow consistent naming and structure patterns
2. **Validation** - Comprehensive field validation using Mongoose schemas
3. **Relationships** - Proper referencing between related entities
4. **Indexing** - Strategic database indexing for optimal performance
5. **Timestamps** - Automatic creation and update timestamps
6. **Soft Deletes** - Logical deletion using `isActive` flags

## API Standards

All API endpoints follow RESTful conventions and return standardized response formats:

```javascript
// Success Response
{
  "success": true,
  "data": Object | Array,
  "message": String, // Optional
  "count": Number,   // For list endpoints
  "total": Number,   // For paginated endpoints
  "page": Number,    // For paginated endpoints
  "pages": Number    // For paginated endpoints
}

// Error Response
{
  "success": false,
  "message": String,
  "errors": Array    // Optional validation errors
}
```

## Getting Started

1. Review the specific entity documentation for your use case
2. Check the API response structure for expected data formats
3. Refer to usage examples for implementation guidance
4. Follow the established patterns for consistency

## Contributing

When adding new entities or modifying existing ones:

1. Update the relevant entity documentation
2. Ensure API response structure is maintained
3. Add usage examples for new features
4. Update this README if adding new entity categories
