# Finance Top-Up API Payload Examples

This document provides example payloads for the top-up functionality endpoints.

---

## 1. Request Top-Up

**Endpoint:** `POST /api/finance/top-up`  
**Access:** Authenticated  
**Content-Type:** `multipart/form-data`

### Request Payload

Since this endpoint requires file upload, use `multipart/form-data`:

```javascript
// Using FormData (JavaScript/React)
const formData = new FormData();
formData.append('amount', '100.00');
formData.append('paymentMethod', 'bank_transfer');
formData.append('reference', 'TXN123456789');
formData.append('notes', 'Payment for services');
formData.append('receipt', fileInput.files[0]); // Image file

// Fetch example
fetch('/api/finance/top-up', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
});
```

### cURL Example

```bash
curl -X POST http://localhost:5000/api/finance/top-up \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "amount=100.00" \
  -F "paymentMethod=bank_transfer" \
  -F "reference=TXN123456789" \
  -F "notes=Payment for services" \
  -F "receipt=@/path/to/receipt.jpg"
```

### Form Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `amount` | Number | Yes | Top-up amount (minimum $10) | `100.00` |
| `paymentMethod` | String | Yes | Payment method used | `bank_transfer`, `mobile_money`, `card`, `cash`, `paypal`, `paymaya` |
| `receipt` | File | Yes | Receipt image file (max 5MB) | Image file (jpg, png, etc.) |
| `reference` | String | No | Payment reference/transaction ID | `TXN123456789` |
| `notes` | String | No | Additional notes | `Payment for services` |

### Valid Payment Methods

- `bank_transfer`
- `mobile_money`
- `card`
- `cash`
- `paypal`
- `paymaya`

### Success Response (201)

```json
{
  "success": true,
  "message": "Top-up request submitted successfully. Please wait for admin approval.",
  "data": {
    "topUpRequest": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "amount": 100,
      "paymentMethod": "bank_transfer",
      "status": "pending",
      "requestedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Error Responses

**400 - Missing Fields:**
```json
{
  "success": false,
  "message": "Amount and payment method are required"
}
```

**400 - Invalid Amount:**
```json
{
  "success": false,
  "message": "Amount must be a positive number"
}
```

**400 - Minimum Amount:**
```json
{
  "success": false,
  "message": "Minimum top-up amount is $10"
}
```

**400 - Missing Receipt:**
```json
{
  "success": false,
  "message": "Receipt image is required"
}
```

**400 - Invalid File Type:**
```json
{
  "success": false,
  "message": "Only image files are allowed"
}
```

**500 - Upload Error:**
```json
{
  "success": false,
  "message": "Failed to upload receipt image",
  "error": "Error details"
}
```

---

## 2. Process Top-Up (Admin Only)

**Endpoint:** `PUT /api/finance/top-ups/:topUpId/process`  
**Access:** Admin Only  
**Content-Type:** `application/json`

### Request Payload

```json
{
  "status": "approved",
  "adminNotes": "Payment verified and approved. Transaction ID: TXN123456789"
}
```

### cURL Example

```bash
curl -X PUT http://localhost:5000/api/finance/top-ups/65a1b2c3d4e5f6g7h8i9j0k1/process \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "adminNotes": "Payment verified and approved"
  }'
```

### Request Body Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `status` | String | Yes | Approval status | `approved` or `rejected` |
| `adminNotes` | String | No | Admin notes/reason | `Payment verified and approved` |

### Valid Status Values

- `approved` - Approve the top-up and add funds to user's wallet
- `rejected` - Reject the top-up request

### Success Response (200) - Approved

```json
{
  "success": true,
  "message": "Top-up request approved successfully",
  "data": {
    "topUpRequest": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "amount": 100,
      "status": "approved",
      "processedAt": "2024-01-15T11:00:00.000Z",
      "adminNotes": "Payment verified and approved"
    },
    "newBalance": 250.50
  }
}
```

### Success Response (200) - Rejected

```json
{
  "success": true,
  "message": "Top-up request rejected successfully",
  "data": {
    "topUpRequest": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "amount": 100,
      "status": "rejected",
      "processedAt": "2024-01-15T11:00:00.000Z",
      "adminNotes": "Receipt does not match payment details"
    }
  }
}
```

### Error Responses

**400 - Missing Status:**
```json
{
  "success": false,
  "message": "Status is required"
}
```

**400 - Invalid Status:**
```json
{
  "success": false,
  "message": "Status must be either \"approved\" or \"rejected\""
}
```

**404 - Top-Up Not Found:**
```json
{
  "success": false,
  "message": "Top-up request not found"
}
```

**400 - Already Processed:**
```json
{
  "success": false,
  "message": "Top-up request has already been processed"
}
```

---

## 3. Complete Example Workflow

### Step 1: Client Requests Top-Up

```javascript
// React/JavaScript Example
const requestTopUp = async (amount, paymentMethod, receiptFile, reference, notes) => {
  const formData = new FormData();
  formData.append('amount', amount.toString());
  formData.append('paymentMethod', paymentMethod);
  formData.append('receipt', receiptFile);
  if (reference) formData.append('reference', reference);
  if (notes) formData.append('notes', notes);

  const response = await fetch('/api/finance/top-up', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });

  return await response.json();
};

// Usage
const result = await requestTopUp(
  100.00,
  'bank_transfer',
  document.getElementById('receipt').files[0],
  'TXN123456789',
  'Payment for services'
);
```

### Step 2: Admin Processes Top-Up

```javascript
// Admin approves top-up
const processTopUp = async (topUpId, status, adminNotes) => {
  const response = await fetch(`/api/finance/top-ups/${topUpId}/process`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: status,
      adminNotes: adminNotes
    })
  });

  return await response.json();
};

// Approve
const result = await processTopUp(
  '65a1b2c3d4e5f6g7h8i9j0k1',
  'approved',
  'Payment verified and approved'
);

// Reject
const result = await processTopUp(
  '65a1b2c3d4e5f6g7h8i9j0k1',
  'rejected',
  'Receipt does not match payment details'
);
```

---

## 4. Postman Collection Examples

### Request Top-Up

**Method:** POST  
**URL:** `{{base_url}}/api/finance/top-up`  
**Headers:**
```
Authorization: Bearer {{token}}
```

**Body (form-data):**
```
amount: 100.00
paymentMethod: bank_transfer
reference: TXN123456789
notes: Payment for services
receipt: [Select File]
```

### Process Top-Up

**Method:** PUT  
**URL:** `{{base_url}}/api/finance/top-ups/{{topUpId}}/process`  
**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "status": "approved",
  "adminNotes": "Payment verified and approved"
}
```

---

## 5. Notes

- **Minimum Top-Up Amount:** $10
- **Maximum Receipt File Size:** 5MB
- **Allowed Receipt Formats:** All image formats (jpg, png, gif, webp, etc.)
- **Email Notifications:** 
  - Admin receives email when top-up is requested
  - User receives email when top-up is processed
- **Wallet Balance:** Automatically updated when top-up is approved
- **Transaction History:** Top-up is recorded as a transaction with type `'topup'`

