const auditService = require('../services/auditService');
const { logger } = require('./logger');

/**
 * Enhanced audit logging utility for consistent audit logging across controllers
 */
class AuditLogger {
  constructor(context = 'Controller') {
    this.context = context;
  }

  // Create a child audit logger with specific context
  child(context) {
    return new AuditLogger(`${this.context}:${context}`);
  }

  // Log authentication events
  async logAuth(action, req, metadata = {}) {
    try {
      return await auditService.logAuthEvent(
        action,
        req.user?.id,
        req.user?.email,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        metadata
      );
    } catch (error) {
      logger.error('Auth audit logging failed', error, {
        context: this.context,
        action,
        userId: req.user?.id
      });
    }
  }

  // Log user management events
  async logUser(action, req, target, changes = {}, metadata = {}) {
    try {
      const actor = {
        userId: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      return await auditService.logUserEvent(action, actor, target, changes, metadata);
    } catch (error) {
      logger.error('User audit logging failed', error, {
        context: this.context,
        action,
        userId: req.user?.id
      });
    }
  }

  // Log financial events
  async logFinancial(action, req, target, amount, currency, metadata = {}) {
    try {
      const actor = {
        userId: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      return await auditService.logFinancialEvent(action, actor, target, amount, currency, metadata);
    } catch (error) {
      logger.error('Financial audit logging failed', error, {
        context: this.context,
        action,
        userId: req.user?.id
      });
    }
  }

  // Log security events
  async logSecurity(action, req, target, metadata = {}) {
    try {
      const actor = {
        userId: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      return await auditService.logSecurityEvent(action, actor, target, metadata);
    } catch (error) {
      logger.error('Security audit logging failed', error, {
        context: this.context,
        action,
        userId: req.user?.id
      });
    }
  }

  // Log data events
  async logData(action, req, target, metadata = {}) {
    try {
      const actor = {
        userId: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      return await auditService.logDataEvent(action, actor, target, metadata);
    } catch (error) {
      logger.error('Data audit logging failed', error, {
        context: this.context,
        action,
        userId: req.user?.id
      });
    }
  }

  // Log system events
  async logSystem(action, req, target, metadata = {}) {
    try {
      const actor = {
        userId: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      return await auditService.logSystemEvent(action, actor, target, metadata);
    } catch (error) {
      logger.error('System audit logging failed', error, {
        context: this.context,
        action,
        userId: req.user?.id
      });
    }
  }

  // Log custom audit event
  async logCustom(action, category, req, target, changes = {}, metadata = {}) {
    try {
      const actor = {
        userId: req.user?.id,
        email: req.user?.email,
        role: req.user?.role,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      return await auditService.logAuditEvent({
        action,
        category,
        actor,
        target,
        changes,
        metadata,
        request: {
          method: req.method,
          url: req.originalUrl,
          params: req.params,
          query: req.query
        }
      });
    } catch (error) {
      logger.error('Custom audit logging failed', error, {
        context: this.context,
        action,
        category,
        userId: req.user?.id
      });
    }
  }

  // Log marketplace events
  async logMarketplace(action, req, serviceId, serviceName, metadata = {}) {
    return await this.logCustom(
      action,
      'marketplace',
      req,
      { type: 'service', id: serviceId, name: serviceName },
      {},
      metadata
    );
  }

  // Log job board events
  async logJobBoard(action, req, jobId, jobTitle, metadata = {}) {
    return await this.logCustom(
      action,
      'job_board',
      req,
      { type: 'job', id: jobId, name: jobTitle },
      {},
      metadata
    );
  }

  // Log agency events
  async logAgency(action, req, agencyId, agencyName, metadata = {}) {
    return await this.logCustom(
      action,
      'agency',
      req,
      { type: 'agency', id: agencyId, name: agencyName },
      {},
      metadata
    );
  }

  // Log referral events
  async logReferral(action, req, referralId, metadata = {}) {
    return await this.logCustom(
      action,
      'referral',
      req,
      { type: 'referral', id: referralId, name: 'Referral' },
      {},
      metadata
    );
  }

  // Log content events (courses, supplies, rentals, ads)
  async logContent(action, category, req, contentId, contentName, metadata = {}) {
    return await this.logCustom(
      action,
      'content',
      req,
      { type: category, id: contentId, name: contentName },
      {},
      metadata
    );
  }

  // Log communication events
  async logCommunication(action, req, targetId, targetType, metadata = {}) {
    return await this.logCustom(
      action,
      'communication',
      req,
      { type: targetType, id: targetId, name: `${targetType} Communication` },
      {},
      metadata
    );
  }

  // Log trust verification events
  async logTrustVerification(action, req, verificationId, metadata = {}) {
    return await this.logCustom(
      action,
      'trust_verification',
      req,
      { type: 'verification', id: verificationId, name: 'Trust Verification' },
      {},
      metadata
    );
  }

  // Log payment events
  async logPayment(action, req, paymentId, amount, currency, metadata = {}) {
    return await this.logFinancial(
      action,
      req,
      { type: 'payment', id: paymentId, name: 'Payment' },
      amount,
      currency,
      metadata
    );
  }

  // Log booking events
  async logBooking(action, req, bookingId, serviceName, metadata = {}) {
    return await this.logCustom(
      action,
      'marketplace',
      req,
      { type: 'booking', id: bookingId, name: serviceName },
      {},
      metadata
    );
  }

  // Log application events
  async logApplication(action, req, applicationId, jobTitle, metadata = {}) {
    return await this.logCustom(
      action,
      'job_board',
      req,
      { type: 'application', id: applicationId, name: jobTitle },
      {},
      metadata
    );
  }

  // Log settings events
  async logSettings(action, req, settingCategory, changes = {}, metadata = {}) {
    return await this.logUser(
      action,
      req,
      { type: 'user', id: req.user?.id, name: 'User Settings' },
      changes,
      { category: settingCategory, ...metadata }
    );
  }

  // Generic log method that accepts an object and routes to appropriate method
  async log(logData) {
    try {
      const {
        action,
        userId,
        resourceType,
        resourceId,
        metadata = {},
        category,
        req: providedReq
      } = logData;

      // Use provided req or create a minimal one
      let req = providedReq;
      
      if (!req) {
        // Create minimal req object from provided data
        req = {
          user: { 
            id: userId, 
            _id: userId,
            email: logData.email,
            role: logData.role
          },
          ip: logData.ip || 'unknown',
          get: (header) => {
            if (header === 'User-Agent') return logData.userAgent || 'unknown';
            return null;
          },
          method: logData.method || 'UNKNOWN',
          originalUrl: logData.url || 'unknown',
          params: logData.params || {},
          query: logData.query || {}
        };
      } else if (userId && !req.user) {
        // If req is provided but doesn't have user, add it
        req.user = {
          id: userId,
          _id: userId,
          email: logData.email,
          role: logData.role
        };
      }

      // Determine category from resourceType or use provided/default
      const logCategory = category || resourceType || 'system';

      // Create target object
      const target = resourceId 
        ? { type: resourceType || logCategory, id: resourceId, name: resourceType || logCategory }
        : { type: resourceType || logCategory, id: null, name: resourceType || logCategory };

      // Route to logCustom for flexibility
      return await this.logCustom(action, logCategory, req, target, {}, metadata);
    } catch (error) {
      logger.error('Generic audit logging failed', error, {
        context: this.context,
        logData
      });
    }
  }
}

// Create default audit logger instance
const auditLogger = new AuditLogger();

// Export both the class and default instance
module.exports = {
  AuditLogger,
  auditLogger,
  // Convenience methods for quick access
  logAuth: (action, req, metadata) => auditLogger.logAuth(action, req, metadata),
  logUser: (action, req, target, changes, metadata) => auditLogger.logUser(action, req, target, changes, metadata),
  logFinancial: (action, req, target, amount, currency, metadata) => auditLogger.logFinancial(action, req, target, amount, currency, metadata),
  logSecurity: (action, req, target, metadata) => auditLogger.logSecurity(action, req, target, metadata),
  logData: (action, req, target, metadata) => auditLogger.logData(action, req, target, metadata),
  logSystem: (action, req, target, metadata) => auditLogger.logSystem(action, req, target, metadata),
  logCustom: (action, category, req, target, changes, metadata) => auditLogger.logCustom(action, category, req, target, changes, metadata),
  logMarketplace: (action, req, serviceId, serviceName, metadata) => auditLogger.logMarketplace(action, req, serviceId, serviceName, metadata),
  logJobBoard: (action, req, jobId, jobTitle, metadata) => auditLogger.logJobBoard(action, req, jobId, jobTitle, metadata),
  logAgency: (action, req, agencyId, agencyName, metadata) => auditLogger.logAgency(action, req, agencyId, agencyName, metadata),
  logReferral: (action, req, referralId, metadata) => auditLogger.logReferral(action, req, referralId, metadata),
  logContent: (action, category, req, contentId, contentName, metadata) => auditLogger.logContent(action, category, req, contentId, contentName, metadata),
  logCommunication: (action, req, targetId, targetType, metadata) => auditLogger.logCommunication(action, req, targetId, targetType, metadata),
  logTrustVerification: (action, req, verificationId, metadata) => auditLogger.logTrustVerification(action, req, verificationId, metadata),
  logPayment: (action, req, paymentId, amount, currency, metadata) => auditLogger.logPayment(action, req, paymentId, amount, currency, metadata),
  logBooking: (action, req, bookingId, serviceName, metadata) => auditLogger.logBooking(action, req, bookingId, serviceName, metadata),
  logApplication: (action, req, applicationId, jobTitle, metadata) => auditLogger.logApplication(action, req, applicationId, jobTitle, metadata),
  logSettings: (action, req, settingCategory, changes, metadata) => auditLogger.logSettings(action, req, settingCategory, changes, metadata)
};
