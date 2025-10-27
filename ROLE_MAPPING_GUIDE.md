# Role-Based Access Control Mapping for LocalPro Super App API

## Role Definitions:
- **PUBLIC**: No authentication required
- **AUTHENTICATED**: Any authenticated user
- **ADMIN**: Admin role only
- **PROVIDER**: Provider role (can create services, jobs, etc.)
- **SUPPLIER**: Supplier role (can manage supplies)
- **INSTRUCTOR**: Instructor role (can create courses)
- **ADVERTISER**: Advertiser role (can create ads)
- **AGENCY_ADMIN**: Agency admin role
- **AGENCY_OWNER**: Agency owner role
- **CLIENT**: Client role (can book services, apply for jobs)

## Endpoint Role Mapping:

### Authentication Module
- Send Verification Code: PUBLIC
- Verify Code: PUBLIC
- Complete Onboarding: AUTHENTICATED
- Get Profile Completeness: AUTHENTICATED
- Get My Profile: AUTHENTICATED
- Update Profile: AUTHENTICATED
- Upload Avatar: AUTHENTICATED
- Upload Portfolio Images: AUTHENTICATED
- Logout: AUTHENTICATED

### Marketplace Module
- Get Services: PUBLIC
- Get Service Details: PUBLIC
- Get Nearby Services: PUBLIC
- Create Service: PROVIDER, ADMIN
- Update Service: PROVIDER, ADMIN
- Delete Service: PROVIDER, ADMIN
- Upload Service Images: PROVIDER, ADMIN
- Create Booking: AUTHENTICATED
- Get Bookings: AUTHENTICATED
- Update Booking Status: AUTHENTICATED
- Upload Booking Photos: AUTHENTICATED
- Add Review: AUTHENTICATED
- Approve PayPal Booking: AUTHENTICATED
- Get PayPal Order Details: AUTHENTICATED
- Get My Services: PROVIDER, ADMIN
- Get My Bookings: AUTHENTICATED

### Job Board Module
- Get Jobs: PUBLIC
- Get Job Details: PUBLIC
- Search Jobs: PUBLIC
- Create Job: PROVIDER, ADMIN
- Update Job: PROVIDER, ADMIN
- Delete Job: PROVIDER, ADMIN
- Apply for Job: AUTHENTICATED
- Get Job Applications: PROVIDER, ADMIN
- Update Application Status: PROVIDER, ADMIN
- Get My Applications: AUTHENTICATED
- Get My Jobs: PROVIDER, ADMIN
- Upload Company Logo: PROVIDER, ADMIN
- Get Job Stats: PROVIDER, ADMIN

### Academy Module
- Get Courses: PUBLIC
- Get Course Details: PUBLIC
- Get Course Categories: PUBLIC
- Get Featured Courses: PUBLIC
- Create Course: INSTRUCTOR, ADMIN
- Update Course: INSTRUCTOR, ADMIN
- Delete Course: INSTRUCTOR, ADMIN
- Upload Course Thumbnail: INSTRUCTOR, ADMIN
- Upload Course Video: INSTRUCTOR, ADMIN
- Delete Course Video: INSTRUCTOR, ADMIN
- Enroll in Course: AUTHENTICATED
- Update Course Progress: AUTHENTICATED
- Add Course Review: AUTHENTICATED
- Get My Courses: AUTHENTICATED
- Get My Created Courses: INSTRUCTOR, ADMIN
- Get Course Statistics: ADMIN

### Finance Module
- Get Financial Overview: AUTHENTICATED
- Get Transactions: AUTHENTICATED
- Get Earnings: AUTHENTICATED
- Get Expenses: AUTHENTICATED
- Request Withdrawal: AUTHENTICATED
- Process Withdrawal: ADMIN
- Get Tax Documents: AUTHENTICATED
- Generate Financial Report: AUTHENTICATED
- Update Wallet Settings: AUTHENTICATED

