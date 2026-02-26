# @localpro/escrow

> Official Escrow SDK for the LocalPro Super App platform.

Manage the full escrow lifecycle — fund holding, proof of work, disputes, payouts and more — with a clean, focused API.

---

## Installation

```bash
npm install @localpro/escrow
# or
pnpm add @localpro/escrow
```

---

## Quick Start

```js
const LocalProEscrow = require('@localpro/escrow');

const escrow = new LocalProEscrow({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  baseURL: 'https://api.localpro.com' // optional
});

// Create an escrow
const result = await escrow.create({
  bookingId: 'booking-abc',
  providerId: 'provider-xyz',
  amount: 50000, // in cents
  currency: 'PHP',
  holdProvider: 'paymongo'
});

console.log(result.data); // escrow object
```

---

## Configuration

| Option      | Type     | Required | Default                    | Description                        |
|-------------|----------|----------|----------------------------|------------------------------------|
| `apiKey`    | `string` | ✅       | —                          | Your LocalPro API key              |
| `apiSecret` | `string` | ✅       | —                          | Your LocalPro API secret           |
| `baseURL`   | `string` | ❌       | `http://localhost:5000`    | API base URL                       |
| `timeout`   | `number` | ❌       | `30000`                    | Request timeout in milliseconds    |
| `headers`   | `object` | ❌       | `{}`                       | Additional HTTP headers            |

---

## API Reference

### Core Lifecycle

#### `escrow.create(data)` → `Promise<Object>`
Create a new escrow and initiate a payment hold.

```js
await escrow.create({
  bookingId: 'booking-123',
  providerId: 'provider-456',
  amount: 50000,        // in cents
  currency: 'PHP',
  holdProvider: 'paymongo', // paymongo | xendit | stripe | paypal | paymaya
  description: 'House cleaning service',
  metadata: { jobType: 'cleaning' }
});
```

#### `escrow.getById(escrowId)` → `Promise<Object>`
Fetch a single escrow by ID.

#### `escrow.list(filters)` → `Promise<Object>`
List escrows for the authenticated user.

```js
await escrow.list({ status: 'FUNDS_HELD', role: 'client', page: 1, limit: 20 });
```

#### `escrow.capture(escrowId)` → `Promise<Object>`
Capture held payment after client approves the work.

#### `escrow.release(escrowId)` → `Promise<Object>`
Release funds to the provider (admin/system use).

#### `escrow.refund(escrowId, reason?)` → `Promise<Object>`
Refund held payment back to the client.

#### `escrow.cancel(escrowId, reason?)` → `Promise<Object>`
Cancel an escrow (only valid while in `CREATED` status).

---

### Proof of Work

#### `escrow.submitProofOfWork(escrowId, proof)` → `Promise<Object>`
Submit proof of completed work (Provider only).

```js
await escrow.submitProofOfWork('escrow-id', {
  documents: [{ url: 'https://cdn.example.com/proof.jpg', type: 'image' }],
  notes: 'Work completed as agreed'
});
```

#### `escrow.uploadProofFiles(escrowId, formData)` → `Promise<Object>`
Upload proof files via multipart/form-data.

---

### Disputes

#### `escrow.openDispute(escrowId, disputeData)` → `Promise<Object>`
Open a dispute on an escrow.

```js
await escrow.openDispute('escrow-id', {
  reason: 'Work was not completed as described',
  evidence: [{ url: 'https://cdn.example.com/evidence.jpg' }]
});
```

#### `escrow.resolveDispute(escrowId, resolution)` → `Promise<Object>`
Resolve an open dispute (Admin only).

```js
await escrow.resolveDispute('escrow-id', {
  outcome: 'partial', // release | refund | partial
  providerAmount: 30000,
  clientAmount: 20000,
  notes: 'Partial resolution agreed'
});
```

---

### Payouts

#### `escrow.requestPayout(escrowId, options?)` → `Promise<Object>`
Request a payout after escrow is complete (Provider only).

#### `escrow.getPayoutDetails(escrowId)` → `Promise<Object>`
Get payout details for an escrow.

---

### History & Transactions

#### `escrow.getTransactions(escrowId)` → `Promise<Object>`
Get the transaction history for an escrow.

#### `escrow.getHistory(escrowId)` → `Promise<Object>`
Get the full audit/status history for an escrow.

---

### Admin

#### `escrow.adminList(filters?)` → `Promise<Object>`
List all escrows across all users (Admin only).

#### `escrow.adminUpdateStatus(escrowId, status, notes?)` → `Promise<Object>`
Manually update an escrow status (Admin only).

---

## Escrow Statuses

| Status             | Description                                      |
|--------------------|--------------------------------------------------|
| `CREATED`          | Escrow created, awaiting payment hold            |
| `FUNDS_HELD`       | Payment held successfully                        |
| `IN_PROGRESS`      | Job/service in progress                          |
| `PENDING_APPROVAL` | Proof submitted, awaiting client approval        |
| `COMPLETE`         | Funds released to provider                       |
| `DISPUTE`          | Dispute opened                                   |
| `REFUNDED`         | Funds refunded to client                         |
| `CANCELLED`        | Escrow cancelled before funds were held          |

---

## Error Handling

```js
const { Errors } = require('@localpro/escrow');
const {
  LocalProEscrowAuthenticationError,
  LocalProEscrowValidationError,
  LocalProEscrowNotFoundError,
  LocalProEscrowRateLimitError,
  LocalProEscrowAPIError
} = Errors;

try {
  await escrow.capture('invalid-id');
} catch (err) {
  if (err instanceof LocalProEscrowNotFoundError) {
    console.error('Escrow not found:', err.message);
  } else if (err instanceof LocalProEscrowAuthenticationError) {
    console.error('Auth error:', err.message);
  } else if (err instanceof LocalProEscrowValidationError) {
    console.error('Validation error:', err.message);
  } else if (err instanceof LocalProEscrowRateLimitError) {
    console.error('Rate limited. Retry after a moment.');
  } else {
    console.error('API error:', err.message, err.statusCode);
  }
}
```

---

## Advanced Usage

```js
// Use EscrowAPI and EscrowClient directly
const { EscrowAPI, EscrowClient } = require('@localpro/escrow');

const client = new EscrowClient({ apiKey: '...', apiSecret: '...' });
const api = new EscrowAPI(client);

const escrow = await api.getById('escrow-id');
```

---

## License

MIT © LocalPro
