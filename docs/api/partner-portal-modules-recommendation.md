# Partner Portal Modules Recommendation

## Overview

This document outlines the recommended modules to support in the **localpro-partners** Next.js web application for business owners to manage their operations across the LocalPro Super App platform.

Based on the existing server architecture and the partner portal work queue specification, here are the essential modules to implement:

---

## Core Modules

### 1. **Organization & Location Management** ⭐ Priority 1
**Purpose**: Multi-location business management

**Features**:
- View/manage organizations (orgs) the user owns
- View/manage locations/branches under each org
- Switch between locations
- Org-wide consolidated view (`locationId=all`)
- Location settings and branding
- Staff assignment per location

**API Endpoints**:
- `GET /api/partner-portal/orgs` - Get user's organizations
- `GET /api/partner-portal/orgs/:orgId/locations` - Get locations for an org
- `GET /api/partner-portal/orgs/:orgId/locations/:locationId` - Get location details
- `PUT /api/partner-portal/orgs/:orgId/locations/:locationId` - Update location
- `GET /api/partner-portal/orgs/:orgId/branding/effective` - Get effective branding

**Why Essential**: Foundation for multi-location operations and cross-branch management.

---

### 2. **Unified Work Queue** ⭐ Priority 1
**Purpose**: Single dashboard to manage all business activities

**Features**:
- Unified view of all work items across modules:
  - Marketplace bookings
  - Rental bookings
  - Facility care bookings
  - Supplies orders
  - Job postings/applications
  - Escrow cases
- Filter by type, status, location, date range
- Search across all work items
- Quick status updates
- Priority management
- Financial lock indicators

**API Endpoints**:
- `GET /api/partner-portal/orgs/:orgId/locations/:locationId/work-queue` - List work items
- `GET /api/partner-portal/orgs/:orgId/locations/:locationId/work-queue/:workItemId` - Get work item details
- `PUT /api/partner-portal/orgs/:orgId/locations/:locationId/work-queue/:workItemId/status` - Update status

**Why Essential**: Core feature that unifies all business operations in one place.

---

### 3. **Cross-Branch Operations** ⭐ Priority 1
**Purpose**: Transfer and route work items across locations

**Features**:
- Transfer work items between locations
- Preview transfer impact (pricing, taxes, schedules)
- Bulk transfer operations
- Rebook items to different locations/dates
- Route conversations/messages to correct branch
- Transfer history and audit trail

**API Endpoints**:
- `POST /api/partner-portal/orgs/:orgId/work-queue/transfer/preview` - Preview transfer
- `POST /api/partner-portal/orgs/:orgId/work-queue/transfer` - Execute transfer
- `POST /api/partner-portal/orgs/:orgId/work-queue/rebook` - Rebook item
- `POST /api/partner-portal/orgs/:orgId/communication/conversations/:conversationId/route` - Route conversation

**Why Essential**: Enables flexible business operations across multiple locations.

---

### 4. **Marketplace Management** ⭐ Priority 2
**Purpose**: Manage service listings and bookings

**Features**:
- View/manage service listings
- Create/edit/delete services
- Manage service images and details
- View marketplace bookings
- Update booking status
- View customer reviews
- Service performance analytics

**API Endpoints** (from existing server):
- `GET /api/marketplace/my-services` - Get my services
- `POST /api/marketplace/services` - Create service
- `PUT /api/marketplace/services/:id` - Update service
- `DELETE /api/marketplace/services/:id` - Delete service
- `GET /api/marketplace/my-bookings` - Get my bookings
- `PUT /api/marketplace/bookings/:id/status` - Update booking status

**Why Important**: Core revenue stream for service providers.

---

### 5. **Rentals Management** ⭐ Priority 2
**Purpose**: Manage rental equipment and bookings

**Features**:
- View/manage rental listings
- Create/edit/delete rental items
- Manage rental availability calendar
- View rental bookings
- Update booking status
- Track maintenance schedules
- Rental performance analytics

**API Endpoints** (from existing server):
- `GET /api/rentals/my-rentals` - Get my rentals
- `POST /api/rentals` - Create rental
- `PUT /api/rentals/:id` - Update rental
- `GET /api/rentals/my-bookings` - Get my bookings
- `PUT /api/rentals/:id/bookings/:bookingId/status` - Update booking status

