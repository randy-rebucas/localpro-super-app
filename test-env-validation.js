#!/usr/bin/env node

/**
 * Environment Validation Test Script
 * Tests the environment variable validation system with various scenarios
 */

const path = require('path');
const fs = require('fs');

// Test scenarios
const testScenarios = [
  {
    name: 'Missing Required Variables',
    description: 'Test with missing critical environment variables',
    envVars: {
      NODE_ENV: 'test',
      PORT: '3000'
      // Missing: FRONTEND_URL, MONGODB_URI, JWT_SECRET, etc.
    },
    shouldFail: true
  },
  {
    name: 'Invalid Variable Values',
    description: 'Test with invalid values for environment variables',
    envVars: {
      NODE_ENV: 'invalid_env',
      PORT: '99999', // Invalid port
      FRONTEND_URL: 'not-a-url',
      MONGODB_URI: 'invalid-mongo-uri',
      JWT_SECRET: 'short', // Too short
      EMAIL_SERVICE: 'invalid-service',
      FROM_EMAIL: 'not-an-email',
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
      GOOGLE_MAPS_API_KEY: ''
    },
    shouldFail: true
  },
  {
    name: 'Valid Configuration',
    description: 'Test with valid environment variables',
    envVars: {
      NODE_ENV: 'development',
      PORT: '5000',
      FRONTEND_URL: 'http://localhost:3000',
      MONGODB_URI: 'mongodb://localhost:27017/localpro-test',
      JWT_SECRET: 'this-is-a-valid-jwt-secret-that-is-long-enough-for-testing',
      EMAIL_SERVICE: 'resend',
      FROM_EMAIL: 'test@example.com',
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-api-key',
      CLOUDINARY_API_SECRET: 'test-api-secret',
      GOOGLE_MAPS_API_KEY: 'test-maps-key'
    },
    shouldFail: false
  },
  {
    name: 'Partial Configuration',
    description: 'Test with some optional services configured',
    envVars: {
      NODE_ENV: 'development',
      PORT: '5000',
      FRONTEND_URL: 'http://localhost:3000',
      MONGODB_URI: 'mongodb://localhost:27017/localpro-test',
      JWT_SECRET: 'this-is-a-valid-jwt-secret-that-is-long-enough-for-testing',
      EMAIL_SERVICE: 'smtp',
      FROM_EMAIL: 'test@example.com',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'test@example.com',
      SMTP_PASS: 'test-password',
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-api-key',
      CLOUDINARY_API_SECRET: 'test-api-secret',
      GOOGLE_MAPS_API_KEY: 'test-maps-key',
      TWILIO_ACCOUNT_SID: 'xxx',
      TWILIO_AUTH_TOKEN: 'test-twilio-auth-token-long-enough',
      PAYPAL_CLIENT_ID: 'test-paypal-client-id',
      PAYPAL_CLIENT_SECRET: 'test-paypal-secret'
    },
    shouldFail: false
  }
];

/**
 * Run a single test scenario
 */
