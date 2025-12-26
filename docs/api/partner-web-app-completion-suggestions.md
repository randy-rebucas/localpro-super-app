# Partner Web App Completion Suggestions

## Overview

This document provides comprehensive suggestions for completing the **localpro-partners** Next.js web application. Based on the existing documentation, backend architecture, and partner portal requirements, here are prioritized recommendations for implementation.

---

## 🎯 Critical Missing Components

### 1. Backend API Routes for Partner Portal ⚠️ **HIGH PRIORITY**

**Current Status**: Documentation references partner-portal endpoints, but routes don't exist yet.

**Required Routes to Implement**:

```javascript
// src/routes/partnerPortal.js (NEW FILE NEEDED)

// Organization & Location Management
GET    /api/partner-portal/orgs
GET    /api/partner-portal/orgs/:orgId
GET    /api/partner-portal/orgs/:orgId/locations
GET    /api/partner-portal/orgs/:orgId/locations/:locationId
PUT    /api/partner-portal/orgs/:orgId/locations/:locationId
GET    /api/partner-portal/orgs/:orgId/branding/effective

// Unified Work Queue
GET    /api/partner-portal/orgs/:orgId/locations/:locationId/work-queue
GET    /api/partner-portal/orgs/:orgId/locations/:locationId/work-queue/:workItemId
PUT    /api/partner-portal/orgs/:orgId/locations/:locationId/work-queue/:workItemId/status

// Cross-Branch Operations
POST   /api/partner-portal/orgs/:orgId/work-queue/transfer/preview
POST   /api/partner-portal/orgs/:orgId/work-queue/transfer
POST   /api/partner-portal/orgs/:orgId/work-queue/rebook
POST   /api/partner-portal/orgs/:orgId/communication/conversations/:conversationId/route
```

**Implementation Steps**:
1. Create `src/routes/partnerPortal.js`
2. Create `src/controllers/partnerPortalController.js`
3. Create `src/services/partnerPortalService.js`
4. Implement work queue adapter pattern to unify different module types
5. Add authentication middleware (verify user has access to org/location)
6. Add validation middleware for all endpoints

---

### 2. Work Queue Adapter Service ⚠️ **HIGH PRIORITY**

**Purpose**: Unify different module types (bookings, orders, contracts) into a single work queue interface.

**Required Implementation**:

```javascript
// src/services/workQueueAdapterService.js (NEW FILE NEEDED)

class WorkQueueAdapter {
  // Transform marketplace bookings to work items
  adaptMarketplaceBooking(booking) { }
  
  // Transform rental bookings to work items
  adaptRentalBooking(booking) { }
  
  // Transform facility care bookings to work items
  adaptFacilityCareBooking(booking) { }
  
  // Transform supplies orders to work items
  adaptSuppliesOrder(order) { }
  
  // Transform job applications to work items
  adaptJobApplication(application) { }
  
  // Transform escrow cases to work items
  adaptEscrowCase(escrow) { }
  
  // Unified fetch method
  async fetchWorkQueue(orgId, locationId, filters) { }
}
```

**Key Features**:
- Normalize different data structures into unified work item format
- Handle location filtering across all modules
- Support status filtering
- Support date range filtering
- Support search across all work item types
- Include financial lock indicators
- Include priority levels

---

### 3. Organization & Location Context ⚠️ **HIGH PRIORITY**

**Current Status**: User model may have organization references, but partner portal context needs verification.

**Required Implementation**:

```javascript
// Verify/Enhance User model to support:
- Organizations owned by user
- Locations under each organization
- Role-based access (owner, admin, staff)
- Multi-org support
```

**API Endpoints Needed**:
- Get user's organizations
- Get locations for organization
- Verify user has access to org/location
- Get effective branding (org + location hierarchy)

---

## 🏗️ Frontend Implementation Priorities

### Phase 1: Foundation (Weeks 1-2) ⭐ **START HERE**

#### 1.1 Project Setup
- [ ] Initialize Next.js 14+ project with App Router
- [ ] Configure TypeScript
- [ ] Set up Tailwind CSS
- [ ] Install shadcn/ui components
- [ ] Set up React Query / TanStack Query
- [ ] Configure Zustand for client state
- [ ] Set up environment variables

#### 1.2 Authentication Flow
- [ ] Create login page (`app/(auth)/login/page.tsx`)
- [ ] Implement JWT token management
- [ ] Create auth context/provider
- [ ] Set up protected route middleware
- [ ] Implement token refresh logic
- [ ] Add logout functionality

#### 1.3 Layout Structure
- [ ] Create root layout (`app/layout.tsx`)
- [ ] Create dashboard layout (`app/(dashboard)/layout.tsx`)
- [ ] Build Sidebar component
- [ ] Build TopBar component
- [ ] Implement Org Switcher component
- [ ] Implement Location Switcher component
- [ ] Add mobile responsive navigation (drawer)

