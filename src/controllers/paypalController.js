const PayPalService = require('../services/paypalService');
const PayPalSubscriptionService = require('../services/paypalSubscriptionService');
const { Payment, UserSubscription } = require('../models/LocalProPlus');
const { Transaction } = require('../models/Finance');
const { Booking } = require('../models/Marketplace');
const { Order } = require('../models/Supplies');
const logger = require('../config/logger');

// @desc    Handle PayPal webhook events
// @route   POST /api/paypal/webhook
// @access  Public (PayPal webhook)
const handlePayPalWebhook = async (req, res) => {
  try {
    const headers = req.headers;
    const body = req.body;

    // Verify webhook signature
    const isValidSignature = await PayPalService.verifyWebhookSignature(headers, JSON.stringify(body));
    
    if (!isValidSignature) {
      console.error('Invalid PayPal webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Process the webhook event
    const result = await PayPalService.processWebhookEvent(body);
    
    if (!result.success) {
      console.error('PayPal webhook processing failed:', result.error);
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
    console.error('PayPal webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Handle specific webhook events
const handleSpecificWebhookEvent = async (event) => {
  const eventType = event.event_type;
  const resource = event.resource;

  try {
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(resource);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentDenied(resource);
        break;
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(resource);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(resource);
        break;
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(resource);
        break;
      case 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED':
        await handleSubscriptionPaymentCompleted(resource);
        break;
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handleSubscriptionPaymentFailed(resource);
        break;
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(resource);
        break;
      default:
        logger.info(`Unhandled PayPal webhook event: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error handling PayPal webhook event ${eventType}:`, error);
  }
};

// Handle payment completed
const handlePaymentCompleted = async (resource) => {
  try {
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    const captureId = resource.id;

    if (!orderId) {
      console.error('No order ID found in payment capture');
      return;
    }

    // Find and update the relevant record based on order ID
    await updatePaymentStatus(orderId, 'completed', captureId);
    
    logger.info(`Payment completed for order: ${orderId}`);
  } catch (error) {
    console.error('Error handling payment completed:', error);
  }
};

// Handle payment denied
const handlePaymentDenied = async (resource) => {
  try {
    const orderId = resource.supplementary_data?.related_ids?.order_id;

    if (!orderId) {
      console.error('No order ID found in payment denial');
      return;
    }

    // Find and update the relevant record
    await updatePaymentStatus(orderId, 'failed');
    
    logger.info(`Payment denied for order: ${orderId}`);
  } catch (error) {
    console.error('Error handling payment denied:', error);
  }
};

// Handle subscription activated
const handleSubscriptionActivated = async (resource) => {
  try {
    const subscriptionId = resource.id;
    const customId = resource.custom_id;

    if (!customId) {
      console.error('No custom ID found in subscription activation');
      return;
    }

    // Find and update the subscription
    const subscription = await UserSubscription.findById(customId);
    if (subscription) {
      subscription.status = 'active';
      subscription.startDate = new Date();
      subscription.nextBillingDate = new Date(Date.now() + (subscription.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
      await subscription.save();

      // Update payment status
      const payment = await Payment.findOne({
        subscription: subscription._id,
        paypalOrderId: subscription.paymentDetails.paypalOrderId
      });
      
      if (payment) {
        payment.status = 'completed';
        payment.processedAt = new Date();
        await payment.save();
      }

      // Update user's subscription reference
      const user = await User.findById(subscription.user);
      if (user) {
        user.localProPlusSubscription = subscription._id;
        await user.save();
      }
    }
    
    logger.info(`Subscription activated: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling subscription activated:', error);
  }
};

// Handle subscription cancelled
const handleSubscriptionCancelled = async (resource) => {
  try {
    const subscriptionId = resource.id;
    const customId = resource.custom_id;

    if (!customId) {
      console.error('No custom ID found in subscription cancellation');
      return;
    }

    // Find and update the subscription
    const subscription = await UserSubscription.findById(customId);
    if (subscription) {
      subscription.status = 'cancelled';
      subscription.cancellation = {
        requestedAt: new Date(),
        reason: 'Cancelled via PayPal',
        effectiveDate: new Date()
      };
      await subscription.save();
    }
    
    logger.info(`Subscription cancelled: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
};

// Handle subscription payment completed
const handleSubscriptionPaymentCompleted = async (resource) => {
  try {
    const subscriptionId = resource.billing_agreement_id;
    const customId = resource.custom_id;

    if (!customId) {
      console.error('No custom ID found in subscription payment');
      return;
    }

    // Find the subscription and create a new payment record
    const subscription = await UserSubscription.findById(customId);
    if (subscription) {
      const payment = await Payment.create({
        user: subscription.user,
        subscription: subscription._id,
        amount: parseFloat(resource.amount.total),
        currency: resource.amount.currency,
        status: 'completed',
        paymentMethod: 'paypal',
        paymentDetails: {
          paypalSubscriptionId: subscriptionId,
          paypalOrderId: resource.id,
          transactionId: resource.id
        },
        description: `Subscription renewal payment`,
        processedAt: new Date()
      });

      // Update subscription billing date
      const nextBillingDate = new Date();
      if (subscription.billingCycle === 'yearly') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }
      subscription.nextBillingDate = nextBillingDate;
      subscription.endDate = nextBillingDate;
      subscription.paymentDetails.lastPaymentId = resource.id;
      subscription.paymentDetails.lastPaymentDate = new Date();
      await subscription.save();
    }
    
    logger.info(`Subscription payment completed: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling subscription payment completed:', error);
  }
};

// Handle subscription payment failed
const handleSubscriptionPaymentFailed = async (resource) => {
  try {
    const subscriptionId = resource.billing_agreement_id;
    const customId = resource.custom_id;

    if (!customId) {
      console.error('No custom ID found in subscription payment failure');
      return;
    }

    // Find the subscription and create a failed payment record
    const subscription = await UserSubscription.findById(customId);
    if (subscription) {
      const payment = await Payment.create({
        user: subscription.user,
        subscription: subscription._id,
        amount: parseFloat(resource.amount.total),
        currency: resource.amount.currency,
        type: 'renewal',
        status: 'failed',
        paymentMethod: 'paypal',
        paypalSubscriptionId: subscriptionId,
        paypalOrderId: resource.id,
        description: `Failed subscription renewal for ${subscription.plan.name}`
      });

      // Mark subscription as failed
      subscription.status = 'payment_failed';
      await subscription.save();
    }
    
    logger.info(`Subscription payment failed: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling subscription payment failed:', error);
  }
};

// Update payment status across different models
const updatePaymentStatus = async (orderId, status, transactionId = null) => {
  try {
    // Check LocalPro Plus payments
    const localProPayment = await Payment.findOne({ paypalOrderId: orderId });
    if (localProPayment) {
      localProPayment.status = status;
      if (transactionId) {
        localProPayment.paypalTransactionId = transactionId;
      }
      await localProPayment.save();
      return;
    }

    // Check Finance transactions
    const financeTransaction = await Transaction.findOne({ paypalOrderId: orderId });
    if (financeTransaction) {
      financeTransaction.status = status;
      if (transactionId) {
        financeTransaction.paypalTransactionId = transactionId;
      }
      await financeTransaction.save();
      return;
    }

    // Check Marketplace bookings
    const booking = await Booking.findOne({ 'payment.paypalOrderId': orderId });
    if (booking) {
      booking.payment.status = status;
      if (transactionId) {
        booking.payment.paypalTransactionId = transactionId;
      }
      if (status === 'completed') {
        booking.payment.paidAt = new Date();
      }
      await booking.save();
      return;
    }

    // Check Supplies orders
    const order = await Order.findOne({ 'payment.paypalOrderId': orderId });
    if (order) {
      order.payment.status = status;
      if (transactionId) {
        order.payment.paypalTransactionId = transactionId;
      }
      if (status === 'completed') {
        order.payment.paidAt = new Date();
        order.status = 'confirmed';
      }
      await order.save();
      return;
    }

    logger.info(`No record found for PayPal order: ${orderId}`);
  } catch (error) {
    console.error('Error updating payment status:', error);
  }
};

// @desc    Get PayPal webhook events (for debugging)
// @route   GET /api/paypal/webhook/events
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

// Handle subscription suspended
const handleSubscriptionSuspended = async (resource) => {
  try {
    const subscriptionId = resource.id;
    const customId = resource.custom_id;
    logger.info('Subscription suspended:', subscriptionId);
    
    // Update subscription status
    const subscription = await UserSubscription.findById(customId);
    if (subscription) {
      subscription.status = 'suspended';
      await subscription.save();
    }
  } catch (error) {
    console.error('Error handling subscription suspended:', error);
  }
};

// Handle subscription expired
const handleSubscriptionExpired = async (resource) => {
  try {
    const subscriptionId = resource.id;
    const customId = resource.custom_id;
    logger.info('Subscription expired:', subscriptionId);
    
    // Update subscription status
    const subscription = await UserSubscription.findById(customId);
    if (subscription) {
      subscription.status = 'expired';
      await subscription.save();
    }
  } catch (error) {
    console.error('Error handling subscription expired:', error);
  }
};

module.exports = {
  handlePayPalWebhook,
  getWebhookEvents
};
