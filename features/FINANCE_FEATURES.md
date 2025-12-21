# Finance Features Documentation

## Overview

The Finance feature provides comprehensive financial management for users in the LocalPro Super App. It includes wallet management, transaction tracking, earnings and expense tracking, withdrawal and top-up processing, loan management, salary advance, and financial reporting. The system supports multiple payment methods and integrates with various payment gateways.

## Base Path
`/api/finance`

---

## Core Features

### 1. Wallet Management
- **Real-Time Balance** - Track available and pending balances
- **Balance Tracking** - Monitor wallet balance with automatic updates
- **Pending Balance** - Track funds awaiting processing (withdrawals, holds)
- **Auto-Withdraw Settings** - Configure automatic withdrawal preferences
- **Minimum Balance** - Set minimum balance thresholds
- **Notification Settings** - Configure alerts for:
  - Low balance warnings
  - Withdrawal notifications
  - Payment notifications

### 2. Transaction Management
- **Transaction History** - Complete transaction log with filtering
- **Transaction Types** - Support for multiple transaction types:
  - `income` - Service payment received
  - `expense` - Business expense
  - `withdrawal` - Money withdrawn
  - `topup` - Wallet top-up
  - `refund` - Refund issued
  - `bonus` - Bonus payment
  - `referral` - Referral commission
  - `loan_disbursement` - Loan funds disbursed
  - `loan_repayment` - Loan repayment
  - `salary_advance` - Salary advance payment
  - `payment` - General payment
  - `fee` - Platform fees
- **Payment Methods** - Support for:
  - `wallet` - Internal wallet
  - `bank_transfer` - Bank transfer
  - `mobile_money` - Mobile money
  - `card` - Credit/debit card
  - `cash` - Cash payment
  - `paypal` - PayPal
  - `paymaya` - PayMaya
  - `paymongo` - PayMongo
- **Transaction Status** - Track status: `pending`, `completed`, `failed`, `cancelled`
- **Payment Gateway Integration** - Support for multiple payment providers:
  - PayMongo (primary)
  - PayPal
  - PayMaya
  - Xendit
  - Stripe

### 3. Earnings & Expense Tracking
- **Earnings Summary** - Track total and pending earnings
- **Expense Logging** - Record business expenses with categories
- **Expense Categories** - Organize expenses by type
- **Receipt Management** - Upload and store expense receipts
- **Financial Reports** - Generate comprehensive financial reports
- **Tax Documents** - Generate tax summaries and documents

### 4. Withdrawal Management
- **Withdrawal Requests** - Request funds withdrawal from wallet
- **Multiple Payment Methods** - Withdraw via bank transfer, mobile money, etc.
- **Account Details** - Store withdrawal account information securely
- **Status Tracking** - Monitor withdrawal status through workflow
- **Admin Processing** - Admin approval and processing workflow
- **Email Notifications** - Automatic notifications on status changes

### 5. Top-Up Management
- **Top-Up Requests** - Request wallet top-up with receipt
- **Receipt Upload** - Upload payment receipt for verification
- **Multiple Payment Methods** - Top-up via various payment methods
- **Admin Approval** - Admin verification and approval workflow
- **Status Tracking** - Track top-up request status
- **Email Notifications** - Notifications for status updates

### 6. Loan Management
- **Loan Types** - Support for multiple loan types:
  - `salary_advance` - Short-term salary advance
  - `micro_loan` - Micro loans
  - `business_loan` - Business loans
  - `equipment_loan` - Equipment financing
- **Loan Application** - Complete loan application process
- **Document Upload** - Upload required documents (income proof, bank statements, ID, etc.)
- **Credit Assessment** - Credit score and risk assessment
- **Loan Approval** - Admin approval workflow
- **Disbursement** - Loan fund disbursement
- **Repayment Schedule** - Automatic repayment schedule generation
- **Repayment Tracking** - Track loan repayments and status

### 7. Salary Advance
- **Advance Requests** - Request salary advance tied to payroll
- **Employer Approval** - Employer approval workflow
- **Payroll Integration** - Automatic deduction from salary
- **Repayment Tracking** - Track repayment status
- **Fee Management** - Processing fees and interest calculation

### 8. Financial Analytics & Reporting
- **Financial Overview** - Dashboard with key financial metrics
- **Earnings Analytics** - Detailed earnings breakdown
- **Expense Analytics** - Expense analysis and categorization
- **Transaction Reports** - Comprehensive transaction reports
- **Tax Documents** - Generate tax summaries
- **Custom Date Ranges** - Filter reports by date range
- **Export Capabilities** - Export financial data

