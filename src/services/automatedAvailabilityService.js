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
  }

  /**
   * Start the automated availability service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Automated availability service is already running');
      return;
    }

    const timezone = process.env.TZ || 'UTC';

    // Send job start reminders (every 15 minutes)
    cron.schedule('*/15 * * * *', async () => {
      try {
        await AvailabilityService.sendJobStartReminders(60); // 60 minutes before
      } catch (error) {
        logger.error('Error sending job start reminders:', error);
      }
    }, {
      scheduled: true,
      timezone: timezone
    });

    // Send lateness alerts (every 15 minutes)
    cron.schedule('*/15 * * * *', async () => {
      try {
        await AvailabilityService.sendLatenessAlerts();
      } catch (error) {
        logger.error('Error sending lateness alerts:', error);
      }
    }, {
      scheduled: true,
      timezone: timezone
    });

    this.isRunning = true;
    logger.info('✅ Automated availability service started');
  }

  /**
   * Stop the automated availability service
   */
  stop() {
    this.isRunning = false;
    logger.info('Automated availability service stopped');
  }
}

module.exports = new AutomatedAvailabilityService();
