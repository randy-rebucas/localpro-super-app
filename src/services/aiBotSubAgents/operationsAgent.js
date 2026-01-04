/**
 * Operations Sub-Agent
 * 
 * Handles system operations: maintenance, monitoring, notifications, data sync
 */

const BaseSubAgent = require('./baseSubAgent');
const logger = require('../../config/logger');

class OperationsAgent extends BaseSubAgent {
  constructor() {
    super('operations_agent');
  }

  async process(interaction, event) {
    try {
      logger.info('Operations agent processing', { eventId: interaction.eventId });

      const actions = [];
      const workflows = [];

      // Operations agent handles system-level events
      actions.push({
        action: 'process_system_operation',
        result: { success: true, eventType: event.type }
      });

      return {
        success: true,
        actions,
        workflows,
        result: {
          message: 'System operation processed',
          eventType: event.type
        }
      };
    } catch (error) {
      logger.error('Operations agent processing failed', {
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

  async shouldEscalate(event, _intentResult) {
    // Escalate system alerts
    if (event.type === 'system_alert' && event.data?.severity === 'critical') {
      return {
        required: true,
        reason: 'Critical system alert requires immediate attention',
        priority: 'critical'
      };
    }

    return { required: false };
  }
}

module.exports = OperationsAgent;