---

## API Endpoints

### Financial Overview & Analytics

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/overview` | Get financial overview | AUTHENTICATED |
| GET | `/transactions` | Get transactions (paginated) | AUTHENTICATED |
| GET | `/earnings` | Get earnings summary | AUTHENTICATED |
| GET | `/expenses` | Get expenses summary | AUTHENTICATED |
| GET | `/reports` | Get financial reports | AUTHENTICATED |
| GET | `/tax-documents` | Get tax documents | AUTHENTICATED |

### Expenses

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/expenses` | Add expense | AUTHENTICATED |

### Withdrawals

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/withdraw` | Request withdrawal | AUTHENTICATED |
| PUT | `/withdrawals/:withdrawalId/process` | Process withdrawal | **admin** |

### Top-Ups

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| POST | `/top-up` | Request top-up (with receipt) | AUTHENTICATED |
| GET | `/top-ups` | Get all top-up requests | **admin** |
| GET | `/top-ups/my-requests` | Get my top-up requests | AUTHENTICATED |
| PUT | `/top-ups/:topUpId/process` | Process top-up request | **admin** |

### Wallet Settings

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| PUT | `/wallet/settings` | Update wallet settings | AUTHENTICATED |

### Loans (Suggested Endpoints)

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/loans` | List user loans | AUTHENTICATED |
| POST | `/loans` | Apply for loan | AUTHENTICATED |
| GET | `/loans/:id` | Loan details | AUTHENTICATED |
| PUT | `/loans/:id` | Update loan (admin/underwriting) | **admin** |
| POST | `/loans/:id/approve` | Approve loan | **admin** |
| POST | `/loans/:id/disburse` | Disburse loan | **admin** |
| POST | `/loans/:id/repayments` | Add repayment | AUTHENTICATED |

### Salary Advance (Suggested Endpoints)

| Method | Endpoint | Description | Required Roles |
|--------|----------|-------------|----------------|
| GET | `/salary-advance` | List requests | AUTHENTICATED |
| POST | `/salary-advance` | Request advance | AUTHENTICATED |
| POST | `/salary-advance/:id/approve` | Approve advance | **employer, admin** |
| POST | `/salary-advance/:id/disburse` | Disburse advance | **admin** |
| POST | `/salary-advance/:id/repay` | Mark repaid / payroll deduction | **employer, admin** |

---

## Request/Response Examples

### Get Financial Overview

```http
GET /api/finance/overview
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 50000,
    "pendingBalance": 10000,
    "totalEarnings": 200000,
    "totalExpenses": 50000,
    "recentTransactions": [
      {
        "_id": "...",
        "type": "income",
        "amount": 5000,
        "description": "Service payment",
        "status": "completed",
        "timestamp": "2025-01-15T10:00:00.000Z"
      }
    ]
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

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully",
  "data": {
    "_id": "...",
    "type": "withdrawal",
    "amount": -10000,
    "status": "pending",
    "timestamp": "2025-01-15T10:00:00.000Z"
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
  "reference": "TXN-123456",
  "notes": "Payment for wallet top-up",
  "receipt": <file>
}
```

**Response:**
```json
{
  "success": true,
  "message": "Top-up request submitted successfully",
  "data": {
    "_id": "...",
    "amount": 5000,
    "status": "pending",
    "requestedAt": "2025-01-15T10:00:00.000Z"
  }
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
  "receipt": "https://res.cloudinary.com/.../receipt.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Expense added successfully",
  "data": {
    "_id": "...",
    "type": "expense",
    "amount": -1000,
    "category": "supplies",
    "description": "Cleaning supplies",
    "status": "completed",
    "timestamp": "2025-01-15T10:00:00.000Z"
  }
}
```

### Get Transactions

```http
GET /api/finance/transactions?page=1&limit=20&type=income&status=completed
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 20,
  "total": 150,
  "page": 1,
  "pages": 8,
  "data": [
    {
      "_id": "...",
      "type": "income",
      "amount": 5000,
      "description": "Service payment",
      "paymentMethod": "paymongo",
      "status": "completed",
      "timestamp": "2025-01-15T10:00:00.000Z",
      "reference": "TXN-123456"
    }
  ]
}
```

### Update Wallet Settings

```http
PUT /api/finance/wallet/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "autoWithdraw": false,
  "minBalance": 1000,
  "notificationSettings": {
    "lowBalance": true,
    "withdrawal": true,
    "payment": true
  }
}
```

---

## Financial Workflows

### 1. Earnings Flow

