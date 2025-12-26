# Partner Portal - Web Layout & Structure

## Overview

This document defines the complete web layout and structure for the **localpro-partners** Next.js application, designed for business owners to manage multi-location operations across the LocalPro Super App platform.

---

## 🏗️ Application Architecture

### Tech Stack Recommendation

```
Framework: Next.js 14+ (App Router)
├── Server Components (default)
├── Client Components ('use client' when needed)
├── Server Actions (form submissions)
└── API Routes (proxy to backend)

Styling:
├── Tailwind CSS (utility-first)
├── shadcn/ui (component library)
└── Radix UI (accessible primitives)

State Management:
├── React Query / TanStack Query (server state)
├── Zustand (client state)
└── React Context (theme, auth context)

Forms: React Hook Form + Zod
Tables: TanStack Table (v8)
Charts: Recharts
Date: date-fns
HTTP: Axios with interceptors
```

---

## 📁 Project Structure

```
localpro-partners/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth group (no layout)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx                # Auth-specific layout
│   │
│   ├── (dashboard)/                  # Dashboard group
│   │   ├── layout.tsx                # Main dashboard layout
│   │   ├── page.tsx                  # Dashboard home
│   │   │
│   │   ├── [orgId]/                  # Org-scoped routes
│   │   │   ├── layout.tsx            # Org context provider
│   │   │   ├── page.tsx              # Org overview
│   │   │   │
│   │   │   ├── locations/            # Location management
│   │   │   │   ├── page.tsx          # List locations
│   │   │   │   ├── [locationId]/
│   │   │   │   │   ├── page.tsx      # Location details
│   │   │   │   │   └── settings/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   ├── [locationId]/         # Location-scoped routes
│   │   │   │   ├── layout.tsx        # Location context
│   │   │   │   │
│   │   │   │   ├── work-queue/       # Unified work queue
│   │   │   │   │   ├── page.tsx      # Work queue list
│   │   │   │   │   └── [workItemId]/
│   │   │   │   │       └── page.tsx  # Work item details
│   │   │   │   │
│   │   │   │   ├── marketplace/      # Marketplace module
│   │   │   │   │   ├── page.tsx      # Services list
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── [serviceId]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── bookings/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── [bookingId]/
│   │   │   │   │           └── page.tsx
│   │   │   │   │
│   │   │   │   ├── rentals/          # Rentals module
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── items/
│   │   │   │   │   └── bookings/
│   │   │   │   │
│   │   │   │   ├── facility-care/    # Facility care module
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── services/
│   │   │   │   │   ├── contracts/
│   │   │   │   │   └── subscriptions/
│   │   │   │   │
│   │   │   │   ├── supplies/         # Supplies module
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── products/
│   │   │   │   │   └── orders/
│   │   │   │   │
│   │   │   │   ├── jobs/             # Job board module
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [jobId]/
│   │   │   │   │
│   │   │   │   ├── communication/    # Inbox module
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [conversationId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── analytics/        # Analytics module
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── revenue/
│   │   │   │   │   └── performance/
│   │   │   │   │
│   │   │   │   └── finance/          # Finance module
│   │   │   │       ├── page.tsx
│   │   │   │       ├── payments/
│   │   │   │       └── payouts/
│   │   │   │
│   │   │   └── transfer/             # Cross-branch operations
│   │   │       └── page.tsx          # Transfer/rebook interface
│   │   │
│   │   └── settings/                 # Org-level settings
│   │       ├── page.tsx
│   │       ├── branding/
│   │       └── staff/
│   │
│   ├── api/                          # API proxy routes
│   │   └── proxy/
│   │       └── [...path]/
│   │           └── route.ts           # Proxy to backend
│   │
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                     # Landing/redirect
│   ├── loading.tsx                  # Global loading
│   ├── error.tsx                    # Global error boundary
│   └── not-found.tsx                # 404 page
│
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── ...
│   │
│   ├── layout/                      # Layout components
│   │   ├── DashboardLayout.tsx      # Main dashboard wrapper
│   │   ├── Sidebar.tsx              # Sidebar navigation
│   │   ├── TopBar.tsx               # Top bar (org/location switcher)
│   │   ├── Breadcrumbs.tsx
│   │   └── MobileNav.tsx            # Mobile drawer
│   │
│   ├── work-queue/                  # Work queue components
│   │   ├── WorkQueueTable.tsx
│   │   ├── WorkItemCard.tsx
│   │   ├── WorkItemFilters.tsx
│   │   ├── WorkItemDetail.tsx
│   │   └── StatusBadge.tsx
│   │
│   ├── location-switcher/          # Location management
│   │   ├── LocationSwitcher.tsx
│   │   ├── OrgSwitcher.tsx
│   │   └── LocationCard.tsx
│   │
│   ├── marketplace/                 # Marketplace components
│   │   ├── ServiceList.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── ServiceForm.tsx
│   │   └── BookingList.tsx
│   │
│   ├── analytics/                   # Analytics components
│   │   ├── RevenueChart.tsx
│   │   ├── StatCard.tsx
│   │   └── TrendIndicator.tsx
│   │
│   └── shared/                     # Shared components
│       ├── DataTable.tsx
│       ├── SearchBar.tsx
│       ├── FilterPanel.tsx
│       └── EmptyState.tsx
│
├── features/                        # Feature modules
│   ├── work-queue/
│   │   ├── hooks/
│   │   │   └── useWorkQueue.ts
│   │   ├── services/
│   │   │   └── workQueueApi.ts
│   │   └── types.ts
│   │
│   ├── locations/
│   ├── marketplace/
│   ├── rentals/
│   └── ...
│
├── lib/
│   ├── api/
│   │   ├── client.ts                # API client setup
│   │   ├── interceptors.ts           # Request/response interceptors
│   │   └── endpoints.ts             # API endpoint constants
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOrg.ts
│   │   └── useLocation.ts
│   │
│   ├── utils/
│   │   ├── cn.ts                    # className utility
│   │   └── format.ts                # Formatting utilities
│   │
│   └── store/
│       ├── authStore.ts             # Zustand auth store
│       └── orgStore.ts              # Org/location state
│
├── types/
│   ├── api.ts                       # API response types
│   ├── work-queue.ts
│   └── organization.ts
│
└── public/
    └── assets/
```

