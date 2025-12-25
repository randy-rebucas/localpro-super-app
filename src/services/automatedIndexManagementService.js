const cron = require('node-cron');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('../config/logger');

/**
 * Automated Index Management Service
 *
 * This automates the existing maintenance scripts so index creation isn't manual:
 * - scripts/create-database-indexes.js
 * - scripts/create-slow-query-indexes.js (optional)
 *
 * Default behavior:
 * - Run once at startup if VALIDATE_INDEXES_ON_STARTUP=true
 * - Schedule a daily run (INDEX_MAINTENANCE_SCHEDULE, default 04:00)
 */
class AutomatedIndexManagementService {
  constructor() {
    this.isRunning = false;
    this.jobs = [];
  }

  start() {
    if (this.isRunning) {
      logger.warn('Automated index management service is already running');
      return;
    }

    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.INDEX_MAINTENANCE_SCHEDULE || '0 4 * * *';
    const runSlowQueryIndexes = process.env.ENABLE_SLOW_QUERY_INDEXES === 'true';

    // Optional: run once at startup (async, non-blocking)
    if (process.env.VALIDATE_INDEXES_ON_STARTUP === 'true') {
      this.runIndexScripts({ runSlowQueryIndexes });
    }

    // Scheduled maintenance
    this.jobs.push(
      cron.schedule(
        schedule,
        async () => {
          await this.runIndexScripts({ runSlowQueryIndexes });
        },
        { timezone }
      )
    );

    this.isRunning = true;
    logger.info('Automated index management service started', {
      timezone,
      schedule,
      runSlowQueryIndexes
    });
  }

  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;
    logger.info('Automated index management service stopped');
  }

  runIndexScripts({ runSlowQueryIndexes }) {
    const scriptDir = path.join(__dirname, '../../scripts');

    const scripts = [
      path.join(scriptDir, 'create-database-indexes.js'),
      ...(runSlowQueryIndexes ? [path.join(scriptDir, 'create-slow-query-indexes.js')] : [])
    ];

    scripts.forEach(scriptPath => {
      this.spawnScript(scriptPath);
    });
  }

  spawnScript(scriptPath) {
    try {
      logger.info('Starting index script', { scriptPath });

      const child = spawn(process.execPath, [scriptPath], {
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      child.stdout.on('data', (chunk) => {
        logger.info('Index script output', { scriptPath, output: chunk.toString().trim() });
      });

      child.stderr.on('data', (chunk) => {
        logger.warn('Index script error output', { scriptPath, output: chunk.toString().trim() });
      });

      child.on('close', (code) => {
        if (code === 0) {
          logger.info('Index script completed', { scriptPath, code });
        } else {
          logger.error('Index script failed', { scriptPath, code });
        }
      });
    } catch (error) {
      logger.error('Failed to start index script', { scriptPath, error: error.message });
    }
  }
}

module.exports = new AutomatedIndexManagementService();


