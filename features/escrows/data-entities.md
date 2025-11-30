# Escrow Data Entities

## Entity Relationships

```
Booking
  └── Escrow (1:1)
        ├── EscrowTransaction (1:many) [Audit Log]
        └── Payout (1:1)
```

## Detailed Entity Schemas

### Escrow

The main escrow record that holds payment authorization details and status.

```javascript
{
  // Identity
  _id: ObjectId,
  id: String (UUID), // Unique external ID
  
  // Related References
  bookingId: ObjectId (ref: 'Booking'),
  clientId: ObjectId (ref: 'User'),
  providerId: ObjectId (ref: 'User'),
  
  // Payment Details
  currency: String, // 'USD', 'PHP', 'EUR', 'GBP', 'JPY'
  amount: Number, // In cents (e.g., 50000 = $500.00)
  
  // Gateway Information
  holdProvider: String, // 'paymongo', 'xendit', 'stripe', 'paypal', 'paymaya'
  providerHoldId: String, // Authorization ID from gateway
  
  // Status Workflow
  status: String, // Enum
  // CREATED: Just created, waiting to call gateway
  // FUNDS_HELD: Payment hold successful, funds reserved
  // IN_PROGRESS: Payment captured, work in progress
  // COMPLETE: Work completed, payment final
  // DISPUTE: Conflict raised between parties
  // REFUNDED: Payment returned to client
  // PAYOUT_INITIATED: Payout process started
  // PAYOUT_COMPLETED: Funds sent to provider
  
  // Proof of Work Upload
  proofOfWork: {
    uploadedAt: Date,
    documents: [{
      type: String, // 'photo', 'video', 'document', 'other'
      url: String, // Cloudinary or CDN URL
      uploadedAt: Date,
      metadata: {
        fileSize: Number, // in bytes
        mimeType: String // 'image/jpeg', 'video/mp4', etc.
      }
    }],
    notes: String // Provider notes about work completed
  },
  
  // Client Approval
  clientApproval: {
    approved: Boolean,
    approvedAt: Date,
    notes: String // Why approved/rejected
  },
  
  // Dispute Information
  dispute: {
    raised: Boolean,
    raisedAt: Date,
    raisedBy: ObjectId, // User who raised dispute
    reason: String, // Dispute description
    evidence: [{
      type: String, // Document type
      url: String,
      uploadedAt: Date
    }],
    adminResolution: {
      decidedAt: Date,
      decidedBy: ObjectId, // Admin who decided
      decision: String, // 'REFUND_CLIENT', 'PAYOUT_PROVIDER', 'SPLIT'
      notes: String // Resolution notes
    }
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Payout

Records for funds disbursement to providers.

```javascript
{
  // Identity
  _id: ObjectId,
  id: String (UUID),
  
  // References
  escrowId: ObjectId (ref: 'Escrow'),
  providerId: ObjectId (ref: 'User'),
  
  // Payment Details
  amount: Number, // In cents
  currency: String, // 'USD', 'PHP', etc.
  
  // Payout Gateway
  payoutProvider: String, // 'xendit', 'stripe', 'paypal', 'paymaya', 'bank_transfer'
  gatewayPayoutId: String, // Reference from payout gateway
  
  // Provider Payout Method
  providerPayoutMethod: {
    type: String, // 'bank_account', 'wallet', 'crypto'
    accountDetails: {
      accountNumber: String, // For bank transfers
      accountName: String,
      bankCode: String, // e.g., 'BDO', 'BPI'
      walletAddress: String // For crypto
    }
  },
  
  // Status
  status: String, // 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
  
  // Metadata
  metadata: {
    reference: String, // Escrow UUID for tracking
    description: String, // e.g., "Payout for booking 123"
    tags: [String] // ['booking_payout', 'urgent', etc.]
  },
  
  // Timestamps
  initiatedAt: Date,
  completedAt: Date,
  failureReason: String, // Why payout failed (if applicable)
  createdAt: Date,
  updatedAt: Date
}
```

### EscrowTransaction (Audit Log)

Immutable ledger of all transactions for compliance and auditing.

**Key Feature:** Records cannot be updated or deleted after creation.

```javascript
{
  // Identity
  _id: ObjectId,
  id: String (UUID),
  
  // Reference
  escrowId: ObjectId (ref: 'Escrow'),
  
  // Transaction Details
  transactionType: String, // Enum:
  // 'HOLD': Payment authorization created
  // 'CAPTURE': Held payment captured
  // 'REFUND': Payment returned
  // 'DISPUTE_INITIATED': Dispute raised
  // 'DISPUTE_RESOLVED': Dispute resolved
  // 'PAYOUT': Payout initiated
  
  amount: Number, // In cents
  currency: String,
  
  // Result
  status: String, // 'PENDING', 'SUCCESS', 'FAILED'
  
  // Who initiated
  initiatedBy: ObjectId (ref: 'User'),
  
  // Gateway Response
  gateway: {
    provider: String, // Gateway name
    transactionId: String, // Gateway transaction ID
    responseCode: String, // HTTP/gateway response code
    responseMessage: String // Gateway response message
  },
  
  // Additional Info
  metadata: {
    reason: String, // Why transaction occurred
    notes: String, // Admin/system notes
    relatedPayoutId: ObjectId, // Link to Payout if applicable
    tags: [String] // For categorization
  },
  
  // Balance Tracking (for future balance sheet)
  previousBalance: Number,
  newBalance: Number,
  
  // Immutable Timestamp
  timestamp: Date // When recorded
}
```

## Enum Values

### Escrow Status
```
CREATED -> FUNDS_HELD -> IN_PROGRESS -> COMPLETE -> PAYOUT_INITIATED -> PAYOUT_COMPLETED
                                   |
                                DISPUTE -> Resolved (REFUND_CLIENT, PAYOUT_PROVIDER, SPLIT)
                                   |
                              REFUNDED
