const Escrow = require('../models/Escrow');
const Payout = require('../models/Payout');
const EscrowTransaction = require('../models/EscrowTransaction');
const User = require('../models/User');
const logger = require('../config/logger');
const EmailService = require('./emailService');
// const axios = require('axios'); // Available for direct API calls
const paymongoService = require('./paymongoService');

class EscrowService {
  /**
   * Create a new escrow and initiate payment hold
   */
  async createEscrow(escrowData) {
    try {
      const { bookingId, clientId, providerId, amount, currency, holdProvider } = escrowData;

      // Validate users exist
      const [client, provider] = await Promise.all([
        User.findById(clientId),
        User.findById(providerId)
      ]);

      if (!client || !provider) {
        throw new Error('Client or Provider not found');
      }

      // Create hold with payment gateway
      const holdResult = await this.createPaymentHold({
        amount,
        currency,
        holdProvider,
        clientId,
        bookingId
      });

      if (!holdResult.success) {
        throw new Error(`Payment hold failed: ${holdResult.message}`);
      }

      // Create escrow record
      const escrow = new Escrow({
        bookingId,
        clientId,
        providerId,
        currency,
        amount,
        holdProvider,
        providerHoldId: holdResult.holdId,
        status: 'FUNDS_HELD'
      });

      await escrow.save();

      // Log transaction
      await this.logTransaction({
        escrowId: escrow._id,
        transactionType: 'HOLD',
        amount,
        currency,
        status: 'SUCCESS',
        initiatedBy: clientId,
        gateway: {
          provider: holdProvider,
          transactionId: holdResult.holdId
        },
        metadata: {
          reason: 'Payment hold for booking',
          tags: ['booking_payment']
        }
      });

      // Send notifications
      await this.sendNotifications({
        type: 'escrow_created',
        escrow,
        client,
        provider
      });

      return {
        success: true,
        escrow,
        message: 'Escrow created successfully with funds held'
      };
    } catch (error) {
      logger.error('Escrow creation error:', error);
      throw error;
    }
  }

  /**
   * Capture held payment after client approval
   */
  async capturePayment(escrowId, clientId) {
    try {
      const escrow = await Escrow.findById(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.clientId.toString() !== clientId.toString()) {
        throw new Error('Unauthorized: Only the client can approve capture');
      }

      if (escrow.status !== 'FUNDS_HELD') {
        throw new Error(`Cannot capture: Escrow status is ${escrow.status}`);
      }

      // Capture payment from gateway
      const captureResult = await this.capturePaymentGateway({
        holdId: escrow.providerHoldId,
        amount: escrow.amount,
        currency: escrow.currency,
        provider: escrow.holdProvider
      });

      if (!captureResult.success) {
        throw new Error(`Payment capture failed: ${captureResult.message}`);
      }

      // Update escrow status
      escrow.status = 'IN_PROGRESS';
      escrow.clientApproval.approved = true;
      escrow.clientApproval.approvedAt = new Date();
      await escrow.save();

      // Log transaction
      await this.logTransaction({
        escrowId: escrow._id,
        transactionType: 'CAPTURE',
        amount: escrow.amount,
        currency: escrow.currency,
        status: 'SUCCESS',
        initiatedBy: clientId,
        gateway: {
          provider: escrow.holdProvider,
          transactionId: captureResult.captureId
        },
        metadata: {
          reason: 'Client approved - payment captured',
          tags: ['payment_capture']
        }
      });

      // Send notifications
      const [client, provider] = await Promise.all([
        User.findById(escrow.clientId),
        User.findById(escrow.providerId)
      ]);

      await this.sendNotifications({
        type: 'payment_captured',
        escrow,
        client,
        provider
      });

      return {
        success: true,
        escrow,
        message: 'Payment captured successfully'
      };
    } catch (error) {
      logger.error('Payment capture error:', error);
      throw error;
    }
  }

