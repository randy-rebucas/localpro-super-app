# 📱 Mobile Layout (Quick Reference) — LocalPro Super App

## Layout

```
┌──────────────────────────────────────────┐
│ Header:  ☰  Package Name  📦  🔔  👤     │
├──────────────────────────────────────────┤
│ Content (current tab screen)             │
├──────────────────────────────────────────┤
│ Tabs (per package): 4–5 items            │
└──────────────────────────────────────────┘
```

---

## Key Navigation Rules

- **Auth first**: unauthenticated users only see AuthStack.
- **Onboarding gate**: if profile incomplete, route to onboarding screens.
- **Package switcher (📦)**: available anywhere in AppShell.
- **Drawer (☰)**: global shortcuts + role-gated admin/provider entries.
- **Tabs**: change per package, but keep predictable placement.

---

## Packages (Complete Coverage from `src/server.js`)

### End-user core
- **Marketplace** (`/api/marketplace`)
- **Jobs** (`/api/jobs`) + **Job Categories** (`/api/job-categories`)
- **Academy** (`/api/academy`)
- **Supplies** (`/api/supplies`)
- **Rentals** (`/api/rentals`)
- **Finance** (`/api/finance`)
- **Escrows** (`/api/escrows`)
- **LocalPro Plus** (`/api/localpro-plus`)
- **Referrals** (`/api/referrals`)
- **Agencies** (`/api/agencies`)
- **Providers** (`/api/providers`)
- **Trust Verification** (`/api/trust-verification`)
- **Communication** (`/api/communication`) + **Notifications** (`/api/notifications`)
- **Search** (`/api/search`)
- **Settings** (`/api/settings`)
- **Favorites** (`/api/favorites`)
- **Announcements** (`/api/announcements`)
- **Activities** (`/api/activities`)
- **Ads** (`/api/ads`)
- **Partners** (`/api/partners`)
- **Live Chat** (`/api/live-chat`)

### Admin / operations
- **Analytics** (`/api/analytics`)
- **Logs** (`/api/logs`)
- **Audit Logs** (`/api/audit-logs`)
- **Error Monitoring** (`/api/error-monitoring`)
- **Monitoring** (`/api/monitoring`)
- **Monitoring Alerts** (`/api/monitoring/alerts`)
- **Monitoring DB** (`/api/monitoring/database`)
- **Monitoring Stream** (`/api/monitoring/stream`)
- **DB Optimization** (`/api/database/optimization`)
- **Email Marketing** (`/api/email-marketing`)
- **Broadcaster** (`/api/broadcaster`)
- **User Management** (`/api/users`)
- **Admin Live Chat** (`/api/admin/live-chat`)

### Integrations / utility (usually embedded)
- **Maps** (`/api/maps`)
- **PayPal** (`/api/paypal`)
- **PayMaya** (`/api/paymaya`)
- **PayMongo** (`/api/paymongo`)
- **AI Marketplace** (`/api/ai/marketplace`)
- **AI Users** (`/api/ai/users`)
- **Registration** (`/api/registration`)

---

## Recommended Default Tabs (by package)

### Marketplace
- Home • Search • Bookings • Chat • Profile

### Jobs
- Jobs • Search • Applications • Post • Profile

### Finance
- Wallet • Transactions • Top-ups/Withdraw • Reports • Profile

### Academy
- Courses • My Courses • Favorites • Certificates • Profile

### Supplies
- Shop • Search • Orders • My Supplies (supplier) • Profile

### Rentals
- Browse • Search • Bookings • My Rentals (provider) • Profile

### Communication
- Messages • Notifications • Search • Profile

### Admin Console (if admin)
- Dashboard • Queues • Search • Reports • Profile

---

## Files

- `MOBILE_LAYOUT_DESIGN.md` — full IA + package registry
- `MOBILE_LAYOUT_IMPLEMENTATION.md` — React Native navigation skeleton
- `MOBILE_LAYOUT_QUICK_REFERENCE.md` — this cheat sheet

**Last Updated**: 2025-12-25


