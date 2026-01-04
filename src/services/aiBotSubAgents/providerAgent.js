/**
 * Provider Sub-Agent
 * 
 * Handles provider-related operations: registration, verification, onboarding, management
 */

const BaseSubAgent = require('./baseSubAgent');
const logger = require('../../config/logger');
const Provider = require('../../models/Provider');

class ProviderAgent extends BaseSubAgent {
  constructor() {
    super('provider_agent');
  }

  async process(interaction, event) {
    try {
      logger.info('Provider agent processing', { eventId: interaction.eventId });

      const actions = [];
      const workflows = [];

      switch (event.type) {
        case 'provider_registered':
          return await this.handleProviderRegistration(interaction, event, actions, workflows);
        
        case 'provider_verified':
          return await this.handleProviderVerification(interaction, event, actions, workflows);
        
        default:
          return await this.handleGenericProviderEvent(interaction, event, actions, workflows);
      }
    } catch (error) {
      logger.error('Provider agent processing failed', {
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

  async handleProviderRegistration(interaction, event, actions, workflows) {
    const userId = event.data?.userId || event.context?.userId;
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID required for provider registration',
        actions: []
      };
    }

    // Trigger onboarding workflow
    workflows.push({
      name: 'user-onboarding',
      workflowId: 'user-onboarding',
      data: {
        userId,
        eventType: 'provider_registered',
        timestamp: new Date().toISOString()
      }
    });

    // Trigger provider verification workflow
    workflows.push({
      name: 'provider-verification',
      workflowId: 'provider-verification',
      data: {
        userId,
        eventType: 'provider_registered'
      }
    });

    actions.push({
      action: 'trigger_onboarding_workflow',
      result: { success: true }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Provider registration processed',
        workflowsTriggered: workflows.length
      }
    };
  }

  async handleProviderVerification(interaction, event, actions, workflows) {
    const providerId = event.data?.providerId || event.context?.providerId;
    
    if (!providerId) {
      return {
        success: false,
        error: 'Provider ID required for verification',
        actions: []
      };
    }

    // Update provider status
    try {
      const provider = await Provider.findOne({ userId: providerId });
      if (provider) {
        provider.status = 'active';
        await provider.save();
        
        actions.push({
          action: 'update_provider_status',
          result: { success: true, status: 'active' }
        });
      }
    } catch (error) {
      logger.error('Failed to update provider status', { error: error.message });
    }

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Provider verification processed',
        providerId
      }
    };
  }

  async handleGenericProviderEvent(interaction, event, actions, workflows) {
    // Generic handler for other provider events
    actions.push({
      action: 'log_provider_event',
      result: { success: true, eventType: event.type }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Provider event processed',
        eventType: event.type
      }
    };
  }

  async shouldEscalate(event, _intentResult) {
    // Escalate if verification fails multiple times
    if (event.type === 'provider_verified' && event.data?.status === 'rejected') {
      return {
        required: true,
        reason: 'Provider verification rejected - requires human review',
        priority: 'high'
      };
    }

    return { required: false };
  }
}

module.exports = ProviderAgent;