---

## 🎨 Layout Structure

### 1. Root Layout (`app/layout.tsx`)

```tsx
┌─────────────────────────────────────────────────────────┐
│                    Root Layout                          │
│  - HTML structure                                       │
│  - Fonts, meta tags                                    │
│  - Theme provider                                       │
│  - Auth provider                                        │
└─────────────────────────────────────────────────────────┘
```

### 2. Dashboard Layout (`app/(dashboard)/layout.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│  TopBar: [Logo] [Org Switcher] [Location Switcher]      │
│         [Notifications] [User Menu]                      │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │  Main Content Area                          │
│          │  (Page-specific content)                     │
│ - Home   │                                              │
│ - Work   │                                              │
│   Queue  │                                              │
│ - Market │                                              │
│   place  │                                              │
│ - Rentals│                                              │
│ - ...    │                                              │
│          │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 3. Org-Scoped Layout (`app/(dashboard)/[orgId]/layout.tsx`)

- Provides org context
- Fetches org data
- Handles org-level permissions
- Shows org branding

### 4. Location-Scoped Layout (`app/(dashboard)/[orgId]/[locationId]/layout.tsx`)

- Provides location context
- Fetches location data
- Handles location-specific permissions
- Shows location branding

---

## 🧭 Navigation Structure

### Sidebar Navigation

```
┌─────────────────────┐
│  📊 Dashboard       │  (Home/Overview)
│  📋 Work Queue      │  (Unified work items)
│  🏪 Marketplace     │  (Services & bookings)
│  🚗 Rentals         │  (Rental items & bookings)
│  🏢 Facility Care   │  (Contracts & subscriptions)
│  📦 Supplies        │  (Products & orders)
│  💼 Jobs            │  (Job postings)
│  💬 Inbox           │  (Communications)
│  📈 Analytics       │  (Reports & insights)
│  💰 Finance         │  (Payments & payouts)
│  ⚙️  Settings        │  (Org/location settings)
└─────────────────────┘
```

### Top Bar Components

```
┌─────────────────────────────────────────────────────────┐
│ [Logo] │ [Org: Acme Inc ▼] │ [Location: All ▼] │ 🔔 │ 👤 │
└─────────────────────────────────────────────────────────┘
```

**Org Switcher:**
- Dropdown showing all orgs user has access to
- Shows org name and default location
- Quick switch between orgs

**Location Switcher:**
- Dropdown showing:
  - "All Locations" (org-wide view)
  - List of locations for current org
  - Pinned locations at top
- Shows location name and status
- Quick switch between locations

---

## 📄 Page Layouts