#### 1.4 API Client Setup
- [ ] Create API client with Axios
- [ ] Set up request interceptors (add auth token)
- [ ] Set up response interceptors (handle errors, refresh tokens)
- [ ] Create API endpoint constants
- [ ] Implement error handling utilities

---

### Phase 2: Core Features (Weeks 3-4) ⭐ **CRITICAL**

#### 2.1 Organization & Location Management
- [ ] Create org context provider
- [ ] Create location context provider
- [ ] Build org list page (`app/(dashboard)/[orgId]/page.tsx`)
- [ ] Build location list page (`app/(dashboard)/[orgId]/locations/page.tsx`)
- [ ] Build location detail page
- [ ] Implement org/location switching logic
- [ ] Add "All Locations" view support

#### 2.2 Unified Work Queue
- [ ] Create work queue page (`app/(dashboard)/[orgId]/[locationId]/work-queue/page.tsx`)
- [ ] Build WorkQueueTable component
- [ ] Build WorkItemCard component (for mobile)
- [ ] Implement filtering (type, status, date range)
- [ ] Implement search functionality
- [ ] Add status update functionality
- [ ] Add bulk actions
- [ ] Implement pagination
- [ ] Add real-time updates (polling or WebSocket)

#### 2.3 Dashboard Home
- [ ] Create dashboard overview page
- [ ] Build stat cards (revenue, bookings, orders, tasks)
- [ ] Build revenue chart component
- [ ] Build recent activity feed
- [ ] Add quick actions widget
- [ ] Implement data fetching with React Query

---

### Phase 3: Business Modules (Weeks 5-8) ⭐ **IMPORTANT**

#### 3.1 Marketplace Management
- [ ] Create marketplace services list page
- [ ] Create service detail page
- [ ] Build service form (create/edit)
- [ ] Create bookings list page
- [ ] Build booking detail page
- [ ] Add service image upload
- [ ] Implement service status management

#### 3.2 Rentals Management
- [ ] Create rentals list page
- [ ] Create rental detail page
- [ ] Build rental form (create/edit)
- [ ] Create rental bookings page
- [ ] Add availability calendar
- [ ] Implement maintenance tracking

#### 3.3 Facility Care Management
- [ ] Create facility care services page
- [ ] Create contracts page
- [ ] Create subscriptions page
- [ ] Build contract detail view
- [ ] Add document management
- [ ] Implement KPI tracking

#### 3.4 Supplies/Orders Management
- [ ] Create products list page
- [ ] Create product form (create/edit)
- [ ] Create orders list page
- [ ] Build order detail page
- [ ] Add inventory tracking
- [ ] Implement low stock alerts

---

### Phase 4: Communication & Analytics (Weeks 9-10) ⭐ **IMPORTANT**

#### 4.1 Communication/Inbox
- [ ] Create unified inbox page
- [ ] Build conversation list
- [ ] Build message thread view
- [ ] Add conversation routing
- [ ] Implement real-time messaging
- [ ] Add notification badges

#### 4.2 Analytics & Reporting
- [ ] Create analytics dashboard
- [ ] Build revenue analytics charts
- [ ] Build booking trends charts
- [ ] Add module breakdown charts
- [ ] Implement date range filters
- [ ] Add export functionality (CSV, PDF)

#### 4.3 Financial Management
- [ ] Create payments page
- [ ] Create payouts page
- [ ] Create invoices page
- [ ] Build transaction history
- [ ] Add financial summaries
- [ ] Implement payment status tracking

---

### Phase 5: Advanced Features (Weeks 11-12) ⭐ **NICE TO HAVE**

#### 5.1 Cross-Branch Operations
- [ ] Build transfer preview modal
- [ ] Implement transfer functionality
- [ ] Build rebook interface
- [ ] Add transfer history
- [ ] Implement conversation routing

#### 5.2 Settings & Branding
- [ ] Create org settings page
- [ ] Create location settings page
- [ ] Build branding customization
- [ ] Add notification preferences
- [ ] Implement integration settings

#### 5.3 Additional Modules
- [ ] Job board management (if needed)
- [ ] Escrow management (if needed)
- [ ] Staff management (if applicable)

---

## 🔧 Technical Implementation Details

### State Management Strategy

```typescript
// Recommended structure:

// 1. Server State (React Query)
- useOrgs() - Fetch user's organizations
- useLocations(orgId) - Fetch locations
- useWorkQueue(orgId, locationId, filters) - Fetch work queue
- useMarketplaceServices(orgId, locationId) - Fetch services
// ... etc

// 2. Client State (Zustand)
- authStore - Authentication state
- orgStore - Current org/location selection
- uiStore - UI state (sidebar open, theme, etc)

// 3. Context (React Context)
- AuthContext - Auth provider
- OrgContext - Org provider
- LocationContext - Location provider
```

