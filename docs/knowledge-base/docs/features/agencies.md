# Agencies Feature

## Overview

The Agencies feature enables multi-provider organizations to manage teams of service providers under a single agency.

## Key Features

- **Agency Management** - Create and manage agencies
- **Team Management** - Add/remove providers
- **Agency Profiles** - Agency information and branding
- **Bulk Operations** - Manage multiple providers
- **Agency Analytics** - Performance metrics

## API Endpoints

### Agencies

```
GET    /api/agencies                 # List agencies
GET    /api/agencies/:id             # Get agency details
POST   /api/agencies                 # Create agency (agency_owner)
PUT    /api/agencies/:id             # Update agency
DELETE /api/agencies/:id             # Delete agency
```

### Agency Members

```
GET    /api/agencies/:id/members     # Get agency members
POST   /api/agencies/:id/members     # Add member
DELETE /api/agencies/:id/members/:memberId  # Remove member
```

### Admin Endpoints

```
GET    /api/agencies/pending         # Get pending agencies
PUT    /api/agencies/:id/approve     # Approve agency
PUT    /api/agencies/:id/reject      # Reject agency
```

## Roles

- **agency_owner** - Full agency control
- **agency_admin** - Agency administration
- **provider** - Agency member

## Data Model

```typescript
interface Agency {
  _id: string;
  name: string;
  description: string;
  owner: User;
  members: User[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
```

## Related Features

- [Providers](../api/endpoints.md#providers) - Provider management
- [Marketplace](./marketplace.md) - Service marketplace

