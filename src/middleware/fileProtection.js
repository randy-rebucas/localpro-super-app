const reminderMemoryService = require('../services/reminderMemoryService');
const { logger } = require('../utils/logger');

/**
 * File Protection Middleware
 * 
 * This middleware monitors file access and modifications to protected files,
 * providing warnings and protection for critical system files.
 */
class FileProtectionMiddleware {
  constructor() {
    this.isInitialized = false;
    this.checkInterval = null;
    this.lastCheckTime = null;
  }

  /**
   * Initialize the file protection system
   */
  async initialize() {
    try {
      await reminderMemoryService.initialize();
      this.isInitialized = true;
      
      // Start periodic file monitoring
      this.startFileMonitoring();
      
      logger.info('File Protection Middleware initialized');
    } catch (error) {
      logger.error('Failed to initialize File Protection Middleware:', error);
      throw error;
    }
  }

  /**
   * Start periodic file monitoring
   */
  startFileMonitoring() {
    // Check for file modifications every 30 seconds
    this.checkInterval = setInterval(async () => {
      try {
        await this.checkProtectedFiles();
      } catch (error) {
        logger.error('Error in file monitoring:', error);
      }
    }, 30000);

    logger.info('File monitoring started (30-second intervals)');
  }

  /**
   * Stop file monitoring
   */
  stopFileMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('File monitoring stopped');
    }
  }

  /**
   * Check protected files for modifications
   */
  async checkProtectedFiles() {
    if (!this.isInitialized) return;

    try {
      const warnings = await reminderMemoryService.checkFileModifications();
      
      if (warnings.length > 0) {
        await this.handleFileModifications(warnings);
      }
      
      this.lastCheckTime = new Date().toISOString();
    } catch (error) {
      logger.error('Error checking protected files:', error);
    }
  }

  /**
   * Handle file modification warnings
   */
  async handleFileModifications(warnings) {
    for (const warning of warnings) {
      // Log the warning
      logger.warn('PROTECTED FILE MODIFIED', {
        file: warning.file,
        category: warning.category,
        importance: warning.importance,
        modificationCount: warning.modificationCount,
        message: warning.message
      });

      // Send notification based on importance
      await this.sendModificationNotification(warning);
    }
  }

  /**
   * Send modification notification
   */
  async sendModificationNotification(warning) {
    const notification = {
      type: 'file_modification',
      severity: warning.importance,
      file: warning.file,
      category: warning.category,
      message: warning.message,
      timestamp: new Date().toISOString()
    };

    // For critical files, send immediate alert
    if (warning.importance === 'critical') {
      logger.error('🚨 CRITICAL FILE MODIFIED - IMMEDIATE ATTENTION REQUIRED', notification);
      
      // You can extend this to send emails, Slack notifications, etc.
      await this.sendCriticalAlert(notification);
    } else if (warning.importance === 'high') {
      logger.warn('⚠️ HIGH IMPORTANCE FILE MODIFIED', notification);
    } else {
      logger.info('📝 Protected file modified', notification);
    }
  }

  /**
   * Send critical alert for high-priority modifications
   */
  async sendCriticalAlert(notification) {
    // This can be extended to send actual alerts
    const alertMessage = `
🚨 CRITICAL FILE MODIFICATION ALERT 🚨

File: ${notification.file}
Category: ${notification.category}
Time: ${notification.timestamp}

${notification.message}

Please review this change immediately as it may affect system security or functionality.
    `;

    logger.error(alertMessage);
    
    // TODO: Implement actual alert mechanisms:
    // - Email notifications
    // - Slack webhooks
    // - SMS alerts
    // - Dashboard notifications
  }

  /**
   * Middleware to check file access during development
   */
  fileAccessMiddleware() {
    return (req, res, next) => {
      // Only apply in development mode
      if (process.env.NODE_ENV !== 'development') {
        return next();
      }

      // Check if the request is trying to access protected files
      const requestedPath = req.path;
      
      if (reminderMemoryService.isProtected(requestedPath)) {
        const protectionInfo = reminderMemoryService.getProtectionInfo(requestedPath);
        
        logger.warn('Access attempt to protected file', {
          path: requestedPath,
          category: protectionInfo.category,
          importance: protectionInfo.importance,
          user: req.user?.id,
          ip: req.ip
        });

        // For critical files, you might want to block access
        if (protectionInfo.importance === 'critical') {
          return res.status(403).json({
            success: false,
            message: 'Access to critical file blocked',
            file: requestedPath,
            reason: 'This file is protected due to its critical nature'
          });
        }
      }

      next();
    };
  }

  /**
   * Get protection status for a file
   */
  getFileProtectionStatus(filePath) {
    if (!reminderMemoryService.isProtected(filePath)) {
      return {
        protected: false,
        message: 'File is not protected'
      };
    }

    const info = reminderMemoryService.getProtectionInfo(filePath);
    return {
      protected: true,
      category: info.category,
      importance: info.importance,
      description: info.description,
      modificationCount: info.modificationCount,
      lastModified: info.lastModified,
      lastWarning: info.lastWarning
    };
  }

  /**
   * Get all protection statistics
   */
  getProtectionStats() {
    return reminderMemoryService.getMemoryStats();
  }

  /**
   * Add file to protection
   */
  async addFileProtection(filePath, options = {}) {
    return await reminderMemoryService.addProtectedFile(filePath, options);
  }

  /**
   * Remove file from protection
   */
  async removeFileProtection(filePath) {
    return await reminderMemoryService.removeProtectedFile(filePath);
  }

  /**
   * Get recently modified protected files
   */
  getRecentlyModifiedFiles() {
    const stats = reminderMemoryService.getMemoryStats();
    return stats.recentlyModified;
  }

  /**
   * Get most frequently modified files
   */
  getMostModifiedFiles() {
    const stats = reminderMemoryService.getMemoryStats();
    return stats.mostModified;
  }

  /**
   * Create backup reminder for critical files
   */
  async createBackupReminder() {
    return await reminderMemoryService.createBackupReminder();
  }
}

// Create singleton instance
const fileProtectionMiddleware = new FileProtectionMiddleware();

module.exports = fileProtectionMiddleware;