  /**
   * Refund held payment (before capture)
   */
  async refundPayment(escrowId, reason, initiatedBy) {
    try {
      const escrow = await Escrow.findById(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (!['CREATED', 'FUNDS_HELD'].includes(escrow.status)) {
        throw new Error(`Cannot refund: Escrow status is ${escrow.status}`);
      }

      // Release hold from gateway
      const refundResult = await this.releasePaymentHold({
        holdId: escrow.providerHoldId,
        provider: escrow.holdProvider
      });

      if (!refundResult.success) {
        throw new Error(`Payment refund failed: ${refundResult.message}`);
      }

      // Update escrow
      escrow.status = 'REFUNDED';
      await escrow.save();

      // Log transaction
      await this.logTransaction({
        escrowId: escrow._id,
        transactionType: 'REFUND',
        amount: escrow.amount,
        currency: escrow.currency,
        status: 'SUCCESS',
        initiatedBy,
        gateway: {
          provider: escrow.holdProvider,
          transactionId: refundResult.releaseId
        },
        metadata: {
          reason,
          tags: ['payment_refund']
        }
      });

      // Send notifications
      const [client, provider] = await Promise.all([
        User.findById(escrow.clientId),
        User.findById(escrow.providerId)
      ]);

      await this.sendNotifications({
        type: 'payment_refunded',
        escrow,
        client,
        provider,
        reason
      });

      return {
        success: true,
        escrow,
        message: 'Payment refunded successfully'
      };
    } catch (error) {
      logger.error('Payment refund error:', error);
      throw error;
    }
  }

  /**
   * Process payout to provider
   */
  async processPayout(escrowId, providerId) {
    try {
      const escrow = await Escrow.findById(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.providerId.toString() !== providerId.toString()) {
        throw new Error('Unauthorized: Invalid provider');
      }

      if (escrow.status !== 'IN_PROGRESS') {
        throw new Error(`Cannot process payout: Escrow status is ${escrow.status}`);
      }

      if (!escrow.clientApproval.approved) {
        throw new Error('Cannot payout: Client has not approved');
      }

      // Get provider payout method
      const provider = await User.findById(providerId);
      if (!provider.payoutMethods || provider.payoutMethods.length === 0) {
        throw new Error('Provider has no payout methods configured');
      }

      const payoutMethod = provider.payoutMethods[0]; // Use primary method

      // Initiate payout via gateway
      const payoutResult = await this.initiatePayoutGateway({
        amount: escrow.amount,
        currency: escrow.currency,
        provider: 'xendit', // Default to xendit, could be flexible
        payoutMethod,
        providerId,
        escrowId: escrow._id,
        reference: escrow.id
      });

      if (!payoutResult.success) {
        throw new Error(`Payout initiation failed: ${payoutResult.message}`);
      }

      // Create payout record
      const payout = new Payout({
        escrowId: escrow._id,
        providerId,
        amount: escrow.amount,
        currency: escrow.currency,
        payoutProvider: 'xendit',
        gatewayPayoutId: payoutResult.payoutId,
        providerPayoutMethod: {
          type: payoutMethod.type,
          accountDetails: payoutMethod.details
        },
        status: 'PROCESSING',
        metadata: {
          reference: escrow.id,
          description: `Payout for booking ${escrow.bookingId}`
        }
      });

      await payout.save();

      // Update escrow status
      escrow.status = 'PAYOUT_INITIATED';
      await escrow.save();

      // Log transaction
      await this.logTransaction({
        escrowId: escrow._id,
        transactionType: 'PAYOUT',
        amount: escrow.amount,
        currency: escrow.currency,
        status: 'SUCCESS',
        initiatedBy: providerId,
        gateway: {
          provider: 'xendit',
          transactionId: payoutResult.payoutId
        },
        metadata: {
          reason: 'Payout initiated to provider',
          relatedPayoutId: payout._id,
          tags: ['payout_initiated']
        }
      });

      // Send notifications
      const client = await User.findById(escrow.clientId);

      await this.sendNotifications({
        type: 'payout_initiated',
        escrow,
        client,
        provider,
        payout
      });

      return {
        success: true,
        escrow,
        payout,
        message: 'Payout initiated successfully'
      };
    } catch (error) {
      logger.error('Payout processing error:', error);
      throw error;
    }
  }

  /**
   * Complete payout (called from webhook)
   */
  async completePayout(payoutId, _gatewayData) {
    try {
      const payout = await Payout.findById(payoutId);

      if (!payout) {
        throw new Error('Payout not found');
      }

      payout.status = 'COMPLETED';
      payout.completedAt = new Date();
      await payout.save();

      // Update escrow
      const escrow = await Escrow.findById(payout.escrowId);
      escrow.status = 'PAYOUT_COMPLETED';
      await escrow.save();

      // Log transaction
      await this.logTransaction({
        escrowId: escrow._id,
        transactionType: 'PAYOUT',
        amount: payout.amount,
        currency: payout.currency,
        status: 'SUCCESS',
        initiatedBy: payout.providerId,
        gateway: {
          provider: 'xendit',
          transactionId: payout.gatewayPayoutId,
          responseMessage: 'Payout completed'
        },
        metadata: {
          reason: 'Payout completed',
          relatedPayoutId: payout._id,
          tags: ['payout_completed']
        }
      });

      logger.info(`Payout completed: ${payoutId}`);
      return { success: true, payout, escrow };
    } catch (error) {
      logger.error('Payout completion error:', error);
      throw error;
    }
  }

  /**
   * Initiate dispute
   */
  async initiateDispute(escrowId, raisedBy, reason, evidence) {
    try {
      const escrow = await Escrow.findById(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Only client or provider can raise dispute
      if (![escrow.clientId, escrow.providerId].includes(raisedBy)) {
        throw new Error('Unauthorized: Only client or provider can raise dispute');
      }

      escrow.dispute.raised = true;
      escrow.dispute.raisedAt = new Date();
      escrow.dispute.raisedBy = raisedBy;
      escrow.dispute.reason = reason;
      escrow.dispute.evidence = evidence || [];
      escrow.status = 'DISPUTE';
      await escrow.save();

      // Log transaction
      await this.logTransaction({
        escrowId: escrow._id,
        transactionType: 'DISPUTE_INITIATED',
        amount: escrow.amount,
        currency: escrow.currency,
        status: 'SUCCESS',
        initiatedBy: raisedBy,
        metadata: {
          reason,
          tags: ['dispute']
        }
      });

      // Notify admins
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await EmailService.sendEscrowDisputeNotification(admin.email, {
          escrow,
          reason,
          raisedBy
        });
      }

      return {
        success: true,
        escrow,
        message: 'Dispute raised successfully'
      };
    } catch (error) {
      logger.error('Dispute initiation error:', error);
      throw error;
    }
  }

  /**
   * Resolve dispute (admin only)
   */
  async resolveDispute(escrowId, decision, notes, adminId) {
    try {
      const escrow = await Escrow.findById(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== 'DISPUTE') {
        throw new Error(`Cannot resolve: Escrow is not in DISPUTE status`);
      }

      // Validate decision
      if (!['REFUND_CLIENT', 'PAYOUT_PROVIDER', 'SPLIT'].includes(decision)) {
        throw new Error('Invalid decision');
      }

      escrow.dispute.adminResolution.decidedAt = new Date();
      escrow.dispute.adminResolution.decidedBy = adminId;
      escrow.dispute.adminResolution.decision = decision;
      escrow.dispute.adminResolution.notes = notes;

      // Process resolution
      if (decision === 'REFUND_CLIENT') {
        // Refund to client
        await this.refundPayment(escrowId, 'Dispute resolved: Refund to client', adminId);
      } else if (decision === 'PAYOUT_PROVIDER') {
        // Process payout to provider
        escrow.status = 'IN_PROGRESS';
        await escrow.save();
        await this.processPayout(escrowId, escrow.providerId);
      } else if (decision === 'SPLIT') {
        // Split between parties (50/50 for simplicity)
        const splitAmount = Math.floor(escrow.amount / 2);
        // This would require additional logic for partial refunds/payouts
        logger.info(`Dispute split: Client gets ${splitAmount}, Provider gets ${splitAmount}`);
      }

      await escrow.save();

      // Log transaction
      await this.logTransaction({
        escrowId: escrow._id,
        transactionType: 'DISPUTE_RESOLVED',
        amount: escrow.amount,
        currency: escrow.currency,
        status: 'SUCCESS',
        initiatedBy: adminId,
        metadata: {
          reason: `Dispute resolved with decision: ${decision}`,
          notes,
          tags: ['dispute_resolution']
        }
      });

      return {
        success: true,
        escrow,
        message: `Dispute resolved: ${decision}`
      };
    } catch (error) {
      logger.error('Dispute resolution error:', error);
      throw error;
    }
  }

  /**
   * Upload proof of work
   */
  async uploadProofOfWork(escrowId, providerId, documents, notes) {
    try {
      const escrow = await Escrow.findById(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.providerId.toString() !== providerId.toString()) {
        throw new Error('Unauthorized: Only the provider can upload proof');
      }

      if (!['FUNDS_HELD', 'IN_PROGRESS'].includes(escrow.status)) {
        throw new Error(`Cannot upload proof: Escrow status is ${escrow.status}`);
      }

      escrow.proofOfWork.uploadedAt = new Date();
      escrow.proofOfWork.documents = documents;
      escrow.proofOfWork.notes = notes;
      await escrow.save();

      // Send notification to client
      const [client, provider] = await Promise.all([
        User.findById(escrow.clientId),
        User.findById(providerId)
      ]);

      await this.sendNotifications({
        type: 'proof_uploaded',
        escrow,
        client,
        provider,
        notes
      });

      return {
        success: true,
        escrow,
        message: 'Proof of work uploaded successfully'
      };
    } catch (error) {
      logger.error('Proof upload error:', error);
      throw error;
    }
  }

  /**
   * Get escrow details
   */
  async getEscrowDetails(escrowId) {
    try {
      const escrow = await Escrow.findById(escrowId)
        .populate('clientId', 'name email phone')
        .populate('providerId', 'name email phone')
        .lean();

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      const payout = await Payout.findOne({ escrowId }).lean();
      const transactions = await EscrowTransaction.find({ escrowId })
        .sort({ timestamp: -1 })
        .lean();

      return {
        success: true,
        escrow,
        payout,
        transactions
      };
    } catch (error) {
      logger.error('Get escrow details error:', error);
      throw error;
    }
  }

  /**
   * Get escrows by filters
   */
  async getEscrows(filters = {}, pagination = {}) {
    try {
      const { clientId, providerId, status, startDate, endDate } = filters;
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const query = {};

      if (clientId) query.clientId = clientId;
      if (providerId) query.providerId = providerId;
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const [escrows, total] = await Promise.all([
        Escrow.find(query)
          .populate('clientId', 'name email')
          .populate('providerId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Escrow.countDocuments(query)
      ]);

      return {
        success: true,
        escrows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get escrows error:', error);
      throw error;
    }
  }

  // ==================== Payment Gateway Integration Methods ====================

  /**
   * Create payment hold (integrate with actual gateway)
   */
  async createPaymentHold({ amount, currency, holdProvider, clientId, _bookingId }) {
    try {
      // This is a placeholder - integrate with actual payment gateway
      // For now, return mock response
      switch (holdProvider) {
        case 'paymongo':
          return await this.paymongCreateHold(amount, currency, clientId);
        case 'xendit':
          return await this.xenditCreateHold(amount, currency, clientId);
        case 'stripe':
          return await this.stripeCreateHold(amount, currency, clientId);
        default:
          throw new Error(`Unsupported payment provider: ${holdProvider}`);
      }
    } catch (error) {
      logger.error('Create payment hold error:', error);
      throw error;
    }
  }

  /**
   * Capture payment from hold (integrate with actual gateway)
   */
  async capturePaymentGateway({ holdId, amount, currency, provider }) {
    try {
      switch (provider) {
        case 'paymongo':
          return await this.paymongoCapture(holdId, amount, currency);
        case 'xendit':
          return await this.xenditCapture(holdId, amount, currency);
        case 'stripe':
          return await this.stripeCapture(holdId, amount, currency);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      logger.error('Capture payment gateway error:', error);
      throw error;
    }
  }

  /**
   * Release payment hold (integrate with actual gateway)
   */
  async releasePaymentHold({ holdId, provider }) {
    try {
      switch (provider) {
        case 'paymongo':
          return await this.paymongoRelease(holdId);
        case 'xendit':
          return await this.xenditRelease(holdId);
        case 'stripe':
          return await this.stripeRelease(holdId);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      logger.error('Release payment hold error:', error);
      throw error;
    }
  }

  /**
   * Initiate payout to provider (integrate with actual gateway)
   */
  async initiatePayoutGateway({ amount, currency, provider, payoutMethod, providerId, _escrowId, reference }) {
    try {
      switch (provider) {
        case 'xendit':
          return await this.xenditInitiatePayout(amount, currency, payoutMethod, providerId, reference);
        case 'stripe':
          return await this.stripeInitiatePayout(amount, currency, payoutMethod, providerId, reference);
        default:
          throw new Error(`Unsupported payout provider: ${provider}`);
      }
    } catch (error) {
      logger.error('Initiate payout gateway error:', error);
      throw error;
    }
  }

  // ==================== Gateway Implementations (Placeholder) ====================

  async paymongCreateHold(amount, currency, clientId) {
    // Implement PayMongo integration
    try {
      const result = await paymongoService.createAuthorization({
        amount,
        currency: currency || 'PHP',
        clientId,
        description: 'LocalPro Escrow Payment Hold'
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        holdId: result.holdId,
        intentId: result.intentId,
        clientSecret: result.clientSecret
      };
    } catch (error) {
      logger.error('PayMongo hold creation error:', error);
      return { success: false, message: error.message };
    }
  }

  async paymongoCapture(holdId, _amount, _currency) {
    try {
      const result = await paymongoService.capturePayment(holdId);

      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        captureId: result.chargeId || result.captureId,
        transactionId: result.chargeId || result.captureId
      };
    } catch (error) {
      logger.error('PayMongo capture error:', error);
      return { success: false, message: error.message };
    }
  }

  async paymongoRelease(holdId) {
    try {
      const result = await paymongoService.releaseAuthorization(holdId);

      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        releaseId: result.releaseId || result.chargeId,
        transactionId: result.releaseId || result.chargeId
      };
    } catch (error) {
      logger.error('PayMongo release error:', error);
      return { success: false, message: error.message };
    }
  }

  async xenditCreateHold(_amount, _currency, _clientId) {
    // TODO: Implement Xendit integration
    logger.info('Xendit hold creation (placeholder)');
    return { success: true, holdId: `xdt_hold_${Date.now()}` };
  }

  async xenditCapture(_holdId, _amount, _currency) {
    logger.info('Xendit capture (placeholder)');
    return { success: true, captureId: `xdt_capture_${Date.now()}` };
  }

  async xenditRelease(_holdId) {
    logger.info('Xendit release (placeholder)');
    return { success: true, releaseId: `xdt_release_${Date.now()}` };
  }

  async xenditInitiatePayout(_amount, _currency, _payoutMethod, _providerId, _reference) {
    logger.info('Xendit payout initiation (placeholder)');
    return { success: true, payoutId: `xdt_payout_${Date.now()}` };
  }

  async stripeCreateHold(_amount, _currency, _clientId) {
    // TODO: Implement Stripe integration
    logger.info('Stripe hold creation (placeholder)');
    return { success: true, holdId: `stripe_hold_${Date.now()}` };
  }

  async stripeCapture(_holdId, _amount, _currency) {
    logger.info('Stripe capture (placeholder)');
    return { success: true, captureId: `stripe_capture_${Date.now()}` };
  }

  async stripeRelease(_holdId) {
    logger.info('Stripe release (placeholder)');
    return { success: true, releaseId: `stripe_release_${Date.now()}` };
  }

  async stripeInitiatePayout(_amount, _currency, _payoutMethod, _providerId, _reference) {
    logger.info('Stripe payout initiation (placeholder)');
    return { success: true, payoutId: `stripe_payout_${Date.now()}` };
  }

  // ==================== Utility Methods ====================

  /**
   * Log transaction to immutable ledger
   */
  async logTransaction(transactionData) {
    try {
      const transaction = new EscrowTransaction(transactionData);
      await transaction.save();
      return transaction;
    } catch (error) {
      logger.error('Log transaction error:', error);
      throw error;
    }
  }

  /**
   * Send notifications
   */
  async sendNotifications({ type, escrow, client, provider, reason, notes, payout }) {
    try {
      const emailService = EmailService;

      switch (type) {
        case 'escrow_created':
          if (client) {
            await emailService.sendEmail({
              to: client.email,
              subject: 'Escrow Created - Funds Held',
              template: 'escrow_created',
              data: { escrow, client }
            });
          }
          if (provider) {
            await emailService.sendEmail({
              to: provider.email,
              subject: 'Escrow Created for Your Booking',
              template: 'escrow_created_provider',
              data: { escrow, provider }
            });
          }
          break;

        case 'payment_captured':
          if (client) {
            await emailService.sendEmail({
              to: client.email,
              subject: 'Payment Captured',
              template: 'payment_captured',
              data: { escrow, client }
            });
          }
          break;

        case 'payment_refunded':
          if (client) {
            await emailService.sendEmail({
              to: client.email,
              subject: 'Payment Refunded',
              template: 'payment_refunded',
              data: { escrow, client, reason }
            });
          }
          break;

        case 'proof_uploaded':
          if (client) {
            await emailService.sendEmail({
              to: client.email,
              subject: 'Proof of Work Uploaded',
              template: 'proof_uploaded',
              data: { escrow, notes }
            });
          }
          break;

        case 'payout_initiated':
          if (provider) {
            await emailService.sendEmail({
              to: provider.email,
              subject: 'Payout Initiated',
              template: 'payout_initiated',
              data: { escrow, payout }
            });
          }
          break;
      }

      logger.info(`Notification sent: ${type}`);
    } catch (error) {
      logger.error('Send notification error:', error);
      // Don't throw - notifications are non-critical
    }
  }
}

module.exports = new EscrowService();