```
Service Completed → Payment Processed → Earnings Added to Wallet
                                              ↓
                                    Status: pending → available
```

**Process:**
1. Provider completes service booking
2. Payment processed through payment gateway
3. Earnings added to wallet (initially as `pendingBalance`)
4. After hold period, funds move to `balance` (available)
5. Transaction recorded with type `income`

### 2. Withdrawal Flow

```
User Requests Withdrawal → Funds Moved to Pending → Admin Reviews
                                              ↓
                                    ┌─────────┴─────────┐
                                    │                   │
                              Approved              Rejected
                                    │                   │
                          Funds Removed          Funds Returned
                          Status: completed      Status: cancelled
```

**Process:**
1. User requests withdrawal with account details
2. Funds moved from `balance` to `pendingBalance`
3. Transaction created with status `pending`
4. Admin reviews and processes request
5. If approved: Funds removed from `pendingBalance`, status → `completed`
6. If rejected: Funds returned to `balance`, status → `cancelled`
7. Email notification sent to user

### 3. Top-Up Flow

```
User Submits Top-Up → Request Created → Admin Reviews Receipt
(with Receipt)          Status: pending
                                              ↓
                                    ┌─────────┴─────────┐
                                    │                   │
                              Approved              Rejected
                                    │                   │
                          Funds Added to Wallet    No Action
                          Transaction Created      Status: rejected
                          Status: approved
```

**Process:**
1. User submits top-up request with payment receipt
2. Request created with status `pending`
3. Admin receives notification
4. Admin reviews receipt and verifies payment
5. If approved: Funds added to wallet, transaction created, status → `approved`
6. If rejected: No funds added, status → `rejected`
7. Email notification sent to user

### 4. Expense Tracking Flow

```
User Adds Expense → Expense Recorded → Used for Reporting
(with Receipt)      Transaction Created    Tax Documents
```

**Process:**
1. User adds expense with details and optional receipt
2. Transaction created with type `expense`
3. Expense tracked for reporting and tax purposes
4. Available in expense summaries and reports

---

## Transaction Types

### Income Transactions
- **Type**: `income`
- **Description**: Service payments received
- **Amount**: Positive value
- **Status Flow**: `pending` → `completed`

### Expense Transactions
- **Type**: `expense`
- **Description**: Business expenses
- **Amount**: Negative value
- **Status**: Usually `completed` immediately

### Withdrawal Transactions
- **Type**: `withdrawal`
- **Description**: Funds withdrawn from wallet
- **Amount**: Negative value
- **Status Flow**: `pending` → `completed` or `cancelled`

### Top-Up Transactions
- **Type**: `topup`
- **Description**: Wallet top-up
- **Amount**: Positive value
- **Status Flow**: `pending` → `completed` (after admin approval)

### Refund Transactions
- **Type**: `refund`
- **Description**: Refund issued to user
- **Amount**: Positive value
- **Status**: `completed`

### Bonus Transactions
- **Type**: `bonus`
- **Description**: Bonus payments
- **Amount**: Positive value
- **Status**: `completed`

### Referral Transactions
- **Type**: `referral`
- **Description**: Referral commission
- **Amount**: Positive value
- **Status**: `completed`

### Loan Transactions
- **Type**: `loan_disbursement` - Loan funds disbursed
- **Type**: `loan_repayment` - Loan repayment
- **Amount**: Positive (disbursement) or Negative (repayment)
- **Status Flow**: `pending` → `completed`

### Salary Advance Transactions
- **Type**: `salary_advance`
- **Description**: Salary advance payment
- **Amount**: Positive value
- **Status Flow**: `pending` → `completed`

---

## Payment Methods

### Supported Payment Methods

1. **Wallet** - Internal wallet balance
2. **Bank Transfer** - Direct bank transfer
3. **Mobile Money** - Mobile money services
4. **Card** - Credit/debit card payments
5. **Cash** - Cash payments
6. **PayPal** - PayPal integration
7. **PayMaya** - PayMaya integration
8. **PayMongo** - PayMongo integration (primary)

### Payment Gateway Integration

**PayMongo Fields:**
- `paymongoIntentId` - Payment intent ID
- `paymongoChargeId` - Charge ID after capture
- `paymongoPaymentId` - Final payment ID

**Other Gateway Fields:**
- `paypalOrderId`, `paypalTransactionId`
- `paymayaReferenceNumber`, `paymayaCheckoutId`, `paymayaPaymentId`, `paymayaInvoiceId`, `paymayaTransactionId`
- `transactionId`, `externalReference`

