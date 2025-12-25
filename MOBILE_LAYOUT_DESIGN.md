# 📱 Mobile Layout Design (Super App Packages) — LocalPro

This document defines a **mobile navigation layout** for the LocalPro Super App, including:
- **Authentication flow**
- **Global drawer**
- **Package-specific bottom tabs**
- A **Package Switcher (📦)** to jump between packages from anywhere

It is written to be **complete across this app’s API surface**, based on what is mounted in `src/server.js` and implemented in `src/routes/*`.

---

## ✅ 1) Navigation Architecture (High-Level)

**Root decision:** authenticated vs unauthenticated.

```
Root
├─ AuthStack (unauthenticated / onboarding)
│  ├─ PhoneEntry
│  ├─ OTPVerify
│  ├─ Onboarding (profile completion)
│  └─ (optional) RoleSelect / ProviderUpgrade
│
└─ AppShell (authenticated)
   ├─ Header (☰ + Current Package + 📦 switcher + 🔔 + 👤)
   ├─ Drawer (global)
   └─ PackageNavigator (bottom tabs per package)
```

---

## ✅ 2) Global “Package Switcher” (📦)

### Placement
- **Persistent in header** as a **📦 icon**.
- Optional: long-press on header title to open switcher.

### Behavior
- Opens a modal/bottom-sheet showing **packages available to the current user** (filtered by role + feature flags).
- Shows **recent packages** first, then grouped categories.
- Switch preserves each package’s **last visited tab/screen**.

### Package categories (suggested)
- **Core**: Marketplace, Jobs, Finance, Academy, Supplies, Rentals
- **Social/Engagement**: Referrals, Communication, Announcements, Activities, Favorites
- **Trust & Business**: Providers, Agencies, Trust Verification, Partners
- **Admin/Operations**: Analytics, Logs, Audit Logs, Error Monitoring, Monitoring, Database Optimization, Email Marketing, Broadcaster
- **Developer/Integrations** (optional hidden): Maps, PayPal/PayMaya/PayMongo tools

---

## ✅ 3) Authentication Layout (AuthStack)

### Screens & API mapping
- **Phone entry**
  - `POST /api/auth/send-code`
- **OTP verify**
  - `POST /api/auth/verify-code`
- **Onboarding / profile completion**
  - `POST /api/auth/complete-onboarding`
  - `GET /api/auth/profile-completeness`
  - `GET /api/auth/me`
  - `PUT /api/auth/profile`
  - `POST /api/auth/upload-avatar`
  - `POST /api/auth/upload-portfolio`
- **Logout**
  - `POST /api/auth/logout`

### Notes
- The backend supports “smart redirection” based on profile completeness (see `/api/auth/profile-completeness`).
- In mobile, keep onboarding as a **stepper** but allow partial completion with “continue later”.

---

## ✅ 4) Drawer Layout (Global)

### Drawer sections
- **User header** (avatar, name, role badges, trust score snippet)
- **Current package** (icon + name + “Switch package” entry)
- **Global links** (available everywhere)
  - Search
  - Notifications
  - Messages
  - Favorites
  - Settings
- **Role-specific links**
  - Provider Dashboard (if provider)
  - Agency tools (if agency roles)
  - Admin Console (if admin)
- **Support**
  - Live Chat
  - Help
- Logout

### Backing APIs commonly used by drawer items
- **Profile**: `GET /api/auth/me`
- **Notifications**: `GET /api/notifications` or `GET /api/communication/notifications`
- **Messages**: `GET /api/communication/conversations`
- **Favorites**: `GET /api/favorites`
- **Settings**: `GET /api/settings/user`, `GET /api/settings/app/public`

---

## ✅ 5) Bottom Tabs (Package-Specific)

**Rule:** each package should have **4–5 predictable tabs**; keep one tab always **Profile** or **More**.

### Default tab templates
- **Browse package**: Home / Search / My Items / Messages / Profile
- **Commerce package**: Browse / Search / Orders/Bookings / Wallet/Payments / Profile
- **Admin package**: Dashboard / Queue / Search / Reports / Profile

---

## ✅ 6) Package Registry (Complete Coverage)

This registry lists **every API prefix mounted in `src/server.js`**, so the mobile IA can cover the entire app.

> Each package’s “Full endpoint list” is in the corresponding `src/routes/<name>.js`.

### Core user-facing packages

