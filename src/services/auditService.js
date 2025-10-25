const mongoose = require('mongoose');
const logger = require('../config/logger');

// Audit log schema for compliance and security tracking
const auditLogSchema = new mongoose.Schema({
  auditId: {
    type: String,
    required: true,
    unique: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'user_login', 'user_logout', 'user_register', 'user_verify', 'password_reset',
      'token_refresh', 'account_locked', 'account_unlocked',
      
      // User management actions
      'user_create', 'user_update', 'user_delete', 'user_activate', 'user_deactivate',
      'profile_update', 'settings_update', 'preferences_update', 'user_list', 'user_view',
      'document_upload',
      
      // Marketplace actions
      'service_create', 'service_update', 'service_delete', 'service_publish', 'service_unpublish',
      'booking_create', 'booking_update', 'booking_cancel', 'booking_complete',
      'review_create', 'review_update', 'review_delete',
      
      // Job board actions
      'job_create', 'job_update', 'job_delete', 'job_publish', 'job_close',
      'application_create', 'application_update', 'application_withdraw',
      'application_approve', 'application_reject', 'application_shortlist',
      
      // Financial actions
      'payment_create', 'payment_process', 'payment_refund', 'payment_failed',
      'withdrawal_request', 'withdrawal_approve', 'withdrawal_reject',
      'loan_apply', 'loan_approve', 'loan_reject', 'loan_repay',
      'salary_advance_request', 'salary_advance_approve', 'salary_advance_reject',
      
      // Agency actions
      'agency_create', 'agency_update', 'agency_delete', 'agency_join', 'agency_leave',
      'provider_add', 'provider_remove', 'provider_update', 'provider_activate', 'provider_deactivate',
      'commission_update', 'payout_process',
      
      // Referral actions
      'referral_create', 'referral_complete', 'referral_reward', 'referral_invite',
      'referral_validate', 'referral_track',
      
      // Content actions
      'course_create', 'course_update', 'course_delete', 'course_enroll', 'course_complete',
      'supply_create', 'supply_update', 'supply_delete', 'supply_order',
      'rental_create', 'rental_update', 'rental_delete', 'rental_book',
      'ad_create', 'ad_update', 'ad_delete', 'ad_promote',
      
      // Communication actions
      'message_send', 'message_delete', 'conversation_create', 'conversation_delete',
      'email_send', 'sms_send', 'notification_send',
      
      // Trust & verification actions
      'verification_request', 'verification_approve', 'verification_reject',
      'document_upload', 'document_delete', 'document_verify',
      
      // System actions
      'system_config_update', 'feature_toggle', 'maintenance_mode',
      'backup_create', 'backup_restore', 'data_export', 'data_import',
      'admin_action', 'bulk_operation', 'system_alert',
      
      // Security actions
      'security_scan', 'vulnerability_detected', 'threat_blocked',
      'access_denied', 'permission_granted', 'permission_revoked',
      'role_assigned', 'role_removed', 'privilege_escalation',
      
      // Data actions
      'data_create', 'data_read', 'data_update', 'data_delete',
      'data_export', 'data_import', 'data_backup', 'data_restore',
      'privacy_request', 'data_anonymize', 'gdpr_compliance',
      
      // Other actions
      'other'
    ]
  },
  category: {
    type: String,
    required: true,
    enum: [
      'authentication', 'user_management', 'marketplace', 'job_board', 'financial',
      'agency', 'referral', 'content', 'communication', 'trust_verification',
      'system', 'security', 'data', 'compliance', 'other'
    ]
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  actor: {
    userId: mongoose.Schema.Types.ObjectId,
    email: String,
    role: String,
    ip: String,
    userAgent: String,
    sessionId: String
  },
  target: {
    type: {
      type: String,
      enum: ['user', 'service', 'booking', 'job', 'application', 'payment', 'agency', 'referral', 'course', 'supply', 'rental', 'ad', 'message', 'verification', 'system', 'other']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    name: String,
    description: String
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fields: [String]
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  request: {
    method: String,
    url: String,
    headers: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed,
    params: mongoose.Schema.Types.Mixed,
    query: mongoose.Schema.Types.Mixed
  },
  response: {
    statusCode: Number,
    message: String,
    success: Boolean
  },
  environment: {
    type: String,
    default: process.env.NODE_ENV || 'development'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  retentionDate: {
    type: Date,
    default: function() {
      // Default retention: 7 years for compliance
      return new Date(Date.now() + (7 * 365 * 24 * 60 * 60 * 1000));
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance and compliance
auditLogSchema.index({ auditId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, timestamp: -1 });
auditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
auditLogSchema.index({ 'target.type': 1, 'target.id': 1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ retentionDate: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

class AuditService {
  constructor() {
    this.retentionPolicies = {
      authentication: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      financial: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      security: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
      data: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
      system: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
      default: 7 * 365 * 24 * 60 * 60 * 1000 // 7 years
    };
  }

  // Generate unique audit ID
  generateAuditId() {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  }

  // Determine severity based on action and context
  determineSeverity(action, category, metadata = {}) {
    // Critical actions
    if (['user_delete', 'system_config_update', 'data_delete', 'privilege_escalation'].includes(action)) {
      return 'critical';
    }
    
    // High severity actions
    if (['user_create', 'payment_process', 'loan_approve', 'verification_approve', 'role_assigned'].includes(action)) {
      return 'high';
    }
    
    // Medium severity actions
    if (['user_update', 'service_create', 'booking_create', 'application_create'].includes(action)) {
      return 'medium';
    }
    
    // Low severity actions
    return 'low';
  }

  // Sanitize sensitive data
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'creditCard', 'ssn', 'pin',
      'bankAccount', 'routingNumber', 'cvv', 'expiryDate', 'cardNumber'
    ];
    
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        }
      }
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  // Log audit event
  async logAuditEvent(auditData) {
    try {
      const auditId = this.generateAuditId();
      const severity = this.determineSeverity(auditData.action, auditData.category, auditData.metadata);
      
      const auditLog = new AuditLog({
        auditId,
        action: auditData.action,
        category: auditData.category,
        severity,
        actor: {
          userId: auditData.actor?.userId,
          email: auditData.actor?.email,
          role: auditData.actor?.role,
          ip: auditData.actor?.ip,
          userAgent: auditData.actor?.userAgent,
          sessionId: auditData.actor?.sessionId
        },
        target: auditData.target,
        changes: {
          before: this.sanitizeData(auditData.changes?.before),
          after: this.sanitizeData(auditData.changes?.after),
          fields: auditData.changes?.fields || []
        },
        metadata: this.sanitizeData(auditData.metadata),
        request: auditData.request ? {
          method: auditData.request.method,
          url: auditData.request.url,
          headers: this.sanitizeData(auditData.request.headers),
          body: this.sanitizeData(auditData.request.body),
          params: auditData.request.params,
          query: auditData.request.query
        } : undefined,
        response: auditData.response,
        environment: process.env.NODE_ENV || 'development',
        retentionDate: new Date(Date.now() + (this.retentionPolicies[auditData.category] || this.retentionPolicies.default))
      });

      await auditLog.save();
      
      // Log to Winston for immediate visibility
      logger.info('Audit Event Logged', {
        auditId,
        action: auditData.action,
        category: auditData.category,
        severity,
        actor: auditData.actor?.userId,
        target: auditData.target?.type
      });

      return auditLog;
    } catch (error) {
      // Fallback logging if audit fails
      logger.error('Audit logging failed', error, {
        action: auditData.action,
        category: auditData.category,
        actor: auditData.actor?.userId
      });
    }
  }

  // Log user authentication events
  async logAuthEvent(action, userId, email, ip, userAgent, metadata = {}) {
    return await this.logAuditEvent({
      action,
      category: 'authentication',
      actor: { userId, email, ip, userAgent },
      metadata
    });
  }

  // Log user management events
  async logUserEvent(action, actor, target, changes = {}, metadata = {}) {
    return await this.logAuditEvent({
      action,
      category: 'user_management',
      actor,
      target,
      changes,
      metadata
    });
  }

  // Log financial events
  async logFinancialEvent(action, actor, target, amount, currency, metadata = {}) {
    return await this.logAuditEvent({
      action,
      category: 'financial',
      actor,
      target,
      metadata: { amount, currency, ...metadata }
    });
  }

  // Log security events
  async logSecurityEvent(action, actor, target, metadata = {}) {
    return await this.logAuditEvent({
      action,
      category: 'security',
      actor,
      target,
      metadata
    });
  }

  // Log data access events
  async logDataEvent(action, actor, target, metadata = {}) {
    return await this.logAuditEvent({
      action,
      category: 'data',
      actor,
      target,
      metadata
    });
  }

  // Log system events
  async logSystemEvent(action, actor, target, metadata = {}) {
    return await this.logAuditEvent({
      action,
      category: 'system',
      actor,
      target,
      metadata
    });
  }

  // Get audit logs with filtering
  async getAuditLogs(filters = {}, pagination = {}) {
    const {
      action,
      category,
      severity,
      actorId,
      targetType,
      targetId,
      startDate,
      endDate,
      search
    } = filters;

    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = pagination;

    const query = {};

    if (action) query.action = action;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (actorId) query['actor.userId'] = actorId;
    if (targetType) query['target.type'] = targetType;
    if (targetId) query['target.id'] = targetId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-request.body -request.headers -changes.before -changes.after')
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get audit statistics
  async getAuditStats(timeframe = '30d') {
    const timeframes = {
      '1d': 1 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['30d']));

    const stats = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: since }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            severity: '$severity'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          severities: {
            $push: {
              severity: '$_id.severity',
              count: '$count'
            }
          },
          totalCount: { $sum: '$count' }
        }
      }
    ]);

    return stats;
  }

  // Get user activity summary
  async getUserActivitySummary(userId, timeframe = '30d') {
    const timeframes = {
      '1d': 1 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - (timeframes[timeframe] || timeframes['30d']));

    const summary = await AuditLog.aggregate([
      {
        $match: {
          'actor.userId': new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: since }
        }
      },
      {
        $group: {
          _id: '$category',
          actions: {
            $push: {
              action: '$action',
              timestamp: '$timestamp',
              severity: '$severity'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    return summary;
  }

  // Clean up expired audit logs
  async cleanupExpiredLogs() {
    const now = new Date();
    const result = await AuditLog.deleteMany({
      retentionDate: { $lt: now }
    });

    logger.info('Audit log cleanup completed', {
      deletedCount: result.deletedCount,
      timestamp: now
    });

    return result.deletedCount;
  }

  // Export audit logs for compliance
  async exportAuditLogs(filters = {}, format = 'json') {
    const logs = await this.getAuditLogs(filters, { limit: 10000 });
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = this.convertToCSV(logs.logs);
      return csv;
    }
    
    return logs.logs;
  }

  // Convert audit logs to CSV format
  convertToCSV(logs) {
    const headers = [
      'Audit ID', 'Timestamp', 'Action', 'Category', 'Severity',
      'Actor ID', 'Actor Email', 'Actor Role', 'Actor IP',
      'Target Type', 'Target ID', 'Target Name',
      'Environment', 'Status Code'
    ];

    const rows = logs.map(log => [
      log.auditId,
      log.timestamp,
      log.action,
      log.category,
      log.severity,
      log.actor?.userId || '',
      log.actor?.email || '',
      log.actor?.role || '',
      log.actor?.ip || '',
      log.target?.type || '',
      log.target?.id || '',
      log.target?.name || '',
      log.environment,
      log.response?.statusCode || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

module.exports = new AuditService();
