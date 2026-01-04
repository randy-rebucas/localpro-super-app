/**
 * AI Bot Event Listener Service
 * 
 * Listens to events from various sources: API, app, POS, payments, GPS, CRM
 * and forwards them to the AI Bot service for processing
 */

const aiBotService = require('./aiBotService');
const logger = require('../config/logger');
const EventEmitter = require('events');

class AIBotEventListener extends EventEmitter {
  constructor() {
    super();
    this.isListening = false;
    this.eventQueue = [];
    this.processingQueue = false;
  }

  /**
   * Start listening for events
   */
  start() {
    if (this.isListening) {
      logger.warn('AI Bot event listener already started');
      return;
    }

    this.isListening = true;
    this.processQueue();
    logger.info('✅ AI Bot event listener started');
  }

  /**
   * Stop listening for events
   */
  stop() {
    this.isListening = false;
    logger.info('AI Bot event listener stopped');
  }

  /**
   * Emit an event to be processed by AI Bot
   */
  async emitEvent(event) {
    try {
      // Validate event structure
      if (!event.type || !event.source) {
        throw new Error('Event must have type and source');
      }

      // Add to queue
      this.eventQueue.push({
        ...event,
        timestamp: new Date().toISOString(),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      // Process queue if not already processing
      if (!this.processingQueue) {
        this.processQueue();
      }

      logger.debug('Event queued for AI Bot processing', {
        eventType: event.type,
        eventSource: event.source
      });
    } catch (error) {
      logger.error('Failed to emit event', { error: error.message });
      throw error;
    }
  }

  /**
   * Process event queue
   */
  async processQueue() {
    if (this.processingQueue || !this.isListening) {
      return;
    }

    this.processingQueue = true;

    while (this.eventQueue.length > 0 && this.isListening) {
      const event = this.eventQueue.shift();
      
      try {
        await aiBotService.processEvent(event);
      } catch (error) {
        logger.error('Failed to process event', {
          eventId: event.id,
          eventType: event.type,
          error: error.message
        });
      }
    }

    this.processingQueue = false;
  }

  /**
   * Listen to API events (from middleware)
   */
  listenToAPI(req, res, next) {
    // This will be called from middleware
    // Events are emitted via emitEvent()
    next();
  }

  /**
   * Listen to app events (from mobile/web app)
   */
  listenToAppEvent(eventData) {
    return this.emitEvent({
      type: eventData.type || 'app_action',
      source: 'app',
      data: eventData.data || eventData,
      context: eventData.context || {}
    });
  }

  /**
   * Listen to POS events
   */
  listenToPOSEvent(eventData) {
    return this.emitEvent({
      type: 'pos_transaction',
      source: 'pos',
      data: eventData,
      context: {}
    });
  }

  /**
   * Listen to payment events
   */
  listenToPaymentEvent(eventData) {
    return this.emitEvent({
      type: eventData.type || 'payment_event',
      source: 'payments',
      data: eventData,
      context: eventData.context || {}
    });
  }

  /**
   * Listen to GPS events
   */
  listenToGPSEvent(eventData) {
    return this.emitEvent({
      type: 'gps_location',
      source: 'gps',
      data: eventData,
      context: eventData.context || {}
    });
  }

  /**
   * Listen to CRM events
   */
  listenToCRMEvent(eventData) {
    return this.emitEvent({
      type: 'crm_update',
      source: 'crm',
      data: eventData,
      context: eventData.context || {}
    });
  }

  /**
   * Listen to webhook events
   */
  listenToWebhookEvent(eventData) {
    return this.emitEvent({
      type: eventData.type || 'webhook_event',
      source: 'webhook',
      data: eventData,
      context: eventData.context || {}
    });
  }

  /**
   * Listen to n8n events
   */
  listenToN8nEvent(eventData) {
    return this.emitEvent({
      type: eventData.type || 'n8n_event',
      source: 'n8n',
      data: eventData,
      context: eventData.context || {}
    });
  }
}

module.exports = new AIBotEventListener();