| Package | Icon | Base API | Primary users | Suggested Tabs |
|---|---:|---|---|---|
| Auth | 🔐 | `/api/auth` | all | (AuthStack) |
| Marketplace | 🏪 | `/api/marketplace` | client/provider/admin | Home / Search / Bookings / Messages / Profile |
| Jobs | 💼 | `/api/jobs` | client/provider/admin | Home / Search / Applications / Post / Profile |
| Job Categories | 🗂️ | `/api/job-categories` | (mostly browsing/admin) | usually embedded in Jobs |
| Supplies | 📦 | `/api/supplies` | client/supplier/admin | Shop / Search / Orders / My Supplies / Profile |
| Rentals | 🚗 | `/api/rentals` | client/provider/admin | Browse / Search / Bookings / My Rentals / Profile |
| Academy | 🎓 | `/api/academy` | client/instructor/admin | Courses / My Courses / Favorites / Certificates / Profile |
| Finance | 💰 | `/api/finance` | client/provider/admin | Wallet / Transactions / Payouts / Reports / Profile |
| Escrows | 🛡️ | `/api/escrows` | client/provider/admin | Escrows / Disputes / Proof / Payout / Profile |
| Subscriptions (LocalPro Plus) | ⭐ | `/api/localpro-plus` | all | Plans / My Subscription / Usage / Billing / Profile |
| Referrals | 🔗 | `/api/referrals` | all | Refer / Stats / Rewards / Leaderboard / Profile |
| Agencies | 🏢 | `/api/agencies` | agency roles/admin | Browse / My Agencies / Team / Analytics / Profile |
| Providers | 👷 | `/api/providers` | providers/admin/public | Browse / Dashboard / Onboarding / Verification / Profile |
| Trust Verification | ✅ | `/api/trust-verification` | all/admin | Requests / Documents / Verified / Profile |
| Communication | 💬 | `/api/communication` | all | Messages / Notifications / Search / Profile |
| Notifications | 🔔 | `/api/notifications` | all | usually embedded (also mirrored under communication) |
| Search | 🔍 | `/api/search` | all | Global / Suggestions / Trending / Categories / Profile |
| Settings | ⚙️ | `/api/settings` | all/admin | User Settings / Security / Preferences / App Info / Profile |
| Favorites | ⭐ | `/api/favorites` | all | Favorites / Collections / Stats / Profile |
| Announcements | 📢 | `/api/announcements` | all/admin | Feed / My Announcements / Comments / Profile |
| Activities | 🧾 | `/api/activities` | all/admin | Feed / My Activity / Leaderboard / Stats / Profile |
| Ads | 📣 | `/api/ads` | advertiser/admin | Browse / My Ads / Create / Analytics / Profile |
| Partners | 🤝 | `/api/partners` | partners/admin | Directory / Onboarding / Integrations / Notes / Profile |
| Live Chat | 🆘 | `/api/live-chat` | all | Chat / Tickets / Attachments / Profile |

### Platform / admin / operations packages

| Package | Icon | Base API | Primary users | Suggested Tabs |
|---|---:|---|---|---|
| Admin Live Chat | 🛠️ | `/api/admin/live-chat` | admin | Inbox / Queues / Agents / Settings / Profile |
| Analytics | 📊 | `/api/analytics` | admin/provider | Dashboard / Time Series / Reports / Export / Profile |
| Logs | 📋 | `/api/logs` | admin | Search / Trends / Slow Ops / Export / Profile |
| Audit Logs | 🧷 | `/api/audit-logs` | admin | Feed / Filters / Export / Stats / Profile |
| Error Monitoring | 🚨 | `/api/error-monitoring` | admin | Summary / Unresolved / Detail / Resolve / Profile |
| Monitoring | 🩺 | `/api/monitoring` | admin | Overview / Alerts / Database / Stream / Profile |
| Monitoring Alerts | ⏰ | `/api/monitoring/alerts` | admin | Alerts / Rules / History / Profile |
| Monitoring Database | 🗄️ | `/api/monitoring/database` | admin | Health / Queries / Slow / Profile |
| Monitoring Stream | 📡 | `/api/monitoring/stream` | admin | Live / Filters / Profile |
| Database Optimization | 🧠 | `/api/database/optimization` | admin | Report / Recommendations / Backups / Restore / Profile |
| Email Marketing | ✉️ | `/api/email-marketing` | admin | Campaigns / Subscribers / Analytics / Templates / Profile |
| Broadcaster | 📻 | `/api/broadcaster` | admin | Broadcasts / Segments / Schedule / Profile |
| User Management | 👥 | `/api/users` | admin/manager | Users / Bulk Ops / Verification / Stats / Profile |
| Registration | 🧷 | `/api/registration` | all | usually embedded in Auth/Onboarding |

### Integrations / utility (usually not top-level packages)

| Module | Base API | Usage in mobile |
|---|---|---|
| Maps | `/api/maps` | Address picker, geocode, distance, service-area validation |
| PayPal | `/api/paypal` | Webhook + admin debug screens (usually hidden) |
| PayMaya | `/api/paymaya` | Payment flows (if PayMaya checkout used client-side) |
| PayMongo | `/api/paymongo` | Payment intent + confirm flows (if used client-side) |
| AI Marketplace | `/api/ai/marketplace` | Recommendations, matching, assistants (optional package) |
| AI Users | `/api/ai/users` | Profile suggestions, scoring (optional package) |

> Webhooks are mounted at `/webhooks/*` (e.g., escrow webhooks) and are **not** part of the mobile UI.

---

## ✅ 7) “Package” → Tabs → Key Endpoints (Concrete Examples)

Below are **high-signal** endpoints per package. For exhaustive lists, see `src/routes/*.js`.

