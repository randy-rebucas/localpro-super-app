#!/usr/bin/env node

const reminderMemoryService = require('../services/reminderMemoryService');
const fileProtectionMiddleware = require('../middleware/fileProtection');
const { logger } = require('./logger');

/**
 * Reminder Memory CLI Tool
 * 
 * Command-line interface for managing the reminder memory system
 */
class ReminderMemoryCLI {
  constructor() {
    this.commands = {
      'init': this.initializeSystem,
      'status': this.showStatus,
      'list': this.listProtectedFiles,
      'add': this.addProtectedFile,
      'remove': this.removeProtectedFile,
      'check': this.checkModifications,
      'stats': this.showStats,
      'backup': this.createBackupReminder,
      'help': this.showHelp
    };
  }

  /**
   * Main CLI entry point
   */
  async run(args) {
    const command = args[0] || 'help';
    const commandArgs = args.slice(1);

    try {
      if (this.commands[command]) {
        await this.commands[command](commandArgs);
      } else {
        console.log(`❌ Unknown command: ${command}`);
        this.showHelp();
      }
    } catch (error) {
      console.error(`❌ Error executing command: ${error.message}`);
      logger.error('CLI Error:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize the reminder memory system
   */
  async initializeSystem(args) {
    console.log('🔧 Initializing Reminder Memory System...');
    
    try {
      await reminderMemoryService.initialize();
      await fileProtectionMiddleware.initialize();
      
      console.log('✅ Reminder Memory System initialized successfully');
      console.log(`📁 Protected files: ${reminderMemoryService.getAllProtectedFiles().length}`);
    } catch (error) {
      console.error('❌ Failed to initialize system:', error.message);
      throw error;
    }
  }

  /**
   * Show system status
   */
  async showStatus(args) {
    console.log('📊 Reminder Memory System Status');
    console.log('================================');
    
    try {
      // Initialize the service first
      await reminderMemoryService.initialize();
      const stats = reminderMemoryService.getMemoryStats();
      
      console.log(`📁 Total Protected Files: ${stats.totalProtectedFiles}`);
      console.log(`📅 Last Check: ${fileProtectionMiddleware.lastCheckTime || 'Never'}`);
      console.log('');
      
      console.log('📊 By Category:');
      for (const [category, count] of Object.entries(stats.byCategory)) {
        console.log(`  ${category}: ${count} files`);
      }
      console.log('');
      
      console.log('⚠️ By Importance:');
      for (const [importance, count] of Object.entries(stats.byImportance)) {
        const emoji = ReminderMemoryCLI.getImportanceEmoji(importance);
        console.log(`  ${emoji} ${importance}: ${count} files`);
      }
      console.log('');
      
      if (stats.recentlyModified.length > 0) {
        console.log('🔄 Recently Modified:');
        stats.recentlyModified.slice(0, 5).forEach(file => {
          console.log(`  ${file.file} (${file.modificationCount} times)`);
        });
      }
      
      if (stats.mostModified.length > 0) {
        console.log('📈 Most Modified:');
        stats.mostModified.slice(0, 5).forEach(file => {
          console.log(`  ${file.file} (${file.modificationCount} times)`);
        });
      }
    } catch (error) {
      console.error('❌ Error getting status:', error.message);
      throw error;
    }
  }

  /**
   * List all protected files
   */
  async listProtectedFiles(args) {
    const category = args[0];
    const importance = args[1];
    
    console.log('📁 Protected Files');
    console.log('==================');
    
    try {
      // Initialize the service first
      await reminderMemoryService.initialize();
      let files = reminderMemoryService.getAllProtectedFiles();
      
      if (category) {
        files = files.filter(file => file.category === category);
        console.log(`Filtered by category: ${category}`);
      }
      
      if (importance) {
        files = files.filter(file => file.importance === importance);
        console.log(`Filtered by importance: ${importance}`);
      }
      
      if (files.length === 0) {
        console.log('No protected files found');
        return;
      }
      
      files.forEach(file => {
        const emoji = ReminderMemoryCLI.getImportanceEmoji(file.importance);
        const modified = file.modificationCount > 0 ? ` (${file.modificationCount} modifications)` : '';
        console.log(`${emoji} ${file.path}`);
        console.log(`   Category: ${file.category}`);
        console.log(`   Description: ${file.description}`);
        console.log(`   Added: ${new Date(file.addedToMemory).toLocaleDateString()}${modified}`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error listing files:', error.message);
      throw error;
    }
  }

  /**
   * Add a file to protection
   */
  async addProtectedFile(args) {
    if (args.length < 1) {
      console.log('❌ Usage: add <file-path> [category] [importance] [description]');
      return;
    }
    
    const filePath = args[0];
    const category = args[1] || 'general';
    const importance = args[2] || 'medium';
    const description = args.slice(3).join(' ') || 'Protected file';
    
    console.log(`➕ Adding file to protection: ${filePath}`);
    
    try {
      const protectionInfo = await reminderMemoryService.addProtectedFile(filePath, {
        category,
        importance,
        description
      });
      
      console.log('✅ File added to protection successfully');
      console.log(`   Category: ${protectionInfo.category}`);
      console.log(`   Importance: ${protectionInfo.importance}`);
      console.log(`   Description: ${protectionInfo.description}`);
    } catch (error) {
      console.error('❌ Error adding file to protection:', error.message);
      throw error;
    }
  }

  /**
   * Remove a file from protection
   */
  async removeProtectedFile(args) {
    if (args.length < 1) {
      console.log('❌ Usage: remove <file-path>');
      return;
    }
    
    const filePath = args[0];
    console.log(`➖ Removing file from protection: ${filePath}`);
    
    try {
      const removed = await reminderMemoryService.removeProtectedFile(filePath);
      
      if (removed) {
        console.log('✅ File removed from protection successfully');
      } else {
        console.log('⚠️ File was not in protection list');
      }
    } catch (error) {
      console.error('❌ Error removing file from protection:', error.message);
      throw error;
    }
  }

  /**
   * Check for file modifications
   */
  async checkModifications(args) {
    console.log('🔍 Checking for file modifications...');
    
    try {
      await reminderMemoryService.initialize();
      const warnings = await reminderMemoryService.checkFileModifications();
      
      if (warnings.length === 0) {
        console.log('✅ No modifications detected');
      } else {
        console.log(`⚠️ Found ${warnings.length} modified files:`);
        console.log('');
        
        warnings.forEach(warning => {
          const emoji = ReminderMemoryCLI.getImportanceEmoji(warning.importance);
          console.log(`${emoji} ${warning.file}`);
          console.log(`   Category: ${warning.category}`);
          console.log(`   Modifications: ${warning.modificationCount}`);
          console.log(`   Message: ${warning.message}`);
          console.log('');
        });
      }
    } catch (error) {
      console.error('❌ Error checking modifications:', error.message);
      throw error;
    }
  }

  /**
   * Show detailed statistics
   */
  async showStats(args) {
    console.log('📊 Detailed Statistics');
    console.log('======================');
    
    try {
      const stats = reminderMemoryService.getMemoryStats();
      
      console.log(`📁 Total Protected Files: ${stats.totalProtectedFiles}`);
      console.log('');
      
      console.log('📊 Files by Category:');
      for (const [category, count] of Object.entries(stats.byCategory)) {
        const percentage = ((count / stats.totalProtectedFiles) * 100).toFixed(1);
        console.log(`  ${category}: ${count} files (${percentage}%)`);
      }
      console.log('');
      
      console.log('⚠️ Files by Importance:');
      for (const [importance, count] of Object.entries(stats.byImportance)) {
        const emoji = ReminderMemoryCLI.getImportanceEmoji(importance);
        const percentage = ((count / stats.totalProtectedFiles) * 100).toFixed(1);
        console.log(`  ${emoji} ${importance}: ${count} files (${percentage}%)`);
      }
      console.log('');
      
      if (stats.recentlyModified.length > 0) {
        console.log('🔄 Recently Modified Files:');
        stats.recentlyModified.forEach(file => {
          const date = new Date(file.lastWarning).toLocaleString();
          console.log(`  ${file.file} - ${date} (${file.modificationCount} times)`);
        });
        console.log('');
      }
      
      if (stats.mostModified.length > 0) {
        console.log('📈 Most Frequently Modified:');
        stats.mostModified.forEach(file => {
          const date = new Date(file.lastModified).toLocaleString();
          console.log(`  ${file.file} - ${file.modificationCount} times (last: ${date})`);
        });
      }
    } catch (error) {
      console.error('❌ Error getting statistics:', error.message);
      throw error;
    }
  }

  /**
   * Create backup reminder
   */
  async createBackupReminder(args) {
    console.log('💾 Creating backup reminder for critical files...');
    
    try {
      const reminder = await reminderMemoryService.createBackupReminder();
      
      console.log('📋 BACKUP REMINDER');
      console.log('==================');
      console.log(`Time: ${reminder.timestamp}`);
      console.log(`Message: ${reminder.message}`);
      console.log('');
      console.log('Critical files:');
      reminder.files.forEach(file => {
        const date = new Date(file.lastModified).toLocaleString();
        console.log(`  ${file.path} - ${file.description} (${date})`);
      });
      console.log('');
      console.log(`Action: ${reminder.action}`);
    } catch (error) {
      console.error('❌ Error creating backup reminder:', error.message);
      throw error;
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('🔧 Reminder Memory CLI Tool');
    console.log('============================');
    console.log('');
    console.log('Usage: node src/utils/reminderMemoryCLI.js <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  init                    Initialize the reminder memory system');
    console.log('  status                  Show system status');
    console.log('  list [category] [importance]  List protected files');
    console.log('  add <file> [category] [importance] [description]  Add file to protection');
    console.log('  remove <file>          Remove file from protection');
    console.log('  check                   Check for file modifications');
    console.log('  stats                   Show detailed statistics');
    console.log('  backup                  Create backup reminder');
    console.log('  help                    Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node src/utils/reminderMemoryCLI.js init');
    console.log('  node src/utils/reminderMemoryCLI.js list');
    console.log('  node src/utils/reminderMemoryCLI.js list authentication critical');
    console.log('  node src/utils/reminderMemoryCLI.js add src/config/secrets.js security critical "Secret configuration"');
    console.log('  node src/utils/reminderMemoryCLI.js check');
    console.log('  node src/utils/reminderMemoryCLI.js stats');
  }

  /**
   * Get emoji for importance level
   */
  static getImportanceEmoji(importance) {
    const emojis = {
      'critical': '🚨',
      'high': '⚠️',
      'medium': 'ℹ️',
      'low': '📝'
    };
    return emojis[importance] || '📝';
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new ReminderMemoryCLI();
  cli.run(process.argv.slice(2));
}

module.exports = ReminderMemoryCLI;
