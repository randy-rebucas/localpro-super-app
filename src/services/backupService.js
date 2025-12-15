/**
 * Backup and Recovery Service
 * Handles automated database backups, file backups, and recovery procedures
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    this.scheduleEnabled = process.env.BACKUP_SCHEDULE_ENABLED !== 'false';

    // Ensure backup directory exists
    this.ensureBackupDirectory();

    if (this.scheduleEnabled) {
      this.startScheduledBackups();
    }
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info(`Backup directory ensured: ${this.backupDir}`);
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
    }
  }

  /**
   * Start scheduled backups
   */
  startScheduledBackups() {
    // Daily backup at 2 AM
    const dailyBackup = () => {
      const now = new Date();
      const nextBackup = new Date(now);
      nextBackup.setHours(2, 0, 0, 0);

      if (nextBackup <= now) {
        nextBackup.setDate(now.getDate() + 1);
      }

      const timeUntilBackup = nextBackup - now;

      setTimeout(() => {
        this.performFullBackup();
        // Repeat daily
        setInterval(() => this.performFullBackup(), 24 * 60 * 60 * 1000);
      }, timeUntilBackup);

      logger.info(`Daily backup scheduled for ${nextBackup.toISOString()}`);
    };

    // Weekly full backup on Sunday at 3 AM
    const weeklyBackup = () => {
      const now = new Date();
      const nextBackup = new Date(now);
      nextBackup.setHours(3, 0, 0, 0);

      // Find next Sunday
      const daysUntilSunday = (7 - now.getDay()) % 7;
      if (daysUntilSunday === 0 && now.getHours() >= 3) {
        nextBackup.setDate(now.getDate() + 7);
      } else {
        nextBackup.setDate(now.getDate() + daysUntilSunday);
      }

      const timeUntilBackup = nextBackup - now;

      setTimeout(() => {
        this.performFullBackup('weekly');
        // Repeat weekly
        setInterval(() => this.performFullBackup('weekly'), 7 * 24 * 60 * 60 * 1000);
      }, timeUntilBackup);

      logger.info(`Weekly backup scheduled for ${nextBackup.toISOString()}`);
    };

    dailyBackup();
    weeklyBackup();
  }

  /**
   * Perform full database and file backup
   */
  async performFullBackup(type = 'daily') {
    try {
      logger.info(`Starting ${type} backup...`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `${type}_${timestamp}`);

      await fs.mkdir(backupPath, { recursive: true });

      // Database backup
      await this.backupDatabase(backupPath);

      // File backup
      await this.backupFiles(backupPath);

      // Create backup metadata
      await this.createBackupMetadata(backupPath, type, timestamp);

      // Clean old backups
      await this.cleanupOldBackups();

      logger.info(`${type} backup completed successfully: ${backupPath}`);

      return {
        success: true,
        path: backupPath,
        type,
        timestamp
      };

    } catch (error) {
      logger.error(`Backup failed:`, error);
      return {
        success: false,
        error: error.message,
        type,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Backup database using mongodump
   */
  async backupDatabase(backupPath) {
    return new Promise((resolve, reject) => {
      const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app';
      const dbName = this.extractDatabaseName(dbUri);

      const dumpPath = path.join(backupPath, 'database');

      const command = `mongodump --uri="${dbUri}" --out="${dumpPath}" --db=${dbName}`;

      exec(command, (error, _stdout, _stderr) => {
        if (error) {
          logger.error('Database backup failed:', error);
          reject(error);
        } else {
          logger.info('Database backup completed');
          resolve(dumpPath);
        }
      });
    });
  }

  /**
   * Backup important files and directories
   */
  async backupFiles(backupPath) {
    const filesPath = path.join(backupPath, 'files');
    await fs.mkdir(filesPath, { recursive: true });

    const backupItems = [
      { src: 'uploads', dest: 'uploads' },
      { src: 'public/images', dest: 'images' },
      { src: 'logs', dest: 'logs' },
      { src: 'config', dest: 'config' },
      { src: 'features', dest: 'features' }
    ];

    for (const item of backupItems) {
      try {
        const srcPath = path.join(process.cwd(), item.src);
        const destPath = path.join(filesPath, item.dest);

        // Check if source exists
        try {
          await fs.access(srcPath);
          await this.copyDirectory(srcPath, destPath);
          logger.info(`Backed up: ${item.src}`);
        } catch (accessError) {
          // Directory doesn't exist, skip
          logger.warn(`Skipping backup of non-existent directory: ${item.src}`);
        }
      } catch (error) {
        logger.error(`Failed to backup ${item.src}:`, error);
      }
    }
  }

  /**
   * Copy directory recursively
   */
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });

    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Create backup metadata file
   */
  async createBackupMetadata(backupPath, type, timestamp) {
    const metadata = {
      type,
      timestamp,
      createdAt: new Date().toISOString(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      databaseUri: this.maskSensitiveData(process.env.MONGODB_URI),
      backupVersion: '1.0',
      contents: {
        database: true,
        files: true,
        metadata: true
      },
      checksums: await this.calculateChecksums(backupPath)
    };

    const metadataPath = path.join(backupPath, 'backup-metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Calculate checksums for backup verification
   */
  async calculateChecksums(backupPath) {
    const crypto = require('crypto');
    const checksums = {};

    try {
      const files = await this.getAllFiles(backupPath);

      for (const file of files.slice(0, 10)) { // Limit to first 10 files for performance
        const content = await fs.readFile(file);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        checksums[path.relative(backupPath, file)] = hash;
      }
    } catch (error) {
      logger.error('Failed to calculate checksums:', error);
    }

    return checksums;
  }

  /**
   * Get all files in directory recursively
   */
  async getAllFiles(dirPath) {
    const files = [];

    async function traverse(currentPath) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }

    await traverse(dirPath);
    return files;
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups() {
    try {
      const entries = await fs.readdir(this.backupDir, { withFileTypes: true });
      const backups = entries
        .filter(entry => entry.isDirectory())
        .map(entry => ({
          name: entry.name,
          path: path.join(this.backupDir, entry.name),
          created: this.parseBackupTimestamp(entry.name)
        }))
        .filter(backup => backup.created)
        .sort((a, b) => b.created - a.created);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      const toDelete = backups.filter(backup => backup.created < cutoffDate);

      for (const backup of toDelete) {
        try {
          await fs.rm(backup.path, { recursive: true, force: true });
          logger.info(`Deleted old backup: ${backup.name}`);
        } catch (error) {
          logger.error(`Failed to delete backup ${backup.name}:`, error);
        }
      }

      logger.info(`Cleanup completed. Deleted ${toDelete.length} old backups`);
    } catch (error) {
      logger.error('Backup cleanup failed:', error);
    }
  }

  /**
   * Parse backup timestamp from filename
   */
  parseBackupTimestamp(filename) {
    // Extract timestamp from format: daily_2025-12-15T10-30-00-000Z or weekly_2025-12-15T10-30-00-000Z
    const match = filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
    if (match) {
      return new Date(match[1].replace(/-/g, ':').replace('T', 'T'));
    }
    return null;
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupPath, options = {}) {
    try {
      logger.info(`Starting restore from: ${backupPath}`);

      // Verify backup integrity
      const isValid = await this.verifyBackup(backupPath);
      if (!isValid) {
        throw new Error('Backup verification failed');
      }

      if (options.database !== false) {
        await this.restoreDatabase(backupPath);
      }

      if (options.files !== false) {
        await this.restoreFiles(backupPath);
      }

      logger.info('Restore completed successfully');
      return { success: true };

    } catch (error) {
      logger.error('Restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore database from backup
   */
  async restoreDatabase(backupPath) {
    return new Promise((resolve, reject) => {
      const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app';
      const dbName = this.extractDatabaseName(dbUri);
      const dumpPath = path.join(backupPath, 'database', dbName);

      const command = `mongorestore --uri="${dbUri}" --db=${dbName} "${dumpPath}" --drop`;

      exec(command, (error, _stdout, _stderr) => {
        if (error) {
          logger.error('Database restore failed:', error);
          reject(error);
        } else {
          logger.info('Database restore completed');
          resolve();
        }
      });
    });
  }

  /**
   * Restore files from backup
   */
  async restoreFiles(backupPath) {
    const filesPath = path.join(backupPath, 'files');

    const restoreItems = [
      { src: 'uploads', dest: 'uploads' },
      { src: 'images', dest: 'public/images' },
      { src: 'logs', dest: 'logs' }
    ];

    for (const item of restoreItems) {
      try {
        const srcPath = path.join(filesPath, item.src);
        const destPath = path.join(process.cwd(), item.dest);

        // Check if source exists in backup
        try {
          await fs.access(srcPath);
          await this.copyDirectory(srcPath, destPath);
          logger.info(`Restored: ${item.src}`);
        } catch (accessError) {
          logger.warn(`Skipping restore of missing backup item: ${item.src}`);
        }
      } catch (error) {
        logger.error(`Failed to restore ${item.src}:`, error);
      }
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath) {
    try {
      const metadataPath = path.join(backupPath, 'backup-metadata.json');
      JSON.parse(await fs.readFile(metadataPath, 'utf8')); // Validate metadata format

      // Check if required directories exist
      const requiredDirs = ['database', 'files'];
      for (const dir of requiredDirs) {
        const dirPath = path.join(backupPath, dir);
        try {
          await fs.access(dirPath);
        } catch (error) {
          logger.error(`Backup verification failed: missing ${dir} directory`);
          return false;
        }
      }

      logger.info('Backup verification passed');
      return true;

    } catch (error) {
      logger.error('Backup verification failed:', error);
      return false;
    }
  }

  /**
   * Get backup status and information
   */
  async getBackupStatus() {
    try {
      const entries = await fs.readdir(this.backupDir, { withFileTypes: true });
      const backups = entries
        .filter(entry => entry.isDirectory())
        .map(entry => ({
          name: entry.name,
          path: path.join(this.backupDir, entry.name),
          created: this.parseBackupTimestamp(entry.name),
          type: entry.name.startsWith('weekly') ? 'weekly' : 'daily'
        }))
        .filter(backup => backup.created)
        .sort((a, b) => b.created - a.created);

      const stats = await this.getBackupStats(backups);

      return {
        totalBackups: backups.length,
        lastBackup: backups[0] || null,
        oldestBackup: backups[backups.length - 1] || null,
        backupDir: this.backupDir,
        retentionDays: this.retentionDays,
        scheduleEnabled: this.scheduleEnabled,
        stats
      };

    } catch (error) {
      logger.error('Failed to get backup status:', error);
      return { error: error.message };
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(backups) {
    const stats = {
      totalSize: 0,
      averageSize: 0,
      dailyCount: 0,
      weeklyCount: 0,
      largestBackup: null,
      smallestBackup: null
    };

    for (const backup of backups) {
      try {
        const size = await this.getDirectorySize(backup.path);
        stats.totalSize += size;

        if (backup.type === 'daily') stats.dailyCount++;
        if (backup.type === 'weekly') stats.weeklyCount++;

        if (!stats.largestBackup || size > stats.largestBackup.size) {
          stats.largestBackup = { ...backup, size };
        }

        if (!stats.smallestBackup || size < stats.smallestBackup.size) {
          stats.smallestBackup = { ...backup, size };
        }
      } catch (error) {
        // Skip this backup for stats
      }
    }

    stats.averageSize = stats.totalSize / backups.length || 0;

    return stats;
  }

  /**
   * Get directory size recursively
   */
  async getDirectorySize(dirPath) {
    let totalSize = 0;

    async function calculateSize(currentPath) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          await calculateSize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    }

    await calculateSize(dirPath);
    return totalSize;
  }

  /**
   * Extract database name from URI
   */
  extractDatabaseName(uri) {
    try {
      const url = new URL(uri);
      const dbName = url.pathname.substring(1); // Remove leading slash
      return dbName || 'localpro-super-app';
    } catch (error) {
      return 'localpro-super-app';
    }
  }

  /**
   * Mask sensitive data in strings
   */
  maskSensitiveData(str) {
    if (!str) return str;
    // Mask passwords, keys, etc.
    return str.replace(/([?&])([^=]+)=([^&]*)/g, (match, sep, key, _value) => {
      if (key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('key')) {
        return `${sep}${key}=***masked***`;
      }
      return match;
    });
  }

  /**
   * Manual backup trigger
   */
  async triggerManualBackup(type = 'manual') {
    return await this.performFullBackup(type);
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const entries = await fs.readdir(this.backupDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => ({
          name: entry.name,
          type: entry.name.startsWith('weekly') ? 'weekly' : 'daily',
          created: this.parseBackupTimestamp(entry.name),
          path: path.join(this.backupDir, entry.name)
        }))
        .filter(backup => backup.created)
        .sort((a, b) => b.created - a.created);

    } catch (error) {
      logger.error('Failed to list backups:', error);
      return [];
    }
  }
}

module.exports = new BackupService();
