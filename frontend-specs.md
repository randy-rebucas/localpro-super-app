# LocalPro Super App Frontend Specifications

## Overview

The LocalPro Super App frontend is a unified Next.js application designed to serve all user roles within the LocalPro platform. This single application provides role-based interfaces and features, ensuring users access only the functionality appropriate to their permissions and responsibilities.

## Tech Stack

### Core Framework
- **Next.js 14+** - React framework with App Router for server-side rendering, routing, and API routes
- **React 18+** - UI library with hooks and concurrent features
- **TypeScript** - Type-safe development

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework optimized for mobile-first design
- **Mantine** - Modern React component library with mobile-first approach and excellent UX
- **Lucide React** - Icon library with consistent, accessible icons
- **Framer Motion** - Animation library for smooth, performant transitions

### State Management
- **Zustand** - Lightweight state management for client-side state
- **React Query (TanStack Query)** - Server state management, caching, and synchronization
- **React Hook Form** - Form state management with validation

### Authentication & Security
- **REST API Authentication** - Direct API calls to backend auth endpoints
- **JWT Tokens** - Token-based authentication with automatic refresh
- **Session Management** - Client-side session handling with token persistence
- **bcrypt** - Password hashing (server-side)

### Third-Party Integrations
- **Stripe/PayMongo** - Payment processing
- **Twilio** - SMS and communication
- **Google Maps** - Location services and mapping
- **Socket.io** - Real-time messaging and notifications
- **AWS S3/Cloudinary** - File uploads and media storage
- **SendGrid/Mailgun** - Email services
- **Firebase** - Push notifications (optional)
- **Sentry** - Error tracking and monitoring

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Jest** - Unit testing
- **Cypress/Playwright** - E2E testing

## Architecture

### Project Structure
```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── globals.css
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Mantine)
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── role-specific/    # Role-based components
├── lib/                  # Utilities and configurations
│   ├── auth.ts           # Authentication utilities
│   ├── api.ts            # API client
│   ├── validations.ts    # Form validations
│   └── constants.ts      # App constants
├── hooks/                # Custom React hooks
├── stores/               # Zustand stores
├── types/                # TypeScript type definitions
└── middleware.ts         # Next.js middleware for auth/routing
```

### Design Patterns
- **Component Composition** - Building complex UIs from smaller components
- **Custom Hooks** - Reusable logic extraction
- **Provider Pattern** - Context for global state
- **Compound Components** - Related components grouped together
- **Render Props** - Flexible component APIs

## Authentication & Authorization

### Authentication Flow
1. **Registration/Login** - Direct REST API calls to `/api/auth/register` or `/api/auth/login`
2. **Token Receipt** - Receive JWT access and refresh tokens from backend
3. **Role Assignment** - Extract user roles from JWT payload or `/api/auth/me` endpoint
4. **Token Storage** - Secure client-side storage (localStorage/sessionStorage with encryption)
5. **Token Refresh** - Automatic refresh via `/api/auth/refresh` before expiration
6. **Session Persistence** - Maintain authenticated state across page reloads
7. **Logout** - Call `/api/auth/logout` and clear client-side tokens

### Role-Based Access Control (RBAC)
- **Client** - Base role with consumer features
- **Provider** - Service provider capabilities
- **Supplier** - Product selling features
- **Instructor** - Course creation and teaching
- **Agency Owner** - Agency management
- **Agency Admin** - Agency operations
- **Partner** - Corporate/bulk operations
- **Staff** - Limited admin features
- **Admin** - Full platform management

### Middleware Implementation
- Route protection based on authentication status
- Role-based route restrictions
- API route protection
- Redirect logic for unauthorized access

## Pages & Components by Role

### Shared Components (All Roles)
- **Header/Navigation** - Role-aware navigation menu
- **Footer** - Common footer with links
- **Profile Dropdown** - User profile and settings
- **Notifications** - Real-time notification system
- **Search Bar** - Global search functionality
- **Loading States** - Skeleton loaders and spinners
- **Error Boundaries** - Graceful error handling

