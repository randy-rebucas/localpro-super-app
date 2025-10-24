#!/usr/bin/env node

/**
 * Setup Reminder Memory System
 * 
 * This script initializes the reminder memory system for the LocalPro Super App
 * and sets up file protection for critical modules.
 */

const fs = require('fs').promises;
const path = require('path');
const reminderMemoryService = require('./src/services/reminderMemoryService');
const fileProtectionMiddleware = require('./src/middleware/fileProtection');

class ReminderMemorySetup {
  constructor() {
    this.setupStartTime = Date.now();
  }

  async run() {
    console.log('🔧 Setting up Reminder Memory System for LocalPro Super App');
    console.log('==========================================================');
    
    try {
      await this.checkPrerequisites();
      await this.initializeServices();
      await this.identifySecureFiles();
      await this.createMemoryFile();
      await this.setupFileMonitoring();
      await this.generateReport();
      
      const duration = Date.now() - this.setupStartTime;
      console.log(`\n✅ Reminder Memory System setup completed in ${duration}ms`);
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('\n📋 Checking prerequisites...');
    
    // Check if required directories exist
    const requiredDirs = [
      'src/services',
      'src/middleware',
      'src/utils',
      'src/models',
      'src/controllers'
    ];

    for (const dir of requiredDirs) {
      try {
        await fs.access(dir);
        console.log(`  ✅ ${dir} exists`);
      } catch (error) {
        console.log(`  ❌ ${dir} missing`);
        throw new Error(`Required directory missing: ${dir}`);
      }
    }

    // Check if critical files exist
    const criticalFiles = [
      'src/middleware/auth.js',
      'src/models/User.js',
      'src/config/database.js'
    ];

    for (const file of criticalFiles) {
      try {
        await fs.access(file);
        console.log(`  ✅ ${file} exists`);
      } catch (error) {
        console.log(`  ⚠️ ${file} missing (will be added when created)`);
      }
    }

    console.log('  ✅ Prerequisites check completed');
  }

  async initializeServices() {
    console.log('\n🔧 Initializing services...');
    
    try {
      await reminderMemoryService.initialize();
      console.log('  ✅ Reminder Memory Service initialized');
      
      await fileProtectionMiddleware.initialize();
      console.log('  ✅ File Protection Middleware initialized');
      
    } catch (error) {
      console.log('  ❌ Service initialization failed:', error.message);
      throw error;
    }
  }

  async identifySecureFiles() {
    console.log('\n🔍 Identifying secure files...');
    
    const secureFiles = [
      // Authentication & Security
      { path: 'src/middleware/auth.js', category: 'authentication', importance: 'critical' },
      { path: 'src/middleware/auditLogger.js', category: 'security', importance: 'critical' },
      { path: 'src/middleware/authorize.js', category: 'security', importance: 'critical' },
      { path: 'src/controllers/authController.js', category: 'authentication', importance: 'critical' },
      
      // Payment Systems
      { path: 'src/controllers/paypalController.js', category: 'payment', importance: 'critical' },
      { path: 'src/controllers/paymayaController.js', category: 'payment', importance: 'critical' },
      { path: 'src/services/paypalService.js', category: 'payment', importance: 'critical' },
      { path: 'src/models/Finance.js', category: 'financial', importance: 'critical' },
      { path: 'src/models/LocalProPlus.js', category: 'subscription', importance: 'critical' },
      
      // Database Models
      { path: 'src/models/User.js', category: 'database', importance: 'critical' },
      { path: 'src/models/AppSettings.js', category: 'database', importance: 'critical' },
      { path: 'src/models/UserSettings.js', category: 'database', importance: 'high' },
      
      // Configuration
      { path: 'src/config/database.js', category: 'database', importance: 'critical' },
      { path: '.env', category: 'configuration', importance: 'critical' },
      { path: 'env.example', category: 'configuration', importance: 'high' },
      
      // Trust & Verification
      { path: 'src/models/TrustVerification.js', category: 'security', importance: 'high' },
      { path: 'src/controllers/trustVerificationController.js', category: 'security', importance: 'high' }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const file of secureFiles) {
      try {
        await fs.access(file.path);
        
        await reminderMemoryService.addProtectedFile(file.path, {
          category: file.category,
          importance: file.importance,
          description: this.getFileDescription(file.path, file.category)
        });
        
        console.log(`  ✅ Added: ${file.path} (${file.importance})`);
        addedCount++;
        
      } catch (error) {
        console.log(`  ⏭️ Skipped: ${file.path} (file doesn't exist yet)`);
        skippedCount++;
      }
    }

    console.log(`  📊 Added ${addedCount} files, skipped ${skippedCount} files`);
  }

  getFileDescription(filePath, category) {
    const descriptions = {
      'src/middleware/auth.js': 'Core authentication middleware with JWT verification',
      'src/middleware/auditLogger.js': 'Audit logging system for compliance and security',
      'src/middleware/authorize.js': 'Role-based authorization middleware',
      'src/controllers/authController.js': 'Authentication controller with phone verification',
      'src/controllers/paypalController.js': 'PayPal payment processing controller',
      'src/controllers/paymayaController.js': 'PayMaya payment processing controller',
      'src/services/paypalService.js': 'PayPal service integration',
      'src/models/User.js': 'User model with authentication, roles, and trust system',
      'src/models/Finance.js': 'Financial transactions and loan management',
      'src/models/LocalProPlus.js': 'LocalPro Plus subscription system',
      'src/models/AppSettings.js': 'Global application settings and configuration',
      'src/models/UserSettings.js': 'User preferences and settings',
      'src/config/database.js': 'Database connection configuration',
      'src/models/TrustVerification.js': 'Trust verification and user credibility system',
      '.env': 'Environment variables and secrets',
      'env.example': 'Environment variables template'
    };

    return descriptions[filePath] || `${category} related file`;
  }

  async createMemoryFile() {
    console.log('\n💾 Creating memory file...');
    
    try {
      await reminderMemoryService.saveMemory();
      console.log('  ✅ Memory file created successfully');
    } catch (error) {
      console.log('  ❌ Failed to create memory file:', error.message);
      throw error;
    }
  }

  async setupFileMonitoring() {
    console.log('\n👁️ Setting up file monitoring...');
    
    try {
      // File monitoring is already started in the middleware initialization
      console.log('  ✅ File monitoring is active');
      console.log('  📊 Monitoring interval: 30 seconds');
    } catch (error) {
      console.log('  ❌ Failed to setup file monitoring:', error.message);
      throw error;
    }
  }

  async generateReport() {
    console.log('\n📊 Generating setup report...');
    
    try {
      const stats = reminderMemoryService.getMemoryStats();
      
      console.log('\n📋 Setup Report');
      console.log('===============');
      console.log(`Total Protected Files: ${stats.totalProtectedFiles}`);
      console.log(`Setup Time: ${Date.now() - this.setupStartTime}ms`);
      console.log('');
      
      console.log('Files by Category:');
      for (const [category, count] of Object.entries(stats.byCategory)) {
        console.log(`  ${category}: ${count} files`);
      }
      console.log('');
      
      console.log('Files by Importance:');
      for (const [importance, count] of Object.entries(stats.byImportance)) {
        const emoji = this.getImportanceEmoji(importance);
        console.log(`  ${emoji} ${importance}: ${count} files`);
      }
      console.log('');
      
      console.log('🔧 Next Steps:');
      console.log('1. The system is now monitoring your protected files');
      console.log('2. Use "node src/utils/reminderMemoryCLI.js status" to check system status');
      console.log('3. Use "node src/utils/reminderMemoryCLI.js check" to check for modifications');
      console.log('4. Use "node src/utils/reminderMemoryCLI.js help" for more commands');
      
    } catch (error) {
      console.log('  ❌ Failed to generate report:', error.message);
      throw error;
    }
  }

  getImportanceEmoji(importance) {
    const emojis = {
      'critical': '🚨',
      'high': '⚠️',
      'medium': 'ℹ️',
      'low': '📝'
    };
    return emojis[importance] || '📝';
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new ReminderMemorySetup();
  setup.run().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = ReminderMemorySetup;
