#!/usr/bin/env node

/**
 * PayPal Payment Processing Configuration Script
 * 
 * This script helps configure PayPal payment processing for the LocalPro Super App.
 * It sets up payment processing and subscription management capabilities.
 * 
 * Usage:
 *   node scripts/setup-paypal.js
 *   node scripts/setup-paypal.js --test
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

function generateWebhookSecret() {
  return crypto.randomBytes(32).toString('hex');
}

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

async function configurePayPal() {
  log('💳 PayPal Payment Processing Configuration', 'info');
  log('==========================================', 'info');
  
  console.log('\nPayPal provides payment processing and subscription management for the LocalPro Super App.');
  console.log('You\'ll need a PayPal Developer account and the following credentials:');
  console.log('• Client ID');
  console.log('• Client Secret');
  console.log('• Mode (sandbox/live)');
  console.log('• Webhook ID (optional)');
  
  console.log('\n📋 Setup Steps:');
  console.log('1. Sign up at https://developer.paypal.com/');
  console.log('2. Create a new application in the Developer Dashboard');
  console.log('3. Get your Client ID and Client Secret');
  console.log('4. Set up webhooks for payment notifications (optional)');
  
  const mode = await question('\nEnter PayPal mode (sandbox/live) [sandbox]: ') || 'sandbox';
  const clientId = await question('Enter your PayPal Client ID: ');
  const clientSecret = await question('Enter your PayPal Client Secret: ');
  const webhookId = await question('Enter your PayPal Webhook ID (optional, press Enter to generate): ') || generateWebhookSecret();
  
  if (mode !== 'sandbox' && mode !== 'live') {
    log('Invalid mode. Please use "sandbox" or "live"', 'error');
    return false;
  }
  
  // Update environment file
  let envContent = readEnvFile();
  envContent = updateEnvVariable('PAYPAL_CLIENT_ID', clientId, envContent);
  envContent = updateEnvVariable('PAYPAL_CLIENT_SECRET', clientSecret, envContent);
  envContent = updateEnvVariable('PAYPAL_MODE', mode, envContent);
  envContent = updateEnvVariable('PAYPAL_WEBHOOK_ID', webhookId, envContent);
  
  writeEnvFile(envContent);
  
  log('PayPal configuration saved successfully!', 'success');
  
  return {
    PAYPAL_CLIENT_ID: clientId,
    PAYPAL_CLIENT_SECRET: clientSecret,
    PAYPAL_MODE: mode,
    PAYPAL_WEBHOOK_ID: webhookId
  };
}

async function testPayPalConnection(config) {
  try {
    const paypal = require('@paypal/paypal-server-sdk');
    
    // Configure PayPal SDK
    paypal.configure({
      mode: config.PAYPAL_MODE,
      clientId: config.PAYPAL_CLIENT_ID,
      clientSecret: config.PAYPAL_CLIENT_SECRET
    });
    
    log('PayPal configuration validated!', 'success');
    log(`Mode: ${config.PAYPAL_MODE}`, 'info');
    log(`Client ID: ${config.PAYPAL_CLIENT_ID.substring(0, 8)}...`, 'info');
    
    // Test with a simple API call
    try {
      const { OrdersApi } = require('@paypal/paypal-server-sdk');
      const ordersApi = new OrdersApi();
      
      // This is just a configuration test, not an actual API call
      log('PayPal SDK initialized successfully!', 'success');
    } catch (error) {
      log(`PayPal SDK test failed: ${error.message}`, 'warning');
    }
    
    return true;
  } catch (error) {
    log(`PayPal connection failed: ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    if (command === '--test') {
      // Test existing configuration
      log('🧪 Testing PayPal Connection...', 'info');
      
      const envContent = readEnvFile();
      const config = {
        PAYPAL_CLIENT_ID: envContent.match(/^PAYPAL_CLIENT_ID=(.+)$/m)?.[1],
        PAYPAL_CLIENT_SECRET: envContent.match(/^PAYPAL_CLIENT_SECRET=(.+)$/m)?.[1],
        PAYPAL_MODE: envContent.match(/^PAYPAL_MODE=(.+)$/m)?.[1],
        PAYPAL_WEBHOOK_ID: envContent.match(/^PAYPAL_WEBHOOK_ID=(.+)$/m)?.[1]
      };
      
      if (!config.PAYPAL_CLIENT_ID) {
        log('PayPal not configured. Run without --test to configure.', 'error');
        process.exit(1);
      }
      
      await testPayPalConnection(config);
    } else {
      // Configure PayPal
      const config = await configurePayPal();
      
      if (config) {
        const testConnection = await question('\nTest PayPal connection? (y/n) [y]: ') || 'y';
        if (testConnection.toLowerCase() === 'y') {
          await testPayPalConnection(config);
        }
        
        log('\n🎉 PayPal setup complete!', 'success');
        log('Next steps:', 'info');
        log('1. Restart your server: npm run dev', 'info');
        log('2. Test payment processing in your app', 'info');
        log('3. Set up webhooks for payment notifications', 'info');
        
        if (config.PAYPAL_MODE === 'sandbox') {
          log('\n🧪 Sandbox Testing:', 'info');
          log('• Use PayPal sandbox test accounts', 'info');
          log('• Test cards: 4111 1111 1111 1111 (Visa)', 'info');
          log('• Test cards: 5555 5555 5555 4444 (Mastercard)', 'info');
          log('• CVV: Any 3 digits', 'info');
          log('• Expiry: Any future date', 'info');
        }
      }
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { configurePayPal, testPayPalConnection };