### Client Role Features
**Accessible Pages:**
- **Dashboard** - Overview of recent activity, favorites, recommendations
- **Service Marketplace** - Browse and book services
- **Job Board** - Search and apply for jobs
- **Product Store** - Purchase supplies and equipment
- **Training Academy** - Browse and enroll in courses
- **Bookings** - Manage current and past bookings
- **Favorites** - Saved services, providers, and products
- **Messages** - Chat with providers
- **Profile** - Personal information and settings
- **Wallet** - Payment methods and transaction history

**Restricted Features:**
- Cannot access provider management, admin panels, etc.

### Provider Role Features (extends Client)
**Additional Pages:**
- **Provider Dashboard** - Business overview, earnings, analytics
- **Service Management** - Create/edit service offerings
- **Booking Management** - Accept/reject/manage bookings
- **Schedule Management** - Set availability and working hours
- **Earnings** - Income tracking and payout history
- **Reviews** - Customer feedback and ratings
- **Portfolio** - Showcase work and certifications
- **Agency Management** - Join/create agencies (if applicable)

### Supplier Role Features (extends Client)
**Additional Pages:**
- **Supplier Dashboard** - Sales overview and inventory
- **Product Management** - Add/edit products and pricing
- **Order Management** - Process and fulfill orders
- **Inventory** - Stock levels and alerts
- **Sales Analytics** - Revenue and product performance

### Instructor Role Features (extends Client)
**Additional Pages:**
- **Instructor Dashboard** - Course overview and student metrics
- **Course Management** - Create/edit courses and lessons
- **Student Management** - Enrollments and progress tracking
- **Certifications** - Issue and manage certificates
- **Content Library** - Upload and organize course materials

### Agency Owner Role Features (extends Provider)
**Additional Pages:**
- **Agency Dashboard** - Team overview and performance
- **Provider Recruitment** - Invite and manage team members
- **Bulk Operations** - Mass booking assignments
- **Agency Finances** - Team earnings and commissions
- **Agency Settings** - Business information and policies

### Agency Admin Role Features (extends Provider)
**Additional Pages:**
- **Operations Dashboard** - Daily operations and assignments
- **Booking Dispatch** - Assign bookings to providers
- **Team Coordination** - Communication and scheduling
- **Performance Monitoring** - Individual provider metrics

### Partner Role Features (extends Client)
**Additional Pages:**
- **Partner Dashboard** - Program overview and usage
- **Employee Management** - Add/manage organization members
- **Bulk Bookings** - Schedule services for multiple users
- **Corporate Billing** - Centralized invoicing and payments
- **Custom Programs** - Configure service packages
- **Reporting** - Organization-wide analytics

### Staff Role Features
**Limited Admin Access:**
- **Staff Dashboard** - Assigned tasks and responsibilities
- **User Support** - Help tickets and customer service
- **Content Moderation** - Review listings and reports
- **Basic Analytics** - Read-only platform metrics

### Admin Role Features
**Full Platform Access:**
- **Admin Dashboard** - System overview and key metrics
- **User Management** - All user accounts and roles
- **Provider Verification** - Review and approve applications
- **Financial Oversight** - Transactions, payouts, revenue
- **Content Moderation** - Reviews, listings, reported content
- **System Configuration** - Platform settings and features
- **Analytics & Reports** - Comprehensive data insights
- **Dispute Resolution** - Handle conflicts and complaints
- **System Monitoring** - Health, performance, logs

## API Integration

### Backend Communication
The frontend will interact with the LocalPro backend exclusively through RESTful APIs, following the documented endpoints in the backend API documentation.

- **RESTful APIs** - Primary communication protocol using standard HTTP methods (GET, POST, PUT, DELETE, PATCH)
- **Real-time Updates** - WebSocket connections via Socket.io for live messaging and notifications
- **File Uploads** - Multipart form data for images, documents, and media files

### API Client Implementation
- **Axios/Fetch API** - HTTP client for API requests
- **Authentication Interceptors** - Automatic JWT token attachment to requests
- **Token Refresh Logic** - Seamless token refresh on 401 responses
- **Response Interceptors** - Global error handling and response transformation
- **Retry Logic** - Automatic retry for failed requests with exponential backoff

