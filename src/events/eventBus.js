/**
 * Internal Event Bus
 *
 * A lightweight, in-process event bus built on Node's EventEmitter.
 * Use this for cross-domain communication so feature modules never
 * import each other directly.
 *
 * Usage:
 *   const eventBus = require('./eventBus');
 *   eventBus.emit(EVENTS.JOB_COMPLETED, { jobId, providerId });
 *   eventBus.on(EVENTS.JOB_COMPLETED, handler);
 *
 * Key properties:
 *   - Singleton — the same instance is shared across the entire process.
 *   - Error-isolated — if one async listener throws, others still run.
 *   - Fire-and-forget — emitters do NOT await listener completion.
 */

const EventEmitter = require('events');
const logger       = require('../config/logger');

class AppEventEmitter extends EventEmitter {
  /**
   * Emit an event and swallow any synchronous listener errors so a
   * misbehaving module can never crash the emitter's caller.
   */
  emit(event, ...args) {
    try {
      return super.emit(event, ...args);
    } catch (err) {
      logger.error(`[EventBus] Uncaught error in listener for "${event}"`, {
        event,
        error: err.message,
        stack: err.stack,
      });
      return false;
    }
  }

  /**
   * Register an async listener that will not bubble errors.
   * Prefer this over .on() for async handlers.
   */
  onAsync(event, asyncHandler) {
    this.on(event, (...args) => {
      Promise.resolve(asyncHandler(...args)).catch((err) => {
        logger.error(`[EventBus] Unhandled async error in listener for "${event}"`, {
          event,
          error: err.message,
          stack: err.stack,
        });
      });
    });
  }
}

const eventBus = new AppEventEmitter();

// Raise the default listener limit — large apps register many handlers.
eventBus.setMaxListeners(50);

module.exports = eventBus;
