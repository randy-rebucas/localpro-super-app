const cron = require('node-cron');
const databaseOptimizationService = require('./databaseOptimizationService');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');

/**
 * Automated Backup Service
 * Handles scheduled database backups with retention policies
 */
class AutomatedBackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.retentionDays = {
      daily: parseInt(process.env.BACKUP_RETENTION_DAYS || 7),
      weekly: parseInt(process.env.BACKUP_RETENTION_WEEKS || 4),
      monthly: parseInt(process.env.BACKUP_RETENTION_MONTHS || 12)
    };
    this.isRunning = false;
  }

  /**
   * Start the automated backup service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Automated backup service is already running');
      return;
    }

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      logger.info('Created backup directory', { path: this.backupDir });
    }

    // Daily backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.createDailyBackup();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Weekly backup on Sundays at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      await this.createWeeklyBackup();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Monthly backup on 1st of month at 4 AM
    cron.schedule('0 4 1 * *', async () => {
      await this.createMonthlyBackup();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Cleanup old backups daily at 5 AM
    cron.schedule('0 5 * * *', async () => {
      await this.cleanupOldBackups();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    this.isRunning = true;
    logger.info('Automated backup service started', {
      retentionDays: this.retentionDays,
      backupDir: this.backupDir
    });
  }

  /**
   * Stop the automated backup service
   */
  stop() {
    this.isRunning = false;
    logger.info('Automated backup service stopped');
  }

  /**
   * Create a daily backup
   */
  async createDailyBackup() {
    try {
      logger.info('Starting daily backup...');
      const startTime = Date.now();
      
      const result = await databaseOptimizationService.backupDatabase();
      
      const duration = Date.now() - startTime;
      logger.info('Daily backup completed', {
        file: result.file,
        duration: `${duration}ms`,
        size: result.size || 'unknown'
      });

      // TODO: Upload to cloud storage (AWS S3, Google Cloud Storage, etc.)
      if (process.env.BACKUP_UPLOAD_TO_CLOUD === 'true') {
        await this.uploadToCloud(result.file);
      }

      return result;
    } catch (error) {
      logger.error('Daily backup failed', error);
      // TODO: Send alert notification
      throw error;
    }
  }

  /**
   * Create a weekly backup
   */
  async createWeeklyBackup() {
    try {
      logger.info('Starting weekly backup...');
      const startTime = Date.now();
      
      const result = await databaseOptimizationService.backupDatabase();
      
      // Rename with weekly prefix
      const weeklyPath = result.file.replace('backup-', 'weekly-backup-');
      fs.renameSync(result.file, weeklyPath);
      
      const duration = Date.now() - startTime;
      logger.info('Weekly backup completed', {
        file: weeklyPath,
        duration: `${duration}ms`,
        size: result.size || 'unknown'
      });

      // TODO: Upload to cloud storage
      if (process.env.BACKUP_UPLOAD_TO_CLOUD === 'true') {
        await this.uploadToCloud(weeklyPath);
      }

      return { ...result, file: weeklyPath };
    } catch (error) {
      logger.error('Weekly backup failed', error);
      throw error;
    }
  }

  /**
   * Create a monthly backup
   */
  async createMonthlyBackup() {
    try {
      logger.info('Starting monthly backup...');
      const startTime = Date.now();
      
      const result = await databaseOptimizationService.backupDatabase();
      
      // Rename with monthly prefix
      const monthlyPath = result.file.replace('backup-', 'monthly-backup-');
      fs.renameSync(result.file, monthlyPath);
      
      const duration = Date.now() - startTime;
      logger.info('Monthly backup completed', {
        file: monthlyPath,
        duration: `${duration}ms`,
        size: result.size || 'unknown'
      });

      // TODO: Upload to cloud storage
      if (process.env.BACKUP_UPLOAD_TO_CLOUD === 'true') {
        await this.uploadToCloud(monthlyPath);
      }

      return { ...result, file: monthlyPath };
    } catch (error) {
      logger.error('Monthly backup failed', error);
      throw error;
    }
  }

  /**
   * Cleanup old backups based on retention policy
   */
  async cleanupOldBackups() {
    try {
      logger.info('Starting backup cleanup...');
      
      if (!fs.existsSync(this.backupDir)) {
        logger.warn('Backup directory does not exist', { path: this.backupDir });
        return;
      }

      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      let deletedCount = 0;
      let totalSizeFreed = 0;

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        
        try {
          const stats = fs.statSync(filePath);
          if (!stats.isFile()) continue;

          const age = now - stats.mtimeMs;
          const ageDays = age / oneDay;
          const fileSize = stats.size;

          let shouldDelete = false;
          let reason = '';

          if (file.startsWith('backup-') && ageDays > this.retentionDays.daily) {
            shouldDelete = true;
            reason = `Daily backup older than ${this.retentionDays.daily} days`;
          } else if (file.startsWith('weekly-backup-') && ageDays > (this.retentionDays.weekly * 7)) {
            shouldDelete = true;
            reason = `Weekly backup older than ${this.retentionDays.weekly} weeks`;
          } else if (file.startsWith('monthly-backup-') && ageDays > (this.retentionDays.monthly * 30)) {
            shouldDelete = true;
            reason = `Monthly backup older than ${this.retentionDays.monthly} months`;
          }

          if (shouldDelete) {
            fs.unlinkSync(filePath);
            deletedCount++;
            totalSizeFreed += fileSize;
            logger.info('Deleted old backup', {
              file,
              age: `${Math.round(ageDays)} days`,
              size: `${(fileSize / 1024 / 1024).toFixed(2)} MB`,
              reason
            });
          }
        } catch (fileError) {
          logger.warn('Error processing backup file', {
            file,
            error: fileError.message
          });
        }
      }

      logger.info('Backup cleanup completed', {
        deletedCount,
        totalSizeFreed: `${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB`,
        remainingFiles: files.length - deletedCount
      });
    } catch (error) {
      logger.error('Backup cleanup failed', error);
      throw error;
    }
  }

  /**
   * Upload backup to cloud storage (placeholder for future implementation)
   * @param {string} filePath - Path to backup file
   */
  async uploadToCloud(filePath) {
    // TODO: Implement cloud storage upload
    // Options:
    // - AWS S3
    // - Google Cloud Storage
    // - Azure Blob Storage
    // - DigitalOcean Spaces
    
    logger.info('Cloud upload not yet implemented', { file: filePath });
    
    // Example implementation structure:
    /*
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3();
    
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    const params = {
      Bucket: process.env.AWS_S3_BACKUP_BUCKET,
      Key: `backups/${fileName}`,
      Body: fileContent
    };
    
    await s3.upload(params).promise();
    logger.info('Backup uploaded to cloud', { file: fileName });
    */
  }

  /**
   * Get backup statistics
   */
  getStats() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return {
          totalBackups: 0,
          totalSize: 0,
          dailyBackups: 0,
          weeklyBackups: 0,
          monthlyBackups: 0
        };
      }

      const files = fs.readdirSync(this.backupDir);
      let totalSize = 0;
      let dailyCount = 0;
      let weeklyCount = 0;
      let monthlyCount = 0;

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
            
            if (file.startsWith('backup-')) dailyCount++;
            else if (file.startsWith('weekly-backup-')) weeklyCount++;
            else if (file.startsWith('monthly-backup-')) monthlyCount++;
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      return {
        totalBackups: files.length,
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        dailyBackups: dailyCount,
        weeklyBackups: weeklyCount,
        monthlyBackups: monthlyCount,
        retentionDays: this.retentionDays,
        isRunning: this.isRunning
      };
    } catch (error) {
      logger.error('Error getting backup stats', error);
      return { error: error.message };
    }
  }
}

module.exports = new AutomatedBackupService();

