# Top-Up Feature Documentation

## Overview

The Top-Up feature allows users to add funds to their wallet by submitting a payment receipt for admin approval. This manual verification process ensures security and prevents fraudulent transactions.

## Table of Contents

1. [Features](#features)
2. [API Endpoints](#api-endpoints)
3. [User Flow](#user-flow)
4. [Admin Flow](#admin-flow)
5. [Request/Response Formats](#requestresponse-formats)
6. [Data Model](#data-model)
7. [Validation Rules](#validation-rules)
8. [Error Handling](#error-handling)
9. [Email Notifications](#email-notifications)
10. [Testing](#testing)

---

## Features

- **User-initiated top-up requests** with receipt upload
- **Admin approval workflow** for security
- **Multiple payment methods** supported
- **Automatic wallet balance update** upon approval
- **Transaction history** tracking
- **Email notifications** for both users and admins
- **Receipt image storage** via Cloudinary
- **Status tracking** (pending, approved, rejected)

---

## API Endpoints

### 1. Request Top-Up
**POST** `/api/finance/top-up`

**Access**: Authenticated users only

**Description**: Submit a top-up request with payment receipt.

**Request Body** (multipart/form-data):
- `amount` (required): Top-up amount (minimum $10)
- `paymentMethod` (required): Payment method used
- `reference` (optional): Payment reference number
- `notes` (optional): Additional notes
- `receipt` (required): Receipt image file (max 5MB, images only)

**Payment Methods**:
- `bank_transfer`
- `mobile_money`
- `card`
- `cash`
- `paypal`
- `paymaya`

---

### 2. Get My Top-Up Requests
**GET** `/api/finance/top-ups/my-requests`

**Access**: Authenticated users only

**Description**: Get the current user's top-up request history.

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`)

---

### 3. Get All Top-Up Requests (Admin)
**GET** `/api/finance/top-ups`

**Access**: Admin only

**Description**: Get all top-up requests across all users for admin review.

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`)

---

### 4. Process Top-Up Request (Admin)
**PUT** `/api/finance/top-ups/:topUpId/process`

**Access**: Admin only

**Description**: Approve or reject a top-up request.

**URL Parameters**:
- `topUpId`: The ID of the top-up request to process

**Request Body**:
- `status` (required): Either `"approved"` or `"rejected"`
- `adminNotes` (optional): Admin notes about the decision

**Behavior**:
- If approved: Creates a transaction, updates wallet balance, sends notification
- If rejected: Updates status only, sends notification

---

## User Flow

### Step 1: User Submits Top-Up Request
1. User navigates to wallet/top-up page
2. User enters:
   - Amount (minimum $10)
   - Payment method
   - Optional reference number
   - Optional notes
   - Uploads receipt image
3. System validates:
   - Amount is positive and >= $10
   - Payment method is valid
   - Receipt image is provided and valid
4. Receipt is uploaded to Cloudinary
5. Top-up request is created with `pending` status
6. Email notification sent to admin
7. User receives confirmation response

### Step 2: Admin Reviews Request
1. Admin views pending top-up requests via `/api/finance/top-ups?status=pending`
2. Admin reviews receipt and details
3. Admin makes decision:
   - **Approve**: Funds are added to user's wallet
   - **Reject**: Request is marked as rejected

### Step 3: Admin Processes Request
1. Admin calls `/api/finance/top-ups/:topUpId/process`
2. If approved:
   - Transaction record created (type: `topup`)
   - Wallet balance updated
   - User receives email notification
3. If rejected:
   - Status updated to `rejected`
   - Admin notes saved
   - User receives email notification

### Step 4: User Checks Status
1. User can check request status via `/api/finance/top-ups/my-requests`
2. User receives email notification when status changes
3. If approved, wallet balance is updated immediately

---

## Admin Flow

### Viewing Top-Up Requests

**Get All Requests**:
```
GET /api/finance/top-ups
```

**Get Pending Requests Only**:
```
GET /api/finance/top-ups?status=pending
```

**Get Approved Requests**:
```
GET /api/finance/top-ups?status=approved
```

### Processing a Request

**Approve**:
```json
PUT /api/finance/top-ups/:topUpId/process
{
  "status": "approved",
  "adminNotes": "Payment verified successfully"
}
```

**Reject**:
```json
PUT /api/finance/top-ups/:topUpId/process
{
  "status": "rejected",
  "adminNotes": "Receipt does not match payment amount"
}
```

---

## Request/Response Formats

### Request Top-Up

**Request** (multipart/form-data):
```
POST /api/finance/top-up
Content-Type: multipart/form-data

amount: 100
paymentMethod: bank_transfer
reference: TXN-123456
notes: Payment for wallet top-up
receipt: [image file]
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Top-up request submitted successfully. Please wait for admin approval.",
  "data": {
    "topUpRequest": {
      "_id": "64a1b2c3d4e5f6789012347",
      "amount": 100,
      "paymentMethod": "bank_transfer",
      "status": "pending",
      "requestedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Amount must be a positive number"
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Minimum top-up amount is $10"
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Receipt image is required"
}
```

---

### Get My Top-Up Requests

**Request**:
```
GET /api/finance/top-ups/my-requests?page=1&limit=20&status=pending
```

**Success Response (200)**:
```json
{
  "success": true,
  "count": 2,
  "total": 5,
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
      }
    },
    {
      "_id": "64a1b2c3d4e5f6789012348",
      "amount": 50,
      "paymentMethod": "paymaya",
      "status": "approved",
      "requestedAt": "2024-01-14T09:20:00.000Z",
      "processedAt": "2024-01-14T10:15:00.000Z",
      "processedBy": "admin_user_id",
      "adminNotes": "Payment verified"
    }
  ]
}
```

---

### Get All Top-Up Requests (Admin)

**Request**:
```
GET /api/finance/top-ups?page=1&limit=20&status=pending
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
          "avatar": "https://..."
        }
      }
    }
  ]
}
```

---

### Process Top-Up Request (Admin)

**Request**:
```
PUT /api/finance/top-ups/64a1b2c3d4e5f6789012347/process
Content-Type: application/json

{
  "status": "approved",
  "adminNotes": "Payment verified successfully"
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
      "adminNotes": "Payment verified successfully"
    },
    "newBalance": 250.00
  }
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
      "adminNotes": "Receipt does not match payment amount"
    }
  }
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Status must be either \"approved\" or \"rejected\""
}
```

**Error Response (404)**:
```json
{
  "success": false,
  "message": "Top-up request not found"
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Top-up request has already been processed"
}
```

---

## Data Model

### Top-Up Request Schema

```javascript
{
  _id: ObjectId,
  amount: Number,              // Required, min: 0
  receipt: {
    url: String,               // Required, Cloudinary URL
    publicId: String           // Optional, Cloudinary public ID
  },
  paymentMethod: String,        // Required, enum: ['bank_transfer', 'mobile_money', 'card', 'cash', 'paypal', 'paymaya']
  reference: String,           // Optional, payment reference number
  notes: String,               // Optional, user notes
  status: String,              // Enum: ['pending', 'approved', 'rejected'], default: 'pending'
  requestedAt: Date,           // Default: Date.now
  processedAt: Date,           // Set when admin processes
  processedBy: ObjectId,       // Reference to User (admin)
  adminNotes: String            // Admin notes about the decision
}
```

### Transaction Created on Approval

When a top-up is approved, a transaction is automatically created:

```javascript
{
  type: 'topup',
  amount: Number,              // Top-up amount
  category: 'topup',
  description: String,         // e.g., "Top-up via bank_transfer"
  paymentMethod: String,       // Same as top-up request
  status: 'completed',
  timestamp: Date,
  reference: String,           // From top-up request
  processedAt: Date,
  processedBy: ObjectId        // Admin user ID
}
```

---

## Validation Rules

### Amount Validation
- **Required**: Yes
- **Type**: Number
- **Minimum**: $10
- **Must be**: Positive number

### Payment Method Validation
- **Required**: Yes
- **Allowed values**: 
  - `bank_transfer`
  - `mobile_money`
  - `card`
  - `cash`
  - `paypal`
  - `paymaya`

### Receipt Image Validation
- **Required**: Yes
- **File type**: Images only (jpeg, png, gif, webp, etc.)
- **Max size**: 5MB
- **Storage**: Cloudinary (`localpro/finance/receipts`)

### Status Validation (Admin Processing)
- **Required**: Yes
- **Allowed values**: `approved` or `rejected`
- **Constraint**: Can only process requests with `pending` status

---

## Error Handling

### Common Error Scenarios

1. **Missing Required Fields**
   - Status: 400
   - Message: "Amount and payment method are required"

2. **Invalid Amount**
   - Status: 400
   - Message: "Amount must be a positive number"

3. **Amount Below Minimum**
   - Status: 400
   - Message: "Minimum top-up amount is $10"

4. **Missing Receipt**
   - Status: 400
   - Message: "Receipt image is required"

5. **Invalid File Type**
   - Status: 400
   - Message: "Only image files are allowed"

6. **File Too Large**
   - Status: 400
   - Message: "File size exceeds 5MB limit"

7. **Cloudinary Upload Failure**
   - Status: 500
   - Message: "Failed to upload receipt image"

8. **Top-Up Request Not Found**
   - Status: 404
   - Message: "Top-up request not found"

9. **Already Processed**
   - Status: 400
   - Message: "Top-up request has already been processed"

10. **Invalid Status**
    - Status: 400
    - Message: "Status must be either \"approved\" or \"rejected\""

---

## Email Notifications

### 1. New Top-Up Request (Admin)

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

### 2. Top-Up Status Update (User)

**Trigger**: When admin processes a top-up request

**Recipient**: User who submitted the request

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

---

## Testing

### Manual Testing Checklist

#### User Flow
- [ ] Submit top-up request with valid data
- [ ] Submit top-up request with amount < $10 (should fail)
- [ ] Submit top-up request without receipt (should fail)
- [ ] Submit top-up request with invalid file type (should fail)
- [ ] View own top-up requests
- [ ] Filter own requests by status
- [ ] Receive email notification when request is processed

#### Admin Flow
- [ ] View all top-up requests
- [ ] Filter requests by status
- [ ] View request details with user information
- [ ] Approve a pending request
- [ ] Reject a pending request
- [ ] Try to process already processed request (should fail)
- [ ] Verify wallet balance updates on approval
- [ ] Verify transaction is created on approval

### Test Cases

#### Test Case 1: Successful Top-Up Request
1. User submits request with:
   - Amount: $50
   - Payment method: `bank_transfer`
   - Valid receipt image
2. Expected: Request created with `pending` status
3. Expected: Admin receives email notification

#### Test Case 2: Minimum Amount Validation
1. User submits request with amount: $5
2. Expected: 400 error, "Minimum top-up amount is $10"

#### Test Case 3: Admin Approval
1. Admin approves pending request
2. Expected: Status changes to `approved`
3. Expected: Transaction created (type: `topup`)
4. Expected: Wallet balance increases
5. Expected: User receives email notification

#### Test Case 4: Admin Rejection
1. Admin rejects pending request
2. Expected: Status changes to `rejected`
3. Expected: No transaction created
4. Expected: Wallet balance unchanged
5. Expected: User receives email notification

---

## Security Considerations

1. **Authentication**: All endpoints require authentication
2. **Authorization**: Admin endpoints require admin role
3. **File Upload**: 
   - File type validation
   - File size limits
   - Secure storage on Cloudinary
4. **Amount Validation**: Minimum amount prevents abuse
5. **Status Protection**: Cannot process already processed requests
6. **Admin Notes**: Tracked for audit purposes

---

## Environment Variables

Required environment variables:

- `ADMIN_EMAIL`: Email address for admin notifications
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `FROM_EMAIL`: Email address for sending notifications
- `EMAIL_SERVICE`: Email service provider (resend, sendgrid, smtp)

---

## Related Documentation

- [Finance Feature Overview](../features/finance.md)
- [Payment Responses](../../PAYMENT_RESPONSES.md)
- [API Endpoints Summary](../../API_ENDPOINTS_SUMMARY.md)
- [Admin Use Cases](../../roles/admin/USE_CASES.md)
- [Client Use Cases](../../roles/client/USE_CASES.md)

---

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial implementation
- User top-up request submission
- Admin approval workflow
- Email notifications
- Receipt image upload
- Transaction creation on approval

---

## Support

For issues or questions regarding the top-up feature, please contact the development team or refer to the main API documentation.

