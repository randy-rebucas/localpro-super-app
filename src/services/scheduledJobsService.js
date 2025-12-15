/**
 * Scheduled Jobs Service
 * Manages all scheduled/cron jobs for the application
 * 
 * Jobs:
 * - Historical metrics collection (daily at 2 AM)
 * - Webhook event cleanup (daily at 3 AM)
 * - Other maintenance tasks
 */

const historicalMetricsService = require('./historicalMetricsService');
const WebhookEvent = require('../models/WebhookEvent');
const logger = require('../config/logger');

class ScheduledJobsService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('Scheduled jobs already running');
      return;
    }

    // Skip in test environment
    if (process.env.NODE_ENV === 'test') {
      logger.info('Skipping scheduled jobs in test environment');
      return;
    }

    this.isRunning = true;
    logger.info('🚀 Starting scheduled jobs service...');

    // Start historical metrics collection job
    this.startHistoricalMetricsCollection();

    // Start webhook event cleanup job
    this.startWebhookEventCleanup();

    logger.info('✅ All scheduled jobs started');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    logger.info('Stopping scheduled jobs...');
    
    for (const [name, interval] of this.jobs.entries()) {
      clearInterval(interval);
      logger.info(`Stopped job: ${name}`);
    }
    
    this.jobs.clear();
    this.isRunning = false;
    logger.info('All scheduled jobs stopped');
  }

  /**
   * Start historical metrics collection job
   * Runs daily at 2 AM to collect previous day's metrics
   */
  startHistoricalMetricsCollection() {
    const jobName = 'historical-metrics-collection';
    
    // Calculate time until next 2 AM
    const scheduleNextRun = () => {
      const now = new Date();
      const nextRun = new Date(now);
      nextRun.setHours(2, 0, 0, 0);
      nextRun.setMinutes(0);
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);

      // If it's already past 2 AM today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      const timeUntilRun = nextRun.getTime() - now.getTime();

      logger.info(`Historical metrics collection scheduled for ${nextRun.toISOString()}`);

      // Schedule the first run
      const timeout = setTimeout(async () => {
        await this.collectHistoricalMetrics();
        
        // Then run daily
        const interval = setInterval(async () => {
          await this.collectHistoricalMetrics();
        }, 24 * 60 * 60 * 1000); // 24 hours

        this.jobs.set(jobName, interval);
        
        // Unref to allow Node.js to exit if only this timer is running
        if (interval.unref) {
          interval.unref();
        }
      }, timeUntilRun);

      // Unref timeout
      if (timeout.unref) {
        timeout.unref();
      }
    };

    scheduleNextRun();
  }

  /**
   * Collect historical metrics for all providers
   */
  async collectHistoricalMetrics() {
    try {
      logger.info('📊 Starting historical metrics collection...');
      const startTime = Date.now();

      // Collect metrics for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const result = await historicalMetricsService.collectAllProvidersDailyMetrics(yesterday);

      const duration = Date.now() - startTime;
      logger.info('✅ Historical metrics collection completed', {
        duration: `${duration}ms`,
        total: result.total,
        success: result.success,
        failed: result.failed
      });

      // Log errors if any
      if (result.failed > 0) {
        logger.warn('Some providers failed metrics collection', {
          failed: result.failed,
          errors: result.errors.slice(0, 10) // Log first 10 errors
        });
      }

      return result;
    } catch (error) {
      logger.error('Error in historical metrics collection job:', error);
    }
  }

  /**
   * Start webhook event cleanup job
   * Runs daily at 3 AM to clean up old webhook events
   */
  startWebhookEventCleanup() {
    const jobName = 'webhook-event-cleanup';
    
    const scheduleNextRun = () => {
      const now = new Date();
      const nextRun = new Date(now);
      nextRun.setHours(3, 0, 0, 0);
      nextRun.setMinutes(0);
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);

      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      const timeUntilRun = nextRun.getTime() - now.getTime();

      logger.info(`Webhook event cleanup scheduled for ${nextRun.toISOString()}`);

      const timeout = setTimeout(async () => {
        await this.cleanupWebhookEvents();
        
        // Then run daily
        const interval = setInterval(async () => {
          await this.cleanupWebhookEvents();
        }, 24 * 60 * 60 * 1000);

        this.jobs.set(jobName, interval);
        
        if (interval.unref) {
          interval.unref();
        }
      }, timeUntilRun);

      if (timeout.unref) {
        timeout.unref();
      }
    };

    scheduleNextRun();
  }

  /**
   * Clean up old webhook events
   * Removes events older than retention period (90 days by default)
   */
  async cleanupWebhookEvents() {
    try {
      logger.info('🧹 Starting webhook event cleanup...');
      const startTime = Date.now();

      const retentionDays = parseInt(process.env.WEBHOOK_EVENT_RETENTION_DAYS) || 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await WebhookEvent.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      const duration = Date.now() - startTime;
      logger.info('✅ Webhook event cleanup completed', {
        duration: `${duration}ms`,
        deletedCount: result.deletedCount,
        cutoffDate: cutoffDate.toISOString()
      });

      return result;
    } catch (error) {
      logger.error('Error in webhook event cleanup job:', error);
    }
  }

  /**
   * Get status of all scheduled jobs
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      jobCount: this.jobs.size
    };
  }

  /**
   * Manually trigger historical metrics collection
   * Useful for testing or manual runs
   */
  async triggerHistoricalMetricsCollection(date = null) {
    logger.info('Manually triggering historical metrics collection...');
    return await this.collectHistoricalMetrics();
  }

  /**
   * Manually trigger webhook event cleanup
   */
  async triggerWebhookEventCleanup() {
    logger.info('Manually triggering webhook event cleanup...');
    return await this.cleanupWebhookEvents();
  }
}

// Export singleton instance
const scheduledJobsService = new ScheduledJobsService();

module.exports = scheduledJobsService;

