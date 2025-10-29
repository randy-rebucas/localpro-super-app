const axios = require('axios');
const crypto = require('crypto');
const logger = require('../config/logger');

// PayMaya API Configuration
const PAYMAYA_CONFIG = {
  sandbox: {
    baseUrl: 'https://pg-sandbox.paymaya.com',
    checkoutUrl: 'https://pg-sandbox.paymaya.com/checkout'
  },
  production: {
    baseUrl: 'https://pg.paymaya.com',
    checkoutUrl: 'https://pg.paymaya.com/checkout'
  }
};

class PayMayaService {
  constructor() {
    this.environment = process.env.PAYMAYA_MODE === 'production' ? 'production' : 'sandbox';
    this.config = PAYMAYA_CONFIG[this.environment];
    this.publicKey = process.env.PAYMAYA_PUBLIC_KEY;
    this.secretKey = process.env.PAYMAYA_SECRET_KEY;
    this.webhookSecret = process.env.PAYMAYA_WEBHOOK_SECRET;
  }

  /**
   * Create a PayMaya checkout session
   * @param {Object} checkoutData - Checkout details
   * @param {number} checkoutData.totalAmount - Total amount in PHP
   * @param {string} checkoutData.currency - Currency code (PHP)
   * @param {string} checkoutData.description - Order description
   * @param {string} checkoutData.referenceId - Internal reference ID
   * @param {Object} checkoutData.buyer - Buyer information
   * @param {Array} checkoutData.items - Array of items
   * @param {Object} checkoutData.redirectUrl - Redirect URLs
   * @returns {Promise<Object>} PayMaya checkout response
   */
  static async createCheckout(checkoutData) {
    try {
      const service = new PayMayaService();
      
      const checkoutRequest = {
        totalAmount: {
          amount: checkoutData.totalAmount.toFixed(2),
          currency: checkoutData.currency || 'PHP'
        },
        buyer: {
          firstName: checkoutData.buyer.firstName,
          lastName: checkoutData.buyer.lastName,
          contact: {
            phone: checkoutData.buyer.phone,
            email: checkoutData.buyer.email
          },
          shippingAddress: checkoutData.buyer.shippingAddress || null,
          billingAddress: checkoutData.buyer.billingAddress || null
        },
        items: checkoutData.items || [{
          name: checkoutData.description,
          code: checkoutData.referenceId,
          description: checkoutData.description,
          quantity: 1,
          totalAmount: {
            amount: checkoutData.totalAmount.toFixed(2),
            currency: checkoutData.currency || 'PHP'
          }
        }],
        redirectUrl: {
          success: checkoutData.redirectUrl.success || `${process.env.FRONTEND_URL}/payment/success`,
          failure: checkoutData.redirectUrl.failure || `${process.env.FRONTEND_URL}/payment/failure`,
          cancel: checkoutData.redirectUrl.cancel || `${process.env.FRONTEND_URL}/payment/cancel`
        },
        requestReferenceNumber: checkoutData.referenceId,
        metadata: {
          source: 'LocalPro Super App',
          version: '1.0.0'
        }
      };

      const response = await axios.post(
        `${service.config.baseUrl}/checkout/v1/checkouts`,
        checkoutRequest,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${service.publicKey}:`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: {
          checkoutId: response.data.checkoutId,
          checkoutUrl: response.data.redirectUrl,
          requestReferenceNumber: response.data.requestReferenceNumber
        }
      };
    } catch (error) {
      console.error('PayMaya create checkout error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Get checkout details
   * @param {string} checkoutId - PayMaya checkout ID
   * @returns {Promise<Object>} Checkout details
   */
  static async getCheckout(checkoutId) {
    try {
      const service = new PayMayaService();
      
      const response = await axios.get(
        `${service.config.baseUrl}/checkout/v1/checkouts/${checkoutId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${service.publicKey}:`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('PayMaya get checkout error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Create a payment using Payment Vault API
   * @param {Object} paymentData - Payment details
   * @param {string} paymentData.vaultId - Vault ID for tokenized payment
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.currency - Currency code
   * @param {string} paymentData.referenceId - Internal reference ID
   * @returns {Promise<Object>} Payment response
   */
  static async createPayment(paymentData) {
    try {
      const service = new PayMayaService();
      
      const paymentRequest = {
        totalAmount: {
          amount: paymentData.amount.toFixed(2),
          currency: paymentData.currency || 'PHP'
        },
        buyer: paymentData.buyer,
        items: paymentData.items || [{
          name: paymentData.description || 'Payment',
          code: paymentData.referenceId,
          description: paymentData.description || 'Payment',
          quantity: 1,
          totalAmount: {
            amount: paymentData.amount.toFixed(2),
            currency: paymentData.currency || 'PHP'
          }
        }],
        requestReferenceNumber: paymentData.referenceId,
        metadata: {
          source: 'LocalPro Super App',
          version: '1.0.0'
        }
      };

      const response = await axios.post(
        `${service.config.baseUrl}/payments/v1/payments`,
        paymentRequest,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${service.secretKey}:`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('PayMaya create payment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Get payment details
   * @param {string} paymentId - PayMaya payment ID
   * @returns {Promise<Object>} Payment details
   */
  static async getPayment(paymentId) {
    try {
      const service = new PayMayaService();
      
      const response = await axios.get(
        `${service.config.baseUrl}/payments/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${service.secretKey}:`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('PayMaya get payment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Create an invoice for payment
   * @param {Object} invoiceData - Invoice details
   * @param {number} invoiceData.amount - Invoice amount
   * @param {string} invoiceData.currency - Currency code
   * @param {string} invoiceData.description - Invoice description
   * @param {string} invoiceData.referenceId - Internal reference ID
   * @param {Object} invoiceData.buyer - Buyer information
   * @returns {Promise<Object>} Invoice response
   */
  static async createInvoice(invoiceData) {
    try {
      const service = new PayMayaService();
      
      const invoiceRequest = {
        totalAmount: {
          amount: invoiceData.amount.toFixed(2),
          currency: invoiceData.currency || 'PHP'
        },
        description: invoiceData.description,
        requestReferenceNumber: invoiceData.referenceId,
        buyer: invoiceData.buyer,
        items: invoiceData.items || [{
          name: invoiceData.description,
          code: invoiceData.referenceId,
          description: invoiceData.description,
          quantity: 1,
          totalAmount: {
            amount: invoiceData.amount.toFixed(2),
            currency: invoiceData.currency || 'PHP'
          }
        }],
        redirectUrl: {
          success: invoiceData.redirectUrl?.success || `${process.env.FRONTEND_URL}/payment/success`,
          failure: invoiceData.redirectUrl?.failure || `${process.env.FRONTEND_URL}/payment/failure`,
          cancel: invoiceData.redirectUrl?.cancel || `${process.env.FRONTEND_URL}/payment/cancel`
        }
      };

      const response = await axios.post(
        `${service.config.baseUrl}/invoices/v1/invoices`,
        invoiceRequest,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${service.publicKey}:`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('PayMaya create invoice error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Get invoice details
   * @param {string} invoiceId - PayMaya invoice ID
   * @returns {Promise<Object>} Invoice details
   */
  static async getInvoice(invoiceId) {
    try {
      const service = new PayMayaService();
      
      const response = await axios.get(
        `${service.config.baseUrl}/invoices/v1/invoices/${invoiceId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${service.publicKey}:`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('PayMaya get invoice error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data
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
      const service = new PayMayaService();
      
      if (!service.webhookSecret) {
        console.warn('PayMaya webhook secret not configured, skipping verification');
        return true; // Allow in development
      }

      const signature = headers['x-paymaya-signature'];
      if (!signature) {
        console.error('No PayMaya signature found in headers');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', service.webhookSecret)
        .update(body)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      console.error('PayMaya webhook verification error:', error);
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
      const eventType = event.eventType;
      const data = event.data;

      switch (eventType) {
        case 'CHECKOUT_SUCCESS':
          return await this.handleCheckoutSuccess(data);
        case 'CHECKOUT_FAILURE':
          return await this.handleCheckoutFailure(data);
        case 'PAYMENT_SUCCESS':
          return await this.handlePaymentSuccess(data);
        case 'PAYMENT_FAILURE':
          return await this.handlePaymentFailure(data);
        case 'INVOICE_PAID':
          return await this.handleInvoicePaid(data);
        case 'INVOICE_EXPIRED':
          return await this.handleInvoiceExpired(data);
        default:
          logger.info(`Unhandled PayMaya webhook event: ${eventType}`);
          return { success: true, message: 'Event not handled' };
      }
    } catch (error) {
      console.error('PayMaya webhook processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle checkout success webhook
   */
  static async handleCheckoutSuccess(data) {
    logger.info('Checkout success:', data.checkoutId);
    return { success: true };
  }

  /**
   * Handle checkout failure webhook
   */
  static async handleCheckoutFailure(data) {
    logger.info('Checkout failure:', data.checkoutId);
    return { success: true };
  }

  /**
   * Handle payment success webhook
   */
  static async handlePaymentSuccess(data) {
    logger.info('Payment success:', data.paymentId);
    return { success: true };
  }

  /**
   * Handle payment failure webhook
   */
  static async handlePaymentFailure(data) {
    logger.info('Payment failure:', data.paymentId);
    return { success: true };
  }

  /**
   * Handle invoice paid webhook
   */
  static async handleInvoicePaid(data) {
    logger.info('Invoice paid:', data.invoiceId);
    return { success: true };
  }

  /**
   * Handle invoice expired webhook
   */
  static async handleInvoiceExpired(data) {
    logger.info('Invoice expired:', data.invoiceId);
    return { success: true };
  }

  /**
   * Format amount for PayMaya (PHP currency)
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount
   */
  static formatAmount(amount) {
    return parseFloat(amount).toFixed(2);
  }

  /**
   * Validate PayMaya configuration
   * @returns {boolean} Whether configuration is valid
   */
  static validateConfig() {
    const service = new PayMayaService();
    return !!(service.publicKey && service.secretKey);
  }
}

module.exports = PayMayaService;
