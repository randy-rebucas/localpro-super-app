#!/usr/bin/env node

/**
 * LocalPro Super App Database Reset Script
 * This script resets/cleans the database before running setup
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../src/models/User');
const AppSettings = require('../src/models/AppSettings');
const UserSettings = require('../src/models/UserSettings');
const Agency = require('../src/models/Agency');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class DatabaseReset {
  constructor() {
    this.resetResults = {
      database: false,
      collections: [],
      errors: []
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logStep(step, message) {
    this.log(`\n${colors.cyan}[${step}]${colors.reset} ${message}`);
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, 'green');
  }

  logError(message) {
    this.log(`❌ ${message}`, 'red');
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  logInfo(message) {
    this.log(`ℹ️  ${message}`, 'cyan');
  }

  async connectDatabase() {
    this.logStep('DATABASE', 'Connecting to MongoDB...');
    
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app';
      await mongoose.connect(mongoUri);
      this.logSuccess('Database connected successfully');
      this.resetResults.database = true;
      return true;
    } catch (error) {
      this.logError(`Database connection failed: ${error.message}`);
      this.logInfo('Please ensure MongoDB is running and accessible');
      return false;
    }
  }

  async checkExistingData() {
    this.logStep('DATA CHECK', 'Checking for existing data...');
    
    try {
      const userCount = await User.countDocuments();
      const settingsCount = await AppSettings.countDocuments();
      const agencyCount = await Agency.countDocuments();
      const userSettingsCount = await UserSettings.countDocuments();

      this.logInfo(`Found existing data:`);
      this.log(`   - Users: ${userCount}`, 'cyan');
      this.log(`   - App Settings: ${settingsCount}`, 'cyan');
      this.log(`   - Agencies: ${agencyCount}`, 'cyan');
      this.log(`   - User Settings: ${userSettingsCount}`, 'cyan');

      const totalRecords = userCount + settingsCount + agencyCount + userSettingsCount;
      
      if (totalRecords > 0) {
        this.logWarning(`Total existing records: ${totalRecords}`);
        return { hasData: true, counts: { userCount, settingsCount, agencyCount, userSettingsCount } };
      } else {
        this.logInfo('Database is already clean');
        return { hasData: false, counts: { userCount, settingsCount, agencyCount, userSettingsCount } };
      }
    } catch (error) {
      this.logError(`Error checking existing data: ${error.message}`);
      return { hasData: false, error: error.message };
    }
  }

  async resetDatabase() {
    this.logStep('DATABASE RESET', 'Resetting database...');
    
    try {
      // Get all collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      if (collections.length === 0) {
        this.logInfo('No collections found to drop');
        return true;
      }

      this.logInfo(`Found ${collections.length} collections to drop:`);
      collections.forEach(collection => {
        this.log(`   - ${collection.name}`, 'cyan');
      });

      // Drop all collections
      for (const collection of collections) {
        try {
          await mongoose.connection.db.collection(collection.name).drop();
          this.logSuccess(`Dropped collection: ${collection.name}`);
          this.resetResults.collections.push(collection.name);
        } catch (error) {
          this.logError(`Failed to drop collection ${collection.name}: ${error.message}`);
          this.resetResults.errors.push({ collection: collection.name, error: error.message });
        }
      }

      this.logSuccess(`Successfully dropped ${this.resetResults.collections.length} collections`);
      return true;
    } catch (error) {
      this.logError(`Database reset failed: ${error.message}`);
      this.resetResults.errors.push({ error: error.message });
      return false;
    }
  }

  async verifyReset() {
    this.logStep('VERIFICATION', 'Verifying database reset...');
    
    try {
      const userCount = await User.countDocuments();
      const settingsCount = await AppSettings.countDocuments();
      const agencyCount = await Agency.countDocuments();
      const userSettingsCount = await UserSettings.countDocuments();

      const totalRecords = userCount + settingsCount + agencyCount + userSettingsCount;
      
      if (totalRecords === 0) {
        this.logSuccess('Database reset verified - no records found');
        return true;
      } else {
        this.logWarning(`Database reset incomplete - ${totalRecords} records still exist`);
        this.log(`   - Users: ${userCount}`, 'cyan');
        this.log(`   - App Settings: ${settingsCount}`, 'cyan');
        this.log(`   - Agencies: ${agencyCount}`, 'cyan');
        this.log(`   - User Settings: ${userSettingsCount}`, 'cyan');
        return false;
      }
    } catch (error) {
      this.logError(`Verification failed: ${error.message}`);
      return false;
    }
  }

  generateReport() {
    this.log(`\n${colors.bright}${colors.blue}📊 Database Reset Report${colors.reset}`, 'blue');
    this.log(`${colors.blue}==========================${colors.reset}`, 'blue');
    
    this.log(`\n${colors.bright}Reset Status:${colors.reset}`, 'yellow');
    if (this.resetResults.database && this.resetResults.collections.length > 0) {
      this.log(`✅ Database reset completed successfully`, 'green');
    } else if (this.resetResults.database) {
      this.log(`⚠️  Database connected but no collections were dropped`, 'yellow');
    } else {
      this.log(`❌ Database reset failed`, 'red');
    }

    this.log(`\n${colors.bright}Collections Dropped:${colors.reset}`, 'yellow');
    if (this.resetResults.collections.length > 0) {
      this.resetResults.collections.forEach(collection => {
        this.log(`✅ ${collection}`, 'green');
      });
    } else {
      this.log(`No collections were dropped`, 'cyan');
    }

    if (this.resetResults.errors.length > 0) {
      this.log(`\n${colors.bright}Errors:${colors.reset}`, 'yellow');
      this.resetResults.errors.forEach(error => {
        this.log(`❌ ${error.collection || 'General'}: ${error.error}`, 'red');
      });
    }

    return {
      success: this.resetResults.database && this.resetResults.collections.length > 0,
      collectionsDropped: this.resetResults.collections.length,
      errors: this.resetResults.errors.length
    };
  }

  async run() {
    this.log(`${colors.bright}${colors.blue}🗑️  LocalPro Super App Database Reset${colors.reset}`, 'blue');
    this.log(`${colors.blue}====================================${colors.reset}`, 'blue');
    this.log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'cyan');
    this.log(`Database: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app'}`, 'cyan');

    try {
      // Step 1: Connect to database
      const dbConnected = await this.connectDatabase();
      if (!dbConnected) {
        throw new Error('Database connection failed');
      }

      // Step 2: Check existing data
      const dataCheck = await this.checkExistingData();
      if (!dataCheck.hasData) {
        this.logInfo('Database is already clean, no reset needed');
        return true;
      }

      // Step 3: Reset database
      const resetSuccess = await this.resetDatabase();
      if (!resetSuccess) {
        throw new Error('Database reset failed');
      }

      // Step 4: Verify reset
      const verifySuccess = await this.verifyReset();
      if (!verifySuccess) {
        this.logWarning('Database reset verification failed, but reset may have completed');
      }

      // Step 5: Generate report
      const report = this.generateReport();

      // Final success message
      if (report.success) {
        this.log(`\n${colors.bright}${colors.green}🎉 Database Reset Completed Successfully!${colors.reset}`, 'green');
        this.log(`${colors.green}====================================${colors.reset}`, 'green');
        this.log(`Collections dropped: ${report.collectionsDropped}`, 'cyan');
        this.log(`Errors: ${report.errors}`, 'cyan');
      } else {
        this.log(`\n${colors.bright}${colors.yellow}⚠️  Database Reset Completed with Issues${colors.reset}`, 'yellow');
        this.log(`${colors.yellow}====================================${colors.reset}`, 'yellow');
        this.log(`Collections dropped: ${report.collectionsDropped}`, 'cyan');
        this.log(`Errors: ${report.errors}`, 'cyan');
      }

      return report.success;
    } catch (error) {
      this.logError(`Database reset failed: ${error.message}`);
      return false;
    } finally {
      // Close database connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        this.log('\nDatabase connection closed', 'cyan');
      }
    }
  }
}

// Run reset if this file is executed directly
if (require.main === module) {
  const reset = new DatabaseReset();
  reset.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Database reset error:', error);
      process.exit(1);
    });
}

module.exports = DatabaseReset;