async function runTestScenario(scenario) {
  console.log(`\n🧪 Running Test: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  console.log('─'.repeat(60));

  // Set environment variables for this test
  const originalEnv = { ...process.env };
  
  // Clear existing environment variables
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('NODE_') || key.startsWith('PORT') || 
        key.startsWith('FRONTEND_') || key.startsWith('MONGODB_') ||
        key.startsWith('JWT_') || key.startsWith('EMAIL_') ||
        key.startsWith('FROM_') || key.startsWith('CLOUDINARY_') ||
        key.startsWith('GOOGLE_') || key.startsWith('SMTP_') ||
        key.startsWith('TWILIO_') || key.startsWith('PAYPAL_') ||
        key.startsWith('PAYMAYA_') || key.startsWith('REDIS_')) {
      delete process.env[key];
    }
  });

  // Set test environment variables
  Object.assign(process.env, scenario.envVars);

  try {
    // Import validation modules
    const { validateEnvironment } = require('./src/config/envValidation');
    const StartupValidator = require('./src/utils/startupValidation');

    // Test environment validation
    console.log('🔍 Testing environment validation...');
    const validationResult = validateEnvironment();
    
    console.log(`✅ Environment validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    
    if (!validationResult.isValid) {
      console.log('❌ Validation errors:');
      validationResult.errors.forEach(error => {
        console.log(`   ${error}`);
      });
    }

    if (validationResult.warnings.length > 0) {
      console.log('⚠️  Validation warnings:');
      validationResult.warnings.forEach(warning => {
        console.log(`   ${warning}`);
      });
    }

    // Test startup validator (without actually connecting to services)
    console.log('\n🔍 Testing startup validator...');
    const validator = new StartupValidator();
    
    // Override database connection test to avoid actual connection
    validator.testDatabaseConnection = async () => {
      console.log('   (Skipping actual database connection test)');
      return true;
    };
    
    validator.testRedisConnection = async () => {
      console.log('   (Skipping actual Redis connection test)');
      return true;
    };

    const startupResults = await validator.runAllChecks();
    
    console.log(`✅ Startup validation result: ${startupResults.overall ? 'PASSED' : 'FAILED'}`);

    // Check if results match expectations
    const expectedResult = !scenario.shouldFail;
    const actualResult = validationResult.isValid && startupResults.overall;
    
    if (expectedResult === actualResult) {
      console.log(`✅ Test ${scenario.name}: PASSED`);
      return true;
    } else {
      console.log(`❌ Test ${scenario.name}: FAILED`);
      console.log(`   Expected: ${expectedResult ? 'PASS' : 'FAIL'}`);
      console.log(`   Actual: ${actualResult ? 'PASS' : 'FAIL'}`);
      return false;
    }

  } catch (error) {
    console.log(`❌ Test ${scenario.name}: ERROR`);
    console.log(`   Error: ${error.message}`);
    return false;
  } finally {
    // Restore original environment
    process.env = originalEnv;
  }
}

/**
 * Run all test scenarios
 */
async function runAllTests() {
  console.log('🚀 Starting Environment Validation Tests');
  console.log('═'.repeat(60));

  let passedTests = 0;
  let totalTests = testScenarios.length;

  for (const scenario of testScenarios) {
    const passed = await runTestScenario(scenario);
    if (passed) passedTests++;
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('═'.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Environment validation is working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the validation logic.');
    process.exit(1);
  }
}

/**
 * Test specific validation functions
 */
function testValidationFunctions() {
  console.log('\n🔧 Testing Individual Validation Functions');
  console.log('─'.repeat(60));

  const { validateEnvironment } = require('./src/config/envValidation');

  // Test with minimal valid config
  const testEnv = {
    NODE_ENV: 'test',
    PORT: '5000',
    FRONTEND_URL: 'http://localhost:3000',
    MONGODB_URI: 'mongodb://localhost:27017/test',
    JWT_SECRET: 'test-jwt-secret-that-is-long-enough',
    EMAIL_SERVICE: 'resend',
    FROM_EMAIL: 'test@example.com',
    CLOUDINARY_CLOUD_NAME: 'test',
    CLOUDINARY_API_KEY: 'test',
    CLOUDINARY_API_SECRET: 'test',
    GOOGLE_MAPS_API_KEY: 'test'
  };

  // Set test environment
  Object.assign(process.env, testEnv);

  try {
    const result = validateEnvironment();
    console.log(`✅ Individual validation test: ${result.isValid ? 'PASSED' : 'FAILED'}`);
    
    if (!result.isValid) {
      console.log('Errors:', result.errors);
    }
    
    if (result.warnings.length > 0) {
      console.log('Warnings:', result.warnings);
    }
  } catch (error) {
    console.log(`❌ Individual validation test: ERROR - ${error.message}`);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--functions-only')) {
    testValidationFunctions();
  } else {
    runAllTests().catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
  }
}

module.exports = {
  runAllTests,
  runTestScenario,
  testValidationFunctions,
  testScenarios
};