**Why Important**: Secondary revenue stream for equipment owners.

---

### 6. **Facility Care Management** ⭐ Priority 2
**Purpose**: Manage facility care services, contracts, and subscriptions

**Features**:
- View/manage facility care services
- Create/edit service listings
- Manage contracts (draft, pending, active, completed)
- Manage subscriptions (active, paused, cancelled)
- View facility care bookings
- Track service schedules
- Performance KPI tracking
- Document management

**API Endpoints** (from existing server):
- `GET /api/facility-care/my-services` - Get my services
- `POST /api/facility-care/services` - Create service
- `GET /api/facility-care/my-bookings` - Get my bookings
- `PUT /api/facility-care/:id/bookings/:bookingId/status` - Update booking status
- `GET /api/facility-care/contracts` - Get contracts
- `GET /api/facility-care/subscriptions` - Get subscriptions

**Why Important**: Recurring revenue and long-term contracts.

---

### 7. **Supplies/Orders Management** ⭐ Priority 2
**Purpose**: Manage product listings and customer orders (for suppliers)

**Features**:
- View/manage product listings
- Create/edit/delete products
- Inventory management
- View customer orders
- Update order status (pending → confirmed → processing → shipped → delivered)
- Track inventory levels
- Low stock alerts
- Sales analytics

**API Endpoints** (from existing server):
- `GET /api/supplies/my-supplies` - Get my supplies
- `POST /api/supplies` - Create supply
- `PUT /api/supplies/:id` - Update supply
- `GET /api/supplies/my-orders` - Get my orders
- `PUT /api/supplies/:id/orders/:orderId/status` - Update order status

**Why Important**: E-commerce revenue stream for suppliers.

---

### 8. **Job Board Management** ⭐ Priority 3
**Purpose**: Manage job postings and applications

**Features**:
- View/manage job postings
- Create/edit/delete job postings
- View job applications
- Update application status
- Manage company logo
- Job statistics and analytics

**API Endpoints** (from existing server):
- `GET /api/jobs/my-jobs` - Get my jobs
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `GET /api/jobs/:id/applications` - Get applications
- `PUT /api/jobs/:id/applications/:applicationId/status` - Update application status

**Why Lower Priority**: May not be core to all partner businesses.

---

### 9. **Escrow Management** ⭐ Priority 3
**Purpose**: Manage escrow cases and transactions

**Features**:
- View escrow cases
- Track escrow status
- Manage escrow releases
- View escrow history
- Dispute management

**API Endpoints** (from existing server):
- `GET /api/escrows` - Get escrows
- `GET /api/escrows/:id` - Get escrow details
- `PUT /api/escrows/:id/status` - Update escrow status

**Why Lower Priority**: Typically handled automatically, but visibility is useful.

---

### 10. **Communication/Inbox** ⭐ Priority 2
**Purpose**: Manage customer communications

**Features**:
- Unified inbox for all conversations
- Filter by location, customer, type
- Route conversations to correct branch
- Message history
- Notification management
- Customer contact management

**API Endpoints** (from existing server):
- `GET /api/communication/conversations` - Get conversations
- `GET /api/communication/conversations/:id` - Get conversation
- `POST /api/communication/conversations/:id/messages` - Send message
- `POST /api/partner-portal/orgs/:orgId/communication/conversations/:conversationId/route` - Route conversation

**Why Important**: Customer service and relationship management.

---

### 11. **Analytics & Reporting** ⭐ Priority 2
**Purpose**: Business performance insights

**Features**:
- Revenue analytics (by module, location, time period)
- Booking/order trends
- Customer analytics
- Performance metrics
- Export reports
- Dashboard widgets

