#!/usr/bin/env node

/**
 * Environment Validation Demo Script
 * Demonstrates the environment validation system
 */

require('dotenv').config();

const logger = require('./src/config/logger');
const { validateEnvironment, getEnvironmentSummary } = require('./src/config/envValidation');
const StartupValidator = require('./src/utils/startupValidation');

async function demonstrateValidation() {
  console.log('🎯 Environment Validation Demo');
  console.log('═'.repeat(50));

  // 1. Show current environment summary
  console.log('\n📋 Current Environment Configuration:');
  const summary = getEnvironmentSummary();
  console.log(JSON.stringify(summary, null, 2));

  // 2. Run environment validation
  console.log('\n🔍 Running Environment Validation...');
  const validationResult = validateEnvironment();
  
  console.log(`\n📊 Validation Result: ${validationResult.isValid ? '✅ VALID' : '❌ INVALID'}`);
  
  if (!validationResult.isValid) {
    console.log('\n❌ Validation Errors:');
    validationResult.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  if (validationResult.warnings.length > 0) {
    console.log('\n⚠️  Validation Warnings:');
    validationResult.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }

  // 3. Show what would happen during startup
  console.log('\n🚀 Startup Validation Simulation:');
  console.log('─'.repeat(30));

  const validator = new StartupValidator();
  
  // Add a custom check for demo
  validator.addCheck('Demo Custom Check', () => {
    console.log('   🔧 Running demo custom check...');
    return true;
  }, false);

  try {
    // Override connection tests to avoid actual connections
    validator.testDatabaseConnection = async () => {
      console.log('   📊 Database connection test (simulated)');
      return !!process.env.MONGODB_URI;
    };

    validator.testRedisConnection = async () => {
      console.log('   🔴 Redis connection test (simulated)');
      return !!process.env.REDIS_URL;
    };

    const startupResults = await validator.runAllChecks();
    
    console.log(`\n📊 Startup Validation Result: ${startupResults.overall ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!startupResults.overall) {
      console.log('\n❌ Startup validation failed. Application would not start.');
    } else {
      console.log('\n✅ Startup validation passed. Application would start successfully.');
    }

  } catch (error) {
    console.log(`\n❌ Startup validation error: ${error.message}`);
  }

  // 4. Show recommendations
  console.log('\n💡 Recommendations:');
  console.log('─'.repeat(20));
  
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.log('   • Set a strong JWT_SECRET (at least 32 characters)');
  }
  
  if (!process.env.MONGODB_URI) {
    console.log('   • Set MONGODB_URI for database connection');
  }
  
  if (!process.env.FRONTEND_URL) {
    console.log('   • Set FRONTEND_URL for CORS configuration');
  }
  
  if (!process.env.EMAIL_SERVICE) {
    console.log('   • Configure EMAIL_SERVICE (resend, sendgrid, smtp, or hostinger)');
  }
  
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('   • Configure Cloudinary for file uploads');
  }
  
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.log('   • Set GOOGLE_MAPS_API_KEY for location services');
  }

  console.log('\n🎯 Demo completed!');
}

// Run demo
if (require.main === module) {
  demonstrateValidation().catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  });
}

module.exports = { demonstrateValidation };
