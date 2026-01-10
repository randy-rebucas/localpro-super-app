const cron = require('node-cron');
const AvailabilityService = require('./availabilityService');
const logger = require('../config/logger');

/**
 * Automated Availability Service
 * 
 * Handles automated tasks for calendar and availability:
 * - Send job start reminders
 * - Send lateness alerts
 * - Clean up expired data
 */
class AutomatedAvailabilityService {
  constructor() {
    this.isRunning = false;
    this.cronJobs = []; // Store cron job references for proper cleanup
  }

  /**
   * Start the automated availability service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Automated availability service is already running');
      return;
    }

    // Clear any existing jobs if restarting
    this.stop();

    const timezone = process.env.TZ || 'UTC';

    // Send job start reminders (every 15 minutes)
    const reminderJob = cron.schedule('*/15 * * * *', async () => {
      try {
        await AvailabilityService.sendJobStartReminders(60); // 60 minutes before
      } catch (error) {
        logger.error('Error sending job start reminders:', error);
      }
    }, {
      scheduled: true,
      timezone: timezone
    });
    this.cronJobs.push(reminderJob);

    // Send lateness alerts (every 15 minutes)
    const latenessJob = cron.schedule('*/15 * * * *', async () => {
      try {
        await AvailabilityService.sendLatenessAlerts();
      } catch (error) {
        logger.error('Error sending lateness alerts:', error);
      }
    }, {
      scheduled: true,
      timezone: timezone
    });
    this.cronJobs.push(latenessJob);

    this.isRunning = true;
    logger.info('✅ Automated availability service started');
  }

  /**
   * Stop the automated availability service
   */
  stop() {
    this.isRunning = false;
    // Stop all cron jobs to prevent memory leaks
    this.cronJobs.forEach(job => {
      if (job && typeof job.stop === 'function') {
        job.stop();
      }
    });
    this.cronJobs = [];
    logger.info('Automated availability service stopped');
  }
}

module.exports = new AutomatedAvailabilityService();
