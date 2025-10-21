#!/usr/bin/env node

/**
 * Test Setup Script
 * This script tests the setup installation functionality
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import setup classes
const SetupInstaller = require('./setup-install');
const AutoSetup = require('./setup-auto');

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

class SetupTester {
  constructor() {
    this.testResults = {
      syntaxCheck: false,
      moduleLoad: false,
      databaseConnection: false,
      setupClasses: false
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
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

  async testSyntaxCheck() {
    this.logInfo('Testing syntax check...');
    
    try {
      // Test setup-install.js syntax
      require('child_process').execSync('node -c setup-install.js', { stdio: 'pipe' });
      this.logSuccess('setup-install.js syntax is valid');
      
      // Test setup-auto.js syntax
      require('child_process').execSync('node -c setup-auto.js', { stdio: 'pipe' });
      this.logSuccess('setup-auto.js syntax is valid');
      
      this.testResults.syntaxCheck = true;
      return true;
    } catch (error) {
      this.logError(`Syntax check failed: ${error.message}`);
      return false;
    }
  }

  async testModuleLoad() {
    this.logInfo('Testing module loading...');
    
    try {
      // Test if modules can be loaded
      const SetupInstaller = require('./setup-install');
      const AutoSetup = require('./setup-auto');
      
      this.logSuccess('Setup modules loaded successfully');
      this.testResults.moduleLoad = true;
      return true;
    } catch (error) {
      this.logError(`Module load failed: ${error.message}`);
      return false;
    }
  }

  async testDatabaseConnection() {
    this.logInfo('Testing database connection...');
    
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app';
      await mongoose.connect(mongoUri);
      this.logSuccess('Database connection successful');
      this.testResults.databaseConnection = true;
      return true;
    } catch (error) {
      this.logWarning(`Database connection failed: ${error.message}`);
      this.logInfo('This is expected if MongoDB is not running');
      return false;
    } finally {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    }
  }

  async testSetupClasses() {
    this.logInfo('Testing setup class instantiation...');
    
    try {
      // Test SetupInstaller class
      const installer = new SetupInstaller();
      this.logSuccess('SetupInstaller class instantiated');
      
      // Test AutoSetup class
      const autoSetup = new AutoSetup();
      this.logSuccess('AutoSetup class instantiated');
      
      this.testResults.setupClasses = true;
      return true;
    } catch (error) {
      this.logError(`Setup class test failed: ${error.message}`);
      return false;
    }
  }

  generateReport() {
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(result => result === true).length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    this.log(`\n${colors.bright}${colors.blue}📊 Setup Test Report${colors.reset}`, 'blue');
    this.log(`${colors.blue}===================${colors.reset}`, 'blue');
    
    this.log(`\n${colors.bright}Overall Status:${colors.reset}`, 'yellow');
    if (successRate >= 75) {
      this.log(`✅ Setup tests PASSED (${successRate}%)`, 'green');
    } else if (successRate >= 50) {
      this.log(`⚠️  Setup tests PARTIAL (${successRate}%)`, 'yellow');
    } else {
      this.log(`❌ Setup tests FAILED (${successRate}%)`, 'red');
    }

    this.log(`\n${colors.bright}Test Results:${colors.reset}`, 'yellow');
    Object.entries(this.testResults).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      const color = value ? 'green' : 'red';
      this.log(`${status} ${key}: ${value ? 'PASS' : 'FAIL'}`, color);
    });

    this.log(`\n${colors.bright}Setup Scripts Available:${colors.reset}`, 'yellow');
    this.log('• npm run setup:install - Interactive setup', 'cyan');
    this.log('• npm run setup:auto - Automated setup', 'cyan');
    this.log('• npm run setup - Full setup with sample data', 'cyan');
    this.log('• npm run verify - Verify setup', 'cyan');

    return {
      successRate,
      passedTests,
      totalTests,
      results: this.testResults
    };
  }

  async run() {
    this.log(`${colors.bright}${colors.blue}🧪 LocalPro Super App Setup Test${colors.reset}`, 'blue');
    this.log(`${colors.blue}================================${colors.reset}`, 'blue');

    try {
      // Run all tests
      await this.testSyntaxCheck();
      await this.testModuleLoad();
      await this.testDatabaseConnection();
      await this.testSetupClasses();

      // Generate report
      const report = this.generateReport();

      return report.successRate >= 75;
    } catch (error) {
      this.logError(`Test failed: ${error.message}`);
      return false;
    }
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  const tester = new SetupTester();
  tester.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test error:', error);
      process.exit(1);
    });
}

module.exports = SetupTester;
