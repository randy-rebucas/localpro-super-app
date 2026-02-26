/**
 * LocalPro Escrow SDK - Basic Usage Example
 *
 * Run: node examples/basic-usage.js
 */

const LocalProEscrow = require('../index');

const escrow = new LocalProEscrow({
  apiKey: process.env.LOCALPRO_API_KEY || 'your-api-key',
  apiSecret: process.env.LOCALPRO_API_SECRET || 'your-api-secret',
  baseURL: process.env.LOCALPRO_BASE_URL || 'http://localhost:5000'
});

async function main() {
  // ── 1. Create an escrow ────────────────────────────────────────────────────
  console.log('Creating escrow...');
  const created = await escrow.create({
    bookingId: 'booking-001',
    providerId: 'provider-001',
    amount: 50000, // PHP 500.00
    currency: 'PHP',
    holdProvider: 'paymongo',
    description: 'House cleaning service - 3 hours'
  });
  const escrowId = created.data._id;
  console.log('Escrow created:', escrowId);

  // ── 2. Fetch the escrow ─────────────────────────────────────────────────────
  const detail = await escrow.getById(escrowId);
  console.log('Status:', detail.data.status);

  // ── 3. Submit proof of work (provider) ─────────────────────────────────────
  await escrow.submitProofOfWork(escrowId, {
    documents: [{ url: 'https://cdn.example.com/proof-001.jpg', type: 'image' }],
    notes: 'All rooms cleaned and sanitized.'
  });
  console.log('Proof submitted');

  // ── 4. Capture payment (client approves) ───────────────────────────────────
  const captured = await escrow.capture(escrowId);
  console.log('Escrow complete. Status:', captured.data.status);

  // ── 5. Request payout (provider) ───────────────────────────────────────────
  const payout = await escrow.requestPayout(escrowId);
  console.log('Payout requested:', payout.data);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
