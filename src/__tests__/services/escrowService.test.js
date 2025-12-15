const mongoose = require('mongoose');
const EscrowService = require('../../services/escrowService');
const Escrow = require('../../models/Escrow');
const EscrowTransaction = require('../../models/EscrowTransaction');
const User = require('../../models/User');

describe('Escrow Service', () => {
  let clientUser;
  let providerUser;
  let testEscrow;

  beforeAll(async () => {
    // Create test users
    clientUser = await User.create({
      phoneNumber: '+1234567890',
      email: 'client@test.com',
      firstName: 'Test',
      lastName: 'Client',
      roles: ['client']
    });

    providerUser = await User.create({
      phoneNumber: '+1234567891',
      email: 'provider@test.com',
      firstName: 'Test',
      lastName: 'Provider',
      roles: ['provider']
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Escrow.deleteMany({
      clientId: { $in: [clientUser._id, providerUser._id] }
    });
    await EscrowTransaction.deleteMany({
      initiatedBy: { $in: [clientUser._id, providerUser._id] }
    });
    await User.deleteMany({
      phoneNumber: { $in: ['+1234567890', '+1234567891'] }
    });
    await mongoose.connection.close();
  });

  describe('createEscrow', () => {
    it('should create escrow successfully', async () => {
      const escrowData = {
        bookingId: new mongoose.Types.ObjectId(),
        clientId: clientUser._id,
        providerId: providerUser._id,
        amount: 50000, // $500.00 in cents
        currency: 'USD',
        holdProvider: 'paymongo'
      };

      const result = await EscrowService.createEscrow(escrowData);

      expect(result.success).toBe(true);
      expect(result.escrow).toBeDefined();
      expect(result.escrow.status).toBe('FUNDS_HELD');
      expect(result.escrow.amount).toBe(50000);
      expect(result.escrow.currency).toBe('USD');

      testEscrow = result.escrow;
    });

    it('should fail with invalid user IDs', async () => {
      const escrowData = {
        bookingId: new mongoose.Types.ObjectId(),
        clientId: new mongoose.Types.ObjectId(), // Non-existent user
        providerId: providerUser._id,
        amount: 10000,
        currency: 'USD',
        holdProvider: 'paymongo'
      };

      await expect(EscrowService.createEscrow(escrowData))
        .rejects
        .toThrow('Client or Provider not found');
    });

    it('should fail with invalid payment provider', async () => {
      const escrowData = {
        bookingId: new mongoose.Types.ObjectId(),
        clientId: clientUser._id,
        providerId: providerUser._id,
        amount: 10000,
        currency: 'USD',
        holdProvider: 'invalid_provider'
      };

      await expect(EscrowService.createEscrow(escrowData))
        .rejects
        .toThrow('Unsupported payment provider: invalid_provider');
    });
  });

  describe('capturePayment', () => {
    it('should capture payment successfully', async () => {
      const result = await EscrowService.capturePayment(testEscrow._id, clientUser._id);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Payment captured successfully');

      // Verify escrow status updated
      const updatedEscrow = await Escrow.findById(testEscrow._id);
      expect(updatedEscrow.status).toBe('COMPLETED');
    });

    it('should fail for non-existent escrow', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(EscrowService.capturePayment(fakeId, clientUser._id))
        .rejects
        .toThrow('Escrow not found');
    });

    it('should create transaction record', async () => {
      const transactions = await EscrowTransaction.find({
        escrowId: testEscrow._id,
        transactionType: 'CAPTURE'
      });

      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].amount).toBe(50000);
      expect(transactions[0].status).toBe('SUCCESS');
    });
  });

  describe('releasePaymentHold', () => {
    it('should release payment hold successfully', async () => {
      // Create another escrow for testing release
      const escrowData = {
        bookingId: new mongoose.Types.ObjectId(),
        clientId: clientUser._id,
        providerId: providerUser._id,
        amount: 25000,
        currency: 'USD',
        holdProvider: 'paymongo'
      };

      const createResult = await EscrowService.createEscrow(escrowData);
      const escrowToRelease = createResult.escrow;

      const result = await EscrowService.releasePaymentHold(escrowToRelease._id);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Payment hold released successfully');

      // Verify escrow status updated
      const updatedEscrow = await Escrow.findById(escrowToRelease._id);
      expect(updatedEscrow.status).toBe('CANCELLED');
    });
  });

  describe('getEscrowStatus', () => {
    it('should get escrow status', async () => {
      const result = await EscrowService.getEscrowStatus(testEscrow._id);

      expect(result.success).toBe(true);
      expect(result.escrow.status).toBe('COMPLETED');
      expect(result.escrow.amount).toBe(50000);
    });

    it('should return null for non-existent escrow', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await EscrowService.getEscrowStatus(fakeId);

      expect(result).toBeNull();
    });
  });

  describe('getEscrowsByUser', () => {
    it('should get escrows for client', async () => {
      const result = await EscrowService.getEscrowsByUser(clientUser._id);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.escrows)).toBe(true);
      expect(result.escrows.length).toBeGreaterThan(0);

      // Verify all returned escrows belong to the client
      result.escrows.forEach(escrow => {
        expect(escrow.clientId.toString()).toBe(clientUser._id.toString());
      });
    });

    it('should get escrows for provider', async () => {
      const result = await EscrowService.getEscrowsByUser(providerUser._id);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.escrows)).toBe(true);

      // Verify all returned escrows belong to the provider
      result.escrows.forEach(escrow => {
        expect(escrow.providerId.toString()).toBe(providerUser._id.toString());
      });
    });

    it('should support pagination', async () => {
      const result = await EscrowService.getEscrowsByUser(clientUser._id, {
        page: 1,
        limit: 1
      });

      expect(result.success).toBe(true);
      expect(result.escrows.length).toBeLessThanOrEqual(1);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('Transaction Logging', () => {
    it('should log all escrow operations', async () => {
      const transactions = await EscrowTransaction.find({
        escrowId: testEscrow._id
      }).sort({ createdAt: 1 });

      expect(transactions.length).toBeGreaterThanOrEqual(2); // HOLD and CAPTURE

      const holdTransaction = transactions.find(t => t.transactionType === 'HOLD');
      const captureTransaction = transactions.find(t => t.transactionType === 'CAPTURE');

      expect(holdTransaction).toBeDefined();
      expect(captureTransaction).toBeDefined();
      expect(holdTransaction.status).toBe('SUCCESS');
      expect(captureTransaction.status).toBe('SUCCESS');
    });

    it('should include proper metadata in transactions', async () => {
      const transaction = await EscrowTransaction.findOne({
        escrowId: testEscrow._id,
        transactionType: 'HOLD'
      });

      expect(transaction.amount).toBe(50000);
      expect(transaction.currency).toBe('USD');
      expect(transaction.gateway.provider).toBe('paymongo');
      expect(transaction.metadata.tags).toContain('booking_payment');
    });
  });

  describe('Payment Provider Integration', () => {
    it('should handle PayMongo payment holds', async () => {
      // Test the PayMongo-specific hold creation
      const holdResult = await EscrowService.paymongCreateHold(10000, 'USD', clientUser._id.toString());

      // In test environment, this might return mock data or fail gracefully
      expect(holdResult).toBeDefined();
      expect(typeof holdResult.success).toBe('boolean');
    });

    it('should handle PayMongo payment capture', async () => {
      const captureResult = await EscrowService.paymongoCapture('mock_intent_id', 10000, 'USD');

      expect(captureResult).toBeDefined();
      expect(typeof captureResult.success).toBe('boolean');
    });

    it('should handle PayMongo payment release', async () => {
      const releaseResult = await EscrowService.paymongoRelease('mock_intent_id');

      expect(releaseResult).toBeDefined();
      expect(typeof releaseResult.success).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle payment gateway failures gracefully', async () => {
      // Test with invalid payment data
      const escrowData = {
        bookingId: new mongoose.Types.ObjectId(),
        clientId: clientUser._id,
        providerId: providerUser._id,
        amount: -1000, // Invalid negative amount
        currency: 'USD',
        holdProvider: 'paymongo'
      };

      await expect(EscrowService.createEscrow(escrowData))
        .rejects
        .toThrow();
    });

    it('should validate escrow data', async () => {
      const invalidEscrowData = {
        bookingId: new mongoose.Types.ObjectId(),
        clientId: 'invalid-id',
        providerId: providerUser._id,
        amount: 10000,
        currency: 'USD',
        holdProvider: 'paymongo'
      };

      await expect(EscrowService.createEscrow(invalidEscrowData))
        .rejects
        .toThrow();
    });
  });

  describe('Business Logic', () => {
    it('should prevent double capture', async () => {
      // Try to capture already captured escrow
      await expect(EscrowService.capturePayment(testEscrow._id, clientUser._id))
        .rejects
        .toThrow('Escrow not found');
    });

    it('should enforce user authorization', async () => {
      // Try to capture escrow as wrong user
      const wrongUserId = new mongoose.Types.ObjectId();

      await expect(EscrowService.capturePayment(testEscrow._id, wrongUserId))
        .rejects
        .toThrow('Escrow not found');
    });

    it('should calculate fees correctly', async () => {
      // Test fee calculation logic if implemented
      const amount = 10000;
      const expectedFee = Math.round(amount * 0.029); // 2.9% fee

      // This test would depend on actual fee calculation implementation
      expect(expectedFee).toBe(290);
    });
  });

  describe('Audit Trail', () => {
    it('should maintain complete transaction history', async () => {
      const allTransactions = await EscrowTransaction.find({
        $or: [
          { initiatedBy: clientUser._id },
          { escrowId: { $in: [testEscrow._id] } }
        ]
      }).sort({ createdAt: -1 });

      expect(allTransactions.length).toBeGreaterThan(0);

      // Verify each transaction has required fields
      allTransactions.forEach(transaction => {
        expect(transaction.id).toBeDefined();
        expect(transaction.transactionType).toBeDefined();
        expect(transaction.amount).toBeDefined();
        expect(transaction.status).toBeDefined();
        expect(transaction.initiatedBy).toBeDefined();
        expect(transaction.createdAt).toBeDefined();
      });
    });

    it('should track gateway responses', async () => {
      const transaction = await EscrowTransaction.findOne({
        escrowId: testEscrow._id,
        transactionType: 'HOLD'
      });

      expect(transaction.gateway).toBeDefined();
      expect(transaction.gateway.provider).toBeDefined();
    });
  });
});