```

### Transaction Type
- `HOLD`: Authorization created on payment gateway
- `CAPTURE`: Held funds captured
- `REFUND`: Authorization released/refunded
- `DISPUTE_INITIATED`: Dispute raised by client/provider
- `DISPUTE_RESOLVED`: Admin resolved dispute
- `PAYOUT`: Disbursement initiated to provider

### Payout Status
- `PENDING`: Waiting to be initiated
- `PROCESSING`: Sent to gateway, waiting for confirmation
- `COMPLETED`: Successfully disbursed
- `FAILED`: Gateway rejected payout
- `CANCELLED`: Manually cancelled

### Proof of Work Document Types
- `photo`: Image files
- `video`: Video files
- `document`: PDF or text documents
- `other`: Any other file type

### Payout Methods
- `bank_account`: Direct bank transfer
- `wallet`: In-app wallet or digital wallet
- `crypto`: Cryptocurrency address

## Field Constraints

### Escrow
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| id | UUID | ✓ | Unique |
| bookingId | ObjectId | ✓ | Valid booking |
| clientId | ObjectId | ✓ | Valid user |
| providerId | ObjectId | ✓ | Valid user |
| amount | Number | ✓ | > 0, Integer |
| currency | String | ✓ | [USD,PHP,EUR,GBP,JPY] |
| holdProvider | String | ✓ | [paymongo,xendit,stripe,paypal,paymaya] |
| providerHoldId | String | ✓ | Non-empty |
| status | String | ✓ | Valid enum |

### Payout
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| id | UUID | ✓ | Unique |
| escrowId | ObjectId | ✓ | Valid escrow |
| providerId | ObjectId | ✓ | Valid user |
| amount | Number | ✓ | > 0, Integer |
| payoutProvider | String | ✓ | Valid provider |
| gatewayPayoutId | String | ✓ | Non-empty |
| status | String | ✓ | Valid enum |

### EscrowTransaction
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| id | UUID | ✓ | Unique |
| escrowId | ObjectId | ✓ | Valid escrow |
| transactionType | String | ✓ | Valid enum |
| amount | Number | ✓ | > 0, Integer |
| status | String | ✓ | [PENDING,SUCCESS,FAILED] |
| initiatedBy | ObjectId | ✓ | Valid user |

## Indexes

### Escrow Indexes
```javascript
// By ID (unique)
db.escrows.createIndex({ id: 1 }, { unique: true })