---

## Data Models

### Finance (Wallet) Model

```javascript
{
  user: ObjectId,              // User reference (unique)
  wallet: {
    balance: Number,           // Available balance
    pendingBalance: Number,    // Pending funds
    lastUpdated: Date,
    autoWithdraw: Boolean,     // Auto-withdraw setting
    minBalance: Number,        // Minimum balance threshold
    notificationSettings: {
      lowBalance: Boolean,
      withdrawal: Boolean,
      payment: Boolean
    }
  },
  transactions: [{
    type: String,              // income, expense, withdrawal, etc.
    amount: Number,
    category: String,
    description: String,
    paymentMethod: String,
    status: String,            // pending, completed, failed, cancelled
    timestamp: Date,
    reference: String,
    accountDetails: Mixed,
    adminNotes: String,
    processedAt: Date,
    processedBy: ObjectId,
    paymongoIntentId: String,
    paymongoChargeId: String,
    paymongoPaymentId: String
  }],
  topUpRequests: [{
    amount: Number,
    paymentMethod: String,
    receipt: {
      url: String,
      publicId: String
    },
    reference: String,
    notes: String,
    status: String,            // pending, approved, rejected
    requestedAt: Date,
    processedAt: Date,
    processedBy: ObjectId,
    adminNotes: String
  }],
  withdrawalRequests: [{
    amount: Number,
    paymentMethod: String,
    accountDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String
    },
    status: String,           // pending, completed, cancelled
    requestedAt: Date,
    processedAt: Date,
    processedBy: ObjectId,
    adminNotes: String
  }]
}
```

### Loan Model

```javascript
{
  borrower: ObjectId,          // User reference
  type: String,                // salary_advance, micro_loan, business_loan, equipment_loan
  amount: {
    requested: Number,
    approved: Number,
    disbursed: Number,
    currency: String
  },
  purpose: String,
  term: {
    duration: Number,          // in months
    interestRate: Number,      // APR
    repaymentFrequency: String // weekly, bi-weekly, monthly
  },
  status: String,             // pending, under_review, approved, rejected, disbursed, active, completed, defaulted
  application: {
    submittedAt: Date,
    documents: [{
      type: String,            // income_proof, bank_statement, id_document, business_license, other
      url: String,
      uploadedAt: Date
    }],
    creditScore: Number,
    riskAssessment: {
      score: Number,
      factors: [String]
    }
  },
  approval: {
    approvedBy: ObjectId,
    approvedAt: Date,
    conditions: [String],
    notes: String
  },
  disbursement: {
    method: String,            // bank_transfer, mobile_money, cash
    accountDetails: {
      bankName: String,
      accountNumber: String,
      routingNumber: String
    },
    disbursedAt: Date,
    transactionId: String
  },
  repayment: {
    schedule: [{
      dueDate: Date,
      amount: Number,
      principal: Number,
      interest: Number,
      status: String,          // pending, paid, overdue, waived
      paidAt: Date,
      transactionId: String
    }],
    totalPaid: Number,
    remainingBalance: Number,
    nextPaymentDate: Date
  },
  partner: {
    name: String,
    apiKey: String,
    loanId: String
  }
}
```

### Salary Advance Model

```javascript
{
  employee: ObjectId,          // Employee user reference
  employer: ObjectId,          // Employer user reference
  amount: {
    requested: Number,
    approved: Number,
    currency: String
  },
  salary: {
    monthly: Number,
    nextPayDate: Date,
    frequency: String         // weekly, bi-weekly, monthly
  },
  status: String,             // pending, approved, rejected, disbursed, repaid
  repayment: {
    dueDate: Date,
    amount: Number,
    deductedFromSalary: Boolean,
    repaidAt: Date
  },
  fees: {
    processingFee: Number,
    interestRate: Number,
    totalFees: Number
  }
}
```

### Transaction Model

```javascript
{
  user: ObjectId,
  type: String,               // loan_disbursement, loan_repayment, salary_advance, payment, refund, fee
  amount: Number,
  currency: String,           // Default: USD
  direction: String,          // inbound, outbound
  description: String,
  reference: String,          // Required, unique
  status: String,             // pending, completed, failed, cancelled
  paymentMethod: String,      // bank_transfer, mobile_money, card, cash, paypal, paymaya, paymongo
  transactionId: String,
  externalReference: String,
  paypalOrderId: String,
  paypalTransactionId: String,
  paymayaReferenceNumber: String,
  paymayaCheckoutId: String,
  paymayaPaymentId: String,
  paymayaInvoiceId: String,
  paymayaTransactionId: String,
  paymongoIntentId: String,
  paymongoChargeId: String,
  paymongoPaymentId: String,
  metadata: Mixed,
  timestamp: Date
}
```