### Agency Module
- Get All Agencies: PUBLIC
- Get Agency Details: PUBLIC
- Create Agency: AUTHENTICATED
- Update Agency: AGENCY_OWNER, ADMIN
- Delete Agency: AGENCY_OWNER, ADMIN
- Upload Agency Logo: AGENCY_OWNER, ADMIN
- Add Provider: AGENCY_ADMIN, AGENCY_OWNER, ADMIN
- Remove Provider: AGENCY_ADMIN, AGENCY_OWNER, ADMIN
- Update Provider Status: AGENCY_ADMIN, AGENCY_OWNER, ADMIN
- Add Admin: AGENCY_OWNER, ADMIN
- Remove Admin: AGENCY_OWNER, ADMIN
- Get Agency Analytics: AGENCY_ADMIN, AGENCY_OWNER, ADMIN
- Get My Agencies: AUTHENTICATED
- Join Agency: AUTHENTICATED
- Leave Agency: AUTHENTICATED

### Supplies Module
- Get Supplies: PUBLIC
- Get Supply Details: PUBLIC
- Get Supply Categories: PUBLIC
- Get Featured Supplies: PUBLIC
- Get Nearby Supplies: PUBLIC
- Create Supply: SUPPLIER, ADMIN
- Update Supply: SUPPLIER, ADMIN
- Delete Supply: SUPPLIER, ADMIN
- Upload Supply Images: SUPPLIER, ADMIN
- Delete Supply Image: SUPPLIER, ADMIN
- Order Supply: AUTHENTICATED
- Update Order Status: SUPPLIER, ADMIN
- Add Supply Review: AUTHENTICATED
- Get My Supplies: SUPPLIER, ADMIN
- Get My Orders: AUTHENTICATED
- Get Supply Statistics: ADMIN

### Rentals Module
- Get Rental Items: PUBLIC
- Get Rental Details: PUBLIC
- Get Rental Categories: PUBLIC
- Get Featured Rentals: PUBLIC
- Get Nearby Rentals: PUBLIC
- Create Rental: PROVIDER, ADMIN
- Update Rental: PROVIDER, ADMIN
- Delete Rental: PROVIDER, ADMIN
- Upload Rental Images: PROVIDER, ADMIN
- Delete Rental Image: PROVIDER, ADMIN
- Book Rental: AUTHENTICATED
- Update Booking Status: PROVIDER, ADMIN
- Add Rental Review: AUTHENTICATED
- Get My Rentals: PROVIDER, ADMIN
- Get My Bookings: AUTHENTICATED
- Get Rental Statistics: ADMIN

### Advertising Module
- Get Ads: PUBLIC
- Get Ad Details: PUBLIC
- Get Ad Categories: PUBLIC
- Get Ad Enums: PUBLIC
- Get Featured Ads: PUBLIC
- Track Ad Click: PUBLIC
- Create Ad: ADVERTISER, ADMIN
- Update Ad: ADVERTISER, ADMIN
- Delete Ad: ADVERTISER, ADMIN
- Upload Ad Images: ADVERTISER, ADMIN
- Delete Ad Image: ADVERTISER, ADMIN
- Promote Ad: ADVERTISER, ADMIN
- Get My Ads: ADVERTISER, ADMIN
- Get Ad Analytics: ADVERTISER, ADMIN
- Get Ad Statistics: ADMIN

### Facility Care Module
- Get Services: PUBLIC
- Get Service Details: PUBLIC
- Get Nearby Services: PUBLIC
- Create Service: PROVIDER, ADMIN
- Update Service: PROVIDER, ADMIN
- Delete Service: PROVIDER, ADMIN
- Upload Service Images: PROVIDER, ADMIN
- Delete Service Image: PROVIDER, ADMIN
- Book Service: AUTHENTICATED
- Update Booking Status: PROVIDER, ADMIN
- Add Review: AUTHENTICATED
- Get My Services: PROVIDER, ADMIN
- Get My Bookings: AUTHENTICATED

