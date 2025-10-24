const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Reminder Memory Service
 * 
 * This service provides file protection and reminder functionality for critical
 * modules in the LocalPro Super App. It tracks secure files and warns when
 * attempts are made to modify them.
 */
class ReminderMemoryService {
  constructor() {
    this.protectedFiles = new Map();
    this.memoryFile = path.join(__dirname, '../../.reminder-memory.json');
    this.isInitialized = false;
  }

  /**
   * Initialize the reminder memory system
   */
  async initialize() {
    try {
      await this.loadMemory();
      await this.identifySecureFiles();
      this.isInitialized = true;
      logger.info('Reminder Memory Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Reminder Memory Service:', error);
      throw error;
    }
  }

  /**
   * Load existing memory from file
   */
  async loadMemory() {
    try {
      const data = await fs.readFile(this.memoryFile, 'utf8');
      const memory = JSON.parse(data);
      
      // Restore protected files from memory
      if (memory.protectedFiles) {
        for (const [filePath, info] of Object.entries(memory.protectedFiles)) {
          this.protectedFiles.set(filePath, info);
        }
      }
      
      logger.info(`Loaded ${this.protectedFiles.size} protected files from memory`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error('Error loading reminder memory:', error);
        throw error;
      }
      // File doesn't exist, start fresh
      logger.info('No existing memory file found, starting fresh');
    }
  }

  /**
   * Save memory to file
   */
  async saveMemory() {
    try {
      const memory = {
        protectedFiles: Object.fromEntries(this.protectedFiles),
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      };
      
      await fs.writeFile(this.memoryFile, JSON.stringify(memory, null, 2));
      logger.info('Reminder memory saved successfully');
    } catch (error) {
      logger.error('Error saving reminder memory:', error);
      throw error;
    }
  }

  /**
   * Identify and catalog secure files in the project
   */
  async identifySecureFiles() {
    const secureFiles = [
      // Authentication & Security
      {
        path: 'src/middleware/auth.js',
        category: 'authentication',
        importance: 'critical',
        description: 'Core authentication middleware with JWT verification',
        lastModified: await this.getFileModificationTime('src/middleware/auth.js')
      },
      {
        path: 'src/middleware/auditLogger.js',
        category: 'security',
        importance: 'critical',
        description: 'Audit logging system for compliance and security',
        lastModified: await this.getFileModificationTime('src/middleware/auditLogger.js')
      },
      {
        path: 'src/middleware/authorize.js',
        category: 'security',
        importance: 'critical',
        description: 'Role-based authorization middleware',
        lastModified: await this.getFileModificationTime('src/middleware/authorize.js')
      },
      
      // Database Models (Core)
      {
        path: 'src/models/User.js',
        category: 'database',
        importance: 'critical',
        description: 'User model with authentication, roles, and trust system',
        lastModified: await this.getFileModificationTime('src/models/User.js')
      },
      {
        path: 'src/models/AppSettings.js',
        category: 'database',
        importance: 'critical',
        description: 'Global application settings and configuration',
        lastModified: await this.getFileModificationTime('src/models/AppSettings.js')
      },
      {
        path: 'src/models/UserSettings.js',
        category: 'database',
        importance: 'high',
        description: 'User preferences and settings',
        lastModified: await this.getFileModificationTime('src/models/UserSettings.js')
      },
      
      // Payment Systems
      {
        path: 'src/controllers/paypalController.js',
        category: 'payment',
        importance: 'critical',
        description: 'PayPal payment processing controller',
        lastModified: await this.getFileModificationTime('src/controllers/paypalController.js')
      },
      {
        path: 'src/controllers/paymayaController.js',
        category: 'payment',
        importance: 'critical',
        description: 'PayMaya payment processing controller',
        lastModified: await this.getFileModificationTime('src/controllers/paymayaController.js')
      },
      {
        path: 'src/services/paypalService.js',
        category: 'payment',
        importance: 'critical',
        description: 'PayPal service integration',
        lastModified: await this.getFileModificationTime('src/services/paypalService.js')
      },
      
      // Database Configuration
      {
        path: 'src/config/database.js',
        category: 'database',
        importance: 'critical',
        description: 'Database connection configuration',
        lastModified: await this.getFileModificationTime('src/config/database.js')
      },
      
      // Core Controllers
      {
        path: 'src/controllers/authController.js',
        category: 'authentication',
        importance: 'critical',
        description: 'Authentication controller with phone verification',
        lastModified: await this.getFileModificationTime('src/controllers/authController.js')
      },
      {
        path: 'src/controllers/userManagementController.js',
        category: 'user_management',
        importance: 'critical',
        description: 'User management and profile operations',
        lastModified: await this.getFileModificationTime('src/controllers/userManagementController.js')
      },
      
      // Financial Models
      {
        path: 'src/models/Finance.js',
        category: 'financial',
        importance: 'critical',
        description: 'Financial transactions and loan management',
        lastModified: await this.getFileModificationTime('src/models/Finance.js')
      },
      {
        path: 'src/models/LocalProPlus.js',
        category: 'subscription',
        importance: 'critical',
        description: 'LocalPro Plus subscription system',
        lastModified: await this.getFileModificationTime('src/models/LocalProPlus.js')
      },
      
      // Trust & Verification
      {
        path: 'src/models/TrustVerification.js',
        category: 'security',
        importance: 'high',
        description: 'Trust verification and user credibility system',
        lastModified: await this.getFileModificationTime('src/models/TrustVerification.js')
      },
      
      // Environment Configuration
      {
        path: '.env',
        category: 'configuration',
        importance: 'critical',
        description: 'Environment variables and secrets',
        lastModified: await this.getFileModificationTime('.env')
      },
      {
        path: 'env.example',
        category: 'configuration',
        importance: 'high',
        description: 'Environment variables template',
        lastModified: await this.getFileModificationTime('env.example')
      }
    ];

    // Add files to protected list
    for (const file of secureFiles) {
      if (file.lastModified) {
        this.protectedFiles.set(file.path, {
          ...file,
          addedToMemory: new Date().toISOString(),
          modificationCount: 0,
          lastWarning: null
        });
      }
    }

    await this.saveMemory();
    logger.info(`Identified ${this.protectedFiles.size} secure files for protection`);
  }

