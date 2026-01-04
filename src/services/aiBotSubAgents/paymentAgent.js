/**
 * Payment Sub-Agent
 * 
 * Handles payment-related operations: transactions, refunds, disputes
 */

const BaseSubAgent = require('./baseSubAgent');
const logger = require('../../config/logger');
const n8nService = require('../n8nService');

class PaymentAgent extends BaseSubAgent {
  constructor() {
    super('payment_agent');
  }

  async process(interaction, event) {
    try {
      logger.info('Payment agent processing', { eventId: interaction.eventId });

      const actions = [];
      const workflows = [];

      switch (event.type) {
        case 'payment_received':
          return await this.handlePaymentReceived(interaction, event, actions, workflows);
        
        case 'payment_failed':
          return await this.handlePaymentFailed(interaction, event, actions, workflows);
        
        default:
          return await this.handleGenericPaymentEvent(interaction, event, actions, workflows);
      }
    } catch (error) {
      logger.error('Payment agent processing failed', {
        eventId: interaction.eventId,
        error: error.message
      });
      return {
        success: false,
        error: error.message,
        actions: []
      };
    }
  }

  async handlePaymentReceived(interaction, event, actions, workflows) {
    const paymentId = event.data?.paymentId || event.data?.transactionId;
    const amount = event.data?.amount;

    // Trigger PayPal webhook processor if needed
    if (event.source === 'paypal' || event.data?.gateway === 'paypal') {
      workflows.push({
        name: 'paypal-webhook',
        workflowId: 'paypal-webhook',
        data: {
          paymentId,
          amount,
          eventType: 'payment_received',
          timestamp: new Date().toISOString()
        }
      });
    }

    actions.push({
      action: 'process_payment_received',
      result: { success: true, paymentId, amount }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Payment received and processed',
        paymentId,
        amount
      }
    };
  }

  async handlePaymentFailed(interaction, event, actions, workflows) {
    const paymentId = event.data?.paymentId || event.data?.transactionId;
    const reason = event.data?.reason || 'Unknown';

    // Log failure and potentially notify user
    actions.push({
      action: 'log_payment_failure',
      result: { success: true, paymentId, reason }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Payment failure logged',
        paymentId,
        reason
      }
    };
  }

  async handleGenericPaymentEvent(interaction, event, actions, workflows) {
    actions.push({
      action: 'log_payment_event',
      result: { success: true, eventType: event.type }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Payment event processed',
        eventType: event.type
      }
    };
  }

  async shouldEscalate(event, intentResult) {
    // Escalate high-value payment failures
    if (event.type === 'payment_failed' && event.data?.amount > 5000) {
      return {
        required: true,
        reason: 'High-value payment failure requires review',
        priority: 'high'
      };
    }

    return { required: false };
  }
}

module.exports = PaymentAgent;
