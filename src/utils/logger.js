const logger = require('../config/logger');

/**
 * Enhanced logging utility for consistent logging across the application
 */
class AppLogger {
  constructor(context = 'App') {
    this.context = context;
  }

  // Create a child logger with specific context
  child(context) {
    return new AppLogger(`${this.context}:${context}`);
  }

  // Log info messages
  info(message, data = {}) {
    logger.info(message, {
      context: this.context,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Log debug messages
  debug(message, data = {}) {
    logger.debug(message, {
      context: this.context,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Log warning messages
  warn(message, data = {}) {
    logger.warn(message, {
      context: this.context,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Log error messages
  error(message, error = null, data = {}) {
    const errorData = {
      context: this.context,
      timestamp: new Date().toISOString(),
      ...data
    };

    if (error) {
      errorData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }

    logger.error(message, errorData);
  }

  // Log HTTP requests
  http(message, data = {}) {
    logger.http(message, {
      context: this.context,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Log business events
  businessEvent(event, data = {}) {
    logger.logBusinessEvent(event, {
      context: this.context,
      ...data
    });
  }

  // Log security events
  securityEvent(event, data = {}) {
    logger.logSecurityEvent(event, {
      context: this.context,
      ...data
    });
  }

  // Log performance metrics
  performance(operation, duration, metadata = {}) {
    logger.logPerformance(operation, duration, {
      context: this.context,
      ...metadata
    });
  }

  // Log database operations
  database(operation, collection, duration, metadata = {}) {
    this.performance(`DB:${operation}`, duration, {
      collection,
      operation,
      ...metadata
    });
  }

  // Log API calls
  apiCall(url, method, statusCode, duration, metadata = {}) {
    this.performance(`API:${method}`, duration, {
      url,
      method,
      statusCode,
      ...metadata
    });
  }

  // Log user actions
  userAction(action, userId, metadata = {}) {
    this.businessEvent('User Action', {
      action,
      userId,
      ...metadata
    });
  }

  // Log authentication events
  authEvent(event, userId, metadata = {}) {
    this.securityEvent(`Auth:${event}`, {
      userId,
      ...metadata
    });
  }

  // Log payment events
  paymentEvent(event, amount, currency, metadata = {}) {
    this.businessEvent('Payment', {
      event,
      amount,
      currency,
      ...metadata
    });
  }

  // Log job/booking events
  bookingEvent(event, bookingId, metadata = {}) {
    this.businessEvent('Booking', {
      event,
      bookingId,
      ...metadata
    });
  }

  // Log marketplace events
  marketplaceEvent(event, productId, metadata = {}) {
    this.businessEvent('Marketplace', {
      event,
      productId,
      ...metadata
    });
  }

  // Log academy events
  academyEvent(event, courseId, userId, metadata = {}) {
    this.businessEvent('Academy', {
      event,
      courseId,
      userId,
      ...metadata
    });
  }

  // Log referral events
  referralEvent(event, referrerId, refereeId, metadata = {}) {
    this.businessEvent('Referral', {
      event,
      referrerId,
      refereeId,
      ...metadata
    });
  }

  // Log communication events
  communicationEvent(event, channel, metadata = {}) {
    this.businessEvent('Communication', {
      event,
      channel,
      ...metadata
    });
  }

  // Log analytics events
  analyticsEvent(event, data = {}) {
    this.businessEvent('Analytics', {
      event,
      ...data
    });
  }
}

// Create default logger instance
const appLogger = new AppLogger();

// Export both the class and default instance
module.exports = {
  AppLogger,
  logger: appLogger,
  // Convenience methods for quick access
  info: (message, data) => appLogger.info(message, data),
  debug: (message, data) => appLogger.debug(message, data),
  warn: (message, data) => appLogger.warn(message, data),
  error: (message, error, data) => appLogger.error(message, error, data),
  http: (message, data) => appLogger.http(message, data),
  businessEvent: (event, data) => appLogger.businessEvent(event, data),
  securityEvent: (event, data) => appLogger.securityEvent(event, data),
  performance: (operation, duration, metadata) => appLogger.performance(operation, duration, metadata),
  database: (operation, collection, duration, metadata) => appLogger.database(operation, collection, duration, metadata),
  apiCall: (url, method, statusCode, duration, metadata) => appLogger.apiCall(url, method, statusCode, duration, metadata),
  userAction: (action, userId, metadata) => appLogger.userAction(action, userId, metadata),
  authEvent: (event, userId, metadata) => appLogger.authEvent(event, userId, metadata),
  paymentEvent: (event, amount, currency, metadata) => appLogger.paymentEvent(event, amount, currency, metadata),
  bookingEvent: (event, bookingId, metadata) => appLogger.bookingEvent(event, bookingId, metadata),
  marketplaceEvent: (event, productId, metadata) => appLogger.marketplaceEvent(event, productId, metadata),
  academyEvent: (event, courseId, userId, metadata) => appLogger.academyEvent(event, courseId, userId, metadata),
  referralEvent: (event, referrerId, refereeId, metadata) => appLogger.referralEvent(event, referrerId, refereeId, metadata),
  communicationEvent: (event, channel, metadata) => appLogger.communicationEvent(event, channel, metadata),
  analyticsEvent: (event, data) => appLogger.analyticsEvent(event, data)
};