### Marketplace (`/api/marketplace`)
- **Home/Services**: `GET /services`, `GET /services/:id`, `GET /services/categories`, `GET /services/nearby`
- **Providers**: `GET /providers/:id`, `GET /providers/:providerId/services`, `GET /services/:id/providers`
- **Bookings**: `POST /bookings`, `GET /bookings`, `GET /bookings/:id`, `GET /my-bookings`, `PUT /bookings/:id/status`, `POST /bookings/:id/photos`, `POST /bookings/:id/review`
- **Payments (PayPal)**: `POST /bookings/paypal/approve`, `GET /bookings/paypal/order/:orderId`

### Jobs (`/api/jobs`)
- Browse/search: `GET /`, `GET /search`, `GET /categories`
- Applications: `POST /:id/apply`, `GET /my-applications`
- Employer: `POST /`, `GET /my-jobs`, `PUT /:id`, `DELETE /:id`, `GET /:id/stats`, `GET /:id/applications`, `PUT /:id/applications/:applicationId/status`

### Finance (`/api/finance`)
- Overview: `GET /overview`
- Transactions: `GET /transactions`, `GET /earnings`, `GET /expenses`, `POST /expenses`
- Top-ups: `POST /top-up`, `GET /top-ups/my-requests` (admin: `GET /top-ups`, `PUT /top-ups/:topUpId/process`)
- Withdrawals: `POST /withdraw` (admin: `PUT /withdrawals/:withdrawalId/process`)
- Settings: `PUT /wallet/settings`

### Escrows (`/api/escrows`)
- User escrows: `GET /`, `GET /:id`, `GET /:id/transactions`, `GET /:id/payout`
- Actions: `POST /create`, `POST /:id/capture`, `POST /:id/refund`, `POST /:id/dispute`, `POST /:id/proof`, `POST /:id/payout`

### Academy (`/api/academy`)
- Browse: `GET /courses`, `GET /courses/:id`, `GET /categories`, `GET /featured`, `GET /certifications`
- My: `GET /my-courses`, `GET /my-favorite-courses`, `POST /courses/:id/enroll`, `PUT /courses/:id/progress`
- Social: `POST /courses/:id/reviews`, `POST /courses/:id/favorite`, `DELETE /courses/:id/favorite`

### Communication (`/api/communication`) and Notifications (`/api/notifications`)
- Conversations: `GET /conversations`, `POST /conversations`, `GET /conversations/:id`, `DELETE /conversations/:id`
- Messages: `GET /conversations/:id/messages`, `POST /conversations/:id/messages`, `PUT /conversations/:id/messages/:messageId`, `DELETE /conversations/:id/messages/:messageId`
- Notifications (also mirrored): `GET /notifications`, `GET /notifications/count`, `PUT /notifications/:notificationId/read`, `PUT /notifications/read-all`, `DELETE /notifications/:notificationId`
- Push tokens/settings: via `/api/notifications/*` routes

---

## ✅ 8) Role-Based Visibility Rules (Recommended)

Use a simple gating strategy:
- **Feature flags**: from `/api/settings/app/public` (and admin toggles under `/api/settings/app/features/toggle`)
- **Role gates**: derived from JWT + `/api/auth/me`

Suggested package availability:
- **Client**: Marketplace, Jobs, Academy, Supplies, Rentals, Finance (read), Referrals, Communication, Search, Favorites, Announcements, Activities, Settings
- **Provider**: all client packages + Providers, Agency (if member), Escrows, limited Analytics (provider), Rentals “My Rentals”
- **Supplier/Advertiser**: Supplies “My Supplies”, Ads “My Ads”
- **Instructor**: Academy “My Created Courses”, course management tabs
- **Admin**: all packages + Admin Console packages (Logs/Audit/Error/Monitoring/DB/Email Marketing/User Mgmt)

---

## ✅ 9) “Complete Coverage” Checklist (for this repo)

These are **all API mounts** from `src/server.js` that the mobile IA should account for:
- `/api/auth`
- `/api/marketplace`
- `/api/supplies`
- `/api/academy`
- `/api/finance`
- `/api/rentals`
- `/api/ads`
- `/api/facility-care`
- `/api/localpro-plus`
- `/api/trust-verification`
- `/api/communication`
- `/api/analytics`
- `/api/maps`
- `/api/paypal`
- `/api/paymaya`
- `/api/paymongo`
- `/api/jobs`
- `/api/job-categories`
- `/api/referrals`
- `/api/agencies`
- `/api/settings`
- `/api/error-monitoring`
- `/api/audit-logs`
- `/api/providers`
- `/api/logs`
- `/api/users`
- `/api/search`
- `/api/announcements`
- `/api/activities`
- `/api/registration`
- `/api/broadcaster`
- `/api/favorites`
- `/api/ai/marketplace`
- `/api/ai/users`
- `/api/escrows`
- `/api/monitoring`
- `/api/monitoring/alerts`
- `/api/monitoring/database`
- `/api/monitoring/stream`
- `/api/database/optimization`
- `/api/live-chat`
- `/api/admin/live-chat`
- `/api/notifications`
- `/api/email-marketing`
- `/api/partners`

---

**Status**: ✅ Recreated (design) — complete package coverage for this repo  
**Last Updated**: 2025-12-25


