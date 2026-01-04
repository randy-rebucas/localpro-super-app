/**
 * Support Sub-Agent
 * 
 * Handles support-related operations: customer support, help requests, issues
 */

const BaseSubAgent = require('./baseSubAgent');
const logger = require('../../config/logger');
const n8nService = require('../n8nService');

class SupportAgent extends BaseSubAgent {
  constructor() {
    super('support_agent');
  }

  async process(interaction, event) {
    try {
      logger.info('Support agent processing', { eventId: interaction.eventId });

      const actions = [];
      const workflows = [];

      if (event.type === 'support_request') {
        return await this.handleSupportRequest(interaction, event, actions, workflows);
      }

      return await this.handleGenericSupportEvent(interaction, event, actions, workflows);
    } catch (error) {
      logger.error('Support agent processing failed', {
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

  async handleSupportRequest(interaction, event, actions, workflows) {
    const userId = event.data?.userId || event.context?.userId;
    const issue = event.data?.issue || event.data?.description;
    const priority = event.data?.priority || 'medium';

    // Trigger client support workflow
    workflows.push({
      name: 'client-support',
      workflowId: 'client-support',
      data: {
        userId,
        issue,
        priority,
        eventType: 'support_request',
        timestamp: new Date().toISOString()
      }
    });

    actions.push({
      action: 'create_support_ticket',
      result: { success: true, userId, priority }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Support request processed',
        userId,
        priority
      }
    };
  }

  async handleGenericSupportEvent(interaction, event, actions, workflows) {
    actions.push({
      action: 'log_support_event',
      result: { success: true, eventType: event.type }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Support event processed',
        eventType: event.type
      }
    };
  }

  async shouldEscalate(event, intentResult) {
    // Escalate critical support requests
    if (event.type === 'support_request' && event.data?.priority === 'critical') {
      return {
        required: true,
        reason: 'Critical support request requires immediate attention',
        priority: 'critical'
      };
    }

    return { required: false };
  }
}

module.exports = SupportAgent;
