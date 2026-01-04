/**
 * Audit Sub-Agent
 * 
 * Handles audit and compliance: audit logs, compliance checks, security reviews
 */

const BaseSubAgent = require('./baseSubAgent');
const logger = require('../../config/logger');

class AuditAgent extends BaseSubAgent {
  constructor() {
    super('audit_agent');
  }

  async process(interaction, event) {
    try {
      logger.info('Audit agent processing', { eventId: interaction.eventId });

      const actions = [];
      const workflows = [];

      // Audit agent logs and reviews events
      actions.push({
        action: 'audit_event',
        result: { success: true, eventType: event.type }
      });

      return {
        success: true,
        actions,
        workflows,
        result: {
          message: 'Audit event processed',
          eventType: event.type
        }
      };
    } catch (error) {
      logger.error('Audit agent processing failed', {
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

  async shouldEscalate(event, intentResult) {
    // Escalate security-related events
    if (event.data?.securityIssue || event.data?.complianceViolation) {
      return {
        required: true,
        reason: 'Security or compliance issue detected',
        priority: 'critical'
      };
    }

    return { required: false };
  }
}

module.exports = AuditAgent;
