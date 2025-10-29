const logger = require('../config/logger');
const { validateEnvironment, getEnvironmentSummary } = require('../config/envValidation');

/**
 * Startup Validation Utility
 * Handles comprehensive application startup validation and graceful failure
 */

class StartupValidator {
  constructor() {
    this.validationResults = null;
    this.startupChecks = [];
  }

  /**
   * Add a custom startup check
   */
  addCheck(name, checkFunction, isCritical = true) {
    this.startupChecks.push({
      name,
      checkFunction,
      isCritical,
      result: null
    });
  }

  /**
   * Validate environment variables
   */
  async validateEnvironmentVariables() {
    logger.info('🔍 Validating environment variables...');
    
    try {
      this.validationResults = validateEnvironment();
      
      if (!this.validationResults.isValid) {
        logger.error('❌ Environment validation failed');
        this.validationResults.errors.forEach(error => {
          logger.error(`  ${error}`);
        });
        
        if (this.validationResults.warnings.length > 0) {
          logger.warn('⚠️  Environment validation warnings:');
          this.validationResults.warnings.forEach(warning => {
            logger.warn(`  ${warning}`);
          });
        }
        
        return false;
      }
      
      logger.info('✅ Environment variables validated successfully');
      
      if (this.validationResults.warnings.length > 0) {
        logger.warn('⚠️  Environment validation warnings:');
        this.validationResults.warnings.forEach(warning => {
          logger.warn(`  ${warning}`);
        });
      }
      
      return true;
    } catch (error) {
      logger.error('❌ Environment validation error:', error);
      return false;
    }
  }

  /**
   * Test database connectivity
   */
  async testDatabaseConnection() {
    logger.info('🔍 Testing database connection...');
    
    try {
      const mongoose = require('mongoose');
      
      // Test connection with a short timeout
      const testConnection = await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/localpro-super-app',
        {
          serverSelectionTimeoutMS: 5000, // 5 second timeout
          connectTimeoutMS: 5000
        }
      );
      
      logger.info(`✅ Database connected successfully: ${testConnection.connection.host}`);
      return true;
    } catch (error) {
      logger.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  /**
   * Test Redis connectivity (if configured)
   */
  async testRedisConnection() {
    if (!process.env.REDIS_URL) {
      logger.info('ℹ️  Redis not configured, skipping Redis connectivity test');
      return true;
    }

    logger.info('🔍 Testing Redis connection...');
    
    try {
      const redis = require('redis');
      const client = redis.createClient({
        url: process.env.REDIS_URL
      });

      await client.connect();
      await client.ping();
      await client.disconnect();
      
      logger.info('✅ Redis connected successfully');
      return true;
    } catch (error) {
      logger.warn('⚠️  Redis connection failed:', error.message);
      logger.warn('  Application will continue without Redis caching');
      return false; // Non-critical failure
    }
  }

  /**
   * Test external service configurations
   */
  async testExternalServices() {
    logger.info('🔍 Testing external service configurations...');
    
    const results = {
      email: false,
      cloudinary: false,
      googleMaps: false,
      twilio: false,
      paypal: false,
      paymaya: false
    };

    // Test Email Service
    try {
      const EmailService = require('../services/emailService');
      const emailService = new EmailService();
      
      // Check if email service is properly configured
      if (process.env.EMAIL_SERVICE === 'resend' && process.env.RESEND_API_KEY) {
        results.email = true;
        logger.info('✅ Email service (Resend) configured');
      } else if (process.env.EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_API_KEY) {
        results.email = true;
        logger.info('✅ Email service (SendGrid) configured');
      } else if ((process.env.EMAIL_SERVICE === 'smtp' || process.env.EMAIL_SERVICE === 'hostinger') && 
                 process.env.SMTP_HOST && process.env.SMTP_USER) {
        results.email = true;
        logger.info('✅ Email service (SMTP) configured');
      } else {
        logger.warn('⚠️  Email service not properly configured');
      }
    } catch (error) {
      logger.warn('⚠️  Email service configuration test failed:', error.message);
    }

    // Test Cloudinary
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        results.cloudinary = true;
        logger.info('✅ Cloudinary configured');
      } else {
        logger.warn('⚠️  Cloudinary not properly configured');
      }
    } catch (error) {
      logger.warn('⚠️  Cloudinary configuration test failed:', error.message);
    }

    // Test Google Maps
    try {
      if (process.env.GOOGLE_MAPS_API_KEY) {
        results.googleMaps = true;
        logger.info('✅ Google Maps API configured');
      } else {
        logger.warn('⚠️  Google Maps API not configured');
      }
    } catch (error) {
      logger.warn('⚠️  Google Maps configuration test failed:', error.message);
    }

