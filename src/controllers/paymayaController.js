const PayMayaService = require('../services/paymayaService');
const { Payment } = require('../models/LocalProPlus');
const { Transaction } = require('../models/Finance');
const { Booking } = require('../models/Marketplace');
const { Order } = require('../../features/supplies');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// @desc    Create PayMaya checkout session
// @route   POST /api/paymaya/checkout
// @access  Private
const createCheckout = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      totalAmount,
      currency = 'PHP',
      description,
      referenceId,
      buyer,
      items,
      redirectUrl
    } = req.body;

    // Validate required fields
    if (!totalAmount || !description || !referenceId || !buyer) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: totalAmount, description, referenceId, buyer'
      });
    }

    // Validate buyer information
    if (!buyer.firstName || !buyer.lastName || !buyer.email) {
      return res.status(400).json({
        success: false,
        message: 'Buyer information incomplete: firstName, lastName, and email are required'
      });
    }

    const checkoutData = {
      totalAmount,
      currency,
      description,
      referenceId,
      buyer,
      items,
      redirectUrl
    };

    const result = await PayMayaService.createCheckout(checkoutData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create PayMaya checkout',
        error: result.error,
        details: result.details
      });
    }

    res.status(201).json({
      success: true,
      message: 'PayMaya checkout created successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Create PayMaya checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get PayMaya checkout details
// @route   GET /api/paymaya/checkout/:checkoutId
// @access  Private
const getCheckout = async (req, res) => {
  try {
    const { checkoutId } = req.params;

    if (!checkoutId) {
      return res.status(400).json({
        success: false,
        message: 'Checkout ID is required'
      });
    }

    const result = await PayMayaService.getCheckout(checkoutId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Checkout not found',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get PayMaya checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create PayMaya payment
// @route   POST /api/paymaya/payment
// @access  Private
const createPayment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      vaultId,
      amount,
      currency = 'PHP',
      referenceId,
      buyer,
      items,
      description
    } = req.body;

    // Validate required fields
    if (!vaultId || !amount || !referenceId || !buyer) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vaultId, amount, referenceId, buyer'
      });
    }

    const paymentData = {
      vaultId,
      amount,
      currency,
      referenceId,
      buyer,
      items,
      description
    };

    const result = await PayMayaService.createPayment(paymentData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create PayMaya payment',
        error: result.error,
        details: result.details
      });
    }

    res.status(201).json({
      success: true,
      message: 'PayMaya payment created successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Create PayMaya payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get PayMaya payment details
// @route   GET /api/paymaya/payment/:paymentId
// @access  Private
const getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const result = await PayMayaService.getPayment(paymentId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get PayMaya payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create PayMaya invoice
// @route   POST /api/paymaya/invoice
// @access  Private
const createInvoice = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      amount,
      currency = 'PHP',
      description,
      referenceId,
      buyer,
      items,
      redirectUrl
    } = req.body;

    // Validate required fields
    if (!amount || !description || !referenceId || !buyer) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, description, referenceId, buyer'
      });
    }

    const invoiceData = {
      amount,
      currency,
      description,
      referenceId,
      buyer,
      items,
      redirectUrl
    };

    const result = await PayMayaService.createInvoice(invoiceData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create PayMaya invoice',
        error: result.error,
        details: result.details
      });
    }

    res.status(201).json({
      success: true,
      message: 'PayMaya invoice created successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Create PayMaya invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get PayMaya invoice details
// @route   GET /api/paymaya/invoice/:invoiceId
// @access  Private
const getInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID is required'
      });
    }

    const result = await PayMayaService.getInvoice(invoiceId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get PayMaya invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Handle PayMaya webhook events
// @route   POST /api/paymaya/webhook
// @access  Public (PayMaya webhook)
const handlePayMayaWebhook = async (req, res) => {
  try {
    const headers = req.headers;
    const body = req.body;

    // Verify webhook signature
    const isValidSignature = await PayMayaService.verifyWebhookSignature(
      headers, 
      JSON.stringify(body)
    );
    
    if (!isValidSignature) {
      console.error('Invalid PayMaya webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Process the webhook event
    const result = await PayMayaService.processWebhookEvent(body);
    
    if (!result.success) {
      console.error('PayMaya webhook processing failed:', result.error);
      return res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }

    // Handle specific event types
    await handleSpecificWebhookEvent(body);

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('PayMaya webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Handle specific webhook events
const handleSpecificWebhookEvent = async (event) => {
  const eventType = event.eventType;
  const data = event.data;

  try {
    switch (eventType) {
      case 'CHECKOUT_SUCCESS':
        await handleCheckoutSuccess(data);
        break;
      case 'CHECKOUT_FAILURE':
        await handleCheckoutFailure(data);
        break;
      case 'PAYMENT_SUCCESS':
        await handlePaymentSuccess(data);
        break;
      case 'PAYMENT_FAILURE':
        await handlePaymentFailure(data);
        break;
      case 'INVOICE_PAID':
        await handleInvoicePaid(data);
        break;
      case 'INVOICE_EXPIRED':
        await handleInvoiceExpired(data);
        break;
      default:
        logger.info(`Unhandled PayMaya webhook event: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error handling PayMaya webhook event ${eventType}:`, error);
  }
};

// Handle checkout success
const handleCheckoutSuccess = async (data) => {
  try {
    const checkoutId = data.checkoutId;
    const requestReferenceNumber = data.requestReferenceNumber;

    if (!requestReferenceNumber) {
      console.error('No reference number found in checkout success');
      return;
    }

    // Find and update the relevant record based on reference number
    await updatePaymentStatus(requestReferenceNumber, 'completed', checkoutId);
    
    logger.info(`Checkout success for reference: ${requestReferenceNumber}`);
  } catch (error) {
    console.error('Error handling checkout success:', error);
  }
};

// Handle checkout failure
const handleCheckoutFailure = async (data) => {
  try {
    const requestReferenceNumber = data.requestReferenceNumber;

    if (!requestReferenceNumber) {
      console.error('No reference number found in checkout failure');
      return;
    }

    // Find and update the relevant record
    await updatePaymentStatus(requestReferenceNumber, 'failed');
    
    logger.info(`Checkout failure for reference: ${requestReferenceNumber}`);
  } catch (error) {
    console.error('Error handling checkout failure:', error);
  }
};

// Handle payment success
const handlePaymentSuccess = async (data) => {
  try {
    const paymentId = data.paymentId;
    const requestReferenceNumber = data.requestReferenceNumber;

    if (!requestReferenceNumber) {
      console.error('No reference number found in payment success');
      return;
    }

    // Find and update the relevant record
    await updatePaymentStatus(requestReferenceNumber, 'completed', paymentId);
    
    logger.info(`Payment success for reference: ${requestReferenceNumber}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
};

// Handle payment failure
const handlePaymentFailure = async (data) => {
  try {
    const requestReferenceNumber = data.requestReferenceNumber;

    if (!requestReferenceNumber) {
      console.error('No reference number found in payment failure');
      return;
    }

    // Find and update the relevant record
    await updatePaymentStatus(requestReferenceNumber, 'failed');
    
    logger.info(`Payment failure for reference: ${requestReferenceNumber}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
};

// Handle invoice paid
const handleInvoicePaid = async (data) => {
  try {
    const invoiceId = data.invoiceId;
    const requestReferenceNumber = data.requestReferenceNumber;

    if (!requestReferenceNumber) {
      console.error('No reference number found in invoice paid');
      return;
    }

    // Find and update the relevant record
    await updatePaymentStatus(requestReferenceNumber, 'completed', invoiceId);
    
    logger.info(`Invoice paid for reference: ${requestReferenceNumber}`);
  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
};

// Handle invoice expired
const handleInvoiceExpired = async (data) => {
  try {
    const requestReferenceNumber = data.requestReferenceNumber;

    if (!requestReferenceNumber) {
      console.error('No reference number found in invoice expired');
      return;
    }

    // Find and update the relevant record
    await updatePaymentStatus(requestReferenceNumber, 'expired');
    
    logger.info(`Invoice expired for reference: ${requestReferenceNumber}`);
  } catch (error) {
    console.error('Error handling invoice expired:', error);
  }
};

// Update payment status across different models
const updatePaymentStatus = async (referenceNumber, status, transactionId = null) => {
  try {
    // Check LocalPro Plus payments
    const localProPayment = await Payment.findOne({ paymayaReferenceNumber: referenceNumber });
    if (localProPayment) {
      localProPayment.status = status;
      if (transactionId) {
        localProPayment.paymayaTransactionId = transactionId;
      }
      await localProPayment.save();
      return;
    }

    // Check Finance transactions
    const financeTransaction = await Transaction.findOne({ paymayaReferenceNumber: referenceNumber });
    if (financeTransaction) {
      financeTransaction.status = status;
      if (transactionId) {
        financeTransaction.paymayaTransactionId = transactionId;
      }
      await financeTransaction.save();
      return;
    }

    // Check Marketplace bookings
    const booking = await Booking.findOne({ 'payment.paymayaReferenceNumber': referenceNumber });
    if (booking) {
      booking.payment.status = status;
      if (transactionId) {
        booking.payment.paymayaTransactionId = transactionId;
      }
      if (status === 'completed') {
        booking.payment.paidAt = new Date();

        // Trigger payment successful webhook
        try {
          const webhookService = require('../services/webhookService');
          const paymentData = {
            _id: booking.payment._id || booking._id,
            amount: booking.payment.amount || booking.pricing?.total,
            currency: booking.payment.currency || 'PHP',
            method: 'paymaya',
            transactionId: transactionId,
            processedAt: new Date()
          };
          await webhookService.triggerPaymentSuccessful(paymentData, booking.client);
        } catch (webhookError) {
          logger.warn('Webhook trigger failed for payment successful', { error: webhookError.message });
        }
      } else if (status === 'failed') {
        // Trigger payment failed webhook
        try {
          const webhookService = require('../services/webhookService');
          const paymentData = {
            _id: booking.payment._id || booking._id,
            amount: booking.payment.amount || booking.pricing?.total,
            currency: booking.payment.currency || 'PHP',
            method: 'paymaya'
          };
          await webhookService.triggerPaymentFailed(paymentData, booking.client, 'Payment failed');
        } catch (webhookError) {
          logger.warn('Webhook trigger failed for payment failed', { error: webhookError.message });
        }
      }
      await booking.save();
      return;
    }

    // Check Supplies orders
    const order = await Order.findOne({ 'payment.paymayaReferenceNumber': referenceNumber });
    if (order) {
      order.payment.status = status;
      if (transactionId) {
        order.payment.paymayaTransactionId = transactionId;
      }
      if (status === 'completed') {
        order.payment.paidAt = new Date();
        order.status = 'confirmed';
      }
      await order.save();
      return;
    }

    logger.info(`No record found for PayMaya reference: ${referenceNumber}`);
  } catch (error) {
    console.error('Error updating payment status:', error);
  }
};

// @desc    Get PayMaya webhook events (for debugging)
// @route   GET /api/paymaya/webhook/events
// @access  Private (Admin)
const getWebhookEvents = async (req, res) => {
  try {
    // This would typically be stored in a database
    // For now, we'll return a simple response
    res.status(200).json({
      success: true,
      message: 'Webhook events endpoint - implement logging as needed',
      data: []
    });
  } catch (error) {
    console.error('Get webhook events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Validate PayMaya configuration
// @route   GET /api/paymaya/config/validate
// @access  Private (Admin)
const validateConfig = async (req, res) => {
  try {
    const isValid = PayMayaService.validateConfig();
    
    res.status(200).json({
      success: true,
      data: {
        isValid,
        environment: process.env.PAYMAYA_MODE || 'sandbox',
        hasPublicKey: !!process.env.PAYMAYA_PUBLIC_KEY,
        hasSecretKey: !!process.env.PAYMAYA_SECRET_KEY,
        hasWebhookSecret: !!process.env.PAYMAYA_WEBHOOK_SECRET
      }
    });
  } catch (error) {
    console.error('Validate PayMaya config error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createCheckout,
  getCheckout,
  createPayment,
  getPayment,
  createInvoice,
  getInvoice,
  handlePayMayaWebhook,
  getWebhookEvents,
  validateConfig
};
