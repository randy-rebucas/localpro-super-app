# LocalPro Plus - Manual Subscription Management API Payloads

This document provides example payloads for the admin manual subscription management endpoints.

---

## 1. Create Manual Subscription

**Endpoint:** `POST /api/localpro-plus/admin/subscriptions`  
**Access:** Admin Only  
**Content-Type:** `application/json`

### Request Payload

```json
{
  "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "planId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "billingCycle": "monthly",
  "startDate": "2025-01-15",
  "endDate": "2025-02-15",
  "reason": "Free trial for new user",
  "notes": "Promotional subscription"
}
```

### Request Body Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `userId` | String | Yes | User ID to assign subscription | `"65a1b2c3d4e5f6g7h8i9j0k1"` |
| `planId` | String | Yes | Subscription plan ID | `"65a1b2c3d4e5f6g7h8i9j0k2"` |
| `billingCycle` | String | No | Billing cycle (monthly/yearly) | `"monthly"` or `"yearly"` |
| `startDate` | String | No | Subscription start date (ISO format) | `"2025-01-15"` |
| `endDate` | String | No | Subscription end date (ISO format) | `"2025-02-15"` |
| `reason` | String | No | Reason for manual subscription | `"Free trial for new user"` |
| `notes` | String | No | Additional admin notes | `"Promotional subscription"` |

### Success Response (201)

```json
{
  "success": true,
  "message": "Manual subscription created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "plan": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Premium",
      "description": "Premium plan with advanced features"
    },
    "status": "active",
    "billingCycle": "monthly",
    "paymentMethod": "manual",
    "isManual": true,
    "manualDetails": {
      "createdBy": "65a1b2c3d4e5f6g7h8i9j0k4",
      "reason": "Free trial for new user",
      "notes": "Promotional subscription"
    },
    "startDate": "2025-01-15T00:00:00.000Z",
    "endDate": "2025-02-15T00:00:00.000Z",
    "nextBillingDate": "2025-02-15T00:00:00.000Z"
  }
}
```

### Error Responses

**400 - Missing Fields:**
```json
{
  "success": false,
  "message": "User ID and Plan ID are required"
}
```

**404 - User Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**404 - Plan Not Found:**
```json
{
  "success": false,
  "message": "Plan not found"
}
```

**400 - Active Subscription Exists:**
```json
{
  "success": false,
  "message": "User already has an active subscription",
  "data": {
    "existingSubscriptionId": "65a1b2c3d4e5f6g7h8i9j0k5"
  }
}
```

---

## 2. Get All Subscriptions

**Endpoint:** `GET /api/localpro-plus/admin/subscriptions`  
**Access:** Admin Only

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | Number | No | Page number (default: 1) | `1` |
| `limit` | Number | No | Items per page (default: 20) | `20` |
| `status` | String | No | Filter by status | `active`, `cancelled`, `expired`, `suspended`, `pending` |
| `planId` | String | No | Filter by plan ID | `"65a1b2c3d4e5f6g7h8i9j0k2"` |
| `isManual` | Boolean | No | Filter manual subscriptions | `true` or `false` |

### Example Request

```http
GET /api/localpro-plus/admin/subscriptions?page=1&limit=20&status=active&isManual=true
Authorization: Bearer <admin_token>
```

### Success Response (200)

```json
{
  "success": true,
  "count": 20,
  "total": 150,
  "page": 1,
  "pages": 8,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "user": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "plan": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "name": "Premium",
        "description": "Premium plan"
      },
      "status": "active",
      "isManual": true,
      "startDate": "2025-01-15T00:00:00.000Z",
      "endDate": "2025-02-15T00:00:00.000Z"
    }
  ]
}
```

---

## 3. Get Subscription by User ID

**Endpoint:** `GET /api/localpro-plus/admin/subscriptions/user/:userId`  
**Access:** Admin Only

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | String | Yes | User ID |

### Example Request

```http
GET /api/localpro-plus/admin/subscriptions/user/65a1b2c3d4e5f6g7h8i9j0k1
Authorization: Bearer <admin_token>
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890"
    },
    "plan": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Premium",
      "description": "Premium plan with advanced features",
      "price": {
        "monthly": 39.99,
        "yearly": 399.99,
        "currency": "USD"
      },
      "features": [...],
      "limits": {...},
      "benefits": [...]
    },
    "status": "active",
    "billingCycle": "monthly",
    "paymentMethod": "manual",
    "isManual": true,
    "manualDetails": {
      "createdBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@localpro.com"
      },
      "reason": "Free trial for new user",
      "notes": "Promotional subscription"
    },
    "startDate": "2025-01-15T00:00:00.000Z",
    "endDate": "2025-02-15T00:00:00.000Z",
    "usage": {
      "services": { "current": 5, "limit": 50 },
      "bookings": { "current": 12, "limit": 100 },
      "storage": { "current": 1024, "limit": 10000 },
      "apiCalls": { "current": 500, "limit": 5000 }
    },
    "features": {
      "prioritySupport": true,
      "advancedAnalytics": true,
      "customBranding": true,
      "apiAccess": true,
      "whiteLabel": false
    }
  }
}
```

### Error Response (404)

```json
{
  "success": false,
  "message": "No subscription found for this user"
}
```

---

## 4. Update Manual Subscription

**Endpoint:** `PUT /api/localpro-plus/admin/subscriptions/:subscriptionId`  
**Access:** Admin Only  
**Content-Type:** `application/json`