---

## Admin Finance Management

### Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/top-ups` | Get all top-up requests | Admin |
| PUT | `/top-ups/:topUpId/process` | Process top-up request | Admin |
| PUT | `/withdrawals/:withdrawalId/process` | Process withdrawal request | Admin |

### Admin Workflows

**Withdrawal Processing:**
1. Admin reviews withdrawal request
2. Admin verifies account details
3. Admin approves or rejects
4. If approved: Funds removed from pending balance
5. If rejected: Funds returned to available balance
6. Email notification sent to user

**Top-Up Processing:**
1. Admin receives top-up request notification
2. Admin reviews payment receipt
3. Admin verifies payment amount
4. Admin approves or rejects
5. If approved: Funds added to wallet, transaction created
6. If rejected: No action taken
7. Email notification sent to user

---

## Security & Compliance

### Security Features
- **Authentication Required** - All endpoints require valid JWT token
- **Role-Based Access** - Admin endpoints restricted to admin role
- **Data Protection** - Financial data only accessible to user and admins
- **Audit Trail** - All transactions and admin actions logged
- **Secure Storage** - Payment credentials stored securely
- **PII Masking** - Personal information masked in logs/exports

### Compliance Considerations
- **KYC Checks** - Know Your Customer verification for large transactions
- **AML Workflows** - Anti-Money Laundering checks for withdrawals
- **Tax Reporting** - Generate tax documents and summaries
- **Transaction Immutability** - Financial records cannot be edited (use correcting entries)
- **Idempotency** - External payment actions use idempotency keys

---

## Best Practices

### For Users
1. **Monitor Balance** - Regularly check wallet balance and transactions
2. **Keep Receipts** - Maintain receipts for expenses and top-ups
3. **Secure Account** - Use strong authentication and protect account details
4. **Review Transactions** - Regularly review transaction history
5. **Set Notifications** - Configure notification settings for important events

### For Admins
1. **Review Thoroughly** - Verify receipts and account details before processing
2. **Add Clear Notes** - Include detailed notes for audit purposes
3. **Process Promptly** - Review and process requests in a timely manner
4. **Security** - Never share admin credentials, verify suspicious activity
5. **Documentation** - Maintain detailed records for audit purposes

### For Developers
1. **Atomic Updates** - Ensure wallet balance updates are atomic
2. **Error Handling** - Handle all error cases gracefully
3. **Logging** - Log all financial operations for audit trail
4. **Validation** - Validate all inputs and amounts
5. **Testing** - Test all workflows including edge cases

---

## Key Metrics

- **Wallet Balance** - Total available and pending balances
- **Transaction Volume** - Total transaction count and value
- **Earnings** - Total and pending earnings
- **Expenses** - Total expenses by category
- **Withdrawal Rate** - Withdrawal requests and processing time
- **Top-Up Rate** - Top-up requests and approval rate
- **Loan Portfolio** - Active loans and repayment status
- **Payment Method Distribution** - Usage by payment method

---

## Related Features

The Finance feature integrates with several other features in the LocalPro Super App:

- **Marketplace** - Service payments and earnings
- **Bookings** - Payment processing for bookings
- **Escrows** - Escrow payment holding system
- **Providers** - Provider earnings and payouts
- **User Management** - User profiles and authentication
- **Communication** - Email notifications
- **Analytics** - Financial analytics and reporting

---

## Error Handling

**Common Error Codes:**
- `400` - Validation errors (invalid amount, missing fields)
- `403` - Unauthorized (insufficient permissions)
- `404` - Not found (transaction or request doesn't exist)
- `409` - Conflict (insufficient balance, duplicate request)
- `500` - Server error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be greater than 0"
    }
  ]
}
```

---

## Email Notifications

### Withdrawal Status Update
- **Trigger**: When admin processes withdrawal
- **Recipient**: User who requested withdrawal
- **Content**: Status (approved/rejected), amount, admin notes

### Top-Up Status Update
- **Trigger**: When admin processes top-up
- **Recipient**: User who submitted top-up
- **Content**: Status (approved/rejected), amount, admin notes

### New Top-Up Request
- **Trigger**: When user submits top-up request
- **Recipient**: Admin
- **Content**: User details, amount, payment method, receipt URL

---

*For detailed implementation guidance, see the individual documentation files in the `features/finance/` and `docs/features/` directories.*