  /**
   * Get file modification time
   */
  async getFileModificationTime(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.mtime.toISOString();
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a file is protected
   */
  isProtected(filePath) {
    return this.protectedFiles.has(filePath);
  }

  /**
   * Get protection information for a file
   */
  getProtectionInfo(filePath) {
    return this.protectedFiles.get(filePath);
  }

  /**
   * Add a file to protection
   */
  async addProtectedFile(filePath, options = {}) {
    const protectionInfo = {
      path: filePath,
      category: options.category || 'general',
      importance: options.importance || 'medium',
      description: options.description || 'Protected file',
      lastModified: await this.getFileModificationTime(filePath),
      addedToMemory: new Date().toISOString(),
      modificationCount: 0,
      lastWarning: null
    };

    this.protectedFiles.set(filePath, protectionInfo);
    await this.saveMemory();
    
    logger.info(`Added file to protection: ${filePath}`);
    return protectionInfo;
  }

  /**
   * Remove a file from protection
   */
  async removeProtectedFile(filePath) {
    const removed = this.protectedFiles.delete(filePath);
    if (removed) {
      await this.saveMemory();
      logger.info(`Removed file from protection: ${filePath}`);
    }
    return removed;
  }

  /**
   * Check for file modifications and warn if needed
   */
  async checkFileModifications() {
    const warnings = [];
    
    for (const [filePath, info] of this.protectedFiles) {
      try {
        const currentModTime = await this.getFileModificationTime(filePath);
        
        if (currentModTime && currentModTime !== info.lastModified) {
          // File has been modified
          info.modificationCount++;
          info.lastModified = currentModTime;
          info.lastWarning = new Date().toISOString();
          
          const warning = {
            file: filePath,
            category: info.category,
            importance: info.importance,
            description: info.description,
            modificationCount: info.modificationCount,
            lastModified: currentModTime,
            message: this.generateWarningMessage(info)
          };
          
          warnings.push(warning);
          logger.warn(`Protected file modified: ${filePath}`, warning);
        }
      } catch (error) {
        logger.error(`Error checking file ${filePath}:`, error);
      }
    }

    if (warnings.length > 0) {
      await this.saveMemory();
    }

    return warnings;
  }

  /**
   * Generate warning message for file modification
   */
  generateWarningMessage(info) {
    const importanceEmoji = {
      'critical': '🚨',
      'high': '⚠️',
      'medium': 'ℹ️',
      'low': '📝'
    };

    const emoji = importanceEmoji[info.importance] || '📝';
    
    return `${emoji} SECURE FILE MODIFIED: ${info.description}\n` +
           `Category: ${info.category}\n` +
           `Importance: ${info.importance.toUpperCase()}\n` +
           `Modifications: ${info.modificationCount}\n` +
           `This file contains critical functionality. Please review changes carefully.`;
  }

  /**
   * Get all protected files
   */
  getAllProtectedFiles() {
    return Array.from(this.protectedFiles.values());
  }

  /**
   * Get protected files by category
   */
  getProtectedFilesByCategory(category) {
    return Array.from(this.protectedFiles.values())
      .filter(file => file.category === category);
  }

  /**
   * Get protected files by importance
   */
  getProtectedFilesByImportance(importance) {
    return Array.from(this.protectedFiles.values())
      .filter(file => file.importance === importance);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    const stats = {
      totalProtectedFiles: this.protectedFiles.size,
      byCategory: {},
      byImportance: {},
      recentlyModified: [],
      mostModified: []
    };

    for (const file of this.protectedFiles.values()) {
      // Count by category
      stats.byCategory[file.category] = (stats.byCategory[file.category] || 0) + 1;
      
      // Count by importance
      stats.byImportance[file.importance] = (stats.byImportance[file.importance] || 0) + 1;
      
      // Track recently modified
      if (file.lastWarning) {
        stats.recentlyModified.push({
          file: file.path,
          lastWarning: file.lastWarning,
          modificationCount: file.modificationCount
        });
      }
      
      // Track most modified
      if (file.modificationCount > 0) {
        stats.mostModified.push({
          file: file.path,
          modificationCount: file.modificationCount,
          lastModified: file.lastModified
        });
      }
    }

    // Sort by modification count
    stats.mostModified.sort((a, b) => b.modificationCount - a.modificationCount);
    stats.recentlyModified.sort((a, b) => new Date(b.lastWarning) - new Date(a.lastWarning));

    return stats;
  }

  /**
   * Create a backup reminder for critical files
   */
  async createBackupReminder() {
    const criticalFiles = this.getProtectedFilesByImportance('critical');
    const reminder = {
      timestamp: new Date().toISOString(),
      message: 'CRITICAL FILES BACKUP REMINDER',
      files: criticalFiles.map(file => ({
        path: file.path,
        description: file.description,
        lastModified: file.lastModified
      })),
      action: 'Consider creating backups of these critical files before making changes'
    };

    logger.warn('BACKUP REMINDER:', reminder);
    return reminder;
  }
}

module.exports = new ReminderMemoryService();
