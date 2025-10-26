#!/usr/bin/env node

/**
 * Twilio SMS Service Configuration Script
 * 
 * This script helps configure Twilio SMS service for the LocalPro Super App.
 * It sets up SMS verification and notification capabilities.
 * 
 * Usage:
 *   node scripts/setup-twilio.js
 *   node scripts/setup-twilio.js --test
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

function validatePhoneNumber(phone) {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
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

async function configureTwilio() {
  log('📱 Twilio SMS Service Configuration', 'info');
  log('====================================', 'info');
  
  console.log('\nTwilio provides SMS verification and notifications for the LocalPro Super App.');
  console.log('You\'ll need a Twilio account and the following credentials:');
  console.log('• Account SID');
  console.log('• Auth Token');
  console.log('• Verify Service SID');
  console.log('• Phone Number');
  
  console.log('\n📋 Setup Steps:');
  console.log('1. Sign up at https://www.twilio.com/');
  console.log('2. Get your Account SID and Auth Token from the Console Dashboard');
  console.log('3. Create a Verify Service at https://console.twilio.com/us1/develop/verify/services');
  console.log('4. Purchase a phone number at https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
  
  const accountSid = await question('\nEnter your Twilio Account SID: ');
  const authToken = await question('Enter your Twilio Auth Token: ');
  const verifyServiceSid = await question('Enter your Twilio Verify Service SID: ');
  const phoneNumber = await question('Enter your Twilio Phone Number (e.g., +1234567890): ');
  
  if (!validatePhoneNumber(phoneNumber)) {
    log('Invalid phone number format. Please use international format (e.g., +1234567890)', 'error');
    return false;
  }
  
  // Update environment file
  let envContent = readEnvFile();
  envContent = updateEnvVariable('TWILIO_ACCOUNT_SID', accountSid, envContent);
  envContent = updateEnvVariable('TWILIO_AUTH_TOKEN', authToken, envContent);
  envContent = updateEnvVariable('TWILIO_VERIFY_SERVICE_SID', verifyServiceSid, envContent);
  envContent = updateEnvVariable('TWILIO_PHONE_NUMBER', phoneNumber, envContent);
  
  writeEnvFile(envContent);
  
  log('Twilio configuration saved successfully!', 'success');
  
  return {
    TWILIO_ACCOUNT_SID: accountSid,
    TWILIO_AUTH_TOKEN: authToken,
    TWILIO_VERIFY_SERVICE_SID: verifyServiceSid,
    TWILIO_PHONE_NUMBER: phoneNumber
  };
}

async function testTwilioConnection(config) {
  try {
    const twilio = require('twilio');
    const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    
    // Test by fetching account info
    const account = await client.api.accounts(config.TWILIO_ACCOUNT_SID).fetch();
    log(`Twilio connection successful!`, 'success');
    log(`Account: ${account.friendlyName}`, 'info');
    log(`Status: ${account.status}`, 'info');
    
    // Test Verify service
    try {
      const verifyService = await client.verify.v2.services(config.TWILIO_VERIFY_SERVICE_SID).fetch();
      log(`Verify Service: ${verifyService.friendlyName}`, 'info');
    } catch (error) {
      log(`Warning: Could not verify Verify Service: ${error.message}`, 'warning');
    }
    
    return true;
  } catch (error) {
    log(`Twilio connection failed: ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    if (command === '--test') {
      // Test existing configuration
      log('🧪 Testing Twilio Connection...', 'info');
      
      const envContent = readEnvFile();
      const config = {
        TWILIO_ACCOUNT_SID: envContent.match(/^TWILIO_ACCOUNT_SID=(.+)$/m)?.[1],
        TWILIO_AUTH_TOKEN: envContent.match(/^TWILIO_AUTH_TOKEN=(.+)$/m)?.[1],
        TWILIO_VERIFY_SERVICE_SID: envContent.match(/^TWILIO_VERIFY_SERVICE_SID=(.+)$/m)?.[1],
        TWILIO_PHONE_NUMBER: envContent.match(/^TWILIO_PHONE_NUMBER=(.+)$/m)?.[1]
      };
      
      if (!config.TWILIO_ACCOUNT_SID) {
        log('Twilio not configured. Run without --test to configure.', 'error');
        process.exit(1);
      }
      
      await testTwilioConnection(config);
    } else {
      // Configure Twilio
      const config = await configureTwilio();
      
      if (config) {
        const testConnection = await question('\nTest Twilio connection? (y/n) [y]: ') || 'y';
        if (testConnection.toLowerCase() === 'y') {
          await testTwilioConnection(config);
        }
        
        log('\n🎉 Twilio setup complete!', 'success');
        log('Next steps:', 'info');
        log('1. Restart your server: npm run dev', 'info');
        log('2. Test SMS verification in your app', 'info');
        log('3. Check Twilio console for usage and billing', 'info');
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

module.exports = { configureTwilio, testTwilioConnection };