// Query by booking
db.escrows.createIndex({ bookingId: 1, status: 1 })

// Query by client
db.escrows.createIndex({ clientId: 1, status: 1 })

// Query by provider
db.escrows.createIndex({ providerId: 1, status: 1 })

// Time-based queries
db.escrows.createIndex({ createdAt: -1 })
```

### Payout Indexes
```javascript
// By ID (unique)
db.payouts.createIndex({ id: 1 }, { unique: true })

// Query by escrow
db.payouts.createIndex({ escrowId: 1 })

// Query by provider
db.payouts.createIndex({ providerId: 1, status: 1 })

// Time-based queries
db.payouts.createIndex({ createdAt: -1 })
```

### EscrowTransaction Indexes
```javascript
// By ID (unique)
db.escrow_transactions.createIndex({ id: 1 }, { unique: true })

// Audit by escrow
db.escrow_transactions.createIndex({ escrowId: 1, timestamp: -1 })

// Audit by transaction type
db.escrow_transactions.createIndex({ transactionType: 1, timestamp: -1 })

// Audit by user
db.escrow_transactions.createIndex({ initiatedBy: 1, timestamp: -1 })

// Time series
db.escrow_transactions.createIndex({ timestamp: -1 })
```

## Relationships

### Escrow ↔ Booking (1:1)
- Each escrow is tied to one booking
- Each booking may have one escrow
- Foreign key: `Escrow.bookingId`

### Escrow ↔ User (Client) (Many:1)
- Many escrows can be for same client
- Each escrow has one client
- Foreign key: `Escrow.clientId`

### Escrow ↔ User (Provider) (Many:1)
- Many escrows can be for same provider
- Each escrow has one provider
- Foreign key: `Escrow.providerId`

### Escrow ↔ EscrowTransaction (1:Many)
- One escrow has many transactions
- Each transaction belongs to one escrow
- Foreign key: `EscrowTransaction.escrowId`
- Purpose: Immutable audit log

### Escrow ↔ Payout (1:1)
- One escrow produces one payout
- One payout corresponds to one escrow
- Foreign key: `Payout.escrowId`

## Sample Documents

### Sample Escrow

```json
{
  "_id": ObjectId("64f1a2b3c4d5e6f7g8h9i0j0"),
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "bookingId": ObjectId("64f1a2b3c4d5e6f7g8h9i0j1"),
  "clientId": ObjectId("64f1a2b3c4d5e6f7g8h9i0j2"),
  "providerId": ObjectId("64f1a2b3c4d5e6f7g8h9i0j3"),
  "currency": "USD",
  "amount": 50000,
  "holdProvider": "xendit",
  "providerHoldId": "xdt_hold_1701432000000",
  "status": "COMPLETE",
  "proofOfWork": {
    "uploadedAt": ISODate("2024-12-01T11:30:00Z"),
    "documents": [
      {
        "type": "photo",
        "url": "https://res.cloudinary.com/.../image.jpg",
        "uploadedAt": ISODate("2024-12-01T11:30:00Z"),
        "metadata": {
          "fileSize": 2048000,
          "mimeType": "image/jpeg"
        }
      }
    ],
    "notes": "Work completed as requested"
  },
  "clientApproval": {
    "approved": true,
    "approvedAt": ISODate("2024-12-01T12:00:00Z"),
    "notes": "Excellent work, very satisfied"
  },
  "dispute": {
    "raised": false,
    "raisedAt": null,
    "raisedBy": null,
    "reason": null,
    "evidence": [],
    "adminResolution": {
      "decidedAt": null,
      "decidedBy": null,
      "decision": null,
      "notes": null
    }
  },
  "createdAt": ISODate("2024-12-01T10:00:00Z"),
  "updatedAt": ISODate("2024-12-01T12:00:00Z")
}
```

### Sample Payout

```json
{
  "_id": ObjectId("64f1a2b3c4d5e6f7g8h9i0j4"),
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "escrowId": ObjectId("64f1a2b3c4d5e6f7g8h9i0j0"),
  "providerId": ObjectId("64f1a2b3c4d5e6f7g8h9i0j3"),
  "amount": 50000,
  "currency": "USD",
  "payoutProvider": "xendit",
  "gatewayPayoutId": "xdt_payout_1701432000000",
  "providerPayoutMethod": {
    "type": "bank_account",
    "accountDetails": {
      "accountNumber": "1234567890",
      "accountName": "Jane Smith",
      "bankCode": "UBPPHPH",
      "walletAddress": null
    }
  },
  "status": "COMPLETED",
  "metadata": {
    "reference": "550e8400-e29b-41d4-a716-446655440000",
    "description": "Payout for booking 64f1a2b3c4d5e6f7g8h9i0j1",
    "tags": ["booking_payout"]
  },
  "initiatedAt": ISODate("2024-12-01T12:30:00Z"),
  "completedAt": ISODate("2024-12-02T14:00:00Z"),
  "failureReason": null,
  "createdAt": ISODate("2024-12-01T12:30:00Z"),
  "updatedAt": ISODate("2024-12-02T14:00:00Z")
}
```

### Sample EscrowTransaction

```json
{
  "_id": ObjectId("64f1a2b3c4d5e6f7g8h9i0j5"),
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "escrowId": ObjectId("64f1a2b3c4d5e6f7g8h9i0j0"),
  "transactionType": "CAPTURE",
  "amount": 50000,
  "currency": "USD",
  "status": "SUCCESS",
  "initiatedBy": ObjectId("64f1a2b3c4d5e6f7g8h9i0j2"),
  "gateway": {
    "provider": "xendit",
    "transactionId": "xdt_capture_1701432600000",
    "responseCode": "00",
    "responseMessage": "Success"
  },
  "metadata": {
    "reason": "Client approved - payment captured",
    "notes": "Capture initiated after client approval",
    "relatedPayoutId": null,
    "tags": ["payment_capture"]
  },
  "previousBalance": 0,
  "newBalance": 0,
  "timestamp": ISODate("2024-12-01T11:00:00Z")
}
```

## Query Examples

### Get all pending payouts
```javascript
db.payouts.find({ status: "PENDING" })
```

### Get disputes by date range
```javascript
db.escrows.find({
  "dispute.raised": true,
  "dispute.raisedAt": {
    $gte: ISODate("2024-12-01"),
    $lte: ISODate("2024-12-31")
  }
})
```

### Get transaction history for escrow
```javascript
db.escrow_transactions.find({
  escrowId: ObjectId("...")
}).sort({ timestamp: -1 })
```

### Get provider earnings
```javascript
db.payouts.aggregate([
  {
    $match: {
      providerId: ObjectId("..."),
      status: "COMPLETED"
    }
  },
  {
    $group: {
      _id: "$currency",
      totalEarnings: { $sum: "$amount" },
      payoutCount: { $sum: 1 }
    }
  }
])
```

### Get monthly escrow volume
```javascript
db.escrows.aggregate([
  {
    $group: {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      },
      count: { $sum: 1 },
      totalVolume: { $sum: "$amount" }
    }
  },
  { $sort: { "_id.year": -1, "_id.month": -1 } }
])
```