### API Integration Pattern

```typescript
// lib/api/partnerPortal.ts
export const partnerPortalApi = {
  // Organizations
  getOrgs: () => apiClient.get('/partner-portal/orgs'),
  getOrg: (orgId: string) => apiClient.get(`/partner-portal/orgs/${orgId}`),
  
  // Locations
  getLocations: (orgId: string) => 
    apiClient.get(`/partner-portal/orgs/${orgId}/locations`),
  
  // Work Queue
  getWorkQueue: (orgId: string, locationId: string, filters: WorkQueueFilters) =>
    apiClient.get(`/partner-portal/orgs/${orgId}/locations/${locationId}/work-queue`, {
      params: filters
    }),
  
  // ... etc
}
```

### Error Handling Strategy

```typescript
// lib/utils/errorHandler.ts
- Handle 401 (unauthorized) → redirect to login
- Handle 403 (forbidden) → show access denied
- Handle 404 (not found) → show not found page
- Handle 500 (server error) → show error message
- Handle network errors → show retry option
- Log errors to error tracking service
```

### Real-time Updates

**Option 1: Polling** (Easier to implement)
```typescript
// Use React Query's refetchInterval
useQuery({
  queryKey: ['work-queue', orgId, locationId],
  queryFn: fetchWorkQueue,
  refetchInterval: 30000, // Every 30 seconds
})
```

**Option 2: WebSocket** (Better UX, more complex)
```typescript
// Use Socket.io client
- Connect to WebSocket server
- Subscribe to org/location channels
- Update React Query cache on events
- Handle reconnection logic
```

---

## 📋 Component Checklist

### Layout Components
- [ ] `DashboardLayout.tsx` - Main dashboard wrapper
- [ ] `Sidebar.tsx` - Sidebar navigation
- [ ] `TopBar.tsx` - Top bar with switchers
- [ ] `MobileNav.tsx` - Mobile drawer navigation
- [ ] `Breadcrumbs.tsx` - Breadcrumb navigation

### Work Queue Components
- [ ] `WorkQueueTable.tsx` - Table view
- [ ] `WorkItemCard.tsx` - Card view (mobile)
- [ ] `WorkItemFilters.tsx` - Filter panel
- [ ] `WorkItemDetail.tsx` - Detail modal/page
- [ ] `StatusBadge.tsx` - Status indicator
- [ ] `TypeIcon.tsx` - Work item type icon

### Location Management Components
- [ ] `LocationSwitcher.tsx` - Location dropdown
- [ ] `OrgSwitcher.tsx` - Organization dropdown
- [ ] `LocationCard.tsx` - Location card
- [ ] `LocationForm.tsx` - Create/edit location

### Shared Components
- [ ] `DataTable.tsx` - Reusable table component
- [ ] `SearchBar.tsx` - Search input
- [ ] `FilterPanel.tsx` - Filter sidebar
- [ ] `EmptyState.tsx` - Empty state message
- [ ] `LoadingSpinner.tsx` - Loading indicator
- [ ] `ErrorBoundary.tsx` - Error boundary
- [ ] `StatCard.tsx` - Statistic card
- [ ] `ChartWidget.tsx` - Chart wrapper

---

## 🎨 Design System Implementation

### Color Palette
```css
/* Add to tailwind.config.js */
colors: {
  primary: {
    50: '#eff6ff',
    500: '#1E40AF', // Main blue
    900: '#1e3a8a',
  },
  // ... other colors
}
```

### Typography Scale
```css
/* Configure in tailwind.config.js */
fontSize: {
  'display': ['2.25rem', { lineHeight: '2.5rem' }],
  'h1': ['1.875rem', { lineHeight: '2.25rem' }],
  'h2': ['1.5rem', { lineHeight: '2rem' }],
  // ... etc
}
```

### Component Library
- Install shadcn/ui components as needed
- Customize theme to match brand
- Create custom components for business-specific needs

---

## 🔐 Security Considerations

### Authentication
- [ ] Implement secure token storage (httpOnly cookies or secure localStorage)
- [ ] Add token refresh mechanism
- [ ] Implement logout on token expiry
- [ ] Add CSRF protection

### Authorization
- [ ] Verify user has access to org/location on every request
- [ ] Implement role-based access control (RBAC)
- [ ] Add permission checks for actions
- [ ] Log all sensitive operations

### Data Protection
- [ ] Sanitize user inputs
- [ ] Validate all API responses
- [ ] Implement rate limiting on frontend
- [ ] Add request/response encryption for sensitive data

---

## 📱 Responsive Design Checklist