### Key API Endpoints Integration

#### Authentication APIs
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile and roles

#### User Management APIs
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/upgrade-role` - Upgrade user role (e.g., client to provider)
- `GET /api/users/roles` - Get available roles for user

#### Service Marketplace APIs
- `GET /api/services` - List services with filtering/pagination
- `GET /api/services/{id}` - Get service details
- `POST /api/services/{id}/book` - Book a service
- `GET /api/services/categories` - Get service categories

#### Provider APIs (Provider Role)
- `GET /api/provider/dashboard` - Provider dashboard data
- `GET /api/provider/services` - List provider's services
- `POST /api/provider/services` - Create new service
- `PUT /api/provider/services/{id}` - Update service
- `GET /api/provider/bookings` - List provider bookings
- `PUT /api/provider/bookings/{id}/status` - Update booking status

#### Booking Management APIs
- `GET /api/bookings` - List user bookings
- `GET /api/bookings/{id}` - Get booking details
- `PUT /api/bookings/{id}/cancel` - Cancel booking
- `POST /api/bookings/{id}/review` - Add review/rating

#### Job Board APIs
- `GET /api/jobs` - List available jobs
- `GET /api/jobs/{id}` - Get job details
- `POST /api/jobs/{id}/apply` - Apply for job
- `GET /api/jobs/my-applications` - List user's job applications

#### Product/Supplier APIs
- `GET /api/products` - List products
- `GET /api/products/{id}` - Get product details
- `POST /api/products/{id}/purchase` - Purchase product
- `GET /api/orders` - List user orders (Supplier: GET /api/supplier/orders)

#### Training Academy APIs
- `GET /api/courses` - List courses
- `GET /api/courses/{id}` - Get course details
- `POST /api/courses/{id}/enroll` - Enroll in course
- `GET /api/courses/my-courses` - List enrolled courses

#### Messaging APIs
- `GET /api/messages/conversations` - List conversations
- `GET /api/messages/{conversationId}` - Get conversation messages
- `POST /api/messages/{conversationId}` - Send message

#### Payment APIs
- `POST /api/payments/create-session` - Create payment session (PayMongo)
- `GET /api/payments/{id}/status` - Check payment status
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/transactions` - List transactions