**API Endpoints** (from existing server):
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/bookings` - Booking analytics
- `GET /api/analytics/customers` - Customer analytics

**Why Important**: Data-driven business decisions.

---

### 12. **Financial Management** ⭐ Priority 2
**Purpose**: Track payments, payouts, and financial transactions

**Features**:
- View payment history
- Track payouts
- View invoices
- Payment status tracking
- Financial summaries
- Transaction history

**API Endpoints** (from existing server):
- `GET /api/finance/payments` - Get payments
- `GET /api/finance/payouts` - Get payouts
- `GET /api/finance/invoices` - Get invoices

**Why Important**: Financial transparency and cash flow management.

---

### 13. **Branding & Settings** ⭐ Priority 3
**Purpose**: Customize business branding and settings

**Features**:
- Org-level branding (logo, colors, name)
- Location-level branding overrides
- View effective branding per location
- Business settings
- Notification preferences
- Integration settings

**API Endpoints**:
- `GET /api/partner-portal/orgs/:orgId/branding/effective` - Get effective branding
- `PUT /api/partner-portal/orgs/:orgId/branding` - Update org branding
- `PUT /api/partner-portal/orgs/:orgId/locations/:locationId/branding` - Update location branding

**Why Lower Priority**: Nice-to-have for multi-brand operations.

---

### 14. **Staff Management** ⭐ Priority 3
**Purpose**: Manage staff and permissions (if applicable)

**Features**:
- View staff members per location
- Assign staff to work items
- Role management
- Permission settings
- Staff performance tracking

**API Endpoints** (may need to be created):
- `GET /api/partner-portal/orgs/:orgId/locations/:locationId/staff` - Get staff
- `POST /api/partner-portal/orgs/:orgId/locations/:locationId/staff` - Add staff
- `PUT /api/partner-portal/orgs/:orgId/locations/:locationId/staff/:staffId` - Update staff

**Why Lower Priority**: Depends on business model (may use agencies instead).

---

## Implementation Phases

### Phase 1: Foundation (MVP)
1. ✅ Organization & Location Management
2. ✅ Unified Work Queue
3. ✅ Cross-Branch Operations
4. ✅ Basic Authentication & Authorization

### Phase 2: Core Business Operations
5. ✅ Marketplace Management
6. ✅ Rentals Management
7. ✅ Facility Care Management
8. ✅ Communication/Inbox

### Phase 3: Extended Features
9. ✅ Supplies/Orders Management
10. ✅ Analytics & Reporting
11. ✅ Financial Management

### Phase 4: Advanced Features
12. ✅ Job Board Management
13. ✅ Escrow Management
14. ✅ Branding & Settings
15. ✅ Staff Management

---

## Technical Considerations

### Authentication
- Use JWT tokens from the main server
- Support role-based access (`partner` role)
- Multi-org access control

### API Integration
- All endpoints should call the existing backend REST API
- Use the unified work queue adapter pattern (as described in `partner-portal-work-queue.md`)
- Handle pagination with cursor-based pagination where available

### State Management
- Consider using React Query or SWR for API state management
- Implement optimistic updates for better UX
- Cache organization and location data

### UI/UX
- Responsive design for mobile and desktop
- Location switcher in header/navigation
- Real-time updates for work queue (WebSocket or polling)
- Dark mode support (optional)

---

## Module Dependencies

```
Organization & Location Management (Foundation)
    ↓
Unified Work Queue (Core)
    ↓
    ├─→ Marketplace Management
    ├─→ Rentals Management
    ├─→ Facility Care Management
    ├─→ Supplies Management
    ├─→ Job Board Management
    └─→ Escrow Management
    ↓
Cross-Branch Operations (Enhancement)
    ↓
Communication/Inbox (Support)
    ↓
Analytics & Reporting (Insights)
    ↓
Financial Management (Business)
```

---

## Recommended Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui (or similar component library)
- **State Management**: React Query / SWR
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table (for work queue)
- **Charts**: Recharts or Chart.js (for analytics)
- **Date Handling**: date-fns or Day.js
- **HTTP Client**: Axios or fetch with interceptors

---

## Next Steps

1. **Review and prioritize** modules based on your specific business needs
2. **Design API contracts** for any missing endpoints
3. **Create Next.js project structure** with module-based organization
4. **Implement authentication** and role-based access
5. **Build foundation modules** (Org/Location, Work Queue)
6. **Iterate on business modules** based on user feedback

---

## Questions to Consider

1. **Do all partners need all modules?** Consider feature flags or module subscriptions
2. **What's the primary use case?** Focus on the most common workflows first
3. **Mobile vs Desktop?** Prioritize based on where partners will use it most
4. **Real-time updates?** Consider WebSocket integration for live work queue updates
5. **Multi-tenant isolation?** Ensure proper data isolation between organizations

---

*This recommendation is based on the existing server architecture and the partner portal work queue specification. Adjust priorities based on your specific business requirements.*

