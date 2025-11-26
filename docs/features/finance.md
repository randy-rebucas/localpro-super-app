# Finance Feature Documentation

## Overview
The Finance feature manages financial transactions, earnings, expenses, withdrawals, top-ups, and financial reporting for users.

## Base Path
`/api/finance`

## Endpoints

### Authenticated Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/overview` | Get financial overview | AUTHENTICATED |
| GET | `/transactions` | Get transactions | AUTHENTICATED |
| GET | `/earnings` | Get earnings summary | AUTHENTICATED |
| GET | `/expenses` | Get expenses summary | AUTHENTICATED |
| GET | `/reports` | Get financial reports | AUTHENTICATED |
| POST | `/expenses` | Add expense | AUTHENTICATED |
| POST | `/withdraw` | Request withdrawal | AUTHENTICATED |
| PUT | `/withdrawals/:withdrawalId/process` | Process withdrawal | **admin** |
| GET | `/tax-documents` | Get tax documents | AUTHENTICATED |
| PUT | `/wallet/settings` | Update wallet settings | AUTHENTICATED |
| POST | `/top-up` | Request top-up (with receipt) | AUTHENTICATED |
| GET | `/top-ups` | Get all top-up requests | **admin** |
| GET | `/top-ups/my-requests` | Get my top-up requests | AUTHENTICATED |
| PUT | `/top-ups/:topUpId/process` | Process top-up request | **admin** |

## Request/Response Examples

### Get Financial Overview
```http
GET /api/finance/overview
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "balance": 50000,
    "pendingEarnings": 10000,
    "totalEarnings": 200000,
    "totalExpenses": 50000,
    "recentTransactions": [...]
  }
}
```

### Request Withdrawal
```http
POST /api/finance/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 10000,
  "paymentMethod": "bank_transfer",
  "accountDetails": {
    "bankName": "BPI",
    "accountNumber": "1234567890",
    "accountName": "John Doe"
  }
}
```

### Request Top-Up
```http
POST /api/finance/top-up
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "amount": 5000,
  "paymentMethod": "bank_transfer",
  "receipt": <file>
}
```

### Add Expense
```http
POST /api/finance/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000,
  "category": "supplies",
  "description": "Cleaning supplies",
  "date": "2025-01-15",
  "receipt": "https://..."
}
```

## Financial Flow

1. **Earnings**:
   - Provider completes service booking
   - Payment processed
   - Earnings added to wallet
   - Status: `pending` → `available`

2. **Withdrawal**:
   - Provider requests withdrawal
   - Admin reviews and processes
   - Funds transferred to bank account
   - Status: `pending` → `processing` → `completed`

3. **Top-Up**:
   - User requests top-up with receipt
   - Admin verifies receipt
   - Funds added to wallet
   - Status: `pending` → `approved`/`rejected`
   - See [Top-Up Documentation](./top-up.md) for detailed information

4. **Expenses**:
   - User adds expense record
   - Expense tracked for reporting
   - Used for tax documents

## Transaction Types

- `earning` - Service payment received
- `withdrawal` - Money withdrawn
- `top_up` - Wallet top-up
- `expense` - Business expense
- `refund` - Refund issued
- `commission` - Platform commission

## Related Features
- Marketplace (Bookings)
- Payments (PayPal, PayMaya)
- User Management
- Analytics

## Detailed Documentation
- [Top-Up Feature](./top-up.md) - Complete guide for top-up functionality

