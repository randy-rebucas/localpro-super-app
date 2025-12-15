const { Xendit } = require('xendit-node');
const logger = require('../config/logger');

/**
 * Xendit Payment Gateway Integration
 * Reference: https://docs.xendit.co/api-reference/
 */

class XenditService {
  constructor() {
    this.secretKey = process.env.XENDIT_SECRET_KEY;
    this.publicKey = process.env.XENDIT_PUBLIC_KEY;
    this.webhookSecret = process.env.XENDIT_WEBHOOK_SECRET;

    if (this.secretKey) {
      this.xendit = new Xendit({
        secretKey: this.secretKey,
        xenditURL: 'https://api.xendit.co'
      });
    } else {
      logger.warn('Xendit secret key not configured');
    }
  }

  /**
   * Create a payment request with authorization (funds held)
   * This reserves funds without capturing them
   */
  async createAuthorization(paymentData) {
    try {
      const {
        amount, // in cents
        currency = 'PHP',
        description,
        clientId,
        bookingId,
        // paymentMethods = ['CARD', 'EWALLET']
      } = paymentData;

      logger.info('Creating Xendit payment request', {
        amount,
        currency,
        clientId,
        bookingId
      });

      if (!this.xendit) {
        throw new Error('Xendit not configured');
      }

      const { PaymentRequest } = this.xendit;

      // Convert amount to Xendit's expected format (cents to main currency unit)
      const amountInCurrency = currency === 'PHP' ? amount / 100 : amount;

      const paymentRequest = await PaymentRequest.create({
        amount: amountInCurrency,
        currency: currency.toUpperCase(),
        referenceId: bookingId || clientId,
        description: description || `Escrow for booking ${bookingId}`,
        paymentMethod: {
          type: 'CARD',
          card: {
            currency: currency.toUpperCase(),
            channelProperties: {
              successReturnUrl: process.env.FRONTEND_URL,
              failureReturnUrl: process.env.FRONTEND_URL
            }
          }
        },
        metadata: {
          clientId,
          bookingId,
          type: 'escrow_authorization'
        }
      });

      return {
        success: true,
        requestId: paymentRequest.id,
        clientSecret: null, // Xendit doesn't provide client secrets like Stripe
        holdId: paymentRequest.id,
        status: paymentRequest.status,
        paymentUrl: paymentRequest.actions?.find(action => action.url)?.url,
        message: 'Payment request created successfully'
      };
    } catch (error) {
      logger.error('Xendit authorization creation error:', error);
      return {
        success: false,
        message: error.message,
        code: error.error_code || 'XENDIT_AUTHORIZATION_ERROR'
      };
    }
  }

  /**
   * Capture a previously authorized payment
   */
  async capturePayment(requestId) {
    try {
      logger.info('Capturing Xendit payment request', { requestId });

      if (!this.xendit) {
        throw new Error('Xendit not configured');
      }

      const { PaymentRequest } = this.xendit;

      // Get payment request details first
      const paymentRequest = await PaymentRequest.get({ id: requestId });

      if (paymentRequest.status !== 'SUCCEEDED') {
        throw new Error(`Payment request not ready for capture: ${paymentRequest.status}`);
      }

      // For Xendit, capture happens automatically when payment succeeds
      // We just need to confirm and get the payment details
      const payment = paymentRequest.payments?.[0];

      if (!payment) {
        throw new Error('No payment found for capture');
      }

      return {
        success: true,
        chargeId: payment.id,
        captureId: payment.id,
        amount: payment.amount * 100, // Convert back to cents
        currency: payment.currency,
        status: payment.status,
        message: 'Payment captured successfully'
      };
    } catch (error) {
      logger.error('Xendit payment capture error:', error);
      return {
        success: false,
        message: error.message,
        code: error.error_code || 'XENDIT_CAPTURE_ERROR'
      };
    }
  }