### 1. Dashboard Home (`/`)

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard Overview                                     │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Revenue  │  │ Bookings │  │  Orders  │  │  Tasks ││
│  │  $12.5K  │  │    45    │  │    23    │  │    8   ││
│  │  ↑ 12%   │  │  ↑ 5%    │  │  ↓ 2%    │  │  ↑ 3   ││
│  └──────────┘  └──────────┘  └──────────┘  └────────┘│
├─────────────────────────────────────────────────────────┤
│  Recent Activity                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ • New booking: Deep Cleaning - 2BR Condo        │  │
│  │ • Order shipped: Cleaning Supplies Order #1234  │  │
│  │ • Contract signed: Facility Care - Office Bldg  │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Revenue Chart (Last 30 Days)                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │         [Line Chart]                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2. Work Queue (`/work-queue`)

```
┌─────────────────────────────────────────────────────────┐
│  Work Queue                          [+ Filter] [Export] │
├─────────────────────────────────────────────────────────┤
│  Filters: [Type: All ▼] [Status: All ▼] [Date: ...]   │
│  Search: [________________]                             │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │ Type      │ Customer    │ Amount │ Status │ Date │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 🏪 Booking│ Juan Cruz   │ ₱2,500 │ ⏳ Pending│...│  │
│  │ 🚗 Rental │ Maria Santos│ ₱1,200 │ ✅ Confirmed│..│  │
│  │ 📦 Order  │ John Doe    │ ₱3,400 │ 📦 Shipped│...│  │
│  │ 🏢 Contract│ ABC Corp   │ ₱15K   │ ✅ Active│...│  │
│  └──────────────────────────────────────────────────┘  │
│  [← Previous]  Page 1 of 5  [Next →]                   │
└─────────────────────────────────────────────────────────┘
```

**Work Queue Features:**
- Table view with sortable columns
- Card view toggle (mobile-friendly)
- Bulk actions (select multiple items)
- Quick status update dropdown
- Filter panel (slide-out on mobile)
- Real-time updates (polling or WebSocket)

### 3. Marketplace Services (`/marketplace/services`)

```
┌─────────────────────────────────────────────────────────┐
│  Marketplace Services              [+ New Service]      │
├─────────────────────────────────────────────────────────┤
│  [Grid View] [List View]  Filter: [Category ▼] [Search]│
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ [Image]  │  │ [Image]  │  │ [Image]  │            │
│  │ Deep     │  │ Window   │  │ Carpet   │            │
│  │ Cleaning │  │ Cleaning │  │ Cleaning │            │
│  │ ₱2,500   │  │ ₱1,200   │  │ ₱3,000   │            │
│  │ ⭐ 4.8   │  │ ⭐ 4.5   │  │ ⭐ 4.9   │            │
│  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
```

### 4. Analytics (`/analytics`)

```
┌─────────────────────────────────────────────────────────┐
│  Analytics                                              │
├─────────────────────────────────────────────────────────┤
│  Period: [Last 30 Days ▼]  Location: [All ▼]           │
├─────────────────────────────────────────────────────────┤
│  Revenue Overview                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │         [Revenue Chart - Line/Bar]               │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Module Breakdown                                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Marketplace: 45%  [████████████░░░░░░░░]        │  │
│  │ Rentals:      25%  [██████░░░░░░░░░░░░░░]        │  │
│  │ Supplies:     20%  [█████░░░░░░░░░░░░░░░]        │  │
│  │ Facility:     10%  [███░░░░░░░░░░░░░░░░░]        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Specifications

### 1. Location Switcher Component

```tsx
// components/location-switcher/LocationSwitcher.tsx
'use client'

interface LocationSwitcherProps {
  orgId: string
  currentLocationId: string | 'all'
  onLocationChange: (locationId: string | 'all') => void
}

Features:
- Dropdown with search
- Shows "All Locations" option
- Pinned locations at top
- Location status indicators
- Quick switch keyboard shortcuts
```

### 2. Work Queue Table

```tsx
// components/work-queue/WorkQueueTable.tsx
'use client'

Features:
- Sortable columns
- Row selection (checkbox)
- Bulk actions toolbar
- Inline status update
- Expandable rows for details
- Virtual scrolling for performance
- Export to CSV
```

### 3. Status Badge

```tsx
// components/work-queue/StatusBadge.tsx

Status Types:
- pending (yellow)
- scheduled (blue)
- in_progress (purple)
- completed (green)
- cancelled (red)
- disputed (orange)
- settled (gray)
```

### 4. Data Table (Reusable)

```tsx
// components/shared/DataTable.tsx
'use client'

Features:
- Server-side pagination
- Sorting
- Filtering
- Column visibility toggle
- Export functionality
- Responsive (mobile card view)
```

---

## 🔄 State Management

### Context Providers

```tsx
// app/(dashboard)/[orgId]/layout.tsx
<OrgProvider orgId={orgId}>
  <LocationProvider locationId={locationId}>
    {children}
  </LocationProvider>
