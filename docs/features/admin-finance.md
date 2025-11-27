# Admin Finance Management Documentation

## Overview

The Admin Finance Management system provides administrators with comprehensive tools to manage financial operations on the platform. Admins can review, approve, or reject withdrawal and top-up requests from users, ensuring secure and controlled financial transactions.

## Table of Contents

1. [Features](#features)
2. [Admin Endpoints](#admin-endpoints)
3. [Withdrawal Management](#withdrawal-management)
4. [Top-Up Management](#top-up-management)
5. [Workflows](#workflows)
6. [Request/Response Examples](#requestresponse-examples)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)
9. [Security & Authorization](#security--authorization)
10. [Email Notifications](#email-notifications)
11. [Best Practices](#best-practices)

---

## Features

- **Withdrawal Processing**: Review and process user withdrawal requests
- **Top-Up Approval**: Verify and approve/reject wallet top-up requests
- **Request Management**: View all financial requests across all users
- **Status Filtering**: Filter requests by status (pending, approved, rejected)
- **User Information**: View user details with each request
- **Audit Trail**: Track who processed requests and when
- **Email Notifications**: Automatic notifications to users on status changes
- **Admin Notes**: Add notes for audit and reference purposes

---

## Admin Endpoints

### Base Path
`/api/finance`

All admin endpoints require:
- **Authentication**: Valid JWT token
- **Authorization**: `admin` role

---

## Withdrawal Management

### 1. Process Withdrawal Request

**Endpoint**: `PUT /api/finance/withdrawals/:withdrawalId/process`

**Access**: Admin only

**Description**: Approve or reject a user's withdrawal request. When a user requests a withdrawal, funds are moved from their available balance to pending balance. Admin processing determines whether the withdrawal is completed or funds are returned.

**URL Parameters**:
- `withdrawalId` (required): The transaction ID of the withdrawal request

**Request Body**:
```json
{
  "status": "approved" | "rejected",
  "adminNotes": "Optional notes from admin"
}
```

**Status Values**:
- `approved`: Withdrawal is approved, funds are removed from pending balance (already deducted from balance)
- `rejected`: Withdrawal is rejected, funds are returned from pending balance to available balance

**Behavior**:
- **If Approved**:
  - Status changes to `completed`
  - Funds removed from `pendingBalance` (already deducted from `balance` when requested)
  - Transaction marked as completed
  - User receives email notification
  - Admin and timestamp recorded

- **If Rejected**:
  - Status changes to `cancelled`
  - Funds returned from `pendingBalance` to `balance`
  - User receives email notification
  - Admin and timestamp recorded

**Validation**:
- Withdrawal must exist
- Withdrawal must have `pending` status
- Status must be either `approved` or `rejected`

---

## Top-Up Management

### 1. Get All Top-Up Requests

**Endpoint**: `GET /api/finance/top-ups`

**Access**: Admin only

**Description**: Retrieve all top-up requests from all users for admin review. Returns paginated results with user information.

**Query Parameters**:
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 20): Number of items per page
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`)

**Response Includes**:
- Top-up request details (amount, payment method, receipt, etc.)
- User information (name, email, avatar)
- Request status and timestamps
- Admin notes (if processed)

### 2. Process Top-Up Request

**Endpoint**: `PUT /api/finance/top-ups/:topUpId/process`

**Access**: Admin only

**Description**: Approve or reject a user's top-up request. When approved, funds are added to the user's wallet and a transaction is created.

**URL Parameters**:
- `topUpId` (required): The ID of the top-up request to process

**Request Body**:
```json
{
  "status": "approved" | "rejected",
  "adminNotes": "Optional notes from admin"
}
```

**Status Values**:
- `approved`: Top-up is approved, funds added to wallet
- `rejected`: Top-up is rejected, no funds added

**Behavior**:
- **If Approved**:
  - Status changes to `approved`
  - Transaction created (type: `topup`, status: `completed`)
  - Wallet balance increased by top-up amount
  - User receives email notification
  - Admin and timestamp recorded

- **If Rejected**:
  - Status changes to `rejected`
  - No transaction created
  - Wallet balance unchanged
  - User receives email notification
  - Admin and timestamp recorded

**Validation**:
- Top-up request must exist
- Top-up request must have `pending` status
- Status must be either `approved` or `rejected`

---

## Workflows

### Withdrawal Processing Workflow

```
┌─────────────────┐
│ User Requests   │
│ Withdrawal      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Funds Moved:    │
│ balance →       │
│ pendingBalance  │
│ Status: pending │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Admin Reviews   │
│ Request         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│Approve │ │Reject  │
└───┬────┘ └───┬────┘
    │          │
    ▼          ▼
┌────────┐ ┌──────────────┐
│Funds   │ │Funds        │
│Removed │ │Returned:    │
│from    │ │pendingBalance│
│pending │ │→ balance    │
│Status: │ │Status:      │
│completed│ │cancelled    │
└────────┘ └──────────────┘
```

### Top-Up Processing Workflow

```
┌─────────────────┐
│ User Submits    │
│ Top-Up Request  │
│ with Receipt    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Request Created │
│ Status: pending │
│ Email to Admin  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Admin Reviews   │
│ Receipt &       │
│ Details         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│Approve │ │Reject  │
└───┬────┘ └───┬────┘
    │          │
    ▼          ▼
┌────────┐ ┌────────┐
│Funds   │ │No      │
│Added   │ │Action  │
│to      │ │Status: │
│Wallet  │ │rejected│
│Transaction│       │
│Created │ │        │
│Status: │ │        │
│approved│ │        │
└────────┘ └────────┘
```

---

## Request/Response Examples

### Process Withdrawal Request

**Request**:
```http
PUT /api/finance/withdrawals/64a1b2c3d4e5f6789012345/process
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "approved",
  "adminNotes": "Payment processed successfully via bank transfer"
}
```

**Success Response (200) - Approved**:
```json
{
  "success": true,
  "message": "Withdrawal processed successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "type": "withdrawal",
    "amount": -10000,
    "category": "withdrawal",
    "description": "Withdrawal request via bank_transfer",
    "paymentMethod": "bank_transfer",
    "status": "completed",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "processedAt": "2024-01-15T11:00:00.000Z",
    "processedBy": "64a1b2c3d4e5f6789012346",
    "adminNotes": "Payment processed successfully via bank transfer",
    "accountDetails": {
      "bankName": "BPI",
      "accountNumber": "1234567890",
      "accountName": "John Doe"
    }
  }
}
```

**Success Response (200) - Rejected**:
```json
{
  "success": true,
  "message": "Withdrawal processed successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "type": "withdrawal",
    "amount": -10000,
    "status": "cancelled",
    "processedAt": "2024-01-15T11:00:00.000Z",
    "adminNotes": "Account details do not match our records"
  }
}
```

**Error Response (400) - Invalid Status**:
```json
{
  "success": false,
  "message": "Status must be either \"approved\" or \"rejected\""
}
```

**Error Response (404) - Not Found**:
```json
{
  "success": false,
  "message": "Withdrawal not found"
}
```

**Error Response (400) - Already Processed**:
```json
{
  "success": false,
  "message": "Withdrawal has already been processed"
}
```

---

### Get All Top-Up Requests

**Request**:
```http
GET /api/finance/top-ups?page=1&limit=20&status=pending
Authorization: Bearer <admin_token>
```

**Success Response (200)**:
```json
{
  "success": true,
  "count": 3,
  "total": 15,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012347",
      "amount": 100,
      "paymentMethod": "bank_transfer",
      "reference": "TXN-123456",
      "notes": "Payment for wallet top-up",
      "status": "pending",
      "requestedAt": "2024-01-15T10:30:00.000Z",
      "receipt": {
        "url": "https://res.cloudinary.com/.../receipt.jpg",
        "publicId": "localpro/finance/receipts/abc123"
      },
      "user": {
        "_id": "64a1b2c3d4e5f6789012345",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "profile": {
          "avatar": "https://res.cloudinary.com/.../avatar.jpg"
        }
      }
    },
    {
      "_id": "64a1b2c3d4e5f6789012348",
      "amount": 50,
      "paymentMethod": "paymaya",
      "status": "pending",
      "requestedAt": "2024-01-15T09:20:00.000Z",
      "receipt": {
        "url": "https://res.cloudinary.com/.../receipt2.jpg",
        "publicId": "localpro/finance/receipts/def456"
      },
      "user": {
        "_id": "64a1b2c3d4e5f6789012349",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "profile": {
          "avatar": null
        }
      }
    }
  ]
}
```

---

### Process Top-Up Request

**Request - Approve**:
```http
PUT /api/finance/top-ups/64a1b2c3d4e5f6789012347/process
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "approved",
  "adminNotes": "Payment verified successfully. Receipt matches amount."
}
```

**Success Response (200) - Approved**:
```json
{
  "success": true,
  "message": "Top-up request approved successfully",
  "data": {
    "topUpRequest": {
      "_id": "64a1b2c3d4e5f6789012347",
      "amount": 100,
      "status": "approved",
      "processedAt": "2024-01-15T11:00:00.000Z",
      "adminNotes": "Payment verified successfully. Receipt matches amount."
    },
    "newBalance": 250.00
  }
}
```

**Request - Reject**:
```http
PUT /api/finance/top-ups/64a1b2c3d4e5f6789012347/process
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "rejected",
  "adminNotes": "Receipt does not match payment amount. Please resubmit with correct receipt."
}
```

**Success Response (200) - Rejected**:
```json
{
  "success": true,
  "message": "Top-up request rejected successfully",
  "data": {
    "topUpRequest": {
      "_id": "64a1b2c3d4e5f6789012347",
      "amount": 100,
      "status": "rejected",
      "processedAt": "2024-01-15T11:00:00.000Z",
      "adminNotes": "Receipt does not match payment amount. Please resubmit with correct receipt."
    }
  }
}
```

**Error Response (400) - Invalid Status**:
```json
{
  "success": false,
  "message": "Status must be either \"approved\" or \"rejected\""
}
```

**Error Response (404) - Not Found**:
```json
{
  "success": false,
  "message": "Top-up request not found"
}
```

**Error Response (400) - Already Processed**:
```json
{
  "success": false,
  "message": "Top-up request has already been processed"
}
```

---

## Data Models

### Withdrawal Transaction

When a withdrawal is processed, the transaction object includes:

```javascript
{
  _id: ObjectId,
  type: 'withdrawal',
  amount: Number,              // Negative value (e.g., -10000)
  category: 'withdrawal',
  description: String,          // e.g., "Withdrawal request via bank_transfer"
  paymentMethod: String,        // bank_transfer, mobile_money, etc.
  accountDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  status: String,               // 'pending' | 'completed' | 'cancelled' | 'failed'
  timestamp: Date,               // When request was made
  reference: String,             // Optional reference number
  processedAt: Date,             // When admin processed it
  processedBy: ObjectId,        // Admin user ID
  adminNotes: String             // Admin notes
}
```

### Top-Up Request

```javascript
{
  _id: ObjectId,
  amount: Number,               // Top-up amount (e.g., 100)
  receipt: {
    url: String,                // Cloudinary URL
    publicId: String            // Cloudinary public ID
  },
  paymentMethod: String,        // bank_transfer, mobile_money, card, cash, paypal, paymaya
  reference: String,            // Optional payment reference
  notes: String,                // Optional user notes
  status: String,               // 'pending' | 'approved' | 'rejected'
  requestedAt: Date,            // When user submitted request
  processedAt: Date,            // When admin processed it
  processedBy: ObjectId,         // Admin user ID
  adminNotes: String            // Admin notes
}
```

### Transaction Created on Top-Up Approval

When a top-up is approved, a transaction is automatically created:

```javascript
{
  type: 'topup',
  amount: Number,               // Positive value (e.g., 100)
  category: 'topup',
  description: String,          // e.g., "Top-up via bank_transfer"
  paymentMethod: String,        // Same as top-up request
  status: 'completed',
  timestamp: Date,
  reference: String,            // From top-up request
  processedAt: Date,
  processedBy: ObjectId         // Admin user ID
}
```

---

## Error Handling

### Common Error Scenarios

#### 1. Missing Status
- **Status Code**: 400
- **Message**: "Status is required"

#### 2. Invalid Status Value
- **Status Code**: 400
- **Message**: "Status must be either \"approved\" or \"rejected\""

#### 3. Request Not Found
- **Status Code**: 404
- **Message**: "Withdrawal not found" or "Top-up request not found"

#### 4. Already Processed
- **Status Code**: 400
- **Message**: "Withdrawal has already been processed" or "Top-up request has already been processed"

#### 5. Unauthorized Access
- **Status Code**: 403
- **Message**: "Access denied. Admin role required."

#### 6. Invalid Withdrawal ID Format
- **Status Code**: 400
- **Message**: "Invalid withdrawal ID format"

#### 7. Invalid Top-Up ID Format
- **Status Code**: 400
- **Message**: "Invalid top-up ID format"

---

## Security & Authorization

### Authentication
- All admin endpoints require a valid JWT token in the `Authorization` header
- Format: `Authorization: Bearer <token>`

### Authorization
- Admin endpoints are protected by `authorize('admin')` middleware
- Only users with `admin` role can access these endpoints
- Unauthorized access returns 403 Forbidden

### Audit Trail
- All processed requests record:
  - `processedBy`: Admin user ID who processed the request
  - `processedAt`: Timestamp when request was processed
  - `adminNotes`: Optional notes from admin

### Data Protection
- User financial data is only accessible to:
  - The user themselves
  - Admins (for processing requests)
- Admin notes are stored securely and visible to admins only

---

## Email Notifications

### Withdrawal Status Update

**Trigger**: When admin processes a withdrawal request

**Recipient**: User who requested the withdrawal

**Template**: `withdrawal-status-update`

**Data**:
```javascript
{
  userName: "John Doe",
  amount: 10000,
  status: "approved", // or "rejected"
  adminNotes: "Payment processed successfully via bank transfer"
}
```

### Top-Up Status Update

**Trigger**: When admin processes a top-up request

**Recipient**: User who submitted the top-up request

**Template**: `topup-status-update`

**Data**:
```javascript
{
  userName: "John Doe",
  amount: 100,
  status: "approved", // or "rejected"
  adminNotes: "Payment verified successfully"
}
```

### New Top-Up Request Notification

**Trigger**: When user submits a top-up request

**Recipient**: Admin (from `ADMIN_EMAIL` environment variable)

**Template**: `topup-request`

**Data**:
```javascript
{
  userName: "John Doe",
  userEmail: "john@example.com",
  amount: 100,
  paymentMethod: "bank_transfer",
  reference: "TXN-123456",
  receiptUrl: "https://res.cloudinary.com/.../receipt.jpg"
}
```

---

## Best Practices

### For Admins

1. **Review Thoroughly**
   - Always verify receipt images match the requested amount
   - Check payment reference numbers when provided
   - Verify account details for withdrawals

2. **Add Clear Notes**
   - Always include `adminNotes` explaining your decision
   - For rejections, provide specific reasons
   - For approvals, note verification steps taken

3. **Process Promptly**
   - Review and process requests in a timely manner
   - Use status filters to prioritize pending requests
   - Check for multiple requests from the same user

4. **Security**
   - Never share admin credentials
   - Verify user identity if suspicious activity detected
   - Report fraudulent requests immediately

5. **Documentation**
   - Keep detailed notes for audit purposes
   - Document any unusual patterns or concerns
   - Maintain records of all processed requests

### For Developers

1. **Error Handling**
   - Always check request status before processing
   - Validate all input parameters
   - Handle edge cases gracefully

2. **Logging**
   - Log all admin actions for audit trail
   - Include user ID, admin ID, and timestamp
   - Log both successful and failed operations

3. **Testing**
   - Test all status transitions
   - Verify email notifications are sent
   - Test with invalid IDs and statuses
   - Test authorization middleware

---

## Related Documentation

- [Finance Feature Overview](./finance.md) - General finance feature documentation
- [Top-Up Feature](./top-up.md) - Detailed top-up feature documentation
- [Admin Use Cases](../roles/admin/USE_CASES.md) - Admin use cases
- [API Endpoints Summary](../API_ENDPOINTS_SUMMARY.md) - Complete API reference
- [Payment Responses](../../PAYMENT_RESPONSES.md) - Payment response formats

---

## API Summary

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/finance/top-ups` | Get all top-up requests | Admin |
| PUT | `/api/finance/top-ups/:topUpId/process` | Process top-up request | Admin |
| PUT | `/api/finance/withdrawals/:withdrawalId/process` | Process withdrawal request | Admin |

---

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial implementation
- Withdrawal processing
- Top-up request management
- Admin approval workflow
- Email notifications
- Audit trail

---

## Support

For issues or questions regarding admin finance management, please contact the development team or refer to the main API documentation.

