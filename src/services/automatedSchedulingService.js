const cron = require('node-cron');
const JobRankingScore = require('../models/JobRankingScore');
const SchedulingSuggestion = require('../models/SchedulingSuggestion');
const logger = require('../config/logger');

/**
 * Automated Scheduling Service
 * 
 * Handles automated tasks for AI-powered scheduling:
 * - Cleanup expired rankings
 * - Cleanup expired suggestions
 * - Generate daily/weekly suggestions (optional, can be triggered manually)
 */
class AutomatedSchedulingService {
  constructor() {
    this.isRunning = false;
    this.cronJobs = []; // Store cron job references for proper cleanup
  }

  /**
   * Start the automated scheduling service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Automated scheduling service is already running');
      return;
    }

    // Clear any existing jobs if restarting
    this.stop();

    const timezone = process.env.TZ || 'UTC';

    // Cleanup expired rankings (daily at 3 AM)
    const rankingsJob = cron.schedule('0 3 * * *', async () => {
      try {
        const result = await JobRankingScore.cleanupExpired();
        logger.info(`Cleaned up expired job rankings: ${result.modifiedCount} updated`);
      } catch (error) {
        logger.error('Error cleaning up expired rankings:', error);
      }
    }, {
      scheduled: true,
      timezone: timezone
    });
    this.cronJobs.push(rankingsJob);

    // Cleanup expired suggestions (daily at 3:30 AM)
    const suggestionsJob = cron.schedule('30 3 * * *', async () => {
      try {
        const result = await SchedulingSuggestion.cleanupExpired();
        logger.info(`Cleaned up expired scheduling suggestions: ${result.modifiedCount} updated`);
      } catch (error) {
        logger.error('Error cleaning up expired suggestions:', error);
      }
    }, {
      scheduled: true,
      timezone: timezone
    });
    this.cronJobs.push(suggestionsJob);

    this.isRunning = true;
    logger.info('✅ Automated scheduling service started');
  }

  /**
   * Stop the automated scheduling service
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
    logger.info('Automated scheduling service stopped');
  }
}

module.exports = new AutomatedSchedulingService();
