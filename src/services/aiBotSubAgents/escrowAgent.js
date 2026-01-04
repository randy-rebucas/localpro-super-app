/**
 * Escrow Sub-Agent
 * 
 * Handles escrow-related operations: creation, releases, disputes, settlements
 */

const BaseSubAgent = require('./baseSubAgent');
const logger = require('../../config/logger');
const n8nService = require('../n8nService');

class EscrowAgent extends BaseSubAgent {
  constructor() {
    super('escrow_agent');
  }

  async process(interaction, event) {
    try {
      logger.info('Escrow agent processing', { eventId: interaction.eventId });

      const actions = [];
      const workflows = [];

      switch (event.type) {
        case 'escrow_created':
          return await this.handleEscrowCreated(interaction, event, actions, workflows);
        
        case 'escrow_dispute':
          return await this.handleEscrowDispute(interaction, event, actions, workflows);
        
        default:
          return await this.handleGenericEscrowEvent(interaction, event, actions, workflows);
      }
    } catch (error) {
      logger.error('Escrow agent processing failed', {
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

  async handleEscrowCreated(interaction, event, actions, workflows) {
    const escrowId = event.data?.escrowId || event.context?.escrowId;

    // Trigger escrow management workflow
    workflows.push({
      name: 'escrow-management',
      workflowId: 'escrow-management',
      data: {
        escrowId,
        eventType: 'escrow_created',
        timestamp: new Date().toISOString()
      }
    });

    actions.push({
      action: 'process_escrow_creation',
      result: { success: true, escrowId }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Escrow created and management workflow triggered',
        escrowId
      }
    };
  }

  async handleEscrowDispute(interaction, event, actions, workflows) {
    const escrowId = event.data?.escrowId || event.context?.escrowId;
    const disputeReason = event.data?.reason;

    // Disputes always require human review, but we can log and notify
    actions.push({
      action: 'log_escrow_dispute',
      result: { success: true, escrowId, reason: disputeReason }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Escrow dispute logged - requires human review',
        escrowId,
        requiresEscalation: true
      }
    };
  }

  async handleGenericEscrowEvent(interaction, event, actions, workflows) {
    actions.push({
      action: 'log_escrow_event',
      result: { success: true, eventType: event.type }
    });

    return {
      success: true,
      actions,
      workflows,
      result: {
        message: 'Escrow event processed',
        eventType: event.type
      }
    };
  }

  async shouldEscalate(event, intentResult) {
    // All disputes require escalation
    if (event.type === 'escrow_dispute') {
      return {
        required: true,
        reason: 'Escrow dispute requires human mediation',
        priority: 'high'
      };
    }

    return { required: false };
  }
}

module.exports = EscrowAgent;
