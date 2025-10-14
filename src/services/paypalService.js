const paypal = require('@paypal/paypal-server-sdk');
const crypto = require('crypto');
const PayPalSubscriptionService = require('./paypalSubscriptionService');

// Configure PayPal SDK
const environment = process.env.PAYPAL_MODE === 'production' 
  ? paypal.Environment.Production
  : paypal.Environment.Sandbox;

const client = new paypal.Client({
  environment: environment,
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET
});

class PayPalService {
  /**
   * Create a PayPal order
   * @param {Object} orderData - Order details
   * @param {number} orderData.amount - Order amount
   * @param {string} orderData.currency - Currency code (e.g., 'USD')
   * @param {string} orderData.description - Order description
   * @param {string} orderData.referenceId - Internal reference ID
   * @param {Object} orderData.items - Array of items
   * @param {Object} orderData.shipping - Shipping details
   * @returns {Promise<Object>} PayPal order response
   */
  static async createOrder(orderData) {
    try {
      const ordersController = new paypal.OrdersController(client);
      
      const orderRequest = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderData.referenceId,
          description: orderData.description,
          amount: {
            currency_code: orderData.currency,
            value: orderData.amount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: orderData.currency,
                value: orderData.amount.toFixed(2)
              }
            }
          },
          items: orderData.items || [{
            name: orderData.description,
            unit_amount: {
              currency_code: orderData.currency,
              value: orderData.amount.toFixed(2)
            },
            quantity: '1'
          }],
          shipping: orderData.shipping ? {
            name: {
              full_name: orderData.shipping.name
            },
            address: {
              address_line_1: orderData.shipping.address_line_1,
              address_line_2: orderData.shipping.address_line_2,
              admin_area_2: orderData.shipping.city,
              admin_area_1: orderData.shipping.state,
              postal_code: orderData.shipping.postal_code,
              country_code: orderData.shipping.country_code
            }
          } : undefined
        }],
        application_context: {
          brand_name: 'LocalPro Super App',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
        }
      };

      const response = await ordersController.createOrder(orderRequest);
      return {
        success: true,
        data: response.result
      };
    } catch (error) {
      console.error('PayPal create order error:', error);
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }
  }

  /**
   * Capture a PayPal order
   * @param {string} orderId - PayPal order ID
   * @returns {Promise<Object>} Capture response
   */
  static async captureOrder(orderId) {
    try {
      const ordersController = new paypal.OrdersController(client);
      
      const response = await ordersController.captureOrder(orderId, {});
      return {
        success: true,
        data: response.result
      };
    } catch (error) {
      console.error('PayPal capture order error:', error);
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }
  }

  /**
   * Get order details
   * @param {string} orderId - PayPal order ID
   * @returns {Promise<Object>} Order details
   */
  static async getOrder(orderId) {
    try {
      const ordersController = new paypal.OrdersController(client);
      
      const response = await ordersController.getOrder(orderId);
      return {
        success: true,
        data: response.result
      };
    } catch (error) {
      console.error('PayPal get order error:', error);
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }
  }

  /**
   * Create a subscription (using REST API directly)
   * @param {Object} subscriptionData - Subscription details
   * @param {string} subscriptionData.planId - PayPal plan ID
   * @param {string} subscriptionData.subscriberId - Internal subscriber ID
   * @param {Object} subscriptionData.subscriber - Subscriber details
   * @returns {Promise<Object>} Subscription response
   */
  static async createSubscription(subscriptionData) {
    try {
      return await PayPalSubscriptionService.createSubscription(subscriptionData);
    } catch (error) {
      console.error('PayPal create subscription error:', error);
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }
  }

  /**
   * Get subscription details
   * @param {string} subscriptionId - PayPal subscription ID
   * @returns {Promise<Object>} Subscription details
   */
  static async getSubscription(subscriptionId) {
    try {
      return await PayPalSubscriptionService.getSubscription(subscriptionId);
    } catch (error) {
      console.error('PayPal get subscription error:', error);
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - PayPal subscription ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation response
   */
  static async cancelSubscription(subscriptionId, reason = 'User requested cancellation') {
    try {
      return await PayPalSubscriptionService.cancelSubscription(subscriptionId, reason);
    } catch (error) {
      console.error('PayPal cancel subscription error:', error);
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }
  }

  /**
   * Create a billing plan for subscriptions
   * @param {Object} planData - Plan details
   * @param {string} planData.name - Plan name
   * @param {string} planData.description - Plan description
   * @param {number} planData.price - Plan price
   * @param {string} planData.currency - Currency code
   * @param {string} planData.frequency - Billing frequency (DAY, WEEK, MONTH, YEAR)
   * @returns {Promise<Object>} Plan creation response
   */
  static async createBillingPlan(planData) {
    try {
      return await PayPalSubscriptionService.createBillingPlan(planData);
    } catch (error) {
      console.error('PayPal create billing plan error:', error);
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }
  }

  /**
   * Verify webhook signature
   * @param {Object} headers - Request headers
   * @param {string} body - Request body
   * @returns {Promise<boolean>} Whether signature is valid
   */
  static async verifyWebhookSignature(headers, body) {
    try {
      const webhookId = process.env.PAYPAL_WEBHOOK_ID;
      if (!webhookId) {
        console.warn('PayPal webhook ID not configured, skipping verification');
        return true; // Allow in development
      }

      return await PayPalSubscriptionService.verifyWebhookSignature(headers, body, webhookId);
    } catch (error) {
      console.error('PayPal webhook verification error:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} Processing result
   */
  static async processWebhookEvent(event) {
    try {
      const eventType = event.event_type;
      const resource = event.resource;

      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          return await this.handlePaymentCompleted(resource);
        case 'PAYMENT.CAPTURE.DENIED':
          return await this.handlePaymentDenied(resource);
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
        case 'BILLING.SUBSCRIPTION.CANCELLED':
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
        case 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED':
        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        case 'BILLING.SUBSCRIPTION.EXPIRED':
          return await PayPalSubscriptionService.processWebhookEvent(event);
        default:
          console.log(`Unhandled PayPal webhook event: ${eventType}`);
          return { success: true, message: 'Event not handled' };
      }
    } catch (error) {
      console.error('PayPal webhook processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle payment completed webhook
   */
  static async handlePaymentCompleted(resource) {
    // This will be implemented in the webhook controller
    console.log('Payment completed:', resource.id);
    return { success: true };
  }

  /**
   * Handle payment denied webhook
   */
  static async handlePaymentDenied(resource) {
    // This will be implemented in the webhook controller
    console.log('Payment denied:', resource.id);
    return { success: true };
  }

  /**
   * Handle subscription activated webhook
   */
  static async handleSubscriptionActivated(resource) {
    // This will be implemented in the webhook controller
    console.log('Subscription activated:', resource.id);
    return { success: true };
  }

  /**
   * Handle subscription cancelled webhook
   */
  static async handleSubscriptionCancelled(resource) {
    // This will be implemented in the webhook controller
    console.log('Subscription cancelled:', resource.id);
    return { success: true };
  }

  /**
   * Handle subscription payment completed webhook
   */
  static async handleSubscriptionPaymentCompleted(resource) {
    // This will be implemented in the webhook controller
    console.log('Subscription payment completed:', resource.id);
    return { success: true };
  }

  /**
   * Handle subscription payment failed webhook
   */
  static async handleSubscriptionPaymentFailed(resource) {
    // This will be implemented in the webhook controller
    console.log('Subscription payment failed:', resource.id);
    return { success: true };
  }
}

module.exports = PayPalService;
