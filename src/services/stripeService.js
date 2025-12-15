const stripe = require('stripe');
const logger = require('../config/logger');

/**
 * Stripe Payment Gateway Integration
 * Reference: https://stripe.com/docs/api
 */

class StripeService {
  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY;
    this.publicKey = process.env.STRIPE_PUBLIC_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (this.secretKey) {
      this.stripe = stripe(this.secretKey);
    } else {
      logger.warn('Stripe secret key not configured');
    }
  }

  /**
   * Create a payment intent with authorization (funds held)
   * This reserves funds without capturing them
   */
  async createAuthorization(paymentData) {
    try {
      const {
        amount, // in cents
        currency = 'usd',
        description,
        clientId,
        bookingId,
        returnUrl,
        paymentMethodTypes = ['card']
      } = paymentData;

      logger.info('Creating Stripe payment intent', {
        amount,
        currency,
        clientId,
        bookingId
      });

      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      // Create payment intent with manual capture
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        description: description || `Escrow for booking ${bookingId}`,
        payment_method_types: paymentMethodTypes,
        capture_method: 'manual', // Authorize but don't capture
        metadata: {
          clientId,
          bookingId,
          type: 'escrow_authorization'
        },
        ...(returnUrl && {
          confirm: true,
          return_url: returnUrl
        })
      });

      return {
        success: true,
        intentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        holdId: paymentIntent.id,
        status: paymentIntent.status,
        message: 'Payment intent created successfully'
      };
    } catch (error) {
      logger.error('Stripe authorization creation error:', error);
      return {
        success: false,
        message: error.message,
        code: error.code || 'STRIPE_AUTHORIZATION_ERROR'
      };
    }
  }

  /**
   * Capture a previously authorized payment
   */
  async capturePayment(intentId) {
    try {
      logger.info('Capturing Stripe payment intent', { intentId });

      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentIntent = await this.stripe.paymentIntents.capture(intentId);

      return {
        success: true,
        chargeId: paymentIntent.id,
        captureId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        message: 'Payment captured successfully'
      };
    } catch (error) {
      logger.error('Stripe payment capture error:', error);
      return {
        success: false,
        message: error.message,
        code: error.code || 'STRIPE_CAPTURE_ERROR'
      };
    }
  }

  /**
   * Release/cancel a payment authorization
   */
  async releaseAuthorization(intentId) {
    try {
      logger.info('Releasing Stripe payment intent', { intentId });

      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentIntent = await this.stripe.paymentIntents.cancel(intentId);

      return {
        success: true,
        releaseId: paymentIntent.id,
        status: paymentIntent.status,
        message: 'Payment authorization released successfully'
      };
    } catch (error) {
      logger.error('Stripe authorization release error:', error);
      return {
        success: false,
        message: error.message,
        code: error.code || 'STRIPE_RELEASE_ERROR'
      };
    }
  }

  /**
   * Create a refund for a captured payment
   */
  async createRefund(chargeId, amount = null, reason = 'requested_by_customer') {
    try {
      logger.info('Creating Stripe refund', { chargeId, amount, reason });

      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const refundParams = {
        charge: chargeId,
        reason
      };

      if (amount) {
        refundParams.amount = amount;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
        message: 'Refund created successfully'
      };
    } catch (error) {
      logger.error('Stripe refund creation error:', error);
      return {
        success: false,
        message: error.message,
        code: error.code || 'STRIPE_REFUND_ERROR'
      };
    }
  }

  /**
   * Create a payout to a connected account or bank account
   */
  async createPayout(payoutData) {
    try {
      const {
        amount, // in cents
        currency = 'usd',
        // destination, // bank account or card
        description,
        providerId,
        reference
      } = payoutData;

      logger.info('Creating Stripe payout', {
        amount,
        currency,
        providerId,
        reference
      });

      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      // For now, using manual payouts. In production, you'd use Stripe Connect
      const payout = await this.stripe.payouts.create({
        amount,
        currency: currency.toLowerCase(),
        description: description || `Payout for ${reference}`,
        metadata: {
          providerId,
          reference,
          type: 'provider_payout'
        }
      });

      return {
        success: true,
        payoutId: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        message: 'Payout created successfully'
      };
    } catch (error) {
      logger.error('Stripe payout creation error:', error);
      return {
        success: false,
        message: error.message,
        code: error.code || 'STRIPE_PAYOUT_ERROR'
      };
    }
  }

  /**
   * Retrieve payment intent details
   */
  async getPaymentIntent(intentId) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentIntent = await this.stripe.paymentIntents.retrieve(intentId);

      return {
        success: true,
        intent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          description: paymentIntent.description,
          metadata: paymentIntent.metadata,
          charges: paymentIntent.charges
        }
      };
    } catch (error) {
      logger.error('Stripe payment intent retrieval error:', error);
      return {
        success: false,
        message: error.message,
        code: error.code || 'STRIPE_RETRIEVAL_ERROR'
      };
    }
  }

  /**
   * Create a payment method for future use
   */
  async createPaymentMethod(paymentMethodData) {
    try {
      const { type, card, billingDetails } = paymentMethodData;

      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentMethod = await this.stripe.paymentMethods.create({
        type,
        card,
        billing_details: billingDetails
      });

      return {
        success: true,
        paymentMethodId: paymentMethod.id,
        type: paymentMethod.type,
        message: 'Payment method created successfully'
      };
    } catch (error) {
      logger.error('Stripe payment method creation error:', error);
      return {
        success: false,
        message: error.message,
        code: error.code || 'STRIPE_PAYMENT_METHOD_ERROR'
      };
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(intentId, paymentMethodId) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(intentId, {
        payment_method: paymentMethodId
      });

      return {
        success: true,
        intentId: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
        message: 'Payment intent confirmed successfully'
      };
    } catch (error) {
      logger.error('Stripe payment intent confirmation error:', error);
      return {
        success: false,
        message: error.message,
        code: error.code || 'STRIPE_CONFIRMATION_ERROR'
      };
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(rawBody, signature) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );

      return {
        success: true,
        event: {
          id: event.id,
          type: event.type,
          data: event.data.object,
          created: event.created
        }
      };
    } catch (error) {
      logger.error('Stripe webhook handling error:', error);
      return {
        success: false,
        message: error.message,
        code: 'STRIPE_WEBHOOK_ERROR'
      };
    }
  }

  /**
   * Get public key for client-side integration
   */
  getPublicKey() {
    return this.publicKey;
  }

  /**
   * Check if Stripe is properly configured
   */
  isConfigured() {
    return !!this.stripe;
  }
}

module.exports = new StripeService();
