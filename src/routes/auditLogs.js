const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const auditService = require('../services/auditService');
const { logger } = require('../utils/logger');

// Get audit logs with filtering and pagination - [ADMIN ONLY]
router.get('/', auth, async(req, res) => {
  try {
    // Only allow admin users to view audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const {
      action,
      category,
      severity,
      actorId,
      targetType,
      targetId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      action,
      category,
      severity,
      actorId,
      targetType,
      targetId,
      startDate,
      endDate,
      search
    };

    const pagination = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Max 100 per page
      sortBy,
      sortOrder
    };

    const result = await auditService.getAuditLogs(filters, pagination);

    logger.info('Audit logs retrieved', {
      userId: req.user.id,
      filters,
      resultCount: result.logs.length,
      totalCount: result.pagination.total
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get audit logs', error, {
      userId: req.user.id,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs'
    });
  }
});

// Get audit statistics - [ADMIN ONLY]
router.get('/stats', auth, async(req, res) => {
  try {
    // Only allow admin users to view audit statistics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { timeframe = '30d' } = req.query;
    const stats = await auditService.getAuditStats(timeframe);

    logger.info('Audit statistics retrieved', {
      userId: req.user.id,
      timeframe,
      statsCount: stats.length
    });

    res.json({
      success: true,
      data: {
        timeframe,
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get audit statistics', error, {
      userId: req.user.id,
      timeframe: req.query.timeframe
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit statistics'
    });
  }
});

// Get user activity summary - [ADMIN ONLY]
router.get('/user/:userId/activity', auth, async(req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = '30d' } = req.query;

    // Users can only view their own activity, admins can view any user's activity
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own activity.'
      });
    }

    const summary = await auditService.getUserActivitySummary(userId, timeframe);

    logger.info('User activity summary retrieved', {
      requestedBy: req.user.id,
      targetUserId: userId,
      timeframe,
      summaryCount: summary.length
    });

    res.json({
      success: true,
      data: {
        userId,
        timeframe,
        summary,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get user activity summary', error, {
      userId: req.user.id,
      targetUserId: req.params.userId,
      timeframe: req.query.timeframe
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activity summary'
    });
  }
});

// Get audit log details - [ADMIN ONLY]
router.get('/:auditId', auth, async(req, res) => {
  try {
    // Only allow admin users to view detailed audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { auditId } = req.params;

    // Get audit log details (this would need to be implemented in auditService)
    const AuditLog = require('mongoose').model('AuditLog');
    const auditLog = await AuditLog.findOne({ auditId });

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    logger.info('Audit log details retrieved', {
      userId: req.user.id,
      auditId
    });

    res.json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    logger.error('Failed to get audit log details', error, {
      userId: req.user.id,
      auditId: req.params.auditId
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit log details'
    });
  }
});

// Export audit logs - [ADMIN ONLY]
router.get('/export/data', auth, async(req, res) => {
  try {
    // Only allow admin users to export audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const {
      action,
      category,
      severity,
      actorId,
      targetType,
      targetId,
      startDate,
      endDate,
      format = 'json'
    } = req.query;

    const filters = {
      action,
      category,
      severity,
      actorId,
      targetType,
      targetId,
      startDate,
      endDate
    };

    const exportData = await auditService.exportAuditLogs(filters, format);

    logger.info('Audit logs exported', {
      userId: req.user.id,
      filters,
      format,
      recordCount: Array.isArray(exportData) ? exportData.length : 'CSV format'
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: exportData,
        filters,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Failed to export audit logs', error, {
      userId: req.user.id,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs'
    });
  }
});

// Get audit dashboard summary - [ADMIN ONLY]
router.get('/dashboard/summary', auth, async(req, res) => {
  try {
    // Only allow admin users to view audit dashboard
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const [stats24h, stats7d, stats30d, recentLogs] = await Promise.all([
      auditService.getAuditStats('1d'),
      auditService.getAuditStats('7d'),
      auditService.getAuditStats('30d'),
      auditService.getAuditLogs({}, { page: 1, limit: 10 })
    ]);

    const dashboardData = {
      last24Hours: {
        stats: stats24h,
        totalEvents: stats24h.reduce((sum, stat) => sum + stat.totalCount, 0)
      },
      last7Days: {
        stats: stats7d,
        totalEvents: stats7d.reduce((sum, stat) => sum + stat.totalCount, 0)
      },
      last30Days: {
        stats: stats30d,
        totalEvents: stats30d.reduce((sum, stat) => sum + stat.totalCount, 0)
      },
      recentActivity: {
        logs: recentLogs.logs,
        count: recentLogs.logs.length
      },
      timestamp: new Date().toISOString()
    };

    logger.info('Audit dashboard summary retrieved', {
      userId: req.user.id,
      total24h: dashboardData.last24Hours.totalEvents,
      total7d: dashboardData.last7Days.totalEvents,
      total30d: dashboardData.last30Days.totalEvents
    });

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Failed to get audit dashboard summary', error, {
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit dashboard summary'
    });
  }
});

