/**
 * Example usage of LocalPro SDK - Escrow Feature
 * 
 * This example demonstrates how to use the LocalPro SDK to manage escrow transactions.
 */

const LocalPro = require('../index');

// Initialize the SDK
const client = new LocalPro({
  apiKey: process.env.LOCALPRO_API_KEY || 'your-api-key',
  apiSecret: process.env.LOCALPRO_API_SECRET || 'your-api-secret',
  baseURL: process.env.LOCALPRO_API_URL || 'http://localhost:5000'
});

async function escrowExample() {
  try {
    console.log('=== LocalPro SDK Escrow Example ===\n');

    // 1. Create a new escrow
    console.log('1. Creating escrow...');
    const escrow = await client.escrow.create({
      bookingId: '507f1f77bcf86cd799439011',
      providerId: '507f1f77bcf86cd799439012',
      amount: 10000, // $100.00 in cents
      currency: 'USD',
      holdProvider: 'paymongo'
    });
    console.log('✓ Escrow created:', escrow.data.id);
    console.log('  Status:', escrow.data.status);
    console.log('  Amount:', escrow.data.amount / 100, escrow.data.currency);
    console.log('');

    const escrowId = escrow.data.id;

    // 2. Get escrow details
    console.log('2. Getting escrow details...');
    const details = await client.escrow.getById(escrowId);
    console.log('✓ Escrow details retrieved');
    console.log('  Client ID:', details.data.escrow.clientId);
    console.log('  Provider ID:', details.data.escrow.providerId);
    console.log('');

    // 3. Provider uploads proof of work
    console.log('3. Uploading proof of work...');
    const proof = await client.escrow.uploadProofOfWork(escrowId, {
      documents: [
        { url: 'https://example.com/proof1.jpg' },
        { url: 'https://example.com/proof2.jpg' }
      ],
      notes: 'Work completed as per agreement. All tasks finished successfully.'
    });
    console.log('✓ Proof of work uploaded');
    console.log('');

    // 4. Client captures payment (approves)
    console.log('4. Capturing payment (client approval)...');
    const captured = await client.escrow.capture(escrowId);
    console.log('✓ Payment captured');
    console.log('  New status:', captured.data.status);
    console.log('');

    // 5. Get transaction history
    console.log('5. Getting transaction history...');
    const transactions = await client.escrow.getTransactions(escrowId);
    console.log('✓ Transaction history retrieved');
    console.log('  Total transactions:', transactions.data.transactions.length);
    transactions.data.transactions.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.transactionType} - ${tx.status} - ${tx.amount / 100} ${tx.currency}`);
    });
    console.log('');

    // 6. Provider requests payout
    console.log('6. Requesting payout...');
    const payout = await client.escrow.requestPayout(escrowId);
    console.log('✓ Payout requested');
    console.log('  Payout ID:', payout.data.payout.id);
    console.log('  Status:', payout.data.payout.status);
    console.log('');

    // 7. Get payout details
    console.log('7. Getting payout details...');
    const payoutDetails = await client.escrow.getPayoutDetails(escrowId);
    console.log('✓ Payout details retrieved');
    console.log('  Amount:', payoutDetails.data.payout.amount / 100, payoutDetails.data.payout.currency);
    console.log('  Provider:', payoutDetails.data.payout.payoutProvider);
    console.log('');

    // 8. List all escrows
    console.log('8. Listing all escrows...');
    const allEscrows = await client.escrow.list({
      page: 1,
      limit: 10
    });
    console.log('✓ Escrows retrieved');
    console.log('  Total:', allEscrows.data.pagination.total);
    console.log('  Page:', allEscrows.data.pagination.page);
    console.log('');

    console.log('=== Example completed successfully! ===');

  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('  Status:', error.statusCode);
    
    if (error.response) {
      console.error('  Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

// Alternative example: Handling disputes
async function disputeExample() {
  try {
    console.log('\n=== Dispute Example ===\n');

    const escrowId = 'your-escrow-id';

    // Initiate a dispute
    console.log('Initiating dispute...');
    const dispute = await client.escrow.initiateDispute(escrowId, {
      reason: 'Service not delivered as promised',
      evidence: [
        { url: 'https://example.com/evidence1.jpg' },
        { url: 'https://example.com/evidence2.jpg' }
      ]
    });
    console.log('✓ Dispute initiated');
    console.log('  Status:', dispute.data.status);
    console.log('  Reason:', dispute.data.dispute.reason);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Alternative example: Refunding payment
async function refundExample() {
  try {
    console.log('\n=== Refund Example ===\n');

    const escrowId = 'your-escrow-id';

    // Refund payment
    console.log('Refunding payment...');
    const refund = await client.escrow.refund(escrowId, 'Client requested cancellation');
    console.log('✓ Payment refunded');
    console.log('  Status:', refund.data.status);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  escrowExample()
    .then(() => {
      console.log('\nAll examples completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  escrowExample,
  disputeExample,
  refundExample
};
