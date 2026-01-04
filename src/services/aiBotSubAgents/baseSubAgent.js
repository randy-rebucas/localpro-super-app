/**
 * Base Sub-Agent Class
 * 
 * All specialized sub-agents extend this base class
 */

const logger = require('../../config/logger');

class BaseSubAgent {
  constructor(name) {
    this.name = name;
    this.isInitialized = false;
  }

  /**
   * Initialize the sub-agent
   */
  async initialize() {
    this.isInitialized = true;
    logger.info(`Sub-agent ${this.name} initialized`);
  }

  /**
   * Main processing method - must be implemented by subclasses
   */
  async process(_interaction, _event) {
    throw new Error('process() must be implemented by subclass');
  }

  /**
   * Check if event should be escalated - can be overridden
   */
  async shouldEscalate(_event, _intentResult) {
    // Default: no escalation needed
    return { required: false };
  }

  /**
   * Get agent capabilities
   */
  getCapabilities() {
    return {
      name: this.name,
      canProcess: true,
      canEscalate: true
    };
  }
}

module.exports = BaseSubAgent;
