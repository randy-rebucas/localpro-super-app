const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const paymongoService = require('../services/paymongoService');
const logger = require('../config/logger');
const Escrow = require('../models/Escrow');

const router = express.Router();

/**
 * @desc    Create payment intent for client-side payment processing
 * @route   POST /api/paymongo/create-intent
 * @access  Private
 */
router.post('/create-intent', auth, async (req, res) => {
  try {
    const { bookingId, providerId, amount, currency = 'PHP' } = req.body;
    const clientId = req.user.id;

    // Validate input
    if (!bookingId || !providerId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: bookingId, providerId, amount'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    logger.info('Creating PayMongo payment intent', {
      clientId,
      bookingId,
      providerId,
      amount,
      currency
    });

    // Create authorization (payment hold)
    const result = await paymongoService.createAuthorization({
      amount,
      currency,
      description: `Escrow for booking ${bookingId}`,
      clientId,
      bookingId
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: {
        intentId: result.intentId,
        clientSecret: result.clientSecret,
        publishableKey: process.env.PAYMONGO_PUBLIC_KEY,
        amount: result.amount,
        currency: result.currency
      },
      message: 'Payment intent created successfully'
    });
  } catch (error) {
    logger.error('Create intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Confirm payment with payment method
 * @route   POST /api/paymongo/confirm-payment
 * @access  Private
 */
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { intentId, paymentMethodId, bookingId, providerId, amount, currency } = req.body;
    const clientId = req.user.id;

    if (!intentId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: intentId, paymentMethodId'
      });
    }

    logger.info('Confirming PayMongo payment', {
      clientId,
      intentId,
      paymentMethodId
    });

    // Confirm the payment
    const confirmResult = await paymongoService.confirmPayment(intentId, paymentMethodId);

    if (!confirmResult.success) {
      return res.status(400).json({
        success: false,
        message: confirmResult.message
      });
    }

    // Now create the escrow with the confirmed payment
    const escrowService = require('../services/escrowService');

    const escrowResult = await escrowService.createEscrow({
      bookingId,
      clientId,
      providerId,
      amount,
      currency,
      holdProvider: 'paymongo'
    });

    if (!escrowResult.success) {
      return res.status(400).json({
        success: false,
        message: escrowResult.message
      });
    }

    res.status(201).json({
      success: true,
      data: {
        escrow: escrowResult.escrow,
        payment: confirmResult
      },
      message: 'Payment confirmed and escrow created'
    });
  } catch (error) {
    logger.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Get payment intent details
 * @route   GET /api/paymongo/intent/:intentId
 * @access  Private
 */
router.get('/intent/:intentId', auth, async (req, res) => {
  try {
    const { intentId } = req.params;

    if (!intentId) {
      return res.status(400).json({
        success: false,
        message: 'Intent ID is required'
      });
    }

    const result = await paymongoService.getPaymentIntent(intentId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    const intent = result.data;

    res.status(200).json({
      success: true,
      data: {
        id: intent.id,
        status: intent.attributes.status,
        amount: intent.attributes.amount,
        currency: intent.attributes.currency,
        charges: intent.attributes.charges
      }
    });
  } catch (error) {
    logger.error('Get intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Get charge details
 * @route   GET /api/paymongo/charge/:chargeId
 * @access  Private
 */
router.get('/charge/:chargeId', auth, async (req, res) => {
  try {
    const { chargeId } = req.params;

    if (!chargeId) {
      return res.status(400).json({
        success: false,
        message: 'Charge ID is required'
      });
    }

    const result = await paymongoService.getCharge(chargeId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    const charge = result.data;

    res.status(200).json({
      success: true,
      data: {
        id: charge.id,
        status: charge.attributes.status,
        amount: charge.attributes.amount,
        currency: charge.attributes.currency,
        receipt_number: charge.attributes.receipt_number,
        fees: charge.attributes.fees
      }
    });
  } catch (error) {
    logger.error('Get charge error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Refund a charge
 * @route   POST /api/paymongo/refund
 * @access  Private
 */
router.post('/refund', auth, async (req, res) => {
  try {
    const { chargeId, amount, reason = 'customer_request' } = req.body;

    if (!chargeId) {
      return res.status(400).json({
        success: false,
        message: 'Charge ID is required'
      });
    }

    logger.info('Creating PayMongo refund', {
      chargeId,
      amount,
      reason,
      userId: req.user.id
    });

    const result = await paymongoService.refundPayment(chargeId, {
      amount,
      reason
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(201).json({
      success: true,
      data: {
        refundId: result.refundId,
        status: result.status,
        amount: result.amount
      },
      message: 'Refund created successfully'
    });
  } catch (error) {
    logger.error('Create refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    Get refund details
 * @route   GET /api/paymongo/refund/:refundId
 * @access  Private
 */
router.get('/refund/:refundId', auth, async (req, res) => {
  try {
    const { refundId } = req.params;

    if (!refundId) {
      return res.status(400).json({
        success: false,
        message: 'Refund ID is required'
      });
    }

    const result = await paymongoService.getRefund(refundId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    const refund = result.data;

    res.status(200).json({
      success: true,
      data: {
        id: refund.id,
        status: refund.attributes.status,
        amount: refund.attributes.amount,
        reason: refund.attributes.reason,
        charge_id: refund.attributes.charge_id,
        receipt_number: refund.attributes.receipt_number
      }
    });
  } catch (error) {
    logger.error('Get refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    List payment intents (Admin)
 * @route   GET /api/paymongo/intents
 * @access  Private (Admin only)
 */
router.get('/intents', authorize('admin'), async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const result = await paymongoService.listPaymentIntents({ limit });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      data: result.data.map(intent => ({
        id: intent.id,
        status: intent.attributes.status,
        amount: intent.attributes.amount,
        currency: intent.attributes.currency,
        created_at: intent.attributes.created_at
      })),
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('List intents error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @desc    List charges (Admin)
 * @route   GET /api/paymongo/charges
 * @access  Private (Admin only)
 */
router.get('/charges', authorize('admin'), async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const result = await paymongoService.listCharges({ limit });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.status(200).json({
      success: true,
      data: result.data.map(charge => ({
        id: charge.id,
        status: charge.attributes.status,
        amount: charge.attributes.amount,
        currency: charge.attributes.currency,
        receipt_number: charge.attributes.receipt_number,
        created_at: charge.attributes.created_at
      })),
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('List charges error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
