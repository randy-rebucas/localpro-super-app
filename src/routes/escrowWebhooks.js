const express = require('express');
const crypto = require('crypto');
const escrowService = require('../services/escrowService');
const paymongoService = require('../services/paymongoService');
const Payout = require('../models/Payout');
const Escrow = require('../models/Escrow');
const logger = require('../config/logger');

const router = express.Router();

/**
 * Webhook middleware to verify gateway signatures
 */
const verifyWebhookSignature = (req, res, next) => {
  try {
    const signature = req.headers['x-signature'] || req.headers['x-webhook-signature'];
    const provider = req.query.provider || req.body.provider || 'unknown';

    if (!signature) {
      return res.status(401).json({
        success: false,
        message: 'Missing webhook signature'
      });
    }

    // Verify signature based on provider
    // This is a placeholder - implement actual signature verification per provider
    const isValid = verifySignatureByProvider(provider, signature, req.body);

    if (!isValid) {
      logger.warn(`Invalid webhook signature from ${provider}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    next();
  } catch (error) {
    logger.error('Webhook verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook verification failed'
    });
  }
};

/**
 * Verify webhook signature by provider
 */
const verifySignatureByProvider = (provider, signature, payload) => {
  try {
    switch (provider) {
      case 'paymongo':
        return verifyPaymongoSignature(signature, payload);
      case 'xendit':
        return verifyXenditSignature(signature, payload);
      case 'stripe':
        return verifyStripeSignature(signature, payload);
      default:
        logger.warn(`Unknown webhook provider: ${provider}`);
        return false;
    }
  } catch (error) {
    logger.error('Signature verification error:', error);
    return false;
  }
};

/**
 * PayMongo signature verification
 */
const verifyPaymongoSignature = (signature, payload) => {
  // TODO: Implement PayMongo signature verification
  // Reference: https://developers.paymongo.com/docs/webhooks
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return hash === signature;
};

/**
 * Xendit signature verification
 */
const verifyXenditSignature = (signature, payload) => {
  // TODO: Implement Xendit signature verification
  // Reference: https://xendit.stoplight.io/docs/xendit-api/webhooks
  const secret = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!secret) return false;

  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return hash === signature;
};

/**
 * Stripe signature verification
 */
const verifyStripeSignature = (signature, payload) => {
  // TODO: Implement Stripe signature verification
  // Reference: https://stripe.com/docs/webhooks
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return false;

  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return hash === signature;
};

// ==================== Payment Gateway Webhooks ====================

/**
 * @desc    Handle payment authorization success (PayMongo)
 * @route   POST /webhooks/payments/paymongo
 * @access  Public (webhook)
 */
const handlePaymongoPaymentEvent = async (req, res) => {
  try {
    const { data, type } = req.body;

    logger.info(`PayMongo webhook received: ${type}`, {
      dataId: data?.id,
      dataType: data?.type
    });

    if (!data || !data.id) {
      logger.warn('Invalid PayMongo webhook: missing data');
      return res.status(400).json({ success: false, message: 'Invalid webhook' });
    }

    // Handle different PayMongo events
    switch (type) {
      case 'payment_intent.payment_failed':
        await handlePaymongoPaymentFailed(data);
        break;

      case 'payment_intent.succeeded':
        await handlePaymongoPaymentSucceeded(data);
        break;

      case 'payment_intent.awaiting_next_action':
        await handlePaymongoAwaitingAction(data);
        break;

      case 'charge.created':
        logger.info('PayMongo charge created', { chargeId: data.id });
        break;

      case 'charge.updated':
        logger.info('PayMongo charge updated', {
          chargeId: data.id,
          status: data.attributes?.status
        });
        break;

      case 'charge.refunded':
        await handlePaymongoChargeRefunded(data);
        break;

      default:
        logger.info(`Unhandled PayMongo event: ${type}`);
    }

    // Always return 200 OK to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook processed',
      eventType: type
    });
  } catch (error) {
    logger.error('PayMongo webhook error:', error);
    // Return 200 anyway to prevent gateway retries
    res.status(200).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Handle payment failure
 */
const handlePaymongoPaymentFailed = async (data) => {
  try {
    const intentId = data.id;
    const { charges } = data.attributes;

    logger.warn('PayMongo payment failed', {
      intentId,
      failureCode: data.attributes?.failure_code,
      failureMessage: data.attributes?.failure_message
    });

    // Find related escrow by payment intent ID
    const escrow = await Escrow.findOne({
      providerHoldId: intentId
    });

    if (escrow) {
      // Mark as failed in transaction log
      await escrowService.logTransaction({
        escrowId: escrow._id,
        transactionType: 'HOLD',
        amount: escrow.amount,
        currency: escrow.currency,
        status: 'FAILED',
        initiatedBy: escrow.clientId,
        gateway: {
          provider: 'paymongo',
          transactionId: intentId,
          responseMessage: data.attributes?.failure_message || 'Payment failed'
        },
        metadata: {
          reason: 'Payment authorization failed',
          tags: ['payment_failure']
        }
      });
    }
  } catch (error) {
    logger.error('Handle PayMongo payment failed error:', error);
  }
};

/**
 * Handle payment success
 */
const handlePaymongoPaymentSucceeded = async (data) => {
  try {
    const intentId = data.id;

    logger.info('PayMongo payment succeeded', { intentId });

    // Find related escrow
    const escrow = await Escrow.findOne({
      providerHoldId: intentId
    });

    if (escrow && escrow.status === 'FUNDS_HELD') {
      // Already processed in capturePayment
      logger.info('Payment intent succeeded, funds held', { intentId });
    }
  } catch (error) {
    logger.error('Handle PayMongo payment succeeded error:', error);
  }
};

/**
 * Handle awaiting next action (e.g., 3D Secure)
 */
const handlePaymongoAwaitingAction = async (data) => {
  try {
    const intentId = data.id;

    logger.info('PayMongo payment awaiting action', {
      intentId,
      nextAction: data.attributes?.next_action
    });

    // Payment requires additional action (3DS, etc)
    // Client needs to complete the action
  } catch (error) {
    logger.error('Handle PayMongo awaiting action error:', error);
  }
};

/**
 * Handle charge refunded
 */
const handlePaymongoChargeRefunded = async (data) => {
  try {
    const chargeId = data.id;

    logger.info('PayMongo charge refunded', {
      chargeId,
      refundedAmount: data.attributes?.amount_refunded,
      totalAmount: data.attributes?.amount
    });

    // Payment was refunded - update escrow status if needed
    const escrow = await Escrow.findOne({
      providerHoldId: chargeId
    });

    if (escrow && escrow.status !== 'REFUNDED') {
      escrow.status = 'REFUNDED';
      await escrow.save();

      logger.info('Escrow marked as refunded due to charge refund', {
        escrowId: escrow._id,
        chargeId
      });
    }
  } catch (error) {
    logger.error('Handle PayMongo charge refunded error:', error);
  }
};

/**
 * @desc    Handle payment authorization success (Xendit)
 * @route   POST /webhooks/payments/xendit
 * @access  Public (webhook)
 */
const handleXenditPaymentEvent = async (req, res) => {
  try {
    const { event, data } = req.body;

    logger.info(`Xendit webhook received: ${event}`);

    // Handle authorization events
    if (event === 'xendit_auth.authorization_success') {
      const { id, status, reference_id } = data;
      logger.info(`Authorization success: ${id}, Reference: ${reference_id}`);
    }

    // TODO: Implement Xendit payment event handling

    res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    logger.error('Xendit webhook error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Handle Stripe payment events
 * @route   POST /webhooks/payments/stripe
 * @access  Public (webhook)
 */
const handleStripePaymentEvent = async (req, res) => {
  try {
    const { type, data } = req.body;

    logger.info(`Stripe webhook received: ${type}`);

    // Handle different event types
    switch (type) {
      case 'payment_intent.succeeded':
        // Payment captured
        break;
      case 'charge.captured':
        // Charge captured
        break;
      case 'charge.refunded':
        // Charge refunded
        break;
      default:
        logger.info(`Unhandled Stripe event: ${type}`);
    }

    // TODO: Implement Stripe payment event handling

    res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== Disbursement/Payout Webhooks ====================

/**
 * @desc    Handle payout success (Xendit)
 * @route   POST /webhooks/disbursements/xendit
 * @access  Public (webhook)
 */
const handleXenditPayoutEvent = async (req, res) => {
  try {
    const { event, data } = req.body;

    logger.info(`Xendit payout webhook received: ${event}`);

    const { id, status, reference_id } = data;

    // Handle payout completion
    if (event === 'disbursement_succeeded') {
      logger.info(`Payout successful: ${id}`);

      // Find and update payout record by gateway ID
      const payout = await Payout.findOne({ gatewayPayoutId: id });

      if (payout) {
        await escrowService.completePayout(payout._id, data);
        logger.info(`Payout updated in database: ${payout._id}`);
      } else {
        logger.warn(`Payout not found for gateway ID: ${id}`);
      }
    }

    // Handle payout failure
    if (event === 'disbursement_failed') {
      logger.warn(`Payout failed: ${id}`);

      const payout = await Payout.findOne({ gatewayPayoutId: id });

      if (payout) {
        payout.status = 'FAILED';
        payout.failureReason = data.failure_reason || 'Unknown error';
        await payout.save();

        logger.info(`Payout marked as failed: ${payout._id}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payout webhook processed'
    });
  } catch (error) {
    logger.error('Xendit payout webhook error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Handle payout success (Stripe)
 * @route   POST /webhooks/disbursements/stripe
 * @access  Public (webhook)
 */
const handleStripePayoutEvent = async (req, res) => {
  try {
    const { type, data } = req.body;

    logger.info(`Stripe payout webhook received: ${type}`);

    switch (type) {
      case 'payout.paid': {
        // Payout was successful
        const payoutId = data.object.id;
        logger.info(`Payout paid: ${payoutId}`);

        const payout = await Payout.findOne({ gatewayPayoutId: payoutId });
        if (payout) {
          await escrowService.completePayout(payout._id, data.object);
        }
        break;
      }

      case 'payout.failed': {
        // Payout failed
        logger.warn(`Payout failed: ${data.object.id}`);
        const failedPayout = await Payout.findOne({ gatewayPayoutId: data.object.id });
        if (failedPayout) {
          failedPayout.status = 'FAILED';
          failedPayout.failureReason = data.object.failure_reason;
          await failedPayout.save();
        }
        break;
      }

      default:
        logger.info(`Unhandled Stripe payout event: ${type}`);
    }

    res.status(200).json({
      success: true,
      message: 'Payout webhook processed'
    });
  } catch (error) {
    logger.error('Stripe payout webhook error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== Generic Webhook Routes ====================

/**
 * @desc    Handle generic payment webhook
 * @route   POST /webhooks/payments
 * @access  Public (webhook)
 */
const handlePaymentWebhook = async (req, res) => {
  try {
    const provider = req.query.provider || req.body.provider;

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: 'Provider not specified'
      });
    }

    switch (provider) {
      case 'paymongo':
        return await handlePaymongoPaymentEvent(req, res);
      case 'xendit':
        return await handleXenditPaymentEvent(req, res);
      case 'stripe':
        return await handleStripePaymentEvent(req, res);
      default:
        return res.status(400).json({
          success: false,
          message: `Unknown provider: ${provider}`
        });
    }
  } catch (error) {
    logger.error('Payment webhook error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Handle generic disbursement webhook
 * @route   POST /webhooks/disbursements
 * @access  Public (webhook)
 */
const handleDisbursementWebhook = async (req, res) => {
  try {
    const provider = req.query.provider || req.body.provider;

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: 'Provider not specified'
      });
    }

    switch (provider) {
      case 'xendit':
        return await handleXenditPayoutEvent(req, res);
      case 'stripe':
        return await handleStripePayoutEvent(req, res);
      default:
        return res.status(400).json({
          success: false,
          message: `Unknown provider: ${provider}`
        });
    }
  } catch (error) {
    logger.error('Disbursement webhook error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Route handlers
router.post('/payments', verifyWebhookSignature, handlePaymentWebhook);
router.post('/disbursements', verifyWebhookSignature, handleDisbursementWebhook);

// Provider-specific routes
router.post('/payments/paymongo', verifyWebhookSignature, handlePaymongoPaymentEvent);
router.post('/payments/xendit', verifyWebhookSignature, handleXenditPaymentEvent);
router.post('/payments/stripe', verifyWebhookSignature, handleStripePaymentEvent);
router.post('/disbursements/xendit', verifyWebhookSignature, handleXenditPayoutEvent);
router.post('/disbursements/stripe', verifyWebhookSignature, handleStripePayoutEvent);

module.exports = router;