  /**
   * Release/cancel a payment authorization
   */
  async releaseAuthorization(requestId) {
    try {
      logger.info('Releasing Xendit payment request', { requestId });

      if (!this.xendit) {
        throw new Error('Xendit not configured');
      }

      const { PaymentRequest } = this.xendit;

      // Expire the payment request
      const result = await PaymentRequest.expire({ id: requestId });

      return {
        success: true,
        releaseId: result.id,
        status: result.status,
        message: 'Payment authorization released successfully'
      };
    } catch (error) {
      logger.error('Xendit authorization release error:', error);
      return {
        success: false,
        message: error.message,
        code: error.error_code || 'XENDIT_RELEASE_ERROR'
      };
    }
  }

  /**
   * Create a refund for a captured payment
   */
  async createRefund(paymentId, amount = null, reason = 'requested_by_customer') {
    try {
      logger.info('Creating Xendit refund', { paymentId, amount, reason });

      if (!this.xendit) {
        throw new Error('Xendit not configured');
      }

      const { Payment } = this.xendit;

      const refundParams = {
        paymentId,
        reason
      };

      if (amount) {
        refundParams.amount = amount / 100; // Convert cents to main currency unit
      }

      const refund = await Payment.createRefund(refundParams);

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount * 100, // Convert back to cents
        status: refund.status,
        message: 'Refund created successfully'
      };
    } catch (error) {
      logger.error('Xendit refund creation error:', error);
      return {
        success: false,
        message: error.message,
        code: error.error_code || 'XENDIT_REFUND_ERROR'
      };
    }
  }

  /**
   * Create a disbursement/payout
   */
  async createPayout(payoutData) {
    try {
      const {
        amount, // in cents
        currency = 'PHP',
        bankAccount, // { accountNumber, bankCode }
        description,
        providerId,
        reference
      } = payoutData;

      logger.info('Creating Xendit disbursement', {
        amount,
        currency,
        providerId,
        reference
      });

      if (!this.xendit) {
        throw new Error('Xendit not configured');
      }

      const { Disbursement } = this.xendit;

      const disbursement = await Disbursement.create({
        externalId: reference,
        amount: amount / 100, // Convert cents to main currency unit
        bankCode: bankAccount.bankCode,
        accountNumber: bankAccount.accountNumber,
        description: description || `Payout for ${reference}`,
        emailTo: [], // Optional notification emails
        metadata: {
          providerId,
          reference,
          type: 'provider_payout'
        }
      });

      return {
        success: true,
        payoutId: disbursement.id,
        amount: disbursement.amount * 100, // Convert back to cents
        currency: disbursement.currency,
        status: disbursement.status,
        message: 'Disbursement created successfully'
      };
    } catch (error) {
      logger.error('Xendit disbursement creation error:', error);
      return {
        success: false,
        message: error.message,
        code: error.error_code || 'XENDIT_PAYOUT_ERROR'
      };
    }
  }

  /**
   * Get payment request details
   */
  async getPaymentRequest(requestId) {
    try {
      if (!this.xendit) {
        throw new Error('Xendit not configured');
      }

      const { PaymentRequest } = this.xendit;
      const paymentRequest = await PaymentRequest.get({ id: requestId });

      return {
        success: true,
        request: {
          id: paymentRequest.id,
          status: paymentRequest.status,
          amount: paymentRequest.amount * 100, // Convert to cents
          currency: paymentRequest.currency,
          description: paymentRequest.description,
          metadata: paymentRequest.metadata,
          payments: paymentRequest.payments
        }
      };
    } catch (error) {
      logger.error('Xendit payment request retrieval error:', error);
      return {
        success: false,
        message: error.message,
        code: error.error_code || 'XENDIT_RETRIEVAL_ERROR'
      };
    }
  }

  /**
   * Handle Xendit webhook events
   */
  async handleWebhookEvent(event, data) {
    try {
      if (!this.xendit) {
        throw new Error('Xendit not configured');
      }

      // Xendit webhook events are in the format: { event: 'payment.succeeded', data: {...} }
      logger.info('Processing Xendit webhook event', {
        event,
        dataId: data?.id,
        dataType: data?.type
      });

      return {
        success: true,
        event,
        data
      };
    } catch (error) {
      logger.error('Xendit webhook handling error:', error);
      return {
        success: false,
        message: error.message,
        code: 'XENDIT_WEBHOOK_ERROR'
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
   * Check if Xendit is properly configured
   */
  isConfigured() {
    return !!this.xendit;
  }
}

module.exports = new XenditService();