    // Test Twilio
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        results.twilio = true;
        logger.info('✅ Twilio configured');
      } else {
        logger.info('ℹ️  Twilio not configured (optional)');
      }
    } catch (error) {
      logger.warn('⚠️  Twilio configuration test failed:', error.message);
    }

    // Test PayPal
    try {
      if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
        results.paypal = true;
        logger.info('✅ PayPal configured');
      } else {
        logger.info('ℹ️  PayPal not configured (optional)');
      }
    } catch (error) {
      logger.warn('⚠️  PayPal configuration test failed:', error.message);
    }

    // Test PayMaya
    try {
      if (process.env.PAYMAYA_PUBLIC_KEY && process.env.PAYMAYA_SECRET_KEY) {
        results.paymaya = true;
        logger.info('✅ PayMaya configured');
      } else {
        logger.info('ℹ️  PayMaya not configured (optional)');
      }
    } catch (error) {
      logger.warn('⚠️  PayMaya configuration test failed:', error.message);
    }

    return results;
  }

  /**
   * Run all startup checks
   */
  async runAllChecks() {
    logger.info('🚀 Starting application startup validation...');
    
    const startTime = Date.now();
    const results = {
      environment: false,
      database: false,
      redis: false,
      externalServices: {},
      customChecks: {},
      overall: false
    };

    // 1. Environment Variables Validation
    results.environment = await this.validateEnvironmentVariables();
    if (!results.environment) {
      logger.error('❌ Critical: Environment validation failed');
      this.handleStartupFailure('Environment validation failed', results);
      return results;
    }

    // 2. Database Connection Test
    results.database = await this.testDatabaseConnection();
    if (!results.database) {
      logger.error('❌ Critical: Database connection failed');
      this.handleStartupFailure('Database connection failed', results);
      return results;
    }

    // 3. Redis Connection Test (non-critical)
    results.redis = await this.testRedisConnection();

    // 4. External Services Test
    results.externalServices = await this.testExternalServices();

    // 5. Custom Checks
    for (const check of this.startupChecks) {
      try {
        logger.info(`🔍 Running custom check: ${check.name}`);
        check.result = await check.checkFunction();
        
        if (check.result) {
          logger.info(`✅ Custom check passed: ${check.name}`);
        } else {
          logger.error(`❌ Custom check failed: ${check.name}`);
        }
        
        results.customChecks[check.name] = {
          passed: check.result,
          critical: check.isCritical
        };
        
        if (check.isCritical && !check.result) {
          this.handleStartupFailure(`Critical custom check failed: ${check.name}`, results);
          return results;
        }
      } catch (error) {
        logger.error(`❌ Custom check error: ${check.name}`, error);
        results.customChecks[check.name] = {
          passed: false,
          critical: check.isCritical,
          error: error.message
        };
        
        if (check.isCritical) {
          this.handleStartupFailure(`Critical custom check error: ${check.name}`, results);
          return results;
        }
      }
    }

    const duration = Date.now() - startTime;
    results.overall = true;
    
    logger.info(`✅ All startup checks completed successfully in ${duration}ms`);
    this.logStartupSummary(results);
    
    return results;
  }

  /**
   * Handle startup failure gracefully
   */
  handleStartupFailure(reason, results) {
    logger.error('💥 Application startup failed');
    logger.error(`Reason: ${reason}`);
    
    // Log detailed results for debugging
    logger.error('Startup validation results:', results);
    
    // Log environment summary for debugging
    const envSummary = getEnvironmentSummary();
    logger.error('Environment configuration:', envSummary);
    
    // Exit with error code
    logger.error('Exiting application due to startup failure...');
    process.exit(1);
  }

  /**
   * Log startup summary
   */
  logStartupSummary(results) {
    logger.info('📊 Startup Validation Summary:');
    logger.info(`  Environment Variables: ${results.environment ? '✅' : '❌'}`);
    logger.info(`  Database Connection: ${results.database ? '✅' : '❌'}`);
    logger.info(`  Redis Connection: ${results.redis ? '✅' : '⚠️'}`);
    
    logger.info('  External Services:');
    Object.entries(results.externalServices).forEach(([service, configured]) => {
      logger.info(`    ${service}: ${configured ? '✅' : '⚠️'}`);
    });
    
    if (Object.keys(results.customChecks).length > 0) {
      logger.info('  Custom Checks:');
      Object.entries(results.customChecks).forEach(([check, result]) => {
        const status = result.passed ? '✅' : '❌';
        const critical = result.critical ? ' (Critical)' : '';
        logger.info(`    ${check}: ${status}${critical}`);
      });
    }
    
    // Log environment summary
    const envSummary = getEnvironmentSummary();
    logger.info('📋 Environment Configuration:');
    logger.info(`  Environment: ${envSummary.environment}`);
    logger.info(`  Port: ${envSummary.port}`);
    logger.info(`  Database: ${envSummary.database.configured ? 'Configured' : 'Not configured'}`);
    logger.info(`  Email Service: ${envSummary.email.service} (${envSummary.email.configured ? 'Configured' : 'Not configured'})`);
    logger.info(`  File Upload: ${envSummary.fileUpload.configured ? 'Configured' : 'Not configured'}`);
    logger.info(`  Maps Service: ${envSummary.maps.configured ? 'Configured' : 'Not configured'}`);
    logger.info(`  Payment Services: PayPal(${envSummary.payments.paypal ? 'Yes' : 'No'}), PayMaya(${envSummary.payments.paymaya ? 'Yes' : 'No'})`);
    logger.info(`  SMS Service: ${envSummary.sms.configured ? 'Configured' : 'Not configured'}`);
    logger.info(`  Cache Service: ${envSummary.cache.configured ? 'Configured' : 'Not configured'}`);
  }

  /**
   * Get validation results
   */
  getResults() {
    return this.validationResults;
  }
}

module.exports = StartupValidator;

