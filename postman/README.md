# LocalPro API - Postman Collections

Complete Postman collections for the LocalPro Super App API, organized by user roles.

## Collections Overview

| Collection | Role | Description |
|------------|------|-------------|
| `LocalPro-Client-Collection` | Client | End-user features: marketplace, bookings, academy enrollment, support |
| `LocalPro-Provider-Collection` | Provider | Service management, booking management, ads, quotes & invoices |
| `LocalPro-Admin-Collection` | Admin | Full system access: user management, analytics, content moderation |
| `LocalPro-Supplier-Collection` | Supplier | Supply management, inventory, orders |
| `LocalPro-Instructor-Collection` | Instructor | Course creation, enrollment management, certifications |
| `LocalPro-AgencyOwner-Collection` | Agency Owner | Agency management, provider oversight, announcements |
| `LocalPro-AgencyAdmin-Collection` | Agency Admin | Agency operations, user management within agency |
| `LocalPro-Partner-Collection` | Partner | Partner features, job postings, user management |

## Setup Instructions

### 1. Import Environment

1. Open Postman
2. Click **Import** button
3. Select `LocalPro-Environment.postman_environment.json`
4. Set the environment as active

### 2. Import Collections

1. Click **Import** button
2. Select the collection(s) for your role
3. The collection will appear in your sidebar

### 3. Configure Environment Variables

Update these variables in your environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:3000/api` |
| `accessToken` | JWT token (auto-set on login) | - |
| `refreshToken` | Refresh token (auto-set on login) | - |

## Authentication Flow

### Standard Login
1. Navigate to **Authentication > Login**
2. Update email/password in request body
3. Send request
4. Token is automatically saved to environment

### Using MPIN
1. Set MPIN using **Authentication > Set MPIN**
2. Login using **Authentication > Login with MPIN**

### Token Refresh
- Use **Authentication > Refresh Token** when access token expires
- Tokens are automatically managed via test scripts

## Role-Based Access

### Client
- Browse marketplace services
- Create and manage bookings
- Enroll in academy courses
- Create support tickets
- Manage favorites and notifications

### Provider
- Create and manage services
- Handle bookings (accept/reject/complete)
- Manage availability and schedule
- Create ads and job postings
- Generate quotes and invoices
- Access provider analytics

### Admin
- Full user management (CRUD, ban, restore)
- System analytics dashboard
- Content moderation (approve/reject ads)
- API key management
- Permission management
- Live chat administration
- System monitoring and alerts

### Supplier
- Manage supply inventory
- Process orders
- Track shipments
- Financial management

### Instructor
- Create and manage courses
- Upload course content (videos, thumbnails)
- Manage enrollments
- Create certifications
- Track course analytics

### Agency Owner
- Full agency control
- Provider management
- Create announcements
- Access agency analytics
- User oversight

### Agency Admin
- Agency operations
- Provider status management
- User management within agency
- Announcement management

### Partner
- Create job postings
- Manage applications
- User creation
- Partner analytics

## Collection Features

### Auto-set Variables
Login requests automatically set:
- `accessToken`
- `refreshToken`
- `userId`
- Role-specific IDs (providerId, agencyId, etc.)

### Response Scripts
Many requests include test scripts that:
- Extract and save IDs
- Validate responses
- Set up chained requests

### Organized Structure
Each collection is organized by feature:
- Authentication
- Core features for the role
- Finance
- Notifications
- Support

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `baseUrl` | API base URL |
| `accessToken` | JWT access token |
| `refreshToken` | JWT refresh token |
| `userId` | Current user ID |
| `providerId` | Provider ID |
| `serviceId` | Service ID |
| `bookingId` | Booking ID |
| `jobId` | Job posting ID |
| `courseId` | Course ID |
| `agencyId` | Agency ID |
| `adId` | Advertisement ID |
| `ticketId` | Support ticket ID |
| `announcementId` | Announcement ID |
| `notificationId` | Notification ID |
| `apiKeyId` | API key ID |
| `staffId` | Staff member ID |
| `partnerId` | Partner ID |
| `supplyId` | Supply item ID |
| `quoteId` | Quote ID |
| `invoiceId` | Invoice ID |
| `escrowId` | Escrow ID |
| `rentalId` | Rental ID |

## Tips

1. **Run Login First**: Always authenticate before making protected requests
2. **Check Variables**: Ensure required variables are set before requests
3. **Use Folders**: Requests are organized in folders by feature
4. **Read Descriptions**: Each request has a description explaining its purpose
5. **Test Scripts**: Many requests have test scripts that auto-populate variables

## API Base URL

- Development: `http://localhost:3000/api`
- Staging: `https://staging-api.localpro.app/api`
- Production: `https://api.localpro.app/api`

## Support

For API issues or questions:
1. Create a support ticket using the Support endpoints
2. Contact the development team
