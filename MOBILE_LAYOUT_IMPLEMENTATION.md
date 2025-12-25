# 📱 Mobile Layout Implementation (React Native) — Package Switcher + Drawer + Tabs

This is an implementation-oriented companion to `MOBILE_LAYOUT_DESIGN.md`.

It shows a **package registry pattern** so you can:
- define packages once
- filter by role/feature flags
- generate **drawer items** + **tab navigators** dynamically
- keep navigation consistent across 40+ backend modules

---

## ✅ 1) Suggested Tech Choices

- **React Native** (Expo or bare)
- **React Navigation**
  - `@react-navigation/native`
  - `@react-navigation/native-stack`
  - `@react-navigation/drawer`
  - `@react-navigation/bottom-tabs`
- **State**: Zustand or Redux Toolkit
- **API**: axios + token interceptor
- **Persistence**: AsyncStorage (last package, per-package last tab)

---

## ✅ 2) Core Types (Package Registry)

```ts
export type Role =
  | 'client'
  | 'provider'
  | 'supplier'
  | 'instructor'
  | 'agency_owner'
  | 'agency_admin'
  | 'admin';

export type PackageId =
  | 'marketplace'
  | 'jobs'
  | 'finance'
  | 'academy'
  | 'supplies'
  | 'rentals'
  | 'referrals'
  | 'communication'
  | 'providers'
  | 'agencies'
  | 'trust_verification'
  | 'localpro_plus'
  | 'escrows'
  | 'ads'
  | 'announcements'
  | 'activities'
  | 'favorites'
  | 'search'
  | 'settings'
  | 'admin_console';

export type TabId = string;

export type FeatureFlags = Record<string, boolean>;

export type TabConfig = {
  id: TabId;
  label: string;
  icon: string; // map to icon library
  screen: React.ComponentType<any>;
  badgeKey?: string; // e.g. "notificationsUnread"
};

export type PackageConfig = {
  id: PackageId;
  title: string;
  icon: string;
  category:
    | 'core'
    | 'social'
    | 'trust'
    | 'admin'
    | 'support'
    | 'utilities';
  apiBasePaths: string[]; // e.g. ["/api/marketplace"]
  visibleTo: Role[]; // role gating
  featureFlagKeys?: string[]; // optional gating by app settings
  tabs: TabConfig[];
  drawerItems?: { id: string; label: string; icon: string; route: string }[];
};
```

---

## ✅ 3) Package Registry Example (Minimal)

```ts
import { PackageConfig } from './types';

import MarketplaceHomeScreen from '../packages/marketplace/screens/Home';
import MarketplaceSearchScreen from '../packages/marketplace/screens/Search';
import MarketplaceBookingsScreen from '../packages/marketplace/screens/Bookings';
import MessagesScreen from '../packages/communication/screens/Messages';
import ProfileScreen from '../packages/account/screens/Profile';

export const PACKAGES: PackageConfig[] = [
  {
    id: 'marketplace',
    title: 'Marketplace',
    icon: 'storefront',
    category: 'core',
    apiBasePaths: ['/api/marketplace'],
    visibleTo: ['client', 'provider', 'admin', 'agency_owner', 'agency_admin'],
    tabs: [
      { id: 'home', label: 'Home', icon: 'home', screen: MarketplaceHomeScreen },
      { id: 'search', label: 'Search', icon: 'search', screen: MarketplaceSearchScreen },
      { id: 'bookings', label: 'Bookings', icon: 'clipboard', screen: MarketplaceBookingsScreen },
      { id: 'messages', label: 'Chat', icon: 'chat', screen: MessagesScreen },
      { id: 'profile', label: 'Profile', icon: 'person', screen: ProfileScreen },
    ],
  },
  // … add other packages following MOBILE_LAYOUT_DESIGN.md’s registry
];
```

---

## ✅ 4) Role + Feature Flag Filtering

```ts
export function filterPackagesForUser(
  all: PackageConfig[],
  role: Role,
  flags: FeatureFlags
) {
  return all.filter((pkg) => {
    if (!pkg.visibleTo.includes(role)) return false;
    if (!pkg.featureFlagKeys?.length) return true;
    return pkg.featureFlagKeys.every((k) => flags[k] !== false);
  });
}
```

Feature flags can come from:
- `GET /api/settings/app/public` (public)
- admin toggles: `POST /api/settings/app/features/toggle`

---

## ✅ 5) Navigation Structure

### Root Navigator

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const RootStack = createNativeStackNavigator();

export default function AppRoot() {
  const { isAuthenticated, onboardingRequired } = useAuthStore();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthStack} />
        ) : onboardingRequired ? (
          <RootStack.Screen name="Onboarding" component={OnboardingStack} />
        ) : (
          <RootStack.Screen name="AppShell" component={AppShell} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
```

### AppShell = Drawer + Package Tabs

```tsx
import { createDrawerNavigator } from '@react-navigation/drawer';

const Drawer = createDrawerNavigator();

export function AppShell() {
  return (
    <Drawer.Navigator
      screenOptions={{ header: (props) => <AppHeader {...props} /> }}
      drawerContent={(props) => <AppDrawer {...props} />}
    >
      <Drawer.Screen name="PackageTabs" component={PackageTabsHost} />
    </Drawer.Navigator>
  );
}
```

### PackageTabsHost = Dynamic Tab Navigator

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tabs = createBottomTabNavigator();

export function PackageTabsHost() {
  const { currentPackageId } = usePackageStore();
  const pkg = usePackageRegistry().byId[currentPackageId];

  return (
    <Tabs.Navigator>
      {pkg.tabs.map((t) => (
        <Tabs.Screen
          key={t.id}
          name={`${pkg.id}:${t.id}`}
          component={t.screen}
          options={{
            tabBarLabel: t.label,
            // tabBarIcon: ...
          }}
        />
      ))}
    </Tabs.Navigator>
  );
}
```

---

## ✅ 6) Header: ☰ + Package Title + 📦 Switcher + 🔔 + 👤

Header responsibilities:
- open drawer (☰)
- show current package name
- open package switcher (📦)
- show notifications count (🔔)
- open profile / settings (👤)

Package switcher can be a bottom sheet:
- recent packages
- grouped categories
- search

Store:
- `currentPackageId`
- `recentPackageIds[]`
- `lastTabByPackage[pkgId]`

---

## ✅ 7) API Client (Token + Correlation)

```ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL, // e.g. http://localhost:4000
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // optional: correlation id header
  return config;
});
```

---

## ✅ 8) Screen → Endpoint Conventions (Examples)

### Marketplace Home
- `GET /api/marketplace/services`
- `GET /api/marketplace/services/categories`
- `GET /api/marketplace/services/nearby`

### Messages
- `GET /api/communication/conversations`
- `GET /api/communication/conversations/:id/messages`
- `POST /api/communication/conversations/:id/messages`

### Notifications badge
- `GET /api/notifications/unread-count`

---

## ✅ 9) How to keep it “complete”

If you add a new backend module:
1. mount it in `src/server.js` (already done here)
2. add it as a PackageConfig entry (or embed into an existing package)
3. expose via role gates + feature flags

This keeps mobile navigation aligned with the monorepo “packages” strategy.

---

**Status**: ✅ Recreated (implementation guide)  
**Last Updated**: 2025-12-25