// Clean up expired audit logs (Admin only) - [ADMIN ONLY]
router.post('/cleanup', auth, async(req, res) => {
  try {
    // Only allow admin users to perform cleanup
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const deletedCount = await auditService.cleanupExpiredLogs();

    logger.info('Audit log cleanup performed', {
      userId: req.user.id,
      deletedCount
    });

    res.json({
      success: true,
      message: 'Audit log cleanup completed',
      data: {
        deletedCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to perform audit log cleanup', error, {
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to perform audit log cleanup'
    });
  }
});

// Get audit log categories and actions - [ADMIN ONLY]
router.get('/metadata/categories', auth, async(req, res) => {
  try {
    // Only allow admin users to view metadata
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const categories = [
      'authentication', 'user_management', 'marketplace', 'job_board', 'financial',
      'agency', 'referral', 'content', 'communication', 'trust_verification',
      'system', 'security', 'data', 'compliance', 'other'
    ];

    const severities = ['low', 'medium', 'high', 'critical'];

    const actions = [
      // Authentication
      'user_login', 'user_logout', 'user_register', 'user_verify', 'password_reset',
      'token_refresh', 'account_locked', 'account_unlocked',

      // User management
      'user_create', 'user_update', 'user_delete', 'user_activate', 'user_deactivate',
      'profile_update', 'settings_update', 'preferences_update',

      // Marketplace
      'service_create', 'service_update', 'service_delete', 'service_publish', 'service_unpublish',
      'booking_create', 'booking_update', 'booking_cancel', 'booking_complete',
      'review_create', 'review_update', 'review_delete',

      // Job board
      'job_create', 'job_update', 'job_delete', 'job_publish', 'job_close',
      'application_create', 'application_update', 'application_withdraw',
      'application_approve', 'application_reject', 'application_shortlist',

      // Financial
      'payment_create', 'payment_process', 'payment_refund', 'payment_failed',
      'withdrawal_request', 'withdrawal_approve', 'withdrawal_reject',
      'loan_apply', 'loan_approve', 'loan_reject', 'loan_repay',
      'salary_advance_request', 'salary_advance_approve', 'salary_advance_reject',

      // Agency
      'agency_create', 'agency_update', 'agency_delete', 'agency_join', 'agency_leave',
      'provider_add', 'provider_remove', 'provider_update', 'provider_activate', 'provider_deactivate',
      'commission_update', 'payout_process',

      // Referral
      'referral_create', 'referral_complete', 'referral_reward', 'referral_invite',
      'referral_validate', 'referral_track',

      // Content
      'course_create', 'course_update', 'course_delete', 'course_enroll', 'course_complete',
      'supply_create', 'supply_update', 'supply_delete', 'supply_order',
      'rental_create', 'rental_update', 'rental_delete', 'rental_book',
      'ad_create', 'ad_update', 'ad_delete', 'ad_promote',

      // Communication
      'message_send', 'message_delete', 'conversation_create', 'conversation_delete',
      'email_send', 'sms_send', 'notification_send',

      // Trust & verification
      'verification_request', 'verification_approve', 'verification_reject',
      'document_upload', 'document_delete', 'document_verify',

      // System
      'system_config_update', 'feature_toggle', 'maintenance_mode',
      'backup_create', 'backup_restore', 'data_export', 'data_import',
      'admin_action', 'bulk_operation', 'system_alert',

      // Security
      'security_scan', 'vulnerability_detected', 'threat_blocked',
      'access_denied', 'permission_granted', 'permission_revoked',
      'role_assigned', 'role_removed', 'privilege_escalation',

      // Data
      'data_create', 'data_read', 'data_update', 'data_delete',
      'data_export', 'data_import', 'data_backup', 'data_restore',
      'privacy_request', 'data_anonymize', 'gdpr_compliance',

      // Other
      'other'
    ];

    res.json({
      success: true,
      data: {
        categories,
        severities,
        actions,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get audit metadata', error, {
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit metadata'
    });
  }
});

module.exports = router;
