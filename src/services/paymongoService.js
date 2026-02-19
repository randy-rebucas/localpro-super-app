const axios = require('axios');
const logger = require('../config/logger');
require('dotenv').config();
/**
 * PayMongo Payment Gateway Integration
 * Reference: https://developers.paymongo.com/docs
 */

class PayMongoService {
  constructor() {
    this.publicKey = process.env.PAYMONGO_PUBLIC_KEY;
    this.secretKey = process.env.PAYMONGO_SECRET_KEY;
    this.webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    this.baseUrl = 'https://api.paymongo.com/v1';
    
    if (!this.secretKey) {
      logger.warn('PayMongo secret key not configured');
    }
  }

  /**
   * Create an authorization (payment hold)
   * This reserves funds without capturing them
   */
  async createAuthorization(paymentData) {
    try {
      const {
        amount, // in cents
        currency,
        description,
        clientId,
        bookingId
        // returnUrl, // Available for redirect-based payment flows
        // paymentMethod // Available for specifying payment method type
      } = paymentData;

      logger.info('Creating PayMongo authorization', {
        amount,
        currency,
        clientId,
        bookingId
      });

      // Create intent with authorization
      const intentResponse = await this.createPaymentIntent({
        amount,
        currency,
        description: description || `Escrow for booking ${bookingId}`,
        clientId,
        capture: false // This creates an authorization hold instead of immediate capture
      });

      if (!intentResponse.data) {
        throw new Error('Failed to create payment intent');
      }

      const intent = intentResponse.data;

      logger.info('PayMongo authorization created', {
        intentId: intent.id,
        status: intent.attributes.status
      });

      return {
        success: true,
        holdId: intent.id,
        intentId: intent.id,
        clientSecret: intent.attributes.client_key,
        status: intent.attributes.status,
        amount: intent.attributes.amount,
        currency: intent.attributes.currency,
        data: intent
      };
    } catch (error) {
      logger.error('PayMongo authorization error:', error.message);
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.detail || error.message,
        error: error.response?.data
      };
    }
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(intentData) {
    try {
      const {
        amount,
        currency = 'PHP',
        description,
        // clientId, // Available for client tracking
        capture = false,
        payment_method_allowed
      } = intentData;

      const payload = {
        data: {
          attributes: {
            amount,
            currency,
            description,
            statement_descriptor: 'LocalPro Escrow',
            capture,
            payment_method_allowed: payment_method_allowed || ['card', 'gcash', 'paymaya']
          }
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/payment_intents`,
        payload,
        {
          auth: {
            username: this.secretKey,
            password: ''
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('PayMongo intent creation error:', error.message);
      throw error;
    }
  }

  /**
   * Confirm payment with payment method
   */
  async confirmPayment(intentId, paymentMethodId) {
    try {
      logger.info('Confirming PayMongo payment', { intentId, paymentMethodId });

      const payload = {
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: intentId // or provide client_key from intent
          }
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/payment_intents/${intentId}/confirm`,
        payload,
        {
          auth: {
            username: this.secretKey,
            password: ''
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const intent = response.data.data;

      logger.info('Payment confirmed', {
        intentId: intent.id,
        status: intent.attributes.status
      });

      return {
        success: true,
        intentId: intent.id,
        status: intent.attributes.status,
        data: intent
      };
    } catch (error) {
      logger.error('PayMongo payment confirmation error:', error.message);
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.detail || error.message
      };
    }
  }

  /**
   * Capture an authorized payment
   */
  async capturePayment(intentId) {
    try {
      logger.info('Capturing PayMongo payment', { intentId });

      // Get current intent status
      const intentResponse = await axios.get(
        `${this.baseUrl}/payment_intents/${intentId}`,
        {
          auth: {
            username: this.secretKey,
            password: ''
          }
        }
      );

      const intent = intentResponse.data.data;

      // Check if authorization exists
      if (intent.attributes.status !== 'awaiting_payment_method' && 
          intent.attributes.status !== 'succeeded') {
        // Create a new charge from the authorized payment
        const charge = intent.attributes.charges.data[0];

        if (!charge || charge.status !== 'authorized') {
          throw new Error('No authorized charge found to capture');
        }

        // Capture the charge
        const captureResponse = await axios.post(
          `${this.baseUrl}/charges/${charge.id}/capture`,
          {},
          {
            auth: {
              username: this.secretKey,
              password: ''
            }
          }
        );

        const capturedCharge = captureResponse.data.data;

        logger.info('PayMongo payment captured', {
          chargeId: capturedCharge.id,
          status: capturedCharge.attributes.status,
          amount: capturedCharge.attributes.amount
        });

        return {
          success: true,
          captureId: capturedCharge.id,
          chargeId: capturedCharge.id,
          status: capturedCharge.attributes.status,
          amount: capturedCharge.attributes.amount,
          data: capturedCharge
        };
      }

      return {
        success: true,
        captureId: intent.id,
        status: intent.attributes.status,
        data: intent
      };
    } catch (error) {
      logger.error('PayMongo capture error:', error.message);
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.detail || error.message
      };
    }
  }

  /**
   * Release an authorized payment (refund/void)
   */
  async releaseAuthorization(intentId) {
    try {
      logger.info('Releasing PayMongo authorization', { intentId });

      // Get the authorized charge
      const intentResponse = await axios.get(
        `${this.baseUrl}/payment_intents/${intentId}`,
        {
          auth: {
            username: this.secretKey,
            password: ''
          }
        }
      );

      const intent = intentResponse.data.data;
      const charge = intent.attributes.charges.data[0];

      if (!charge) {
        throw new Error('No charge found');
      }

      // If charge is still authorized, reverse it
      if (charge.status === 'authorized') {
        const reverseResponse = await axios.post(
          `${this.baseUrl}/charges/${charge.id}/reverse`,
          {},
          {
            auth: {
              username: this.secretKey,
              password: ''
            }
          }
        );

        const reversedCharge = reverseResponse.data.data;

        logger.info('PayMongo authorization released', {
          chargeId: reversedCharge.id,
          status: reversedCharge.attributes.status
        });

        return {
          success: true,
          releaseId: reversedCharge.id,
          status: reversedCharge.attributes.status,
          data: reversedCharge
        };
      }

      // If already captured, create a refund
      if (charge.status === 'captured') {
        return await this.refundPayment(charge.id);
      }

      return {
        success: true,
        releaseId: charge.id,
        status: charge.status
      };
    } catch (error) {
      logger.error('PayMongo release authorization error:', error.message);
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.detail || error.message
      };
    }
  }

  /**
   * Refund a captured payment
   */
  async refundPayment(chargeId, refundData = {}) {
    try {
      const { amount, reason } = refundData;

      logger.info('Creating PayMongo refund', { chargeId, amount, reason });

      const payload = {
        data: {
          attributes: {
            charge_id: chargeId,
            amount: amount || undefined, // Leave undefined for full refund
            reason: reason || 'customer_request'
          }
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/refunds`,
        payload,
        {
          auth: {
            username: this.secretKey,
            password: ''
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const refund = response.data.data;

      logger.info('PayMongo refund created', {
        refundId: refund.id,
        status: refund.attributes.status,
        amount: refund.attributes.amount
      });

      return {
        success: true,
        refundId: refund.id,
        status: refund.attributes.status,
        amount: refund.attributes.amount,
        data: refund
      };
    } catch (error) {
      logger.error('PayMongo refund error:', error.message);
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.detail || error.message
      };
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(intentId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payment_intents/${intentId}`,
        {
          auth: {
            username: this.secretKey,
            password: ''
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      logger.error('PayMongo get payment intent error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get charge details
   */
  async getCharge(chargeId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/charges/${chargeId}`,
        {
          auth: {
            username: this.secretKey,
            password: ''
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      logger.error('PayMongo get charge error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get refund details
   */
  async getRefund(refundId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/refunds/${refundId}`,
        {
          auth: {
            username: this.secretKey,
            password: ''
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      logger.error('PayMongo get refund error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Create a payment source (tokenize card)
   * This would be called from the client side
   */
  async createPaymentSource(sourceData) {
    try {
      const { type, details } = sourceData;

      const payload = {
        data: {
          attributes: {
            type, // 'card', 'wallet'
            details
          }
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/sources`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(this.publicKey + ':').toString('base64')}`
          }
        }
      );

      return {
        success: true,
        sourceId: response.data.data.id,
        data: response.data.data
      };
    } catch (error) {
      logger.error('PayMongo create source error:', error.message);
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.detail || error.message
      };
    }
  }

  /**
   * Create a hosted checkout session (for subscription payments)
   * Returns a checkoutUrl the frontend redirects the user to
   */
  async createCheckoutSession(sessionData) {
    try {
      if (!this.secretKey) {
        throw new Error('Payment gateway not configured');
      }

      const { amount, currency = 'PHP', name, userId, planId, billingCycle } = sessionData;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const payload = {
        data: {
          attributes: {
            line_items: [{
              currency,
              amount,
              name,
              quantity: 1
            }],
            payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay'],
            metadata: { userId: String(userId), planId: String(planId), billingCycle },
            success_url: `${frontendUrl}/payment/success?plan=${planId}`,
            cancel_url: `${frontendUrl}/payment/cancel`
          }
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/checkout_sessions`,
        payload,
        {
          auth: { username: this.secretKey, password: '' },
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const session = response.data.data;
      const checkoutUrl = session.attributes?.checkout_url;

      if (!checkoutUrl) {
        throw new Error('PayMongo returned no checkout URL');
      }

      logger.info('PayMongo checkout session created', {
        sessionId: session.id,
        userId,
        planId
      });

      return {
        success: true,
        sessionId: session.id,
        checkoutUrl,
        data: session
      };
    } catch (error) {
      logger.error('PayMongo checkout session error:', error.message);
      return {
        success: false,
        message: error.response?.data?.errors?.[0]?.detail || error.message,
        error: error.response?.data
      };
    }
  }

  /**
   * Verify PayMongo webhook signature
   *
   * Header format: t=<unix_timestamp>,te=<test_hmac>,li=<live_hmac>
   * HMAC input:    timestamp + "." + rawBody
   * Use 'te' for sk_test_... keys, 'li' for sk_live_... keys
   * Rejects events older than 5 minutes (replay protection)
   *
   * @param {string} rawBody  - The raw request body as a string
   * @param {string} signatureHeader - The value of the Paymongo-Signature header
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    try {
      const crypto = require('crypto');

      if (!this.webhookSecret) {
        logger.error('PAYMONGO_WEBHOOK_SECRET not configured');
        return false;
      }
      if (!signatureHeader) return false;

      // Parse header parts: t=<ts>,te=<hmac>,li=<hmac>
      const parts = {};
      signatureHeader.split(',').forEach(part => {
        const eqIdx = part.indexOf('=');
        if (eqIdx !== -1) {
          parts[part.slice(0, eqIdx).trim()] = part.slice(eqIdx + 1).trim();
        }
      });

      const timestamp = parts['t'];
      if (!timestamp) return false;

      // Replay protection: reject events older than 5 minutes
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
      if (parseInt(timestamp, 10) < fiveMinutesAgo) {
        logger.warn('PayMongo webhook rejected: timestamp too old', { timestamp });
        return false;
      }

      // Compute expected HMAC
      const signedPayload = `${timestamp}.${rawBody}`;
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(signedPayload)
        .digest('hex');

      // Choose te (test) or li (live) based on secret key prefix
      const isTest = this.secretKey && this.secretKey.startsWith('sk_test_');
      const received = isTest ? parts['te'] : parts['li'];

      if (!received) return false;

      // Timing-safe comparison
      const expectedBuf = Buffer.from(expected, 'hex');
      const receivedBuf = Buffer.from(received, 'hex');
      if (expectedBuf.length !== receivedBuf.length) return false;

      return crypto.timingSafeEqual(expectedBuf, receivedBuf);
    } catch (error) {
      logger.error('PayMongo webhook signature verification error:', error.message);
      return false;
    }
  }

  /**
   * List payment intents (for admin)
   */
  async listPaymentIntents(filters = {}) {
    try {
      const { limit = 20, after } = filters;

      let url = `${this.baseUrl}/payment_intents?limit=${limit}`;
      if (after) url += `&after=${after}`;

      const response = await axios.get(url, {
        auth: {
          username: this.secretKey,
          password: ''
        }
      });

      return {
        success: true,
        data: response.data.data,
        pagination: response.data.meta
      };
    } catch (error) {
      logger.error('PayMongo list intents error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * List charges (for admin)
   */
  async listCharges(filters = {}) {
    try {
      const { limit = 20, after } = filters;

      let url = `${this.baseUrl}/charges?limit=${limit}`;
      if (after) url += `&after=${after}`;

      const response = await axios.get(url, {
        auth: {
          username: this.secretKey,
          password: ''
        }
      });

      return {
        success: true,
        data: response.data.data,
        pagination: response.data.meta
      };
    } catch (error) {
      logger.error('PayMongo list charges error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new PayMongoService();