### LocalPro Plus Module
- Get Plans: PUBLIC
- Create Plan: ADMIN
- Update Plan: ADMIN
- Delete Plan: ADMIN
- Subscribe to Plan: AUTHENTICATED
- Confirm Payment: AUTHENTICATED
- Cancel Subscription: AUTHENTICATED
- Renew Subscription: AUTHENTICATED
- Get My Subscriptions: AUTHENTICATED
- Update Settings: AUTHENTICATED
- Get Subscription Analytics: ADMIN

### Trust Verification Module
- Get Verified Users: PUBLIC
- Get Verification Requests: AUTHENTICATED
- Get Verification Request: AUTHENTICATED
- Create Verification Request: AUTHENTICATED
- Update Verification Request: AUTHENTICATED
- Delete Verification Request: AUTHENTICATED
- Upload Documents: AUTHENTICATED
- Delete Document: AUTHENTICATED
- Get My Requests: AUTHENTICATED
- Review Verification Request: ADMIN
- Get Verification Statistics: ADMIN

### Communication Module
- Get Conversations: AUTHENTICATED
- Create Conversation: AUTHENTICATED
- Delete Conversation: AUTHENTICATED
- Send Message: AUTHENTICATED
- Update Message: AUTHENTICATED
- Delete Message: AUTHENTICATED
- Mark as Read: AUTHENTICATED
- Get Notifications: AUTHENTICATED
- Get Notification Count: AUTHENTICATED
- Mark Notification as Read: AUTHENTICATED
- Delete Notification: AUTHENTICATED
- Send Email Notification: AUTHENTICATED
- Send SMS Notification: AUTHENTICATED
- Get Unread Counts: AUTHENTICATED
- Search Conversations: AUTHENTICATED

### Analytics Module
- Get Analytics Overview: AUTHENTICATED
- Get User Analytics: AUTHENTICATED
- Get Marketplace Analytics: AUTHENTICATED
- Get Job Analytics: AUTHENTICATED
- Get Referral Analytics: AUTHENTICATED
- Get Agency Analytics: AUTHENTICATED
- Track Event: AUTHENTICATED
- Get Custom Analytics: ADMIN

### Maps Module
- Geocode Address: PUBLIC
- Reverse Geocode: PUBLIC
- Search Places: PUBLIC
- Get Place Details: PUBLIC
- Calculate Distance: PUBLIC
- Get Nearby Places: PUBLIC
- Validate Service Area: PUBLIC
- Analyze Service Coverage: AUTHENTICATED
- Test Connection: ADMIN

### PayPal Module
- PayPal Webhook: PUBLIC
- Get Webhook Events: ADMIN

### PayMaya Module
- PayMaya Webhook: PUBLIC
- Create Checkout: AUTHENTICATED
- Get Checkout: AUTHENTICATED
- Create Payment: AUTHENTICATED
- Get Payment: AUTHENTICATED
- Create Invoice: AUTHENTICATED
- Get Invoice: AUTHENTICATED
- Validate Configuration: ADMIN
- Get Webhook Events: ADMIN

### Referrals Module
- Validate Referral Code: PUBLIC
- Track Referral Click: PUBLIC
- Get Leaderboard: PUBLIC
- Get My Referrals: AUTHENTICATED
- Get Referral Stats: AUTHENTICATED
- Get Referral Links: AUTHENTICATED
- Get Referral Rewards: AUTHENTICATED
- Invite User: AUTHENTICATED
- Update Referral Preferences: AUTHENTICATED
- Process Referral Completion: ADMIN
- Get Referral Analytics: ADMIN

### Settings Module
- Get User Settings: AUTHENTICATED
- Update User Settings: AUTHENTICATED
- Reset User Settings: AUTHENTICATED
- Delete User Settings: AUTHENTICATED
- Get App Settings: ADMIN
- Update App Settings: ADMIN
- Get Public App Settings: PUBLIC
- Get App Health: PUBLIC