### Request Payload

```json
{
  "planId": "65a1b2c3d4e5f6g7h8i9j0k6",
  "status": "active",
  "startDate": "2025-01-15",
  "endDate": "2025-12-31",
  "billingCycle": "yearly",
  "reason": "Plan upgrade",
  "notes": "Extended subscription for 1 year"
}
```

### Request Body Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `planId` | String | No | New plan ID (upgrade/downgrade) | `"65a1b2c3d4e5f6g7h8i9j0k6"` |
| `status` | String | No | Subscription status | `active`, `cancelled`, `expired`, `suspended`, `pending` |
| `startDate` | String | No | New start date (ISO format) | `"2025-01-15"` |
| `endDate` | String | No | New end date (ISO format) | `"2025-12-31"` |
| `billingCycle` | String | No | Billing cycle | `"monthly"` or `"yearly"` |
| `reason` | String | No | Reason for update | `"Plan upgrade"` |
| `notes` | String | No | Additional admin notes | `"Extended subscription for 1 year"` |

### Success Response (200)

```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "firstName": "John",
      "lastName": "Doe"
    },
    "plan": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "name": "Enterprise",
      "description": "Enterprise plan"
    },
    "status": "active",
    "endDate": "2025-12-31T00:00:00.000Z",
    "billingCycle": "yearly"
  }
}
```

### Error Responses

**404 - Subscription Not Found:**
```json
{
  "success": false,
  "message": "Subscription not found"
}
```

**400 - Not Manual Subscription:**
```json
{
  "success": false,
  "message": "Only manual subscriptions can be updated by admin"
}
```

---

## 5. Delete/Cancel Manual Subscription

**Endpoint:** `DELETE /api/localpro-plus/admin/subscriptions/:subscriptionId`  
**Access:** Admin Only  
**Content-Type:** `application/json`

### Request Payload

```json
{
  "reason": "User requested cancellation"
}
```

### Request Body Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `reason` | String | No | Cancellation reason | `"User requested cancellation"` |

### Success Response (200)

```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "status": "cancelled",
    "cancelledAt": "2025-01-15T10:30:00.000Z",
    "cancellationReason": "User requested cancellation"
  }
}
```

### Error Responses

**404 - Subscription Not Found:**
```json
{
  "success": false,
  "message": "Subscription not found"
}
```

**400 - Not Manual Subscription:**
```json
{
  "success": false,
  "message": "Only manual subscriptions can be deleted by admin. Use cancel endpoint for regular subscriptions."
}
```

---

## Complete Example Workflow

### Step 1: Admin Creates Manual Subscription

```javascript
// Create manual subscription for user
const createSubscription = async (userId, planId) => {
  const response = await fetch('/api/localpro-plus/admin/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      planId: planId,
      billingCycle: 'monthly',
      startDate: '2025-01-15',
      endDate: '2025-02-15',
      reason: 'Free trial for new user',
      notes: 'Promotional subscription'
    })
  });

  return await response.json();
};
```

### Step 2: Admin Views All Subscriptions

```javascript
// Get all subscriptions with filters
const getAllSubscriptions = async (filters = {}) => {
  const queryParams = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 20,
    ...(filters.status && { status: filters.status }),
    ...(filters.isManual && { isManual: filters.isManual })
  });

  const response = await fetch(
    `/api/localpro-plus/admin/subscriptions?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }
  );

  return await response.json();
};
```

### Step 3: Admin Updates Subscription

```javascript
// Update subscription (upgrade plan, extend dates, etc.)
const updateSubscription = async (subscriptionId, updates) => {
  const response = await fetch(
    `/api/localpro-plus/admin/subscriptions/${subscriptionId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planId: updates.planId,
        status: updates.status,
        endDate: updates.endDate,
        reason: updates.reason,
        notes: updates.notes
      })
    }
  );

  return await response.json();
};
```

### Step 4: Admin Cancels Subscription

```javascript
// Cancel manual subscription
const cancelSubscription = async (subscriptionId, reason) => {
  const response = await fetch(
    `/api/localpro-plus/admin/subscriptions/${subscriptionId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: reason || 'Admin cancellation'
      })
    }
  );

  return await response.json();
};
```

---

## Use Cases

### 1. Free Trial
```json
{
  "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "planId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "billingCycle": "monthly",
  "startDate": "2025-01-15",
  "endDate": "2025-02-15",
  "reason": "Free 30-day trial",
  "notes": "New user promotional offer"
}
```

### 2. Corporate Account
```json
{
  "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "planId": "65a1b2c3d4e5f6g7h8i9j0k7",
  "billingCycle": "yearly",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "reason": "Corporate account setup",
  "notes": "Annual corporate subscription - invoice #INV-2025-001"
}
```

### 3. Compensatory Subscription
```json
{
  "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "planId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "billingCycle": "monthly",
  "startDate": "2025-01-15",
  "endDate": "2025-04-15",
  "reason": "Service issue compensation",
  "notes": "3 months free subscription due to platform outage"
}
```

---

## Notes

- **Manual Subscriptions**: Only subscriptions created via admin endpoints can be updated/deleted by admin
- **Regular Subscriptions**: Regular subscriptions (created via payment) should use the cancel endpoint
- **Email Notifications**: Users receive email notifications when subscriptions are created, updated, or cancelled
- **Subscription History**: All changes are tracked in the subscription history
- **Usage Limits**: Automatically set based on the selected plan
- **Features**: Automatically enabled based on plan features