#### Admin APIs (Admin/Staff Roles)
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/{id}/status` - Update user status
- `GET /api/admin/providers/pending` - List pending provider verifications
- `PUT /api/admin/providers/{id}/verify` - Verify provider
- `GET /api/admin/analytics` - Get platform analytics

#### Partner APIs (Partner Role)
- `GET /api/partner/dashboard` - Partner dashboard
- `POST /api/partner/employees` - Add employees
- `GET /api/partner/employees` - List employees
- `POST /api/partner/bulk-bookings` - Create bulk bookings
- `GET /api/partner/billing` - Get billing information

### Data Fetching Strategy
- **Server-Side Rendering (SSR)** - Initial page loads with API data
- **Static Generation (SSG)** - Public pages (service categories, course listings)
- **Client-Side Fetching** - Dynamic content and user interactions
- **Optimistic Updates** - Immediate UI feedback for actions like booking, messaging
- **Background Refetching** - Keep data fresh with periodic updates

### Error Handling
- **HTTP Status Codes** - Proper handling of 4xx/5xx responses
- **Network Errors** - Retry mechanisms and offline support
- **API Errors** - User-friendly error messages from backend
- **Validation Errors** - Form field validation feedback
- **Global Error Boundary** - Catch and report unexpected errors

### Caching & Performance
- **React Query Cache** - Client-side caching of API responses
- **Cache Invalidation** - Automatic cache updates on mutations
- **Request Deduplication** - Prevent duplicate API calls
- **Background Updates** - Refresh stale data silently

## Third-Party Integrations

### Payment Processing
- **PayMongo Integration** - Philippine payment gateway
- **Stripe** - International payments (if needed)
- **Wallet System** - In-app balance and transactions

### Communication
- **Twilio** - SMS notifications and verification
- **Socket.io** - Real-time chat and notifications
- **Email Service** - Transactional and marketing emails

### Location Services
- **Google Maps API** - Address autocomplete and mapping
- **Geolocation** - User location for service discovery

### Media Management
- **Cloudinary/AWS S3** - Image and video uploads
- **Video Streaming** - Course content delivery

### Analytics & Monitoring
- **Google Analytics** - User behavior tracking
- **Sentry** - Error tracking and performance monitoring
- **Hotjar** - User experience insights

## Performance Optimization

### Code Splitting
- **Route-based Splitting** - Automatic with Next.js App Router
- **Component Lazy Loading** - Dynamic imports for heavy components
- **Vendor Chunking** - Separate third-party libraries

### Caching Strategies
- **Browser Caching** - HTTP headers for static assets
- **API Response Caching** - React Query for client-side caching
- **CDN** - Global content delivery

### Image Optimization
- **Next.js Image Component** - Automatic optimization
- **Responsive Images** - Multiple sizes and formats
- **Lazy Loading** - Load images as needed

## Security Considerations

### Client-Side Security
- **Input Sanitization** - Prevent XSS attacks
- **CSRF Protection** - Token-based prevention
- **Content Security Policy (CSP)** - Restrict resource loading

### Authentication Security
- **Secure Token Storage** - Encrypted localStorage/sessionStorage for tokens
- **Token Expiration** - Automatic logout on token expiry
- **Refresh Token Rotation** - Secure token refresh mechanism
- **Password Policies** - Strong password requirements enforced on frontend
- **Rate Limiting** - Client-side throttling for auth attempts

### Data Protection
- **Encryption** - HTTPS for all communications
- **PII Handling** - Secure storage of personal information
- **GDPR Compliance** - Data privacy regulations

## Testing Strategy

### Unit Testing
- **Component Testing** - Jest with React Testing Library
- **Hook Testing** - Custom hook logic validation
- **Utility Testing** - Helper functions and validations

### Integration Testing
- **API Integration** - Mock server responses
- **User Flows** - Multi-step process testing
- **Role-based Access** - Permission testing

### End-to-End Testing
- **Critical Paths** - Booking flow, payment processing
- **Cross-browser** - Compatibility testing
- **Mobile Responsiveness** - Device testing

## Deployment & DevOps

### Development Environment
- **Local Development** - Next.js dev server
- **Hot Reloading** - Instant feedback during development
- **Environment Variables** - Separate configs for dev/staging/prod

### Build & Deployment
- **CI/CD Pipeline** - Automated testing and deployment
- **Docker** - Containerized deployment
- **Vercel/Netlify** - Serverless deployment options
- **AWS/Azure** - Cloud infrastructure

### Monitoring & Maintenance
- **Performance Monitoring** - Core Web Vitals tracking
- **Error Tracking** - Real-time error reporting
- **Log Aggregation** - Centralized logging system
- **Backup & Recovery** - Data backup strategies

## Accessibility (a11y)

### WCAG Compliance
- **Keyboard Navigation** - Full keyboard accessibility
- **Screen Reader Support** - ARIA labels and semantic HTML
- **Color Contrast** - WCAG AA compliance
- **Focus Management** - Clear focus indicators

### Inclusive Design
- **Responsive Design** - Mobile-first approach
- **Font Scaling** - Support for different text sizes
- **Reduced Motion** - Respect user motion preferences
- **High Contrast Mode** - Support for accessibility themes

## Future Considerations

### Scalability
- **Micro-frontend Architecture** - Modular component loading
- **Progressive Web App (PWA)** - Offline capabilities
- **Internationalization (i18n)** - Multi-language support

### Advanced Features
- **AI/ML Integration** - Personalized recommendations
- **Voice Commands** - Hands-free interaction
- **Augmented Reality** - Visual service previews
- **Blockchain** - Secure transaction verification

---

*This specification document serves as a comprehensive guide for developing the LocalPro Super App frontend. It should be reviewed and updated as the project evolves and new requirements emerge.*