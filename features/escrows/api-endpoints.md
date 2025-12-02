# Escrow API Endpoints

## Overview
Complete list of all Escrow API endpoints with request/response examples.

## Endpoints by Role

### Client Endpoints
- `POST /api/escrows/create` - Create escrow
- `POST /api/escrows/:id/capture` - Approve and capture payment
- `POST /api/escrows/:id/refund` - Request refund
- `POST /api/escrows/:id/dispute` - Initiate dispute
- `GET /api/escrows` - Get my escrows
- `GET /api/escrows/:id` - View escrow details
- `GET /api/escrows/:id/transactions` - View transaction history

### Provider Endpoints
- `POST /api/escrows/:id/proof-of-work` - Upload proof of completion
- `POST /api/escrows/:id/payout` - Request payout
- `GET /api/escrows` - Get my escrows
- `GET /api/escrows/:id` - View escrow details
- `GET /api/escrows/:id/transactions` - View transaction history
- `GET /api/escrows/:id/payout` - View payout details

### Admin Endpoints
- `GET /api/escrows/admin/all` - Get all escrows
- `GET /api/escrows/admin/stats` - Get escrow statistics
- `POST /api/escrows/:id/dispute/resolve` - Resolve dispute

### Webhook Endpoints
- `POST /webhooks/payments` - Payment gateway events
- `POST /webhooks/disbursements` - Payout gateway events

## Detailed Endpoints

### CREATE ESCROW
**Route:** `POST /api/escrows/create`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "bookingId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "providerId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "amount": 50000,
  "currency": "USD",
  "holdProvider": "xendit"
}
```

**Request Parameters:**
- `bookingId` (string, required): The ID of the booking
- `providerId` (string, required): The ID of the service provider
- `amount` (number, required): Amount in cents
- `currency` (string, required): Currency code (USD, PHP, EUR, GBP, JPY)
- `holdProvider` (string, required): Payment gateway (paymongo, xendit, stripe, paypal, paymaya)

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "bookingId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "clientId": "64f1a2b3c4d5e6f7g8h9i0j0",
    "providerId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "currency": "USD",
    "amount": 50000,
    "holdProvider": "xendit",
    "providerHoldId": "xdt_hold_1701432000000",
    "status": "FUNDS_HELD",
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-01T10:00:00Z"
  },
  "message": "Escrow created successfully with funds held"
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "message": "Missing required fields: bookingId, providerId, amount, currency, holdProvider"
}
```

---

### CAPTURE PAYMENT
**Route:** `POST /api/escrows/:id/capture`

**Authentication:** Required (Client must be owner)

**URL Parameters:**
- `id` (string, required): Escrow ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "IN_PROGRESS",
    "clientApproval": {
      "approved": true,
      "approvedAt": "2024-12-01T11:00:00Z",
      "notes": null
    }
  },
  "message": "Payment captured successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Cannot capture: Escrow status is REFUNDED"
}
```

---

### REFUND PAYMENT
**Route:** `POST /api/escrows/:id/refund`

**Authentication:** Required

**URL Parameters:**
- `id` (string, required): Escrow ID

**Request Body:**
```json
{
  "reason": "Client requested cancellation"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "REFUNDED"
  },
  "message": "Payment refunded successfully"
}
```

---

### UPLOAD PROOF OF WORK
**Route:** `POST /api/escrows/:id/proof-of-work`

**Authentication:** Required (Provider must be owner)

**URL Parameters:**
- `id` (string, required): Escrow ID

**Request Body:**
```json
{
  "documents": [
    {
      "type": "photo",
      "url": "https://res.cloudinary.com/.../upload/v1701432000/image.jpg"
    },
    {
      "type": "video",
      "url": "https://res.cloudinary.com/.../upload/v1701432000/video.mp4"
    }
  ],
  "notes": "Work completed successfully. All requirements met."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "proofOfWork": {
      "uploadedAt": "2024-12-01T11:30:00Z",
      "documents": [
        {
          "type": "photo",
          "url": "https://res.cloudinary.com/.../upload/v1701432000/image.jpg",
          "uploadedAt": "2024-12-01T11:30:00Z"
        }
      ],
      "notes": "Work completed successfully. All requirements met."
    }
  },
  "message": "Proof of work uploaded successfully"
}
```

---

### REQUEST PAYOUT
**Route:** `POST /api/escrows/:id/payout`

**Authentication:** Required (Provider must be owner)

**URL Parameters:**
- `id` (string, required): Escrow ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "escrow": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "PAYOUT_INITIATED"
    },
    "payout": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "escrowId": "550e8400-e29b-41d4-a716-446655440000",
      "providerId": "64f1a2b3c4d5e6f7g8h9i0j2",
      "amount": 50000,
      "currency": "USD",
      "payoutProvider": "xendit",
      "gatewayPayoutId": "xdt_payout_1701432000000",
      "status": "PROCESSING",
      "initiatedAt": "2024-12-01T11:45:00Z"
    }
  },
  "message": "Payout initiated successfully"
}
```

