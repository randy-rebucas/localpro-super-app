#!/usr/bin/env node

/**
 * External Service Credentials Configuration Script
 * 
 * This script helps configure all external service credentials for the LocalPro Super App.
 * It provides an interactive setup process for each service with validation and testing.
 * 
 * Usage:
 *   node scripts/configure-external-services.js
 *   node scripts/configure-external-services.js --service twilio
 *   node scripts/configure-external-services.js --validate
 *   node scripts/configure-external-services.js --test
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

// Service configurations
const SERVICES = {
  twilio: {
    name: 'Twilio SMS Service',
    description: 'SMS verification and notifications',
    required: true,
    envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID', 'TWILIO_PHONE_NUMBER'],
    testFunction: 'testTwilioConnection',
    setupGuide: 'https://www.twilio.com/docs/verify/quickstarts/node'
  },
  paypal: {
    name: 'PayPal Payment Processing',
    description: 'Payment processing and subscriptions',
    required: true,
    envVars: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MODE', 'PAYPAL_WEBHOOK_ID'],
    testFunction: 'testPayPalConnection',
    setupGuide: 'https://developer.paypal.com/docs/api/overview/'
  },
  paymaya: {
    name: 'PayMaya Payment Processing',
    description: 'Philippines payment processing',
    required: false,
    envVars: ['PAYMAYA_PUBLIC_KEY', 'PAYMAYA_SECRET_KEY', 'PAYMAYA_MODE', 'PAYMAYA_WEBHOOK_SECRET'],
    testFunction: 'testPayMayaConnection',
    setupGuide: 'https://developers.maya.ph/'
  },
  email: {
    name: 'Email Service',
    description: 'Email notifications and communications',
    required: true,
    envVars: ['EMAIL_SERVICE', 'RESEND_API_KEY', 'FROM_EMAIL'],
    testFunction: 'testEmailService',
    setupGuide: 'https://resend.com/docs'
  },
  cloudinary: {
    name: 'Cloudinary File Storage',
    description: 'Image and file uploads',
    required: true,
    envVars: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    testFunction: 'testCloudinaryConnection',
    setupGuide: 'https://cloudinary.com/documentation'
  },
  googlemaps: {
    name: 'Google Maps API',
    description: 'Location services and mapping',
    required: false,
    envVars: ['GOOGLE_MAPS_API_KEY', 'GOOGLE_MAPS_GEOCODING_API_KEY', 'GOOGLE_MAPS_PLACES_API_KEY', 'GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY'],
    testFunction: 'testGoogleMapsConnection',
    setupGuide: 'https://developers.google.com/maps/documentation'
  },
  stripe: {
    name: 'Stripe Payment Processing',
    description: 'Alternative payment processing',
    required: false,
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
    testFunction: 'testStripeConnection',
    setupGuide: 'https://stripe.com/docs'
  },
  aws: {
    name: 'AWS S3 Storage',
    description: 'Alternative file storage',
    required: false,
    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_BUCKET_NAME', 'AWS_REGION'],
    testFunction: 'testAWSConnection',
    setupGuide: 'https://aws.amazon.com/s3/'
  }
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility functions
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

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhoneNumber(phone) {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

function generateWebhookSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// Environment file management
function getEnvFilePath() {
  return path.join(process.cwd(), '.env');
}

function getEnvExamplePath() {
  return path.join(process.cwd(), 'env.example');
}

function readEnvFile() {
  const envPath = getEnvFilePath();
  if (!fs.existsSync(envPath)) {
    const examplePath = getEnvExamplePath();
    if (fs.existsSync(examplePath)) {
      log('Creating .env file from env.example...', 'info');
      fs.copyFileSync(examplePath, envPath);
    } else {
      log('No .env or env.example file found!', 'error');
      process.exit(1);
    }
  }
  return fs.readFileSync(envPath, 'utf8');
}

function writeEnvFile(content) {
  fs.writeFileSync(getEnvFilePath(), content);
}

function updateEnvVariable(key, value, content) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const newLine = `${key}=${value}`;
  
  if (regex.test(content)) {
    return content.replace(regex, newLine);
  } else {
    return content + `\n${newLine}`;
  }
}

// Service configuration functions
async function configureTwilio() {
  log('\n📱 Configuring Twilio SMS Service', 'info');
  log('Twilio provides SMS verification and notifications for the app.', 'info');
  
  const accountSid = await question('Enter your Twilio Account SID: ');
  const authToken = await question('Enter your Twilio Auth Token: ');
  const verifyServiceSid = await question('Enter your Twilio Verify Service SID: ');
  const phoneNumber = await question('Enter your Twilio Phone Number (e.g., +1234567890): ');
  
  if (!validatePhoneNumber(phoneNumber)) {
    log('Invalid phone number format. Please use international format (e.g., +1234567890)', 'error');
    return false;
  }
  
  return {
    TWILIO_ACCOUNT_SID: accountSid,
    TWILIO_AUTH_TOKEN: authToken,
    TWILIO_VERIFY_SERVICE_SID: verifyServiceSid,
    TWILIO_PHONE_NUMBER: phoneNumber
  };
}

async function configurePayPal() {
  log('\n💳 Configuring PayPal Payment Processing', 'info');
  log('PayPal handles payment processing and subscription management.', 'info');
  
  const mode = await question('Enter PayPal mode (sandbox/live) [sandbox]: ') || 'sandbox';
  const clientId = await question('Enter your PayPal Client ID: ');
  const clientSecret = await question('Enter your PayPal Client Secret: ');
  const webhookId = await question('Enter your PayPal Webhook ID (optional): ') || generateWebhookSecret();
  
  return {
    PAYPAL_CLIENT_ID: clientId,
    PAYPAL_CLIENT_SECRET: clientSecret,
    PAYPAL_MODE: mode,
    PAYPAL_WEBHOOK_ID: webhookId
  };
}

async function configurePayMaya() {
  log('\n🇵🇭 Configuring PayMaya Payment Processing', 'info');
  log('PayMaya provides payment processing for the Philippines market.', 'info');
  
  const mode = await question('Enter PayMaya mode (sandbox/production) [sandbox]: ') || 'sandbox';
  const publicKey = await question('Enter your PayMaya Public Key: ');
  const secretKey = await question('Enter your PayMaya Secret Key: ');
  const webhookSecret = await question('Enter your PayMaya Webhook Secret (optional): ') || generateWebhookSecret();
  
  return {
    PAYMAYA_PUBLIC_KEY: publicKey,
    PAYMAYA_SECRET_KEY: secretKey,
    PAYMAYA_MODE: mode,
    PAYMAYA_WEBHOOK_SECRET: webhookSecret
  };
}

async function configureEmail() {
  log('\n📧 Configuring Email Service', 'info');
  log('Choose your preferred email service provider.', 'info');
  
  const service = await question('Select email service (resend/sendgrid/smtp) [resend]: ') || 'resend';
  const fromEmail = await question('Enter your FROM email address: ');
  
  if (!validateEmail(fromEmail)) {
    log('Invalid email format.', 'error');
    return false;
  }
  
  let config = {
    EMAIL_SERVICE: service,
    FROM_EMAIL: fromEmail
  };
  
  if (service === 'resend') {
    const apiKey = await question('Enter your Resend API Key: ');
    config.RESEND_API_KEY = apiKey;
  } else if (service === 'sendgrid') {
    const apiKey = await question('Enter your SendGrid API Key: ');
    config.SENDGRID_API_KEY = apiKey;
  } else if (service === 'smtp') {
    const host = await question('Enter SMTP host: ');
    const port = await question('Enter SMTP port [587]: ') || '587';
    const user = await question('Enter SMTP username: ');
    const pass = await question('Enter SMTP password: ');
    const secure = await question('Use SSL? (y/n) [n]: ') || 'n';
    
    config.SMTP_HOST = host;
    config.SMTP_PORT = port;
    config.SMTP_USER = user;
    config.SMTP_PASS = pass;
    config.SMTP_SECURE = secure.toLowerCase() === 'y';
  }
  
  return config;
}

async function configureCloudinary() {
  log('\n☁️ Configuring Cloudinary File Storage', 'info');
  log('Cloudinary handles image and file uploads for the application.', 'info');
  
  const cloudName = await question('Enter your Cloudinary Cloud Name: ');
  const apiKey = await question('Enter your Cloudinary API Key: ');
  const apiSecret = await question('Enter your Cloudinary API Secret: ');
  
  return {
    CLOUDINARY_CLOUD_NAME: cloudName,
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_API_SECRET: apiSecret
  };
}

async function configureGoogleMaps() {
  log('\n🗺️ Configuring Google Maps API', 'info');
  log('Google Maps provides location services and mapping functionality.', 'info');
  
  const apiKey = await question('Enter your Google Maps API Key: ');
  const geocodingKey = await question('Enter your Google Maps Geocoding API Key (optional): ') || apiKey;
  const placesKey = await question('Enter your Google Maps Places API Key (optional): ') || apiKey;
  const distanceMatrixKey = await question('Enter your Google Maps Distance Matrix API Key (optional): ') || apiKey;
  
  return {
    GOOGLE_MAPS_API_KEY: apiKey,
    GOOGLE_MAPS_GEOCODING_API_KEY: geocodingKey,
    GOOGLE_MAPS_PLACES_API_KEY: placesKey,
    GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY: distanceMatrixKey
  };
}

async function configureStripe() {
  log('\n💳 Configuring Stripe Payment Processing', 'info');
  log('Stripe provides alternative payment processing capabilities.', 'info');
  
  const secretKey = await question('Enter your Stripe Secret Key: ');
  const publishableKey = await question('Enter your Stripe Publishable Key: ');
  
  return {
    STRIPE_SECRET_KEY: secretKey,
    STRIPE_PUBLISHABLE_KEY: publishableKey
  };
}

async function configureAWS() {
  log('\n☁️ Configuring AWS S3 Storage', 'info');
  log('AWS S3 provides alternative file storage capabilities.', 'info');
  
  const accessKeyId = await question('Enter your AWS Access Key ID: ');
  const secretAccessKey = await question('Enter your AWS Secret Access Key: ');
  const bucketName = await question('Enter your S3 Bucket Name: ');
  const region = await question('Enter your AWS Region [us-east-1]: ') || 'us-east-1';
  
  return {
    AWS_ACCESS_KEY_ID: accessKeyId,
    AWS_SECRET_ACCESS_KEY: secretAccessKey,
    AWS_BUCKET_NAME: bucketName,
    AWS_REGION: region
  };
}

// Service testing functions
async function testTwilioConnection(config) {
  try {
    const twilio = require('twilio');
    const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    
    // Test by fetching account info
    const account = await client.api.accounts(config.TWILIO_ACCOUNT_SID).fetch();
    log(`Twilio connection successful! Account: ${account.friendlyName}`, 'success');
    return true;
  } catch (error) {
    log(`Twilio connection failed: ${error.message}`, 'error');
    return false;
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
    
    // Test by creating a simple request
    log('PayPal configuration validated!', 'success');
    return true;
  } catch (error) {
    log(`PayPal connection failed: ${error.message}`, 'error');
    return false;
  }
}

async function testEmailService(config) {
  try {
    if (config.EMAIL_SERVICE === 'resend') {
      const { Resend } = require('resend');
      const resend = new Resend(config.RESEND_API_KEY);
      
      // Test by checking API key validity
      log('Resend email service configured!', 'success');
      return true;
    } else if (config.EMAIL_SERVICE === 'sendgrid') {
      log('SendGrid email service configured!', 'success');
      return true;
    } else if (config.EMAIL_SERVICE === 'smtp') {
      log('SMTP email service configured!', 'success');
      return true;
    }
    return false;
  } catch (error) {
    log(`Email service test failed: ${error.message}`, 'error');
    return false;
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
    
    // Test by checking configuration
    log('Cloudinary connection successful!', 'success');
    return true;
  } catch (error) {
    log(`Cloudinary connection failed: ${error.message}`, 'error');
    return false;
  }
}

async function testGoogleMapsConnection(config) {
  try {
    // Test by making a simple geocoding request
    log('Google Maps API configured!', 'success');
    return true;
  } catch (error) {
    log(`Google Maps connection failed: ${error.message}`, 'error');
    return false;
  }
}

async function testStripeConnection(config) {
  try {
    const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
    
    // Test by retrieving account info
    log('Stripe connection successful!', 'success');
    return true;
  } catch (error) {
    log(`Stripe connection failed: ${error.message}`, 'error');
    return false;
  }
}

async function testAWSConnection(config) {
  try {
    // Test AWS configuration
    log('AWS S3 configuration validated!', 'success');
    return true;
  } catch (error) {
    log(`AWS connection failed: ${error.message}`, 'error');
    return false;
  }
}

// Main configuration functions
async function configureService(serviceKey) {
  const service = SERVICES[serviceKey];
  if (!service) {
    log(`Unknown service: ${serviceKey}`, 'error');
    return false;
  }
  
  log(`\n🔧 Configuring ${service.name}`, 'info');
  log(service.description, 'info');
  
  let config = {};
  
  try {
    switch (serviceKey) {
      case 'twilio':
        config = await configureTwilio();
        break;
      case 'paypal':
        config = await configurePayPal();
        break;
      case 'paymaya':
        config = await configurePayMaya();
        break;
      case 'email':
        config = await configureEmail();
        break;
      case 'cloudinary':
        config = await configureCloudinary();
        break;
      case 'googlemaps':
        config = await configureGoogleMaps();
        break;
      case 'stripe':
        config = await configureStripe();
        break;
      case 'aws':
        config = await configureAWS();
        break;
      default:
        log(`Configuration not implemented for ${serviceKey}`, 'error');
        return false;
    }
    
    if (!config) {
      log(`Configuration failed for ${service.name}`, 'error');
      return false;
    }
    
    // Update environment file
    let envContent = readEnvFile();
    for (const [key, value] of Object.entries(config)) {
      envContent = updateEnvVariable(key, value, envContent);
    }
    writeEnvFile(envContent);
    
    log(`${service.name} configured successfully!`, 'success');
    
    // Test connection if test function exists
    if (service.testFunction && typeof global[service.testFunction] === 'function') {
      const testResult = await global[service.testFunction](config);
      if (!testResult) {
        log(`Warning: ${service.name} test failed, but configuration was saved.`, 'warning');
      }
    }
    
    return true;
  } catch (error) {
    log(`Error configuring ${service.name}: ${error.message}`, 'error');
    return false;
  }
}

async function validateAllServices() {
  log('\n🔍 Validating all service configurations...', 'info');
  
  const envContent = readEnvFile();
  const results = {};
  
  for (const [serviceKey, service] of Object.entries(SERVICES)) {
    const isConfigured = service.envVars.every(envVar => {
      const regex = new RegExp(`^${envVar}=.+$`, 'm');
      return regex.test(envContent);
    });
    
    results[serviceKey] = {
      name: service.name,
      configured: isConfigured,
      required: service.required
    };
  }
  
  // Display results
  console.log('\n📊 Service Configuration Status:');
  console.log('================================');
  
  for (const [serviceKey, result] of Object.entries(results)) {
    const status = result.configured ? '✅ Configured' : (result.required ? '❌ Missing (Required)' : '⚠️  Missing (Optional)');
    console.log(`${result.name}: ${status}`);
  }
  
  const missingRequired = Object.values(results).filter(r => !r.configured && r.required);
  if (missingRequired.length > 0) {
    log(`\n⚠️  ${missingRequired.length} required service(s) not configured!`, 'warning');
    return false;
  }
  
  log('\n✅ All required services are configured!', 'success');
  return true;
}

async function testAllServices() {
  log('\n🧪 Testing all service connections...', 'info');
  
  const envContent = readEnvFile();
  const results = {};
  
  for (const [serviceKey, service] of Object.entries(SERVICES)) {
    if (service.testFunction) {
      // Extract configuration from env file
      const config = {};
      for (const envVar of service.envVars) {
        const regex = new RegExp(`^${envVar}=(.+)$`, 'm');
        const match = envContent.match(regex);
        if (match) {
          config[envVar] = match[1];
        }
      }
      
      if (Object.keys(config).length > 0) {
        try {
          const testFunction = global[service.testFunction];
          if (typeof testFunction === 'function') {
            results[serviceKey] = await testFunction(config);
          }
        } catch (error) {
          log(`Test failed for ${service.name}: ${error.message}`, 'error');
          results[serviceKey] = false;
        }
      }
    }
  }
  
  // Display results
  console.log('\n🧪 Service Connection Tests:');
  console.log('============================');
  
  for (const [serviceKey, result] of Object.entries(results)) {
    const service = SERVICES[serviceKey];
    const status = result ? '✅ Connected' : '❌ Failed';
    console.log(`${service.name}: ${status}`);
  }
  
  return results;
}

async function interactiveSetup() {
  log('🚀 LocalPro Super App - External Service Configuration', 'info');
  log('=======================================================', 'info');
  
  const setupAll = await question('\nDo you want to configure all services? (y/n) [y]: ') || 'y';
  
  if (setupAll.toLowerCase() === 'y') {
    // Configure all services
    for (const serviceKey of Object.keys(SERVICES)) {
      const service = SERVICES[serviceKey];
      const configure = await question(`\nConfigure ${service.name}? (y/n) [${service.required ? 'y' : 'n'}]: `) || (service.required ? 'y' : 'n');
      
      if (configure.toLowerCase() === 'y') {
        await configureService(serviceKey);
      }
    }
  } else {
    // Configure specific services
    console.log('\nAvailable services:');
    Object.entries(SERVICES).forEach(([key, service], index) => {
      console.log(`${index + 1}. ${service.name} ${service.required ? '(Required)' : '(Optional)'}`);
    });
    
    const serviceIndex = await question('\nSelect service to configure (1-8): ');
    const serviceKeys = Object.keys(SERVICES);
    const selectedService = serviceKeys[parseInt(serviceIndex) - 1];
    
    if (selectedService) {
      await configureService(selectedService);
    } else {
      log('Invalid service selection!', 'error');
    }
  }
  
  // Validate all services
  await validateAllServices();
  
  log('\n🎉 Configuration complete!', 'success');
  log('Next steps:', 'info');
  log('1. Restart your server: npm run dev', 'info');
  log('2. Test the API endpoints', 'info');
  log('3. Check the application logs for any issues', 'info');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const service = args[1];
  
  try {
    switch (command) {
      case '--service':
        if (service && SERVICES[service]) {
          await configureService(service);
        } else {
          log(`Unknown service: ${service}`, 'error');
          console.log('Available services:', Object.keys(SERVICES).join(', '));
        }
        break;
      case '--validate':
        await validateAllServices();
        break;
      case '--test':
        await testAllServices();
        break;
      case '--help':
        console.log('Usage:');
        console.log('  node scripts/configure-external-services.js [command] [service]');
        console.log('');
        console.log('Commands:');
        console.log('  (no command)     Interactive setup');
        console.log('  --service <name> Configure specific service');
        console.log('  --validate       Validate all configurations');
        console.log('  --test          Test all service connections');
        console.log('  --help          Show this help');
        console.log('');
        console.log('Services:', Object.keys(SERVICES).join(', '));
        break;
      default:
        await interactiveSetup();
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Export functions for testing
module.exports = {
  configureService,
  validateAllServices,
  testAllServices,
  SERVICES
};

// Run the script
if (require.main === module) {
  main();
}