</OrgProvider>
```

### Zustand Stores

```tsx
// lib/store/orgStore.ts
interface OrgStore {
  currentOrg: Org | null
  currentLocation: Location | 'all' | null
  setOrg: (org: Org) => void
  setLocation: (location: Location | 'all') => void
  orgs: Org[]
  locations: Location[]
}
```

### React Query Hooks

```tsx
// features/work-queue/hooks/useWorkQueue.ts
export function useWorkQueue(
  orgId: string,
  locationId: string | 'all',
  filters: WorkQueueFilters
) {
  return useQuery({
    queryKey: ['work-queue', orgId, locationId, filters],
    queryFn: () => fetchWorkQueue(orgId, locationId, filters),
    refetchInterval: 30000, // Poll every 30s
  })
}
```

---

## 📱 Responsive Design

### Breakpoints

```
Mobile:  < 768px
Tablet:  768px - 1024px
Desktop: > 1024px
```

### Mobile Layout

```
┌─────────────────────┐
│ ☰ [Logo]     🔔 👤 │  (Hamburger menu)
├─────────────────────┤
│ [Org: Acme ▼]       │
│ [Location: All ▼]   │
├─────────────────────┤
│                     │
│  Content Area       │
│  (Full width)       │
│                     │
│                     │
└─────────────────────┘
     (Bottom Nav)
```

**Mobile Adaptations:**
- Sidebar becomes drawer (slide from left)
- Tables become card lists
- Filters become bottom sheet
- Top bar collapses on scroll
- Bottom navigation for main modules

---

## 🎨 Design System

### Color Palette

```css
Primary:   #1E40AF (Blue)
Secondary: #7C3AED (Purple)
Success:   #10B981 (Green)
Warning:   #F59E0B (Amber)
Error:     #EF4444 (Red)
Neutral:   #6B7280 (Gray)
```

### Typography

```
Heading 1: 2.25rem (36px) - Bold
Heading 2: 1.875rem (30px) - Bold
Heading 3: 1.5rem (24px) - Semibold
Body:      1rem (16px) - Regular
Small:     0.875rem (14px) - Regular
```

### Spacing

```
xs:  0.25rem (4px)
sm:  0.5rem (8px)
md:  1rem (16px)
lg:  1.5rem (24px)
xl:  2rem (32px)
2xl: 3rem (48px)
```

---

## 🔐 Authentication Flow

```
┌─────────────────────┐
│   Login Page        │
│  [Email/Phone]      │
│  [Password]         │
│  [Login Button]     │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Verify JWT Token   │
│  Get User Orgs     │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Redirect to:       │
│  /[firstOrgId]      │
└─────────────────────┘
```

---

## 🚀 Implementation Priority

### Phase 1: Foundation
1. ✅ Root layout with auth
2. ✅ Dashboard layout (sidebar + topbar)
3. ✅ Org/Location switcher
4. ✅ Basic routing structure

### Phase 2: Core Features
5. ✅ Work Queue page
6. ✅ Work Queue table component
7. ✅ Location management pages
8. ✅ Basic marketplace page

### Phase 3: Module Pages
9. ✅ All module list pages
10. ✅ Detail pages
11. ✅ Forms and modals

### Phase 4: Advanced Features
12. ✅ Analytics dashboard
13. ✅ Cross-branch operations
14. ✅ Real-time updates
15. ✅ Advanced filtering

---

## 📝 Key Implementation Notes

### 1. Route Protection

```tsx
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  const path = request.nextUrl.pathname
  
  // Protect dashboard routes
  if (path.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Validate org access
  const orgId = path.match(/\/dashboard\/([^\/]+)/)?.[1]
  if (orgId && !hasOrgAccess(token, orgId)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}
```

### 2. API Client Setup

```tsx
// lib/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 3. Error Handling

```tsx
// app/error.tsx
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

---

## 🎯 Next Steps

1. **Set up Next.js project** with App Router
2. **Install dependencies** (Tailwind, shadcn/ui, React Query)
3. **Create layout components** (Sidebar, TopBar)
4. **Implement authentication** flow
5. **Build org/location context** providers
6. **Create work queue page** (MVP)
7. **Add module pages** incrementally
8. **Implement responsive** design
9. **Add real-time** updates
10. **Polish UI/UX** and animations

---

*This layout structure is designed to scale with your business needs while maintaining a clean, intuitive user experience for managing multi-location operations.*

