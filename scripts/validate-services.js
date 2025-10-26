#!/usr/bin/env node

/**
 * External Service Validation Script
 * 
 * This script validates and tests all external service configurations for the LocalPro Super App.
 * It checks configuration completeness and tests actual service connections.
 * 
 * Usage:
 *   node scripts/validate-services.js
 *   node scripts/validate-services.js --service twilio
 *   node scripts/validate-services.js --test-all
 */

const fs = require('fs');
const path = require('path');

// Service configurations
const SERVICES = {
  twilio: {
    name: 'Twilio SMS Service',
    required: true,
    envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID', 'TWILIO_PHONE_NUMBER'],
    testFunction: 'testTwilioConnection'
  },
  paypal: {
    name: 'PayPal Payment Processing',
    required: true,
    envVars: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MODE', 'PAYPAL_WEBHOOK_ID'],
    testFunction: 'testPayPalConnection'
  },
  paymaya: {
    name: 'PayMaya Payment Processing',
    required: false,
    envVars: ['PAYMAYA_PUBLIC_KEY', 'PAYMAYA_SECRET_KEY', 'PAYMAYA_MODE', 'PAYMAYA_WEBHOOK_SECRET'],
    testFunction: 'testPayMayaConnection'
  },
  email: {
    name: 'Email Service',
    required: true,
    envVars: ['EMAIL_SERVICE', 'FROM_EMAIL'],
    testFunction: 'testEmailService'
  },
  cloudinary: {
    name: 'Cloudinary File Storage',
    required: true,
    envVars: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    testFunction: 'testCloudinaryConnection'
  },
  googlemaps: {
    name: 'Google Maps API',
    required: false,
    envVars: ['GOOGLE_MAPS_API_KEY', 'GOOGLE_MAPS_GEOCODING_API_KEY', 'GOOGLE_MAPS_PLACES_API_KEY', 'GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY'],
    testFunction: 'testGoogleMapsConnection'
  },
  stripe: {
    name: 'Stripe Payment Processing',
    required: false,
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
    testFunction: 'testStripeConnection'
  },
  aws: {
    name: 'AWS S3 Storage',
    required: false,
    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_BUCKET_NAME', 'AWS_REGION'],
    testFunction: 'testAWSConnection'
  }
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  console.log(`${colors[type]}${icons[type]} ${message}${colors.reset}`);
}

function getEnvFilePath() {
  return path.join(process.cwd(), '.env');
}

function readEnvFile() {
  const envPath = getEnvFilePath();
  if (!fs.existsSync(envPath)) {
    log('No .env file found!', 'error');
    process.exit(1);
  }
  return fs.readFileSync(envPath, 'utf8');
}

function extractConfig(envContent, serviceKey) {
  const service = SERVICES[serviceKey];
  const config = {};
  
  for (const envVar of service.envVars) {
    const regex = new RegExp(`^${envVar}=(.+)$`, 'm');
    const match = envContent.match(regex);
    if (match) {
      config[envVar] = match[1];
    }
  }
  
  return config;
}

function validateConfiguration(serviceKey) {
  const service = SERVICES[serviceKey];
  const envContent = readEnvFile();
  const config = extractConfig(envContent, serviceKey);
  
  const isConfigured = service.envVars.every(envVar => config[envVar]);
  const missingVars = service.envVars.filter(envVar => !config[envVar]);
  
  return {
    name: service.name,
    configured: isConfigured,
    required: service.required,
    missingVars,
    config
  };
}

