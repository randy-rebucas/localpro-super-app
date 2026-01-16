# [1.4.0] - 2026-01-16

### Added
- **Activities API** module for activity feed, stats, and interactions:
  - Activity feed and timeline
  - User and global stats
  - Activity creation, update, deletion
  - Interactions (add/remove)
  - Leaderboard and points
- **Ads API** module for ads management:
  - List, create, update, delete ads
  - Categories, featured, enum values
  - Image uploads and analytics
  - Ad promotion, approval, rejection
  - My ads and pending ads
- **Agencies API** module for agency management:
  - List, create, update, delete agencies
  - Provider and admin management
  - Agency analytics
  - Logo uploads
  - Join/leave agency
- **Partners API** module for partner management:
  - List, create, update, delete partners
  - Partner analytics

# Changelog

All notable changes to the LocalPro SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-12-31

### Added
- **Referrals API** module for referral system:
  - Referral code validation and tracking
  - Referral links and statistics
  - Rewards management
  - Leaderboard
  - Invitation system
  - Analytics (Admin)
- **Communication API** module for messaging:
  - Conversation management
  - Message sending and receiving
  - File attachments support
  - Unread count tracking
  - Conversation search
  - Notification management
- **Settings API** module for settings management:
  - User settings (privacy, notifications, communication, etc.)
  - App settings (Admin)
  - Feature flags (Admin)
  - Settings categories
  - App health status
- **Notifications API** module for push notifications:
  - Notification management
  - FCM token registration
  - Notification settings
  - Bulk notifications (Admin)
  - System announcements (Admin)
  - Test notifications

## [1.2.0] - 2025-12-31

### Added
- **Supplies API** module for equipment and supplies marketplace:
  - Supply listings and search
  - Supply management (create, update, delete)
  - Image uploads
  - Order management
  - Reviews and ratings
  - AI-powered description generation
- **Rentals API** module for equipment rentals:
  - Rental item listings and search
  - Rental management (create, update, delete)
  - Booking management
  - Reviews and ratings
  - AI-powered description generation
- **Search API** module for global search:
  - Global search across all entities
  - Search suggestions and autocomplete
  - Popular and trending searches
  - Advanced search with filters
  - Entity-specific search
  - Search categories and locations
  - Search analytics tracking

## [1.1.0] - 2025-12-31

### Added
- **Auth API** module with comprehensive authentication:
  - User registration and login
  - Email and SMS verification
  - Profile management
  - Token refresh
  - Avatar and portfolio uploads
  - Onboarding completion
- **Finance API** module for financial operations:
  - Financial overview and analytics
  - Transactions, earnings, and expenses
  - Withdrawal requests and processing
  - Top-up requests
  - Tax documents
  - Financial reports
  - Wallet settings
- **Maps API** module for location services:
  - Geocoding and reverse geocoding
  - Places search and details
  - Distance calculations
  - Nearby places search
  - Service area validation
  - Coverage analysis

## [1.0.0] - 2025-12-31

### Added
- Initial release of LocalPro SDK
- Base HTTP client with API key authentication
- Escrow API module with full CRUD operations:
  - Create escrow with payment hold
  - Get escrow details
  - List escrows with filtering
  - Capture payment
  - Refund payment
  - Upload proof of work
  - Initiate disputes
  - Request payouts
  - Get transaction history
  - Get payout details
- Comprehensive error handling with custom error classes
- TypeScript-ready error types
- Example usage files
- Complete documentation

### Features
- API key and secret authentication
- Automatic error handling and type conversion
- Request/response interceptors
- Configurable base URL and timeout
- Support for file uploads (multipart/form-data)
- Pagination support for list endpoints