---

### INITIATE DISPUTE
**Route:** `POST /api/escrows/:id/dispute`

**Authentication:** Required (Client or Provider)

**URL Parameters:**
- `id` (string, required): Escrow ID

**Request Body:**
```json
{
  "reason": "Provider did not complete work as agreed",
  "evidence": [
    {
      "type": "photo",
      "url": "https://res.cloudinary.com/.../photo.jpg"
    },
    {
      "type": "document",
      "url": "https://res.cloudinary.com/.../contract.pdf"
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "DISPUTE",
    "dispute": {
      "raised": true,
      "raisedAt": "2024-12-01T12:00:00Z",
      "raisedBy": "64f1a2b3c4d5e6f7g8h9i0j0",
      "reason": "Provider did not complete work as agreed",
      "evidence": [
        {
          "type": "photo",
          "url": "https://res.cloudinary.com/.../photo.jpg",
          "uploadedAt": "2024-12-01T12:00:00Z"
        }
      ]
    }
  },
  "message": "Dispute raised successfully"
}
```

---

### RESOLVE DISPUTE
**Route:** `POST /api/escrows/:id/dispute/resolve`

**Authentication:** Required (Admin only)

**URL Parameters:**
- `id` (string, required): Escrow ID

**Request Body:**
```json
{
  "decision": "PAYOUT_PROVIDER",
  "notes": "Provider has furnished adequate proof of work completion"
}
```

**Request Parameters:**
- `decision` (string, required): Resolution decision
  - `REFUND_CLIENT`: Refund payment to client
  - `PAYOUT_PROVIDER`: Process payout to provider
  - `SPLIT`: Split funds between parties (50/50)
- `notes` (string, optional): Admin notes on resolution

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "IN_PROGRESS",
    "dispute": {
      "adminResolution": {
        "decidedAt": "2024-12-01T14:00:00Z",
        "decidedBy": "64f1a2b3c4d5e6f7g8h9i0j9",
        "decision": "PAYOUT_PROVIDER",
        "notes": "Provider has furnished adequate proof of work completion"
      }
    }
  },
  "message": "Dispute resolved: PAYOUT_PROVIDER"
}
```

---

### GET ESCROW DETAILS
**Route:** `GET /api/escrows/:id`

**Authentication:** Required

**URL Parameters:**
- `id` (string, required): Escrow ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "escrow": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "bookingId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "clientId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j0",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "providerId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+0987654321"
      },
      "currency": "USD",
      "amount": 50000,
      "status": "IN_PROGRESS",
      "createdAt": "2024-12-01T10:00:00Z",
      "updatedAt": "2024-12-01T11:00:00Z"
    },
    "payout": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "status": "PROCESSING",
      "amount": 50000
    },
    "transactions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "transactionType": "HOLD",
        "amount": 50000,
        "status": "SUCCESS",
        "timestamp": "2024-12-01T10:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "transactionType": "CAPTURE",
        "amount": 50000,
        "status": "SUCCESS",
        "timestamp": "2024-12-01T11:00:00Z"
      }
    ]
  }
}
```

---

### GET USER'S ESCROWS
**Route:** `GET /api/escrows`

**Authentication:** Required

**Query Parameters:**
- `status` (string, optional): Filter by status (FUNDS_HELD, IN_PROGRESS, COMPLETE, DISPUTE, REFUNDED, etc.)
- `page` (number, optional, default=1): Page number for pagination
- `limit` (number, optional, default=20): Results per page

