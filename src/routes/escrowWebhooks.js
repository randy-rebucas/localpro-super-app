const express = require('express');
const crypto = require('crypto');
const escrowService = require('../services/escrowService');
// const paymongoService = require('../services/paymongoService'); // Available for future PayMongo webhook handling
const Payout = require('../models/Payout');
const Escrow = require('../models/Escrow');
const WebhookEvent = require('../models/WebhookEvent');
const logger = require('../config/logger');

const router = express.Router();

/**
 * Webhook middleware to verify gateway signatures and prevent replay attacks
 */
const verifyWebhookSignature = async (req, res, next) => {
  try {
    const signature = req.headers['x-signature'] || 
                     req.headers['x-webhook-signature'] || 
                     req.headers['x-paymongo-signature'] ||
                     req.headers['stripe-signature'] ||
                     req.headers['x-xendit-signature'];
    const provider = req.query.provider || req.body.provider || 'unknown';

    if (!signature) {
      logger.warn(`Missing webhook signature from ${provider}`, {
        headers: Object.keys(req.headers),
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Missing webhook signature'
      });
    }

    // Verify signature based on provider
    const isValid = verifySignatureByProvider(provider, signature, req.body, req);

    if (!isValid) {
      logger.warn(`Invalid webhook signature from ${provider}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Check for replay attacks (timestamp validation)
    const timestamp = getEventTimestamp(req.body, provider);
    if (timestamp) {
      const eventAge = Date.now() - new Date(timestamp).getTime();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      if (eventAge > maxAge) {
        logger.warn(`Webhook event too old (replay attack?)`, {
          provider,
          eventAge: `${Math.round(eventAge / 1000)}s`,
          timestamp
        });
        return res.status(401).json({
          success: false,
          message: 'Webhook event timestamp too old'
        });
      }
    }

    // Check for duplicate events (idempotency)
    const eventId = getEventId(req.body, provider);
    if (eventId) {
      const isProcessed = await WebhookEvent.isEventProcessed(provider, eventId);
      if (isProcessed) {
        logger.info(`Duplicate webhook event detected`, {
          provider,
          eventId,
          ip: req.ip
        });
        await WebhookEvent.markAsDuplicate(provider, eventId);
        return res.status(200).json({
          success: true,
          message: 'Event already processed',
          duplicate: true
        });
      }
    }

    // Store metadata for tracking
    req.webhookMetadata = {
      provider,
      eventId,
      timestamp,
      signature,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

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
const verifySignatureByProvider = (provider, signature, payload, req) => {
  try {
    switch (provider.toLowerCase()) {
      case 'paymongo':
        return verifyPaymongoSignature(signature, payload, req);
      case 'xendit':
        return verifyXenditSignature(signature, payload, req);
      case 'stripe':
        return verifyStripeSignature(signature, payload, req);
      case 'paypal':
        return verifyPaypalSignature(signature, payload, req);
      case 'paymaya':
        return verifyPaymayaSignature(signature, payload, req);
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
 * Get event ID from webhook payload
 */
const getEventId = (payload, provider) => {
  try {
    switch (provider.toLowerCase()) {
      case 'paymongo':
        return payload?.data?.id || payload?.id;
      case 'stripe':
        return payload?.id;
      case 'xendit':
        return payload?.id || payload?.event_id;
      case 'paypal':
        return payload?.id || payload?.event_id;
      case 'paymaya':
        return payload?.id || payload?.event_id;
      default:
        return payload?.id;
    }
  } catch (error) {
    logger.error('Error extracting event ID:', error);
    return null;
  }
};

/**
 * Get event timestamp from webhook payload
 */
const getEventTimestamp = (payload, provider) => {
  try {
    switch (provider.toLowerCase()) {
      case 'paymongo':
        return payload?.data?.attributes?.created_at || payload?.created_at;
      case 'stripe':
        return payload?.created ? new Date(payload.created * 1000) : null;
      case 'xendit':
        return payload?.created || payload?.timestamp;
      case 'paypal':
        return payload?.create_time || payload?.event_version;
      case 'paymaya':
        return payload?.created_at || payload?.timestamp;
      default:
        return payload?.timestamp || payload?.created_at;
    }
  } catch (error) {
    logger.error('Error extracting event timestamp:', error);
    return null;
  }
};

/**
 * PayMongo signature verification
 * Reference: https://developers.paymongo.com/docs/webhooks
 */
const verifyPaymongoSignature = (signature, payload, req) => {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('PayMongo webhook secret not configured');
    return false;
  }

  try {
    // PayMongo sends signature in format: t=timestamp,v1=signature
    const elements = signature.split(',');
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];
    const v1Signature = elements.find(el => el.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !v1Signature) {
      // Fallback: try direct hash comparison
      const rawBody = req.rawBody || JSON.stringify(payload);
      const hash = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
      return hash === signature;
    }

    // Create signed payload: timestamp.rawBody
    const rawBody = req.rawBody || JSON.stringify(payload);
    const signedPayload = `${timestamp}.${rawBody}`;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return expectedSignature === v1Signature;
  } catch (error) {
    logger.error('PayMongo signature verification error:', error);
    return false;
  }
};

/**
 * Xendit signature verification
 * Reference: https://xendit.stoplight.io/docs/xendit-api/webhooks
 */
const verifyXenditSignature = (signature, payload, req) => {
  const secret = process.env.XENDIT_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('Xendit webhook secret not configured');
    return false;
  }

  try {
    const rawBody = req.rawBody || JSON.stringify(payload);
    const hash = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return hash === signature;
  } catch (error) {
    logger.error('Xendit signature verification error:', error);
    return false;
  }
};

/**
 * Stripe signature verification
 * Reference: https://stripe.com/docs/webhooks/signatures
 */
const verifyStripeSignature = (signature, payload, req) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('Stripe webhook secret not configured');
    return false;
  }

  try {
    // Stripe signature format: t=timestamp,v1=signature
    const elements = signature.split(',');
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];
    const v1Signature = elements.find(el => el.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !v1Signature) return false;

    // Create signed payload: timestamp.rawBody
    const rawBody = req.rawBody || JSON.stringify(payload);
    const signedPayload = `${timestamp}.${rawBody}`;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return expectedSignature === v1Signature;
  } catch (error) {
    logger.error('Stripe signature verification error:', error);
    return false;
  }
};

/**
 * PayPal signature verification
 * Reference: https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/
 */
const verifyPaypalSignature = (signature, payload, req) => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    logger.warn('PayPal webhook ID not configured');
    return false;
  }

  // PayPal uses certificate-based verification
  // For now, we'll use a simpler approach with webhook ID validation
  try {
    // PayPal webhook verification requires calling their API
    // This is a simplified check - full implementation should call PayPal's verification API
    return payload?.event_type && payload?.id;
  } catch (error) {
    logger.error('PayPal signature verification error:', error);
    return false;
  }
};

/**
 * PayMaya signature verification
 */
const verifyPaymayaSignature = (signature, payload, req) => {
  const secret = process.env.PAYMAYA_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('PayMaya webhook secret not configured');
    return false;
  }

  try {
    const rawBody = req.rawBody || JSON.stringify(payload);
    const hash = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return hash === signature;
  } catch (error) {
    logger.error('PayMaya signature verification error:', error);
    return false;
  }
};

// ==================== Payment Gateway Webhooks ====================

/**
 * @desc    Handle payment authorization success (PayMongo)
 * @route   POST /webhooks/payments/paymongo
 * @access  Public (webhook)
 */
const handlePaymongoPaymentEvent = async (req, res) => {
  const startTime = Date.now();
  const { data, type } = req.body;
  const provider = 'paymongo';
  const eventId = data?.id || req.webhookMetadata?.eventId;

  try {
    // Mark event as processing
    if (eventId) {
      await WebhookEvent.markAsProcessing(provider, eventId, req.body);
    }

    logger.info(`PayMongo webhook received: ${type}`, {
      dataId: data?.id,
      dataType: data?.type,
      eventId
    });

    if (!data || !data.id) {
      logger.warn('Invalid PayMongo webhook: missing data');
      if (eventId) {
        await WebhookEvent.markAsFailed(provider, eventId, new Error('Missing data'));
      }
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

    const processingTime = Date.now() - startTime;

    // Mark event as completed
    if (eventId) {
      await WebhookEvent.markAsCompleted(provider, eventId, {
        success: true,
        eventType: type
      }, processingTime);
    }

    // Always return 200 OK to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook processed',
      eventType: type
    });
  } catch (error) {
    logger.error('PayMongo webhook error:', error);
    
    // Mark event as failed
    if (eventId) {
      await WebhookEvent.markAsFailed(provider, eventId, error);
    }

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
    // const { charges } = data.attributes; // Available for detailed charge analysis

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

    logger.info(`Xendit webhook received: ${event}`, {
      eventId: data?.id,
      eventType: data?.type,
      referenceId: data?.reference_id
    });

    // Handle different event types
    switch (event) {
      case 'payment.succeeded':
        // Payment succeeded - funds captured
        await handleXenditPaymentSucceeded(data);
        break;

      case 'payment.failed':
        // Payment failed
        await handleXenditPaymentFailed(data);
        break;

      case 'payment_request.payment_method.attached':
        // Payment method attached to payment request
        await handleXenditPaymentMethodAttached(data);
        break;

      case 'disbursement.sent':
        // Disbursement sent
        await handleXenditDisbursementSent(data);
        break;

      case 'disbursement.failed':
        // Disbursement failed
        await handleXenditDisbursementFailed(data);
        break;

      case 'disbursement.completed':
        // Disbursement completed
        await handleXenditDisbursementCompleted(data);
        break;

      default:
        logger.info(`Unhandled Xendit event: ${event}`);
    }

    res.status(200).json({
      success: true,
      message: 'Xendit webhook processed successfully'
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

    logger.info(`Stripe webhook received: ${type}`, {
      eventId: data?.id,
      objectId: data?.object?.id
    });

    // Handle different event types
    switch (type) {
      case 'payment_intent.succeeded':
        // Payment intent succeeded - funds authorized
        await handleStripePaymentIntentSucceeded(data.object);
        break;

      case 'payment_intent.canceled':
        // Payment intent canceled - authorization released
        await handleStripePaymentIntentCanceled(data.object);
        break;

      case 'charge.succeeded':
        // Charge succeeded - payment captured
        await handleStripeChargeSucceeded(data.object);
        break;

      case 'charge.refunded':
        // Charge refunded
        await handleStripeChargeRefunded(data.object);
        break;

      case 'payout.paid':
        // Payout completed
        await handleStripePayoutPaid(data.object);
        break;

      case 'payout.failed':
        // Payout failed
        await handleStripePayoutFailed(data.object);
        break;

      default:
        logger.info(`Unhandled Stripe event: ${type}`);
    }

    res.status(200).json({
      success: true,
      message: 'Stripe webhook processed successfully'
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

    const { id } = data;

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

// ==================== Xendit Event Handlers ====================

/**
 * Handle Xendit payment succeeded
 */
const handleXenditPaymentSucceeded = async (payment) => {
  try {
    const { id, payment_request_id, amount, currency, reference_id } = payment;

    logger.info('Processing Xendit payment succeeded', {
      paymentId: id,
      requestId: payment_request_id,
      amount,
      referenceId: reference_id
    });

    // Find and update escrow if this was a payment request
    const escrow = await Escrow.findOne({
      providerHoldId: payment_request_id,
      status: 'FUNDS_HELD'
    });

    if (escrow) {
      escrow.status = 'COMPLETED';
      await escrow.save();

      // Log transaction
      await escrowService.logTransaction({
        escrowId: escrow._id,
        transactionType: 'CAPTURE',
        amount: amount * 100, // Convert to cents
        currency,
        status: 'SUCCESS',
        initiatedBy: escrow.clientId,
        gateway: {
          provider: 'xendit',
          transactionId: id
        },
        metadata: {
          reason: 'Xendit payment succeeded',
          tags: ['xendit', 'capture']
        }
      });

      logger.info('Escrow completed for Xendit payment', {
        escrowId: escrow._id,
        paymentId: id
      });
    }
  } catch (error) {
    logger.error('Error handling Xendit payment succeeded:', error);
  }
};

/**
 * Handle Xendit payment failed
 */
const handleXenditPaymentFailed = async (payment) => {
  try {
    const { id, payment_request_id, amount, currency, reference_id, failure_code } = payment;

    logger.info('Processing Xendit payment failed', {
      paymentId: id,
      requestId: payment_request_id,
      amount,
      referenceId: reference_id,
      failureCode: failure_code
    });

    // Find escrow and mark as failed
    const escrow = await Escrow.findOne({
      providerHoldId: payment_request_id,
      status: 'FUNDS_HELD'
    });

    if (escrow) {
      escrow.status = 'FAILED';
      await escrow.save();

      // Log transaction
      await escrowService.logTransaction({
        escrowId: escrow._id,
        transactionType: 'FAILED',
        amount: amount * 100, // Convert to cents
        currency,
        status: 'FAILED',
        initiatedBy: escrow.clientId,
        gateway: {
          provider: 'xendit',
          transactionId: id
        },
        metadata: {
          reason: 'Xendit payment failed',
          failureCode: failure_code,
          tags: ['xendit', 'failed']
        }
      });

      logger.info('Escrow failed for Xendit payment', {
        escrowId: escrow._id,
        paymentId: id,
        failureCode: failure_code
      });
    }
  } catch (error) {
    logger.error('Error handling Xendit payment failed:', error);
  }
};

/**
 * Handle Xendit payment method attached
 */
const handleXenditPaymentMethodAttached = async (paymentRequest) => {
  try {
    const { id, reference_id, amount, currency } = paymentRequest;

    logger.info('Processing Xendit payment method attached', {
      requestId: id,
      referenceId: reference_id,
      amount,
      currency
    });

    // Update escrow status to indicate payment method is ready
    const escrow = await Escrow.findOne({
      providerHoldId: id,
      status: 'PENDING'
    });

    if (escrow) {
      escrow.status = 'FUNDS_HELD';
      await escrow.save();

      logger.info('Escrow status updated for payment method attachment', {
        escrowId: escrow._id,
        requestId: id
      });
    }
  } catch (error) {
    logger.error('Error handling Xendit payment method attached:', error);
  }
};

/**
 * Handle Xendit disbursement sent
 */
const handleXenditDisbursementSent = async (disbursement) => {
  try {
    const { id, external_id, amount } = disbursement;

    logger.info('Processing Xendit disbursement sent', {
      disbursementId: id,
      externalId: external_id,
      amount
    });

    // Update payout status
    const payoutRecord = await Payout.findOne({
      'gateway.transactionId': id
    });

    if (payoutRecord) {
      payoutRecord.status = 'PROCESSING';
      await payoutRecord.save();

      logger.info('Payout status updated to processing', {
        payoutId: payoutRecord._id,
        disbursementId: id
      });
    }
  } catch (error) {
    logger.error('Error handling Xendit disbursement sent:', error);
  }
};

/**
 * Handle Xendit disbursement failed
 */
const handleXenditDisbursementFailed = async (disbursement) => {
  try {
    const { id, external_id, amount, failure_code } = disbursement;

    logger.info('Processing Xendit disbursement failed', {
      disbursementId: id,
      externalId: external_id,
      amount,
      failureCode: failure_code
    });

    // Update payout status
    const payoutRecord = await Payout.findOne({
      'gateway.transactionId': id
    });

    if (payoutRecord) {
      payoutRecord.status = 'FAILED';
      payoutRecord.metadata = {
        ...payoutRecord.metadata,
        failureReason: failure_code
      };
      await payoutRecord.save();

      logger.info('Payout marked as failed', {
        payoutId: payoutRecord._id,
        disbursementId: id,
        failureCode: failure_code
      });
    }
  } catch (error) {
    logger.error('Error handling Xendit disbursement failed:', error);
  }
};

/**
 * Handle Xendit disbursement completed
 */
const handleXenditDisbursementCompleted = async (disbursement) => {
  try {
    const { id, external_id, amount } = disbursement;

    logger.info('Processing Xendit disbursement completed', {
      disbursementId: id,
      externalId: external_id,
      amount
    });

    // Update payout status
    const payoutRecord = await Payout.findOne({
      'gateway.transactionId': id
    });

    if (payoutRecord) {
      payoutRecord.status = 'COMPLETED';
      await payoutRecord.save();

      logger.info('Payout marked as completed', {
        payoutId: payoutRecord._id,
        disbursementId: id
      });
    }
  } catch (error) {
    logger.error('Error handling Xendit disbursement completed:', error);
  }
};

// ==================== Stripe Event Handlers ====================

/**
 * Handle Stripe payment intent succeeded
 */
const handleStripePaymentIntentSucceeded = async (paymentIntent) => {
  try {
    const { id, metadata } = paymentIntent;

    logger.info('Processing Stripe payment intent succeeded', {
      intentId: id,
      bookingId: metadata.bookingId,
      clientId: metadata.clientId
    });

    // Update escrow status if this was an escrow payment
    if (metadata.bookingId && metadata.type === 'escrow_authorization') {
      const escrow = await Escrow.findOne({
        bookingId: metadata.bookingId,
        providerHoldId: id
      });

      if (escrow) {
        escrow.status = 'FUNDS_HELD';
        await escrow.save();

        // Log transaction
        await escrowService.logTransaction({
          escrowId: escrow._id,
          transactionType: 'HOLD',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'SUCCESS',
          initiatedBy: metadata.clientId,
          gateway: {
            provider: 'stripe',
            transactionId: id
          },
          metadata: {
            reason: 'Stripe payment intent authorized',
            tags: ['stripe', 'authorization']
          }
        });

        logger.info('Escrow updated for Stripe payment intent', {
          escrowId: escrow._id,
          bookingId: metadata.bookingId
        });
      }
    }
  } catch (error) {
    logger.error('Error handling Stripe payment intent succeeded:', error);
  }
};

/**
 * Handle Stripe payment intent canceled
 */
const handleStripePaymentIntentCanceled = async (paymentIntent) => {
  try {
    const { id, metadata } = paymentIntent;

    logger.info('Processing Stripe payment intent canceled', {
      intentId: id,
      bookingId: metadata.bookingId
    });

    // Update escrow status if this was an escrow payment
    if (metadata.bookingId && metadata.type === 'escrow_authorization') {
      const escrow = await Escrow.findOne({
        bookingId: metadata.bookingId,
        providerHoldId: id
      });

      if (escrow) {
        escrow.status = 'CANCELLED';
        await escrow.save();

        // Log transaction
        await escrowService.logTransaction({
          escrowId: escrow._id,
          transactionType: 'CANCEL',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'SUCCESS',
          initiatedBy: metadata.clientId,
          gateway: {
            provider: 'stripe',
            transactionId: id
          },
          metadata: {
            reason: 'Stripe payment intent canceled',
            tags: ['stripe', 'cancellation']
          }
        });

        logger.info('Escrow canceled for Stripe payment intent', {
          escrowId: escrow._id,
          bookingId: metadata.bookingId
        });
      }
    }
  } catch (error) {
    logger.error('Error handling Stripe payment intent canceled:', error);
  }
};

/**
 * Handle Stripe charge succeeded
 */
const handleStripeChargeSucceeded = async (charge) => {
  try {
    const { id, payment_intent, amount, currency, metadata } = charge;

    logger.info('Processing Stripe charge succeeded', {
      chargeId: id,
      intentId: payment_intent,
      amount,
      bookingId: metadata.bookingId
    });

    // Find and update escrow if this was a capture
    const escrow = await Escrow.findOne({
      providerHoldId: payment_intent,
      status: 'FUNDS_HELD'
    });

    if (escrow) {
      escrow.status = 'COMPLETED';
      await escrow.save();

      // Log transaction
      await escrowService.logTransaction({
        escrowId: escrow._id,
        transactionType: 'CAPTURE',
        amount,
        currency,
        status: 'SUCCESS',
        initiatedBy: metadata.clientId,
        gateway: {
          provider: 'stripe',
          transactionId: id
        },
        metadata: {
          reason: 'Stripe charge captured',
          tags: ['stripe', 'capture']
        }
      });

      logger.info('Escrow completed for Stripe charge', {
        escrowId: escrow._id,
        chargeId: id
      });
    }
  } catch (error) {
    logger.error('Error handling Stripe charge succeeded:', error);
  }
};

/**
 * Handle Stripe charge refunded
 */
const handleStripeChargeRefunded = async (charge) => {
  try {
    const { id, amount, currency, metadata } = charge;

    logger.info('Processing Stripe charge refunded', {
      chargeId: id,
      amount,
      bookingId: metadata.bookingId
    });

    // Find escrow and create refund transaction
    const escrow = await Escrow.findOne({
      'transactions.gateway.transactionId': id
    });

    if (escrow) {
      // Log refund transaction
      await escrowService.logTransaction({
        escrowId: escrow._id,
        transactionType: 'REFUND',
        amount,
        currency,
        status: 'SUCCESS',
        initiatedBy: metadata.clientId,
        gateway: {
          provider: 'stripe',
          transactionId: id
        },
        metadata: {
          reason: 'Stripe charge refunded',
          tags: ['stripe', 'refund']
        }
      });

      logger.info('Refund logged for Stripe charge', {
        escrowId: escrow._id,
        chargeId: id
      });
    }
  } catch (error) {
    logger.error('Error handling Stripe charge refunded:', error);
  }
};

/**
 * Handle Stripe payout paid
 */
const handleStripePayoutPaid = async (payout) => {
  try {
    const { id, amount, metadata } = payout;

    logger.info('Processing Stripe payout paid', {
      payoutId: id,
      amount,
      providerId: metadata.providerId
    });

    // Update payout status
    const payoutRecord = await Payout.findOne({
      'gateway.transactionId': id
    });

    if (payoutRecord) {
      payoutRecord.status = 'COMPLETED';
      await payoutRecord.save();

      logger.info('Payout marked as completed', {
        payoutId: payoutRecord._id,
        stripePayoutId: id
      });
    }
  } catch (error) {
    logger.error('Error handling Stripe payout paid:', error);
  }
};

/**
 * Handle Stripe payout failed
 */
const handleStripePayoutFailed = async (payout) => {
  try {
    const { id, amount, metadata, failure_message } = payout;

    logger.info('Processing Stripe payout failed', {
      payoutId: id,
      amount,
      providerId: metadata.providerId,
      failureMessage: failure_message
    });

    // Update payout status
    const payoutRecord = await Payout.findOne({
      'gateway.transactionId': id
    });

    if (payoutRecord) {
      payoutRecord.status = 'FAILED';
      payoutRecord.metadata = {
        ...payoutRecord.metadata,
        failureReason: failure_message
      };
      await payoutRecord.save();

      logger.info('Payout marked as failed', {
        payoutId: payoutRecord._id,
        stripePayoutId: id,
        failureMessage: failure_message
      });
    }
  } catch (error) {
    logger.error('Error handling Stripe payout failed:', error);
  }
};

// Route handlers
// Middleware to capture raw body for signature verification (must be before body parser)
router.use('/payments', captureRawBody);
router.use('/disbursements', captureRawBody);

router.post('/payments', verifyWebhookSignature, handlePaymentWebhook);
router.post('/disbursements', verifyWebhookSignature, handleDisbursementWebhook);

// Provider-specific routes
// Apply raw body capture middleware for provider-specific routes
router.use('/payments/paymongo', captureRawBody);
router.use('/payments/xendit', captureRawBody);
router.use('/payments/stripe', captureRawBody);
router.use('/disbursements/xendit', captureRawBody);
router.use('/disbursements/stripe', captureRawBody);

router.post('/payments/paymongo', verifyWebhookSignature, handlePaymongoPaymentEvent);
router.post('/payments/xendit', verifyWebhookSignature, handleXenditPaymentEvent);
router.post('/payments/stripe', verifyWebhookSignature, handleStripePaymentEvent);
router.post('/disbursements/xendit', verifyWebhookSignature, handleXenditPayoutEvent);
router.post('/disbursements/stripe', verifyWebhookSignature, handleStripePayoutEvent);

module.exports = router;
