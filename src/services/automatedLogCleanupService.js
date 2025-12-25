const cron = require('node-cron');
const logger = require('../config/logger');
const logManagementService = require('./logManagementService');
const auditService = require('./auditService');

/**
 * Automated Log Cleanup Service
 *
 * - Cleans up expired DB logs (Log collection)
 * - Cleans up expired audit logs (AuditLog collection)
 *
 * Note: The Log model also has a TTL index on retentionDate. This service provides:
 * - deterministic scheduling
 * - explicit metrics/logging
 * - audit log cleanup (separate collection)
 */
class AutomatedLogCleanupService {
  constructor() {
    this.isRunning = false;
    this.jobs = [];
  }

  start() {
    if (this.isRunning) {
      logger.warn('Automated log cleanup service is already running');
      return;
    }

    const timezone = process.env.TZ || 'UTC';
    const logCleanupSchedule = process.env.LOG_CLEANUP_SCHEDULE || '0 2 * * *'; // daily 2:00
    const auditCleanupSchedule = process.env.AUDIT_CLEANUP_SCHEDULE || '0 2 * * *'; // daily 2:00

    // DB log cleanup (Log collection)
    this.jobs.push(
      cron.schedule(
        logCleanupSchedule,
        async () => {
          await this.runLogCleanup();
        },
        { timezone }
      )
    );

    // Audit log cleanup (AuditLog collection) - only if enabled
    const auditAutoCleanup = process.env.AUDIT_AUTO_CLEANUP !== 'false';
    if (auditAutoCleanup) {
      this.jobs.push(
        cron.schedule(
          auditCleanupSchedule,
          async () => {
            await this.runAuditCleanup();
          },
          { timezone }
        )
      );
    }

    this.isRunning = true;

    logger.info('Automated log cleanup service started', {
      timezone,
      logCleanupSchedule,
      auditCleanupSchedule,
      auditAutoCleanup
    });
  }

  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;
    logger.info('Automated log cleanup service stopped');
  }

  async runLogCleanup() {
    try {
      logger.info('Starting automated log cleanup...');
      const result = await logManagementService.cleanupExpiredLogs();
      logger.info('Automated log cleanup completed', result);
      return result;
    } catch (error) {
      logger.error('Automated log cleanup failed', error);
      return null;
    }
  }

  async runAuditCleanup() {
    try {
      logger.info('Starting automated audit log cleanup...');
      const deletedCount = await auditService.cleanupExpiredLogs();
      logger.info('Automated audit log cleanup completed', {
        deletedCount,
        timestamp: new Date().toISOString()
      });
      return deletedCount;
    } catch (error) {
      logger.error('Automated audit log cleanup failed', error);
      return null;
    }
  }
}

module.exports = new AutomatedLogCleanupService();