### Mobile (< 768px)
- [ ] Sidebar becomes drawer
- [ ] Tables become card lists
- [ ] Filters become bottom sheet
- [ ] Top bar collapses on scroll
- [ ] Bottom navigation for main modules
- [ ] Touch-friendly button sizes
- [ ] Swipe gestures for actions

### Tablet (768px - 1024px)
- [ ] Hybrid layout (sidebar + content)
- [ ] Optimized table views
- [ ] Touch and mouse support

### Desktop (> 1024px)
- [ ] Full sidebar navigation
- [ ] Multi-column layouts
- [ ] Keyboard shortcuts
- [ ] Hover states

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Test utility functions
- [ ] Test API client functions
- [ ] Test state management (Zustand stores)
- [ ] Test form validation

### Integration Tests
- [ ] Test API integration
- [ ] Test authentication flow
- [ ] Test org/location switching
- [ ] Test work queue operations

### E2E Tests (Optional)
- [ ] Test complete user workflows
- [ ] Test cross-branch operations
- [ ] Test responsive behavior

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Set up environment variables
- [ ] Configure API endpoints
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up analytics (Google Analytics, etc.)
- [ ] Optimize bundle size
- [ ] Add loading states
- [ ] Add error boundaries

### Deployment
- [ ] Set up CI/CD pipeline
- [ ] Configure build process
- [ ] Set up staging environment
- [ ] Set up production environment
- [ ] Configure CDN (if needed)
- [ ] Set up monitoring

### Post-deployment
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Collect user feedback
- [ ] Plan iterative improvements

---

## 📊 Success Metrics

### Technical Metrics
- Page load time < 2 seconds
- Time to interactive < 3 seconds
- API response time < 500ms
- Error rate < 0.1%
- Uptime > 99.9%

### User Experience Metrics
- User satisfaction score
- Task completion rate
- Time to complete common tasks
- Mobile vs desktop usage
- Feature adoption rate

---

## 🔄 Iterative Improvement Plan

### Week 1-2: MVP Launch
- Core features only (work queue, basic modules)
- Focus on stability and performance

### Week 3-4: User Feedback
- Collect user feedback
- Fix critical bugs
- Improve UX based on feedback

### Week 5-6: Feature Enhancements
- Add requested features
- Improve performance
- Add advanced features

### Ongoing: Continuous Improvement
- Regular updates
- New feature releases
- Performance optimizations
- Security updates

---

## 📚 Additional Resources Needed

### Documentation
- [ ] API documentation for partner portal endpoints
- [ ] Component library documentation
- [ ] Deployment guide
- [ ] User guide/tutorial
- [ ] Developer onboarding guide

### Tools & Services
- [ ] Error tracking service (Sentry)
- [ ] Analytics service (Google Analytics, Mixpanel)
- [ ] Monitoring service (Datadog, New Relic)
- [ ] CI/CD platform (GitHub Actions, Vercel)
- [ ] CDN (Cloudflare, Vercel Edge)

---

## 🎯 Quick Start Recommendations

### Immediate Actions (This Week)
1. **Create backend partner portal routes** - This is blocking frontend development
2. **Implement work queue adapter service** - Core functionality
3. **Set up Next.js project** - Start frontend foundation
4. **Create authentication flow** - Essential for all features

### Next Week
1. **Build layout components** - Foundation for all pages
2. **Implement org/location context** - Required for multi-location support
3. **Create work queue page** - Core feature
4. **Set up API client** - Required for all API calls

### Month 1 Goal
- Complete Phase 1 and Phase 2
- Have a working MVP with:
  - Authentication
  - Org/location switching
  - Work queue view
  - Basic dashboard

---

## 💡 Pro Tips

1. **Start with backend APIs first** - Frontend can't progress without them
2. **Build reusable components** - Saves time in long run
3. **Use TypeScript** - Catches errors early
4. **Implement error handling early** - Better UX
5. **Test on mobile from day 1** - Don't retrofit later
6. **Use React Query** - Handles caching, refetching automatically
7. **Implement optimistic updates** - Better perceived performance
8. **Add loading states everywhere** - Better UX
9. **Log everything** - Easier debugging
10. **Get user feedback early** - Validate assumptions

---

## ❓ Questions to Resolve

1. **User-Organization Relationship**: How are users linked to organizations? Through User model?
2. **Location Model**: Does Location model exist? What's the schema?
3. **Branding Hierarchy**: How does org branding override location branding?
4. **Work Queue Data**: What's the exact structure needed for work items?
5. **Real-time Updates**: WebSocket or polling? Is WebSocket server ready?
6. **File Uploads**: Where are images/documents stored? (S3, Cloudinary, etc.)
7. **Multi-tenancy**: How is data isolation handled between orgs?
8. **Permissions**: What permission system exists? RBAC? Custom?

---

*This document should be updated as implementation progresses. Use it as a living guide for completing the partner web app.*