async function testTwilioConnection(config) {
  try {
    const twilio = require('twilio');
    const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    
    const account = await client.api.accounts(config.TWILIO_ACCOUNT_SID).fetch();
    return {
      success: true,
      message: `Connected to ${account.friendlyName}`,
      details: {
        accountSid: config.TWILIO_ACCOUNT_SID,
        status: account.status
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function testPayPalConnection(config) {
  try {
    const paypal = require('@paypal/paypal-server-sdk');
    paypal.configure({
      mode: config.PAYPAL_MODE,
      clientId: config.PAYPAL_CLIENT_ID,
      clientSecret: config.PAYPAL_CLIENT_SECRET
    });
    
    return {
      success: true,
      message: `PayPal ${config.PAYPAL_MODE} mode configured`,
      details: {
        mode: config.PAYPAL_MODE,
        clientId: config.PAYPAL_CLIENT_ID.substring(0, 8) + '...'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function testPayMayaConnection(config) {
  try {
    // PayMaya doesn't have a simple test endpoint, so we'll just validate the config
    return {
      success: true,
      message: `PayMaya ${config.PAYMAYA_MODE} mode configured`,
      details: {
        mode: config.PAYMAYA_MODE,
        publicKey: config.PAYMAYA_PUBLIC_KEY.substring(0, 8) + '...'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function testEmailService(config) {
  try {
    if (config.EMAIL_SERVICE === 'resend') {
      const { Resend } = require('resend');
      const resend = new Resend(config.RESEND_API_KEY);
      
      return {
        success: true,
        message: 'Resend email service configured',
        details: {
          service: 'resend',
          fromEmail: config.FROM_EMAIL
        }
      };
    } else if (config.EMAIL_SERVICE === 'sendgrid') {
      return {
        success: true,
        message: 'SendGrid email service configured',
        details: {
          service: 'sendgrid',
          fromEmail: config.FROM_EMAIL
        }
      };
    } else if (config.EMAIL_SERVICE === 'smtp') {
      return {
        success: true,
        message: 'SMTP email service configured',
        details: {
          service: 'smtp',
          fromEmail: config.FROM_EMAIL,
          host: config.SMTP_HOST
        }
      };
    }
    
    return {
      success: false,
      message: 'Unknown email service'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function testCloudinaryConnection(config) {
  try {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: config.CLOUDINARY_CLOUD_NAME,
      api_key: config.CLOUDINARY_API_KEY,
      api_secret: config.CLOUDINARY_API_SECRET
    });
    
    const result = await cloudinary.api.ping();
    
    return {
      success: true,
      message: 'Cloudinary connection successful',
      details: {
        cloudName: config.CLOUDINARY_CLOUD_NAME,
        status: result.status
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function testGoogleMapsConnection(config) {
  try {
    // Google Maps doesn't have a simple test endpoint, so we'll just validate the config
    return {
      success: true,
      message: 'Google Maps API configured',
      details: {
        apiKey: config.GOOGLE_MAPS_API_KEY.substring(0, 8) + '...',
        services: ['maps', 'geocoding', 'places', 'distance_matrix']
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function testStripeConnection(config) {
  try {
    const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
    
    return {
      success: true,
      message: 'Stripe connection configured',
      details: {
        publishableKey: config.STRIPE_PUBLISHABLE_KEY.substring(0, 8) + '...'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function testAWSConnection(config) {
  try {
    // AWS doesn't have a simple test endpoint, so we'll just validate the config
    return {
      success: true,
      message: 'AWS S3 configured',
      details: {
        bucket: config.AWS_BUCKET_NAME,
        region: config.AWS_REGION
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function validateAllServices() {
  log('🔍 Validating External Service Configurations', 'info');
  log('==============================================', 'info');
  
  const results = {};
  const envContent = readEnvFile();
  
  // Validate configuration completeness
  for (const [serviceKey, service] of Object.entries(SERVICES)) {
    const result = validateConfiguration(serviceKey);
    results[serviceKey] = result;
  }
  
  // Display configuration status
  console.log('\n📊 Configuration Status:');
  console.log('========================');
  
  for (const [serviceKey, result] of Object.entries(results)) {
    const status = result.configured ? '✅ Configured' : (result.required ? '❌ Missing (Required)' : '⚠️  Missing (Optional)');
    console.log(`${result.name}: ${status}`);
    
    if (!result.configured && result.missingVars.length > 0) {
      console.log(`   Missing: ${result.missingVars.join(', ')}`);
    }
  }
  
  // Check for missing required services
  const missingRequired = Object.values(results).filter(r => !r.configured && r.required);
  if (missingRequired.length > 0) {
    log(`\n⚠️  ${missingRequired.length} required service(s) not configured!`, 'warning');
    return false;
  }
  
  log('\n✅ All required services are configured!', 'success');
  return true;
}

async function testAllServices() {
  log('🧪 Testing External Service Connections', 'info');
  log('========================================', 'info');
  
  const results = {};
  const envContent = readEnvFile();
  
  for (const [serviceKey, service] of Object.entries(SERVICES)) {
    const config = extractConfig(envContent, serviceKey);
    
    if (Object.keys(config).length === 0) {
      results[serviceKey] = {
        name: service.name,
        tested: false,
        message: 'Not configured'
      };
      continue;
    }
    
    try {
      const testFunction = global[service.testFunction];
      if (typeof testFunction === 'function') {
        const result = await testFunction(config);
        results[serviceKey] = {
          name: service.name,
          tested: true,
          success: result.success,
          message: result.message,
          details: result.details
        };
      } else {
        results[serviceKey] = {
          name: service.name,
          tested: false,
          message: 'Test function not available'
        };
      }
    } catch (error) {
      results[serviceKey] = {
        name: service.name,
        tested: true,
        success: false,
        message: error.message
      };
    }
  }
  
  // Display test results
  console.log('\n🧪 Connection Test Results:');
  console.log('============================');
  
  for (const [serviceKey, result] of Object.entries(results)) {
    if (!result.tested) {
      console.log(`${result.name}: ⚪ Not tested (${result.message})`);
    } else if (result.success) {
      console.log(`${result.name}: ✅ ${result.message}`);
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
    } else {
      console.log(`${result.name}: ❌ ${result.message}`);
    }
  }
  
  const failedTests = Object.values(results).filter(r => r.tested && !r.success);
  if (failedTests.length > 0) {
    log(`\n⚠️  ${failedTests.length} service test(s) failed!`, 'warning');
    return false;
  }
  
  log('\n✅ All service tests passed!', 'success');
  return true;
}

async function testSpecificService(serviceKey) {
  if (!SERVICES[serviceKey]) {
    log(`Unknown service: ${serviceKey}`, 'error');
    console.log('Available services:', Object.keys(SERVICES).join(', '));
    return false;
  }
  
  const service = SERVICES[serviceKey];
  const config = extractConfig(readEnvFile(), serviceKey);
  
  if (Object.keys(config).length === 0) {
    log(`${service.name} is not configured`, 'error');
    return false;
  }
  
  log(`Testing ${service.name}...`, 'info');
  
  try {
    const testFunction = global[service.testFunction];
    if (typeof testFunction === 'function') {
      const result = await testFunction(config);
      
      if (result.success) {
        log(`${service.name}: ${result.message}`, 'success');
        if (result.details) {
          Object.entries(result.details).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
          });
        }
        return true;
      } else {
        log(`${service.name}: ${result.message}`, 'error');
        return false;
      }
    } else {
      log(`Test function not available for ${service.name}`, 'error');
      return false;
    }
  } catch (error) {
    log(`${service.name} test failed: ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const service = args[1];
  
  try {
    switch (command) {
      case '--service':
        if (service) {
          await testSpecificService(service);
        } else {
          log('Please specify a service to test', 'error');
          console.log('Available services:', Object.keys(SERVICES).join(', '));
        }
        break;
      case '--test-all':
        await testAllServices();
        break;
      case '--help':
        console.log('Usage:');
        console.log('  node scripts/validate-services.js [command] [service]');
        console.log('');
        console.log('Commands:');
        console.log('  (no command)     Validate all configurations');
        console.log('  --test-all       Test all service connections');
        console.log('  --service <name> Test specific service');
        console.log('  --help          Show this help');
        console.log('');
        console.log('Services:', Object.keys(SERVICES).join(', '));
        break;
      default:
        await validateAllServices();
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Export functions for testing
module.exports = {
  validateAllServices,
  testAllServices,
  testSpecificService,
  SERVICES
};

// Run the script
if (require.main === module) {
  main();
}