**Example:** `GET /api/escrows?status=COMPLETE&page=1&limit=20`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "bookingId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "clientId": {...},
      "providerId": {...},
      "amount": 50000,
      "currency": "USD",
      "status": "COMPLETE",
      "createdAt": "2024-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### GET ESCROW TRANSACTIONS
**Route:** `GET /api/escrows/:id/transactions`

**Authentication:** Required

**URL Parameters:**
- `id` (string, required): Escrow ID

**Query Parameters:**
- `page` (number, optional, default=1)
- `limit` (number, optional, default=50)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "escrowId": "550e8400-e29b-41d4-a716-446655440000",
      "transactionType": "HOLD",
      "amount": 50000,
      "currency": "USD",
      "status": "SUCCESS",
      "initiatedBy": "64f1a2b3c4d5e6f7g8h9i0j0",
      "gateway": {
        "provider": "xendit",
        "transactionId": "xdt_hold_1701432000000"
      },
      "metadata": {
        "reason": "Payment hold for booking"
      },
      "timestamp": "2024-12-01T10:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "escrowId": "550e8400-e29b-41d4-a716-446655440000",
      "transactionType": "CAPTURE",
      "amount": 50000,
      "currency": "USD",
      "status": "SUCCESS",
      "initiatedBy": "64f1a2b3c4d5e6f7g8h9i0j0",
      "gateway": {
        "provider": "xendit",
        "transactionId": "xdt_capture_1701432600000"
      },
      "metadata": {
        "reason": "Client approved - payment captured"
      },
      "timestamp": "2024-12-01T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "totalPages": 1
  }
}
```

---

### GET PAYOUT DETAILS
**Route:** `GET /api/escrows/:id/payout`

**Authentication:** Required

**URL Parameters:**
- `id` (string, required): Escrow ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "escrowId": "550e8400-e29b-41d4-a716-446655440000",
    "providerId": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "amount": 50000,
    "currency": "USD",
    "payoutProvider": "xendit",
    "gatewayPayoutId": "xdt_payout_1701432000000",
    "status": "COMPLETED",
    "initiatedAt": "2024-12-01T11:45:00Z",
    "completedAt": "2024-12-02T15:30:00Z"
  }
}
```

---

### GET ALL ESCROWS (Admin)
**Route:** `GET /api/escrows/admin/all`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `status` (string, optional): Filter by status
- `clientId` (string, optional): Filter by client ID
- `providerId` (string, optional): Filter by provider ID
- `page` (number, optional, default=1)
- `limit` (number, optional, default=20)

**Example:** `GET /api/escrows/admin/all?status=DISPUTE&page=1&limit=50`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "DISPUTE",
      "amount": 50000,
      "clientId": {...},
      "providerId": {...}
    }
  ],
  "pagination": {...}
}
```

---

### GET ESCROW STATISTICS (Admin)
**Route:** `GET /api/escrows/admin/stats`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `startDate` (string, optional): Start date (ISO 8601)
- `endDate` (string, optional): End date (ISO 8601)

**Example:** `GET /api/escrows/admin/stats?startDate=2024-11-01&endDate=2024-12-31`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "byStatus": [
      {
        "_id": "COMPLETE",
        "count": 150,
        "totalAmount": 500000000
      },
      {
        "_id": "IN_PROGRESS",
        "count": 30,
        "totalAmount": 150000000
      },
      {
        "_id": "DISPUTE",
        "count": 5,
        "totalAmount": 25000000
      }
    ],
    "totalVolume": [
      {
        "total": 675000000,
        "count": 185
      }
    ],
    "byProvider": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "count": 30,
        "totalAmount": 150000000
      },
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
        "count": 25,
        "totalAmount": 125000000
      }
    ]
  }
}
```

---

## Status Codes

### Success Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully

### Error Codes
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User lacks required permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Authentication

All endpoints (except webhooks) require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

API rate limiting is applied to prevent abuse:
- Default: 100 requests per 15 minutes per user
- Webhooks: Not rate limited

## Pagination

Paginated responses include:
- `page`: Current page number
- `limit`: Results per page
- `total`: Total number of results
- `totalPages`: Total number of pages