### Provider Module
- Get All Providers: PUBLIC
- Get Provider Details: PUBLIC
- Get My Profile: AUTHENTICATED
- Create Provider Profile: AUTHENTICATED
- Update Provider Profile: AUTHENTICATED
- Complete Onboarding: AUTHENTICATED
- Upload Documents: AUTHENTICATED
- Get Dashboard: AUTHENTICATED
- Get Analytics: AUTHENTICATED
- Get All Providers (Admin): ADMIN
- Update Provider Status: ADMIN

### User Management Module
- Get All Users: ADMIN, AGENCY_ADMIN, AGENCY_OWNER
- Get User Stats: ADMIN, AGENCY_ADMIN, AGENCY_OWNER
- Get User Details: ADMIN, AGENCY_ADMIN, AGENCY_OWNER, PROVIDER, CLIENT
- Create User: ADMIN
- Update User: ADMIN, AGENCY_ADMIN, AGENCY_OWNER, PROVIDER, CLIENT
- Update User Status: ADMIN, AGENCY_ADMIN
- Update User Verification: ADMIN, AGENCY_ADMIN
- Add User Badge: ADMIN
- Bulk Update Users: ADMIN
- Delete User: ADMIN

### Search Module
- Global Search: PUBLIC
- Get Search Suggestions: PUBLIC
- Get Popular Searches: PUBLIC
- Advanced Search: PUBLIC
- Entity Search: PUBLIC
- Get Categories: PUBLIC
- Get Locations: PUBLIC
- Get Trending Searches: PUBLIC
- Track Search Analytics: ADMIN

### Announcements Module
- Get All Announcements: PUBLIC
- Get Announcement Details: PUBLIC
- Get My Announcements: AUTHENTICATED
- Create Announcement: ADMIN, AGENCY_ADMIN, AGENCY_OWNER
- Update Announcement: ADMIN, AGENCY_ADMIN, AGENCY_OWNER
- Delete Announcement: ADMIN, AGENCY_ADMIN, AGENCY_OWNER
- Acknowledge Announcement: AUTHENTICATED
- Add Comment: AUTHENTICATED
- Get Announcement Stats: ADMIN

### Activities Module
- Get Activity Feed: AUTHENTICATED
- Get My Activities: AUTHENTICATED
- Get User Activities: AUTHENTICATED
- Get Activity Details: AUTHENTICATED
- Create Activity: AUTHENTICATED
- Update Activity: AUTHENTICATED
- Delete Activity: AUTHENTICATED
- Add Interaction: AUTHENTICATED
- Remove Interaction: AUTHENTICATED
- Get User Activity Stats: AUTHENTICATED
- Get Activity Metadata: AUTHENTICATED
- Get Global Activity Stats: ADMIN

### Audit Logs Module
- Get Audit Logs: ADMIN
- Get Audit Statistics: ADMIN
- Get User Activity Summary: ADMIN
- Get Audit Log Details: ADMIN
- Export Audit Logs: ADMIN
- Get Dashboard Summary: ADMIN
- Cleanup Audit Logs: ADMIN
- Get Audit Metadata: ADMIN

### Error Monitoring Module
- Get Error Info: PUBLIC
- Get Error Statistics: ADMIN
- Get Unresolved Errors: ADMIN
- Get Error Details: ADMIN
- Resolve Error: ADMIN
- Get Dashboard Summary: ADMIN

### Logs Module
- Get Log Statistics: ADMIN
- Get Logs: ADMIN
- Get Log Details: ADMIN
- Get Error Trends: ADMIN
- Get Performance Metrics: ADMIN
- Get User Activity Logs: ADMIN
- Export Logs: ADMIN
- Get Dashboard Summary: ADMIN
- Global Search Logs: ADMIN
- Cleanup Logs: ADMIN
- Flush Logs: ADMIN
