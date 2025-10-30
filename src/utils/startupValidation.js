/**
 * Startup Validation Utility
 * Validates critical environment variables and configurations on app startup
 */

const logger = require('../config/logger');

class StartupValidator {
  constructor() {
    this.checks = [];
    this.criticalFailures = [];
    this.warnings = [];
  }

  /**
   * Add a validation check
   * @param {string} name - Name of the check
   * @param {Function} checkFn - Function that returns true/false or throws error
   * @param {boolean} isCritical - Whether this is a critical check that should stop startup
   * @param {string} message - Optional custom message
   */
  addCheck(name, checkFn, isCritical = false, message = null) {
    this.checks.push({
      name,
      checkFn,
      isCritical,
      message: message || `${name} validation`
    });
  }

  /**
   * Run all validation checks
   * @returns {Object} Validation results
   */
  async runValidation() {
    logger.info('🔍 Running startup validation checks...');
    
    const results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      criticalFailures: 0
    };

    for (const check of this.checks) {
      try {
        const result = await check.checkFn();
        
        if (result === true) {
          results.passed++;
          logger.info(`✅ ${check.name}: PASSED`);
        } else if (result === false) {
          if (check.isCritical) {
            results.criticalFailures++;
            this.criticalFailures.push(check.name);
            logger.error(`❌ ${check.name}: CRITICAL FAILURE`);
          } else {
            results.failed++;
            this.warnings.push(check.name);
            logger.warn(`⚠️  ${check.name}: FAILED (non-critical)`);
          }
        } else if (typeof result === 'string') {
          // Custom warning message
          results.warnings++;
          this.warnings.push(`${check.name}: ${result}`);
          logger.warn(`⚠️  ${check.name}: ${result}`);
        }
      } catch (error) {
        if (check.isCritical) {
          results.criticalFailures++;
          this.criticalFailures.push(`${check.name}: ${error.message}`);
          logger.error(`❌ ${check.name}: CRITICAL ERROR - ${error.message}`);
        } else {
          results.failed++;
          this.warnings.push(`${check.name}: ${error.message}`);
          logger.warn(`⚠️  ${check.name}: ERROR - ${error.message}`);
        }
      }
    }

    // Log summary
    logger.info('📊 Startup validation summary:', {
      passed: results.passed,
      failed: results.failed,
      warnings: results.warnings,
      criticalFailures: results.criticalFailures
    });

    return results;
  }

  /**
   * Check if startup should proceed
   * @returns {boolean} True if startup can proceed
   */
  canProceed() {
    return this.criticalFailures.length === 0;
  }

  /**
   * Get validation summary
   * @returns {Object} Summary of validation results
   */
  getSummary() {
    return {
      canProceed: this.canProceed(),
      criticalFailures: this.criticalFailures,
      warnings: this.warnings,
      totalChecks: this.checks.length
    };
  }
}

// Predefined validation checks
const createDefaultChecks = (validator) => {
  // Critical environment variables
  validator.addCheck('JWT Secret', () => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required');
    }
    
    if (jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    
    if (process.env.NODE_ENV === 'production' && jwtSecret.length < 64) {
      throw new Error('JWT_SECRET should be at least 64 characters long in production');
    }
    
    return true;
  }, true);

  validator.addCheck('MongoDB URI', () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is required');
    }
    
    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      throw new Error('MONGODB_URI must be a valid MongoDB connection string');
    }
    
    return true;
  }, true);

  validator.addCheck('Node Environment', () => {
    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv) {
      return 'NODE_ENV not set, defaulting to development';
    }
    
    const validEnvs = ['development', 'production', 'test', 'staging'];
    if (!validEnvs.includes(nodeEnv)) {
      throw new Error(`NODE_ENV must be one of: ${validEnvs.join(', ')}`);
    }
    
    return true;
  }, false);

  // Optional but recommended environment variables
  validator.addCheck('Twilio Configuration', () => {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioService = process.env.TWILIO_VERIFY_SERVICE_SID;
    
    if (!twilioSid || !twilioToken || !twilioService) {
      return 'Twilio credentials not configured - SMS features will be disabled';
    }
    
    return true;
  }, false);

  validator.addCheck('PayPal Configuration', () => {
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
    
    if (!paypalClientId || !paypalClientSecret) {
      return 'PayPal credentials not configured - Payment features will be limited';
    }
    
    return true;
  }, false);

  validator.addCheck('Cloudinary Configuration', () => {
    const cloudinaryUrl = process.env.CLOUDINARY_CLOUD_NAME;
    
    if (!cloudinaryUrl) {
      return 'Cloudinary configuration not found - File upload features will be limited';
    }
    
    return true;
  }, false);


  // Security checks
  validator.addCheck('CORS Configuration', () => {
    const frontendUrl = process.env.FRONTEND_URL;
    
    if (!frontendUrl) {
      return 'FRONTEND_URL not set - CORS may be too permissive';
    }
    
    return true;
  }, false);


  // Database connection check (non-critical - will be checked after connection)
  validator.addCheck('Database Connection', async () => {
    try {
      const mongoose = require('mongoose');
      const state = mongoose.connection.readyState;
      
      if (state !== 1) { // 1 = connected
        return 'Database not yet connected - will be checked after connection';
      }
      
      return true;
    } catch (error) {
      return `Database connection check failed: ${error.message}`;
    }
  }, false);

  // Port validation
  validator.addCheck('Port Configuration', () => {
    const port = process.env.PORT || 5000;
    const portNum = parseInt(port);
    
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      throw new Error(`Invalid port number: ${port}`);
    }
    
    return true;
  }, false);
};

module.exports = { StartupValidator, createDefaultChecks };